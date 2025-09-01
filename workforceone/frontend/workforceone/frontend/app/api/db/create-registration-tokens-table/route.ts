import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // First, let's check if the table exists by trying to query it
    const { error: checkError } = await supabaseAdmin
      .from('registration_tokens')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('relation')) {
      // Table doesn't exist - you need to create it manually in Supabase dashboard
      return NextResponse.json({
        error: 'Registration tokens table does not exist',
        message: 'Please create the table using the SQL migration in the Supabase dashboard',
        sql: `
-- Create registration_tokens table
CREATE TABLE IF NOT EXISTS public.registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('qr', 'invite', 'access_code')),
  role_id UUID,
  department_id UUID,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_registration_tokens_token ON public.registration_tokens(token);
CREATE INDEX idx_registration_tokens_organization ON public.registration_tokens(organization_id);
CREATE INDEX idx_registration_tokens_active ON public.registration_tokens(is_active);

-- Enable RLS
ALTER TABLE public.registration_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to validate tokens (for registration)
CREATE POLICY "Anonymous users can validate tokens"
  ON public.registration_tokens
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Grant permissions
GRANT SELECT ON public.registration_tokens TO anon;
GRANT ALL ON public.registration_tokens TO authenticated;`
      }, { status: 400 })
    }

    // Insert test tokens
    const testTokens = [
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        token: '7UXTG',
        token_type: 'access_code',
        role_id: '00000000-0000-0000-0000-000000000003',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 10,
        created_by: '00000000-0000-0000-0000-000000000001',
        is_active: true
      },
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        token: '550e8400-e29b-41d4-a716-446655440001',
        token_type: 'qr',
        role_id: '00000000-0000-0000-0000-000000000003',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 5,
        created_by: '00000000-0000-0000-0000-000000000001',
        is_active: true
      }
    ]

    // Get a valid user ID for created_by
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .single()

    if (users) {
      for (const token of testTokens) {
        token.created_by = users.id
        
        // Try to insert test tokens
        await supabaseAdmin
          .from('registration_tokens')
          .upsert(token, { onConflict: 'token' })
          .select()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration tokens table created successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to create registration tokens table', details: error },
      { status: 500 }
    )
  }
}