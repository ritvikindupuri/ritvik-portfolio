import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, Download, Eye, MessageCircle, Clock, 
  MapPin, TrendingUp, Star, ChevronRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VisitorActivity {
  id: string;
  session_id: string;
  ip_address: string | null;
  email: string | null;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface PotentialRecruitersProps {
  activities: VisitorActivity[];
}

// Recruiter scoring constants (matching VisitorTrackerProvider)
const RECRUITER_KEYWORDS = [
  'experience', 'resume', 'skills', 'work', 'projects', 'contact', 
  'hire', 'job', 'position', 'role', 'team', 'available', 'salary', 'rate'
];

const PROFESSIONAL_SECTIONS = ['experience', 'skills', 'certifications', 'about', 'contact'];

interface RecruiterSession {
  session_id: string;
  score: number;
  scoreBreakdown: {
    resumeDownload: number;
    resumeView: number;
    chatbotQueries: number;
    professionalSections: number;
    sessionDuration: number;
    chatbotInteractions: number;
  };
  activities: VisitorActivity[];
  firstActivity: Date;
  lastActivity: Date;
  resumeDownloads: number;
  resumeViews: number;
  chatbotQueries: string[];
  sectionsViewed: string[];
  ip_address: string | null;
  email: string | null;
}

export const PotentialRecruiters = ({ activities }: PotentialRecruitersProps) => {
  const recruiterSessions = useMemo(() => {
    // Group activities by session
    const sessionMap: Record<string, VisitorActivity[]> = {};
    activities.forEach(activity => {
      if (!sessionMap[activity.session_id]) {
        sessionMap[activity.session_id] = [];
      }
      sessionMap[activity.session_id].push(activity);
    });

    // Calculate recruiter score for each session
    const sessions: RecruiterSession[] = Object.entries(sessionMap).map(([session_id, sessionActivities]) => {
      // Sort by time
      sessionActivities.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const firstActivity = new Date(sessionActivities[0].created_at);
      const lastActivity = new Date(sessionActivities[sessionActivities.length - 1].created_at);
      const sessionDurationMinutes = Math.round((lastActivity.getTime() - firstActivity.getTime()) / 1000 / 60);

      // Count specific activities
      const resumeDownloads = sessionActivities.filter(a => a.activity_type === 'resume_download').length;
      const resumeViews = sessionActivities.filter(a => a.activity_type === 'resume_view').length;
      const chatbotQueries = sessionActivities
        .filter(a => a.activity_type === 'chatbot_query')
        .map(a => a.activity_data?.query || '');
      const sectionsViewed = [...new Set(
        sessionActivities
          .filter(a => a.activity_type === 'section_view')
          .map(a => a.activity_data?.section || '')
          .filter(Boolean)
      )];

      // Calculate score breakdown
      const scoreBreakdown = {
        resumeDownload: resumeDownloads > 0 ? 30 : 0,
        resumeView: resumeViews > 0 ? 15 : 0,
        chatbotQueries: Math.min(
          chatbotQueries.filter(q => 
            RECRUITER_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
          ).length * 15, 
          30
        ),
        professionalSections: Math.min(
          sectionsViewed.filter(s => 
            PROFESSIONAL_SECTIONS.some(ps => s.toLowerCase().includes(ps))
          ).length * 10,
          20
        ),
        sessionDuration: sessionDurationMinutes >= 3 ? 10 : 0,
        chatbotInteractions: chatbotQueries.length >= 3 ? 10 : 0
      };

      const totalScore = Object.values(scoreBreakdown).reduce((sum, v) => sum + v, 0);

      // Get IP and email from any activity
      const ip_address = sessionActivities.find(a => a.ip_address)?.ip_address || null;
      const email = sessionActivities.find(a => a.email)?.email || null;

      return {
        session_id,
        score: totalScore,
        scoreBreakdown,
        activities: sessionActivities,
        firstActivity,
        lastActivity,
        resumeDownloads,
        resumeViews,
        chatbotQueries,
        sectionsViewed,
        ip_address,
        email
      };
    });

    // Filter to sessions with score >= 30 and sort by score descending
    return sessions
      .filter(s => s.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10
  }, [activities]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 50) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Very Likely';
    if (score >= 50) return 'Likely';
    return 'Possible';
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (recruiterSessions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Potential Recruiters
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">No high-scoring recruiter sessions detected yet.</p>
          <p className="text-xs mt-1">Sessions scoring 30+ points will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Potential Recruiters
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Sessions with high recruiter likelihood scores
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {recruiterSessions.length} session{recruiterSessions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recruiterSessions.map((session, index) => (
          <motion.div
            key={session.session_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`${getScoreColor(session.score)} border cursor-help`}>
                          <Star className="w-3 h-3 mr-1" />
                          {session.score} pts - {getScoreLabel(session.score)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="font-medium text-sm mb-2">Score Breakdown</p>
                        <div className="space-y-1 text-xs">
                          {session.scoreBreakdown.resumeDownload > 0 && (
                            <div className="flex justify-between">
                              <span>Resume Download</span>
                              <span className="text-green-400">+{session.scoreBreakdown.resumeDownload}</span>
                            </div>
                          )}
                          {session.scoreBreakdown.resumeView > 0 && (
                            <div className="flex justify-between">
                              <span>Resume View</span>
                              <span className="text-green-400">+{session.scoreBreakdown.resumeView}</span>
                            </div>
                          )}
                          {session.scoreBreakdown.chatbotQueries > 0 && (
                            <div className="flex justify-between">
                              <span>Recruiter Keywords</span>
                              <span className="text-green-400">+{session.scoreBreakdown.chatbotQueries}</span>
                            </div>
                          )}
                          {session.scoreBreakdown.professionalSections > 0 && (
                            <div className="flex justify-between">
                              <span>Professional Sections</span>
                              <span className="text-green-400">+{session.scoreBreakdown.professionalSections}</span>
                            </div>
                          )}
                          {session.scoreBreakdown.sessionDuration > 0 && (
                            <div className="flex justify-between">
                              <span>Session ≥3 min</span>
                              <span className="text-green-400">+{session.scoreBreakdown.sessionDuration}</span>
                            </div>
                          )}
                          {session.scoreBreakdown.chatbotInteractions > 0 && (
                            <div className="flex justify-between">
                              <span>3+ Chatbot Queries</span>
                              <span className="text-green-400">+{session.scoreBreakdown.chatbotInteractions}</span>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(session.lastActivity)}
                  </span>
                  
                  {session.email && (
                    <Badge variant="outline" className="text-xs">
                      {session.email}
                    </Badge>
                  )}
                </div>

                {/* Activity summary */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {session.resumeDownloads > 0 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <Download className="w-3 h-3" />
                      <span>{session.resumeDownloads} download{session.resumeDownloads !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {session.resumeViews > 0 && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{session.resumeViews} resume view{session.resumeViews !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {session.chatbotQueries.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{session.chatbotQueries.length} quer{session.chatbotQueries.length !== 1 ? 'ies' : 'y'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{session.activities.length} actions</span>
                  </div>
                </div>

                {/* Sections viewed */}
                {session.sectionsViewed.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Viewed:</span>
                    {session.sectionsViewed.slice(0, 4).map(section => (
                      <Badge 
                        key={section} 
                        variant="secondary" 
                        className={`text-xs ${
                          PROFESSIONAL_SECTIONS.some(ps => section.toLowerCase().includes(ps))
                            ? 'bg-primary/20 text-primary'
                            : ''
                        }`}
                      >
                        {section}
                      </Badge>
                    ))}
                    {session.sectionsViewed.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{session.sectionsViewed.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Sample chatbot queries */}
                {session.chatbotQueries.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-secondary/30 border border-border/20">
                    <p className="text-xs text-muted-foreground mb-1">Sample queries:</p>
                    {session.chatbotQueries.slice(0, 2).map((query, i) => (
                      <p key={i} className="text-xs text-foreground/80 truncate">
                        "{query.slice(0, 80)}{query.length > 80 ? '...' : ''}"
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Score indicator */}
              <div className="shrink-0 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreColor(session.score).split(' ')[1]}`}>
                  <span className={`text-lg font-bold ${getScoreColor(session.score).split(' ')[0]}`}>
                    {session.score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">score</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Scoring legend */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Score thresholds:</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">30-49 Possible</Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">50-69 Likely</Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">70+ Very Likely</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
