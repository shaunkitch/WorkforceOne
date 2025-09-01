-- WorkforceOne Suite Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (Multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'basic',
  active_modules TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL,
  module TEXT NOT NULL, -- 'guard', 'attendance', 'rep'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Shared across all modules)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (Shared for all location-based features)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius INTEGER, -- meters
  location_type TEXT, -- 'checkpoint', 'outlet', 'site'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs (Unified tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  location_id UUID REFERENCES locations(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guard Module Tables

-- Patrol Routes
CREATE TABLE IF NOT EXISTS patrol_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  checkpoints UUID[] NOT NULL, -- Array of location IDs
  estimated_duration INTEGER, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patrols
CREATE TABLE IF NOT EXISTS patrols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES patrol_routes(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  checkpoints_completed INTEGER DEFAULT 0,
  total_checkpoints INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkpoint Visits
CREATE TABLE IF NOT EXISTS checkpoint_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id UUID REFERENCES patrols(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  guard_id UUID REFERENCES users(id),
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  verification_method TEXT, -- 'qr', 'nfc', 'manual'
  verification_data TEXT, -- QR code data, NFC tag ID, etc.
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  photos TEXT[], -- Array of photo URLs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id),
  location_id UUID REFERENCES locations(id),
  patrol_id UUID REFERENCES patrols(id), -- Optional: link to patrol if reported during patrol
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  attachments TEXT[], -- Array of file URLs
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guard Shifts
CREATE TABLE IF NOT EXISTS guard_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  break_time_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS Tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  altitude DECIMAL(8, 2),
  speed DECIMAL(6, 2), -- Speed in km/h
  heading DECIMAL(5, 2), -- Heading in degrees
  battery_level INTEGER, -- Battery percentage
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Panic Alerts
CREATE TABLE IF NOT EXISTS panic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  alert_type TEXT DEFAULT 'panic', -- 'panic', 'duress', 'man_down'
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'false_alarm'
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registration Tokens (for QR code, invite links, access codes)
CREATE TABLE IF NOT EXISTS registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL, -- 'qr', 'invite', 'access_code'
  role_id UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident Comments
CREATE TABLE IF NOT EXISTS incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patrols_guard_id ON patrols(guard_id);
CREATE INDEX IF NOT EXISTS idx_patrols_organization_id ON patrols(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_user_id ON gps_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_timestamp ON gps_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_user_id ON panic_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_status ON panic_alerts(status);

-- NOTE: Row Level Security (RLS) policies are now in 02_rls_policies.sql
-- Apply RLS policies after running this schema file

-- Insert default data

-- Default roles for Guard module
INSERT INTO roles (name, permissions, module) VALUES 
('Super Admin', '{"*": "*"}', 'guard'),
('Guard Supervisor', '{"patrols": ["read", "create", "update"], "incidents": ["read", "create", "update"], "reports": ["read"]}', 'guard'),
('Security Guard', '{"patrols": ["read", "update"], "incidents": ["read", "create"], "checkpoints": ["update"]}', 'guard'),
('Dispatcher', '{"patrols": ["read"], "incidents": ["read", "update"], "gps_tracking": ["read"]}', 'guard')
ON CONFLICT DO NOTHING;