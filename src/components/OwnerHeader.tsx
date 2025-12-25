import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface OwnerHeaderProps {
  isOwner: boolean;
}

export const OwnerHeader = ({ isOwner }: OwnerHeaderProps) => {
  const navigate = useNavigate();
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner) {
      fetchLastPasswordChange();
    }
  }, [isOwner]);

  const fetchLastPasswordChange = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const passwordDate = user.updated_at || user.created_at;
        setLastPasswordChange(passwordDate);
        
        // Check if password is stale and send reminder email
        if (passwordDate) {
          const lastChange = new Date(passwordDate);
          const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceChange > 90) {
            // Send password reminder email
            sendPasswordReminderEmail(passwordDate);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const sendPasswordReminderEmail = async (lastPasswordChange: string) => {
    try {
      await supabase.functions.invoke('send-password-reminder', {
        body: { lastPasswordChange }
      });
    } catch (error) {
      console.error("Error sending password reminder email:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    window.location.reload();
  };

  if (!isOwner) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/owner-dashboard')}
              className="gap-2 bg-background/80 backdrop-blur-sm border-border/50"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View portfolio analytics dashboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PasswordChangeDialog lastPasswordChange={lastPasswordChange} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              className="gap-2 bg-background/80 backdrop-blur-sm border-border/50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign out of owner account</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
