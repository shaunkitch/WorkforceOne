-- Create gps_tracking table for location tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for GPS tracking
CREATE INDEX IF NOT EXISTS idx_gps_tracking_user_id ON gps_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_timestamp ON gps_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_location ON gps_tracking(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GPS tracking
CREATE POLICY "Users can view their own GPS data" ON gps_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all GPS data" ON gps_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Users can insert their own GPS data" ON gps_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get active users with recent GPS data
CREATE OR REPLACE FUNCTION get_active_users_with_gps(minutes_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  user_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  battery_level INTEGER,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_positions AS (
    SELECT DISTINCT ON (gt.user_id)
      gt.user_id,
      gt.latitude,
      gt.longitude,
      gt.accuracy,
      gt.altitude,
      gt.speed,
      gt.heading,
      gt.battery_level,
      gt.timestamp
    FROM gps_tracking gt
    WHERE gt.timestamp > NOW() - INTERVAL '1 minute' * minutes_threshold
    ORDER BY gt.user_id, gt.timestamp DESC
  )
  SELECT 
    lp.user_id,
    u.first_name,
    u.last_name,
    u.email,
    lp.latitude,
    lp.longitude,
    lp.accuracy,
    lp.altitude,
    lp.speed,
    lp.heading,
    lp.battery_level,
    lp.timestamp
  FROM latest_positions lp
  JOIN users u ON u.id = lp.user_id
  WHERE u.is_active = true
  ORDER BY lp.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;