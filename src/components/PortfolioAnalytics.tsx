import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Shield, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { SecurityChoroplethMap } from "@/components/SecurityChoroplethMap";
import { ThreatDetector } from "@/components/ThreatDetector";
import { VisitorDashboard } from "@/components/VisitorDashboard";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export const PortfolioAnalytics = () => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [activeTab, setActiveTab] = useState("visitors");

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
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="visitors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Visitor Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-6">
          <VisitorDashboard />
          <ResumeAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Global Login Map with Details */}
          <SecurityChoroplethMap onLoginAttemptsLoaded={setLoginAttempts} />
          
          {/* Threat Detection */}
          <ThreatDetector loginAttempts={loginAttempts} />
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};