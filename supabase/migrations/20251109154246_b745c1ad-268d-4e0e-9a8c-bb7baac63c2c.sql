-- Add display_order column to all content tables for custom ordering
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.documentation ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON public.projects(display_order);
CREATE INDEX IF NOT EXISTS idx_skills_display_order ON public.skills(display_order);
CREATE INDEX IF NOT EXISTS idx_documentation_display_order ON public.documentation(display_order);
CREATE INDEX IF NOT EXISTS idx_experience_display_order ON public.experience(display_order);
CREATE INDEX IF NOT EXISTS idx_certifications_display_order ON public.certifications(display_order);