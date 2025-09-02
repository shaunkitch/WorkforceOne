import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    console.log('Testing getActiveUsersPositions direct implementation...')
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    console.log('Looking for GPS data after:', thirtyMinutesAgo)
    
    const { data, error } = await supabaseAdmin
      .from('gps_tracking')
      .select(`
        user_id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        battery_level,
        timestamp,
        users:user_id (
          first_name,
          last_name
        )
      `)
      .gte('timestamp', thirtyMinutesAgo)
      .order('timestamp', { ascending: false })

    console.log('Query result:', { data, error, count: data?.length })

    if (error) {
      console.error('Database error:', error)
      // If table doesn't exist, return empty but successful response
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: true,
          count: 0,
          positions: [],
          message: 'GPS tracking table not found - no active positions available'
        })
      }
      return NextResponse.json({
        success: false,
        error: error?.message || 'Database error',
        positions: []
      })
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        count: 0,
        positions: [],
        message: 'No GPS data found'
      })
    }

    // Group by user_id and get latest position
    const userPositions = new Map()

    data.forEach(item => {
      if (!userPositions.has(item.user_id) || 
          new Date(item.timestamp) > new Date(userPositions.get(item.user_id).timestamp)) {
        userPositions.set(item.user_id, item)
      }
    })

    const positions = Array.from(userPositions.values()).map(item => ({
      userId: item.user_id,
      userName: `${item.users?.first_name || 'Unknown'} ${item.users?.last_name || 'User'}`,
      position: {
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        altitude: item.altitude,
        speed: item.speed,
        heading: item.heading,
        timestamp: item.timestamp
      },
      batteryLevel: item.battery_level
    }))
    
    console.log('Final positions:', positions)
    
    return NextResponse.json({
      success: true,
      count: positions.length,
      positions
    })
  } catch (error) {
    console.error('Error in GET /api/gps/active:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      positions: []
    }, { status: 500 })
  }
}