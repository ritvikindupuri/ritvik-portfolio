import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const DEFLECTRA_PROXY = "https://mgveeoqkhthibpmmljxz.supabase.co/functions/v1/waf-proxy";
const SITE_ID = "c3311d01-1dff-4074-93cc-6e1b768fd1e8";

const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  "";

const APP_SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_URL") ??
  "";

function proxyUrl(path: string) {
  return `${DEFLECTRA_PROXY}?site_id=${SITE_ID}&path=${encodeURIComponent(path)}`;
}

Deno.test("waf-echo: benign payload passes through WAF proxy", async () => {
  const res = await fetch(proxyUrl("/functions/v1/waf-echo"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ input: "hello from waf test" }),
  });
  const text = await res.text();
  assertEquals(res.status, 200);
  // body may vary; just ensure it isn't empty
  if (!text) throw new Error("Expected non-empty response body");
});

Deno.test("waf-echo: SQLi-like payload is blocked by WAF proxy (expects 403)", async () => {
  const res = await fetch(proxyUrl("/functions/v1/waf-echo"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ input: "admin' OR 1=1--" }),
  });
  await res.text();
  assertEquals(res.status, 403);
});

Deno.test("waf-echo: XSS-like payload is blocked by WAF proxy (expects 403)", async () => {
  const res = await fetch(proxyUrl("/functions/v1/waf-echo"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ input: "<script>alert(1)</script>" }),
  });
  await res.text();
  assertEquals(res.status, 403);
});

Deno.test("waf-echo: direct call (no WAF proxy) stays accessible for sanity", async () => {
  if (!APP_SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL/SUPABASE_URL in env");

  const res = await fetch(`${APP_SUPABASE_URL}/functions/v1/waf-echo`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ input: "direct call" }),
  });
  await res.text();
  assertEquals(res.status, 200);
});
