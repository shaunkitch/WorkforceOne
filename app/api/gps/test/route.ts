import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('Testing GPS tracking queries...')

    // Test basic gps_tracking table access
    const { data: gpsData, error: gpsError } = await supabaseAdmin
      .from('gps_tracking')
      .select('*')
      .limit(5)

    console.log('GPS data query result:', { gpsData, gpsError })

    // Test users table access
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .limit(5)

    console.log('Users data query result:', { usersData, usersError })

    // Test the complex query used by getActiveUsersPositions
    const { data: complexData, error: complexError } = await supabaseAdmin
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
      .gte('timestamp', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(5)

    console.log('Complex query result:', { complexData, complexError })

    return NextResponse.json({
      success: true,
      results: {
        gpsData: { count: gpsData?.length || 0, error: gpsError },
        usersData: { count: usersData?.length || 0, error: usersError },
        complexData: { count: complexData?.length || 0, error: complexError }
      }
    })

  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 })
  }
}