-- Create storage bucket for incident report photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-reports',
  'incident-reports',
  true, -- Public bucket so photos can be viewed in dashboard
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create RLS policies for the storage bucket
CREATE POLICY "Guards can upload incident photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'incident-reports' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Public can view incident photos" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'incident-reports');

CREATE POLICY "Guards can delete their own photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'incident-reports' 
  AND auth.uid() IS NOT NULL
);