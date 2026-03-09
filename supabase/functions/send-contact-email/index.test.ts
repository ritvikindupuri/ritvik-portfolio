import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { stub } from "https://deno.land/std@0.224.0/testing/mock.ts";

import { handler } from "./index.ts";

function makeReq(
  body: Record<string, unknown> | null,
  opts?: { method?: string; ip?: string; origin?: string },
): Request {
  const method = opts?.method ?? "POST";
  const origin = opts?.origin ?? "https://ritvik-indupuri-portfolio.lovable.app";
  const ip = opts?.ip ?? "203.0.113.10";

  return new Request("http://local.test/send-contact-email", {
    method,
    headers: {
      "content-type": "application/json",
      origin,
      "x-forwarded-for": ip,
      "user-agent": "waf-test-suite/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

Deno.test("send-contact-email: OPTIONS preflight returns 204", async () => {
  const res = await handler(makeReq(null, { method: "OPTIONS" }));
  await res.text();
  assertEquals(res.status, 204);
  assertEquals(res.headers.has("Access-Control-Allow-Origin"), true);
});

Deno.test("send-contact-email: invalid email returns 400", async () => {
  const res = await handler(
    makeReq({ name: "A", email: "not-an-email", message: "hello" }, { ip: "203.0.113.11" }),
  );
  const text = await res.text();
  assertEquals(res.status, 400);
  assertMatch(text, /Invalid email address|Invalid email/i);
});

Deno.test("send-contact-email: valid submission returns 200 (Resend mocked)", async () => {
  const fetchStub = stub(globalThis, "fetch", async (input: any) => {
    const url = typeof input === "string" ? input : input?.url;

    // Resend email send
    if (typeof url === "string" && url.includes("api.resend.com/emails")) {
      return new Response(JSON.stringify({ id: "email_test_id" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Rate limit persistence / alerts / geolocation (no-op)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  try {
    const res = await handler(
      makeReq({ name: "Test User", email: "test@example.com", message: "Hello" }, { ip: "203.0.113.12" }),
    );
    const text = await res.text();
    assertEquals(res.status, 200);
    assertMatch(text, /email_test_id/);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("send-contact-email: rate limit triggers 429 after 5 requests (same IP)", async () => {
  const originalRandom = Math.random;
  // Avoid probabilistic cleanup flakiness
  // @ts-ignore - Math.random is writable in Deno
  Math.random = () => 1;

  const fetchStub = stub(globalThis, "fetch", async () => {
    return new Response(JSON.stringify({ id: "email_test_id" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  try {
    const ip = "203.0.113.13";
    for (let i = 0; i < 5; i++) {
      const res = await handler(
        makeReq({ name: "Test", email: "t@example.com", message: `Hi ${i}` }, { ip }),
      );
      await res.text();
      assertEquals(res.status, 200);
    }

    const blocked = await handler(
      makeReq({ name: "Test", email: "t@example.com", message: "Hi" }, { ip }),
    );
    const text = await blocked.text();
    assertEquals(blocked.status, 429);
    assertMatch(text, /Rate limit exceeded/i);
  } finally {
    fetchStub.restore();
    // @ts-ignore
    Math.random = originalRandom;
  }
});
