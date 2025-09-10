import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const days = parseInt(searchParams.get('days') || '30')

    // For debugging - allow fetching statistics for all organizations if no organization_id provided
    // TODO: Re-enable organization filtering for production

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: patrols, error } = await supabaseAdmin
      .from('patrols')
      .select('status, checkpoints_completed, total_checkpoints')
      .gte('created_at', startDate)

    if (error) {
      console.error('Error fetching patrol statistics:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!patrols) {
      return NextResponse.json({
        success: true,
        statistics: {
          totalPatrols: 0,
          completedPatrols: 0,
          activePatrols: 0,
          averageCheckpoints: 0,
          completionRate: 0
        }
      })
    }

    const totalPatrols = patrols.length
    const completedPatrols = patrols.filter(p => p.status === 'completed').length
    const activePatrols = patrols.filter(p => p.status === 'in_progress').length
    const totalCheckpoints = patrols.reduce((sum, p) => sum + (p.checkpoints_completed || 0), 0)
    const averageCheckpoints = totalPatrols > 0 ? Math.round(totalCheckpoints / totalPatrols * 10) / 10 : 0
    const completionRate = totalPatrols > 0 ? Math.round((completedPatrols / totalPatrols) * 100) : 0

    return NextResponse.json({
      success: true,
      statistics: {
        totalPatrols,
        completedPatrols,
        activePatrols,
        averageCheckpoints,
        completionRate
      }
    })
  } catch (error) {
    console.error('Error in patrol statistics API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}