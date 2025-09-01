import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No-op for API routes
          },
          remove(name: string, options: CookieOptions) {
            // No-op for API routes
          },
        },
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build query for shift_attendance
    let query = supabase
      .from('shift_attendance')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(limit)

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance records:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch records' },
        { status: 500 }
      )
    }

    // Format the records
    const records = data?.map(record => ({
      id: record.id,
      userId: record.user_id,
      userName: record.users ? `${record.users.first_name} ${record.users.last_name}` : 'Unknown',
      userEmail: record.users?.email,
      shiftType: record.shift_type,
      timestamp: record.timestamp,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      qrCodeId: record.qr_code_id,
      qrCodeType: record.qr_code_type,
      deviceInfo: record.device_info
    })) || []

    // Calculate statistics for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayRecords = records.filter(r => 
      new Date(r.timestamp) >= today
    )

    const statistics = {
      totalRecords: records.length,
      todayCheckIns: todayRecords.filter(r => r.shiftType === 'check_in').length,
      todayCheckOuts: todayRecords.filter(r => r.shiftType === 'check_out').length,
      uniqueUsersToday: new Set(todayRecords.map(r => r.userId)).size
    }

    return NextResponse.json({
      success: true,
      records,
      statistics,
      isAdmin: true
    })

  } catch (error) {
    console.error('Attendance records error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}