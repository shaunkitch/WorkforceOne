import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()
    
    console.log('Manual registration request:', { email, userData })

    // Check if user already exists in both auth and users table
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = existingAuthUser?.users?.find(u => u.email === email)
    
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    if (authUserExists || existingProfile) {
      return NextResponse.json({ 
        error: 'User already exists with this email address' 
      }, { status: 400 })
    }

    // Use default organization/role
    const organizationId = '00000000-0000-0000-0000-000000000001' // Default org
    const roleId = '00000000-0000-0000-0000-000000000003' // Default role

    // Step 1: Create user profile FIRST with a temp UUID
    const tempId = crypto.randomUUID()
    console.log('Creating profile with temp ID:', tempId)
    
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: tempId,
        email,
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
        organization_id: organizationId,
        role_id: roleId,
        phone: userData.phone,
        is_active: true
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: `Profile creation failed: ${profileError.message}` 
      }, { status: 400 })
    }

    console.log('Profile created, now creating auth user...')

    // Step 2: Create auth user with admin API (this should work since profile exists)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
        profile_created: true // Flag to prevent trigger from running
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      // Clean up the profile
      await supabaseAdmin.from('users').delete().eq('id', tempId)
      return NextResponse.json({ 
        error: `Authentication error: ${authError.message}` 
      }, { status: 400 })
    }

    if (!authData.user) {
      // Clean up the profile
      await supabaseAdmin.from('users').delete().eq('id', tempId)
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 400 })
    }

    console.log('Auth user created:', authData.user.id)

    // Step 3: Update the profile with the real auth user ID
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ id: authData.user.id })
      .eq('id', tempId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from('users').delete().eq('id', tempId)
      return NextResponse.json({ 
        error: `Profile update failed: ${updateError.message}` 
      }, { status: 400 })
    }

    console.log('Manual registration successful!')

    return NextResponse.json({ 
      success: true,
      message: 'User registered successfully',
      user: { 
        id: authData.user.id, 
        email,
        needsEmailConfirmation: false
      }
    })

  } catch (error) {
    console.error('Manual registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed due to server error'
    }, { status: 500 })
  }
}