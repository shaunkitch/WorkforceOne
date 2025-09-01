import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json() // 'disable' or 'enable'
    
    console.log(`${action === 'disable' ? 'Disabling' : 'Enabling'} auth trigger...`)
    
    let sql: string
    
    if (action === 'disable') {
      sql = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
    } else {
      sql = `
        -- Recreate the trigger with conflict handling
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.users (
            id,
            email,
            first_name,
            last_name,
            organization_id,
            role_id,
            is_active
          )
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000003',
            true
          )
          ON CONFLICT (id) DO NOTHING;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    }

    // Execute using a raw SQL query through stored procedure if available
    const { error } = await supabaseAdmin.rpc('exec_sql', { 
      query: sql 
    })

    if (error) {
      console.error('SQL execution error:', error)
      // Try alternative method using direct query
      const { error: directError } = await supabaseAdmin
        .from('pg_stat_statements')
        .select('*')
        .limit(0) // This will fail but might give us access to run SQL

      return NextResponse.json({
        success: false,
        error: `Cannot execute SQL: ${error.message}`,
        suggestion: 'Trigger control requires direct database access'
      })
    }

    console.log('Trigger control successful')
    
    return NextResponse.json({
      success: true,
      message: `Trigger ${action}d successfully`
    })

  } catch (error) {
    console.error('Trigger control error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Use Supabase dashboard to manage triggers directly'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with {"action": "disable"} or {"action": "enable"} to control the auth trigger'
  })
}