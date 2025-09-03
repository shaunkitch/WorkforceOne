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
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: incidents, error } = await supabaseAdmin
      .from('incident_reports')
      .select(`
        *,
        users!guard_id (
          id,
          first_name,
          last_name,
          email
        ),
        patrols (
          id,
          start_time,
          status,
          patrol_routes (
            id,
            name
          )
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching incident reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch incident reports' },
        { status: 500 }
      )
    }

    console.log(`[Incidents API] Retrieved ${incidents?.length || 0} incident reports`)
    
    return NextResponse.json({ 
      incidentReports: incidents || []
    })
  } catch (error) {
    console.error('Error in GET /api/incidents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new incident report from mobile app
export async function POST(request: NextRequest) {
  try {
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

    console.log('[Incidents API] POST request received:', {
      guard_id,
      organization_id,
      incident_type,
      title: title?.substring(0, 50),
      has_location: !!(location_latitude && location_longitude)
    })

    // Validate required fields
    if (!guard_id || !organization_id || !incident_type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: guard_id, organization_id, incident_type, title, description' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Insert incident report into database
    const { data: incidentReport, error } = await supabaseAdmin
      .from('incident_reports')
      .insert({
        guard_id,
        organization_id,
        incident_type,
        title: title.trim(),
        description: description.trim(),
        severity,
        status: 'reported',
        incident_date: incident_date || new Date().toISOString(),
        location_latitude: location_latitude ? parseFloat(location_latitude) : null,
        location_longitude: location_longitude ? parseFloat(location_longitude) : null,
        location_address,
        photos: JSON.stringify(photos),
        patrol_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating incident report:', error)
      return NextResponse.json(
        { error: 'Failed to create incident report', details: error.message },
        { status: 500 }
      )
    }

    console.log('[Incidents API] Incident report created:', incidentReport.id)
    
    const response = NextResponse.json({ 
      success: true, 
      incidentReport,
      message: 'Incident report created successfully'
    })

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    
    return response

  } catch (error: any) {
    console.error('Error in POST /api/incidents:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update incident report status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: updatedReport, error } = await supabaseAdmin
      .from('incident_reports')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
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

    console.log('[Incidents API] Incident report updated:', id)
    
    return NextResponse.json({ 
      success: true, 
      incidentReport: updatedReport,
      message: 'Incident report updated successfully'
    })

  } catch (error: any) {
    console.error('Error in PUT /api/incidents:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}