import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck, User } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showOwnerAuth, setShowOwnerAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const state = location.state as any;
    const forceOwnerAuth = state?.showOwnerAuth === true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !forceOwnerAuth) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !forceOwnerAuth) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.state]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.showOwnerAuth) {
      setShowOwnerAuth(true);
    }
  }, [location.state]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success("Account created! You're now logged in.");
        localStorage.setItem("ownerAccessGranted", "1");
        navigate("/", { replace: true, state: { ownerAccessGranted: true } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
        localStorage.setItem("ownerAccessGranted", "1");
        navigate("/", { replace: true, state: { ownerAccessGranted: true } });
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    navigate("/");
  };

  if (!showOwnerAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-cyber bg-clip-text text-transparent">
              Welcome
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Choose how you'd like to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowOwnerAuth(true)}
              className="w-full h-14 text-lg gap-3"
              size="lg"
            >
              <ShieldCheck className="w-5 h-5" />
              Continue as Owner
            </Button>
            
            <Button
              onClick={handleGuestContinue}
              variant="outline"
              className="w-full h-14 text-lg gap-3"
              size="lg"
            >
              <User className="w-5 h-5" />
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => setShowOwnerAuth(false)}
            className="mb-4 w-fit"
          >
            ← Back
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Create Owner Account" : "Owner Sign In"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Sign up to manage your portfolio"
              : "Sign in to edit your portfolio"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
