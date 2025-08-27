-- Fix infinite recursion in RLS policies
-- Drop the problematic policies that cause infinite recursion

DROP POLICY IF EXISTS "Enable read access for service role" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Enable update for service role" ON users;
DROP POLICY IF EXISTS "Enable delete for service role" ON users;

-- Create simpler policies without recursive joins
-- These policies check auth directly without joining back to users table

CREATE POLICY "Service role bypass" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- For admin checks, we'll rely on the service role in API endpoints
-- rather than checking roles in RLS policies to avoid recursion