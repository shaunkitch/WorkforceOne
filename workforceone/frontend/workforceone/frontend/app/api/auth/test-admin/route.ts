import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('Testing Supabase admin connection...')
    console.log('Environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlPreview: supabaseUrl?.substring(0, 20) + '...',
      serviceKeyPreview: supabaseServiceKey?.substring(0, 20) + '...'
    })

    // Test 1: Try to list users (this should work with service role)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: listError
      })
    }

    console.log('List users success:', { count: users?.users?.length || 0 })

    // Test 2: Try to access a database table
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1)

    return NextResponse.json({
      success: true,
      tests: {
        authAdmin: {
          success: true,
          userCount: users?.users?.length || 0
        },
        database: {
          success: !tableError,
          error: tableError?.message,
          hasData: !!tableData?.length
        }
      }
    })

  } catch (error) {
    console.error('Test admin error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}