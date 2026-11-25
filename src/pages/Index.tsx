import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Certifications } from "@/components/Certifications";
import { Documentation } from "@/components/Documentation";
import Experience from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { Contact } from "@/components/Contact";
import { PortfolioChatbot } from "@/components/PortfolioChatbot";
import { SecurityTools } from "@/components/SecurityTools";
import { LLMShowcase } from "@/components/LLMShowcase";
import { SectionTransition } from "@/components/SectionTransition";
import { VisitorTrackerProvider } from "@/components/VisitorTrackerProvider";
import { ResumeSection } from "@/components/ResumeSection";
import { InteractiveSecurityArchitecture } from "@/components/InteractiveSecurityArchitecture";
import { ScrollProgressIndicator } from "@/components/ScrollProgressIndicator";
import { SectionReveal } from "@/components/SectionReveal";
import { ChatbotProvider } from "@/contexts/ChatbotContext";

const Index = () => {
  return (
    <ChatbotProvider>
      <VisitorTrackerProvider>
        <div className="min-h-screen bg-background">
          {/* Scroll Progress Indicator */}
          <ScrollProgressIndicator />

          <div className="relative">
            <div className="relative bg-background">
              <Hero />

              <ResumeSection />

              <SectionTransition
                badge="Who I Am"
                subtitle="Passionate about cybersecurity and machine learning — building intelligent systems for defense"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="about-section">
                  <About />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Technical Arsenal"
                subtitle="Core competencies and tools I use to build secure, intelligent systems"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="skills-section">
                  <Skills />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Applied Intelligence"
                subtitle="Where theory meets implementation — security tools and AI systems built to solve real-world problems"
              />

              {/* Security Tools & Agentic Security Systems - Stacked */}
              <SectionReveal direction="up" delay={0.1}>
                <section id="security-tools-section" className="py-16 px-4 relative overflow-hidden">
                  <div className="absolute inset-0 neural-grid opacity-5" />
                  <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

                  <div className="container mx-auto max-w-7xl relative z-10 space-y-16">
                    {/* Security Tools Showcase */}
                    <SecurityTools />

                    {/* Horizontal Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    {/* Agentic Security Systems Showcase */}
                    <LLMShowcase />
                  </div>
                </section>
              </SectionReveal>

              <SectionTransition
                badge="Flagship Work"
                subtitle="Highlighted projects that demonstrate end-to-end problem solving"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="featured-projects-section">
                  <FeaturedProjects />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Professional Journey"
                subtitle="Real-world experience building and securing systems"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="experience-section">
                  <Experience />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Project Archive"
                subtitle="A comprehensive collection of technical work and explorations"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="projects-section">
                  <Projects />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Credentials"
                subtitle="Industry certifications validating expertise in security and technology"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="certifications-section">
                  <Certifications />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Knowledge Base"
                subtitle="Technical documentation and detailed project write-ups"
              />

              <SectionReveal direction="up" delay={0.1}>
                <div id="documentation-section">
                  <Documentation />
                </div>
              </SectionReveal>

              <SectionTransition
                badge="Security Architecture"
                subtitle="How this portfolio implements defense-in-depth security with real-time threat detection"
              />

              {/* Interactive Security Architecture */}
              <SectionReveal direction="up" delay={0.1}>
                <section id="security-section" className="py-14 px-4 sm:px-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                  <div className="container mx-auto max-w-7xl relative z-10">
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

              {/* Chatbot */}
              <PortfolioChatbot />

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
                  {/* Privacy Notice */}
                  <div className="mt-4 pt-4 border-t border-border/30 text-center">
                    <p className="text-xs text-muted-foreground/70">
                      🔒 This site collects IP addresses and visitor activity for security monitoring purposes. No
                      personal data is shared with third parties except for IP geolocation services.
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </VisitorTrackerProvider>
    </ChatbotProvider>
  );
};

export default Index;
