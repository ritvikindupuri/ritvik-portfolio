import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, TrendingUp, Users, Lightbulb, RefreshCw, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface VisitorAnalysis {
  engagementScore: number;
  engagementLevel: "low" | "moderate" | "good" | "excellent";
  summary: string;
  insights: string[];
  suggestion: string;
}

interface VisitorStats {
  totalSessions: number;
  totalActivities: number;
  chatbotQueries: number;
  resumeDownloads: number;
  projectClicks: number;
  engagedVisitors: number;
  potentialRecruiters: number;
}

interface AIVisitorInsightsProps {
  stats: VisitorStats;
}

export const AIVisitorInsights = ({ stats }: AIVisitorInsightsProps) => {
  const [analysis, setAnalysis] = useState<VisitorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVisitorData = async () => {
    if (stats.totalSessions === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-security", {
        body: {
          type: "visitor",
          data: {
            visitors: stats,
          },
        },
      });

      if (fnError) throw fnError;
      if (data?.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error("Error analyzing visitors:", err);
      setError(err.message || "Failed to analyze visitor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stats.totalSessions > 0) {
      analyzeVisitorData();
    }
  }, [stats.totalSessions, stats.totalActivities]);

  const getEngagementColor = (level: string) => {
    switch (level) {
      case "excellent": return "text-green-500 bg-green-500/20 border-green-500/50";
      case "good": return "text-blue-500 bg-blue-500/20 border-blue-500/50";
      case "moderate": return "text-yellow-500 bg-yellow-500/20 border-yellow-500/50";
      case "low": return "text-orange-500 bg-orange-500/20 border-orange-500/50";
      default: return "text-muted-foreground bg-secondary/50 border-border/50";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "stroke-green-500";
    if (score >= 50) return "stroke-blue-500";
    if (score >= 25) return "stroke-yellow-500";
    return "stroke-orange-500";
  };

  if (stats.totalSessions === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">AI Visitor Insights</p>
              <p className="text-xs text-muted-foreground">Analyzing engagement patterns...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Insights Unavailable</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <button
              onClick={analyzeVisitorData}
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm border-border/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Engagement Score Circle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex-shrink-0 cursor-help">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className="text-secondary/30"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        strokeWidth="5"
                        strokeDasharray={`${(analysis.engagementScore / 100) * 176} 176`}
                        strokeLinecap="round"
                        className={getScoreColor(analysis.engagementScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold">{analysis.engagementScore}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Engagement Analysis
                    </p>
                    <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Key Insights:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {analysis.insights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-1 border-t border-border/50">
                      <p className="text-xs">
                        <span className="font-medium text-primary">Suggestion: </span>
                        {analysis.suggestion}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Visitor Insights</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Powered by Gemini AI analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <Badge variant="outline" className={getEngagementColor(analysis.engagementLevel)}>
                    {analysis.engagementLevel.toUpperCase()} ENGAGEMENT
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {analysis.summary}
                </p>

                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-yellow-500" />
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {analysis.suggestion}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
