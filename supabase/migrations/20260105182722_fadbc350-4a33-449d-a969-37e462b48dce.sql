-- Create geographic blocking rules table
CREATE TABLE public.geographic_blocking_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('block', 'flag')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_on_trigger BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.geographic_blocking_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for owner access only
CREATE POLICY "Only owners can view geographic rules"
  ON public.geographic_blocking_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'owner'
    )
  );

CREATE POLICY "Only owners can insert geographic rules"
  ON public.geographic_blocking_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'owner'
    )
  );

CREATE POLICY "Only owners can update geographic rules"
  ON public.geographic_blocking_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'owner'
    )
  );

CREATE POLICY "Only owners can delete geographic rules"
  ON public.geographic_blocking_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'owner'
    )
  );

-- Service role policy for edge functions
CREATE POLICY "Service role can manage geographic rules"
  ON public.geographic_blocking_rules
  FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_geo_rules_country_code ON public.geographic_blocking_rules(country_code);
CREATE INDEX idx_geo_rules_active ON public.geographic_blocking_rules(is_active);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.geographic_blocking_rules;