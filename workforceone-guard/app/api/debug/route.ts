import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Debug - Auth check:', { 
      user: user?.id, 
      email: user?.email,
      error: authError?.message 
    })

    // Try to access specific tables to see if they exist
    const tableChecks = {
      users: null,
      shift_attendance: null,
      qr_codes: null,
      sites: null
    }

    // Check users table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      tableChecks.users = { exists: true, error: error?.message, count: data?.length || 0 }
    } catch (e: any) {
      tableChecks.users = { exists: false, error: e.message }
    }

    // Check shift_attendance table
    try {
      const { data, error } = await supabase
        .from('shift_attendance')
        .select('*')
        .limit(1)
      tableChecks.shift_attendance = { exists: true, error: error?.message, count: data?.length || 0 }
    } catch (e: any) {
      tableChecks.shift_attendance = { exists: false, error: e.message }
    }

    // Check qr_codes table
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .limit(1)
      tableChecks.qr_codes = { exists: true, error: error?.message, count: data?.length || 0 }
    } catch (e: any) {
      tableChecks.qr_codes = { exists: false, error: e.message }
    }

    // Check sites table
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .limit(1)
      tableChecks.sites = { exists: true, error: error?.message, count: data?.length || 0 }
    } catch (e: any) {
      tableChecks.sites = { exists: false, error: e.message }
    }

    console.log('Debug - Table checks:', tableChecks)

    // Try to check user profile if authenticated
    let userProfile = null
    if (user && !authError) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('Debug - User profile:', { profile, error: profileError?.message })
      userProfile = profile
    }

    return NextResponse.json({
      success: true,
      debug: {
        authenticated: !!user && !authError,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message,
        tableChecks,
        userProfile
      }
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: error.message, debug: { caught: true } },
      { status: 500 }
    )
  }
}