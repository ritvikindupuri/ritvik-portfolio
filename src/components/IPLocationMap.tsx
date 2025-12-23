import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Globe } from "lucide-react";

interface LoginAttempt {
  ip_address: string | null;
  success: boolean;
  created_at: string;
}

interface IPLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  count: number;
  failedCount: number;
}

// Simple world map regions with approximate coordinates for visualization
const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  US: { x: 20, y: 40 },
  CA: { x: 18, y: 30 },
  MX: { x: 18, y: 50 },
  BR: { x: 35, y: 65 },
  AR: { x: 30, y: 75 },
  GB: { x: 48, y: 32 },
  DE: { x: 52, y: 35 },
  FR: { x: 50, y: 38 },
  ES: { x: 47, y: 42 },
  IT: { x: 53, y: 42 },
  RU: { x: 70, y: 30 },
  CN: { x: 78, y: 42 },
  JP: { x: 88, y: 40 },
  KR: { x: 85, y: 42 },
  IN: { x: 72, y: 50 },
  AU: { x: 85, y: 72 },
  ZA: { x: 55, y: 70 },
  NG: { x: 52, y: 55 },
  EG: { x: 58, y: 48 },
  AE: { x: 65, y: 50 },
  SG: { x: 78, y: 58 },
  NL: { x: 50, y: 33 },
  SE: { x: 54, y: 28 },
  PL: { x: 55, y: 34 },
  UA: { x: 58, y: 36 },
  TR: { x: 60, y: 42 },
  SA: { x: 62, y: 50 },
  ID: { x: 80, y: 60 },
  PH: { x: 84, y: 55 },
  VN: { x: 78, y: 52 },
  TH: { x: 76, y: 54 },
  MY: { x: 77, y: 58 },
  PK: { x: 68, y: 48 },
  BD: { x: 73, y: 50 },
  NZ: { x: 92, y: 76 },
  CL: { x: 28, y: 72 },
  CO: { x: 26, y: 56 },
  PE: { x: 26, y: 62 },
  VE: { x: 28, y: 54 },
};

export const IPLocationMap = () => {
  const [locations, setLocations] = useState<IPLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIPLocations();
  }, []);

  const fetchIPLocations = async () => {
    try {
      // Fetch login attempts
      const { data, error: dbError } = await supabase
        .from('login_attempts')
        .select('ip_address, success, created_at')
        .not('ip_address', 'is', null);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Group by IP
      const ipCounts: Record<string, { count: number; failedCount: number }> = {};
      data.forEach((attempt) => {
        if (attempt.ip_address && attempt.ip_address !== 'unknown') {
          if (!ipCounts[attempt.ip_address]) {
            ipCounts[attempt.ip_address] = { count: 0, failedCount: 0 };
          }
          ipCounts[attempt.ip_address].count++;
          if (!attempt.success) {
            ipCounts[attempt.ip_address].failedCount++;
          }
        }
      });

      // Get unique IPs (limit to avoid too many API calls)
      const uniqueIps = Object.keys(ipCounts).slice(0, 20);

      // Fetch geolocation for each IP using free API
      const locationPromises = uniqueIps.map(async (ip) => {
        try {
          // Using ip-api.com (free, no API key needed)
          const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`);
          const geoData = await response.json();
          
          if (geoData.status === 'success') {
            return {
              ip,
              country: geoData.country,
              countryCode: geoData.countryCode,
              city: geoData.city,
              count: ipCounts[ip].count,
              failedCount: ipCounts[ip].failedCount,
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(locationPromises);
      setLocations(results.filter((r): r is IPLocation => r !== null));
    } catch (err) {
      console.error('Error fetching IP locations:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  // Group locations by country for the map
  const countryData = useMemo(() => {
    const countries: Record<string, { count: number; failedCount: number; cities: string[] }> = {};
    locations.forEach((loc) => {
      if (!countries[loc.countryCode]) {
        countries[loc.countryCode] = { count: 0, failedCount: 0, cities: [] };
      }
      countries[loc.countryCode].count += loc.count;
      countries[loc.countryCode].failedCount += loc.failedCount;
      if (loc.city && !countries[loc.countryCode].cities.includes(loc.city)) {
        countries[loc.countryCode].cities.push(loc.city);
      }
    });
    return countries;
  }, [locations]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading location data...
        </CardContent>
      </Card>
    );
  }

  if (error || locations.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Login Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-4">
          {error || "No location data available yet."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Login Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple Visual Map */}
        <div className="relative w-full h-40 bg-secondary/20 rounded-lg overflow-hidden border border-border/50">
          {/* World outline - simplified SVG */}
          <svg viewBox="0 0 100 80" className="w-full h-full opacity-20">
            <ellipse cx="50" cy="40" rx="48" ry="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <line x1="2" y1="40" x2="98" y2="40" stroke="currentColor" strokeWidth="0.3" />
            <line x1="50" y1="2" x2="50" y2="78" stroke="currentColor" strokeWidth="0.3" />
          </svg>

          {/* Location Markers */}
          {Object.entries(countryData).map(([code, data]) => {
            const pos = COUNTRY_POSITIONS[code];
            if (!pos) return null;

            const isSuspicious = data.failedCount > data.count / 2;
            const size = Math.min(6 + data.count * 2, 16);

            return (
              <div
                key={code}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div
                  className={`rounded-full animate-pulse ${
                    isSuspicious ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: size, height: size }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                    <p className="font-medium">{code}</p>
                    <p className="text-muted-foreground">{data.count} attempts</p>
                    {data.failedCount > 0 && (
                      <p className="text-red-400">{data.failedCount} failed</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Location List */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {locations.slice(0, 5).map((loc) => (
            <div
              key={loc.ip}
              className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                loc.failedCount > 0 ? 'bg-red-500/10' : 'bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className={`w-3 h-3 ${loc.failedCount > 0 ? 'text-red-500' : 'text-primary'}`} />
                <span>
                  {loc.city}, {loc.country}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-xs">{loc.ip}</span>
                <span className={loc.failedCount > 0 ? 'text-red-400' : ''}>
                  {loc.count} {loc.failedCount > 0 && `(${loc.failedCount} failed)`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};