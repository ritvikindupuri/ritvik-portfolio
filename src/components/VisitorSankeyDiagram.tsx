import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface VisitorActivity {
  id: string;
  session_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  percentage: number;
}

interface DropoffData {
  section: string;
  visitors: number;
  continued: number;
  dropped: number;
  dropoffRate: number;
  retentionRate: number;
}

// Section order for funnel analysis
const SECTION_ORDER = [
  'Hero',
  'About', 
  'Experience',
  'Projects',
  'Skills',
  'ML Showcase',
  'LLM Showcase',
  'Certifications',
  'Documentation',
  'Contact'
];

// Color mapping for sections
const sectionColors: Record<string, string> = {
  'Hero': '#3b82f6',
  'About': '#8b5cf6',
  'Experience': '#22c55e',
  'Projects': '#f97316',
  'Skills': '#06b6d4',
  'ML Showcase': '#ec4899',
  'LLM Showcase': '#6366f1',
  'Certifications': '#eab308',
  'Documentation': '#ef4444',
  'Contact': '#10b981',
};

export const VisitorSankeyDiagram = () => {
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
      console.error('Error fetching Sankey data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Sankey flow data and drop-off analysis
  const { flowLinks, dropoffData, maxFlowValue, totalSessions } = useMemo(() => {
    // Group activities by session
    const sessionActivities: Record<string, VisitorActivity[]> = {};
    activities.forEach(activity => {
      if (!sessionActivities[activity.session_id]) {
        sessionActivities[activity.session_id] = [];
      }
      sessionActivities[activity.session_id].push(activity);
    });

    const totalSessions = Object.keys(sessionActivities).length;

    // Calculate flow transitions for Sankey
    const flowCounts: Record<string, number> = {};
    let totalFlows = 0;

    // Calculate section visit counts and continuation
    const sectionVisitors: Record<string, Set<string>> = {};
    const sectionContinued: Record<string, Set<string>> = {};

    Object.entries(sessionActivities).forEach(([sessionId, sessionActs]) => {
      // Sort by timestamp
      const sorted = sessionActs.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Get unique sections in order (deduplicate consecutive same sections)
      const uniqueSections: string[] = [];
      sorted.forEach(activity => {
        const section = activity.activity_data?.section || 'Unknown';
        if (uniqueSections[uniqueSections.length - 1] !== section) {
          uniqueSections.push(section);
        }
      });

      // Track section visitors
      uniqueSections.forEach((section, index) => {
        if (!sectionVisitors[section]) sectionVisitors[section] = new Set();
        sectionVisitors[section].add(sessionId);

        // If there's a next section, this visitor continued
        if (index < uniqueSections.length - 1) {
          if (!sectionContinued[section]) sectionContinued[section] = new Set();
          sectionContinued[section].add(sessionId);
        }
      });

      // Calculate transitions for Sankey
      for (let i = 0; i < uniqueSections.length - 1; i++) {
        const source = uniqueSections[i];
        const target = uniqueSections[i + 1];
        const key = `${source}|${target}`;
        flowCounts[key] = (flowCounts[key] || 0) + 1;
        totalFlows++;
      }
    });

    // Convert to flow links array for Sankey
    const flowLinks: FlowLink[] = Object.entries(flowCounts)
      .map(([key, value]) => {
        const [source, target] = key.split('|');
        return {
          source,
          target,
          value,
          percentage: Math.round((value / totalFlows) * 100)
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 flows for visualization

    const maxFlowValue = Math.max(...flowLinks.map(f => f.value), 1);

    // Calculate drop-off data for each section
    const dropoffData: DropoffData[] = SECTION_ORDER.map(section => {
      const visitors = sectionVisitors[section]?.size || 0;
      const continued = sectionContinued[section]?.size || 0;
      const dropped = visitors - continued;
      const dropoffRate = visitors > 0 ? Math.round((dropped / visitors) * 100) : 0;
      const retentionRate = visitors > 0 ? Math.round((continued / visitors) * 100) : 0;

      return {
        section,
        visitors,
        continued,
        dropped,
        dropoffRate,
        retentionRate
      };
    }).filter(d => d.visitors > 0);

    return { flowLinks, dropoffData, maxFlowValue, totalSessions };
  }, [activities]);

  // Get color for a section
  const getSectionColor = (section: string) => {
    return sectionColors[section] || '#6b7280';
  };

  // Calculate line width based on flow value (min 2px, max 20px)
  const getLineWidth = (value: number) => {
    return Math.max(2, Math.min(20, (value / maxFlowValue) * 20));
  };

  // Get drop-off status color
  const getDropoffStatus = (rate: number) => {
    if (rate >= 70) return { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle, label: 'High Drop-off' };
    if (rate >= 40) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: TrendingDown, label: 'Moderate' };
    return { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Good Retention' };
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading flow visualization...
        </CardContent>
      </Card>
    );
  }

  if (flowLinks.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Not enough data for flow visualization yet.
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
      {/* Sankey Flow Diagram */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Visitor Flow Diagram
            <Badge variant="secondary" className="ml-auto">
              {totalSessions} sessions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flowLinks.map((link, index) => (
              <motion.div
                key={`${link.source}-${link.target}`}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-2"
              >
                {/* Source Node */}
                <div 
                  className="px-2 py-1 rounded text-xs font-medium text-white min-w-[80px] text-center"
                  style={{ backgroundColor: getSectionColor(link.source) }}
                >
                  {link.source}
                </div>

                {/* Flow Line (Sankey-style) */}
                <div className="flex-1 relative h-6 flex items-center">
                  <div 
                    className="absolute inset-y-0 left-0 right-0 rounded-full opacity-30"
                    style={{ 
                      backgroundColor: getSectionColor(link.source),
                      height: `${getLineWidth(link.value)}px`,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <div 
                    className="absolute rounded-full transition-all duration-500"
                    style={{ 
                      background: `linear-gradient(90deg, ${getSectionColor(link.source)}, ${getSectionColor(link.target)})`,
                      height: `${getLineWidth(link.value)}px`,
                      width: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  {/* Flow value indicator */}
                  <span className="absolute left-1/2 transform -translate-x-1/2 text-xs font-bold text-foreground bg-background/80 px-1 rounded">
                    {link.value}
                  </span>
                </div>

                {/* Target Node */}
                <div 
                  className="px-2 py-1 rounded text-xs font-medium text-white min-w-[80px] text-center"
                  style={{ backgroundColor: getSectionColor(link.target) }}
                >
                  {link.target}
                </div>

                {/* Percentage */}
                <Badge variant="outline" className="text-xs min-w-[50px] justify-center">
                  {link.percentage}%
                </Badge>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Line thickness represents relative traffic volume between sections
          </p>
        </CardContent>
      </Card>

      {/* Drop-off Analysis */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            Section Drop-off Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dropoffData.map((data, index) => {
              const status = getDropoffStatus(data.dropoffRate);
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={data.section}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {/* Section Label */}
                    <div 
                      className="px-2 py-1 rounded text-xs font-medium text-white min-w-[100px] text-center"
                      style={{ backgroundColor: getSectionColor(data.section) }}
                    >
                      {data.section}
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      {/* Continued (green) */}
                      <div 
                        className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-500"
                        style={{ width: `${data.retentionRate}%` }}
                      />
                      {/* Dropped (red/orange) */}
                      <div 
                        className="absolute inset-y-0 bg-red-500/70 transition-all duration-500"
                        style={{ 
                          left: `${data.retentionRate}%`,
                          width: `${data.dropoffRate}%` 
                        }}
                      />
                      {/* Labels on bar */}
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                        <span className="text-white drop-shadow">
                          {data.continued} continued
                        </span>
                        <span className="text-white drop-shadow">
                          {data.dropped} left
                        </span>
                      </div>
                    </div>

                    {/* Drop-off Rate */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${status.bg} min-w-[80px] justify-center`}>
                      <StatusIcon className={`w-3 h-3 ${status.color}`} />
                      <span className={`text-xs font-bold ${status.color}`}>
                        {data.dropoffRate}%
                      </span>
                    </div>
                  </div>

                  {/* Visitor count */}
                  <div className="flex justify-between text-xs text-muted-foreground pl-[108px]">
                    <span>{data.visitors} visitors viewed this section</span>
                    <span className={status.color}>{status.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Content Improvement Recommendations
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {dropoffData
                .filter(d => d.dropoffRate >= 50)
                .sort((a, b) => b.dropoffRate - a.dropoffRate)
                .slice(0, 3)
                .map(d => (
                  <li key={d.section} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>
                      <strong>{d.section}</strong> has {d.dropoffRate}% drop-off. 
                      Consider enhancing content or adding a clearer call-to-action.
                    </span>
                  </li>
                ))}
              {dropoffData.filter(d => d.dropoffRate >= 50).length === 0 && (
                <li className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  All sections have healthy retention rates!
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
