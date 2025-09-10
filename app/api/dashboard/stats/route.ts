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
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
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