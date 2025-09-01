import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Server-side login attempt for:', email)

    // Create a fresh Supabase instance for this login
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Server login error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    if (!data.session || !data.user) {
      console.error('Server login failed: no session or user')
      return NextResponse.json({
        success: false,
        error: 'Authentication failed - no session created'
      })
    }

    console.log('Server login successful:', data.user.id)

    // Set the session cookies manually
    const cookieStore = await cookies()
    
    // Set access token
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

    // Set cookies for the session
    if (data.session.access_token) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in || 3600
      })
    }

    if (data.session.refresh_token) {
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('Server login exception:', error)
    return NextResponse.json({
      success: false,
      error: 'Login failed due to server error'
    }, { status: 500 })
  }
}