import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Certifications } from "@/components/Certifications";
import { Documentation } from "@/components/Documentation";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";
import { AccessDialog } from "@/components/AccessDialog";

const Index = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const handleAccessGranted = (owner: boolean) => {
    setIsOwner(owner);
    setAccessGranted(true);
  };

  return (
    <>
      <AccessDialog open={!accessGranted} onAccessGranted={handleAccessGranted} />
      
      {/* Owner Info Banner */}
      {isOwner && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-primary/10 border border-primary/30 backdrop-blur-md rounded-lg p-4 shadow-elegant">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Owner Mode:</span> Your edits are visible during this session only. Changes don't persist after refresh or for other viewers.
          </p>
        </div>
      )}
      
      <div className="min-h-screen bg-background">
        <Hero isOwner={isOwner} />
        <About isOwner={isOwner} />
        <Skills isOwner={isOwner} />
        <Certifications isOwner={isOwner} />
        <Documentation isOwner={isOwner} />
        <Projects isOwner={isOwner} />
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
