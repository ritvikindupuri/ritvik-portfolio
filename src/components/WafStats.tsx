import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, ShieldCheck, Activity, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getWafConfig } from "@/lib/waf-proxy";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface WafEvent {
  id: string;
  function_name: string;
  blocked: boolean;
  reason: string | null;
  waf_mode: string;
  created_at: string;
}

export const WafStats = () => {
  const [events, setEvents] = useState<WafEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const config = getWafConfig();

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('waf_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500) as { data: WafEvent[] | null; error: any };

    if (!error && data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const clearEvents = async () => {
    const { error } = await supabase.from('waf_events').delete().neq('id', '');
    if (error) {
      toast.error("Failed to clear WAF events");
    } else {
      setEvents([]);
      toast.success("WAF events cleared");
    }
  };

  const totalRequests = events.length;
  const blockedRequests = events.filter(e => e.blocked).length;
  const allowedRequests = totalRequests - blockedRequests;
  const blockRate = totalRequests > 0 ? ((blockedRequests / totalRequests) * 100).toFixed(1) : '0';

  // Stats by function
  const functionStats = events.reduce((acc, e) => {
    if (!acc[e.function_name]) acc[e.function_name] = { name: e.function_name, blocked: 0, allowed: 0 };
    if (e.blocked) acc[e.function_name].blocked++;
    else acc[e.function_name].allowed++;
    return acc;
  }, {} as Record<string, { name: string; blocked: number; allowed: number }>);

  const functionChartData = Object.values(functionStats);

  // Pie chart data
  const pieData = [
    { name: 'Allowed', value: allowedRequests },
    { name: 'Blocked', value: blockedRequests },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(0, 84%, 60%)'];

  // Recent blocked with reasons
  const recentBlocked = events.filter(e => e.blocked).slice(0, 5);

  // Daily trend (last 7 days)
  const dailyTrend = (() => {
    const days: Record<string, { date: string; blocked: number; allowed: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: key, blocked: 0, allowed: 0 };
    }
    events.forEach(e => {
      const key = e.created_at.split('T')[0];
      if (days[key]) {
        if (e.blocked) days[key].blocked++;
        else days[key].allowed++;
      }
    });
    return Object.values(days).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  })();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg">WAF Analytics (Deflectra)</CardTitle>
            <Badge variant={config.enabled ? "default" : "secondary"} className="text-xs">
              {config.mode === 'full_proxy' ? 'Full Proxy' : 'Pre-flight'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearEvents} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalRequests}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{allowedRequests}</p>
            <p className="text-xs text-muted-foreground">Allowed</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{blockedRequests}</p>
            <p className="text-xs text-muted-foreground">Blocked</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <p className="text-2xl font-bold">{blockRate}%</p>
            <p className="text-xs text-muted-foreground">Block Rate</p>
          </div>
        </div>

        {totalRequests === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No WAF events recorded yet.</p>
            <p className="text-xs mt-1">Events will appear here as visitors interact with protected endpoints.</p>
          </div>
        ) : (
          <>
            {/* Daily Trend */}
            <div>
              <h4 className="text-sm font-medium mb-3">7-Day Trend</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="allowed" fill="hsl(var(--primary))" name="Allowed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="blocked" fill="hsl(0, 84%, 60%)" name="Blocked" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Endpoint + Pie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3">By Endpoint</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={functionChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10 }} 
                      width={120}
                      tickFormatter={(v) => v.replace('send-', '').replace('-', ' ')}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="allowed" fill="hsl(var(--primary))" name="Allowed" stackId="a" />
                    <Bar dataKey="blocked" fill="hsl(0, 84%, 60%)" name="Blocked" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Block Ratio</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Allowed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" /> Blocked
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Blocked */}
            {recentBlocked.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 text-destructive">Recent Blocked Requests</h4>
                <div className="space-y-2">
                  {recentBlocked.map(e => (
                    <div key={e.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-lg p-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
                        <span className="font-mono text-xs">{e.function_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {e.reason || 'Blocked'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Protected Endpoints */}
            <div>
              <h4 className="text-sm font-medium mb-2">Protected Endpoints</h4>
              <div className="flex flex-wrap gap-2">
                {config.protectedFunctions.map(fn => (
                  <Badge key={fn} variant="outline" className="font-mono text-xs">
                    {fn}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
