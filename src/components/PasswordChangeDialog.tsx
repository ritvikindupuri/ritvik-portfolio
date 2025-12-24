import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Loader2, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface PasswordChangeDialogProps {
  lastPasswordChange?: string | null;
}

export const PasswordChangeDialog = ({ lastPasswordChange }: PasswordChangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  // Check if password change is recommended (older than 90 days)
  const isPasswordStale = () => {
    if (!lastPasswordChange) return true;
    const lastChange = new Date(lastPasswordChange);
    const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange > 90;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with zod
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "newPassword") fieldErrors.newPassword = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-emerald-500"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isPasswordStale() ? "default" : "outline"} 
          size="sm" 
          className={`gap-2 ${isPasswordStale() ? "bg-amber-600 hover:bg-amber-700" : ""}`}
        >
          {isPasswordStale() ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Key className="w-4 h-4" />
          )}
          {isPasswordStale() ? "Update Password" : "Change Password"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Update your password to keep your account secure. Use a strong, unique password.
          </DialogDescription>
        </DialogHeader>

        {isPasswordStale() && (
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-500">Password Update Recommended</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lastPasswordChange 
                  ? "Your password hasn't been changed in over 90 days."
                  : "We recommend setting a strong password for security."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={errors.newPassword ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword}</p>
            )}
            
            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < strength ? strengthColors[strength - 1] : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: {strengthLabels[Math.max(0, strength - 1)]}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={newPassword.length >= 8 ? "text-green-500" : ""}>At least 8 characters</li>
              <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>One uppercase letter</li>
              <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>One lowercase letter</li>
              <li className={/[0-9]/.test(newPassword) ? "text-green-500" : ""}>One number</li>
              <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-500" : ""}>One special character</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};