import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, AlertTriangle, Shield, ShieldAlert, ShieldCheck, RefreshCw, Info } from "lucide-react";
import { motion } from "framer-motion";

interface SecurityAnalysis {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  factors: string[];
  recommendation: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
}

interface DetectedThreat {
  technique: { id: string; name: string; severity: string };
  confidence: number;
}

interface AIRiskScoreProps {
  loginAttempts: LoginAttempt[];
  detectedThreats: DetectedThreat[];
}

export const AIRiskScore = ({ loginAttempts, detectedThreats }: AIRiskScoreProps) => {
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSecurityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const failedAttempts = loginAttempts.filter(a => !a.success);
      const successfulAttempts = loginAttempts.filter(a => a.success);
      const uniqueIPs = [...new Set(loginAttempts.map(a => a.ip_address).filter(Boolean))];

      // Count suspicious IPs (3+ failures)
      const ipFailureCounts: Record<string, number> = {};
      failedAttempts.forEach(a => {
        if (a.ip_address) {
          ipFailureCounts[a.ip_address] = (ipFailureCounts[a.ip_address] || 0) + 1;
        }
      });
      const suspiciousIPs = Object.values(ipFailureCounts).filter(c => c >= 3).length;

      // Recent failed from same IP
      const recentFailedFromSameIP = Object.values(ipFailureCounts).filter(c => c >= 5).length;

      const highSeverityThreats = detectedThreats.filter(t => t.technique.severity === "high");

      const { data, error: fnError } = await supabase.functions.invoke("analyze-security", {
        body: {
          type: "security",
          data: {
            loginAttempts: {
              total: loginAttempts.length,
              failed: failedAttempts.length,
              successful: successfulAttempts.length,
              uniqueIPs: uniqueIPs.length,
              suspiciousIPs,
              recentFailedFromSameIP,
            },
            threats: {
              count: detectedThreats.length,
              highSeverity: highSeverityThreats.length,
              techniques: detectedThreats.map(t => t.technique.name),
            },
          },
        },
      });

      if (fnError) throw fnError;
      if (data?.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error("Error analyzing security:", err);
      setError(err.message || "Failed to analyze security data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loginAttempts.length > 0 || detectedThreats.length > 0) {
      analyzeSecurityData();
    }
  }, [loginAttempts.length, detectedThreats.length]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-500 bg-red-500/20 border-red-500/50";
      case "high": return "text-orange-500 bg-orange-500/20 border-orange-500/50";
      case "medium": return "text-yellow-500 bg-yellow-500/20 border-yellow-500/50";
      case "low": return "text-green-500 bg-green-500/20 border-green-500/50";
      default: return "text-muted-foreground bg-secondary/50 border-border/50";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical": return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "high": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "medium": return <Shield className="w-5 h-5 text-yellow-500" />;
      case "low": return <ShieldCheck className="w-5 h-5 text-green-500" />;
      default: return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "stroke-red-500";
    if (score >= 50) return "stroke-orange-500";
    if (score >= 25) return "stroke-yellow-500";
    return "stroke-green-500";
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">AI Security Analysis</p>
              <p className="text-xs text-muted-foreground">Analyzing threat patterns...</p>
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
                <p className="text-sm font-medium">AI Analysis Unavailable</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <button
              onClick={analyzeSecurityData}
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
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">AI Security Analysis</p>
                <p className="text-xs text-muted-foreground">No data to analyze yet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Risk Score Circle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex-shrink-0 cursor-help">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-secondary/30"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        strokeWidth="6"
                        strokeDasharray={`${(analysis.riskScore / 100) * 220} 220`}
                        strokeLinecap="round"
                        className={getScoreColor(analysis.riskScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold">{analysis.riskScore}</span>
                      <span className="text-[10px] text-muted-foreground">RISK</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      AI Risk Assessment
                    </p>
                    <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Contributing Factors:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {analysis.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-1 border-t border-border/50">
                      <p className="text-xs">
                        <span className="font-medium text-primary">Recommendation: </span>
                        {analysis.recommendation}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Security Analysis</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Powered by Google Gemini 2.5 Pro</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  {getRiskIcon(analysis.riskLevel)}
                  <Badge variant="outline" className={getRiskColor(analysis.riskLevel)}>
                    {analysis.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {analysis.summary}
                </p>

                <button
                  onClick={analyzeSecurityData}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh Analysis
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
