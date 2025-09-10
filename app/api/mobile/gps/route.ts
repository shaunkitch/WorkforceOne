import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint receives GPS data from the mobile app
export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const data = await request.json()
    console.log('Mobile GPS data received:', data)
    
    // Validate required fields
    const { user_id, latitude, longitude, timestamp, battery_level } = data
    
    if (!user_id || !latitude || !longitude) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: user_id, latitude, longitude'
      }, { status: 400 })
    }
    
    // Insert GPS tracking data
    const { error } = await supabaseAdmin
      .from('gps_tracking')
      .insert({
        user_id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: data.accuracy || null,
        altitude: data.altitude || null,
        speed: data.speed || null,
        heading: data.heading || null,
        battery_level: battery_level || null,
        timestamp: timestamp || new Date().toISOString()
      })
    
    if (error) {
      console.error('Database error inserting GPS data:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save GPS data',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('GPS data saved successfully for user:', user_id)
    
    return NextResponse.json({
      success: true,
      message: 'GPS data received and saved'
    })
  } catch (error) {
    console.error('Error in POST /api/mobile/gps:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// This endpoint is called by the mobile app to send patrol status updates
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const data = await request.json()
    console.log('Mobile patrol status update:', data)
    
    const { patrol_id, status, user_id } = data
    
    if (!patrol_id || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: patrol_id, status'
      }, { status: 400 })
    }
    
    // Update patrol status
    const { error } = await supabaseAdmin
      .from('patrols')
      .update({
        status: status,
        ...(status === 'active' && { start_time: new Date().toISOString() }),
        ...(status === 'completed' && { end_time: new Date().toISOString() })
      })
      .eq('id', patrol_id)
      .eq('guard_id', user_id) // Security: only allow user to update their own patrols
    
    if (error) {
      console.error('Database error updating patrol status:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update patrol status',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Patrol status updated successfully:', { patrol_id, status })
    
    return NextResponse.json({
      success: true,
      message: 'Patrol status updated'
    })
  } catch (error) {
    console.error('Error in PUT /api/mobile/gps:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow CORS for mobile app
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}