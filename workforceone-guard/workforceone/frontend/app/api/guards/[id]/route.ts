import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guardId = params.id

    const { data: guard, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        is_active,
        created_at,
        updated_at,
        role:role_id (
          id,
          name,
          permissions
        ),
        organization:organization_id (
          id,
          name
        ),
        department:department_id (
          id,
          name
        )
      `)
      .eq('id', guardId)
      .single()

    if (error) {
      console.error('Error fetching guard:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch guard details' 
      }, { status: 500 })
    }

    if (!guard) {
      return NextResponse.json({ 
        error: 'Guard not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ guard })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guardId = params.id
    const updates = await request.json()

    // Validate required fields
    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'role_id', 'department_id', 'is_active']
    const updateData: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 })
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: updatedGuard, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', guardId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        is_active,
        created_at,
        updated_at,
        role:role_id (
          id,
          name,
          permissions
        ),
        organization:organization_id (
          id,
          name
        ),
        department:department_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating guard:', error)
      return NextResponse.json({ 
        error: 'Failed to update guard' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Guard updated successfully',
      guard: updatedGuard 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guardId = params.id

    // First, check if the guard exists and get their auth user ID
    const { data: guard, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', guardId)
      .single()

    if (fetchError || !guard) {
      return NextResponse.json({ 
        error: 'Guard not found' 
      }, { status: 404 })
    }

    // Delete from users table first (this will cascade to related records)
    const { error: deleteProfileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', guardId)

    if (deleteProfileError) {
      console.error('Error deleting guard profile:', deleteProfileError)
      return NextResponse.json({ 
        error: 'Failed to delete guard profile' 
      }, { status: 500 })
    }

    // Delete the auth user
    try {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(guardId)
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError)
        // Don't fail the request if auth deletion fails, profile is already deleted
      }
    } catch (authError) {
      console.error('Auth deletion error:', authError)
      // Continue - profile deletion was successful
    }

    return NextResponse.json({ 
      message: 'Guard deleted successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}