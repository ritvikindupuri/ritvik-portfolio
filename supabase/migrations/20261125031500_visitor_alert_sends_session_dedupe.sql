CREATE TABLE public.visitor_alert_sends (
  session_id text PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

COMMENT ON TABLE public.visitor_alert_sends IS
  'One row per visitor session that has already had a send-visitor-alert notification posted. Used to prevent duplicate webhooks.';

ALTER TABLE public.visitor_alert_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.visitor_alert_sends FROM anon, authenticated;
GRANT ALL ON TABLE public.visitor_alert_sends TO service_role;
