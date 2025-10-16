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
import { AccessDialog } from "@/components/AccessDialog";
import { PortfolioChatbot } from "@/components/PortfolioChatbot";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthButton, setShowAuthButton] = useState(true);
  const [showAccessDialog, setShowAccessDialog] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

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

  const handleAccessGranted = (ownerStatus: boolean) => {
    setIsOwner(ownerStatus);
    setShowAccessDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AccessDialog open={showAccessDialog} onAccessGranted={handleAccessGranted} />
      
      <div className="relative">
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
          <Hero isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <About isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Skills isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Certifications isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Documentation isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Experience isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Projects isOwner={isOwner || !!user} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Contact />

          {/* Chatbot - Only for guests */}
          <PortfolioChatbot isOwner={isOwner || !!user} />

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
