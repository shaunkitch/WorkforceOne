-- Create incident_reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patrol_id UUID REFERENCES patrols(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('security_breach', 'medical_emergency', 'fire_hazard', 'suspicious_activity', 'property_damage', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  incident_date TIMESTAMPTZ NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  closest_checkpoint_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs/paths
  witnesses JSONB DEFAULT '[]'::jsonb, -- Array of witness information
  actions_taken TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_organization_id ON incident_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_guard_id ON incident_reports(guard_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_type ON incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_date ON incident_reports(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_incident_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_incident_reports_updated_at ON incident_reports;
CREATE TRIGGER trigger_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_reports_updated_at();

-- Enable Row Level Security
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view incident reports for their organization" ON incident_reports;
DROP POLICY IF EXISTS "Users can create incident reports for their organization" ON incident_reports;
DROP POLICY IF EXISTS "Admin users can update incident reports" ON incident_reports;

CREATE POLICY "Users can view incident reports for their organization"
  ON incident_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
  
CREATE POLICY "Users can create incident reports for their organization"
  ON incident_reports FOR INSERT
  WITH CHECK (
    guard_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
  
CREATE POLICY "Admin users can update incident reports"
  ON incident_reports FOR UPDATE
  USING (
    organization_id IN (
      SELECT u.organization_id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('Super Admin', 'Guard Supervisor')
    ) OR
    guard_id = auth.uid() -- Allow guards to update their own reports
  );