-- Create table to store indexed GitHub content
CREATE TABLE public.github_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'skill', 'ml_model', 'llm_project', 'project'
  source_id UUID NOT NULL,
  github_url TEXT NOT NULL,
  repo_name TEXT,
  content_text TEXT,
  embedding vector(1536),
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_type, source_id, github_url)
);

-- Enable RLS
ALTER TABLE public.github_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read (for chatbot queries)
CREATE POLICY "GitHub content is viewable by everyone"
ON public.github_content FOR SELECT
USING (true);

-- Only owners can manage
CREATE POLICY "Owners can insert github_content"
ON public.github_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update github_content"
ON public.github_content FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete github_content"
ON public.github_content FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create index for vector search
CREATE INDEX github_content_embedding_idx ON public.github_content 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update match_portfolio_content to include GitHub content
CREATE OR REPLACE FUNCTION public.match_portfolio_content(query_embedding vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 10)
 RETURNS TABLE(content_type text, content_id uuid, content_text text, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  (
    -- Search documentation
    SELECT 
      'documentation'::text as content_type,
      d.id as content_id,
      concat('Documentation: ', d.title, ' - ', d.description) as content_text,
      1 - (d.embedding <=> query_embedding) as similarity
    FROM documentation d
    WHERE d.embedding IS NOT NULL
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search projects
    SELECT 
      'project'::text,
      p.id,
      concat('Project: ', p.title, ' - ', p.description, ' Technologies: ', array_to_string(p.technologies, ', ')),
      1 - (p.embedding <=> query_embedding)
    FROM projects p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search skills
    SELECT 
      'skill'::text,
      s.id,
      concat('Skill: ', s.name, ' (', s.level, ') - ', s.category, ': ', COALESCE(s.description, '')),
      1 - (s.embedding <=> query_embedding)
    FROM skills s
    WHERE s.embedding IS NOT NULL
      AND 1 - (s.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search experience
    SELECT 
      'experience'::text,
      e.id,
      concat('Experience: ', e.title, ' at ', e.company, ' - ', array_to_string(e.description, ' ')),
      1 - (e.embedding <=> query_embedding)
    FROM experience e
    WHERE e.embedding IS NOT NULL
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search ML models
    SELECT 
      'ml_model'::text,
      m.id,
      concat('ML Model: ', m.title, ' - ', m.description, ' Framework: ', COALESCE(m.framework, '')),
      1 - (m.embedding <=> query_embedding)
    FROM ml_models m
    WHERE m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search LLM projects
    SELECT 
      'llm_project'::text,
      l.id,
      concat('LLM Project: ', l.title, ' - ', l.description, ' Provider: ', COALESCE(l.llm_provider, '')),
      1 - (l.embedding <=> query_embedding)
    FROM llm_projects l
    WHERE l.embedding IS NOT NULL
      AND 1 - (l.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search certifications
    SELECT 
      'certification'::text,
      c.id,
      concat('Certification: ', c.name, ' by ', c.issuer),
      1 - (c.embedding <=> query_embedding)
    FROM certifications c
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Search GitHub content (NEW)
    SELECT 
      'github_content'::text,
      g.id,
      concat('GitHub Repo (', g.repo_name, '): ', g.content_text),
      1 - (g.embedding <=> query_embedding)
    FROM github_content g
    WHERE g.embedding IS NOT NULL
      AND 1 - (g.embedding <=> query_embedding) > match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;