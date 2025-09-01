import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No-op for API routes
          },
          remove(name: string, options: CookieOptions) {
            // No-op for API routes
          },
        },
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { first_name, last_name, organization_name } = await request.json()

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        user: existingProfile
      })
    }

    // Create default organization if none provided
    let organizationId = '00000000-0000-0000-0000-000000000001' // Default org
    let roleId = '00000000-0000-0000-0000-000000000003' // Default role

    // Create user profile
    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        first_name: first_name || 'User',
        last_name: last_name || 'Name',
        organization_id: organizationId,
        role_id: roleId,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to create profile: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      user: newProfile
    })

  } catch (error: any) {
    console.error('Create profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}