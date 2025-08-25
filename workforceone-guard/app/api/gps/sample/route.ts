import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('Creating sample GPS data...')

    // First get an existing user ID
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .single()

    if (userError || !users) {
      return NextResponse.json({ error: 'No users found', details: userError }, { status: 400 })
    }

    const userId = users.id
    console.log('Using user ID:', userId)

    // Create sample GPS tracking data (around New York City area)
    const samplePositions = [
      {
        user_id: userId,
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5.0,
        battery_level: 85,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      },
      {
        user_id: userId,
        latitude: 40.7589,
        longitude: -73.9851,
        accuracy: 8.0,
        battery_level: 83,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
      },
      {
        user_id: userId,
        latitude: 40.7505,
        longitude: -73.9934,
        accuracy: 6.0,
        battery_level: 82,
        timestamp: new Date().toISOString() // Now
      }
    ]

    // Insert sample data
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('gps_tracking')
      .insert(samplePositions)
      .select()

    console.log('Sample data insertion result:', { insertedData, insertError })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert sample data', details: insertError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample GPS data created',
      userId,
      positions: samplePositions.length
    })

  } catch (error) {
    console.error('Sample data creation error:', error)
    return NextResponse.json({ error: 'Failed to create sample data', details: error }, { status: 500 })
  }
}