import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Lock } from "lucide-react";

interface AccessDialogProps {
  open: boolean;
  onAccessGranted: (isOwner: boolean) => void;
}

export const AccessDialog = ({ open, onAccessGranted }: AccessDialogProps) => {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleOwnerAccess = () => {
    const ownerEmail = "ritvik.indupuri@gmail.com";
    if (email.toLowerCase().trim() === ownerEmail) {
      onAccessGranted(true);
    } else {
      setError("Incorrect owner email. Access denied.");
    }
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
          {!showEmailInput ? (
            <>
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
                onClick={() => setShowEmailInput(true)}
                variant="default"
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              >
                <Lock className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Continue as Owner</div>
                  <div className="text-xs opacity-90">Full edit access</div>
                </div>
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="owner-email" className="block text-sm font-medium mb-2">
                  Owner Email
                </label>
                <Input
                  id="owner-email"
                  type="email"
                  placeholder="Enter owner email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="bg-secondary border-border focus:border-primary"
                />
                {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowEmailInput(false);
                    setEmail("");
                    setError("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleOwnerAccess} className="flex-1 bg-primary">
                  Verify
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
