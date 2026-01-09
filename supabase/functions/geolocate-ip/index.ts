import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  getClientIP,
  checkRateLimit,
  rateLimitExceededResponse,
  logRateLimitEvent,
  RATE_LIMIT_CONFIGS,
} from "../_shared/cors-rate-limit.ts";

// Public CORS for this utility function to avoid sandbox/origin quirks.
// This endpoint does not rely on cookies; it only uses request bodies.
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Check rate limit
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.geolocate);
  await logRateLimitEvent(clientIP, "geolocate", rateLimit.allowed, rateLimit.remaining, req);

  if (!rateLimit.allowed) {
    // Ensure browser can read the 429 response even under strict CORS contexts
    const origin = req.headers.get("origin");
    const resp = rateLimitExceededResponse(origin, rateLimit.resetIn);
    const merged = new Headers(resp.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => merged.set(k, v));
    return new Response(await resp.text(), { status: resp.status, headers: merged });
  }

  try {
    const { ip_addresses } = await req.json();

    if (!ip_addresses || !Array.isArray(ip_addresses)) {
      return new Response(JSON.stringify({ error: "ip_addresses array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uniqueIps = [...new Set(ip_addresses)].slice(0, 100);

    const results: Record<
      string,
      { country: string; countryCode: string; city: string; lat: number; lon: number } | null
    > = {};

    const batchResponse = await fetch(
      "http://ip-api.com/batch?fields=status,query,country,countryCode,city,lat,lon",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uniqueIps.map((ip) => ({ query: ip }))),
      }
    );

    if (batchResponse.ok) {
      const batchData = await batchResponse.json();
      batchData.forEach((item: any) => {
        if (item.status === "success") {
          results[item.query] = {
            country: item.country,
            countryCode: item.countryCode,
            city: item.city,
            lat: item.lat,
            lon: item.lon,
          };
        } else {
          results[item.query] = null;
        }
      });
    }

    return new Response(JSON.stringify({ locations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error geolocating IPs:", error);
    return new Response(JSON.stringify({ error: "Failed to geolocate IPs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
