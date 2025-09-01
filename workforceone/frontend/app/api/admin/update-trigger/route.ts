import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('Updating handle_new_user trigger function...')
    
    const updateTriggerSQL = `
      -- Function to automatically create user profile when auth user is created
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        -- Create user profile with default organization and role (ignore conflicts)
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
          '00000000-0000-0000-0000-000000000001', -- Default org
          '00000000-0000-0000-0000-000000000003', -- Default role
          true
        )
        ON CONFLICT (id) DO NOTHING; -- Ignore if user profile already exists
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    
    const { error } = await supabaseAdmin.rpc('exec', { 
      sql: updateTriggerSQL 
    })

    if (error) {
      console.error('Trigger update error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    console.log('Trigger function updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Trigger function updated to handle conflicts'
    })

  } catch (error) {
    console.error('Update trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}