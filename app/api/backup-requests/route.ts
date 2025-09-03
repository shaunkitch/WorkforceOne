import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

// GET - Fetch active backup requests for admin portal
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get active backup requests with guard and location info
    const { data: backupRequests, error } = await supabaseAdmin
      .from('backup_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching backup requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch backup requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ backupRequests })
  } catch (error) {
    console.error('Error in GET /api/backup-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new backup request from mobile app
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      guard_id,
      organization_id,
      current_latitude,
      current_longitude,
      patrol_id,
      emergency_type = 'backup_request',
      notes
    } = body

    console.log('[Backup Request] Full request details:', {
      body: JSON.stringify(body),
      guard_id,
      organization_id,
      current_latitude,
      current_longitude,
      patrol_id,
      emergency_type,
      notes,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
      }
    })

    if (!guard_id || !organization_id) {
      return NextResponse.json(
        { error: 'Guard ID and organization ID are required' },
        { status: 400 }
      )
    }

    // Find closest checkpoint to guard's current location
    let closestCheckpoint = null
    if (current_latitude && current_longitude) {
      const { data: checkpoints } = await supabaseAdmin
        .from('locations')
        .select('id, name, address, latitude, longitude')
        .eq('organization_id', organization_id)
        .eq('location_type', 'checkpoint')

      if (checkpoints && checkpoints.length > 0) {
        let minDistance = Infinity
        for (const checkpoint of checkpoints) {
          if (checkpoint.latitude && checkpoint.longitude) {
            const distance = calculateDistance(
              current_latitude, current_longitude,
              checkpoint.latitude, checkpoint.longitude
            )
            if (distance < minDistance) {
              minDistance = distance
              closestCheckpoint = checkpoint
            }
          }
        }
      }
    }

    // Create backup request
    const { data: backupRequest, error } = await supabaseAdmin
      .from('backup_requests')
      .insert({
        guard_id,
        organization_id,
        patrol_id,
        emergency_type,
        status: 'active',
        current_latitude,
        current_longitude,
        closest_checkpoint_id: closestCheckpoint?.id,
        distance_to_checkpoint: closestCheckpoint ? Math.round(calculateDistance(
          current_latitude, current_longitude,
          closestCheckpoint.latitude, closestCheckpoint.longitude
        )) : null,
        notes,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating backup request:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        requestData: { guard_id, organization_id, patrol_id, emergency_type }
      })
      return NextResponse.json(
        { 
          error: 'Failed to create backup request', 
          details: error.message,
          code: error.code,
          hint: error.hint 
        },
        { status: 500 }
      )
    }

    // Log the activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        organization_id,
        user_id: guard_id,
        module: 'security',
        action: 'backup_requested',
        entity_type: 'backup_request',
        entity_id: backupRequest.id,
        metadata: {
          emergency_type,
          closest_checkpoint: closestCheckpoint?.name,
          patrol_id
        }
      })

    console.log('[Backup Request] Created successfully:', backupRequest.id)
    return NextResponse.json({ 
      success: true, 
      backupRequest,
      closestCheckpoint
    })

  } catch (error: any) {
    console.error('Error in POST /api/backup-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update backup request status (resolve, acknowledge, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      id,
      status,
      responded_by,
      response_time,
      resolution_notes
    } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (responded_by) updateData.responded_by = responded_by
    if (response_time) updateData.response_time = response_time
    if (resolution_notes) updateData.resolution_notes = resolution_notes

    const { data: backupRequest, error } = await supabaseAdmin
      .from('backup_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating backup request:', error)
      return NextResponse.json(
        { error: 'Failed to update backup request', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      backupRequest 
    })

  } catch (error: any) {
    console.error('Error in PUT /api/backup-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two coordinates (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}