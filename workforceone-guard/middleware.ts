import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated but not on setup-profile page, check if they have a profile
  if (user && !request.nextUrl.pathname.startsWith('/setup-profile') && !request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      // If no profile exists, redirect to setup-profile
      if (!profile) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup-profile'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If there's an error checking the profile, redirect to setup-profile
      const url = request.nextUrl.clone()
      url.pathname = '/setup-profile'
      return NextResponse.redirect(url)
    }
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user && !request.nextUrl.pathname.startsWith('/auth/') && !request.nextUrl.pathname.startsWith('/api/') && request.nextUrl.pathname !== '/' && !request.nextUrl.pathname.startsWith('/setup-profile')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}