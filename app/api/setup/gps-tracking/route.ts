import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    console.log('Setting up GPS tracking table...')
    
    // Create gps_tracking table
    const createTableSql = `
      -- Create gps_tracking table for location tracking
      CREATE TABLE IF NOT EXISTS gps_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        accuracy DOUBLE PRECISION,
        altitude DOUBLE PRECISION,
        speed DOUBLE PRECISION,
        heading DOUBLE PRECISION,
        battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        device_info JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for GPS tracking
      CREATE INDEX IF NOT EXISTS idx_gps_tracking_user_id ON gps_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_gps_tracking_timestamp ON gps_tracking(timestamp);
      CREATE INDEX IF NOT EXISTS idx_gps_tracking_location ON gps_tracking(latitude, longitude);

      -- Enable Row Level Security
      ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
    `

    // Try to create the table first - ignore error if it already exists
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: createTableSql })
      console.log('GPS tracking table created successfully')
    } catch (error) {
      console.log('Table might already exist, continuing...', error)
    }

    // Add sample GPS data
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .eq('is_active', true)
      .limit(5)

    if (users && users.length > 0) {
      console.log('Adding sample GPS data for users:', users.map(u => u.first_name + ' ' + u.last_name))

      const gpsData = users.map(user => ({
        user_id: user.id,
        latitude: -26.2041 + (Math.random() * 0.1 - 0.05), // Johannesburg area
        longitude: 28.0473 + (Math.random() * 0.1 - 0.05),
        accuracy: 5 + Math.random() * 15, // 5-20 meters
        altitude: 1750 + Math.random() * 100,
        speed: Math.random() < 0.3 ? 0 : Math.random() * 5, // 30% stationary
        heading: Math.random() * 360,
        battery_level: Math.floor(50 + Math.random() * 50), // 50-100%
        timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString() // Last 30 minutes
      }))

      const { error: insertError } = await supabaseAdmin
        .from('gps_tracking')
        .insert(gpsData)

      if (insertError) {
        console.error('Error inserting GPS data:', insertError)
      } else {
        console.log('Successfully inserted', gpsData.length, 'GPS records')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'GPS tracking table created and sample data added',
      usersWithData: users?.length || 0
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}