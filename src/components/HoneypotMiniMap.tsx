import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

type IpLocation = {
  ip: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  countryCode: string;
};

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function HoneypotMiniMap({ ipAddresses }: { ipAddresses: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [token, setToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<IpLocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ips = useMemo(() => {
    return uniq(
      ipAddresses
        .map((ip) => ip?.trim())
        .filter((ip): ip is string => Boolean(ip) && ip !== "unknown")
    ).slice(0, 25);
  }, [ipAddresses]);

  useEffect(() => {
    let cancelled = false;

    async function loadToken() {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (!data?.token) throw new Error("Map token missing");
        if (!cancelled) setToken(data.token);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load map token");
      }
    }

    loadToken();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (ips.length === 0) {
      setLocations([]);
      return;
    }

    async function geolocate() {
      try {
        const { data, error } = await supabase.functions.invoke("geolocate-ip", {
          body: { ip_addresses: ips },
        });
        if (error) throw error;

        const raw: Record<
          string,
          { country: string; countryCode: string; city: string; lat: number; lon: number } | null
        > = data?.locations || {};

        const next: IpLocation[] = Object.entries(raw)
          .filter(([, v]) => typeof v?.lat === "number" && typeof v?.lon === "number")
          .map(([ip, v]) => ({
            ip,
            lat: v!.lat,
            lon: v!.lon,
            city: v!.city,
            country: v!.country,
            countryCode: v!.countryCode,
          }));

        if (!cancelled) setLocations(next);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to geolocate IPs");
      }
    }

    geolocate();
    return () => {
      cancelled = true;
    };
  }, [ips]);

  useEffect(() => {
    if (!token) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe",
      zoom: 0.9,
      center: [0, 15],
      pitch: 0,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current.scrollZoom.disable();

    mapRef.current.on("style.load", () => {
      mapRef.current?.setFog({
        color: "hsl(0 0% 0% / 0)",
        "high-color": "hsl(0 0% 0% / 0)",
        "horizon-blend": 0.2,
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const loc of locations) {
      const el = document.createElement("div");
      el.className = "h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background shadow";
      el.title = `${loc.ip} • ${loc.city || loc.countryCode}`;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([loc.lon, loc.lat]);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 30, maxZoom: 3.5, duration: 600 });
    }
  }, [locations]);

  if (ips.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Recent Trigger Locations</div>
      <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border/50 bg-card/30">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
            {error}
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/20" />
      </div>
      <div className="text-xs text-muted-foreground">
        Showing up to {Math.min(ips.length, 25)} unique IPs from recent honeypot triggers.
      </div>
    </div>
  );
}
