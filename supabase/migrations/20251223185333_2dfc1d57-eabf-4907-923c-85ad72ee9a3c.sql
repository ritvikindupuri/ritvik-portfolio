-- Create resume_analytics table to track views/downloads
CREATE TABLE public.resume_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download')),
  viewer_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (to log views)
CREATE POLICY "Anyone can log resume views"
ON public.resume_analytics
FOR INSERT
WITH CHECK (true);

-- Only owners can view analytics
CREATE POLICY "Owners can view resume analytics"
ON public.resume_analytics
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can delete analytics
CREATE POLICY "Owners can delete resume analytics"
ON public.resume_analytics
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));