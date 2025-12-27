import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Eye, Download, MessageCircle, MousePointer, 
  Globe, Clock, TrendingUp, Activity, FileText, FolderOpen,
  ChevronDown, ChevronUp, ExternalLink, Timer, Info
} from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  LineChart,
  Line
} from "recharts";
import { ChatbotQueryAnalysis } from "@/components/ChatbotQueryAnalysis";
import { AIVisitorInsights } from "@/components/AIVisitorInsights";
import { VisitorJourneyFlow } from "@/components/VisitorJourneyFlow";
import { VisitorSankeyDiagram } from "@/components/VisitorSankeyDiagram";
import { RecruiterFunnel } from "@/components/RecruiterFunnel";

interface VisitorActivity {
  id: string;
  session_id: string;
  ip_address: string | null;
  email: string | null;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface SessionSummary {
  session_id: string;
  activities: VisitorActivity[];
  startTime: Date;
  endTime: Date;
  totalActivities: number;
  chatbotQueries: number;
  resumeViews: number;
  resumeDownloads: number;
  projectClicks: number;
  sectionsViewed: string[];
}

const COLORS = ['#00d4ff', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

// Helper function for human-readable time ago
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const VisitorDashboard = () => {
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showHighEngagementOnly, setShowHighEngagementOnly] = useState(false);

  useEffect(() => {
    fetchActivities();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('visitor_activity_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_activity' },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  const fetchActivities = async () => {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const { data, error } = await supabase
        .from('visitor_activity')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching visitor activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data by session
  const sessions = useMemo(() => {
    const sessionMap: Record<string, SessionSummary> = {};

    activities.forEach(activity => {
      if (!sessionMap[activity.session_id]) {
        sessionMap[activity.session_id] = {
          session_id: activity.session_id,
          activities: [],
          startTime: new Date(activity.created_at),
          endTime: new Date(activity.created_at),
          totalActivities: 0,
          chatbotQueries: 0,
          resumeViews: 0,
          resumeDownloads: 0,
          projectClicks: 0,
          sectionsViewed: []
        };
      }

      const session = sessionMap[activity.session_id];
      session.activities.push(activity);
      session.totalActivities++;
      
      const activityTime = new Date(activity.created_at);
      if (activityTime < session.startTime) session.startTime = activityTime;
      if (activityTime > session.endTime) session.endTime = activityTime;

      switch (activity.activity_type) {
        case 'chatbot_query':
          session.chatbotQueries++;
          break;
        case 'resume_view':
          session.resumeViews++;
          break;
        case 'resume_download':
          session.resumeDownloads++;
          break;
        case 'project_click':
          session.projectClicks++;
          break;
        case 'section_view':
          const section = activity.activity_data?.section;
          if (section && !session.sectionsViewed.includes(section)) {
            session.sectionsViewed.push(section);
          }
          break;
      }
    });

    return Object.values(sessionMap).sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  }, [activities]);

  // Stats
  const stats = useMemo(() => {
    const activityCounts: Record<string, number> = {};
    activities.forEach(a => {
      activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;
    });

    // Calculate engaged visitors and potential recruiters
    const engagedVisitors = sessions.filter(s => s.chatbotQueries > 2).length;
    const potentialRecruiters = sessions.filter(s => s.resumeDownloads > 0).length;

    return {
      totalSessions: sessions.length,
      totalActivities: activities.length,
      chatbotQueries: activityCounts['chatbot_query'] || 0,
      resumeViews: activityCounts['resume_view'] || 0,
      resumeDownloads: activityCounts['resume_download'] || 0,
      projectClicks: activityCounts['project_click'] || 0,
      sectionViews: activityCounts['section_view'] || 0,
      pageViews: activityCounts['page_view'] || 0,
      engagedVisitors,
      potentialRecruiters
    };
  }, [activities, sessions]);

  // Activity type distribution for pie chart
  const activityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      const label = a.activity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activities]);

  // Activity over time for line chart
  const activityOverTime = useMemo(() => {
    const days: Record<string, number> = {};
    activities.forEach(a => {
      const date = new Date(a.created_at).toLocaleDateString();
      days[date] = (days[date] || 0) + 1;
    });
    return Object.entries(days)
      .map(([date, count]) => ({ date, count }))
      .slice(-14)
      .reverse();
  }, [activities]);

  // Most viewed sections
  const sectionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activities
      .filter(a => a.activity_type === 'section_view')
      .forEach(a => {
        const section = a.activity_data?.section || 'Unknown';
        counts[section] = (counts[section] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [activities]);

  // Section duration stats - average time spent per section
  const sectionDurationStats = useMemo(() => {
    const durations: Record<string, { total: number; count: number }> = {};
    activities
      .filter(a => a.activity_type === 'section_duration')
      .forEach(a => {
        const section = a.activity_data?.section || 'Unknown';
        const duration = a.activity_data?.duration_seconds || 0;
        if (!durations[section]) {
          durations[section] = { total: 0, count: 0 };
        }
        durations[section].total += duration;
        durations[section].count += 1;
      });
    return Object.entries(durations)
      .map(([section, data]) => ({
        section,
        avgDuration: Math.round(data.total / data.count),
        totalTime: data.total,
        views: data.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 8);
  }, [activities]);

  // Popular projects
  const projectStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activities
      .filter(a => a.activity_type === 'project_click')
      .forEach(a => {
        const project = a.activity_data?.project_name || 'Unknown';
        counts[project] = (counts[project] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([project, count]) => ({ project, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activities]);

  // Total section time summary - calculates total time across all sessions per section
  const totalSectionTime = useMemo(() => {
    const durations: Record<string, number> = {};
    let grandTotal = 0;
    activities
      .filter(a => a.activity_type === 'section_duration')
      .forEach(a => {
        const section = a.activity_data?.section || 'Unknown';
        const duration = a.activity_data?.duration_seconds || 0;
        durations[section] = (durations[section] || 0) + duration;
        grandTotal += duration;
      });
    const sections = Object.entries(durations)
      .map(([section, totalSeconds]) => ({ section, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
    return { sections, grandTotal };
  }, [activities]);

  // High engagement sessions - visitors who spent 30+ seconds on any section
  const HIGH_ENGAGEMENT_THRESHOLD = 30; // seconds
  const highEngagementSessions = useMemo(() => {
    return sessions.filter(session => {
      // Check if any section_duration activity has 30+ seconds
      return session.activities.some(activity => 
        activity.activity_type === 'section_duration' && 
        (activity.activity_data?.duration_seconds || 0) >= HIGH_ENGAGEMENT_THRESHOLD
      );
    });
  }, [sessions]);

  // Filter sessions based on high engagement toggle
  const displayedSessions = useMemo(() => {
    return showHighEngagementOnly ? highEngagementSessions : sessions;
  }, [showHighEngagementOnly, highEngagementSessions, sessions]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading visitor analytics...
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Visitor Analytics
          </h2>
          <p className="text-sm text-muted-foreground">Track guest activity and engagement</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* AI Visitor Insights */}
      <AIVisitorInsights stats={stats} />

      {/* Stats Grid with Chart Legend */}
      <div className="space-y-3">
        {/* Legend explaining relationship */}
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg border border-border/30">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">How to read:</span> Stats cards show totals for your selected time range. 
            <span className="text-green-500 font-medium"> Total Actions</span> breaks down into the 
            <span className="text-primary font-medium"> Daily Actions chart</span> and 
            <span className="text-primary font-medium"> Activity Distribution pie</span> below.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Unique Visitors Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 relative">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Unique Visitors</p>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[260px] z-[100]">
                      <p className="font-medium">Unique Visitors</p>
                      <p className="text-xs text-muted-foreground">
                        Count of distinct visitor sessions in the selected time range. 
                        Each session represents one unique person visiting your portfolio.
                      </p>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-primary">📊 Related: Session cards below</p>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* Total Actions Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 ring-1 ring-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats.totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[280px] z-[100]">
                      <p className="font-medium">Total Actions (Cumulative)</p>
                      <p className="text-xs text-muted-foreground">
                        Sum of ALL visitor interactions: section views, chatbot queries, 
                        resume downloads, project clicks, etc.
                      </p>
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <p className="text-xs text-green-500 font-medium">📈 Shown in charts below:</p>
                        <p className="text-xs text-muted-foreground">• Daily Actions = day-by-day breakdown</p>
                        <p className="text-xs text-muted-foreground">• Activity Distribution = breakdown by type</p>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardContent>
            {/* Visual connector indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-500/50" />
          </Card>

          {/* Chatbot Queries Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats.chatbotQueries}</p>
                  <p className="text-xs text-muted-foreground">Chatbot Queries</p>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[260px] z-[100]">
                      <p className="font-medium">Chatbot Queries</p>
                      <p className="text-xs text-muted-foreground">
                        Number of questions visitors asked your AI chatbot. 
                        Higher numbers indicate visitors are actively exploring your skills and projects.
                      </p>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-blue-500">💡 Included in "Total Actions" & shown in Activity Distribution pie</p>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* Resume Downloads Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Download className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats.resumeDownloads}</p>
                  <p className="text-xs text-muted-foreground">Resume Downloads</p>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[260px] z-[100]">
                      <p className="font-medium">Resume Downloads</p>
                      <p className="text-xs text-muted-foreground">
                        Times visitors downloaded your resume. This is a key engagement signal — 
                        often indicates potential recruiters or hiring managers.
                      </p>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-orange-500">🎯 High-value action! Included in "Total Actions"</p>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Activity Over Time */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Daily Visitor Actions
              </CardTitle>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="font-medium mb-1">What this chart shows:</p>
                    <p className="text-xs text-muted-foreground">
                      Total number of visitor actions per day, including section views, 
                      chatbot queries, resume downloads, and project clicks.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher numbers indicate more engagement on that day.
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tracked actions per day (views, clicks, downloads, queries)
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activityOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#666" />
                <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 11%)', 
                    border: '1px solid hsl(215, 20%, 30%)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'hsl(0, 0%, 100%)', fontWeight: 600 }}
                  formatter={(value: number) => [`${value} actions`, 'Total Actions']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff' }} name="Actions" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              📊 Each point = total visitor interactions on that date
            </p>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {activityDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 11%)', 
                    border: '1px solid hsl(215, 20%, 30%)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'hsl(0, 0%, 100%)', fontWeight: 600 }}
                  itemStyle={{ color: 'hsl(0, 0%, 90%)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {activityDistribution.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section & Project Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Popular Sections */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Most Viewed Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sectionStats.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No section data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectionStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#666" />
                  <YAxis type="category" dataKey="section" tick={{ fontSize: 10 }} stroke="#666" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(222, 47%, 11%)', 
                      border: '1px solid hsl(215, 20%, 30%)',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    labelStyle={{ color: 'hsl(0, 0%, 100%)', fontWeight: 600 }}
                    itemStyle={{ color: 'hsl(0, 0%, 90%)' }}
                  />
                  <Bar dataKey="count" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Section Duration Stats */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              Avg. Time Per Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sectionDurationStats.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No duration data yet</p>
            ) : (
              <div className="space-y-3">
                {sectionDurationStats.map((item, index) => {
                  const formatDuration = (seconds: number) => {
                    if (seconds < 60) return `${seconds}s`;
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
                  };
                  
                  return (
                    <div key={item.section} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{item.section}</p>
                        <div className="w-full bg-secondary/30 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${Math.min((item.avgDuration / sectionDurationStats[0].avgDuration) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(item.avgDuration)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Projects */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Most Clicked Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectStats.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No project clicks yet</p>
            ) : (
              <div className="space-y-3">
                {projectStats.map((item, index) => (
                  <div key={item.project} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.project}</p>
                      <div className="w-full bg-secondary/30 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(item.count / projectStats[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Section Time Summary Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-500" />
              Total Time Spent Per Section
            </CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[280px]">
                  <p className="font-medium mb-1">Total Section Engagement</p>
                  <p className="text-xs text-muted-foreground">
                    Cumulative time ALL visitors spent on each section during the selected time range. 
                    Longer total times indicate highly engaging content.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cumulative engagement time across all visitor sessions
          </p>
        </CardHeader>
        <CardContent>
          {totalSectionTime.sections.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">No duration data yet</p>
          ) : (
            <div className="space-y-4">
              {/* Grand total */}
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-sm font-medium">Total Engagement Time</span>
                <Badge className="bg-amber-500/20 text-amber-400 text-sm">
                  {totalSectionTime.grandTotal < 60 
                    ? `${totalSectionTime.grandTotal}s`
                    : totalSectionTime.grandTotal < 3600
                      ? `${Math.floor(totalSectionTime.grandTotal / 60)}m ${totalSectionTime.grandTotal % 60}s`
                      : `${Math.floor(totalSectionTime.grandTotal / 3600)}h ${Math.floor((totalSectionTime.grandTotal % 3600) / 60)}m`
                  }
                </Badge>
              </div>
              
              {/* Section breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {totalSectionTime.sections.slice(0, 8).map((item, index) => {
                  const formatTime = (seconds: number) => {
                    if (seconds < 60) return `${seconds}s`;
                    if (seconds < 3600) {
                      const mins = Math.floor(seconds / 60);
                      const secs = seconds % 60;
                      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
                    }
                    const hours = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                  };
                  
                  const percentage = totalSectionTime.grandTotal > 0 
                    ? Math.round((item.totalSeconds / totalSectionTime.grandTotal) * 100) 
                    : 0;
                  
                  return (
                    <div key={item.section} className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                        <p className="text-xs font-medium truncate flex-1" title={item.section}>{item.section}</p>
                      </div>
                      <p className="text-lg font-bold text-amber-400">{formatTime(item.totalSeconds)}</p>
                      <div className="w-full bg-secondary/30 rounded-full h-1 mt-2">
                        <div 
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recruiter Funnel Analysis */}
      <RecruiterFunnel activities={activities} />

      {/* Chatbot Query Analysis */}
      <ChatbotQueryAnalysis />

      {/* Visitor Journey Flow */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Visitor Journey Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VisitorJourneyFlow />
        </CardContent>
      </Card>

      {/* Sankey Flow & Drop-off Analysis */}
      <VisitorSankeyDiagram />

      {/* Recent Sessions with High Engagement Filter */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Visitor Sessions
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {showHighEngagementOnly 
                  ? `Showing ${highEngagementSessions.length} high-engagement sessions (${HIGH_ENGAGEMENT_THRESHOLD}s+ on any section)`
                  : `Showing all ${sessions.length} sessions`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHighEngagementOnly(!showHighEngagementOnly)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                        showHighEngagementOnly 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-secondary/50 hover:bg-secondary border-border/50'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      High Engagement
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="font-medium mb-1">High Engagement Filter</p>
                    <p className="text-xs text-muted-foreground">
                      Shows only sessions where visitors spent {HIGH_ENGAGEMENT_THRESHOLD}+ seconds 
                      on at least one section. These are your most interested visitors.
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {showHighEngagementOnly 
                ? 'No high-engagement sessions found. Try removing the filter.'
                : 'No visitor sessions yet'
              }
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {displayedSessions.slice(0, 10).map((session, index) => {
                // Generate a friendly visitor label
                const visitorNumber = displayedSessions.length - index;
                const timeAgo = getTimeAgo(session.endTime);
                const sessionDuration = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
                const durationText = sessionDuration < 1 ? 'Quick visit' : sessionDuration < 5 ? `${sessionDuration}m session` : `${sessionDuration}m engaged`;
                
                // Determine visitor type based on comprehensive activity analysis
                const getVisitorType = () => {
                  // Calculate a recruiter likelihood score based on multiple signals
                  let recruiterScore = 0;
                  
                  // Signal 1: Resume interactions (strong signal)
                  if (session.resumeDownloads > 0) recruiterScore += 30;
                  if (session.resumeViews > 0) recruiterScore += 15;
                  
                  // Signal 2: Relevant chatbot queries (check for hiring/recruiting intent)
                  const recruiterKeywords = ['experience', 'resume', 'skills', 'work', 'projects', 'contact', 'hire', 'job', 'position', 'role', 'team', 'available', 'salary', 'rate'];
                  const chatbotActivities = session.activities.filter(a => a.activity_type === 'chatbot_query');
                  const recruiterQueries = chatbotActivities.filter(a => {
                    const query = (a.activity_data?.query || '').toLowerCase();
                    return recruiterKeywords.some(keyword => query.includes(keyword));
                  });
                  if (recruiterQueries.length > 0) recruiterScore += Math.min(recruiterQueries.length * 15, 30);
                  
                  // Signal 3: Viewed relevant sections (experience, skills, certifications)
                  const professionalSections = ['experience', 'skills', 'certifications', 'about', 'contact'];
                  const viewedProfessionalSections = session.sectionsViewed.filter(s => 
                    professionalSections.some(ps => s.toLowerCase().includes(ps))
                  );
                  recruiterScore += Math.min(viewedProfessionalSections.length * 10, 20);
                  
                  // Signal 4: Session duration and engagement depth
                  const sessionDuration = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
                  if (sessionDuration >= 3) recruiterScore += 10;
                  
                  // Signal 5: Multiple chatbot interactions (shows interest)
                  if (session.chatbotQueries >= 3) recruiterScore += 10;
                  
                  // Determine visitor type based on score and patterns
                  if (recruiterScore >= 50) {
                    return { label: 'Likely Recruiter', color: 'text-orange-400' };
                  }
                  if (recruiterScore >= 30) {
                    return { label: 'Potential Recruiter', color: 'text-amber-400' };
                  }
                  if (session.chatbotQueries > 2) return { label: 'Engaged Visitor', color: 'text-green-400' };
                  if (session.projectClicks > 2) return { label: 'Project Explorer', color: 'text-blue-400' };
                  if (session.sectionsViewed.length > 3) return { label: 'Active Browser', color: 'text-purple-400' };
                  return { label: 'New Visitor', color: 'text-muted-foreground' };
                };
                const visitorType = getVisitorType();

                return (
                  <div 
                    key={session.session_id}
                    className="rounded-lg border border-border/50 bg-secondary/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSession(
                        expandedSession === session.session_id ? null : session.session_id
                      )}
                      className="w-full p-3 text-left hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Visitor #{visitorNumber}</p>
                            <span className={`text-xs ${visitorType.color}`}>• {visitorType.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {timeAgo} • {durationText}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{session.totalActivities} actions</Badge>
                          {expandedSession === session.session_id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {session.chatbotQueries > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {session.chatbotQueries} chats
                          </Badge>
                        )}
                        {session.resumeDownloads > 0 && (
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            {session.resumeDownloads} downloads
                          </Badge>
                        )}
                        {session.projectClicks > 0 && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            <MousePointer className="w-3 h-3 mr-1" />
                            {session.projectClicks} projects
                          </Badge>
                        )}
                        {session.sectionsViewed.length > 0 && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            {session.sectionsViewed.length} sections
                          </Badge>
                        )}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedSession === session.session_id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 border-t border-border/30">
                            <p className="text-xs text-muted-foreground font-medium mt-3 mb-2">Activity Timeline</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {session.activities
                                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                .map((activity, actIndex) => {
                                  const activityTime = new Date(activity.created_at);
                                  const timeStr = activityTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  
                                  const getActivityDetails = () => {
                                    switch (activity.activity_type) {
                                      case 'page_view':
                                        return {
                                          icon: <Globe className="w-3 h-3" />,
                                          label: 'Visited page',
                                          detail: activity.activity_data?.path || 'Homepage',
                                          color: 'text-muted-foreground'
                                        };
                                      case 'section_view':
                                        return {
                                          icon: <Eye className="w-3 h-3" />,
                                          label: 'Viewed section',
                                          detail: activity.activity_data?.section || 'Unknown',
                                          color: 'text-purple-400'
                                        };
                                      case 'chatbot_query':
                                        return {
                                          icon: <MessageCircle className="w-3 h-3" />,
                                          label: 'Asked chatbot',
                                          detail: activity.activity_data?.query ? `"${activity.activity_data.query.slice(0, 80)}${activity.activity_data.query.length > 80 ? '...' : ''}"` : 'Query',
                                          color: 'text-blue-400'
                                        };
                                      case 'resume_view':
                                        return {
                                          icon: <FileText className="w-3 h-3" />,
                                          label: 'Viewed resume',
                                          detail: activity.activity_data?.resume_name || 'Resume',
                                          color: 'text-cyan-400'
                                        };
                                      case 'resume_download':
                                        return {
                                          icon: <Download className="w-3 h-3" />,
                                          label: 'Downloaded resume',
                                          detail: activity.activity_data?.resume_name || 'Resume',
                                          color: 'text-orange-400'
                                        };
                                      case 'project_view':
                                        return {
                                          icon: <FolderOpen className="w-3 h-3" />,
                                          label: 'Viewed project',
                                          detail: activity.activity_data?.project_name || 'Project',
                                          color: 'text-green-400'
                                        };
                                      case 'project_click':
                                        return {
                                          icon: <ExternalLink className="w-3 h-3" />,
                                          label: 'Clicked project link',
                                          detail: activity.activity_data?.project_name || 'Project',
                                          color: 'text-green-400'
                                        };
                                      case 'section_duration':
                                        const durationSecs = activity.activity_data?.duration_seconds || 0;
                                        const sectionName = activity.activity_data?.section || 'Unknown';
                                        const durationDisplay = durationSecs < 60 
                                          ? `${durationSecs}s` 
                                          : `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`;
                                        return {
                                          icon: <Clock className="w-3 h-3" />,
                                          label: `Spent ${durationDisplay} on`,
                                          detail: sectionName,
                                          color: 'text-amber-400'
                                        };
                                      default:
                                        return {
                                          icon: <Activity className="w-3 h-3" />,
                                          label: activity.activity_type.replace(/_/g, ' '),
                                          detail: JSON.stringify(activity.activity_data || {}),
                                          color: 'text-muted-foreground'
                                        };
                                    }
                                  };
                                  
                                  const details = getActivityDetails();
                                  
                                  return (
                                    <div 
                                      key={activity.id}
                                      className="flex items-start gap-2 text-xs"
                                    >
                                      <span className="text-muted-foreground w-12 shrink-0">{timeStr}</span>
                                      <span className={details.color}>{details.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-muted-foreground">{details.label}: </span>
                                        <span className="text-foreground">{details.detail}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};