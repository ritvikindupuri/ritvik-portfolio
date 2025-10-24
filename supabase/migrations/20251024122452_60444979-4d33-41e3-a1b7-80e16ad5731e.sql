-- Create a public bucket for documentation files (id: documentation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documentation'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documentation', 'documentation', true);
  END IF;
END $$;

-- Allow public read access to files in the documentation bucket
CREATE POLICY "documentation_public_read_20251024"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentation');

-- Allow authenticated users to upload to the documentation bucket
CREATE POLICY "documentation_auth_insert_20251024"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentation');

-- Allow authenticated users to update their own files (first folder = user id)
CREATE POLICY "documentation_auth_update_own_20251024"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentation' AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documentation' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files (first folder = user id)
CREATE POLICY "documentation_auth_delete_own_20251024"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documentation' AND auth.uid()::text = (storage.foldername(name))[1]
);