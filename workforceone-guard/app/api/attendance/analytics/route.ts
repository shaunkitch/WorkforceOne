import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, unauthorizedResponse } from '@/lib/supabase/api'
import { AttendanceAnalyticsServerService } from '@/lib/services/attendance-analytics-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Get user profile to get organization_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
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
      userId: session.user.id,
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

    return NextResponse.json({
      success: true,
      data: result,
      type: analyticsType
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}