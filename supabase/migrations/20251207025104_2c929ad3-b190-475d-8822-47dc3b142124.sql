-- Add upload_date column to documentation table
ALTER TABLE public.documentation 
ADD COLUMN upload_date text;