import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


// Get the base URL for the current environment
function getBaseUrl(request: NextRequest): string {
  // Prefer environment variable for production
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback to request headers for dynamic environments
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 
                   request.headers.get('x-forwarded-protocol') ||
                   (host.includes('localhost') ? 'http' : 'https')
  
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const format = searchParams.get('format') || 'url' // 'url' or 'qr'

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 })
    }

    // Verify token exists and is valid
    const { data: tokenData, error } = await supabaseAdmin
      .from('registration_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error || !tokenData) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 404 })
    }

    // Generate the registration URL
    const baseUrl = getBaseUrl(request)
    const registrationUrl = `${baseUrl}/register?token=${token}`

    if (format === 'url') {
      return NextResponse.json({ 
        url: registrationUrl,
        token: token,
        baseUrl: baseUrl
      })
    }

    // For QR format, return the QR code data URL
    return NextResponse.json({ 
      qrData: registrationUrl,  // This will be used in the QR code
      displayUrl: registrationUrl,
      token: token
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}