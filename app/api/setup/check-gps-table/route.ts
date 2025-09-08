import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    // Try to query the table structure
    const { data, error } = await supabaseAdmin
      .from('gps_tracking')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        tableExists: false
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      sampleRecord: data?.[0] || null,
      message: 'GPS tracking table exists'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}