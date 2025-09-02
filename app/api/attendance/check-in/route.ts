import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { QRCodeService } from '@/lib/attendance/qr-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { qrCode, latitude, longitude, accuracy, deviceInfo, shiftType = 'check_in' } = body

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'GPS location is required' },
        { status: 400 }
      )
    }

    let qrCodeData = null
    let qrCodeType = null

    // If QR code provided, validate it
    if (qrCode) {
      const validation = await QRCodeService.validateQRCode(qrCode)
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        )
      }
      qrCodeData = validation.qrCode
      qrCodeType = qrCodeData?.type

      // If QR code has a site, validate GPS location
      if (qrCodeData?.siteId) {
        const { data: site } = await supabase
          .from('sites')
          .select('*')
          .eq('id', qrCodeData.siteId)
          .single()

        if (site && site.require_gps_validation) {
          // Calculate distance between user location and site
          const distance = calculateDistance(
            latitude, longitude,
            site.latitude, site.longitude
          )

          if (distance > site.radius_meters) {
            return NextResponse.json(
              { 
                success: false, 
                error: `You must be within ${site.radius_meters}m of ${site.name} to check in`,
                distance: Math.round(distance)
              },
              { status: 400 }
            )
          }
        }
      }
    }

    // Check current shift status
    const currentStatus = await QRCodeService.getCurrentShiftStatus(user.id)
    
    // Validate shift logic
    if (shiftType === 'check_in' && currentStatus.isCheckedIn) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are already checked in. Please check out first.',
          currentStatus 
        },
        { status: 400 }
      )
    }

    if (shiftType === 'check_out' && !currentStatus.isCheckedIn) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are not checked in. Please check in first.',
          currentStatus 
        },
        { status: 400 }
      )
    }

    // Record attendance
    const attendance = await QRCodeService.recordAttendance(
      user.id,
      shiftType,
      { latitude, longitude, accuracy },
      qrCodeData?.id,
      qrCodeType,
      deviceInfo
    )

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    // Get user details for response
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: shiftType === 'check_in' 
        ? 'Successfully checked in' 
        : 'Successfully checked out',
      attendance: {
        ...attendance,
        userName: `${userData?.first_name} ${userData?.last_name}`,
        userEmail: userData?.email
      },
      shiftDuration: shiftType === 'check_out' ? currentStatus.durationHours : null
    })

  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two GPS coordinates
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000 // Radius of Earth in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}