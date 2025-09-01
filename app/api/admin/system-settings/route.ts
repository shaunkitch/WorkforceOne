import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, unauthorizedResponse } from '@/lib/supabase/api'

export async function GET() {
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
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Check if user has admin permissions
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get system settings from the organization record or a dedicated settings table
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('system_settings')
      .eq('id', userProfile.organization_id)
      .single()

    if (error) {
      console.error('Error fetching system settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system settings' },
        { status: 500 }
      )
    }

    // Default system settings if none exist
    const defaultSettings = {
      maintenance_mode: false,
      registration_enabled: true,
      max_failed_logins: 5,
      session_timeout_minutes: 60,
      backup_enabled: true,
      email_notifications: true,
      sms_notifications: false
    }

    const settings = organization?.system_settings || defaultSettings

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('System settings API error:', error)
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
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Check if user has admin permissions
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Update system settings in the organization record
    const { data, error } = await supabase
      .from('organizations')
      .update({
        system_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.organization_id)
      .select('system_settings')
      .single()

    if (error) {
      console.error('Error updating system settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update system settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data.system_settings
    })

  } catch (error) {
    console.error('System settings update API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}