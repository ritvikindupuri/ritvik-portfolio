
CREATE TABLE public.waf_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  reason text,
  waf_mode text NOT NULL DEFAULT 'preflight',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.waf_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (client-side logging)
CREATE POLICY "Anyone can log waf events" ON public.waf_events
  FOR INSERT WITH CHECK (true);

-- Only owners can view
CREATE POLICY "Owners can view waf events" ON public.waf_events
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

-- Only owners can delete
CREATE POLICY "Owners can delete waf events" ON public.waf_events
  FOR DELETE USING (public.has_role(auth.uid(), 'owner'));
