import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    console.log('Fetching live patrol positions from checkpoint visits...')
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    console.log('Looking for patrol activity after:', thirtyMinutesAgo)
    
    // Get recent checkpoint visits (guards on patrol)
    const { data: checkpointData, error: checkpointError } = await supabaseAdmin
      .from('checkpoint_visits')
      .select(`
        guard_id,
        latitude,
        longitude,
        visited_at,
        location_id,
        patrol_id,
        users:guard_id (
          first_name,
          last_name
        ),
        locations:location_id (
          name
        ),
        patrols:patrol_id (
          status,
          start_time
        )
      `)
      .gte('visited_at', thirtyMinutesAgo)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('visited_at', { ascending: false })

    console.log('Checkpoint visits query result:', { checkpointData, checkpointError, count: checkpointData?.length })

    // Also get recent GPS tracking data for guards not at checkpoints
    const { data: gpsData, error: gpsError } = await supabaseAdmin
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

    console.log('GPS tracking query result:', { gpsData, gpsError, count: gpsData?.length })

    // Combine both data sources
    let allData = []
    
    // Add checkpoint visit data
    if (checkpointData) {
      checkpointData.forEach(visit => {
        allData.push({
          user_id: visit.guard_id,
          latitude: visit.latitude,
          longitude: visit.longitude,
          timestamp: visit.visited_at,
          source: 'checkpoint_visit',
          location_name: visit.locations?.name,
          patrol_status: visit.patrols?.status,
          users: visit.users
        })
      })
    }

    // Add GPS tracking data
    if (gpsData) {
      gpsData.forEach(gps => {
        allData.push({
          user_id: gps.user_id,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          altitude: gps.altitude,
          speed: gps.speed,
          heading: gps.heading,
          battery_level: gps.battery_level,
          timestamp: gps.timestamp,
          source: 'gps_tracking',
          users: gps.users
        })
      })
    }

    const error = checkpointError || gpsError

    console.log('Combined data result:', { allData, error, count: allData?.length })

    if (error) {
      console.error('Database error:', error)
      // If table doesn't exist, return empty but successful response
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: true,
          count: 0,
          positions: [],
          message: 'Patrol tracking tables not found - no active positions available'
        })
      }
      return NextResponse.json({
        success: false,
        error: error?.message || 'Database error',
        positions: []
      })
    }

    if (!allData || allData.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        positions: [],
        message: 'No active patrol positions found'
      })
    }

    // Group by user_id and get latest position from either source
    const userPositions = new Map()

    allData.forEach(item => {
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
        accuracy: item.accuracy || null,
        altitude: item.altitude || null,
        speed: item.speed || null,
        heading: item.heading || null,
        timestamp: item.timestamp
      },
      batteryLevel: item.battery_level || null,
      source: item.source,
      locationName: item.location_name,
      patrolStatus: item.patrol_status
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