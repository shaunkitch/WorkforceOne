import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Create server client for authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in server components
            }
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - please log in'
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      latitude, 
      longitude, 
      accuracy, 
      altitude, 
      speed, 
      heading, 
      batteryLevel,
      deviceInfo 
    } = body

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 })
    }

    // Validate coordinate ranges
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates'
      }, { status: 400 })
    }

    // Use admin client to insert GPS data
    const supabaseAdmin = getSupabaseAdmin()

    const gpsData = {
      user_id: user.id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      altitude: altitude ? parseFloat(altitude) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null,
      battery_level: batteryLevel ? parseInt(batteryLevel) : null,
      timestamp: new Date().toISOString()
    }

    console.log('Inserting GPS data for user:', user.id, gpsData)

    const { error: insertError } = await supabaseAdmin
      .from('gps_tracking')
      .insert([gpsData])

    if (insertError) {
      console.error('Error inserting GPS data:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save GPS data: ' + insertError.message
      }, { status: 500 })
    }

    console.log('GPS data saved successfully for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'GPS location updated successfully',
      timestamp: gpsData.timestamp
    })

  } catch (error) {
    console.error('GPS update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}