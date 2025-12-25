import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Shield, Users, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { SecurityChoroplethMap } from "@/components/SecurityChoroplethMap";
import { ThreatDetector } from "@/components/ThreatDetector";
import { VisitorDashboard } from "@/components/VisitorDashboard";
import { KnownLocationsManager } from "@/components/KnownLocationsManager";

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
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

        <TabsContent value="locations" className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Login Location Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage trusted vs new login locations. You'll receive email alerts for logins from new locations.
            </p>
          </div>
          <KnownLocationsManager />
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};