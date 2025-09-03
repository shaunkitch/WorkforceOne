import { NextRequest, NextResponse } from 'next/server'
// import { getSupabaseAdmin } from '@/lib/supabase-admin'

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

    // TODO: Once database table is created, implement actual data fetching
    // For now, return empty array
    console.log('[Incident Report GET] Temporary empty response (DB table not created yet)')
    
    return NextResponse.json({ 
      incidentReports: [],
      message: 'Database table needs to be created for full functionality.' 
    })
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

    // TODO: Once database table is created, implement the full functionality
    // For now, just return success to allow mobile app testing
    
    const mockIncidentReport = {
      id: `temp-${Date.now()}`,
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
      created_at: new Date().toISOString()
    }

    console.log('[Incident Report] Temporary success (DB table not created yet):', mockIncidentReport.id)
    return NextResponse.json({ 
      success: true, 
      incidentReport: mockIncidentReport,
      message: 'Incident report received successfully. Database table needs to be created for full functionality.'
    }, { status: 201 })

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
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      )
    }

    // TODO: Once database table is created, implement actual update
    // For now, just return success
    console.log('[Incident Report PUT] Temporary success (DB table not created yet)')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database table needs to be created for full functionality.'
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