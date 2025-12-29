-- Create honeypot accounts table to track fake accounts that catch attackers
CREATE TABLE public.honeypot_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_triggered INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create honeypot triggers table to log all attempts
CREATE TABLE public.honeypot_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  honeypot_id UUID NOT NULL REFERENCES public.honeypot_accounts(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.honeypot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honeypot_triggers ENABLE ROW LEVEL SECURITY;

-- Owners can manage honeypot accounts
CREATE POLICY "Owners can view honeypot accounts" ON public.honeypot_accounts
  FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can insert honeypot accounts" ON public.honeypot_accounts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update honeypot accounts" ON public.honeypot_accounts
  FOR UPDATE USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete honeypot accounts" ON public.honeypot_accounts
  FOR DELETE USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can view honeypot triggers
CREATE POLICY "Owners can view honeypot triggers" ON public.honeypot_triggers
  FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role));

-- Service role can insert triggers (from edge function)
CREATE POLICY "Service role can insert honeypot triggers" ON public.honeypot_triggers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can delete honeypot triggers" ON public.honeypot_triggers
  FOR DELETE USING (has_role(auth.uid(), 'owner'::app_role));

-- Trigger to update honeypot_accounts when triggered
CREATE OR REPLACE FUNCTION public.update_honeypot_on_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.honeypot_accounts
  SET times_triggered = times_triggered + 1,
      last_triggered_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.honeypot_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_honeypot_trigger
  AFTER INSERT ON public.honeypot_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_honeypot_on_trigger();

-- Insert default honeypot accounts (common attack targets)
INSERT INTO public.honeypot_accounts (email, description) VALUES
  ('admin@portfolio.dev', 'Classic admin account - highest priority target'),
  ('root@portfolio.dev', 'Unix-style root account'),
  ('test@portfolio.dev', 'Test account attackers probe'),
  ('administrator@portfolio.dev', 'Windows-style admin'),
  ('webmaster@portfolio.dev', 'Legacy web admin account'),
  ('support@portfolio.dev', 'Support desk impersonation'),
  ('info@portfolio.dev', 'Generic info account'),
  ('user@portfolio.dev', 'Default user account'),
  ('demo@portfolio.dev', 'Demo/trial account');

-- Enable realtime for honeypot triggers
ALTER PUBLICATION supabase_realtime ADD TABLE public.honeypot_triggers;