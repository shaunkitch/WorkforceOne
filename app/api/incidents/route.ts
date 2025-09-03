import { NextRequest, NextResponse } from 'next/server'

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

    // TODO: Once database table is created, fetch actual data
    console.log('[Incidents API] GET request - DB table pending')
    
    return NextResponse.json({ 
      incidentReports: [],
      message: 'Database migration pending. Run supabase_incident_reports_migration.sql' 
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

    // Create mock response until DB table exists
    const mockIncidentReport = {
      id: `mock-${Date.now()}`,
      guard_id,
      organization_id,
      incident_type,
      title: title.trim(),
      description: description.trim(),
      severity,
      status: 'reported',
      incident_date: incident_date || new Date().toISOString(),
      location_latitude,
      location_longitude,
      location_address,
      photos,
      patrol_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('[Incidents API] Mock incident created:', mockIncidentReport.id)
    
    const response = NextResponse.json({ 
      success: true, 
      incidentReport: mockIncidentReport,
      message: 'Incident received. Database migration pending for persistence.'
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

    console.log('[Incidents API] PUT request - DB table pending')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Update received. Database migration pending for persistence.'
    })

  } catch (error: any) {
    console.error('Error in PUT /api/incidents:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}