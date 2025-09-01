import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token is required' 
      }, { status: 400, headers: corsHeaders })
    }

    // For access codes (5 chars), convert to uppercase. For QR tokens (UUIDs), keep as-is
    const tokenToValidate = token.length <= 10 ? token.toUpperCase() : token
    
    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('registration_tokens')
      .select(`
        *,
        role:role_id (name, permissions),
        department:department_id (name),
        organization:organization_id (name, slug)
      `)
      .eq('token', tokenToValidate)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('Token validation error:', error)
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      }, { headers: corsHeaders })
    }

    // Check if token has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token has expired' 
      }, { headers: corsHeaders })
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token usage limit reached' 
      }, { headers: corsHeaders })
    }

    return NextResponse.json({ 
      valid: true, 
      tokenData: data 
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate token' 
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}