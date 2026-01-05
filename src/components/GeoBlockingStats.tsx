import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Shield, Flag, AlertTriangle, Info } from "lucide-react";

interface GeoRule {
  id: string;
  country_code: string;
  country_name: string;
  action: "block" | "flag";
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
}

export const GeoBlockingStats = () => {
  const [rules, setRules] = useState<GeoRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();

    const channel = supabase
      .channel('geo-stats-changes')
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
      .order('trigger_count', { ascending: false });

    if (!error && data) {
      setRules(data as GeoRule[]);
    }
    setLoading(false);
  };

  const activeBlocks = rules.filter(r => r.is_active && r.action === 'block');
  const activeFlags = rules.filter(r => r.is_active && r.action === 'flag');
  const totalTriggers = rules.reduce((sum, r) => sum + r.trigger_count, 0);
  const topTriggered = rules.filter(r => r.trigger_count > 0).slice(0, 3);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Loading geo-blocking stats...
        </CardContent>
      </Card>
    );
  }

  if (rules.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm">Geographic Blocking</span>
          </div>
          <p className="text-xs text-muted-foreground">
            No geographic rules configured. Configure in the Geo-Block tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm">Geographic Blocking</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Country-based login blocking. Blocked logins are rejected; flagged logins trigger alerts but are allowed.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20 cursor-help">
                  <div className="text-red-400 text-lg font-bold">{activeBlocks.length}</div>
                  <div className="text-[10px] text-muted-foreground">Blocked</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Countries where logins are completely blocked</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center border border-yellow-500/20 cursor-help">
                  <div className="text-yellow-400 text-lg font-bold">{activeFlags.length}</div>
                  <div className="text-[10px] text-muted-foreground">Flagged</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Countries where logins trigger alerts but are allowed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-purple-500/10 rounded-lg p-2 text-center border border-purple-500/20 cursor-help">
                  <div className="text-purple-400 text-lg font-bold">{totalTriggers}</div>
                  <div className="text-[10px] text-muted-foreground">Triggers</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Total login attempts that matched geographic rules</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {topTriggered.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Triggered</div>
            {topTriggered.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1"
              >
                <div className="flex items-center gap-1.5">
                  {rule.action === 'block' ? (
                    <Shield className="w-3 h-3 text-red-400" />
                  ) : (
                    <Flag className="w-3 h-3 text-yellow-400" />
                  )}
                  <span>{rule.country_name}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {rule.country_code}
                  </Badge>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-[9px] px-1.5 py-0 ${
                    rule.action === 'block' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {rule.trigger_count}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {totalTriggers === 0 && activeBlocks.length + activeFlags.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg p-2 border border-green-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>No geographic rule triggers yet</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
