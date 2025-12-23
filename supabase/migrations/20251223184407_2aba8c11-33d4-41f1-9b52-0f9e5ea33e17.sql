-- Create storage bucket for resume
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resume', 'resume', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to resume
CREATE POLICY "Resume is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resume');

-- Only owners can upload/update resume
CREATE POLICY "Owners can upload resume" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resume' AND has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update resume" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'resume' AND has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete resume" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resume' AND has_role(auth.uid(), 'owner'::app_role));

-- Add resume_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS resume_url text;