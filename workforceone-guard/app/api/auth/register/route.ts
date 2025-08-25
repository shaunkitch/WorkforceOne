import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()

    // Create organization if provided
    let organizationId = userData.organization_id
    let roleId = userData.role_id

    if (userData.organization_name && !organizationId) {
      // Create a slug from organization name
      const slug = userData.organization_name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Create the organization
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: userData.organization_name,
          slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
          active_modules: ['guard'],
          subscription_tier: 'basic'
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError)
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 400 })
      }

      organizationId = orgData.id

      // Create default department for the organization
      const { error: deptError } = await supabaseAdmin
        .from('departments')
        .insert({
          organization_id: organizationId,
          name: 'Security Operations'
        })

      if (deptError) {
        console.error('Department creation error:', deptError)
      }

      // Create Super Admin role for the first user of new organization
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .insert({
          organization_id: organizationId,
          name: 'Super Admin',
          permissions: { "*": "*" },
          module: 'guard'
        })
        .select()
        .single()

      if (roleError) {
        console.error('Role creation error:', roleError)
        return NextResponse.json({ error: 'Failed to create admin role' }, { status: 400 })
      }

      roleId = roleData.id
    }

    // Use default organization/role if not provided
    if (!organizationId) {
      organizationId = '00000000-0000-0000-0000-000000000001' // Demo Security Company
      roleId = '00000000-0000-0000-0000-000000000003' // Security Guard role
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 400 })
    }

    // Create the user profile with service role permissions
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organization_id: organizationId,
        role_id: roleId,
        phone: userData.phone
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'User and organization created successfully',
      user: { id: authData.user.id, email },
      organization: userData.organization_name ? { id: organizationId, name: userData.organization_name } : null
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}