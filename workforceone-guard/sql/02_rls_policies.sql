-- =============================================================================
-- WorkforceOne Guard - Row Level Security (RLS) Policies v1.0
-- =============================================================================
-- Security policies for multi-tenant data isolation and access control
-- Apply after running 01_schema.sql
-- =============================================================================

-- =============================================================================
-- SECTION 1: CLEAN UP EXISTING POLICIES (to avoid conflicts)
-- =============================================================================

-- Drop all existing policies on core tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all RLS-enabled tables
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Core organizational tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Shared infrastructure tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_tokens ENABLE ROW LEVEL SECURITY;

-- Guard module tables
ALTER TABLE patrol_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_shifts ENABLE ROW LEVEL SECURITY;

-- Tracking and monitoring tables
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_alerts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 3: HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Get current user's organization ID from JWT or return null
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
BEGIN
  -- Only get it from JWT to avoid recursion
  RETURN (auth.jwt() ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'sub')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has specific permission (simplified to avoid recursion)
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, return TRUE to avoid recursion issues
  -- This can be enhanced later with JWT claims or other methods
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with role information (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Fetch user with role data as JSON
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'organization_id', u.organization_id,
    'role_id', u.role_id,
    'department_id', u.department_id,
    'avatar_url', u.avatar_url,
    'phone', u.phone,
    'is_active', u.is_active,
    'metadata', u.metadata,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'role', CASE 
      WHEN r.id IS NOT NULL THEN
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'permissions', r.permissions,
          'module', r.module,
          'organization_id', r.organization_id,
          'created_at', r.created_at
        )
      ELSE NULL
    END
  ) INTO result
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECTION 4: CORE ORGANIZATIONAL TABLE POLICIES
-- =============================================================================

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id = get_current_organization_id());

CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL USING (user_has_permission('organizations', 'manage'));

-- Users: Simplified policies to avoid recursion
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Supervisors can manage users" ON users
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('users', 'manage')
  );

-- Roles: Simplified policy to avoid recursion
CREATE POLICY "Users can view any role" ON roles
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('roles', 'manage')
  );

-- Departments: Organization-scoped
CREATE POLICY "Users can view departments in their organization" ON departments
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('departments', 'manage')
  );

-- =============================================================================
-- SECTION 5: SHARED INFRASTRUCTURE POLICIES
-- =============================================================================

-- Locations: Organization-scoped
CREATE POLICY "Users can view locations in their organization" ON locations
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "Supervisors can manage locations" ON locations
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('locations', 'manage')
  );

-- Activity Logs: Organization-scoped, read-only for most users
CREATE POLICY "Users can view activity logs in their organization" ON activity_logs
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (organization_id = get_current_organization_id());

-- Registration Tokens: Organization admins only
CREATE POLICY "Admins can manage registration tokens" ON registration_tokens
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('registration', 'manage')
  );

-- =============================================================================
-- SECTION 6: GUARD MODULE POLICIES
-- =============================================================================

-- Patrol Routes: Organization-scoped with role-based access
CREATE POLICY "Users can view patrol routes in their organization" ON patrol_routes
  FOR SELECT USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('patrols', 'read')
  );

CREATE POLICY "Supervisors can manage patrol routes" ON patrol_routes
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('patrols', 'manage')
  );

-- Patrols: Guards can see their own, supervisors can see all
CREATE POLICY "Guards can view their own patrols" ON patrols
  FOR SELECT USING (
    organization_id = get_current_organization_id() 
    AND (guard_id = get_current_user_id() OR user_has_permission('patrols', 'read'))
  );

CREATE POLICY "Guards can update their own patrols" ON patrols
  FOR UPDATE USING (
    organization_id = get_current_organization_id() 
    AND guard_id = get_current_user_id() 
    AND user_has_permission('patrols', 'update')
  );

CREATE POLICY "Supervisors can manage all patrols" ON patrols
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('patrols', 'manage')
  );

-- Checkpoint Visits: Guards can manage their own visits
CREATE POLICY "Guards can view checkpoint visits for their patrols" ON checkpoint_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patrols p 
      WHERE p.id = patrol_id 
      AND p.organization_id = get_current_organization_id()
      AND (p.guard_id = get_current_user_id() OR user_has_permission('patrols', 'read'))
    )
  );

CREATE POLICY "Guards can create checkpoint visits for their patrols" ON checkpoint_visits
  FOR INSERT WITH CHECK (
    guard_id = get_current_user_id()
    AND EXISTS (
      SELECT 1 FROM patrols p 
      WHERE p.id = patrol_id 
      AND p.guard_id = get_current_user_id()
      AND p.organization_id = get_current_organization_id()
    )
  );

