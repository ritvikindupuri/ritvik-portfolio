-- Fix embedding dimension to match existing 768-dimension embeddings
ALTER TABLE public.github_content 
ALTER COLUMN embedding TYPE vector(768);