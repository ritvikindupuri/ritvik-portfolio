import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { LoginAttemptMonitor } from "@/components/LoginAttemptMonitor";
import { IPLocationMap } from "@/components/IPLocationMap";

export const PortfolioAnalytics = () => {
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
          Portfolio Analytics
        </h2>
        <p className="text-sm text-muted-foreground">
          Track resume activity and monitor login security
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ResumeAnalytics />
        <LoginAttemptMonitor />
      </div>
      
      <div className="mt-4">
        <IPLocationMap />
      </div>
    </motion.section>
  );
};