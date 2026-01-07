-- Add description column to certifications table for custom descriptions
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS description text;