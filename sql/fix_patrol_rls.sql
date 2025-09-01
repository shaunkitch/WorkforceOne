-- Fix RLS policies for patrol creation
-- Add missing INSERT policy for patrols table

-- Add INSERT policy for patrols - allow supervisors and users with patrol management permission
CREATE POLICY "Users can create patrols for their organization" ON patrols
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization_id() 
    AND user_has_permission('patrols', 'create')
  );

-- Also add a specific policy for patrol assignment - allow creating patrols within organization
CREATE POLICY "Supervisors can assign patrols to guards" ON patrols
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization_id() 
    AND (
      user_has_permission('patrols', 'manage') OR 
      user_has_permission('patrols', 'assign') OR
      user_has_permission('patrols', 'create')
    )
  );