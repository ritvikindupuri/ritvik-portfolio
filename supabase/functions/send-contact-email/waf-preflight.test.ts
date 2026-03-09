import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const DEFLECTRA_PROXY = "https://mgveeoqkhthibpmmljxz.supabase.co/functions/v1/waf-proxy";
const SITE_ID = "c3311d01-1dff-4074-93cc-6e1b768fd1e8";

function preflightUrl(functionName: string) {
  // Preflight mode in waf-proxy.ts uses path=/${functionName}
  return `${DEFLECTRA_PROXY}?site_id=${SITE_ID}&path=/${encodeURIComponent(functionName)}`;
}

async function preflight(body: Record<string, unknown>) {
  const res = await fetch(preflightUrl("send-contact-email"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { res, text };
}

Deno.test("WAF preflight: allows legitimate contact payload", async () => {
  const { res } = await preflight({
    name: "Test User",
    email: "test@example.com",
    message: "Hello — quick question about your work.",
  });
  // 404 here typically indicates the Deflectra site/path mapping isn't configured.
  if (res.status === 404) {
    throw new Error("WAF preflight returned 404 (site/path not configured in Deflectra)");
  }
  assertEquals(res.status, 200);
});

Deno.test("WAF preflight: blocks SQLi-like payload", async () => {
  const { res, text } = await preflight({
    name: "hi",
    email: "test@example.com",
    message: "admin' OR 1=1--",
  });
  if (res.status === 404) {
    throw new Error("WAF preflight returned 404 (site/path not configured in Deflectra)");
  }
  if (res.status !== 403) {
    throw new Error(`Expected 403 from WAF, got ${res.status}. Body: ${text.slice(0, 300)}`);
  }
  assertEquals(res.status, 403);
});

Deno.test("WAF preflight: blocks XSS-like payload", async () => {
  const { res, text } = await preflight({
    name: "hi",
    email: "test@example.com",
    message: "<script>alert(1)</script>",
  });
  if (res.status === 404) {
    throw new Error("WAF preflight returned 404 (site/path not configured in Deflectra)");
  }
  if (res.status !== 403) {
    throw new Error(`Expected 403 from WAF, got ${res.status}. Body: ${text.slice(0, 300)}`);
  }
  assertEquals(res.status, 403);
});
