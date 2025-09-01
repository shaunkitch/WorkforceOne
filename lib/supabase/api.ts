import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function createApiClient() {
  const cookieStore = await cookies()
  
  // Debug: Log all cookies
  const allCookies = cookieStore.getAll()
  console.log('[API Client] Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  return supabase
}

export async function getAuthenticatedUser() {
  const supabase = await createApiClient()
  
  // First try to get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('[API Auth] Session check:', { 
    hasSession: !!session, 
    sessionError,
    userId: session?.user?.id 
  })
  
  if (!session) {
    console.log('[API Auth] No session found')
    return { user: null, error: sessionError || new Error('No session found') }
  }
  
  // If we have a session, get the user
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('[API Auth] User check:', { 
    hasUser: !!user, 
    error,
    userId: user?.id 
  })
  
  if (error || !user) {
    return { user: null, error: error || new Error('No user found') }
  }
  
  return { user, error: null }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}