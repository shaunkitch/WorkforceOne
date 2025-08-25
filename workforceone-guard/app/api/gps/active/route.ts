import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET() {
  try {
    console.log('Testing getActiveUsersPositions direct implementation...')
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    console.log('Looking for GPS data after:', thirtyMinutesAgo)
    
    const { data, error } = await supabase
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

    if (error || !data) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error?.message || 'No data found',
        positions: []
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