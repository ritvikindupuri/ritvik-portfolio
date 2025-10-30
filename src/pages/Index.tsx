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

const Index = () => {
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check role when session changes
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
        setShowAccessDialog(false);
      } else {
        setIsOwner(false);
        setShowAccessDialog(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setSessionLoaded(true);

      if (session?.user) {
        checkUserRole(session.user.id);
        setShowAccessDialog(false);
      } else {
        setShowAccessDialog(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // SECURITY: Check user role from database (not localStorage)
  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .maybeSingle();

      if (error) {
        console.error('Error checking role:', error);
        setIsOwner(false);
        return;
      }

      setIsOwner(!!data);
    } catch (error) {
      console.error('Error checking role:', error);
      setIsOwner(false);
    }
  };

  // Don't auto-close dialog - let user explicitly choose


  const handleAccessGranted = (ownerStatus: boolean) => {
    setIsOwner(ownerStatus);
    setShowAccessDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AccessDialog open={showAccessDialog} onAccessGranted={handleAccessGranted} isAuthenticated={!!user} />
      
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
