-- Patrol Performance System Schema
-- Comprehensive tracking system to prevent gaming and maximize guard effectiveness

-- Table for configurable patrol requirements per route
CREATE TABLE IF NOT EXISTS patrol_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  route_id uuid NOT NULL REFERENCES patrol_routes(id),
  shift_duration_hours integer NOT NULL, -- 8, 12, etc.
  required_patrols_per_shift integer NOT NULL,
  min_time_between_patrols_minutes integer DEFAULT 60, -- Prevent speed-running
  max_time_between_patrols_minutes integer DEFAULT 180, -- Ensure distribution
  required_photos_per_checkpoint integer DEFAULT 1,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(route_id, shift_duration_hours)
);

-- Enhanced patrol performance metrics
CREATE TABLE IF NOT EXISTS patrol_performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id uuid NOT NULL REFERENCES users(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  shift_date date NOT NULL,
  shift_start timestamp with time zone NOT NULL,
  shift_end timestamp with time zone,
  shift_duration_hours numeric,
  
  -- Basic compliance metrics
  required_patrols integer NOT NULL DEFAULT 0,
  completed_patrols integer NOT NULL DEFAULT 0,
  compliance_rate numeric GENERATED ALWAYS AS (
    CASE WHEN required_patrols > 0 
    THEN ROUND((completed_patrols::numeric / required_patrols::numeric) * 100, 2)
    ELSE 0 END
  ) STORED,
  
  -- Quality metrics
  total_checkpoints_required integer NOT NULL DEFAULT 0,
  total_checkpoints_completed integer NOT NULL DEFAULT 0,
  checkpoint_completion_rate numeric GENERATED ALWAYS AS (
    CASE WHEN total_checkpoints_required > 0 
    THEN ROUND((total_checkpoints_completed::numeric / total_checkpoints_required::numeric) * 100, 2)
    ELSE 0 END
  ) STORED,
  
  photos_required integer NOT NULL DEFAULT 0,
  photos_taken integer NOT NULL DEFAULT 0,
  photo_compliance_rate numeric GENERATED ALWAYS AS (
    CASE WHEN photos_required > 0 
    THEN ROUND((photos_taken::numeric / photos_required::numeric) * 100, 2)
    ELSE 0 END
  ) STORED,
  
  -- Distribution metrics (prevent front-loading)
  patrol_distribution_score numeric DEFAULT 0, -- 0-100 score
  longest_gap_between_patrols_minutes integer DEFAULT 0,
  
  -- Proactive behavior metrics
  extra_patrols_completed integer DEFAULT 0,
  incidents_reported integer DEFAULT 0,
  proactive_score numeric DEFAULT 0, -- Bonus points for exceeding requirements
  
  -- Overall performance score (calculated from base columns, not generated columns)
  overall_performance_score numeric GENERATED ALWAYS AS (
    CASE WHEN required_patrols > 0 THEN
      ROUND(
        ((CASE WHEN required_patrols > 0 
          THEN (completed_patrols::numeric / required_patrols::numeric) * 100
          ELSE 0 END) * 0.3) + -- 30% compliance
        ((CASE WHEN total_checkpoints_required > 0 
          THEN (total_checkpoints_completed::numeric / total_checkpoints_required::numeric) * 100
          ELSE 0 END) * 0.25) + -- 25% checkpoint quality  
        ((CASE WHEN photos_required > 0 
          THEN (photos_taken::numeric / photos_required::numeric) * 100
          ELSE 0 END) * 0.15) + -- 15% photo compliance
        (patrol_distribution_score * 0.2) + -- 20% time distribution
        (proactive_score * 0.1), -- 10% proactive behavior
        2
      )
    ELSE 0 END
  ) STORED,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(guard_id, shift_date)
);

-- Patrol timing analysis for distribution scoring
CREATE TABLE IF NOT EXISTS patrol_timing_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  performance_metric_id uuid NOT NULL REFERENCES patrol_performance_metrics(id),
  patrol_id uuid NOT NULL REFERENCES patrols(id),
  patrol_sequence_number integer NOT NULL, -- 1st, 2nd, 3rd patrol of shift
  time_since_shift_start_minutes integer NOT NULL,
  time_since_previous_patrol_minutes integer,
  expected_patrol_time_minutes integer, -- Based on even distribution
  timing_deviation_score numeric, -- How far from expected timing
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patrol_requirements_route_duration 
ON patrol_requirements(route_id, shift_duration_hours);

CREATE INDEX IF NOT EXISTS idx_patrol_performance_guard_date 
ON patrol_performance_metrics(guard_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_patrol_performance_org_date 
ON patrol_performance_metrics(organization_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_patrol_timing_performance 
ON patrol_timing_analysis(performance_metric_id);

-- Sample patrol requirements (can be configured by admins)
INSERT INTO patrol_requirements (organization_id, route_id, shift_duration_hours, required_patrols_per_shift, min_time_between_patrols_minutes, max_time_between_patrols_minutes, required_photos_per_checkpoint)
SELECT 
  o.id as organization_id,
  pr.id as route_id,
  8 as shift_duration_hours,
  4 as required_patrols_per_shift, -- 4 patrols per 8-hour shift
  90 as min_time_between_patrols_minutes, -- At least 1.5 hours between patrols
  150 as max_time_between_patrols_minutes, -- No more than 2.5 hours between patrols
  2 as required_photos_per_checkpoint -- 2 photos per checkpoint
FROM organizations o
CROSS JOIN patrol_routes pr
WHERE pr.organization_id = o.id
AND pr.is_active = true
ON CONFLICT (route_id, shift_duration_hours) DO NOTHING;

-- Views for easy reporting
CREATE OR REPLACE VIEW patrol_performance_summary AS
SELECT 
  ppm.*,
  u.first_name,
  u.last_name,
  u.first_name || ' ' || u.last_name as guard_name,
  pr.name as route_name,
  preq.required_patrols_per_shift as configured_requirement,
  CASE 
    WHEN ppm.overall_performance_score >= 90 THEN 'Excellent'
    WHEN ppm.overall_performance_score >= 80 THEN 'Good'
    WHEN ppm.overall_performance_score >= 70 THEN 'Satisfactory'
    WHEN ppm.overall_performance_score >= 60 THEN 'Needs Improvement'
    ELSE 'Poor'
  END as performance_rating
FROM patrol_performance_metrics ppm
JOIN users u ON ppm.guard_id = u.id
LEFT JOIN patrols p ON p.guard_id = ppm.guard_id AND DATE(p.start_time) = ppm.shift_date
LEFT JOIN patrol_routes pr ON p.route_id = pr.id  
LEFT JOIN patrol_requirements preq ON pr.id = preq.route_id 
  AND preq.shift_duration_hours = ROUND(ppm.shift_duration_hours);