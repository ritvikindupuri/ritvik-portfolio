-- Add expiration_date column to certifications table
ALTER TABLE public.certifications 
ADD COLUMN IF NOT EXISTS expiration_date date;