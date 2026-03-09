import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  getCorsHeaders,
  handleCorsPreFlight,
} from "../_shared/cors-rate-limit.ts";

interface WafEchoRequest {
  input: string;
}

function validateInput(body: unknown): { ok: true; data: WafEchoRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };
  const input = (body as any).input;
  if (typeof input !== "string") return { ok: false, error: "input must be a string" };
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "input is required" };
  if (trimmed.length > 2000) return { ok: false, error: "input must be <= 2000 characters" };
  return { ok: true, data: { input: trimmed } };
}

export const handler = async (req: Request): Promise<Response> => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const raw = await req.json();
    const parsed = validateInput(raw);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        echoed: parsed.data.input,
        length: parsed.data.input.length,
        ts: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
