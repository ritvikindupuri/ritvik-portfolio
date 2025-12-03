-- Add project_links column to skills table for multiple GitHub project links
ALTER TABLE public.skills 
ADD COLUMN project_links jsonb DEFAULT '[]'::jsonb;

-- Migrate existing single link to project_links array if link exists
UPDATE public.skills 
SET project_links = jsonb_build_array(jsonb_build_object('name', 'Project', 'url', link))
WHERE link IS NOT NULL AND link != '';