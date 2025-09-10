import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    console.log('=== GPS DEBUG API ===')
    
    // Check if tables exist and get recent data
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    console.log('Time ranges:')
    console.log('- 30 minutes ago:', thirtyMinutesAgo)
    console.log('- 24 hours ago:', oneDayAgo)
    
    // Check users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .limit(10)
    
    console.log('Users table:', { users: users?.length, error: usersError })
    
    // Check patrols table structure first
    const { data: patrolsAll, error: patrolsError } = await supabaseAdmin
      .from('patrols')
      .select('*')
      .limit(5)
    
    // Try different date columns
    const { data: patrolsRecent, error: patrolsRecentError } = await supabaseAdmin
      .from('patrols')
      .select('*')
      .limit(10)
    
    console.log('Patrols table structure:', { patrols: patrolsAll?.length, error: patrolsError, data: patrolsAll })
    console.log('Recent patrols:', { patrols: patrolsRecent?.length, error: patrolsRecentError, data: patrolsRecent })
    
    // Check checkpoint_visits table
    const { data: checkpointVisits, error: checkpointError } = await supabaseAdmin
      .from('checkpoint_visits')
      .select('guard_id, latitude, longitude, visited_at, patrol_id')
      .gte('visited_at', oneDayAgo)
      .order('visited_at', { ascending: false })
      .limit(10)
    
    console.log('Recent checkpoint visits:', { visits: checkpointVisits?.length, error: checkpointError, data: checkpointVisits })
    
    // Check gps_tracking table
    const { data: gpsTracking, error: gpsError } = await supabaseAdmin
      .from('gps_tracking')
      .select('user_id, latitude, longitude, timestamp, battery_level')
      .gte('timestamp', oneDayAgo)
      .order('timestamp', { ascending: false })
      .limit(10)
    
    console.log('Recent GPS tracking:', { gps: gpsTracking?.length, error: gpsError, data: gpsTracking })
    
    // Look specifically for Gawie Charcoal
    const { data: gawie, error: gawieError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .or('first_name.ilike.%gawie%,last_name.ilike.%charcoal%,email.ilike.%gawie%')
    
    console.log('Gawie Charcoal search:', { gawie, error: gawieError })
    
    // If we found Gawie, check his patrols
    let gawiePatrols = null, gawieGPS = null
    if (gawie && gawie.length > 0) {
      const gawieId = gawie[0].id
      
      const { data: patrolsData, error: patrolsErr } = await supabaseAdmin
        .from('patrols')
        .select('*')
        .eq('guard_id', gawieId)
        .gte('started_at', oneDayAgo)
        .order('started_at', { ascending: false })
      
      gawiePatrols = { data: patrolsData, error: patrolsErr }
      
      const { data: gpsData, error: gpsErr } = await supabaseAdmin
        .from('gps_tracking')
        .select('*')
        .eq('user_id', gawieId)
        .gte('timestamp', oneDayAgo)
        .order('timestamp', { ascending: false })
        
      gawieGPS = { data: gpsData, error: gpsErr }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        timeRanges: {
          thirtyMinutesAgo,
          oneDayAgo
        },
        tables: {
          users: { count: users?.length || 0, error: usersError },
          patrols: { 
            structure: { count: patrolsAll?.length || 0, error: patrolsError, data: patrolsAll },
            recent: { count: patrolsRecent?.length || 0, error: patrolsRecentError, data: patrolsRecent }
          },
          checkpointVisits: { count: checkpointVisits?.length || 0, error: checkpointError, data: checkpointVisits },
          gpsTracking: { count: gpsTracking?.length || 0, error: gpsError, data: gpsTracking }
        },
        gawie: {
          user: gawie,
          patrols: gawiePatrols,
          gpsTracking: gawieGPS
        }
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}