import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioAnalytics } from "@/components/PortfolioAnalytics";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { GitHubIndexingStatus } from "@/components/GitHubIndexingStatus";
import { RAGTestingPanel } from "@/components/RAGTestingPanel";
import { WafStats } from "@/components/WafStats";
import { RateLimitViolationsManager } from "@/components/RateLimitViolationsManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. Owner privileges required.");
        navigate('/');
        return;
      }

      // Get last password change from user metadata
      setLastPasswordChange(user.updated_at || user.created_at);
      setIsOwner(true);
    } catch (error) {
      console.error('Error checking owner access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <PasswordChangeDialog lastPasswordChange={lastPasswordChange} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Owner Dashboard</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* GitHub Indexing & RAG Testing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GitHubIndexingStatus />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <RAGTestingPanel />
          </motion.div>
        </div>

        {/* Rate Limit Violations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <RateLimitViolationsManager />
        </motion.div>

        {/* Portfolio Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PortfolioAnalytics />
        </motion.div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
