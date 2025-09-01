import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { recordId, userId, qrCode, action, timestamp, location, deviceInfo } = await request.json()

    console.log('[Offline Sync] Processing record:', { recordId, userId, action, timestamp })

    // Validate required fields
    if (!recordId || !userId || !qrCode || !action || !timestamp || !location) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Check if this offline record was already synced
    const { data: existingRecord } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('offline_record_id', recordId)
      .single()

    if (existingRecord) {
      return NextResponse.json({ 
        success: true, 
        message: 'Record already synced',
        attendanceId: existingRecord.id
      })
    }

    // Validate QR code exists
    const { data: qrData, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('code', qrCode)
      .eq('is_active', true)
      .single()

    if (qrError || !qrData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code'
      }, { status: 400 })
    }

    // Check for duplicate attendance within short time window (5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { data: recentRecord } = await supabaseAdmin
      .from('attendance_records')
      .select('id, action')
      .eq('user_id', userId)
      .eq('qr_code', qrCode)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (recentRecord) {
      return NextResponse.json({
        success: false,
        error: `Duplicate ${action} detected within 5 minutes`
      }, { status: 409 })
    }

    // Create attendance record with offline metadata
    const { data: attendanceRecord, error: attendanceError } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        user_id: userId,
        qr_code: qrCode,
        action,
        location_lat: location.lat,
        location_lng: location.lng,
        location_accuracy: location.accuracy,
        device_info: deviceInfo,
        offline_record_id: recordId,
        created_at: timestamp,
        metadata: {
          source: 'offline_sync',
          originalTimestamp: timestamp,
          syncTimestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (attendanceError) {
      console.error('[Offline Sync] Database error:', attendanceError)
      return NextResponse.json({
        success: false,
        error: attendanceError.message
      }, { status: 500 })
    }

    // Update QR code last used timestamp
    await supabaseAdmin
      .from('qr_codes')
      .update({ last_used: new Date().toISOString() })
      .eq('id', qrData.id)

    console.log('[Offline Sync] Record synced successfully:', attendanceRecord.id)

    return NextResponse.json({
      success: true,
      attendanceId: attendanceRecord.id,
      message: 'Attendance record synced successfully'
    })

  } catch (error) {
    console.error('[Offline Sync] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during sync'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID required' 
      }, { status: 400 })
    }

    // Get recent synced records for this user
    const { data: records, error } = await supabaseAdmin
      .from('attendance_records')
      .select(`
        id,
        action,
        created_at,
        offline_record_id,
        metadata
      `)
      .eq('user_id', userId)
      .not('offline_record_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      syncedRecords: records || []
    })

  } catch (error) {
    console.error('[Offline Sync] Get records error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch sync history' 
    }, { status: 500 })
  }
}