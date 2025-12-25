-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to relevant roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move vector extension from public to extensions schema
-- First drop from public, then create in extensions
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Update the match_portfolio_content function to use the new schema
CREATE OR REPLACE FUNCTION public.match_portfolio_content(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 10)
 RETURNS TABLE(content_type text, content_id uuid, content_text text, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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
    
    -- Search GitHub content
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