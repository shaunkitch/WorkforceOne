-- Create backup_requests table
CREATE TABLE IF NOT EXISTS backup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patrol_id UUID REFERENCES patrols(id) ON DELETE SET NULL,
  emergency_type TEXT NOT NULL DEFAULT 'backup_request',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  closest_checkpoint_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  distance_to_checkpoint INTEGER, -- distance in meters (rounded)
  notes TEXT,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  response_time TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_requests_organization_id ON backup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_backup_requests_guard_id ON backup_requests(guard_id);
CREATE INDEX IF NOT EXISTS idx_backup_requests_status ON backup_requests(status);
CREATE INDEX IF NOT EXISTS idx_backup_requests_created_at ON backup_requests(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_backup_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_backup_requests_updated_at ON backup_requests;
CREATE TRIGGER trigger_backup_requests_updated_at
  BEFORE UPDATE ON backup_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE backup_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view backup requests for their organization"
  ON backup_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
  
CREATE POLICY "Users can create backup requests for their organization"
  ON backup_requests FOR INSERT
  WITH CHECK (
    guard_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
  
CREATE POLICY "Admin users can update backup requests"
  ON backup_requests FOR UPDATE
  USING (
    organization_id IN (
      SELECT u.organization_id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('Super Admin', 'Guard Supervisor')
    )
  );