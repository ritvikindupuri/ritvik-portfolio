import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, ArrowRight, TrendingUp, Users } from "lucide-react";

interface VisitorActivity {
  id: string;
  session_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface JourneyStep {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

interface SectionStats {
  section: string;
  entryCount: number;
  exitCount: number;
  avgPosition: number;
}

// Color mapping for sections
const sectionColors: Record<string, string> = {
  'Hero': 'bg-blue-500',
  'About': 'bg-purple-500',
  'Experience': 'bg-green-500',
  'Projects': 'bg-orange-500',
  'Skills': 'bg-cyan-500',
  'ML Showcase': 'bg-pink-500',
  'LLM Showcase': 'bg-indigo-500',
  'Certifications': 'bg-yellow-500',
  'Documentation': 'bg-red-500',
  'Contact': 'bg-emerald-500',
  'START': 'bg-primary',
  'EXIT': 'bg-muted-foreground',
};

export const VisitorJourneyFlow = () => {
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('visitor_activity')
        .select('*')
        .eq('activity_type', 'section_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate journey transitions
  const journeyData = useMemo(() => {
    // Group activities by session
    const sessionActivities: Record<string, VisitorActivity[]> = {};
    activities.forEach(activity => {
      if (!sessionActivities[activity.session_id]) {
        sessionActivities[activity.session_id] = [];
      }
      sessionActivities[activity.session_id].push(activity);
    });

    // Calculate transitions between sections
    const transitions: Record<string, number> = {};
    const sectionEntries: Record<string, number> = {};
    const sectionExits: Record<string, number> = {};
    const sectionPositions: Record<string, number[]> = {};
    let totalTransitions = 0;

    Object.values(sessionActivities).forEach(sessionActs => {
      // Sort by timestamp
      const sorted = sessionActs.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sorted.forEach((activity, index) => {
        const section = activity.activity_data?.section || 'Unknown';
        
        // Track position in journey
        if (!sectionPositions[section]) sectionPositions[section] = [];
        sectionPositions[section].push(index + 1);

        // First section = entry point
        if (index === 0) {
          sectionEntries[section] = (sectionEntries[section] || 0) + 1;
        }

        // Last section = exit point
        if (index === sorted.length - 1) {
          sectionExits[section] = (sectionExits[section] || 0) + 1;
        }

        // Track transitions
        if (index < sorted.length - 1) {
          const nextSection = sorted[index + 1].activity_data?.section || 'Unknown';
          const transitionKey = `${section}→${nextSection}`;
          transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
          totalTransitions++;
        }
      });
    });

    // Convert to sorted array of journey steps
    const journeySteps: JourneyStep[] = Object.entries(transitions)
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return {
          from,
          to,
          count,
          percentage: Math.round((count / totalTransitions) * 100)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 transitions

    // Section stats
    const sectionStats: SectionStats[] = Object.keys(sectionPositions).map(section => ({
      section,
      entryCount: sectionEntries[section] || 0,
      exitCount: sectionExits[section] || 0,
      avgPosition: sectionPositions[section].length > 0 
        ? Math.round(sectionPositions[section].reduce((a, b) => a + b, 0) / sectionPositions[section].length * 10) / 10
        : 0
    })).sort((a, b) => a.avgPosition - b.avgPosition);

    // Most common first section (entry point)
    const topEntryPoints = Object.entries(sectionEntries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Most common last section (exit point)
    const topExitPoints = Object.entries(sectionExits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      journeySteps,
      sectionStats,
      topEntryPoints,
      topExitPoints,
      totalSessions: Object.keys(sessionActivities).length,
      totalTransitions
    };
  }, [activities]);

  const getSectionColor = (section: string) => {
    return sectionColors[section] || 'bg-secondary';
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading journey data...
        </CardContent>
      </Card>
    );
  }

  if (journeyData.journeySteps.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Not enough journey data yet. Check back after more visitors browse the portfolio.
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journeyData.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Journeys Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Route className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journeyData.totalTransitions}</p>
                <p className="text-xs text-muted-foreground">Total Transitions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold truncate">
                  {journeyData.topEntryPoints[0]?.[0] || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Top Entry Point</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <ArrowRight className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold truncate">
                  {journeyData.topExitPoints[0]?.[0] || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Top Exit Point</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Journey Flow Visualization */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" />
              Top Visitor Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {journeyData.journeySteps.map((step, index) => (
                <motion.div
                  key={`${step.from}-${step.to}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  
                  <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getSectionColor(step.from)}`}>
                    {step.from}
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-8 h-px bg-border" />
                    <ArrowRight className="w-3 h-3" />
                    <div className="w-8 h-px bg-border" />
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getSectionColor(step.to)}`}>
                    {step.to}
                  </div>
                  
                  <div className="flex-1" />
                  
                  <Badge variant="secondary" className="text-xs">
                    {step.count} ({step.percentage}%)
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Journey Position */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Typical Section Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {journeyData.sectionStats.map((stat, index) => (
                <motion.div
                  key={stat.section}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getSectionColor(stat.section)}`}>
                    {stat.avgPosition}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stat.section}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Entry: {stat.entryCount}</span>
                      <span>•</span>
                      <span>Exit: {stat.exitCount}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Avg Position</p>
                    <p className="text-sm font-bold">{stat.avgPosition}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry/Exit Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-400">🚪 Entry Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {journeyData.topEntryPoints.map(([section, count], index) => (
                <div key={section} className="flex items-center gap-3">
                  <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getSectionColor(section)}`}>
                    {section}
                  </div>
                  <div className="flex-1" />
                  <Badge variant="outline">{count} visitors</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Where visitors start their journey
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-400">🚶 Exit Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {journeyData.topExitPoints.map(([section, count], index) => (
                <div key={section} className="flex items-center gap-3">
                  <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getSectionColor(section)}`}>
                    {section}
                  </div>
                  <div className="flex-1" />
                  <Badge variant="outline">{count} visitors</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Where visitors end their journey
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
