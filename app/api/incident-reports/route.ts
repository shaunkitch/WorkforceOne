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

// GET - Fetch incident reports for admin portal
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('incident_reports')
      .select(`
        *,
        guard:users!guard_id (
          first_name,
          last_name,
          email
        ),
        location:locations!closest_checkpoint_id (
          name,
          address
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: incidentReports, error } = await query

    if (error) {
      console.error('Error fetching incident reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch incident reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ incidentReports })
  } catch (error) {
    console.error('Error in GET /api/incident-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new incident report from mobile app
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      guard_id,
      organization_id,
      incident_type,
      title,
      description,
      severity = 'medium',
      incident_date,
      location_latitude,
      location_longitude,
      location_address,
      photos = [],
      patrol_id
    } = body

    console.log('[Incident Report] Full request details:', {
      body: JSON.stringify(body),
      guard_id,
      organization_id,
      incident_type,
      title: title?.substring(0, 50) + '...',
      severity,
      photos_count: photos?.length
    })

    if (!guard_id || !organization_id || !incident_type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: guard_id, organization_id, incident_type, title, description' },
        { status: 400 }
      )
    }

    // Find closest checkpoint to incident location
    let closestCheckpoint = null
    if (location_latitude && location_longitude) {
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
              location_latitude, location_longitude,
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

    // Create incident report
    const { data: incidentReport, error } = await supabaseAdmin
      .from('incident_reports')
      .insert({
        guard_id,
        organization_id,
        patrol_id,
        incident_type,
        title: title.trim(),
        description: description.trim(),
        severity,
        status: 'reported',
        incident_date: incident_date || new Date().toISOString(),
        location_latitude,
        location_longitude,
        location_address,
        closest_checkpoint_id: closestCheckpoint?.id,
        photos: photos || [],
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating incident report:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        requestData: { guard_id, organization_id, incident_type, title }
      })
      return NextResponse.json(
        { 
          error: 'Failed to create incident report', 
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
        action: 'incident_reported',
        entity_type: 'incident_report',
        entity_id: incidentReport.id,
        metadata: {
          incident_type,
          severity,
          title,
          closest_checkpoint: closestCheckpoint?.name,
          patrol_id
        }
      })

    console.log('[Incident Report] Created successfully:', incidentReport.id)
    return NextResponse.json({ 
      success: true, 
      incidentReport,
      closestCheckpoint
    })

  } catch (error: any) {
    console.error('Error in POST /api/incident-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update incident report status (for admin use)
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      id,
      status,
      actions_taken,
      follow_up_required,
      follow_up_notes,
      resolved_by
    } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (actions_taken) updateData.actions_taken = actions_taken
    if (follow_up_required !== undefined) updateData.follow_up_required = follow_up_required
    if (follow_up_notes) updateData.follow_up_notes = follow_up_notes
    if (resolved_by) updateData.resolved_by = resolved_by

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: incidentReport, error } = await supabaseAdmin
      .from('incident_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating incident report:', error)
      return NextResponse.json(
        { error: 'Failed to update incident report', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      incidentReport 
    })

  } catch (error: any) {
    console.error('Error in PUT /api/incident-reports:', error)
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