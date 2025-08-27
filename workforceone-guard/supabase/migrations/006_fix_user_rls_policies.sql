-- Fix RLS policies to allow service role operations
-- This prevents 406 errors when the smart-register API checks for existing users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new policies that allow service role operations
CREATE POLICY "Enable read access for service role" ON users
  FOR SELECT USING (
    -- Allow service role to read all users
    auth.role() = 'service_role' OR
    -- Allow users to read their own profile
    auth.uid() = id OR
    -- Allow admins/supervisors to read all users
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('Super Admin', 'Guard Supervisor')
    )
  );

CREATE POLICY "Enable insert for service role" ON users
  FOR INSERT WITH CHECK (
    -- Allow service role to create users
    auth.role() = 'service_role' OR
    -- Allow admins to create users
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'Super Admin'
    )
  );

CREATE POLICY "Enable update for service role" ON users
  FOR UPDATE USING (
    -- Allow service role to update any user
    auth.role() = 'service_role' OR
    -- Allow users to update their own profile
    auth.uid() = id OR
    -- Allow admins to update any user
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'Super Admin'
    )
  );

CREATE POLICY "Enable delete for service role" ON users
  FOR DELETE USING (
    -- Allow service role to delete users
    auth.role() = 'service_role' OR
    -- Allow admins to delete users
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'Super Admin'
    )
  );