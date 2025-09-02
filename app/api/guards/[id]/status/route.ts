import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { id: guardId } = await params
    const { is_active } = await request.json()

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ 
        error: 'is_active must be a boolean value' 
      }, { status: 400 })
    }

    // Update the user's active status
    const { data: updatedGuard, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', guardId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        is_active,
        role:role_id (
          id,
          name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating guard status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update guard status' 
      }, { status: 500 })
    }

    if (!updatedGuard) {
      return NextResponse.json({ 
        error: 'Guard not found' 
      }, { status: 404 })
    }

    const statusText = is_active ? 'activated' : 'deactivated'
    
    return NextResponse.json({ 
      message: `Guard ${statusText} successfully`,
      guard: updatedGuard 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}