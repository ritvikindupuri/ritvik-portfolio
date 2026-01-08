import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IndexingStats {
  totalProjects: number;
  indexedProjects: number;
  lastIndexed: string | null;
  missingProjects: Array<{ title: string; github_url: string }>;
}

export const GitHubIndexingStatus = () => {
  const [stats, setStats] = useState<IndexingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get all projects with GitHub URLs
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, github_url')
        .not('github_url', 'is', null)
        .neq('github_url', '');

      // Get indexed GitHub content
      const { data: githubContent } = await supabase
        .from('github_content')
        .select('github_url, indexed_at')
        .order('indexed_at', { ascending: false });

      const indexedUrls = new Set(githubContent?.map(gc => gc.github_url) || []);
      const lastIndexed = githubContent?.[0]?.indexed_at || null;

      const missingProjects = (projects || []).filter(
        p => p.github_url && !indexedUrls.has(p.github_url)
      );

      setStats({
        totalProjects: projects?.length || 0,
        indexedProjects: (projects || []).filter(p => indexedUrls.has(p.github_url)).length,
        lastIndexed,
        missingProjects: missingProjects.map(p => ({ 
          title: p.title, 
          github_url: p.github_url 
        })),
      });
    } catch (error) {
      console.error('Error fetching indexing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const indexPercentage = stats ? Math.round((stats.indexedProjects / stats.totalProjects) * 100) : 0;
  const isFullyIndexed = stats?.indexedProjects === stats?.totalProjects;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            GitHub Content Indexing
          </CardTitle>
          <Badge 
            variant={isFullyIndexed ? "default" : "secondary"}
            className={isFullyIndexed ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            {isFullyIndexed ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> All Indexed</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> {stats?.missingProjects.length} Missing</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats?.totalProjects || 0}</div>
            <div className="text-xs text-muted-foreground">Total Projects</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats?.indexedProjects || 0}</div>
            <div className="text-xs text-muted-foreground">Indexed</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{indexPercentage}%</div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
              style={{ width: `${indexPercentage}%` }}
            />
          </div>
        </div>

        {/* Last Indexed */}
        {stats?.lastIndexed && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last indexed: {formatDistanceToNow(new Date(stats.lastIndexed), { addSuffix: true })}</span>
          </div>
        )}

        {/* Missing Projects */}
        {stats?.missingProjects && stats.missingProjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-400">Missing READMEs:</p>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {stats.missingProjects.map((p, i) => (
                <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{p.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-indexing info */}
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Auto-indexing enabled:</span> GitHub content is automatically re-indexed when projects are added or updated via database webhooks.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};