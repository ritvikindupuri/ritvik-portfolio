import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Eye, Download, MessageCircle, MousePointer, 
  Globe, Clock, TrendingUp, Activity, FileText, FolderOpen
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

export const VisitorDashboard = () => {
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

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

    return {
      totalSessions: sessions.length,
      totalActivities: activities.length,
      chatbotQueries: activityCounts['chatbot_query'] || 0,
      resumeViews: activityCounts['resume_view'] || 0,
      resumeDownloads: activityCounts['resume_download'] || 0,
      projectClicks: activityCounts['project_click'] || 0,
      sectionViews: activityCounts['section_view'] || 0,
      pageViews: activityCounts['page_view'] || 0
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
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
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
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
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
      <div className="grid md:grid-cols-2 gap-4">
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
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  />
                  <Bar dataKey="count" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              {sessions.slice(0, 10).map(session => (
                <div 
                  key={session.session_id}
                  className="p-3 rounded-lg border border-border/50 bg-secondary/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {session.session_id.substring(0, 20)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.startTime.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{session.totalActivities} actions</Badge>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};