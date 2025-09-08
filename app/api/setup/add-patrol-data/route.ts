import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    console.log('Adding sample patrol checkpoint data...')
    
    // Get active users and organizations
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, organization_id')
      .eq('is_active', true)
      .limit(5)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users: ' + usersError.message
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active users found to create patrol data for'
      })
    }

    const organizationId = users[0].organization_id

    // Create some locations (checkpoints) first
    const locations = [
      { name: 'Main Entrance', lat: -26.2041, lng: 28.0473 },
      { name: 'Parking Lot A', lat: -26.2051, lng: 28.0483 },
      { name: 'Building 1 Entrance', lat: -26.2031, lng: 28.0463 },
      { name: 'Security Office', lat: -26.2061, lng: 28.0453 },
      { name: 'Emergency Exit', lat: -26.2021, lng: 28.0493 }
    ]

    console.log('Creating checkpoint locations...')
    const locationInserts = locations.map(loc => ({
      organization_id: organizationId,
      name: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      location_type: 'checkpoint'
    }))

    const { data: createdLocations, error: locationError } = await supabaseAdmin
      .from('locations')
      .insert(locationInserts)
      .select()

    if (locationError) {
      console.error('Error creating locations:', locationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create locations: ' + locationError.message
      }, { status: 500 })
    }

    console.log('Created', createdLocations?.length || 0, 'checkpoint locations')

    // Create a patrol route
    const routeData = {
      organization_id: organizationId,
      name: 'Security Patrol Route 1',
      description: 'Main security patrol covering all key checkpoints',
      checkpoints: createdLocations?.map(loc => loc.id) || [],
      estimated_duration: 60, // 60 minutes
      is_active: true,
      created_by: users[0].id
    }

    const { data: createdRoute, error: routeError } = await supabaseAdmin
      .from('patrol_routes')
      .insert([routeData])
      .select()
      .single()

    if (routeError) {
      console.error('Error creating patrol route:', routeError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create patrol route: ' + routeError.message
      }, { status: 500 })
    }

    console.log('Created patrol route:', createdRoute.name)

    // Create active patrols for guards
    const now = new Date()
    const patrolInserts = users.map((user, index) => ({
      organization_id: organizationId,
      guard_id: user.id,
      route_id: createdRoute.id,
      start_time: new Date(now.getTime() - (index * 10 + 20) * 60 * 1000).toISOString(), // Started 20-60 mins ago
      status: 'in_progress',
      total_checkpoints: createdLocations?.length || 0,
      checkpoints_completed: Math.floor(Math.random() * (createdLocations?.length || 3))
    }))

    const { data: createdPatrols, error: patrolError } = await supabaseAdmin
      .from('patrols')
      .insert(patrolInserts)
      .select()

    if (patrolError) {
      console.error('Error creating patrols:', patrolError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create patrols: ' + patrolError.message
      }, { status: 500 })
    }

    console.log('Created', createdPatrols?.length || 0, 'active patrols')

    // Create recent checkpoint visits
    const checkpointVisits = []
    
    for (const patrol of createdPatrols || []) {
      const numVisits = Math.floor(Math.random() * 3) + 1 // 1-3 visits per patrol
      const availableLocations = createdLocations?.slice(0, numVisits) || []
      
      for (let i = 0; i < numVisits; i++) {
        const location = availableLocations[i]
        if (location) {
          checkpointVisits.push({
            patrol_id: patrol.id,
            location_id: location.id,
            guard_id: patrol.guard_id,
            visited_at: new Date(Date.now() - (30 - (i * 5)) * 60 * 1000).toISOString(), // Last 30 mins
            verification_method: 'qr_code',
            latitude: location.latitude + (Math.random() * 0.0002 - 0.0001), // Small variation for GPS accuracy
            longitude: location.longitude + (Math.random() * 0.0002 - 0.0001),
            notes: `Checkpoint ${i + 1} visited - all clear`
          })
        }
      }
    }

    if (checkpointVisits.length > 0) {
      const { error: visitsError } = await supabaseAdmin
        .from('checkpoint_visits')
        .insert(checkpointVisits)

      if (visitsError) {
        console.error('Error creating checkpoint visits:', visitsError)
      } else {
        console.log('Created', checkpointVisits.length, 'checkpoint visits')
      }
    }

    return NextResponse.json({
      success: true,
      message: `Patrol data created successfully`,
      data: {
        locations: createdLocations?.length || 0,
        patrols: createdPatrols?.length || 0,
        checkpointVisits: checkpointVisits.length,
        guards: users.map(u => `${u.first_name} ${u.last_name}`)
      }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}