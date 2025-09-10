import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const guardId = searchParams.get('guard_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    // For debugging - allow fetching all patrols if no organization_id provided
    // TODO: Re-enable organization filtering for production

    let query = supabaseAdmin
      .from('patrols')
      .select(`
        *,
        guard:users!patrols_guard_id_fkey (first_name, last_name, email),
        route:patrol_routes!patrols_route_id_fkey (
          name,
          description,
          checkpoints,
          estimated_duration
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (guardId) {
      query = query.eq('guard_id', guardId)
    }

    const { data: patrols, error } = await query

    if (error) {
      console.error('Error fetching patrols:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      patrols: patrols || [] 
    })
  } catch (error) {
    console.error('Error in patrols API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}