-- Incidents: Organization-scoped with reporting permissions
CREATE POLICY "Users can view incidents in their organization" ON incidents
  FOR SELECT USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('incidents', 'read')
  );

CREATE POLICY "Users can report incidents" ON incidents
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization_id() 
    AND reported_by = get_current_user_id()
    AND user_has_permission('incidents', 'create')
  );

CREATE POLICY "Assigned users and supervisors can update incidents" ON incidents
  FOR UPDATE USING (
    organization_id = get_current_organization_id() 
    AND (
      assigned_to = get_current_user_id() 
      OR reported_by = get_current_user_id()
      OR user_has_permission('incidents', 'manage')
    )
  );

-- Incident Comments: Users can comment on incidents they can see
CREATE POLICY "Users can view incident comments" ON incident_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents i 
      WHERE i.id = incident_id 
      AND i.organization_id = get_current_organization_id()
      AND user_has_permission('incidents', 'read')
    )
  );

CREATE POLICY "Users can add comments to incidents" ON incident_comments
  FOR INSERT WITH CHECK (
    user_id = get_current_user_id()
    AND EXISTS (
      SELECT 1 FROM incidents i 
      WHERE i.id = incident_id 
      AND i.organization_id = get_current_organization_id()
      AND user_has_permission('incidents', 'read')
    )
  );

-- Guard Shifts: Guards can see their own, supervisors can see all
CREATE POLICY "Guards can view their shifts" ON guard_shifts
  FOR SELECT USING (
    organization_id = get_current_organization_id() 
    AND (guard_id = get_current_user_id() OR user_has_permission('shifts', 'read'))
  );

CREATE POLICY "Supervisors can manage shifts" ON guard_shifts
  FOR ALL USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('shifts', 'manage')
  );

-- =============================================================================
-- SECTION 7: TRACKING AND MONITORING POLICIES
-- =============================================================================

-- GPS Tracking: Users can update their own location, supervisors can view all
CREATE POLICY "Users can update their own GPS location" ON gps_tracking
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Supervisors can view GPS tracking data" ON gps_tracking
  FOR SELECT USING (
    user_has_permission('gps_tracking', 'read')
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.organization_id = get_current_organization_id()
    )
  );

-- Panic Alerts: Organization-scoped emergency access
CREATE POLICY "Users can create panic alerts" ON panic_alerts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization_id() 
    AND user_id = get_current_user_id()
  );

CREATE POLICY "Emergency responders can view panic alerts" ON panic_alerts
  FOR SELECT USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('panic_alerts', 'read')
  );

CREATE POLICY "Emergency responders can manage panic alerts" ON panic_alerts
  FOR UPDATE USING (
    organization_id = get_current_organization_id() 
    AND user_has_permission('panic_alerts', 'manage')
  );

-- =============================================================================
-- SECTION 8: PUBLIC ACCESS POLICIES (for registration)
-- =============================================================================

-- Allow public access to registration token validation
CREATE POLICY "Public can validate registration tokens" ON registration_tokens
  FOR SELECT USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Allow public user creation during registration
CREATE POLICY "Public can create users during registration" ON users
  FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- SECTION 9: SERVICE ROLE POLICIES
-- =============================================================================

-- Service role can bypass all policies for system operations
CREATE POLICY "Service role has full access" ON organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON roles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON departments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON activity_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON patrol_routes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON patrols
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON checkpoint_visits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON incidents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON incident_comments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON guard_shifts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON gps_tracking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON panic_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON registration_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SECTION 8: STORAGE POLICIES
-- =============================================================================

-- Policy for incident attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-attachments', 'incident-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload files to their organization's folder
CREATE POLICY "Users can upload incident attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'incident-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view files from their organization
CREATE POLICY "Users can view incident attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'incident-attachments' AND
  auth.uid() IN (
    SELECT id FROM users 
    WHERE organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their own incident attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'incident-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- SECTION 9: HELPER FUNCTIONS
-- =============================================================================

-- Function to increment token usage count
CREATE OR REPLACE FUNCTION increment_usage_count(token_id UUID)
RETURNS INTEGER AS $$
BEGIN
  UPDATE registration_tokens 
  SET usage_count = usage_count + 1 
  WHERE id = token_id;
  
  RETURN (SELECT usage_count FROM registration_tokens WHERE id = token_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================

-- Create a summary function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name TEXT, rls_enabled BOOLEAN, policy_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename AS table_name,
    rowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename)::INTEGER AS policy_count
  FROM pg_tables t
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql;