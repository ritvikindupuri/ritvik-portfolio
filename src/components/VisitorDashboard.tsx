import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Eye, Download, MessageCircle, MousePointer, 
  Globe, Clock, TrendingUp, Activity, FileText, FolderOpen,
  ChevronDown, ChevronUp, ExternalLink, Timer
} from "lucide-react";
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
                <p className="text-xs text-muted-foreground">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.chatbotQueries}</p>
                <p className="text-xs text-muted-foreground">Chatbot Queries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Download className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resumeDownloads}</p>
                <p className="text-xs text-muted-foreground">Resume Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Activity Over Time */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Activity Over Time
            </CardTitle>
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
                  itemStyle={{ color: 'hsl(0, 0%, 90%)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff' }} />
              </LineChart>
            </ResponsiveContainer>
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

      {/* Chatbot Query Analysis */}
      <ChatbotQueryAnalysis />

      {/* Recent Sessions */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Visitor Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No visitor sessions yet</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sessions.slice(0, 10).map((session, index) => {
                // Generate a friendly visitor label
                const visitorNumber = sessions.length - index;
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