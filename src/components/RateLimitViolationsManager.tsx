import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Shield, 
  Ban, 
  Trash2, 
  MapPin, 
  Clock,
  Activity,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RateLimitViolation {
  id: string;
  ip_address: string;
  endpoint: string;
  violation_count: number;
  window_start: string;
  last_violation_at: string;
  alert_sent_at: string | null;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  is_blocked: boolean;
  created_at: string;
}

const getSeverityColor = (count: number) => {
  if (count >= 10) return "bg-destructive text-destructive-foreground";
  if (count >= 5) return "bg-amber-500 text-white";
  return "bg-blue-500 text-white";
};

const getSeverityLabel = (count: number) => {
  if (count >= 10) return "HIGH";
  if (count >= 5) return "MEDIUM";
  return "LOW";
};

export function RateLimitViolationsManager() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: violations, isLoading } = useQuery({
    queryKey: ['rate-limit-violations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .order('last_violation_at', { ascending: false });
      
      if (error) throw error;
      return data as RateLimitViolation[];
    },
  });

  // Real-time subscription for rate limit violations
  useEffect(() => {
    const channel = supabase
      .channel('rate-limit-violations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rate_limit_violations',
        },
        (payload) => {
          console.log('Rate limit violation change:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast.warning(`New rate limit violation from ${(payload.new as RateLimitViolation).ip_address}`);
          } else if (payload.eventType === 'UPDATE' && (payload.new as RateLimitViolation).is_blocked) {
            toast.info(`IP ${(payload.new as RateLimitViolation).ip_address} has been blocked`);
          }
          
          // Invalidate query to refresh data
          queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const blockIPMutation = useMutation({
    mutationFn: async (violation: RateLimitViolation) => {
      // Add to blocked_ips table
      const { error: blockError } = await supabase
        .from('blocked_ips')
        .upsert({
          ip_address: violation.ip_address,
          reason: `Rate limit abuse: ${violation.violation_count}x violations on ${violation.endpoint}`,
          notes: `Auto-blocked from rate limit dashboard. Location: ${violation.city || 'Unknown'}, ${violation.country || 'Unknown'}`,
          is_active: true,
          blocked_at: new Date().toISOString(),
        }, { 
          onConflict: 'ip_address' 
        });
      
      if (blockError) throw blockError;

      // Mark as blocked in violations table
      const { error: updateError } = await supabase
        .from('rate_limit_violations')
        .update({ is_blocked: true })
        .eq('id', violation.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP blocked successfully');
    },
    onError: (error) => {
      console.error('Failed to block IP:', error);
      toast.error('Failed to block IP');
    },
  });

  const deleteViolationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rate_limit_violations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] });
      toast.success('Violation record deleted');
    },
    onError: (error) => {
      console.error('Failed to delete violation:', error);
      toast.error('Failed to delete record');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] });
    setIsRefreshing(false);
  };

  const activeViolations = violations?.filter(v => !v.is_blocked) || [];
  const blockedViolations = violations?.filter(v => v.is_blocked) || [];
  const highSeverityCount = violations?.filter(v => v.violation_count >= 10).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Rate Limit Violations
                {highSeverityCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {highSeverityCount} High Severity
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                IPs that have been rate limited multiple times
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!violations || violations.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No rate limit violations recorded</p>
            <p className="text-sm mt-1">Violations will appear here when IPs exceed rate limits</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Violations */}
            {activeViolations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Active Violations ({activeViolations.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {activeViolations.map((violation) => (
                      <div 
                        key={violation.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                {violation.ip_address}
                              </code>
                              <Badge className={getSeverityColor(violation.violation_count)}>
                                {getSeverityLabel(violation.violation_count)}
                              </Badge>
                              <Badge variant="outline">
                                {violation.endpoint}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5" />
                                {violation.violation_count}x violations
                              </span>
                              {(violation.city || violation.country) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {[violation.city, violation.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDistanceToNow(new Date(violation.last_violation_at), { addSuffix: true })}
                              </span>
                            </div>

                            {violation.alert_sent_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Alert sent {formatDistanceToNow(new Date(violation.alert_sent_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => blockIPMutation.mutate(violation)}
                              disabled={blockIPMutation.isPending}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Block
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteViolationMutation.mutate(violation.id)}
                              disabled={deleteViolationMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Blocked Violations */}
            {blockedViolations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-destructive" />
                  Blocked ({blockedViolations.length})
                </h4>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {blockedViolations.map((violation) => (
                      <div 
                        key={violation.id}
                        className="p-3 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">
                              {violation.ip_address}
                            </code>
                            <Badge variant="secondary">
                              {violation.endpoint}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {violation.violation_count}x violations
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteViolationMutation.mutate(violation.id)}
                            disabled={deleteViolationMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
