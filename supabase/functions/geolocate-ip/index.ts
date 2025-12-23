import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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