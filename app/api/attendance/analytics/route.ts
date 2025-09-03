import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { AttendanceAnalyticsServerService } from '@/lib/services/attendance-analytics-server'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request: NextRequest) {
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
    console.log('[Analytics API] Auth check:', { hasUser: !!user, userError, userId: user?.id })
    
    if (userError || !user) {
      console.log('[Analytics API] Authentication failed:', userError)
      const response = NextResponse.json(
        { success: false, error: 'Unauthorized - please log in' },
        { status: 401 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Get user profile using admin client to ensure we can access the data
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    console.log('[Analytics API] Profile check:', { hasProfile: !!userProfile, profileError, organizationId: userProfile?.organization_id })

    if (profileError || !userProfile?.organization_id) {
      console.log('[Analytics API] Profile not found:', profileError)
      return NextResponse.json(
        { success: false, error: 'No organization found for user' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const analyticsType = searchParams.get('type') || 'metrics'
    
    // Date parameters are not required for 'live' type
    if (analyticsType !== 'live' && (!startDate || !endDate)) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date()
    
    console.log('Analytics API called:', {
      userId: user.id,
      organizationId: userProfile.organization_id,
      analyticsType,
      startDate: startDate ? start.toISOString() : 'N/A',
      endDate: endDate ? end.toISOString() : 'N/A'
    })

    let result = null

    switch (analyticsType) {
      case 'metrics':
        result = await AttendanceAnalyticsServerService.getAttendanceMetrics(
          userProfile.organization_id,
          start,
          end
        )
        break

      case 'performance':
        const limit = parseInt(searchParams.get('limit') || '20')
        result = await AttendanceAnalyticsServerService.getGuardPerformance(
          userProfile.organization_id,
          start,
          end,
          limit
        )
        break

      case 'trends':
        const days = parseInt(searchParams.get('days') || '30')
        result = await AttendanceAnalyticsServerService.getAttendanceTrends(
          userProfile.organization_id,
          days
        )
        break

      case 'live':
        result = await AttendanceAnalyticsServerService.getLiveAttendanceStatus(
          userProfile.organization_id
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        )
    }

    const response = NextResponse.json({
      success: true,
      data: result,
      type: analyticsType
    })
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}