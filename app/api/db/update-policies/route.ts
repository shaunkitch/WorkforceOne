import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'



export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    console.log('Updating RLS policies for registration_tokens...')

    const policies = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "Admins can manage registration tokens" ON registration_tokens`,
      `DROP POLICY IF EXISTS "Admins can read registration tokens" ON registration_tokens`,
      `DROP POLICY IF EXISTS "Admins can create registration tokens" ON registration_tokens`,
      `DROP POLICY IF EXISTS "Admins can update registration tokens" ON registration_tokens`,
      `DROP POLICY IF EXISTS "Admins can delete registration tokens" ON registration_tokens`,
      
      // Create new policies
      `CREATE POLICY "Admins can read registration tokens" ON registration_tokens
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        )`,
      
      `CREATE POLICY "Admins can create registration tokens" ON registration_tokens
        FOR INSERT WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          ) AND 
          created_by = auth.uid()
        )`,
      
      `CREATE POLICY "Admins can update registration tokens" ON registration_tokens
        FOR UPDATE USING (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        ) WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        )`,
      
      `CREATE POLICY "Admins can delete registration tokens" ON registration_tokens
        FOR DELETE USING (
          organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        )`
    ]

    const results = []
    for (const policy of policies) {
      try {
        const { error } = await supabaseAdmin.rpc('exec', { query: policy })
        if (error) {
          console.log(`Policy execution note: ${error.message}`)
          results.push({ policy: policy.substring(0, 50) + '...', status: 'warning', message: error.message })
        } else {
          results.push({ policy: policy.substring(0, 50) + '...', status: 'success' })
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.log(`Policy execution error: ${errorMessage}`)
        results.push({ policy: policy.substring(0, 50) + '...', status: 'error', message: errorMessage })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated',
      results
    })

  } catch (error) {
    console.error('Policy update error:', error)
    return NextResponse.json({ error: 'Failed to update policies', details: error }, { status: 500 })
  }
}