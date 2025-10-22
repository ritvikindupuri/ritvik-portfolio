-- Add category field to projects table to track which section project belongs to
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category text;

-- Add start_date and end_date fields to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date text;