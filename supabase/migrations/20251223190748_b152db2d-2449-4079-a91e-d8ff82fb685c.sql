-- Create login_attempts table for tracking and rate limiting
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert login attempts (for logging)
CREATE POLICY "Anyone can log login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Only owners can view login attempts
CREATE POLICY "Owners can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can delete login attempts
CREATE POLICY "Owners can delete login attempts"
ON public.login_attempts
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);