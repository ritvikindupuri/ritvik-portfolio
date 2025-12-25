import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, AlertTriangle, CheckCircle, Clock, Monitor, User, ChevronDown, ChevronUp, Eye } from "lucide-react";
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

interface VisitorActivity {
  id: string;
  session_id: string;
  ip_address: string | null;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

type ActivityType = 'failed_login' | 'successful_login' | 'guest_visit';

interface UnifiedActivity {
  id: string;
  type: ActivityType;
  ip_address: string | null;
  user_agent: string | null;
  email?: string;
  failure_reason?: string | null;
  session_id?: string;
  created_at: string;
}

interface IPLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  activities: UnifiedActivity[];
  totalCount: number;
  failedLoginCount: number;
  successfulLoginCount: number;
  guestVisitCount: number;
}

interface SecurityChoroplethMapProps {
  onLoginAttemptsLoaded?: (attempts: LoginAttempt[]) => void;
}

// Owner email to filter out successful logins
const OWNER_EMAIL = "ritvik.indupuri@gmail.com";

export const SecurityChoroplethMap = ({ onLoginAttemptsLoaded }: SecurityChoroplethMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [locations, setLocations] = useState<IPLocation[]>([]);
  const [unifiedActivities, setUnifiedActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<IPLocation | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [focusedLocationIndex, setFocusedLocationIndex] = useState<number>(-1);
  const [activeFilter, setActiveFilter] = useState<'all' | ActivityType>('all');

  // Fetch Mapbox token from edge function secrets
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.log("Using fallback mapbox configuration");
        setError("Mapbox token not configured");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    fetchAllData();
    
    // Set up realtime subscriptions
    const loginChannel = supabase
      .channel('login_attempts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'login_attempts' },
        () => fetchAllData()
      )
      .subscribe();

    const visitorChannel = supabase
      .channel('visitor_activity_security')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_activity' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(loginChannel);
      supabase.removeChannel(visitorChannel);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch login attempts
      const { data: loginData, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (loginError) throw loginError;

      // Fetch visitor activities (get unique sessions with their first activity for geolocation)
      const { data: visitorData, error: visitorError } = await supabase
        .from('visitor_activity')
        .select('*')
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (visitorError) throw visitorError;

      // Filter login attempts:
      // - Keep all failed logins
      // - Exclude owner's successful logins (keep other successful logins if any)
      const filteredLogins = (loginData || []).filter(attempt => {
        if (attempt.success && attempt.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          return false; // Exclude owner's successful logins
        }
        return true;
      });

      onLoginAttemptsLoaded?.(loginData || []);

      // Get unique sessions for guest visits (deduplicate by session_id)
      const sessionMap: Record<string, VisitorActivity> = {};
      (visitorData || []).forEach(activity => {
        if (!sessionMap[activity.session_id] && activity.ip_address) {
          sessionMap[activity.session_id] = activity;
        }
      });
      const uniqueVisitorSessions = Object.values(sessionMap);

      // Create unified activities list
      const unified: UnifiedActivity[] = [];

      // Add login attempts
      filteredLogins.forEach(attempt => {
        unified.push({
          id: attempt.id,
          type: attempt.success ? 'successful_login' : 'failed_login',
          ip_address: attempt.ip_address,
          user_agent: attempt.user_agent,
          email: attempt.email,
          failure_reason: attempt.failure_reason,
          created_at: attempt.created_at
        });
      });

      // Add guest visits
      uniqueVisitorSessions.forEach(activity => {
        unified.push({
          id: activity.id,
          type: 'guest_visit',
          ip_address: activity.ip_address,
          user_agent: null,
          session_id: activity.session_id,
          created_at: activity.created_at
        });
      });

      // Sort by created_at
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUnifiedActivities(unified);

      // Get unique IPs for geolocation
      const uniqueIps = [...new Set(unified.map(a => a.ip_address).filter((ip): ip is string => ip !== null && ip !== 'unknown'))];

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
      
      unified.forEach(activity => {
        if (activity.ip_address && geoData.locations[activity.ip_address]) {
          const geo = geoData.locations[activity.ip_address];
          const key = activity.ip_address;
          
          if (!locationMap[key]) {
            locationMap[key] = {
              ip: activity.ip_address,
              country: geo.country,
              countryCode: geo.countryCode,
              city: geo.city,
              lat: geo.lat,
              lon: geo.lon,
              activities: [],
              totalCount: 0,
              failedLoginCount: 0,
              successfulLoginCount: 0,
              guestVisitCount: 0
            };
          }
          
          locationMap[key].activities.push(activity);
          locationMap[key].totalCount++;
          
          switch (activity.type) {
            case 'failed_login':
              locationMap[key].failedLoginCount++;
              break;
            case 'successful_login':
              locationMap[key].successfulLoginCount++;
              break;
            case 'guest_visit':
              locationMap[key].guestVisitCount++;
              break;
          }
        }
      });

      setLocations(Object.values(locationMap));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
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
      // Determine marker color based on activity types
      // Priority: Red for failed logins, Yellow for successful logins (non-owner), Blue for guests only
      let color = '#3b82f6'; // Default blue for guests
      let glowColor = 'rgba(59, 130, 246, 0.5)';
      
      if (loc.failedLoginCount > 0) {
        color = '#ef4444'; // Red for failed logins
        glowColor = 'rgba(239, 68, 68, 0.5)';
      } else if (loc.successfulLoginCount > 0) {
        color = '#22c55e'; // Green for successful logins
        glowColor = 'rgba(34, 197, 94, 0.5)';
      }

      const size = Math.min(20 + loc.totalCount * 5, 50);
      
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div 
          class="rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style="
            width: ${size}px; 
            height: ${size}px; 
            background: ${color}cc;
            border: 2px solid ${color};
            box-shadow: 0 0 ${size/2}px ${glowColor};
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

  const filteredActivities = useMemo(() => {
    let filtered = unifiedActivities;
    if (activeFilter !== 'all') {
      filtered = unifiedActivities.filter(a => a.type === activeFilter);
    }
    return showAllActivities ? filtered : filtered.slice(0, 10);
  }, [unifiedActivities, showAllActivities, activeFilter]);

  const stats = useMemo(() => {
    return {
      failedLogins: unifiedActivities.filter(a => a.type === 'failed_login').length,
      successfulLogins: unifiedActivities.filter(a => a.type === 'successful_login').length,
      guestVisits: unifiedActivities.filter(a => a.type === 'guest_visit').length,
      total: unifiedActivities.length
    };
  }, [unifiedActivities]);

  const navigateToLocation = useCallback((index: number) => {
    if (locations.length === 0 || !map.current) return;
    
    const normalizedIndex = ((index % locations.length) + locations.length) % locations.length;
    const location = locations[normalizedIndex];
    
    setFocusedLocationIndex(normalizedIndex);
    setSelectedLocation(location);
    map.current.flyTo({
      center: [location.lon, location.lat],
      zoom: 4,
      duration: 1500
    });
  }, [locations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (locations.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToLocation(focusedLocationIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToLocation(focusedLocationIndex - 1);
      } else if (e.key === 'Escape') {
        setSelectedLocation(null);
        setFocusedLocationIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedLocationIndex, locations.length, navigateToLocation]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'successful_login':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'guest_visit':
        return <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case 'failed_login':
        return 'Failed Login';
      case 'successful_login':
        return 'Login Attempt';
      case 'guest_visit':
        return 'Guest Visit';
    }
  };

  const getActivityBadgeVariant = (type: ActivityType) => {
    switch (type) {
      case 'failed_login':
        return 'destructive';
      case 'successful_login':
        return 'default';
      case 'guest_visit':
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-muted-foreground/50">
                      Security & Visitor Map
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                      This map shows geographic locations of <strong>failed login attempts</strong>, 
                      <strong> other login attempts</strong>, and <strong>guest visitors</strong> to your portfolio.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            {locations.length > 0 && (
              <Badge variant="secondary">
                {locations.length} locations
              </Badge>
            )}
          </div>
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-red-400">{stats.failedLogins} Failed Logins</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-green-400">{stats.successfulLogins} Other Logins</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10">
              <Eye className="w-3 h-3 text-blue-500" />
              <span className="text-blue-400">{stats.guestVisits} Guest Visits</span>
            </div>
          </div>
          {/* Map Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              <span>Failed logins (suspicious)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span>Other login attempts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span>Guest visitors</span>
            </div>
          </div>
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
                  <MapPin className={`w-4 h-4 ${
                    selectedLocation.failedLoginCount > 0 ? 'text-red-500' : 
                    selectedLocation.successfulLoginCount > 0 ? 'text-green-500' : 'text-blue-500'
                  }`} />
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
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-secondary/30 rounded">
                  <p className="text-lg font-bold">{selectedLocation.totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded">
                  <p className="text-lg font-bold text-red-500">{selectedLocation.failedLoginCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-2 bg-green-500/10 rounded">
                  <p className="text-lg font-bold text-green-500">{selectedLocation.successfulLoginCount}</p>
                  <p className="text-xs text-muted-foreground">Logins</p>
                </div>
                <div className="text-center p-2 bg-blue-500/10 rounded">
                  <p className="text-lg font-bold text-blue-500">{selectedLocation.guestVisitCount}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedLocation.activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      activity.type === 'failed_login' ? 'bg-red-500/10' : 
                      activity.type === 'successful_login' ? 'bg-green-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <span className="truncate max-w-[120px]">
                        {activity.email || `Session ${activity.session_id?.slice(0, 8)}...`}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Activity Log
            </CardTitle>
            <div className="flex gap-1">
              {(['all', 'failed_login', 'successful_login', 'guest_visit'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    activeFilter === filter 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  {filter === 'all' ? 'All' : 
                   filter === 'failed_login' ? 'Failed' : 
                   filter === 'successful_login' ? 'Logins' : 'Guests'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use ← → arrow keys to navigate globe locations
          </p>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No activity recorded yet.
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredActivities.map((activity) => {
                  const location = locations.find(l => l.ip === activity.ip_address);
                  return (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg border ${
                        activity.type === 'failed_login' 
                          ? 'bg-red-500/5 border-red-500/20' 
                          : activity.type === 'successful_login'
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-blue-500/5 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {activity.email || `Guest Session`}
                              </span>
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
                                      {location ? `${location.city}, ${location.country}` : activity.ip_address || 'Unknown'}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    {location ? (
                                      <div className="space-y-1 text-xs">
                                        <p className="font-semibold">{location.city}, {location.country}</p>
                                        <p className="font-mono text-muted-foreground">IP: {location.ip}</p>
                                        <div className="flex gap-3 pt-1">
                                          <span className="text-red-500">{location.failedLoginCount} failed</span>
                                          <span className="text-green-500">{location.successfulLoginCount} logins</span>
                                          <span className="text-blue-500">{location.guestVisitCount} guests</span>
                                        </div>
                                        <p className="text-muted-foreground italic pt-1">Click to view on globe</p>
                                      </div>
                                    ) : (
                                      <p>Location data unavailable</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {activity.user_agent && (
                                <span className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  {parseBrowser(activity.user_agent)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getActivityBadgeVariant(activity.type) as any} className="text-xs">
                            {getActivityLabel(activity.type)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {activity.failure_reason && (
                        <p className="text-xs text-red-400 mt-2 pl-6">
                          Reason: {activity.failure_reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {unifiedActivities.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full mt-3 text-xs"
                >
                  {showAllActivities ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      View All ({unifiedActivities.length} entries)
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
