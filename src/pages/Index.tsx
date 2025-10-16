import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Certifications } from "@/components/Certifications";
import { Documentation } from "@/components/Documentation";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <>
      {/* Auth Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        {user ? (
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="gap-2 bg-background/80 backdrop-blur-sm border-primary/30 hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        ) : (
          <Button 
            onClick={() => navigate("/auth")}
            variant="outline"
            className="gap-2 bg-background/80 backdrop-blur-sm border-primary/30 hover:bg-primary/10"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>
      
      <div className="min-h-screen bg-background">
        <Hero isOwner={!!user} />
        <About isOwner={!!user} />
        <Skills isOwner={!!user} />
        <Certifications isOwner={!!user} />
        <Documentation isOwner={!!user} />
        <Projects isOwner={!!user} />
        <Contact />

        {/* Footer */}
        <footer className="py-8 border-t border-border bg-card/50">
          <div className="container mx-auto px-6 text-center">
            <p className="text-muted-foreground font-medium">
              Ritvik Indupuri • Purdue University • Cybersecurity '28
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
