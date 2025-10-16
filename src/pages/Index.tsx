import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Certifications } from "@/components/Certifications";
import { Documentation } from "@/components/Documentation";
import Experience from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthButton, setShowAuthButton] = useState(true);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowAuthButton(scrollPosition < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      {/* Professional border frame */}
      <div className="relative border-2 border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(23,184,217,0.1)] min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-primary/40 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-primary/40 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-primary/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-primary/40 rounded-br-xl" />
        
        {/* Auth Button - Top Right */}
        <div className={`fixed top-6 right-6 sm:top-8 sm:right-8 md:top-10 md:right-10 z-50 transition-opacity duration-300 ${showAuthButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {user ? (
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="gap-2 bg-background/90 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              variant="outline"
              className="gap-2 bg-background/90 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
        
        <div className="relative bg-background">
          <Hero isOwner={!!user} />
          <About isOwner={!!user} />
          <Skills isOwner={!!user} />
          <Certifications isOwner={!!user} />
          <Documentation isOwner={!!user} />
          <Experience isOwner={!!user} />
          <Projects isOwner={!!user} />
          <Contact />

          {/* Footer */}
          <footer className="py-8 border-t border-primary/20 bg-gradient-to-b from-background to-card/30">
            <div className="container mx-auto px-6 text-center">
              <p className="text-muted-foreground font-medium">
                Ritvik Indupuri • Purdue University • Cybersecurity '28
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
