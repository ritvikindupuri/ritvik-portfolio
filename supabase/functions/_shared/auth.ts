/**
 * Shared authentication helpers for edge functions.
 *
 * - Internal / scheduled callers (pg_cron, DB webhooks, function-to-function)
 *   must send an `x-cron-secret` header matching the CRON_SECRET env secret.
 *   Comparison is constant-time. Fails closed if CRON_SECRET is not set.
 * - User-facing admin endpoints require a valid Supabase JWT whose user has
 *   the `owner` app_role.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

/** Constant-time string comparison (length leak only). */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Compare against a same-length buffer so the loop length doesn't depend on `a`.
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < bBytes.length; i++) {
    diff |= (aBytes[i] ?? 0) ^ bBytes[i];
  }
  return diff === 0;
}

/** True when the request carries a valid x-cron-secret header. */
export function hasValidCronSecret(req: Request): boolean {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    console.error("[auth] CRON_SECRET is not configured; rejecting internal call");
    return false;
  }
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}

/** Headers to attach when one function calls another internal function. */
export function internalCallHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "",
  };
}

/** Returns the user id if the request has a valid JWT for a user with the owner role. */
export async function getOwnerUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  const { data: isOwner, error: roleError } = await client.rpc("has_role", {
    _user_id: user.id,
    _role: "owner",
  });
  if (roleError || isOwner !== true) return null;
  return user.id;
}

/** Returns a valid JWT user id (any signed-in user) or null. */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

export function unauthorizedResponse(headers: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
