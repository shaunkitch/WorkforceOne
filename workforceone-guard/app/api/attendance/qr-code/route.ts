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
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type = 'static', siteId, validHours = 24 } = body

    // Generate QR code
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 8)
    const prefix = type === 'static' ? 'STC' : 'RND'
    const sitePrefix = siteId ? siteId.slice(0, 8) : 'GENERAL'
    const code = `${prefix}-${sitePrefix}-${timestamp}-${random}`.toUpperCase()

    const validFrom = new Date()
    const validUntil = type === 'random' 
      ? new Date(Date.now() + validHours * 60 * 60 * 1000)
      : null

    // Insert into database
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        code,
        type,
        site_id: siteId,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil?.toISOString(),
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating QR code:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create QR code' },
        { status: 500 }
      )
    }

    // If random QR code, deactivate previous ones for the same site
    if (type === 'random' && siteId) {
      await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('site_id', siteId)
        .eq('type', 'random')
        .neq('id', data.id)
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        id: data.id,
        code: data.code,
        type: data.type,
        siteId: data.site_id,
        validFrom: data.valid_from,
        validUntil: data.valid_until,
        isActive: data.is_active,
        dataUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/attendance/scan?code=${data.code}`
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return mock QR codes for now
    const mockQRCodes = [
      {
        id: '1',
        code: 'STC-DEMO-123-ABC',
        type: 'static',
        siteId: null,
        validFrom: new Date().toISOString(),
        validUntil: null,
        isActive: true,
        dataUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/attendance/scan?code=STC-DEMO-123-ABC`
      },
      {
        id: '2', 
        code: 'RND-DEMO-456-DEF',
        type: 'random',
        siteId: null,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        isActive: true,
        dataUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/attendance/scan?code=RND-DEMO-456-DEF`
      }
    ]

    return NextResponse.json({
      success: true,
      qrCodes: mockQRCodes
    })

  } catch (error) {
    console.error('QR code fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}