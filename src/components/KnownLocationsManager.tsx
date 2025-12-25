import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Shield, ShieldCheck, ShieldAlert, Clock, 
  Trash2, CheckCircle, XCircle, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KnownLocation {
  id: string;
  ip_address: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
  times_seen: number;
  notes: string | null;
}

export const KnownLocationsManager = () => {
  const [locations, setLocations] = useState<KnownLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();

    const channel = supabase
      .channel('known_locations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'known_login_locations' }, () => fetchLocations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('known_login_locations')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrust = async (location: KnownLocation) => {
    setUpdating(location.id);
    try {
      const { error } = await supabase
        .from('known_login_locations')
        .update({ is_trusted: !location.is_trusted })
        .eq('id', location.id);

      if (error) throw error;
      
      toast.success(
        location.is_trusted 
          ? `Removed trust for ${location.city || location.ip_address}` 
          : `Marked ${location.city || location.ip_address} as trusted`
      );
      fetchLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setUpdating(null);
    }
  };

  const deleteLocation = async (location: KnownLocation) => {
    try {
      const { error } = await supabase
        .from('known_login_locations')
        .delete()
        .eq('id', location.id);

      if (error) throw error;
      
      toast.success(`Deleted ${location.city || location.ip_address}`);
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const trustedLocations = locations.filter(l => l.is_trusted);
  const newLocations = locations.filter(l => !l.is_trusted);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const LocationCard = ({ location, showTrustBadge = true }: { location: KnownLocation; showTrustBadge?: boolean }) => (
    <div className={`p-4 rounded-lg border ${
      location.is_trusted 
        ? 'bg-green-500/5 border-green-500/20' 
        : 'bg-yellow-500/5 border-yellow-500/20'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${location.is_trusted ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
            {location.is_trusted ? (
              <ShieldCheck className="w-5 h-5 text-green-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {location.city && location.country 
                  ? `${location.city}, ${location.country}` 
                  : 'Unknown Location'}
              </span>
              {showTrustBadge && (
                <Badge variant={location.is_trusted ? 'default' : 'secondary'} className="text-xs">
                  {location.is_trusted ? 'Trusted' : 'New'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">{location.ip_address}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                First: {formatDate(location.first_seen_at)}
              </span>
              <span>Last: {formatDate(location.last_seen_at)}</span>
              <span>{location.times_seen} login{location.times_seen !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleTrust(location)}
            disabled={updating === location.id}
            className={`text-xs ${location.is_trusted ? 'text-yellow-500 hover:text-yellow-600' : 'text-green-500 hover:text-green-600'}`}
          >
            {updating === location.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : location.is_trusted ? (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Untrust
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Trust
              </>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Location</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this location? If you login from this IP again, you'll receive a new location alert.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteLocation(location)} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading locations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trusted Locations */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Trusted Locations
            </CardTitle>
            <Badge variant="default" className="bg-green-500/20 text-green-400">
              {trustedLocations.length} location{trustedLocations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Locations you've verified as safe. No alerts will be sent for logins from these IPs.
          </p>
        </CardHeader>
        <CardContent>
          {trustedLocations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No trusted locations yet. Mark a location as trusted to add it here.
            </p>
          ) : (
            <div className="space-y-3">
              {trustedLocations.map(location => (
                <LocationCard key={location.id} location={location} showTrustBadge={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New/Unverified Locations */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              New / Unverified Locations
            </CardTitle>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
              {newLocations.length} location{newLocations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Locations that triggered a new login alert. Review and mark as trusted if they're legitimate.
          </p>
        </CardHeader>
        <CardContent>
          {newLocations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No new locations detected. All your login locations are trusted.
            </p>
          ) : (
            <div className="space-y-3">
              {newLocations.map(location => (
                <LocationCard key={location.id} location={location} showTrustBadge={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
