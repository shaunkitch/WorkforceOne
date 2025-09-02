import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { email, password, userData } = await request.json()
    
    console.log('Smart registration request:', { email, userData })

    // Check if user already exists in both auth and users table
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = existingAuthUser?.users?.find(u => u.email === email)
    
    // Use maybeSingle to avoid RLS policy conflicts and 406 errors
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()
    
    if (authUserExists || existingProfile) {
      return NextResponse.json({ 
        error: 'User already exists with this email address' 
      }, { status: 400 })
    }

    console.log('User does not exist, proceeding with registration...')

    // Default values
    let organizationId = userData.organization_id || '00000000-0000-0000-0000-000000000001'
    let roleId = userData.role_id || '00000000-0000-0000-0000-000000000003'
    let departmentId = userData.department_id || null

    if (userData.organization_name) {
      console.log('Creating new organization:', userData.organization_name)
      
      // Create slug from organization name
      const slug = userData.organization_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() + '-' + Date.now()

      // Create new organization
      const { data: newOrg, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: userData.organization_name,
          slug,
          subscription_tier: 'basic',
          active_modules: ['guard'],
          settings: {}
        })
        .select('id')
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError)
        return NextResponse.json({ 
          error: `Organization creation failed: ${orgError.message}` 
        }, { status: 400 })
      }

      organizationId = newOrg.id
      console.log('New organization created:', organizationId)

      // Create default roles for the new organization
      const defaultRoles = [
        {
          name: 'Super Admin',
          permissions: { "*": "*" },
          module: 'guard'
        },
        {
          name: 'Guard Supervisor', 
          permissions: { 
            "patrols": ["read", "create", "update"], 
            "incidents": ["read", "create", "update"], 
            "reports": ["read"], 
            "admin": ["read"] 
          },
          module: 'guard'
        },
        {
          name: 'Security Guard',
          permissions: {
            "patrols": ["read", "update"],
            "incidents": ["read", "create"], 
            "checkpoints": ["update"]
          },
          module: 'guard'
        },
        {
          name: 'Dispatcher',
          permissions: {
            "patrols": ["read"],
            "incidents": ["read", "update"],
            "gps_tracking": ["read"]
          },
          module: 'guard'
        }
      ]

      const { data: createdRoles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .insert(
          defaultRoles.map(role => ({
            ...role,
            organization_id: organizationId
          }))
        )
        .select('id, name')

      if (rolesError) {
        console.error('Roles creation error:', rolesError)
        // Not critical, user can still be created with a basic role
      } else {
        console.log('Default roles created for organization')
        // Use the Super Admin role ID for the org creator
        const adminRole = createdRoles.find(r => r.name === 'Super Admin')
        if (adminRole) {
          roleId = adminRole.id
        }
      }
    }

    // Strategy: Create auth user with exact metadata that trigger expects
    // This should make the trigger create the profile successfully
    console.log('Creating auth user with trigger-compatible metadata...')
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({ 
        error: `Authentication error: ${authError.message}` 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 400 })
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if trigger created the profile
    const { data: triggerProfile, error: triggerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (triggerError || !triggerProfile) {
      console.log('Trigger did not create profile, creating manually...')
      
      // Trigger failed, create profile manually
      const { error: manualProfileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          first_name: userData.first_name || 'User',
          last_name: userData.last_name || 'Name',
          organization_id: organizationId,
          role_id: roleId,
          department_id: departmentId,
          phone: userData.phone,
          is_active: true
        })

      if (manualProfileError) {
        console.error('Manual profile creation error:', manualProfileError)
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ 
          error: `Profile creation failed: ${manualProfileError.message}` 
        }, { status: 400 })
      }

      console.log('Manual profile creation successful')
    } else {
      console.log('Trigger created profile successfully:', triggerProfile.id)
      
      // Update the profile with correct organization and additional data
      const updateData: any = {}
      if (userData.phone) updateData.phone = userData.phone
      
      // Always update organization_id if we created a new organization or it was provided via token
      if (userData.organization_name || userData.organization_id) {
        updateData.organization_id = organizationId
        updateData.role_id = roleId
        if (departmentId) updateData.department_id = departmentId
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('Profile update error:', updateError)
          // Critical for organization assignment
          if (userData.organization_name) {
            return NextResponse.json({ 
              error: `Organization assignment failed: ${updateError.message}` 
            }, { status: 400 })
          }
        } else {
          console.log('Profile updated with organization:', organizationId)
        }
      }
    }

    // Increment token usage if token was provided
    if (userData.registration_token) {
      const tokenToValidate = userData.registration_token.length <= 10 
        ? userData.registration_token.toUpperCase() 
        : userData.registration_token
        
      // Try to increment token usage count
      let tokenError = null
      try {
        const { error } = await supabaseAdmin
          .rpc('increment_usage_count_by_token', { token_value: tokenToValidate })
        tokenError = error
      } catch (rpcError) {
        // Fallback to direct update if function doesn't exist
        const { error } = await supabaseAdmin
          .from('registration_tokens')
          .update({
            usage_count: supabaseAdmin.raw('usage_count + 1'),
            updated_at: new Date().toISOString()
          })
          .eq('token', tokenToValidate)
        tokenError = error
      }
      
      if (tokenError) {
        console.error('Failed to increment token usage:', tokenError)
      }
    }

    console.log('Smart registration completed successfully!')

    return NextResponse.json({ 
      success: true,
      message: 'User registered successfully',
      user: { 
        id: authData.user.id, 
        email,
        needsEmailConfirmation: false
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Smart registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed due to server error'
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}