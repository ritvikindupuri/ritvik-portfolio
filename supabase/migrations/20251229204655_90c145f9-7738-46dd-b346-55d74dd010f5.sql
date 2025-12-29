-- Create a table to store threat detection thresholds (owner-only)
CREATE TABLE public.threat_detection_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Brute Force thresholds
  brute_force_window_minutes integer NOT NULL DEFAULT 60,
  brute_force_min_failures integer NOT NULL DEFAULT 5,
  -- Password Guessing thresholds
  password_guessing_min_failures integer NOT NULL DEFAULT 3,
  -- Password Spraying thresholds
  spray_window_minutes integer NOT NULL DEFAULT 30,
  spray_min_distinct_accounts integer NOT NULL DEFAULT 5,
  spray_min_total_failures integer NOT NULL DEFAULT 8,
  spray_max_failures_per_account integer NOT NULL DEFAULT 2,
  -- Valid Accounts thresholds
  valid_accounts_min_locations integer NOT NULL DEFAULT 3,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.threat_detection_settings ENABLE ROW LEVEL SECURITY;

-- Owner can view
CREATE POLICY "Owners can view threat settings"
  ON public.threat_detection_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Owner can insert
CREATE POLICY "Owners can insert threat settings"
  ON public.threat_detection_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Owner can update
CREATE POLICY "Owners can update threat settings"
  ON public.threat_detection_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_threat_detection_settings_updated_at
  BEFORE UPDATE ON public.threat_detection_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.threat_detection_settings (
  brute_force_window_minutes,
  brute_force_min_failures,
  password_guessing_min_failures,
  spray_window_minutes,
  spray_min_distinct_accounts,
  spray_min_total_failures,
  spray_max_failures_per_account,
  valid_accounts_min_locations
) VALUES (60, 5, 3, 30, 5, 8, 2, 3);