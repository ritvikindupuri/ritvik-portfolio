-- Create table for historical risk score tracking
CREATE TABLE public.risk_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL,
  summary TEXT,
  factors TEXT[],
  recommendation TEXT,
  login_attempts_total INTEGER DEFAULT 0,
  login_attempts_failed INTEGER DEFAULT 0,
  threats_count INTEGER DEFAULT 0,
  threats_high_severity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_score_history ENABLE ROW LEVEL SECURITY;

-- Only owners can view risk score history
CREATE POLICY "Owners can view risk score history" 
ON public.risk_score_history 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Service role can insert risk scores (from edge function)
CREATE POLICY "Service role can insert risk scores" 
ON public.risk_score_history 
FOR INSERT 
WITH CHECK (true);

-- Owners can delete old risk score history
CREATE POLICY "Owners can delete risk score history" 
ON public.risk_score_history 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create index for efficient time-based queries
CREATE INDEX idx_risk_score_history_created_at ON public.risk_score_history(created_at DESC);