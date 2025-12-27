import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, Download, FileText, Users, TrendingUp, 
  ChevronRight, Target, UserCheck
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

interface RecruiterFunnelProps {
  activities: VisitorActivity[];
}

interface FunnelStep {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  count: number;
  sessions: Set<string>;
  color: string;
  bgColor: string;
}

export const RecruiterFunnel = ({ activities }: RecruiterFunnelProps) => {
  const funnelData = useMemo(() => {
    // Track unique sessions at each stage
    const allSessions = new Set(activities.map(a => a.session_id));
    
    // Stage 1: Viewed professional sections (experience, skills, certifications, about)
    const professionalSections = ['experience', 'skills', 'certifications', 'about', 'contact'];
    const sessionsWithProfessionalViews = new Set<string>();
    activities
      .filter(a => a.activity_type === 'section_view')
      .forEach(a => {
        const section = (a.activity_data?.section || '').toLowerCase();
        if (professionalSections.some(ps => section.includes(ps))) {
          sessionsWithProfessionalViews.add(a.session_id);
        }
      });

    // Stage 2: Viewed resume
    const sessionsWithResumeView = new Set<string>();
    activities
      .filter(a => a.activity_type === 'resume_view')
      .forEach(a => sessionsWithResumeView.add(a.session_id));

    // Stage 3: Downloaded resume
    const sessionsWithResumeDownload = new Set<string>();
    activities
      .filter(a => a.activity_type === 'resume_download')
      .forEach(a => sessionsWithResumeDownload.add(a.session_id));

    // Calculate conversion rates
    const steps: FunnelStep[] = [
      {
        id: 'visitors',
        label: 'Total Visitors',
        shortLabel: 'Visitors',
        icon: Users,
        count: allSessions.size,
        sessions: allSessions,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20'
      },
      {
        id: 'sections',
        label: 'Viewed Professional Sections',
        shortLabel: 'Section Views',
        icon: FileText,
        count: sessionsWithProfessionalViews.size,
        sessions: sessionsWithProfessionalViews,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20'
      },
      {
        id: 'resume_view',
        label: 'Viewed Resume',
        shortLabel: 'Resume Views',
        icon: Eye,
        count: sessionsWithResumeView.size,
        sessions: sessionsWithResumeView,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20'
      },
      {
        id: 'resume_download',
        label: 'Downloaded Resume',
        shortLabel: 'Downloads',
        icon: Download,
        count: sessionsWithResumeDownload.size,
        sessions: sessionsWithResumeDownload,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20'
      }
    ];

    return steps;
  }, [activities]);

  // Calculate conversion rates between steps
  const getConversionRate = (fromStep: number, toStep: number): number => {
    if (fromStep < 0 || toStep >= funnelData.length) return 0;
    const fromCount = funnelData[fromStep].count;
    const toCount = funnelData[toStep].count;
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
  };

  // Calculate overall funnel efficiency
  const overallConversion = funnelData[0].count > 0 
    ? Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)
    : 0;

  // Identify potential recruiters (sessions that completed the funnel)
  const likelyRecruiters = funnelData[funnelData.length - 1].count;

  if (funnelData[0].count === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          No visitor data available for funnel analysis
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
              <Target className="w-4 h-4 text-primary" />
              Recruiter Funnel Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Track how visitors progress through recruiting signals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              <UserCheck className="w-3 h-3 mr-1" />
              {likelyRecruiters} Likely Recruiters
            </Badge>
            <Badge variant="outline" className="text-xs">
              {overallConversion}% conversion
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="relative">
          {funnelData.map((step, index) => {
            const Icon = step.icon;
            const widthPercentage = funnelData[0].count > 0 
              ? Math.max(20, (step.count / funnelData[0].count) * 100)
              : 100;
            const conversionFromPrevious = index > 0 ? getConversionRate(index - 1, index) : 100;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-3 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div className={`w-10 h-10 rounded-lg ${step.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>

                  {/* Funnel bar */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${step.color}`}>{step.count}</span>
                        {index > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${conversionFromPrevious >= 50 ? 'text-green-400 border-green-500/30' : conversionFromPrevious >= 25 ? 'text-amber-400 border-amber-500/30' : 'text-red-400 border-red-500/30'}`}
                                >
                                  {conversionFromPrevious}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {conversionFromPrevious}% of {funnelData[index - 1].shortLabel} 
                                  → {step.shortLabel}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <div className="relative h-8 bg-secondary/30 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`absolute left-0 top-0 h-full ${step.bgColor} border-r-2 ${step.color.replace('text-', 'border-')}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(widthPercentage)}% of total
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow to next step */}
                  {index < funnelData.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Funnel Insights */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
          <div className="text-center p-3 rounded-lg bg-secondary/20">
            <p className="text-2xl font-bold text-primary">
              {getConversionRate(0, 1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visitors → Section Views
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/20">
            <p className="text-2xl font-bold text-amber-400">
              {getConversionRate(1, 2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Section Views → Resume Views
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/20">
            <p className="text-2xl font-bold text-green-400">
              {getConversionRate(2, 3)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Resume Views → Downloads
            </p>
          </div>
        </div>

        {/* Key Insight */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Funnel Insight</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overallConversion >= 10 
                  ? `Strong recruiter conversion! ${overallConversion}% of visitors complete the full funnel.`
                  : overallConversion >= 5
                  ? `Moderate conversion rate of ${overallConversion}%. Consider optimizing resume visibility.`
                  : `Low conversion rate of ${overallConversion}%. Focus on driving visitors to view professional sections.`
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
