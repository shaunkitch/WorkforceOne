import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('Profile API called with userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Use raw SQL to bypass any RLS issues
    const { data, error } = await supabaseAdmin.rpc('get_user_profile', {
      user_id: userId
    })

    console.log('RPC call result:', { data, error })

    if (error) {
      console.error('Profile fetch error:', error)
      console.log('Function does not exist or failed, trying direct queries...')
      
      // Fallback to direct table queries if the function doesn't exist
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('User data query result:', { userData, userError })

      if (userError) {
        console.error('User fetch error:', userError)
        return NextResponse.json({ error: userError.message }, { status: 400 })
      }

      // Fetch the role separately
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('id', userData.role_id)
        .single()

      console.log('Role data query result:', { roleData, roleError })

      const profile = {
        ...userData,
        role: roleData || null
      }
      
      console.log('Final profile assembled:', profile)
      return NextResponse.json({ profile })
    }

    const profile = data
    console.log('Profile from RPC function:', profile)

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}