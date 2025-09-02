import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

// POST - Record checkpoint visit from mobile app
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { 
      patrol_id, 
      location_id, 
      guard_id, 
      verification_method, 
      verification_data, 
      latitude, 
      longitude, 
      photos, 
      notes 
    } = body

    console.log('[Mobile Checkpoint] Recording visit:', { 
      patrol_id, 
      location_id, 
      guard_id, 
      verification_method 
    })

    // Validate required fields
    if (!patrol_id || !location_id || !guard_id || !verification_method) {
      return NextResponse.json({ 
        error: 'Missing required fields: patrol_id, location_id, guard_id, verification_method' 
      }, { status: 400 })
    }

    // Verify patrol exists and belongs to guard
    const { data: patrol, error: patrolError } = await supabaseAdmin
      .from('patrols')
      .select('id, organization_id, status, checkpoints_completed')
      .eq('id', patrol_id)
      .eq('guard_id', guard_id)
      .single()

    if (patrolError || !patrol) {
      return NextResponse.json({ 
        error: 'Patrol not found or does not belong to guard' 
      }, { status: 404 })
    }

    if (patrol.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Patrol is not in progress' 
      }, { status: 400 })
    }

    // Check for duplicate visits within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { data: recentVisit } = await supabaseAdmin
      .from('checkpoint_visits')
      .select('id')
      .eq('patrol_id', patrol_id)
      .eq('location_id', location_id)
      .gte('visited_at', fiveMinutesAgo.toISOString())
      .maybeSingle()

    if (recentVisit) {
      return NextResponse.json({ 
        error: 'Checkpoint already visited within the last 5 minutes' 
      }, { status: 409 })
    }

    // Record the checkpoint visit
    const { data: visit, error: visitError } = await supabaseAdmin
      .from('checkpoint_visits')
      .insert({
        patrol_id,
        location_id,
        guard_id,
        visited_at: new Date().toISOString(),
        verification_method,
        verification_data,
        latitude,
        longitude,
        photos: photos || [],
        notes: notes || null
      })
      .select(`
        *,
        location:location_id (name, address)
      `)
      .single()

    if (visitError) {
      console.error('Error recording checkpoint visit:', visitError)
      return NextResponse.json({ 
        error: 'Failed to record checkpoint visit' 
      }, { status: 500 })
    }

    // Update patrol checkpoint count
    const newCompletedCount = patrol.checkpoints_completed + 1
    const { error: updateError } = await supabaseAdmin
      .from('patrols')
      .update({ 
        checkpoints_completed: newCompletedCount
      })
      .eq('id', patrol_id)

    if (updateError) {
      console.error('Error updating patrol:', updateError)
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        organization_id: patrol.organization_id,
        user_id: guard_id,
        module: 'guard',
        action: 'checkpoint_visited',
        entity_type: 'checkpoint_visit',
        entity_id: visit.id,
        location_id,
        latitude,
        longitude,
        metadata: {
          patrol_id,
          verification_method,
          verification_data
        }
      })

    console.log('[Mobile Checkpoint] Success:', visit.id)

    const response = NextResponse.json({
      success: true,
      visit,
      message: 'Checkpoint visit recorded successfully'
    })
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response

  } catch (error) {
    console.error('[Mobile Checkpoint] Error:', error)
    const response = NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
    
    // Add CORS headers to error responses too
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  }
}