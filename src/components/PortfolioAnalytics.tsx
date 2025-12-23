import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { LoginAttemptMonitor } from "@/components/LoginAttemptMonitor";

export const PortfolioAnalytics = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-16 px-6"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Portfolio Analytics
          </h2>
          <p className="text-muted-foreground">
            Track resume activity and monitor login security
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ResumeAnalytics />
          <LoginAttemptMonitor />
        </div>
      </div>
    </motion.section>
  );
};