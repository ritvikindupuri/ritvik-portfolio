import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Shield, ShieldOff, Plus, Trash2, Clock, 
  AlertTriangle, Ban, RefreshCw, Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  honeypot_triggers: number;
  last_honeypot_email: string | null;
  is_active: boolean;
  notes: string | null;
}

export const BlockedIPsManager = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    fetchBlockedIPs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('blocked-ips-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_ips' },
        () => fetchBlockedIPs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      setBlockedIPs(data || []);
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
      toast.error("Failed to load blocked IPs");
    } finally {
      setLoading(false);
    }
  };

  const addBlockedIP = async () => {
    if (!newIP.trim()) {
      toast.error("Please enter an IP address");
      return;
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIP.trim())) {
      toast.error("Please enter a valid IPv4 address");
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: newIP.trim(),
          reason: newReason.trim() || "Manually blocked",
          is_active: true
        });

      if (error) throw error;
      
      toast.success("IP address blocked successfully");
      setNewIP("");
      setNewReason("");
      fetchBlockedIPs();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("This IP is already blocked");
      } else {
        console.error("Error blocking IP:", error);
        toast.error("Failed to block IP");
      }
    }
  };

  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(currentStatus ? "IP unblocked" : "IP blocked");
      fetchBlockedIPs();
    } catch (error) {
      console.error("Error toggling block status:", error);
      toast.error("Failed to update block status");
    }
  };

  const deleteBlockedIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Block removed");
      fetchBlockedIPs();
    } catch (error) {
      console.error("Error deleting blocked IP:", error);
      toast.error("Failed to remove block");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatExpiresIn = (dateStr: string | null) => {
    if (!dateStr) return "Permanent";
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffHours < 24) return `${diffHours}h remaining`;
    return `${diffDays}d remaining`;
  };

  const activeBlocks = blockedIPs.filter(ip => ip.is_active).length;
  const autoBlocks = blockedIPs.filter(ip => ip.honeypot_triggers > 0).length;

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading blocked IPs...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            IP Block List
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Block malicious IPs manually or automatically after honeypot triggers
          </p>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-destructive">{blockedIPs.length}</p>
              <p className="text-xs text-muted-foreground">Total Blocks</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-amber-400">{activeBlocks}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold text-purple-400">{autoBlocks}</p>
              <p className="text-xs text-muted-foreground">Auto-Blocked</p>
            </div>
          </div>

          {/* Add new block */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Block New IP</p>
            <div className="flex gap-2">
              <Input
                placeholder="192.168.1.100"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Reason (optional)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addBlockedIP} size="icon" className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs List */}
      <div className="space-y-3">
        {blockedIPs.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No blocked IPs</p>
              <p className="text-xs">IPs will be auto-blocked after 3 honeypot triggers</p>
            </CardContent>
          </Card>
        ) : (
          blockedIPs.map((ip) => (
            <Card 
              key={ip.id} 
              className={`bg-card/50 backdrop-blur-sm border-border/50 ${!ip.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={ip.is_active}
                            onCheckedChange={() => toggleBlockStatus(ip.id, ip.is_active)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {ip.is_active ? "Click to unblock" : "Click to reactivate block"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-foreground">{ip.ip_address}</code>
                        {ip.honeypot_triggers > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-purple-400 border-purple-500/30 text-xs">
                                  🍯 {ip.honeypot_triggers}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Auto-blocked after {ip.honeypot_triggers} honeypot triggers</p>
                                {ip.last_honeypot_email && (
                                  <p className="text-xs text-muted-foreground">Last: {ip.last_honeypot_email}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {ip.is_active ? (
                          <Badge className="bg-destructive/20 text-destructive text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ip.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatExpiresIn(ip.expires_at)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {ip.expires_at 
                              ? `Expires: ${new Date(ip.expires_at).toLocaleString()}`
                              : "This block is permanent until manually removed"
                            }
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-muted-foreground/60">Blocked {formatTimeAgo(ip.blocked_at)}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteBlockedIP(ip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Auto-block Info */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-400">Automatic IP Blocking</p>
              <p className="text-xs text-muted-foreground mt-1">
                IPs are automatically blocked for 24 hours after triggering 3 or more honeypot accounts. 
                This helps protect against persistent attackers attempting default credential attacks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};