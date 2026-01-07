-- Add embedding column to github_content table
ALTER TABLE public.github_content 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(768);

-- Create index for vector similarity search on github_content
CREATE INDEX IF NOT EXISTS github_content_embedding_idx 
ON public.github_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);