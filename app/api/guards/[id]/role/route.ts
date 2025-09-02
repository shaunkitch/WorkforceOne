import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { id: guardId } = await params
    const { role_id } = await request.json()

    if (!role_id) {
      return NextResponse.json({ 
        error: 'Role ID is required' 
      }, { status: 400 })
    }

    // Verify the role exists
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', role_id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ 
        error: 'Invalid role ID' 
      }, { status: 400 })
    }

    // Update the user's role
    const { data: updatedGuard, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', guardId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        role:role_id (
          id,
          name,
          permissions
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating guard role:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update guard role' 
      }, { status: 500 })
    }

    if (!updatedGuard) {
      return NextResponse.json({ 
        error: 'Guard not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: `Guard role updated to ${role.name}`,
      guard: updatedGuard 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}