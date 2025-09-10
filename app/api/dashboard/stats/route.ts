import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    // Get active patrols count
    const { data: activePatrols, error: patrolsError } = await supabaseAdmin
      .from('patrols')
      .select('id')
      .eq('status', 'active')

    if (patrolsError) throw patrolsError

    // Get open incidents count
    const { data: openIncidents, error: incidentsError } = await supabaseAdmin
      .from('incidents')
      .select('id')
      .in('status', ['open', 'investigating', 'pending'])

    if (incidentsError) throw incidentsError

    // Get guards on duty count (users with recent GPS tracking in last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: guardsOnDuty, error: guardsError } = await supabaseAdmin
      .from('gps_tracking')
      .select('user_id')
      .gte('timestamp', twoHoursAgo)

    if (guardsError) throw guardsError

    // Count unique guards
    const uniqueGuards = [...new Set(guardsOnDuty?.map(g => g.user_id) || [])]

    // Get checkpoint visits count for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: checkpoints, error: checkpointsError } = await supabaseAdmin
      .from('checkpoint_visits')
      .select('id')
      .gte('visited_at', today.toISOString())
      .not('visited_at', 'is', null)

    if (checkpointsError) throw checkpointsError

    // Get recent activity (checkpoint visits)
    const { data: recentPatrolEvents, error: recentError } = await supabaseAdmin
      .from('checkpoint_visits')
      .select(`
        id,
        visited_at,
        location:locations(name),
        patrol:patrols(
          guard:users(first_name, last_name)
        )
      `)
      .not('visited_at', 'is', null)
      .order('visited_at', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    // Get recent incidents
    const { data: recentIncidents, error: recentIncidentsError } = await supabaseAdmin
      .from('incidents')
      .select(`
        id,
        title,
        status,
        severity,
        created_at,
        location:locations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(3)

    if (recentIncidentsError) throw recentIncidentsError

    // Get detailed incidents for admin panel
    const { data: detailedIncidents, error: detailedIncidentsError } = await supabaseAdmin
      .from('incidents')
      .select(`
        id,
        title,
        description,
        status,
        severity,
        created_at,
        location:locations(name),
        reported_by:users!incidents_reported_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (detailedIncidentsError) throw detailedIncidentsError

    // Analytics data - last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Get completed patrols in last 24 hours
    const { data: completedPatrols24h, error: completedPatrolsError } = await supabaseAdmin
      .from('patrols')
      .select('id')
      .eq('status', 'completed')
      .gte('end_time', yesterday)

    if (completedPatrolsError) throw completedPatrolsError

    // Get total scheduled patrols in last 24 hours
    const { data: scheduledPatrols24h, error: scheduledPatrolsError } = await supabaseAdmin
      .from('patrols')
      .select('id')
      .gte('created_at', yesterday)

    if (scheduledPatrolsError) throw scheduledPatrolsError

    // Get resolved incidents in last 24 hours
    const { data: resolvedIncidents24h, error: resolvedIncidentsError } = await supabaseAdmin
      .from('incidents')
      .select('id')
      .eq('status', 'resolved')
      .gte('resolved_at', yesterday)

    if (resolvedIncidentsError) throw resolvedIncidentsError

    // Get total incidents in last 24 hours
    const { data: totalIncidents24h, error: totalIncidentsError } = await supabaseAdmin
      .from('incidents')
      .select('id')
      .gte('created_at', yesterday)

    if (totalIncidentsError) throw totalIncidentsError

    // Calculate average response time (mock for now)
    const avgResponseTime = "3.8 min"

    const stats = {
      activePatrols: activePatrols?.length || 0,
      openIncidents: openIncidents?.length || 0,
      guardsOnDuty: uniqueGuards.length,
      checkpointsToday: checkpoints?.length || 0,
      averageResponseTime: avgResponseTime,
      systemStatus: 'operational',
      recentActivity: [
        ...recentPatrolEvents?.map(event => ({
          type: 'checkpoint',
          message: `${event.patrol?.guard?.first_name || 'Guard'} ${event.patrol?.guard?.last_name || ''} completed checkpoint at ${event.location?.name || 'Unknown location'}`,
          timestamp: event.visited_at,
          status: 'completed'
        })) || [],
        ...recentIncidents?.map(incident => ({
          type: 'incident',
          message: `${incident.severity?.toUpperCase()} incident: ${incident.title} at ${incident.location?.name || 'Unknown location'}`,
          timestamp: incident.created_at,
          status: incident.status
        })) || []
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5),
      detailedIncidents: detailedIncidents || [],
      analytics: {
        patrolsCompleted: completedPatrols24h?.length || 0,
        totalPatrols: scheduledPatrols24h?.length || 0,
        incidentsResolved: resolvedIncidents24h?.length || 0,
        totalIncidents: totalIncidents24h?.length || 0,
        checkpointCoverage: Math.min(95, Math.round(((checkpoints?.length || 0) / Math.max(1, (scheduledPatrols24h?.length || 1) * 3)) * 100)) // Assume 3 checkpoints per patrol on average
      }
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}