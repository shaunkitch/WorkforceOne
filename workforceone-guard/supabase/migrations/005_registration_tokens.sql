-- Create registration_tokens table for QR code and invite-based registration
CREATE TABLE IF NOT EXISTS public.registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('qr', 'invite', 'access_code')),
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON public.registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_organization ON public.registration_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_active ON public.registration_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_expires ON public.registration_tokens(expires_at);

-- Function to increment usage count by token value
-- Drop all possible variations of the function first
DROP FUNCTION IF EXISTS public.increment_usage_count(UUID);
DROP FUNCTION IF EXISTS public.increment_usage_count(TEXT);
DROP FUNCTION IF EXISTS public.increment_usage_count;

CREATE FUNCTION public.increment_usage_count_by_token(token_value TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.registration_tokens 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE token = token_value;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.registration_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Organization admins can view tokens" ON public.registration_tokens;
DROP POLICY IF EXISTS "Only admins can create tokens" ON public.registration_tokens;  
DROP POLICY IF EXISTS "Only admins can update tokens" ON public.registration_tokens;
DROP POLICY IF EXISTS "Anonymous users can validate tokens" ON public.registration_tokens;

-- Admins can view all tokens in their organization
CREATE POLICY "Organization admins can view tokens"
  ON public.registration_tokens
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Only admins can create tokens
CREATE POLICY "Only admins can create tokens"
  ON public.registration_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND u.organization_id = registration_tokens.organization_id
      AND (r.name = 'Super Admin' OR r.name = 'Admin')
    )
  );

-- Only admins can update tokens (deactivate, etc.)
CREATE POLICY "Only admins can update tokens"
  ON public.registration_tokens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND u.organization_id = registration_tokens.organization_id
      AND (r.name = 'Super Admin' OR r.name = 'Admin')
    )
  );

-- Allow anonymous users to validate tokens (for registration)
CREATE POLICY "Anonymous users can validate tokens"
  ON public.registration_tokens
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Grant necessary permissions
GRANT SELECT ON public.registration_tokens TO anon;
GRANT ALL ON public.registration_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage_count_by_token TO anon, authenticated;

-- Insert some sample tokens for testing (optional)
-- These will be for the default organization
INSERT INTO public.registration_tokens (
  organization_id,
  token,
  token_type,
  role_id,
  created_by,
  expires_at,
  usage_limit
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',  -- Default org
  '7UXTG',                                  -- Test access code
  'access_code',
  '00000000-0000-0000-0000-000000000003',  -- Security Guard role
  (SELECT id FROM users LIMIT 1),
  NOW() + INTERVAL '30 days',
  10
),
(
  '00000000-0000-0000-0000-000000000001',  -- Default org
  '550e8400-e29b-41d4-a716-446655440001',  -- Test QR UUID
  'qr',
  '00000000-0000-0000-0000-000000000003',  -- Security Guard role
  (SELECT id FROM users LIMIT 1),
  NOW() + INTERVAL '30 days',
  5
)
ON CONFLICT DO NOTHING;