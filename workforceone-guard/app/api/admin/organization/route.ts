import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, unauthorizedResponse } from '@/lib/supabase/api'

export async function GET() {
  try {
    const supabase = await createApiClient()
    
    // Get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[ADMIN ORG] Session check:', { 
      hasSession: !!session, 
      sessionError,
      userId: session?.user?.id 
    })
    
    if (!session?.user) {
      console.log('[ADMIN ORG] No session found, returning 401')
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

    // Get the user's organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userProfile.organization_id)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch organization' },
        { status: 500 }
      )
    }

    // If no organization found, create a default one
    if (!organization) {
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          id: userProfile.organization_id,
          name: 'Default Organization',
          timezone: 'UTC',
          settings: {
            auto_logout_minutes: 30,
            require_gps_for_checkin: true,
            allow_offline_mode: false,
            max_shift_hours: 12,
            break_reminder_interval: 240
          }
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating organization:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create organization' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        organization: newOrg
      })
    }

    return NextResponse.json({
      success: true,
      organization
    })

  } catch (error) {
    console.error('Organization API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()

    // Update organization
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        timezone: body.timezone,
        settings: body.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data
    })

  } catch (error) {
    console.error('Organization update API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}