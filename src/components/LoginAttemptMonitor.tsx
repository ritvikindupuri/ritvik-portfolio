import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Globe, Monitor, Clock } from "lucide-react";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface LoginStats {
  totalAttempts: number;
  successfulLogins: number;
  failedAttempts: number;
  recentAttempts: LoginAttempt[];
  suspiciousIps: { ip: string; count: number }[];
}

export const LoginAttemptMonitor = () => {
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  const fetchLoginAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching login attempts:', error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setStats({
          totalAttempts: 0,
          successfulLogins: 0,
          failedAttempts: 0,
          recentAttempts: [],
          suspiciousIps: [],
        });
        setLoading(false);
        return;
      }

      const successfulLogins = data.filter(a => a.success).length;
      const failedAttempts = data.filter(a => !a.success).length;

      // Find IPs with multiple failed attempts
      const ipFailures: Record<string, number> = {};
      data.forEach(attempt => {
        if (!attempt.success && attempt.ip_address) {
          ipFailures[attempt.ip_address] = (ipFailures[attempt.ip_address] || 0) + 1;
        }
      });

      const suspiciousIps = Object.entries(ipFailures)
        .filter(([_, count]) => count >= 3)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalAttempts: data.length,
        successfulLogins,
        failedAttempts,
        recentAttempts: data.slice(0, 10),
        suspiciousIps,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const parseBrowser = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading login attempts...
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalAttempts === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Login Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-4">
          No login attempts recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Login Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.totalAttempts}</p>
            <p className="text-xs text-muted-foreground">Total Attempts</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-500">{stats.successfulLogins}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <p className="text-2xl font-bold text-red-500">{stats.failedAttempts}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Suspicious IPs */}
        {stats.suspiciousIps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              Suspicious Activity
            </h4>
            <div className="space-y-1">
              {stats.suspiciousIps.map(({ ip, count }) => (
                <div key={ip} className="flex items-center justify-between text-sm p-2 bg-amber-500/10 rounded-lg">
                  <span className="font-mono text-xs">{ip}</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                    {count} failed
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className={`flex items-center justify-between text-xs p-2 rounded-lg ${
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="w-3 h-3" />
                  <span>{parseBrowser(attempt.user_agent)}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(attempt.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};