import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

// GET - Get mobile patrol data (routes, active patrols, user info)
export async function GET(request: NextRequest) {
  try {
    console.log('[Mobile Patrol API] GET request received');
    const { searchParams } = new URL(request.url)
    const guardId = searchParams.get('guard_id')
    const organizationId = searchParams.get('organization_id')

    console.log('[Mobile Patrol API] Parameters:', { guardId, organizationId });

    if (!guardId || !organizationId) {
      return NextResponse.json(
        { error: 'Guard ID and Organization ID are required' },
        { status: 400 }
      )
    }

    // Get user profile
    console.log('[Mobile Patrol API] Fetching user profile...');
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, organization_id, first_name, last_name, email')
      .eq('id', guardId)
      .eq('organization_id', organizationId)
      .single()

    console.log('[Mobile Patrol API] User profile result:', { userError, hasProfile: !!userProfile });
    
    if (userError || !userProfile) {
      console.log('[Mobile Patrol API] User not found:', userError);
      return NextResponse.json(
        { error: 'User not found or invalid organization' },
        { status: 404 }
      )
    }

    // Get available patrol routes with locations
    console.log('[Mobile Patrol API] Fetching patrol routes...');
    const { data: routes, error: routesError } = await supabaseAdmin
      .from('patrol_routes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    console.log('[Mobile Patrol API] Routes result:', { routesError, routeCount: routes?.length || 0 });
    
    if (routesError) {
      console.error('[Mobile Patrol API] Error fetching routes:', routesError)
      return NextResponse.json(
        { error: 'Failed to fetch routes' },
        { status: 500 }
      )
    }

    // Fetch location details for each route
    console.log('[Mobile Patrol API] Fetching location details for routes...');
    const routesWithLocations = await Promise.all(
      (routes || []).map(async (route: any) => {
        if (route.checkpoints && route.checkpoints.length > 0) {
          const { data: locations } = await supabaseAdmin
            .from('locations')
            .select('id, name, address, latitude, longitude')
            .in('id', route.checkpoints)

          return {
            ...route,
            locations: locations || []
          }
        }
        return { ...route, locations: [] }
      })
    )
    
    console.log('[Mobile Patrol API] Locations fetched for all routes');

    // Check for active patrol
    console.log('[Mobile Patrol API] Checking for active patrol...');
    const { data: activePatrol, error: patrolError } = await supabaseAdmin
      .from('patrols')
      .select('*')
      .eq('guard_id', guardId)
      .eq('status', 'in_progress')
      .maybeSingle()

    console.log('[Mobile Patrol API] Active patrol result:', { patrolError, hasPatrol: !!activePatrol });
    
    if (patrolError) {
      console.error('[Mobile Patrol API] Error fetching active patrol:', patrolError)
      return NextResponse.json(
        { error: 'Failed to fetch active patrol' },
        { status: 500 }
      )
    }

    // If there's an active patrol, get visited checkpoints
    let visitedCheckpoints = []
    if (activePatrol) {
      console.log('[Mobile Patrol API] Fetching visited checkpoints for patrol:', activePatrol.id);
      const { data: visits, error: visitsError } = await supabaseAdmin
        .from('checkpoint_visits')
        .select('location_id')
        .eq('patrol_id', activePatrol.id)

      if (!visitsError && visits) {
        visitedCheckpoints = visits.map(v => v.location_id)
      }
      console.log('[Mobile Patrol API] Visited checkpoints:', visitedCheckpoints.length);
    }

    console.log('[Mobile Patrol API] Sending response...');
    const response = NextResponse.json({
      user: userProfile,
      routes: routesWithLocations,
      activePatrol,
      visitedCheckpoints
    })
    
    // Add CORS headers for mobile app
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response

  } catch (error) {
    console.error('[Mobile Patrol API] Unexpected error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
  }
}

// POST - Start a patrol or end a patrol
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, guard_id, organization_id, route_id, patrol_id, notes } = body

    if (!guard_id || !organization_id) {
      return NextResponse.json(
        { error: 'Guard ID and Organization ID are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    if (action === 'start') {
      // Start a new patrol
      if (!route_id) {
        return NextResponse.json(
          { error: 'Route ID is required to start patrol' },
          { status: 400 }
        )
      }

      // Get route info
      const { data: route, error: routeError } = await supabaseAdmin
        .from('patrol_routes')
        .select('id, name, checkpoints')
        .eq('id', route_id)
        .eq('organization_id', organization_id)
        .single()

      if (routeError || !route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        )
      }

      // Create new patrol
      const { data: patrol, error: createError } = await supabaseAdmin
        .from('patrols')
        .insert({
          organization_id,
          guard_id,
          route_id,
          status: 'in_progress',
          start_time: new Date().toISOString(),
          checkpoints_completed: 0,
          total_checkpoints: route.checkpoints.length
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating patrol:', createError)
        return NextResponse.json(
          { error: 'Failed to start patrol' },
          { status: 500 }
        )
      }

      // Log activity
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: guard_id,
          module: 'guard',
          action: 'patrol_started',
          entity_type: 'patrol',
          entity_id: patrol.id
        })

      const response = NextResponse.json({
        success: true,
        patrol
      })
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      
      return response

    } else if (action === 'end') {
      // End the patrol
      console.log('Ending patrol with:', { patrol_id, guard_id, organization_id })
      if (!patrol_id) {
        return NextResponse.json(
          { error: 'Patrol ID is required to end patrol' },
          { status: 400 }
        )
      }

      const { data: patrol, error: updateError } = await supabaseAdmin
        .from('patrols')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          notes
        })
        .eq('id', patrol_id)
        .eq('guard_id', guard_id)
        .eq('organization_id', organization_id)
        .select()
        .single()

      if (updateError) {
        console.error('Error ending patrol:', updateError)
        console.error('Update details:', { patrol_id, guard_id, organization_id })
        const response = NextResponse.json(
          { error: 'Failed to end patrol', details: updateError.message },
          { status: 500 }
        )
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
        return response
      }

      // Log activity
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: guard_id,
          module: 'guard',
          action: 'patrol_completed',
          entity_type: 'patrol',
          entity_id: patrol.id,
          metadata: {
            checkpoints_completed: patrol.checkpoints_completed,
            total_checkpoints: patrol.total_checkpoints,
            notes
          }
        })

      const response = NextResponse.json({
        success: true,
        patrol
      })
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      
      return response
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "end"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in mobile patrol POST:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    const response = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  }
}