import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'


// Server-side Supabase client with service role

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    console.log('Creating sample GPS data...')

    // Get all existing users
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found', details: userError }, { status: 400 })
    }

    console.log(`Found ${users.length} users:`, users.map(u => `${u.first_name} ${u.last_name}`))

    // Clear existing GPS data first
    await supabaseAdmin
      .from('gps_tracking')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    const now = Date.now()
    const samplePositions = []

    // Create realistic patrol positions for each user
    users.forEach((user, userIndex) => {
      const basePositions = [
        // Security office area (NYC Financial District)
        { lat: 40.7074, lng: -74.0113, name: 'Security Office' },
        // Times Square patrol
        { lat: 40.7580, lng: -73.9855, name: 'Times Square' },
        // Central Park patrol
        { lat: 40.7829, lng: -73.9654, name: 'Central Park' },
        // Brooklyn Bridge area
        { lat: 40.7061, lng: -73.9969, name: 'Brooklyn Bridge' },
        // Wall Street area
        { lat: 40.7074, lng: -74.0113, name: 'Wall Street' }
      ]

      // Create 5 recent positions for each user (last 25 minutes)
      for (let i = 0; i < 5; i++) {
        const basePos = basePositions[i % basePositions.length]
        const timeOffset = (4 - i) * 5 * 60 * 1000 // 5 minutes apart, going backwards
        const batteryDrain = userIndex * 10 + i * 2 // Gradual battery drain
        
        // Add some realistic GPS variation
        const latVariation = (Math.random() - 0.5) * 0.001 // ~50m variation
        const lngVariation = (Math.random() - 0.5) * 0.001 // ~50m variation

        samplePositions.push({
          user_id: user.id,
          latitude: basePos.lat + latVariation,
          longitude: basePos.lng + lngVariation,
          accuracy: Math.random() * 10 + 3, // 3-13m accuracy
          altitude: Math.random() * 50 + 10, // 10-60m altitude
          speed: Math.random() * 5, // 0-5 km/h walking speed
          heading: Math.random() * 360, // Random heading
          battery_level: Math.max(15, 95 - batteryDrain), // Battery from 95% down to 15%
          timestamp: new Date(now - timeOffset).toISOString()
        })
      }
    })

    console.log(`Creating ${samplePositions.length} GPS positions for ${users.length} users`)

    // Insert sample data
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('gps_tracking')
      .insert(samplePositions)
      .select()

    console.log('Sample data insertion result:', { 
      inserted: insertedData?.length || 0, 
      error: insertError 
    })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert sample data', details: insertError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample GPS data created',
      users: users.length,
      positions: samplePositions.length,
      userDetails: users.map(u => ({ 
        id: u.id, 
        name: `${u.first_name} ${u.last_name}` 
      }))
    })

  } catch (error) {
    console.error('Sample data creation error:', error)
    return NextResponse.json({ error: 'Failed to create sample data', details: error }, { status: 500 })
  }
}