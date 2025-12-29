-- Create blocked IPs table
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL means permanent block
  honeypot_triggers INTEGER NOT NULL DEFAULT 0,
  last_honeypot_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Owners can view blocked IPs
CREATE POLICY "Owners can view blocked IPs"
  ON public.blocked_ips FOR SELECT
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can insert blocked IPs
CREATE POLICY "Owners can insert blocked IPs"
  ON public.blocked_ips FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Owners can update blocked IPs
CREATE POLICY "Owners can update blocked IPs"
  ON public.blocked_ips FOR UPDATE
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can delete blocked IPs
CREATE POLICY "Owners can delete blocked IPs"
  ON public.blocked_ips FOR DELETE
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Service role can manage blocked IPs (for edge functions)
CREATE POLICY "Service role can manage blocked IPs"
  ON public.blocked_ips FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for fast IP lookups
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_is_active ON public.blocked_ips(is_active);

-- Enable realtime for blocked IPs
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_ips;