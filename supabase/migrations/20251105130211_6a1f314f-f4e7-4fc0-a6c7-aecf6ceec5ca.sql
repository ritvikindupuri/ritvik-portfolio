-- Add featured projects fields to projects table
ALTER TABLE public.projects 
ADD COLUMN youtube_url text,
ADD COLUMN is_featured boolean DEFAULT false;