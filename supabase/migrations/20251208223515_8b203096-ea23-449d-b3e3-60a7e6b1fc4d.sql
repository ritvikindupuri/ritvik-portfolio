-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to documentation table for RAG
ALTER TABLE public.documentation 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS documentation_embedding_idx 
ON public.documentation 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS projects_embedding_idx 
ON public.projects 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to skills table
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS skills_embedding_idx 
ON public.skills 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to experience table
ALTER TABLE public.experience 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS experience_embedding_idx 
ON public.experience 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to ml_models table
ALTER TABLE public.ml_models 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS ml_models_embedding_idx 
ON public.ml_models 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to llm_projects table
ALTER TABLE public.llm_projects 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS llm_projects_embedding_idx 
ON public.llm_projects 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Add embedding column to certifications table
ALTER TABLE public.certifications 
ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS certifications_embedding_idx 
ON public.certifications 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Create a function for semantic search across all portfolio content
CREATE OR REPLACE FUNCTION public.match_portfolio_content(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  content_type text,
  content_id uuid,
  content_text text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Drop upload_date column from documentation (user requested removal)
ALTER TABLE public.documentation DROP COLUMN IF EXISTS upload_date;