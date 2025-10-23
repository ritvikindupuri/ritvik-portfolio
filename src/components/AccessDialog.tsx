import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle, Lock } from "lucide-react";

interface AccessDialogProps {
  open: boolean;
  onAccessGranted: (isOwner: boolean) => void;
}

export const AccessDialog = ({ open, onAccessGranted }: AccessDialogProps) => {
  const navigate = useNavigate();

  const handleOwnerAccess = () => {
    navigate("/auth");
  };

  const handleGuestAccess = () => {
    onAccessGranted(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Ritvik's Portfolio
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose how you'd like to proceed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleGuestAccess}
            variant="outline"
            className="w-full h-16 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all"
          >
            <UserCircle className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Continue as Guest</div>
              <div className="text-xs text-muted-foreground">View-only access</div>
            </div>
          </Button>

          <Button
            onClick={handleOwnerAccess}
            variant="default"
            className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
          >
            <Lock className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Sign In as Owner</div>
              <div className="text-xs opacity-90">Full edit access</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
