import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, Globe, Monitor, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  recentEvents: {
    id: string;
    event_type: string;
    user_agent: string | null;
    referrer: string | null;
    created_at: string;
  }[];
  topReferrers: { referrer: string; count: number }[];
  topBrowsers: { browser: string; count: number }[];
}

export const ResumeAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
        return;
      }

      const events = data || [];
      
      // Calculate stats
      const totalViews = events.filter(e => e.event_type === 'view').length;
      const totalDownloads = events.filter(e => e.event_type === 'download').length;

      // Get top referrers
      const referrerCounts: Record<string, number> = {};
      events.forEach(e => {
        const ref = e.referrer || 'Direct';
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
      });
      const topReferrers = Object.entries(referrerCounts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Parse browsers from user agent
      const browserCounts: Record<string, number> = {};
      events.forEach(e => {
        const browser = parseBrowser(e.user_agent || '');
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      });
      const topBrowsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalViews,
        totalDownloads,
        recentEvents: events.slice(0, 10),
        topReferrers,
        topBrowsers,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseBrowser = (userAgent: string): string => {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    return 'Other';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Resume Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Eye className="w-4 h-4" />
              Total Views
            </div>
            <div className="text-2xl font-bold text-primary">{analytics.totalViews}</div>
          </div>
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Download className="w-4 h-4" />
              Downloads
            </div>
            <div className="text-2xl font-bold text-accent">{analytics.totalDownloads}</div>
          </div>
        </div>

        {/* Browsers */}
        {analytics.topBrowsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Top Browsers
            </h4>
            <div className="space-y-2">
              {analytics.topBrowsers.map(({ browser, count }) => (
                <div key={browser} className="flex items-center justify-between text-sm">
                  <span>{browser}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referrers */}
        {analytics.topReferrers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Traffic Sources
            </h4>
            <div className="space-y-2">
              {analytics.topReferrers.map(({ referrer, count }) => (
                <div key={referrer} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[200px]">{referrer}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        {analytics.recentEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analytics.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/30">
                  <div className="flex items-center gap-2">
                    {event.event_type === 'view' ? (
                      <Eye className="w-3 h-3 text-primary" />
                    ) : (
                      <Download className="w-3 h-3 text-accent" />
                    )}
                    <span className="capitalize">{event.event_type}</span>
                  </div>
                  <span className="text-muted-foreground">{formatDate(event.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.totalViews === 0 && analytics.totalDownloads === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No resume activity yet. Share your portfolio to start tracking!
          </p>
        )}
      </CardContent>
    </Card>
  );
};