-- Create table to persist rate limit violations for dashboard visibility
CREATE TABLE public.rate_limit_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  violation_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_violation_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  city TEXT,
  country TEXT,
  country_code TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for IP + endpoint combination
CREATE UNIQUE INDEX idx_rate_limit_violations_ip_endpoint ON public.rate_limit_violations (ip_address, endpoint);

-- Create index for querying active violations
CREATE INDEX idx_rate_limit_violations_active ON public.rate_limit_violations (is_blocked, last_violation_at DESC);

-- Enable Row Level Security
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Owners can view rate limit violations
CREATE POLICY "Owners can view rate limit violations"
ON public.rate_limit_violations
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can delete rate limit violations
CREATE POLICY "Owners can delete rate limit violations"
ON public.rate_limit_violations
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can update rate limit violations (for marking as blocked)
CREATE POLICY "Owners can update rate limit violations"
ON public.rate_limit_violations
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Service role can manage rate limit violations (for edge functions)
CREATE POLICY "Service role can manage rate limit violations"
ON public.rate_limit_violations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_rate_limit_violations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rate_limit_violations_updated_at
BEFORE UPDATE ON public.rate_limit_violations
FOR EACH ROW
EXECUTE FUNCTION public.update_rate_limit_violations_updated_at();