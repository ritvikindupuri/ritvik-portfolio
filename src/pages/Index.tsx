import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Certifications } from "@/components/Certifications";
import { Documentation } from "@/components/Documentation";
import Experience from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { Contact } from "@/components/Contact";
import { AccessDialog } from "@/components/AccessDialog";
import { PortfolioChatbot } from "@/components/PortfolioChatbot";
import { MLShowcase } from "@/components/MLShowcase";
import { LLMShowcase } from "@/components/LLMShowcase";
import { SectionTransition } from "@/components/SectionTransition";
import { VisitorTrackerProvider } from "@/components/VisitorTrackerProvider";
import { OwnerHeader } from "@/components/OwnerHeader";
import { ResumeSection } from "@/components/ResumeSection";
import { InteractiveSecurityArchitecture } from "@/components/InteractiveSecurityArchitecture";
import { ScrollProgressIndicator } from "@/components/ScrollProgressIndicator";
import { SectionReveal } from "@/components/SectionReveal";

const Index = () => {
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  // CRITICAL: isOwner should ONLY be true when authenticated user has owner role
  // Defaults to false so chatbot is visible for guests
  const [isOwner, setIsOwner] = useState(false);

  const navigate = useNavigate();
  const location = useLocation() as any;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // CRITICAL: Only check owner role if user is authenticated
      // Guests (no session) should always have isOwner = false
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      } else {
        // No session = guest = chatbot visible
        setIsOwner(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setSessionLoaded(true);

      // Check role if a user is present
      if (session?.user) {
        checkUserRole(session.user.id);
      }

      // Show dialog on every fresh load unless explicitly skipped once after auth redirect
      const state = location.state as any;
      const skipWelcomeOnce = state?.skipWelcomeOnce === true;
      if (skipWelcomeOnce) {
        setShowAccessDialog(false);
        // Clear the state so it only skips once
        navigate(location.pathname, { replace: true });
      } else {
        setShowAccessDialog(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // SECURITY: Check user role from database (not localStorage)
  // CRITICAL: This should ONLY be called for authenticated users
  const checkUserRole = async (userId: string) => {
    try {
      // Extra safety check: if no userId, ensure isOwner is false
      if (!userId) {
        setIsOwner(false);
        return;
      }

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

      // Only set true if data exists (user has owner role)
      // Otherwise explicitly set false (chatbot visible)
      setIsOwner(!!data);
    } catch (error) {
      console.error('Error checking role:', error);
      // On error, default to false (guest = chatbot visible)
      setIsOwner(false);
    }
  };

  // Don't auto-close dialog - let user explicitly choose


  const handleAccessGranted = (ownerStatus: boolean) => {
    // When guest continues, ownerStatus = false, chatbot will be visible
    // When owner signs in (via Auth page), ownerStatus will be checked via checkUserRole
    setIsOwner(ownerStatus);
    setShowAccessDialog(false);
  };

  return (
    <VisitorTrackerProvider isOwner={isOwner}>
      <div className="min-h-screen bg-background">
        <AccessDialog open={showAccessDialog} onAccessGranted={handleAccessGranted} isAuthenticated={!!user} />
        
        {/* Owner controls - visible immediately after login */}
        <OwnerHeader isOwner={isOwner} />
        
        {/* Scroll Progress Indicator */}
        <ScrollProgressIndicator />
        
        <div className="relative">
          
          <div className="relative bg-background">
            <Hero isOwner={isOwner} />
          
          <ResumeSection isOwner={isOwner} />
          
          <SectionTransition 
            badge="Who I Am" 
            subtitle="Passionate about cybersecurity and machine learning — building intelligent systems for defense"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="about-section">
              <About isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Technical Arsenal" 
            subtitle="Core competencies and tools I use to build secure, intelligent systems"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="skills-section">
              <Skills isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Applied Intelligence" 
            subtitle="Where theory meets implementation — ML models and AI systems built to solve real-world problems"
          />
          
          {/* ML & LLM Showcase - Side by Side */}
          <SectionReveal direction="up" delay={0.1}>
            <section id="ml-section" className="py-16 px-4 relative overflow-hidden">
              <div className="absolute inset-0 neural-grid opacity-5" />
              <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="container mx-auto max-w-7xl relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* ML Model Showcase */}
                  <MLShowcase isOwner={isOwner} />
                  
                  {/* Vertical Divider */}
                  <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  </div>
                  
                  {/* LLM/AI Engineering Showcase */}
                  <LLMShowcase isOwner={isOwner} />
                </div>
              </div>
            </section>
          </SectionReveal>
          
          <SectionTransition 
            badge="Flagship Work" 
            subtitle="Highlighted projects that demonstrate end-to-end problem solving"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="featured-projects-section">
              <FeaturedProjects isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Professional Journey" 
            subtitle="Real-world experience building and securing systems"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="experience-section">
              <Experience isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Project Archive" 
            subtitle="A comprehensive collection of technical work and explorations"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="projects-section">
              <Projects isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Credentials" 
            subtitle="Industry certifications validating expertise in security and technology"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="certifications-section">
              <Certifications isOwner={isOwner} />
            </div>
          </SectionReveal>
          
          <SectionTransition 
            badge="Knowledge Base" 
            subtitle="Technical documentation and detailed project write-ups"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="documentation-section">
              <Documentation isOwner={isOwner} />
            </div>
          </SectionReveal>

          <SectionTransition 
            badge="Security Architecture" 
            subtitle="How this portfolio implements defense-in-depth security with real-time threat detection"
          />

          {/* Interactive Security Architecture */}
          <SectionReveal direction="up" delay={0.1}>
            <section id="security-section" className="py-12 px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
              <div className="container mx-auto max-w-5xl relative z-10">
                <InteractiveSecurityArchitecture />
              </div>
            </section>
          </SectionReveal>
          
          <SectionTransition 
            badge="Let's Connect" 
            subtitle="Open to opportunities in cybersecurity and machine learning"
          />
          
          <SectionReveal direction="up" delay={0.1}>
            <div id="contact-section">
              <Contact />
            </div>
          </SectionReveal>

          {/* Chatbot - Only for guests */}
          <PortfolioChatbot isOwner={isOwner} />

          {/* Footer */}
          <footer className="py-8 border-t border-primary/20 bg-gradient-to-b from-background to-card/30">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-muted-foreground font-medium">
                  Ritvik Indupuri • Purdue University • Cybersecurity '28
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <a 
                    href="/technical-documentation" 
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    📄 Technical Documentation
                  </a>
                  <span className="hidden md:inline">•</span>
                  <a 
                    href="/rag-documentation" 
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    🤖 RAG Architecture
                  </a>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </div>
      </div>
    </VisitorTrackerProvider>
  );
};

export default Index;
