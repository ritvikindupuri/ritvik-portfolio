import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Plus, Trash2, Bell, BellOff, Shield, Flag, AlertTriangle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Common countries list for quick selection
const COMMON_COUNTRIES = [
  { code: "CN", name: "China" },
  { code: "RU", name: "Russia" },
  { code: "KP", name: "North Korea" },
  { code: "IR", name: "Iran" },
  { code: "BY", name: "Belarus" },
  { code: "VE", name: "Venezuela" },
  { code: "CU", name: "Cuba" },
  { code: "SY", name: "Syria" },
  { code: "NG", name: "Nigeria" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "IN", name: "India" },
  { code: "VN", name: "Vietnam" },
  { code: "UA", name: "Ukraine" },
  { code: "BR", name: "Brazil" },
];

interface GeographicRule {
  id: string;
  country_code: string;
  country_name: string;
  action: "block" | "flag";
  is_active: boolean;
  notify_on_trigger: boolean;
  reason: string | null;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

export const GeographicBlockingManager = () => {
  const [rules, setRules] = useState<GeographicRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [customCountryName, setCustomCountryName] = useState("");
  const [action, setAction] = useState<"block" | "flag">("block");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchRules();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('geo-rules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'geographic_blocking_rules'
        },
        () => fetchRules()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('geographic_blocking_rules')
      .select('*')
      .order('country_name', { ascending: true });

    if (error) {
      console.error("Error fetching geographic rules:", error);
    } else {
      setRules(data as GeographicRule[] || []);
    }
    setLoading(false);
  };

  const addRule = async () => {
    let countryCode: string;
    let countryName: string;

    if (selectedCountry) {
      const country = COMMON_COUNTRIES.find(c => c.code === selectedCountry);
      if (!country) return;
      countryCode = country.code;
      countryName = country.name;
    } else if (customCountryCode && customCountryName) {
      countryCode = customCountryCode.toUpperCase();
      countryName = customCountryName;
    } else {
      toast({
        title: "Missing Information",
        description: "Please select a country or enter custom country details",
        variant: "destructive"
      });
      return;
    }

    // Check if already exists
    if (rules.some(r => r.country_code === countryCode)) {
      toast({
        title: "Rule Exists",
        description: `A rule for ${countryName} already exists`,
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('geographic_blocking_rules')
      .insert({
        country_code: countryCode,
        country_name: countryName,
        action,
        reason: reason || null,
        is_active: true,
        notify_on_trigger: true
      });

    if (error) {
      console.error("Error adding rule:", error);
      toast({
        title: "Error",
        description: "Failed to add geographic rule",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Rule Added",
        description: `${action === 'block' ? 'Blocking' : 'Flagging'} logins from ${countryName}`
      });
      setSelectedCountry("");
      setCustomCountryCode("");
      setCustomCountryName("");
      setReason("");
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('geographic_blocking_rules')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const toggleNotify = async (id: string, notify: boolean) => {
    const { error } = await supabase
      .from('geographic_blocking_rules')
      .update({ notify_on_trigger: !notify })
      .eq('id', id);

    if (error) {
      console.error("Error toggling notification:", error);
    }
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('geographic_blocking_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting rule:", error);
    } else {
      toast({
        title: "Rule Deleted",
        description: "Geographic blocking rule removed"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Stats
  const activeBlocks = rules.filter(r => r.is_active && r.action === 'block').length;
  const activeFlags = rules.filter(r => r.is_active && r.action === 'flag').length;
  const totalTriggers = rules.reduce((sum, r) => sum + r.trigger_count, 0);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading geographic rules...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg">Geographic Blocking</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Block or flag login attempts from specific countries. Blocked logins are rejected; flagged logins trigger alerts but are allowed.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Block or flag login attempts from specific countries/regions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
            <div className="text-red-400 text-xl font-bold">{activeBlocks}</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20">
            <div className="text-yellow-400 text-xl font-bold">{activeFlags}</div>
            <div className="text-xs text-muted-foreground">Flagged</div>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/20">
            <div className="text-purple-400 text-xl font-bold">{totalTriggers}</div>
            <div className="text-xs text-muted-foreground">Triggers</div>
          </div>
        </div>

        {/* Add Rule Form */}
        <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="text-sm font-medium">Add New Rule</div>
          
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_COUNTRIES.filter(c => !rules.some(r => r.country_code === c.code)).map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={(v) => setAction(v as "block" | "flag")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    Block
                  </div>
                </SelectItem>
                <SelectItem value="flag">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-yellow-400" />
                    Flag Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">Or add custom country:</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Country code (e.g., XX)"
              value={customCountryCode}
              onChange={(e) => setCustomCountryCode(e.target.value.slice(0, 2))}
              maxLength={2}
              disabled={!!selectedCountry}
            />
            <Input
              placeholder="Country name"
              value={customCountryName}
              onChange={(e) => setCustomCountryName(e.target.value)}
              disabled={!!selectedCountry}
            />
          </div>

          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Button onClick={addRule} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Rules List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No geographic rules configured</p>
              <p className="text-xs mt-1">Add countries to block or flag login attempts</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  rule.is_active
                    ? rule.action === 'block'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-muted/20 border-border/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.country_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {rule.country_code}
                      </Badge>
                      {rule.action === 'block' ? (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Block
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          <Flag className="w-3 h-3 mr-1" />
                          Flag
                        </Badge>
                      )}
                      {rule.trigger_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {rule.trigger_count} triggers
                        </Badge>
                      )}
                    </div>
                    {rule.reason && (
                      <div className="text-xs text-muted-foreground mt-1">{rule.reason}</div>
                    )}
                    {rule.last_triggered_at && (
                      <div className="text-xs text-muted-foreground">
                        Last triggered: {formatTimeAgo(rule.last_triggered_at)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleNotify(rule.id, rule.notify_on_trigger)}
                        >
                          {rule.notify_on_trigger ? (
                            <Bell className="w-4 h-4 text-green-400" />
                          ) : (
                            <BellOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {rule.notify_on_trigger ? "Notifications enabled" : "Notifications disabled"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="font-medium text-blue-400">How Geographic Blocking Works</div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p><strong>Block:</strong> Login attempts from this country are rejected outright.</p>
                <p><strong>Flag:</strong> Login attempts are allowed but trigger an email alert.</p>
                <p>Country detection uses IP geolocation during authentication.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
