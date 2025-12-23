import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, AlertTriangle, CheckCircle, Clock, Monitor, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface IPLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  attempts: LoginAttempt[];
  totalCount: number;
  failedCount: number;
  successCount: number;
}

interface SecurityChoroplethMapProps {
  onLoginAttemptsLoaded?: (attempts: LoginAttempt[]) => void;
}

export const SecurityChoroplethMap = ({ onLoginAttemptsLoaded }: SecurityChoroplethMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [locations, setLocations] = useState<IPLocation[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<IPLocation | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token from edge function secrets
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // The token is stored in Supabase secrets, accessible via edge function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        // Fallback: try to use the token directly (for development)
        console.log("Using fallback mapbox configuration");
        // We'll create an edge function to provide the token
        setError("Mapbox token not configured");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    fetchLoginAttempts();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('login_attempts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'login_attempts' },
        () => {
          fetchLoginAttempts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLoginAttempts = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      setLoginAttempts(data);
      onLoginAttemptsLoaded?.(data);

      // Get unique IPs
      const uniqueIps = [...new Set(data.map(a => a.ip_address).filter((ip): ip is string => ip !== null && ip !== 'unknown'))];

      if (uniqueIps.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch geolocation via edge function
      const { data: geoData, error: geoError } = await supabase.functions.invoke('geolocate-ip', {
        body: { ip_addresses: uniqueIps }
      });

      if (geoError) throw geoError;

      const locationMap: Record<string, IPLocation> = {};
      
      data.forEach(attempt => {
        if (attempt.ip_address && geoData.locations[attempt.ip_address]) {
          const geo = geoData.locations[attempt.ip_address];
          const key = attempt.ip_address;
          
          if (!locationMap[key]) {
            locationMap[key] = {
              ip: attempt.ip_address,
              country: geo.country,
              countryCode: geo.countryCode,
              city: geo.city,
              lat: geo.lat,
              lon: geo.lon,
              attempts: [],
              totalCount: 0,
              failedCount: 0,
              successCount: 0
            };
          }
          
          locationMap[key].attempts.push(attempt);
          locationMap[key].totalCount++;
          if (attempt.success) {
            locationMap[key].successCount++;
          } else {
            locationMap[key].failedCount++;
          }
        }
      });

      setLocations(Object.values(locationMap));
    } catch (err) {
      console.error('Error fetching login attempts:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize map when token is available - ALWAYS show the globe
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
    // Remove existing map if present
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 20,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
      });
    });

    // Slow rotation - always active
    let userInteracting = false;
    const spinGlobe = () => {
      if (!map.current || userInteracting) return;
      const zoom = map.current.getZoom();
      if (zoom < 3) {
        const center = map.current.getCenter();
        center.lng -= 0.5;
        map.current.easeTo({ center, duration: 1000, easing: n => n });
      }
    };

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', spinGlobe);
    
    // Start spinning immediately
    map.current.on('load', spinGlobe);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || locations.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    locations.forEach(loc => {
      const isSuspicious = loc.failedCount > loc.successCount || loc.failedCount >= 3;
      const size = Math.min(20 + loc.totalCount * 5, 50);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div 
          class="rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style="
            width: ${size}px; 
            height: ${size}px; 
            background: ${isSuspicious ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'};
            border: 2px solid ${isSuspicious ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'};
            box-shadow: 0 0 ${size/2}px ${isSuspicious ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'};
          "
        >
          <span style="color: white; font-size: ${Math.max(10, size/3)}px; font-weight: bold;">
            ${loc.totalCount}
          </span>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedLocation(loc);
        map.current?.flyTo({
          center: [loc.lon, loc.lat],
          zoom: 4,
          duration: 1500
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([loc.lon, loc.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [locations]);

  const parseBrowser = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const recentAttempts = useMemo(() => {
    return loginAttempts.slice(0, 5);
  }, [loginAttempts]);

  // Always show the map, even while loading
  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Login Locations
            {locations.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {locations.length} locations
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Map Container */}
          <div className="relative w-full h-64 md:h-80">
            {mapboxToken ? (
              <div ref={mapContainer} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {error || "Initializing map..."}
                </p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-card/80 to-transparent" />
          </div>

          {/* Selected Location Details */}
          {selectedLocation && (
            <div className="p-4 border-t border-border/50 bg-secondary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${selectedLocation.failedCount > selectedLocation.successCount ? 'text-red-500' : 'text-green-500'}`} />
                  <div>
                    <p className="font-medium">{selectedLocation.city}, {selectedLocation.country}</p>
                    <p className="text-xs text-muted-foreground font-mono">{selectedLocation.ip}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-secondary/30 rounded">
                  <p className="text-lg font-bold">{selectedLocation.totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-2 bg-green-500/10 rounded">
                  <p className="text-lg font-bold text-green-500">{selectedLocation.successCount}</p>
                  <p className="text-xs text-muted-foreground">Success</p>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded">
                  <p className="text-lg font-bold text-red-500">{selectedLocation.failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedLocation.attempts.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      attempt.success ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {attempt.success ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="truncate max-w-[120px]">{attempt.email}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(attempt.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Login Activity Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Login Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No login attempts recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentAttempts.map((attempt) => {
                const location = locations.find(l => l.ip === attempt.ip_address);
                return (
                  <div
                    key={attempt.id}
                    className={`p-3 rounded-lg border ${
                      attempt.success 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {attempt.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{attempt.email}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (location && map.current) {
                                        setSelectedLocation(location);
                                        map.current.flyTo({
                                          center: [location.lon, location.lat],
                                          zoom: 4,
                                          duration: 1500
                                        });
                                      }
                                    }}
                                    disabled={!location}
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {location ? `${location.city}, ${location.country}` : attempt.ip_address || 'Unknown'}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  {location ? (
                                    <div className="space-y-1 text-xs">
                                      <p className="font-semibold">{location.city}, {location.country}</p>
                                      <p className="font-mono text-muted-foreground">IP: {location.ip}</p>
                                      <div className="flex gap-3 pt-1">
                                        <span className="text-green-500">{location.successCount} successful</span>
                                        <span className="text-red-500">{location.failedCount} failed</span>
                                      </div>
                                      <p className="text-muted-foreground italic pt-1">Click to view on globe</p>
                                    </div>
                                  ) : (
                                    <p>Location data unavailable</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {parseBrowser(attempt.user_agent)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs">
                          {attempt.success ? 'Success' : 'Failed'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(attempt.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {attempt.failure_reason && (
                      <p className="text-xs text-red-400 mt-2 pl-6">
                        Reason: {attempt.failure_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};