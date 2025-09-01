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

    // Get all departments for the organization
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching departments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch departments' },
        { status: 500 }
      )
    }

    // If no departments exist, create default ones
    if (!departments || departments.length === 0) {
      const defaultDepartments = [
        {
          name: 'Security Operations',
          description: 'Main security operations and patrol management',
          organization_id: userProfile.organization_id
        },
        {
          name: 'Administration',
          description: 'Administrative and management functions',
          organization_id: userProfile.organization_id
        },
        {
          name: 'Night Shift',
          description: 'Night time security operations',
          organization_id: userProfile.organization_id
        }
      ]

      const { data: createdDepartments, error: createError } = await supabase
        .from('departments')
        .insert(defaultDepartments)
        .select()

      if (createError) {
        console.error('Error creating default departments:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create default departments' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        departments: createdDepartments || []
      })
    }

    return NextResponse.json({
      success: true,
      departments: departments || []
    })

  } catch (error) {
    console.error('Departments API error:', error)
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

    const { name, description, manager_id } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Create new department
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        description: description || null,
        manager_id: manager_id || null,
        organization_id: userProfile.organization_id
      })
      .select(`
        *,
        manager:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating department:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create department' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      department: data
    })

  } catch (error) {
    console.error('Department creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}