-- Create sites table for location management (must be created first as it's referenced)
CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 100, -- Geofencing radius
  qr_mode VARCHAR(20) DEFAULT 'static' CHECK (qr_mode IN ('static', 'random')),
  require_gps_validation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shift_attendance table for tracking guard check-ins/check-outs
CREATE TABLE IF NOT EXISTS shift_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('check_in', 'check_out')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  qr_code_id VARCHAR(100),
  qr_code_type VARCHAR(20) CHECK (qr_code_type IN ('static', 'random')),
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shift_attendance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON shift_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON shift_attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_shift_type ON shift_attendance(shift_type);

-- Create qr_codes table for managing QR codes
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('static', 'random')),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for qr_codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);

-- Create attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID DEFAULT gen_random_uuid(), -- For multi-tenant support
  qr_rotation_hours INTEGER DEFAULT 24, -- How often to rotate random QR codes
  gps_accuracy_required INTEGER DEFAULT 50, -- Required GPS accuracy in meters
  check_in_window_minutes INTEGER DEFAULT 15, -- Grace period for check-in
  enable_geofencing BOOLEAN DEFAULT true,
  enable_facial_recognition BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shift_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_attendance
CREATE POLICY "Users can view their own attendance" ON shift_attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance" ON shift_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Users can insert their own attendance" ON shift_attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for qr_codes
CREATE POLICY "Anyone can view active QR codes" ON qr_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage QR codes" ON qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for sites
CREATE POLICY "Anyone can view sites" ON sites
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sites" ON sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Function to validate GPS location against site
CREATE OR REPLACE FUNCTION validate_gps_location(
  site_id UUID,
  check_lat DOUBLE PRECISION,
  check_lng DOUBLE PRECISION
) RETURNS BOOLEAN AS $$
DECLARE
  site_record RECORD;
  distance DOUBLE PRECISION;
BEGIN
  SELECT * INTO site_record FROM sites WHERE id = site_id;
  
  IF site_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate distance using Haversine formula
  distance := (
    6371000 * acos(
      cos(radians(site_record.latitude)) * 
      cos(radians(check_lat)) * 
      cos(radians(check_lng) - radians(site_record.longitude)) + 
      sin(radians(site_record.latitude)) * 
      sin(radians(check_lat))
    )
  );
  
  RETURN distance <= site_record.radius_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to get current shift status
CREATE OR REPLACE FUNCTION get_current_shift_status(user_uuid UUID)
RETURNS TABLE (
  is_checked_in BOOLEAN,
  last_action VARCHAR,
  last_timestamp TIMESTAMPTZ,
  duration_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH last_attendance AS (
    SELECT 
      shift_type,
      timestamp
    FROM shift_attendance
    WHERE user_id = user_uuid
    ORDER BY timestamp DESC
    LIMIT 1
  ),
  last_check_in AS (
    SELECT timestamp
    FROM shift_attendance
    WHERE user_id = user_uuid AND shift_type = 'check_in'
    ORDER BY timestamp DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(la.shift_type = 'check_in', FALSE) as is_checked_in,
    la.shift_type as last_action,
    la.timestamp as last_timestamp,
    CASE 
      WHEN la.shift_type = 'check_in' THEN 
        EXTRACT(EPOCH FROM (NOW() - la.timestamp)) / 3600
      ELSE NULL
    END as duration_hours
  FROM last_attendance la;
END;
$$ LANGUAGE plpgsql;