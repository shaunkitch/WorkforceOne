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
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Get all roles for the organization
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }

    // If no roles exist, create default ones
    if (!roles || roles.length === 0) {
      const defaultRoles = [
        {
          name: 'Admin',
          organization_id: userProfile.organization_id,
          permissions: [
            'manage_users', 'view_users', 'manage_roles', 'view_reports',
            'manage_settings', 'view_attendance', 'manage_attendance',
            'view_incidents', 'manage_incidents', 'view_patrols', 'manage_patrols'
          ]
        },
        {
          name: 'Supervisor',
          organization_id: userProfile.organization_id,
          permissions: [
            'view_users', 'view_reports', 'view_attendance', 'manage_attendance',
            'view_incidents', 'manage_incidents', 'view_patrols', 'manage_patrols'
          ]
        },
        {
          name: 'Security Guard',
          organization_id: userProfile.organization_id,
          permissions: [
            'view_attendance', 'view_incidents', 'view_patrols'
          ]
        }
      ]

      const { data: createdRoles, error: createError } = await supabase
        .from('roles')
        .insert(defaultRoles)
        .select()

      if (createError) {
        console.error('Error creating default roles:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create default roles' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        roles: createdRoles || []
      })
    }

    return NextResponse.json({
      success: true,
      roles: roles || []
    })

  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { name, permissions } = await request.json()

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Name and permissions are required' },
        { status: 400 }
      )
    }

    // Create new role
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name,
        permissions,
        organization_id: userProfile.organization_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      role: data
    })

  } catch (error) {
    console.error('Role creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}