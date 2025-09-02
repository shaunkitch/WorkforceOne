import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


// Server-side Supabase client with service role (bypasses RLS)

// PATCH - Update token (e.g., deactivate)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
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