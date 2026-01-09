import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  getCorsHeaders, 
  handleCorsPreFlight, 
  getClientIP, 
  checkRateLimit, 
  rateLimitExceededResponse,
  logRateLimitEvent,
  RATE_LIMIT_CONFIGS 
} from "../_shared/cors-rate-limit.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Check rate limit
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.geolocate);
  await logRateLimitEvent(clientIP, 'geolocate', rateLimit.allowed, rateLimit.remaining, req);
  
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(origin, rateLimit.resetIn);
  }

  try {
    const { ip_addresses } = await req.json();

    if (!ip_addresses || !Array.isArray(ip_addresses)) {
      return new Response(
        JSON.stringify({ error: "ip_addresses array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch lookup using ip-api.com batch endpoint (free, up to 100 IPs)
    const uniqueIps = [...new Set(ip_addresses)].slice(0, 100);
    
    const results: Record<string, { country: string; countryCode: string; city: string; lat: number; lon: number } | null> = {};

    // Use batch endpoint for efficiency
    const batchResponse = await fetch("http://ip-api.com/batch?fields=status,query,country,countryCode,city,lat,lon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uniqueIps.map(ip => ({ query: ip }))),
    });

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

    return new Response(
      JSON.stringify({ locations: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error geolocating IPs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to geolocate IPs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});