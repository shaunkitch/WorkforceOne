import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()
    
    console.log('Simple registration request:', { email, userData })

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

    // Try client-side registration instead of admin.createUser
    const clientSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const { data: signUpData, error: signUpError } = await clientSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name || 'User',
          last_name: userData.last_name || 'Name',
        }
      }
    })

    if (signUpError) {
      console.error('Client sign up error:', signUpError)
      return NextResponse.json({ 
        error: `Registration failed: ${signUpError.message}` 
      }, { status: 400 })
    }

    if (!signUpData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 400 })
    }

    console.log('Client signup successful, user ID:', signUpData.user.id)

    // Create user profile with service role permissions
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: signUpData.user.id,
        email,
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
        organization_id: organizationId,
        role_id: roleId,
        phone: userData.phone
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: `Profile creation failed: ${profileError.message}` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'User registered successfully',
      user: { 
        id: signUpData.user.id, 
        email,
        needsEmailConfirmation: !signUpData.user.email_confirmed_at
      }
    })

  } catch (error) {
    console.error('Simple registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}