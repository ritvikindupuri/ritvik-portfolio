/**
 * Webhook alert delivery (replaces Resend email).
 *
 * Config (edge secret first, else service-role-only row in public.app_settings):
 *   VISITOR_ALERT_WEBHOOK_URL    / app_settings key 'visitor_alert_webhook_url'
 *   VISITOR_ALERT_WEBHOOK_SECRET / app_settings key 'visitor_alert_webhook_secret'
 * Request: POST JSON, headers `X-Alert-Event: <event>` and, when a secret is set,
 * `Authorization: Bearer <secret>`.
 */
async function loadSetting(envName: string, settingKey: string): Promise<string> {
  const fromEnv = Deno.env.get(envName);
  if (fromEnv) return fromEnv;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return "";
    const res = await fetch(`${url}/rest/v1/app_settings?key=eq.${settingKey}&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "";
    const rows = await res.json();
    return rows?.[0]?.value || "";
  } catch (_e) {
    return "";
  }
}

export const ALERT_WEBHOOK_URL = await loadSetting("VISITOR_ALERT_WEBHOOK_URL", "visitor_alert_webhook_url");
const ALERT_WEBHOOK_SECRET = await loadSetting("VISITOR_ALERT_WEBHOOK_SECRET", "visitor_alert_webhook_secret");

export async function postAlertWebhook(eventType: string, payload: Record<string, unknown>): Promise<void> {
  if (!ALERT_WEBHOOK_URL) throw new Error("Alert webhook URL is not configured");
  const body = JSON.stringify({
    event: eventType,
    sent_at: new Date().toISOString(),
    source: "portfolio",
    ...payload,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "portfolio-alerts/1.0",
    "X-Alert-Event": eventType,
  };
  if (ALERT_WEBHOOK_SECRET) headers["Authorization"] = `Bearer ${ALERT_WEBHOOK_SECRET}`;
  const res = await fetch(ALERT_WEBHOOK_URL, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`Alert webhook returned ${res.status}`);
  }
}
