-- Create table to track visitor activity
CREATE TABLE public.visitor_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  email TEXT,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_activity ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visitor activity (for tracking)
CREATE POLICY "Anyone can log visitor activity" 
ON public.visitor_activity 
FOR INSERT 
WITH CHECK (true);

-- Only owners can view visitor activity
CREATE POLICY "Owners can view visitor activity" 
ON public.visitor_activity 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can delete visitor activity
CREATE POLICY "Owners can delete visitor activity" 
ON public.visitor_activity 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_visitor_activity_session ON public.visitor_activity(session_id);
CREATE INDEX idx_visitor_activity_created_at ON public.visitor_activity(created_at DESC);