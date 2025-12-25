-- Create table for known/trusted login locations
CREATE TABLE public.known_login_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  city TEXT,
  country TEXT,
  country_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_seen INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.known_login_locations ENABLE ROW LEVEL SECURITY;

-- Only owners can view and manage known locations
CREATE POLICY "Owners can view known locations"
ON public.known_login_locations
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can insert known locations"
ON public.known_login_locations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update known locations"
ON public.known_login_locations
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete known locations"
ON public.known_login_locations
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Also allow service role (edge functions) to insert/update
CREATE POLICY "Service role can manage known locations"
ON public.known_login_locations
FOR ALL
USING (true)
WITH CHECK (true);