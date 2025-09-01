-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  settings JSONB DEFAULT '{
    "auto_logout_minutes": 30,
    "require_gps_for_checkin": true,
    "allow_offline_mode": false,
    "max_shift_hours": 12,
    "break_reminder_interval": 240
  }'::jsonb,
  system_settings JSONB DEFAULT '{
    "maintenance_mode": false,
    "registration_enabled": true,
    "max_failed_logins": 5,
    "session_timeout_minutes": 60,
    "backup_enabled": true,
    "email_notifications": true,
    "sms_notifications": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to organizations table if it already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'timezone') THEN
        ALTER TABLE public.organizations ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'address') THEN
        ALTER TABLE public.organizations ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'phone') THEN
        ALTER TABLE public.organizations ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'email') THEN
        ALTER TABLE public.organizations ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'settings') THEN
        ALTER TABLE public.organizations ADD COLUMN settings JSONB DEFAULT '{
            "auto_logout_minutes": 30,
            "require_gps_for_checkin": true,
            "allow_offline_mode": false,
            "max_shift_hours": 12,
            "break_reminder_interval": 240
        }'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'system_settings') THEN
        ALTER TABLE public.organizations ADD COLUMN system_settings JSONB DEFAULT '{
            "maintenance_mode": false,
            "registration_enabled": true,
            "max_failed_logins": 5,
            "session_timeout_minutes": 60,
            "backup_enabled": true,
            "email_notifications": true,
            "sms_notifications": false
        }'::jsonb;
    END IF;
END
$$;

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Add organization_id and role_id columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE public.users ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
        ALTER TABLE public.users ADD COLUMN role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department_id') THEN
        ALTER TABLE public.users ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);
CREATE INDEX IF NOT EXISTS idx_roles_organization ON public.roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_organization ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON public.roles;
DROP POLICY IF EXISTS "Users can view departments in their organization" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments in their organization" ON public.departments;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage their organization" ON public.organizations
  FOR ALL USING (
    id IN (
      SELECT u.organization_id FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND (r.name = 'Admin' OR r.name = 'Super Admin')
    )
  );

-- RLS Policies for roles
CREATE POLICY "Users can view roles in their organization" ON public.roles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage roles in their organization" ON public.roles
  FOR ALL USING (
    organization_id IN (
      SELECT u.organization_id FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND (r.name = 'Admin' OR r.name = 'Super Admin')
    )
  );

-- RLS Policies for departments
CREATE POLICY "Users can view departments in their organization" ON public.departments
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage departments in their organization" ON public.departments
  FOR ALL USING (
    organization_id IN (
      SELECT u.organization_id FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND (r.name = 'Admin' OR r.name = 'Super Admin')
    )
  );

-- Insert default organization (handle various column combinations)
DO $$
DECLARE
    has_timezone BOOLEAN;
    has_slug BOOLEAN;
    has_plan BOOLEAN;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'timezone') INTO has_timezone;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug') INTO has_slug;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan') INTO has_plan;
    
    -- Build dynamic insert based on available columns
    IF has_slug AND has_plan AND has_timezone THEN
        INSERT INTO public.organizations (id, name, slug, plan, timezone) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security', 'workforceone-security', 'basic', 'UTC')
        ON CONFLICT (id) DO NOTHING;
    ELSIF has_slug AND has_plan THEN
        INSERT INTO public.organizations (id, name, slug, plan) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security', 'workforceone-security', 'basic')
        ON CONFLICT (id) DO NOTHING;
    ELSIF has_slug AND has_timezone THEN
        INSERT INTO public.organizations (id, name, slug, timezone) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security', 'workforceone-security', 'UTC')
        ON CONFLICT (id) DO NOTHING;
    ELSIF has_slug THEN
        INSERT INTO public.organizations (id, name, slug) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security', 'workforceone-security')
        ON CONFLICT (id) DO NOTHING;
    ELSIF has_timezone THEN
        INSERT INTO public.organizations (id, name, timezone) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security', 'UTC')
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.organizations (id, name) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'WorkforceOne Security')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

-- Insert default roles for the default organization (handle module column)
DO $$
DECLARE
    has_module BOOLEAN;
BEGIN
    -- Check if module column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'module') INTO has_module;
    
    IF has_module THEN
        INSERT INTO public.roles (id, name, permissions, organization_id, module) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Super Admin', 
         '["manage_users", "view_users", "manage_roles", "view_reports", "manage_settings", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001', 'security'),
        ('00000000-0000-0000-0000-000000000002', 'Admin', 
         '["manage_users", "view_users", "manage_roles", "view_reports", "manage_settings", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001', 'security'),
        ('00000000-0000-0000-0000-000000000003', 'Security Guard', 
         '["view_attendance", "view_incidents", "view_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001', 'security'),
        ('00000000-0000-0000-0000-000000000004', 'Supervisor', 
         '["view_users", "view_reports", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001', 'security')
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.roles (id, name, permissions, organization_id) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Super Admin', 
         '["manage_users", "view_users", "manage_roles", "view_reports", "manage_settings", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002', 'Admin', 
         '["manage_users", "view_users", "manage_roles", "view_reports", "manage_settings", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000003', 'Security Guard', 
         '["view_attendance", "view_incidents", "view_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000004', 'Supervisor', 
         '["view_users", "view_reports", "view_attendance", "manage_attendance", "view_incidents", "manage_incidents", "view_patrols", "manage_patrols"]'::jsonb,
         '00000000-0000-0000-0000-000000000001')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

-- Insert default departments (handle description column)
DO $$
DECLARE
    has_description BOOLEAN;
BEGIN
    -- Check if description column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'description') INTO has_description;
    
    IF has_description THEN
        INSERT INTO public.departments (id, name, description, organization_id) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Security Operations', 'Main security operations and patrol management', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002', 'Administration', 'Administrative and management functions', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000003', 'Night Shift', 'Night time security operations', '00000000-0000-0000-0000-000000000001')
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.departments (id, name, organization_id) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Security Operations', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002', 'Administration', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000003', 'Night Shift', '00000000-0000-0000-0000-000000000001')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

-- Update existing users to have organization, role, and department
-- Since role column doesn't exist, assign Security Guard role to all users
UPDATE public.users 
SET 
  organization_id = '00000000-0000-0000-0000-000000000001',
  role_id = '00000000-0000-0000-0000-000000000003',
  department_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;