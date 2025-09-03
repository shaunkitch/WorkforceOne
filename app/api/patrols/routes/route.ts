import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch patrol routes for an organization
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const includeCheckpoints = searchParams.get('include_checkpoints') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('patrol_routes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    const { data: routes, error } = await query

    if (error) {
      console.error('Error fetching patrol routes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patrol routes', details: error.message },
        { status: 500 }
      )
    }

    // If include_checkpoints is requested, fetch location details for each route
    if (includeCheckpoints && routes) {
      const routesWithLocations = await Promise.all(
        routes.map(async (route: any) => {
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
      
      return NextResponse.json({ routes: routesWithLocations })
    }

    return NextResponse.json({ routes })
  } catch (error: any) {
    console.error('Error in GET /api/patrols/routes:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new patrol route
export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const body = await request.json()
    console.log('[Patrol Routes API] POST request body:', body)
    
    const {
      organization_id,
      name,
      description,
      checkpoints = [],
      estimated_duration,
      is_active = true,
      created_by
    } = body

    // Validate required fields
    if (!organization_id || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    if (checkpoints.length === 0) {
      return NextResponse.json(
        { error: 'At least one checkpoint is required' },
        { status: 400 }
      )
    }

    // Insert patrol route
    const routeData = {
      organization_id,
      name,
      description,
      checkpoints,
      estimated_duration: estimated_duration || 60,
      is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(created_by && { created_by })
    }

    console.log('[Patrol Routes API] Inserting route data:', routeData)

    const { data: route, error: routeError } = await supabaseAdmin
      .from('patrol_routes')
      .insert([routeData])
      .select()
      .single()

    if (routeError) {
      console.error('Error creating patrol route - Detailed error:', {
        message: routeError.message,
        details: routeError.details,
        hint: routeError.hint,
        code: routeError.code
      })
      return NextResponse.json(
        { error: 'Failed to create patrol route', details: routeError.message },
        { status: 500 }
      )
    }

    // Log the activity (only if created_by is provided)
    if (created_by) {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: created_by,
          module: 'guard',
          action: 'patrol_route_created',
          entity_type: 'patrol_route',
          entity_id: route.id,
          metadata: {
            route_name: name,
            checkpoint_count: checkpoints.length,
            estimated_duration
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      route 
    })
  } catch (error: any) {
    console.error('Error in POST /api/patrols/routes:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update an existing patrol route
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const body = await request.json()
    const {
      id,
      organization_id,
      name,
      description,
      checkpoints,
      estimated_duration,
      is_active,
      updated_by
    } = body

    if (!id || !organization_id) {
      return NextResponse.json(
        { error: 'Route ID and organization ID are required' },
        { status: 400 }
      )
    }

    const { data: route, error } = await supabaseAdmin
      .from('patrol_routes')
      .update({
        name,
        description,
        checkpoints,
        estimated_duration,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating patrol route:', error)
      return NextResponse.json(
        { error: 'Failed to update patrol route', details: error.message },
        { status: 500 }
      )
    }

    // Log the activity
    if (updated_by) {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: updated_by,
          module: 'guard',
          action: 'patrol_route_updated',
          entity_type: 'patrol_route',
          entity_id: route.id,
          metadata: {
            route_name: name,
            checkpoint_count: checkpoints?.length || 0
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      route 
    })
  } catch (error) {
    console.error('Error in PUT /api/patrols/routes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a patrol route
export async function DELETE(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organization_id')
    const deletedBy = searchParams.get('deleted_by')

    if (!id || !organizationId) {
      return NextResponse.json(
        { error: 'Route ID and organization ID are required' },
        { status: 400 }
      )
    }

    // First get the route details for logging
    const { data: existingRoute } = await supabaseAdmin
      .from('patrol_routes')
      .select('name')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    const { error } = await supabaseAdmin
      .from('patrol_routes')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting patrol route:', error)
      return NextResponse.json(
        { error: 'Failed to delete patrol route', details: error.message },
        { status: 500 }
      )
    }

    // Log the activity
    if (deletedBy && existingRoute) {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: deletedBy,
          module: 'guard',
          action: 'patrol_route_deleted',
          entity_type: 'patrol_route',
          entity_id: id,
          metadata: {
            route_name: existingRoute.name
          }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/patrols/routes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}