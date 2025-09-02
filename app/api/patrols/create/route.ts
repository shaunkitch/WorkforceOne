import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createApiClient, unauthorizedResponse } from '@/lib/supabase/api'



export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const body = await request.json()
    const { organization_id, guard_id, route_id, start_time, total_checkpoints, notes, created_by } = body

    console.log('[Patrol Create] Request data:', { 
      hasOrgId: !!organization_id,
      hasGuardId: !!guard_id,
      hasCreatedBy: !!created_by 
    })

    // Validate required fields  
    if (!organization_id || !guard_id) {
      return NextResponse.json(
        { success: false, error: 'Organization ID and Guard ID are required' },
        { status: 400 }
      )
    }

    // Verify the organization and guard exist using admin client
    const { data: guardProfile, error: guardError } = await supabaseAdmin
      .from('users')
      .select('id, organization_id, first_name, last_name, email')
      .eq('id', guard_id)
      .eq('organization_id', organization_id)
      .single()

    if (guardError || !guardProfile) {
      console.log('[Patrol Create] Guard validation failed:', guardError)
      return NextResponse.json(
        { success: false, error: 'Invalid guard or organization' },
        { status: 400 }
      )
    }

    // Create patrol using service client to bypass RLS
    const patrolData = {
      organization_id,
      guard_id,
      route_id: route_id || null,
      start_time: start_time || null,
      status: 'scheduled',
      checkpoints_completed: 0,
      total_checkpoints: total_checkpoints || 0,
      notes: notes || null
    }
    
    console.log('[Patrol Create] Creating patrol with data:', patrolData)
    
    const { data, error } = await supabaseAdmin
      .from('patrols')
      .insert(patrolData)
      .select(`
        *,
        guard:guard_id (first_name, last_name, email),
        route:route_id (
          name,
          description,
          checkpoints,
          estimated_duration
        )
      `)
      .single()

    if (error) {
      console.error('[Patrol Create] Error creating patrol:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    console.log('[Patrol Create] Successfully created patrol:', data.id)

    // Log activity (if created_by is provided)
    if (created_by) {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: created_by,
          module: 'guard',
          action: 'patrol_created',
          entity_type: 'patrol',
          entity_id: data.id,
          metadata: {
            route_id: route_id,
            total_checkpoints: total_checkpoints,
            assigned_guard: guard_id
          }
        })
    }

    return NextResponse.json({
      success: true,
      patrol: data
    })

  } catch (error) {
    console.error('Patrol creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}