import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Shield, Users, MapPin, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { SecurityChoroplethMap } from "@/components/SecurityChoroplethMap";
import { ThreatDetector } from "@/components/ThreatDetector";
import { VisitorDashboard } from "@/components/VisitorDashboard";
import { KnownLocationsManager } from "@/components/KnownLocationsManager";
import { AIRiskScore } from "@/components/AIRiskScore";
import { RiskScoreHistory } from "@/components/RiskScoreHistory";
import { ThreatDetectionSettings } from "@/components/ThreatDetectionSettings";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

// MITRE techniques for threat detection (matching ThreatDetector)
const MITRE_TECHNIQUES = {
  T1110: { id: "T1110", name: "Brute Force", severity: "high" },
  T1110_001: { id: "T1110.001", name: "Password Guessing", severity: "high" },
  T1110_003: { id: "T1110.003", name: "Password Spraying", severity: "medium" },
  T1078: { id: "T1078", name: "Valid Accounts", severity: "medium" },
};

export const PortfolioAnalytics = () => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [activeTab, setActiveTab] = useState("visitors");

  // Detect threats for AI analysis (simplified version matching ThreatDetector logic)
  const detectedThreats = useMemo(() => {
    const threats: { technique: typeof MITRE_TECHNIQUES[keyof typeof MITRE_TECHNIQUES]; confidence: number }[] = [];
    const now = new Date();

    // Group attempts by IP
    const ipAttempts: Record<string, LoginAttempt[]> = {};
    loginAttempts.forEach(attempt => {
      if (attempt.ip_address) {
        if (!ipAttempts[attempt.ip_address]) {
          ipAttempts[attempt.ip_address] = [];
        }
        ipAttempts[attempt.ip_address].push(attempt);
      }
    });

    // Detect Brute Force (T1110)
    Object.entries(ipAttempts).forEach(([ip, attempts]) => {
      const failedAttempts = attempts.filter(a => !a.success);
      const recentFailed = failedAttempts.filter(a => {
        const attemptTime = new Date(a.created_at);
        return (now.getTime() - attemptTime.getTime()) < 3600000;
      });

      if (recentFailed.length >= 5) {
        threats.push({
          technique: MITRE_TECHNIQUES.T1110,
          confidence: Math.min(0.95, 0.5 + (recentFailed.length * 0.1)),
        });
      } else if (failedAttempts.length >= 3) {
        threats.push({
          technique: MITRE_TECHNIQUES.T1110_001,
          confidence: 0.6,
        });
      }
    });

    return threats;
  }, [loginAttempts]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Analytics & Security Center
        </h2>
        <p className="text-sm text-muted-foreground">
          Visitor tracking, threat detection, and MITRE ATT&CK mapping
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="visitors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-6">
          <VisitorDashboard />
          <ResumeAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* AI Risk Score */}
          <AIRiskScore loginAttempts={loginAttempts} detectedThreats={detectedThreats} />
          
          {/* Risk Score History Chart */}
          <RiskScoreHistory />
          
          {/* Global Login Map with Details */}
          <SecurityChoroplethMap onLoginAttemptsLoaded={setLoginAttempts} />
          
          {/* Threat Detection */}
          <ThreatDetector loginAttempts={loginAttempts} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Login Location Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage trusted vs new login locations. You'll receive email alerts for logins from new locations.
            </p>
          </div>
          <KnownLocationsManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Threat Detection Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Adjust thresholds for MITRE ATT&CK technique detection. Changes apply immediately.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <ThreatDetectionSettings />
          </div>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};