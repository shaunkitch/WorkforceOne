import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// PATCH - Update token (e.g., deactivate)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await request.json()

    console.log('Updating token:', id, 'with:', updates)

    const { data, error } = await supabaseAdmin
      .from('registration_tokens')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Token update error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      token: data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 })
  }
}

// DELETE - Delete token
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log('Deleting token:', id)

    const { error } = await supabaseAdmin
      .from('registration_tokens')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Token deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
  }
}