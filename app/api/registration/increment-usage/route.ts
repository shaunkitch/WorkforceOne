import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


// Server-side Supabase client with service role (bypasses RLS)

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token is required' 
      }, { status: 400 })
    }

    // For access codes (5 chars), convert to uppercase. For QR tokens (UUIDs), keep as-is
    const tokenToValidate = token.length <= 10 ? token.toUpperCase() : token
    
    // Increment the usage count
    const { data, error } = await supabaseAdmin
      .from('registration_tokens')
      .update({
        usage_count: supabaseAdmin.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('token', tokenToValidate)
      .select()
      .single()

    if (error) {
      console.error('Error incrementing usage:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to increment usage count' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to increment usage' 
    }, { status: 500 })
  }
}