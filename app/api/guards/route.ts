import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID is required' 
      }, { status: 400 })
    }

    // Fetch all guards/users for the organization with their roles and departments
    const { data: guards, error } = await supabaseAdmin
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
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guards:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch guards' 
      }, { status: 500 })
    }

    // TODO: Add current shift information and performance metrics
    // For now, we'll add mock data for shifts and performance
    const guardsWithExtendedData = guards?.map(guard => ({
      ...guard,
      current_shift: Math.random() > 0.7 ? {
        id: `shift-${guard.id}`,
        start_time: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000).toISOString(),
        status: ['scheduled', 'active', 'completed'][Math.floor(Math.random() * 3)] as 'scheduled' | 'active' | 'completed',
        location: ['Main Building', 'Parking Lot', 'Perimeter', 'Reception'][Math.floor(Math.random() * 4)]
      } : null,
      total_hours_week: Math.floor(Math.random() * 40) + 20,
      attendance_rate: Math.floor(Math.random() * 20) + 80,
      last_login: guard.updated_at // Use updated_at as proxy for last_login
    })) || []

    return NextResponse.json({ 
      guards: guardsWithExtendedData,
      total: guardsWithExtendedData.length 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}