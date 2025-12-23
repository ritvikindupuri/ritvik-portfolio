-- Create resumes table for multiple resume support
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Everyone can view resumes
CREATE POLICY "Resumes are viewable by everyone"
ON public.resumes
FOR SELECT
USING (true);

-- Only owners can insert resumes
CREATE POLICY "Owners can insert resumes"
ON public.resumes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can update resumes
CREATE POLICY "Owners can update resumes"
ON public.resumes
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can delete resumes
CREATE POLICY "Owners can delete resumes"
ON public.resumes
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_display_order ON public.resumes(display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();