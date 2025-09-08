import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    console.log('Adding sample GPS data...')
    
    // Get active users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
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
        message: 'No active users found to add GPS data for'
      })
    }

    console.log('Found users:', users.map(u => `${u.first_name} ${u.last_name}`))

    // Clear existing GPS data first
    const { error: deleteError } = await supabaseAdmin
      .from('gps_tracking')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.log('Could not clear existing GPS data (table might not exist):', deleteError.message)
    }

    // Generate sample GPS data around Johannesburg
    const gpsData = []
    
    for (const user of users) {
      // Add multiple recent positions per user to show movement
      for (let i = 0; i < 3; i++) {
        gpsData.push({
          user_id: user.id,
          latitude: -26.2041 + (Math.random() * 0.1 - 0.05), // Johannesburg area with variation
          longitude: 28.0473 + (Math.random() * 0.1 - 0.05),
          accuracy: Math.floor(5 + Math.random() * 15), // 5-20 meters
          altitude: Math.floor(1750 + Math.random() * 100), // Johannesburg altitude
          speed: Math.random() < 0.3 ? 0 : Math.round(Math.random() * 5 * 100) / 100, // 30% stationary
          heading: Math.floor(Math.random() * 360), // 0-360 degrees
          battery_level: Math.floor(50 + Math.random() * 50), // 50-100%
          timestamp: new Date(Date.now() - (i * 5 + Math.random() * 5) * 60 * 1000).toISOString() // Spread over last 15 minutes
        })
      }
    }

    // Try inserting one record first to see what fields are accepted
    console.log('Testing with minimal record first...')
    const testRecord = {
      user_id: users[0].id,
      latitude: -26.2041,
      longitude: 28.0473,
      timestamp: new Date().toISOString()
    }

    const { error: testError } = await supabaseAdmin
      .from('gps_tracking')
      .insert([testRecord])

    if (testError) {
      console.error('Test insert failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Test insert failed: ' + testError.message
      }, { status: 500 })
    }

    console.log('Test insert successful, proceeding with full data...')
    
    // Clear the test record and insert full data
    await supabaseAdmin
      .from('gps_tracking')
      .delete()
      .eq('user_id', users[0].id)

    console.log('Inserting', gpsData.length, 'GPS records...')

    const { error: insertError } = await supabaseAdmin
      .from('gps_tracking')
      .insert(gpsData)

    if (insertError) {
      console.error('Error inserting GPS data:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert GPS data: ' + insertError.message
      }, { status: 500 })
    }

    console.log('Successfully inserted GPS data for', users.length, 'users')

    return NextResponse.json({
      success: true,
      message: `GPS tracking data added for ${users.length} users`,
      recordsInserted: gpsData.length,
      users: users.map(u => ({
        name: `${u.first_name} ${u.last_name}`,
        id: u.id
      }))
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}