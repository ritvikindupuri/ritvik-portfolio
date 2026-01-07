import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Cpu, Brain, Sparkles, Briefcase, FolderOpen, 
  Award, BookOpen, Shield, Mail, ChevronUp
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const sections = [
  { id: "about-section", label: "About", icon: User, color: "bg-blue-500" },
  { id: "skills-section", label: "Skills", icon: Cpu, color: "bg-green-500" },
  { id: "ml-section", label: "AI/ML", icon: Brain, color: "bg-purple-500" },
  { id: "featured-projects-section", label: "Featured", icon: Sparkles, color: "bg-yellow-500" },
  { id: "experience-section", label: "Experience", icon: Briefcase, color: "bg-orange-500" },
  { id: "projects-section", label: "Projects", icon: FolderOpen, color: "bg-cyan-500" },
  { id: "certifications-section", label: "Certs", icon: Award, color: "bg-red-500" },
  { id: "documentation-section", label: "Docs", icon: BookOpen, color: "bg-indigo-500" },
  { id: "security-section", label: "Security", icon: Shield, color: "bg-emerald-500" },
  { id: "contact-section", label: "Contact", icon: Mail, color: "bg-pink-500" },
];

export const ScrollProgressIndicator = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Show indicator after scrolling past hero (roughly 100vh)
      setIsVisible(scrollTop > window.innerHeight * 0.5);

      // Determine active section
      let currentSection: string | null = null;
      const offset = window.innerHeight * 0.3;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            currentSection = section.id;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeIndex = sections.findIndex(s => s.id === activeSection);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1"
        >
          {/* Back to top button */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={scrollToTop}
                  className="mb-2 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-card transition-all shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Back to top</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Progress track */}
          <div className="relative py-2">
            {/* Background track */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-border/50 rounded-full" />
            
            {/* Progress fill */}
            <motion.div 
              className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-pink-500 rounded-full origin-top"
              style={{ height: `${scrollProgress}%` }}
            />

            {/* Section dots */}
            <div className="relative flex flex-col gap-3 py-1">
              <TooltipProvider delayDuration={100}>
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSection;
                  const isPast = activeIndex > index;

                  return (
                    <Tooltip key={section.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => scrollToSection(section.id)}
                          className={`relative p-1.5 rounded-full transition-all duration-300 ${
                            isActive 
                              ? `${section.color} shadow-lg` 
                              : isPast 
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-card/80 border border-border/50 hover:border-primary/50"
                          }`}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className={`w-3 h-3 ${
                            isActive 
                              ? "text-white" 
                              : isPast 
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`} />
                          
                          {/* Active pulse ring */}
                          {isActive && (
                            <motion.div
                              className={`absolute inset-0 rounded-full ${section.color} opacity-50`}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${section.color}`} />
                        <p className="text-xs font-medium">{section.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {/* Percentage indicator */}
          <div className="mt-2 px-2 py-1 rounded-md bg-card/80 backdrop-blur-sm border border-border/50">
            <span className="text-[10px] font-mono text-muted-foreground">
              {Math.round(scrollProgress)}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};