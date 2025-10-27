import { useState, useEffect } from "react";

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
import { Separator } from "@/components/ui/separator";

import { Loader2 } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [_session, setSession] = useState<Session | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [guestAccessChosen, setGuestAccessChosen] = useState(false);
  const [loading, setLoading] = useState(true); // Start in a loading state

  useEffect(() => {
    const checkUserStatus = async () => {
      // Check for guest status first
      const guest = sessionStorage.getItem("guestAccessChosen") === "true";
      setGuestAccessChosen(guest);

      // Then, check for an active Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      const owner = !!session?.user;
      setIsOwner(owner);
    };

    checkUserStatus();

    // Also, listen for auth state changes to handle logins/logouts in the same session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsOwner(!!session?.user);
      // If the user logs out, they might want to see the dialog again.
      if (_event === "SIGNED_OUT") {
        sessionStorage.removeItem("guestAccessChosen");
        setGuestAccessChosen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // This effect will run whenever the owner status or guest status changes.
  // It ensures that we only stop loading when we have a definitive answer.
  useEffect(() => {
    if (isOwner || guestAccessChosen) {
      setLoading(false);
    } else {
      // If the user is not an owner and has not chosen guest access,
      // we need to wait for the initial check to complete. A small delay
      // can help prevent a flicker of the dialog before the session is confirmed.
      const timer = setTimeout(() => {
        setLoading(false);
      }, 250); // A small delay to be safe
      return () => clearTimeout(timer);
    }
  }, [isOwner, guestAccessChosen]);

  const handleAccessGranted = (ownerStatus: boolean) => {
    if (!ownerStatus) {
      sessionStorage.setItem("guestAccessChosen", "true");
      setGuestAccessChosen(true);
    }
    setIsOwner(ownerStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const shouldShowDialog = !isOwner && !guestAccessChosen;

  return (
    <div className="min-h-screen bg-background">
      <AccessDialog open={shouldShowDialog} onAccessGranted={handleAccessGranted} isAuthenticated={!!user} />
      
      <div className="relative">
        
        <div className="relative bg-background">
          <Hero isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <About isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Skills isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Certifications isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Documentation isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Experience isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Projects isOwner={isOwner} />
          
          <Separator className="container mx-auto my-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[2px]" />
          
          <Contact />

          {/* Chatbot - Only for guests */}
          <PortfolioChatbot isOwner={isOwner} />

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
