-- Add embedding columns to all content tables for semantic search

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to documentation table
ALTER TABLE public.documentation 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to skills table
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to experience table
ALTER TABLE public.experience 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to ml_models table
ALTER TABLE public.ml_models 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to llm_projects table
ALTER TABLE public.llm_projects 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add embedding column to certifications table
ALTER TABLE public.certifications 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create indexes for faster similarity search
CREATE INDEX IF NOT EXISTS idx_documentation_embedding ON public.documentation USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_projects_embedding ON public.projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_skills_embedding ON public.skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_experience_embedding ON public.experience USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_ml_models_embedding ON public.ml_models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_llm_projects_embedding ON public.llm_projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_certifications_embedding ON public.certifications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);