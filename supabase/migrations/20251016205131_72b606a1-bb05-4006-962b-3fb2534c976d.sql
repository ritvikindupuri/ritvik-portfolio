-- Add missing columns to skills table for level, description, and link
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Intermediate',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS link TEXT;