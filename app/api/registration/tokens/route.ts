import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


// Server-side Supabase client with service role (bypasses RLS)

// Generate a 5-character access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a QR code token (UUID-like)
function generateQRToken(): string {
  return crypto.randomUUID()
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { organization_id, token_type, role_id, department_id, expires_in_hours, usage_limit, created_by } = await request.json()

    console.log('Creating token with data:', { organization_id, token_type, role_id, expires_in_hours, usage_limit, created_by })

    let token: string

    if (token_type === 'access_code') {
      // Generate unique 5-letter code
      let attempts = 0
      do {
        token = generateAccessCode()
        const { data: existing } = await supabaseAdmin
          .from('registration_tokens')
          .select('id')
          .eq('token', token)
          .single()
        
        if (!existing) break
        attempts++
      } while (attempts < 10)

      if (attempts >= 10) {
        return NextResponse.json({ error: 'Unable to generate unique access code' }, { status: 500 })
      }
    } else {
      token = generateQRToken()
    }

    const expiresAt = expires_in_hours 
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
      : null

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('registration_tokens')
      .insert({
        organization_id,
        token,
        token_type,
        role_id,
        department_id,
        expires_at: expiresAt,
        usage_limit,
        created_by,
        metadata: {}
      })
      .select(`
        *,
        role:role_id (name),
        department:department_id (name),
        creator:created_by (first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Token creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Token created successfully:', data)

    return NextResponse.json({
      success: true,
      token: data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('registration_tokens')
      .select(`
        *,
        role:role_id (name),
        department:department_id (name),
        creator:created_by (first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tokens:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      tokens: data || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
  }
}