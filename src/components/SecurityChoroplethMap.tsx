import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, AlertTriangle, CheckCircle, Clock, Monitor, User, ChevronDown, ChevronUp, Eye, Shield } from "lucide-react";
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

export const SecurityChoroplethMap = ({ onLoginAttemptsLoaded }: SecurityChoroplethMapProps) => {
  // Globe 1: Successful Logins
  const successMapContainer = useRef<HTMLDivElement>(null);
  const successMap = useRef<mapboxgl.Map | null>(null);
  const successMarkersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Globe 2: Failed Logins + Guests
  const securityMapContainer = useRef<HTMLDivElement>(null);
  const securityMap = useRef<mapboxgl.Map | null>(null);
  const securityMarkersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [successLocations, setSuccessLocations] = useState<IPLocation[]>([]);
  const [securityLocations, setSecurityLocations] = useState<IPLocation[]>([]);
  const [allActivities, setAllActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuccessLocation, setSelectedSuccessLocation] = useState<IPLocation | null>(null);
  const [selectedSecurityLocation, setSelectedSecurityLocation] = useState<IPLocation | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showAllSuccessLogs, setShowAllSuccessLogs] = useState(false);
  const [showAllSecurityLogs, setShowAllSecurityLogs] = useState(false);
  const [securityFilter, setSecurityFilter] = useState<'all' | 'failed_login' | 'guest_visit'>('all');

  // Fetch Mapbox token
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
    
    const loginChannel = supabase
      .channel('login_attempts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'login_attempts' }, () => fetchAllData())
      .subscribe();

    const visitorChannel = supabase
      .channel('visitor_activity_security')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_activity' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(loginChannel);
      supabase.removeChannel(visitorChannel);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      const { data: loginData, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (loginError) throw loginError;

      const { data: visitorData, error: visitorError } = await supabase
        .from('visitor_activity')
        .select('*')
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (visitorError) throw visitorError;

      onLoginAttemptsLoaded?.(loginData || []);

      // Get unique sessions for guest visits
      const sessionMap: Record<string, VisitorActivity> = {};
      (visitorData || []).forEach(activity => {
        if (!sessionMap[activity.session_id] && activity.ip_address) {
          sessionMap[activity.session_id] = activity;
        }
      });
      const uniqueVisitorSessions = Object.values(sessionMap);

      // Create unified activities
      const unified: UnifiedActivity[] = [];

      (loginData || []).forEach(attempt => {
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

      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllActivities(unified);

      // Get unique IPs for geolocation
      const uniqueIps = [...new Set(unified.map(a => a.ip_address).filter((ip): ip is string => ip !== null && ip !== 'unknown'))];

      if (uniqueIps.length === 0) {
        setLoading(false);
        return;
      }

      const { data: geoData, error: geoError } = await supabase.functions.invoke('geolocate-ip', {
        body: { ip_addresses: uniqueIps }
      });

      if (geoError) throw geoError;

      // Build locations for successful logins (Globe 1)
      const successLocationMap: Record<string, IPLocation> = {};
      // Build locations for failed logins + guests (Globe 2)
      const securityLocationMap: Record<string, IPLocation> = {};
      
      unified.forEach(activity => {
        if (activity.ip_address && geoData.locations[activity.ip_address]) {
          const geo = geoData.locations[activity.ip_address];
          const key = activity.ip_address;
          
          if (activity.type === 'successful_login') {
            // Add to success map
            if (!successLocationMap[key]) {
              successLocationMap[key] = {
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
            successLocationMap[key].activities.push(activity);
            successLocationMap[key].totalCount++;
            successLocationMap[key].successfulLoginCount++;
          } else {
            // Add to security map (failed logins + guests)
            if (!securityLocationMap[key]) {
              securityLocationMap[key] = {
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
            securityLocationMap[key].activities.push(activity);
            securityLocationMap[key].totalCount++;
            if (activity.type === 'failed_login') {
              securityLocationMap[key].failedLoginCount++;
            } else {
              securityLocationMap[key].guestVisitCount++;
            }
          }
        }
      });

      setSuccessLocations(Object.values(successLocationMap));
      setSecurityLocations(Object.values(securityLocationMap));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Success Map (Globe 1)
  useEffect(() => {
    if (!successMapContainer.current || !mapboxToken) return;
    
    if (successMap.current) {
      successMap.current.remove();
      successMap.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    successMap.current = new mapboxgl.Map({
      container: successMapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 20,
    });

    successMap.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    successMap.current.scrollZoom.disable();

    successMap.current.on('style.load', () => {
      successMap.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
      });
    });

    let userInteracting = false;
    const spinGlobe = () => {
      if (!successMap.current || userInteracting) return;
      const zoom = successMap.current.getZoom();
      if (zoom < 3) {
        const center = successMap.current.getCenter();
        center.lng -= 0.5;
        successMap.current.easeTo({ center, duration: 1000, easing: n => n });
      }
    };

    successMap.current.on('mousedown', () => { userInteracting = true; });
    successMap.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    successMap.current.on('moveend', spinGlobe);
    successMap.current.on('load', spinGlobe);

    return () => {
      successMap.current?.remove();
      successMap.current = null;
    };
  }, [mapboxToken]);

  // Initialize Security Map (Globe 2)
  useEffect(() => {
    if (!securityMapContainer.current || !mapboxToken) return;
    
    if (securityMap.current) {
      securityMap.current.remove();
      securityMap.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    securityMap.current = new mapboxgl.Map({
      container: securityMapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 20,
    });

    securityMap.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    securityMap.current.scrollZoom.disable();

    securityMap.current.on('style.load', () => {
      securityMap.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
      });
    });

    let userInteracting = false;
    const spinGlobe = () => {
      if (!securityMap.current || userInteracting) return;
      const zoom = securityMap.current.getZoom();
      if (zoom < 3) {
        const center = securityMap.current.getCenter();
        center.lng -= 0.5;
        securityMap.current.easeTo({ center, duration: 1000, easing: n => n });
      }
    };

    securityMap.current.on('mousedown', () => { userInteracting = true; });
    securityMap.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    securityMap.current.on('moveend', spinGlobe);
    securityMap.current.on('load', spinGlobe);

    return () => {
      securityMap.current?.remove();
      securityMap.current = null;
    };
  }, [mapboxToken]);

  // Add markers to Success Map
  useEffect(() => {
    if (!successMap.current || successLocations.length === 0) return;

    successMarkersRef.current.forEach(marker => marker.remove());
    successMarkersRef.current = [];

    successLocations.forEach(loc => {
      const size = Math.min(20 + loc.totalCount * 5, 50);
      
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div 
          class="rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style="
            width: ${size}px; 
            height: ${size}px; 
            background: rgba(34, 197, 94, 0.8);
            border: 2px solid rgb(34, 197, 94);
            box-shadow: 0 0 ${size/2}px rgba(34, 197, 94, 0.5);
          "
        >
          <span style="color: white; font-size: ${Math.max(10, size/3)}px; font-weight: bold;">
            ${loc.totalCount}
          </span>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedSuccessLocation(loc);
        successMap.current?.flyTo({ center: [loc.lon, loc.lat], zoom: 4, duration: 1500 });
      });

      const marker = new mapboxgl.Marker(el).setLngLat([loc.lon, loc.lat]).addTo(successMap.current!);
      successMarkersRef.current.push(marker);
    });
  }, [successLocations]);

  // Add markers to Security Map - separate markers for failed logins and guest visits
  useEffect(() => {
    if (!securityMap.current) return;

    securityMarkersRef.current.forEach(marker => marker.remove());
    securityMarkersRef.current = [];

    if (securityLocations.length === 0) return;

    securityLocations.forEach(loc => {
      // Create separate markers for failed logins and guest visits at the same location
      
      // Failed login marker (red)
      if (loc.failedLoginCount > 0) {
        const failedSize = Math.min(20 + loc.failedLoginCount * 5, 50);
        const failedEl = document.createElement('div');
        failedEl.className = 'cursor-pointer';
        failedEl.innerHTML = `
          <div 
            class="rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style="
              width: ${failedSize}px; 
              height: ${failedSize}px; 
              background: rgba(239, 68, 68, 0.8);
              border: 2px solid #ef4444;
              box-shadow: 0 0 ${failedSize/2}px rgba(239, 68, 68, 0.5);
            "
          >
            <span style="color: white; font-size: ${Math.max(10, failedSize/3)}px; font-weight: bold;">
              ${loc.failedLoginCount}
            </span>
          </div>
        `;

        failedEl.addEventListener('click', () => {
          setSelectedSecurityLocation(loc);
          securityMap.current?.flyTo({ center: [loc.lon, loc.lat], zoom: 4, duration: 1500 });
        });

        const failedMarker = new mapboxgl.Marker(failedEl).setLngLat([loc.lon, loc.lat]).addTo(securityMap.current!);
        securityMarkersRef.current.push(failedMarker);
      }

      // Guest visit marker (blue) - offset slightly if both exist at same location
      if (loc.guestVisitCount > 0) {
        const guestSize = Math.min(20 + loc.guestVisitCount * 5, 50);
        const guestEl = document.createElement('div');
        guestEl.className = 'cursor-pointer';
        guestEl.innerHTML = `
          <div 
            class="rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style="
              width: ${guestSize}px; 
              height: ${guestSize}px; 
              background: rgba(59, 130, 246, 0.8);
              border: 2px solid #3b82f6;
              box-shadow: 0 0 ${guestSize/2}px rgba(59, 130, 246, 0.5);
            "
          >
            <span style="color: white; font-size: ${Math.max(10, guestSize/3)}px; font-weight: bold;">
              ${loc.guestVisitCount}
            </span>
          </div>
        `;

        guestEl.addEventListener('click', () => {
          setSelectedSecurityLocation(loc);
          securityMap.current?.flyTo({ center: [loc.lon, loc.lat], zoom: 4, duration: 1500 });
        });

        // Offset guest marker if there's also a failed login marker at same location
        // Use a larger offset (2 degrees) and offset in both directions for better visibility
        const hasFailedMarker = loc.failedLoginCount > 0;
        const offsetLon = hasFailedMarker ? loc.lon + 2 : loc.lon;
        const offsetLat = hasFailedMarker ? loc.lat - 1.5 : loc.lat;
        const guestMarker = new mapboxgl.Marker(guestEl).setLngLat([offsetLon, offsetLat]).addTo(securityMap.current!);
        securityMarkersRef.current.push(guestMarker);
      }
    });
  }, [securityLocations]);

  const parseBrowser = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  // Filtered activities for each section
  const successActivities = useMemo(() => {
    const filtered = allActivities.filter(a => a.type === 'successful_login');
    return showAllSuccessLogs ? filtered : filtered.slice(0, 5);
  }, [allActivities, showAllSuccessLogs]);

  const securityActivities = useMemo(() => {
    let filtered = allActivities.filter(a => a.type !== 'successful_login');
    if (securityFilter !== 'all') {
      filtered = filtered.filter(a => a.type === securityFilter);
    }
    return showAllSecurityLogs ? filtered : filtered.slice(0, 10);
  }, [allActivities, showAllSecurityLogs, securityFilter]);

  const stats = useMemo(() => ({
    successfulLogins: allActivities.filter(a => a.type === 'successful_login').length,
    failedLogins: allActivities.filter(a => a.type === 'failed_login').length,
    guestVisits: allActivities.filter(a => a.type === 'guest_visit').length,
  }), [allActivities]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'failed_login': return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'successful_login': return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'guest_visit': return <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case 'failed_login': return 'Failed Login';
      case 'successful_login': return 'Successful Login';
      case 'guest_visit': return 'Guest Visit';
    }
  };

  const renderLocationDetails = (location: IPLocation, onClose: () => void, mapRef: React.MutableRefObject<mapboxgl.Map | null>) => (
    <div className="p-4 border-t border-border/50 bg-secondary/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${
            location.failedLoginCount > 0 ? 'text-red-500' : 
            location.successfulLoginCount > 0 ? 'text-green-500' : 'text-blue-500'
          }`} />
          <div>
            <p className="font-medium">{location.city}, {location.country}</p>
            <p className="text-xs text-muted-foreground font-mono">{location.ip}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-secondary/30 rounded">
          <p className="text-lg font-bold">{location.totalCount}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        {location.successfulLoginCount > 0 && (
          <div className="text-center p-2 bg-green-500/10 rounded">
            <p className="text-lg font-bold text-green-500">{location.successfulLoginCount}</p>
            <p className="text-xs text-muted-foreground">Logins</p>
          </div>
        )}
        {location.failedLoginCount > 0 && (
          <div className="text-center p-2 bg-red-500/10 rounded">
            <p className="text-lg font-bold text-red-500">{location.failedLoginCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        )}
        {location.guestVisitCount > 0 && (
          <div className="text-center p-2 bg-blue-500/10 rounded">
            <p className="text-lg font-bold text-blue-500">{location.guestVisitCount}</p>
            <p className="text-xs text-muted-foreground">Guests</p>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {location.activities.slice(0, 5).map((activity) => (
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
  );

  const renderActivityLog = (
    activity: UnifiedActivity, 
    locations: IPLocation[], 
    mapRef: React.MutableRefObject<mapboxgl.Map | null>,
    setSelectedLocation: (loc: IPLocation | null) => void
  ) => {
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
                          if (location && mapRef.current) {
                            setSelectedLocation(location);
                            mapRef.current.flyTo({ center: [location.lon, location.lat], zoom: 4, duration: 1500 });
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
            <Badge 
              variant={activity.type === 'failed_login' ? 'destructive' : activity.type === 'successful_login' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {getActivityLabel(activity.type)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {activity.failure_reason && (
          <p className="text-xs text-red-400 mt-2 pl-6">Reason: {activity.failure_reason}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Side-by-side Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Globe 1: Successful Logins */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed border-muted-foreground/50">
                        Successful Logins
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Shows all <strong>successful login attempts</strong> to detect if someone logged in from an unexpected location.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500/20 text-green-400 text-xs">
                  {stats.successfulLogins} Logins
                </Badge>
                {successLocations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{successLocations.length} loc</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                <span>Successful logins</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full h-48 md:h-64">
              {mapboxToken ? (
                <div ref={successMapContainer} className="absolute inset-0" />
              ) : (
                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">{error || "Initializing map..."}</p>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-card/80 to-transparent" />
            </div>

            {selectedSuccessLocation && renderLocationDetails(selectedSuccessLocation, () => setSelectedSuccessLocation(null), successMap)}
          </CardContent>
        </Card>

        {/* Globe 2: Failed Logins + Guests */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed border-muted-foreground/50">
                        Security & Visitors
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Shows <strong>failed login attempts</strong> (suspicious activity) and <strong>guest visitors</strong> to your portfolio.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              {securityLocations.length > 0 && (
                <Badge variant="secondary" className="text-xs">{securityLocations.length} loc</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-red-400">{stats.failedLogins} Failed</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10">
                <Eye className="w-3 h-3 text-blue-500" />
                <span className="text-blue-400">{stats.guestVisits} Guests</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                <span>Failed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                <span>Guests</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full h-48 md:h-64">
              {mapboxToken ? (
                <div ref={securityMapContainer} className="absolute inset-0" />
              ) : (
                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">{error || "Initializing map..."}</p>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-card/80 to-transparent" />
            </div>

            {selectedSecurityLocation && renderLocationDetails(selectedSecurityLocation, () => setSelectedSecurityLocation(null), securityMap)}
          </CardContent>
        </Card>
      </div>

      {/* Side-by-side Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Success Login Logs */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              Successful Login History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successActivities.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No successful logins recorded yet.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {successActivities.map(activity => renderActivityLog(activity, successLocations, successMap, setSelectedSuccessLocation))}
                </div>
                {allActivities.filter(a => a.type === 'successful_login').length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllSuccessLogs(!showAllSuccessLogs)} className="w-full mt-3 text-xs">
                    {showAllSuccessLogs ? <><ChevronUp className="w-4 h-4 mr-1" />Show Less</> : <><ChevronDown className="w-4 h-4 mr-1" />View All ({stats.successfulLogins} entries)</>}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Security & Visitor Logs */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Security & Visitor Log
              </CardTitle>
              <div className="flex gap-1">
                {(['all', 'failed_login', 'guest_visit'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSecurityFilter(filter)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      securityFilter === filter 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'failed_login' ? 'Failed' : 'Guests'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {securityActivities.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No activity recorded yet.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {securityActivities.map(activity => renderActivityLog(activity, securityLocations, securityMap, setSelectedSecurityLocation))}
                </div>
                {allActivities.filter(a => a.type !== 'successful_login').length > 10 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllSecurityLogs(!showAllSecurityLogs)} className="w-full mt-3 text-xs">
                    {showAllSecurityLogs ? <><ChevronUp className="w-4 h-4 mr-1" />Show Less</> : <><ChevronDown className="w-4 h-4 mr-1" />View All ({stats.failedLogins + stats.guestVisits} entries)</>}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
