-- Create llm_projects table for AI Engineering / LLM Systems section
CREATE TABLE public.llm_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_type TEXT,
  llm_provider TEXT,
  use_case TEXT,
  technologies TEXT[] DEFAULT '{}'::text[],
  github_url TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.llm_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "LLM projects are viewable by everyone"
ON public.llm_projects
FOR SELECT
USING (true);

CREATE POLICY "Owners can insert llm_projects"
ON public.llm_projects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update llm_projects"
ON public.llm_projects
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete llm_projects"
ON public.llm_projects
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));