import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { SecurityChoroplethMap } from "@/components/SecurityChoroplethMap";
import { ThreatDetector } from "@/components/ThreatDetector";

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
          Security Analytics & Monitoring
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time threat detection, login monitoring, and MITRE ATT&CK mapping
        </p>
      </div>

      <div className="space-y-6">
        {/* Global Login Map with Details */}
        <SecurityChoroplethMap onLoginAttemptsLoaded={setLoginAttempts} />
        
        {/* Threat Detection & Resume Analytics Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <ThreatDetector loginAttempts={loginAttempts} />
          <ResumeAnalytics />
        </div>
      </div>
    </motion.section>
  );
};