import ArchitectureFlow from "@/components/ArchitectureFlow";
import ProjectLogo from "@/components/ProjectLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getArchitectureFlow } from "@/data/agenticArchitectureFlows";
import { agenticProjectDetails } from "@/data/agenticProjectDetails";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Bug,
  Cloud,
  Cpu,
  Crosshair,
  ExternalLink,
  Eye,
  FileText,
  Fingerprint,
  Github,
  Radar,
  Scan,
  Shield,
  Siren,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LLMProject {
  id: string;
  title: string;
  description: string;
  project_type: string | null;
  llm_provider: string | null;
  use_case: string | null;
  technologies: string[];
  github_url: string | null;
  demo_url: string | null;
  documentation_url: string | null;
  display_order: number;
}

export const LLMShowcase = () => {
  const [projects, setProjects] = useState<LLMProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentRotation, setCurrentRotation] = useState(0);
  const [selectedProject, setSelectedProject] = useState<LLMProject | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  // Once the visitor navigates the carousel themselves, auto-rotate stops for the rest of the session.
  const [userHasControl, setUserHasControl] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("agentic-carousel-user-control") === "1";
    } catch {
      return false;
    }
  });
  const takeControl = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
    if (userHasControl) return;
    setUserHasControl(true);
    try {
      sessionStorage.setItem("agentic-carousel-user-control", "1");
    } catch {
      /* ignore */
    }
  };

  // 3D layers often rasterize at 1× CSS pixels (and perspective then enlarges the front card ~1.43×),
  // which is why every icon looks soft. Render the coverflow at 2× and scale it back so textures stay sharp.
  const CAROUSEL_RASTER = 2;
  const CAROUSEL_PERSPECTIVE = 1000 * CAROUSEL_RASTER;
  const CAROUSEL_RADIUS = 300 * CAROUSEL_RASTER;

  // Get unique project types for filter
  const categories = ["all", ...new Set(projects.map((p) => p.project_type).filter(Boolean))] as string[];

  // Filter projects by selected category
  const filteredProjects =
    selectedCategory === "all" ? projects : projects.filter((p) => p.project_type === selectedCategory);
  useEffect(() => {
    fetchProjects();
  }, []);

  // Auto-rotate carousel (respects prefers-reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || userHasControl || isDragging || filteredProjects.length === 0) return;

    autoRotateRef.current = setInterval(() => {
      setCurrentRotation((prev) => prev - 360 / Math.max(filteredProjects.length, 1));
    }, 3000);

    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [filteredProjects.length, isDragging, userHasControl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key === "ArrowLeft") {
        rotateLeft();
      } else if (e.key === "ArrowRight") {
        rotateRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredProjects.length]);

  const rotateLeft = () => {
    if (filteredProjects.length === 0) return;
    takeControl();
    // Positive rotateY brings the left-hand card to center.
    setCurrentRotation((prev) => prev + 360 / filteredProjects.length);
  };

  const rotateRight = () => {
    if (filteredProjects.length === 0) return;
    takeControl();
    // Negative rotateY brings the right-hand card to center.
    setCurrentRotation((prev) => prev - 360 / filteredProjects.length);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStart;
    if (delta !== 0) takeControl();
    setCurrentRotation((prev) => prev + delta * 0.5);
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStart;
    if (delta !== 0) takeControl();
    setCurrentRotation((prev) => prev + delta * 0.5);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  const fetchProjects = async () => {
    const { data, error } = await supabase.from("llm_projects").select("*").order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching LLM projects:", error);
      return;
    }

    if (data) {
      // Filter out internal chatbot project (migration pending on live DB)
      const filteredData = data.filter(
        (p) => p.id !== "nvgfgoykyeouwrksszpb" && p.title !== "Semantic RAG Portfolio Chatbot",
      );

      setProjects(
        filteredData.map((p) => ({
          ...p,
          technologies: p.technologies || [],
        })),
      );
    }
  };
  // Extract short name from title (before ':' or ' - ' / ' — ')
  const getShortName = (title: string): string => {
    const separators = [":", " - ", " — ", " – "];
    for (const sep of separators) {
      const index = title.indexOf(sep);
      if (index !== -1) {
        return title.substring(0, index).trim();
      }
    }
    return title;
  };

  // Project signature icon and color mapping
  const getProjectSignature = (
    project: LLMProject,
  ): { icon: any; logo?: string; color: string; gradient: string; shadow: string } => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();

    // Map by title first (most specific)
    if (title.includes("agentpot"))
      return {
        icon: Bug,
        color: "#f59e0b", // amber
        gradient: "from-amber-500/20 to-amber-600/10",
        shadow: "shadow-amber-500/30",
      };
    if (title.includes("lume"))
      return {
        icon: Scan,
        color: "#06b6d4", // cyan
        gradient: "from-cyan-500/20 to-cyan-600/10",
        shadow: "shadow-cyan-500/30",
      };
    if (title.includes("mcp") && title.includes("impersonation"))
      return {
        icon: Fingerprint,
        color: "#8b5cf6", // violet
        gradient: "from-violet-500/20 to-violet-600/10",
        shadow: "shadow-violet-500/30",
      };
    if (title.includes("aws ir"))
      return {
        icon: Siren,
        color: "#dc2626", // red
        gradient: "from-red-500/20 to-red-600/10",
        shadow: "shadow-red-500/30",
      };
    if (title.includes("cloudpilot"))
      return {
        icon: Shield,
        logo: "/project-logos/cloudpilot.png",
        color: "#06b6d4", // cyan (same color it previously got from the cloud fallback)
        gradient: "from-cyan-500/20 to-cyan-600/10",
        shadow: "shadow-cyan-500/30",
      };
    if (title.includes("strata"))
      return {
        icon: Shield,
        logo: "/project-logos/strata.png",
        color: "#0ea5e9", // sky
        gradient: "from-sky-500/20 to-sky-600/10",
        shadow: "shadow-sky-500/30",
      };
    if (title.includes("cirrus"))
      return {
        icon: Shield,
        logo: "/project-logos/cirrus.png",
        color: "#3b82f6", // blue
        gradient: "from-blue-500/20 to-blue-600/10",
        shadow: "shadow-blue-500/30",
      };
    if (title.includes("aegis"))
      return {
        icon: Shield,
        logo: "/project-logos/aegis.png?v=3",
        color: "#6366f1", // indigo
        gradient: "from-indigo-500/20 to-indigo-600/10",
        shadow: "shadow-indigo-500/30",
      };
    if (title.includes("threatlens"))
      return {
        icon: Shield,
        logo: "/project-logos/threatlens.png",
        color: "#ec4899", // pink
        gradient: "from-pink-500/20 to-pink-600/10",
        shadow: "shadow-pink-500/30",
      };
    if (title.includes("aether"))
      return {
        icon: Shield,
        logo: "/project-logos/aether.png",
        color: "#a855f7", // purple
        gradient: "from-purple-500/20 to-purple-600/10",
        shadow: "shadow-purple-500/30",
      };
    if (title.includes("spectra"))
      return {
        icon: Shield,
        logo: "/project-logos/spectra.png",
        color: "#d946ef", // fuchsia
        gradient: "from-fuchsia-500/20 to-fuchsia-600/10",
        shadow: "shadow-fuchsia-500/30",
      };
    if (title.includes("containment"))
      return {
        icon: Shield,
        logo: "/project-logos/containment.png",
        color: "#f59e0b", // amber, matches the Containment logo
        gradient: "from-amber-500/20 to-amber-600/10",
        shadow: "shadow-amber-500/30",
      };
    if (title.includes("karma"))
      return {
        icon: Shield,
        logo: "/project-logos/karma.png",
        color: "#326ce5", // Kubernetes blue, matches the KARMA wheel
        gradient: "from-blue-600/20 to-blue-700/10",
        shadow: "shadow-blue-600/30",
      };
    if (title.includes("chaff"))
      return {
        icon: Shield,
        logo: "/project-logos/chaff.png",
        color: "#f97316", // orange
        gradient: "from-orange-500/20 to-orange-600/10",
        shadow: "shadow-orange-500/30",
      };
    if (title.includes("traceveil"))
      return {
        icon: Shield,
        logo: "/project-logos/traceveil.png",
        color: "#64748b", // slate
        gradient: "from-slate-500/20 to-slate-600/10",
        shadow: "shadow-slate-500/30",
      };

    // Fallback patterns by description keywords
    if (description.includes("cloud") || description.includes("kubernetes"))
      return {
        icon: Cloud,
        color: "#06b6d4",
        gradient: "from-cyan-500/20 to-cyan-600/10",
        shadow: "shadow-cyan-500/30",
      };
    if (description.includes("intrusion") || description.includes("detection"))
      return {
        icon: Radar,
        color: "#ec4899",
        gradient: "from-pink-500/20 to-pink-600/10",
        shadow: "shadow-pink-500/30",
      };
    if (description.includes("pentest") || description.includes("assessment"))
      return {
        icon: Crosshair,
        color: "#dc2626",
        gradient: "from-red-500/20 to-red-600/10",
        shadow: "shadow-red-500/30",
      };
    if (description.includes("threat intel"))
      return {
        icon: Eye,
        color: "#8b5cf6",
        gradient: "from-violet-500/20 to-violet-600/10",
        shadow: "shadow-violet-500/30",
      };
    if (description.includes("workflow") || description.includes("orchestrat"))
      return {
        icon: Workflow,
        color: "#6366f1",
        gradient: "from-indigo-500/20 to-indigo-600/10",
        shadow: "shadow-indigo-500/30",
      };

    // Ultimate fallback
    return {
      icon: Shield,
      color: "#a855f7",
      gradient: "from-purple-500/20 to-purple-600/10",
      shadow: "shadow-purple-500/30",
    };
  };

  // Safety check: if no projects, show loading state
  if (filteredProjects.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-3 shadow-purple">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural pb-1">
            Agentic Security Systems
          </h3>
          <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-3 shadow-purple">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
        </div>
        <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural pb-1">Agentic Security Systems</h3>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
          Autonomous agents for cloud defense, detection & red teaming
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-accent to-neural-pink mx-auto rounded-full mt-4" />
      </div>

      {/* Category Filter - Segmented Pill Control */}
      {categories.length > 2 && (
        <div className="flex justify-center">
          <div className="inline-flex max-w-full overflow-x-auto p-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/40 shadow-lg">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                }}
                aria-pressed={selectedCategory === category}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-xs font-medium rounded-full border transition-colors duration-200 ${
                  selectedCategory === category
                    ? "bg-foreground/10 text-foreground border-foreground/15"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3D Carousel Gallery - Desktop */}
      <div
        className="hidden md:block relative max-w-5xl mx-auto"
        style={{ height: "500px" }}
        onMouseEnter={() => {
          if (autoRotateRef.current) clearInterval(autoRotateRef.current);
        }}
        onMouseLeave={() => {
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (!prefersReducedMotion && !userHasControl && filteredProjects.length > 0) {
            if (autoRotateRef.current) clearInterval(autoRotateRef.current);
            autoRotateRef.current = setInterval(() => {
              setCurrentRotation((prev) => prev - 360 / filteredProjects.length);
            }, 3000);
          }
        }}
      >
        <div
          className="absolute overflow-visible"
          style={{
            inset: `-${(CAROUSEL_RASTER - 1) * 50}%`,
            transform: `scale(${1 / CAROUSEL_RASTER})`,
            transformOrigin: "center center",
          }}
        >
          <div className="absolute inset-0" style={{ perspective: `${CAROUSEL_PERSPECTIVE}px` }}>
            <div
              ref={carouselRef}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${currentRotation}deg)`,
                transition: isDragging ? "none" : "transform 0.5s ease-out",
              }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredProjects.map((project, index) => {
            const signature = getProjectSignature(project);
            const ProjectIcon = signature.icon;
            const angle = (360 / filteredProjects.length) * index;
            const radius = CAROUSEL_RADIUS;

            return (
              <div
                key={project.id}
                className="absolute top-1/2 left-1/2 cursor-pointer"
                style={{
                  transform: `
                    translate(-50%, -50%)
                    rotateY(${angle}deg)
                    translateZ(${radius}px)
                  `,
                  backfaceVisibility: "hidden",
                }}
                onClick={() => {
                  takeControl();
                  setSelectedProject(project);
                  setIsSheetOpen(true);
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`group w-64 h-64 rounded-[2rem] bg-card/80 backdrop-blur-md border-4 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col items-center justify-center gap-6 p-8 ${signature.shadow}`}
                  style={{
                    borderColor: signature.color + "80",
                  }}
                >
                  {/* Layered icon treatment - hexagon badge with gradient ring and glow */}
                  <div className="relative">
                    <div
                      className="relative w-28 h-28 rounded-2xl bg-white/[0.04] flex items-center justify-center border-2"
                      style={{ borderColor: signature.color + "40" }}
                    >
                      {signature.logo ? (
                        <ProjectLogo src={signature.logo} className="w-20 h-20" />
                      ) : (
                        <ProjectIcon className="w-14 h-14" style={{ color: signature.color }} />
                      )}
                    </div>
                  </div>
                  <p
                    className="text-2xl font-medium text-center text-foreground leading-snug"
                    style={{
                      textWrap: "balance",
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {getShortName(project.title)}
                  </p>
                </motion.div>
              </div>
            );
          })}
            </div>
          </div>
        </div>

        {/* Arrow Navigation Buttons */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
          <Button
            onClick={rotateLeft}
            size="icon"
            variant="outline"
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary/20 border-primary/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
          <Button
            onClick={rotateRight}
            size="icon"
            variant="outline"
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary/20 border-primary/50"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile: Horizontal Swipe Row */}
      <div className="md:hidden overflow-x-auto pb-3 px-4">
        <div className="flex gap-4 min-w-min">
          {filteredProjects.map((project) => {
            const signature = getProjectSignature(project);
            const ProjectIcon = signature.icon;

            return (
              <div
                key={project.id}
                onClick={() => {
                  takeControl();
                  setSelectedProject(project);
                  setIsSheetOpen(true);
                }}
                className={`group flex-shrink-0 w-28 h-28 rounded-xl bg-card/80 backdrop-blur-md border-2 transition-all duration-300 shadow-lg cursor-pointer flex flex-col items-center justify-center gap-2 p-3 ${signature.shadow}`}
                style={{
                  borderColor: signature.color + "80",
                }}
              >
                <div className="relative">
                  <div
                    className="relative w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center border"
                    style={{ borderColor: signature.color + "40" }}
                  >
                    {signature.logo ? (
                      <ProjectLogo src={signature.logo} className="w-9 h-9" />
                    ) : (
                      <ProjectIcon className="w-6 h-6" style={{ color: signature.color }} />
                    )}
                  </div>
                </div>
                <p
                  className="text-xs font-medium text-center text-foreground leading-snug"
                  style={{
                    textWrap: "balance",
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {getShortName(project.title)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel Sheet */}
      {selectedProject && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:w-[58vw] sm:max-w-[800px] overflow-y-auto p-6 sm:p-10">
            {(() => {
              const signature = getProjectSignature(selectedProject);
              const ProjectIcon = signature.icon;
              return (
                <>
                  {/* Signature color header strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(to right, ${signature.color}, ${signature.color}80)` }}
                  />
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-4 pt-2 pr-8">
                      <div
                        className="relative w-14 h-14 shrink-0 rounded-xl bg-white/[0.04] flex items-center justify-center border"
                        style={{ borderColor: signature.color + "50" }}
                      >
                        {signature.logo ? (
                          <ProjectLogo src={signature.logo} className="w-10 h-10" />
                        ) : (
                          <ProjectIcon className="w-6 h-6" style={{ color: signature.color }} />
                        )}
                      </div>
                      <span className="text-left text-xl sm:text-2xl leading-snug">{selectedProject.title}</span>
                    </SheetTitle>
                    <SheetDescription className="text-left pt-3 text-[15px] leading-relaxed">
                      {selectedProject.description}
                    </SheetDescription>

                    {/* Enriched project details */}
                    {agenticProjectDetails[selectedProject.title] && (
                      <div className="space-y-8 pt-6 text-left">
                        {/* Key Features */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4" style={{ color: signature.color }} />
                            <h4 className="text-sm font-semibold tracking-wide" style={{ color: signature.color }}>
                              Key features
                            </h4>
                          </div>
                          <ul className="grid gap-3 lg:grid-cols-2">
                            {agenticProjectDetails[selectedProject.title].keyFeatures.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground leading-relaxed rounded-xl border border-border/50 bg-white/[0.02] p-4 flex gap-3"
                              >
                                <span
                                  className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full"
                                  style={{ background: signature.color }}
                                />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Architecture */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Cpu className="w-4 h-4" style={{ color: signature.color }} />
                            <h4 className="text-sm font-semibold tracking-wide" style={{ color: signature.color }}>
                              Architecture
                            </h4>
                          </div>
                          {(() => {
                            const flow = getArchitectureFlow(selectedProject.title);
                            return flow ? (
                              <>
                                <ArchitectureFlow nodes={flow} color={signature.color} />
                                <p className="text-sm text-foreground/80 leading-relaxed mt-4 max-w-3xl">
                                  {agenticProjectDetails[selectedProject.title].architecture}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {agenticProjectDetails[selectedProject.title].architecture}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </SheetHeader>

                  <div className="space-y-8 py-8">
                    {/* Category & Provider */}
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.project_type && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: signature.color + "50",
                            color: signature.color,
                          }}
                        >
                          {selectedProject.project_type}
                        </Badge>
                      )}
                      {selectedProject.llm_provider && (
                        <Badge variant="secondary">{selectedProject.llm_provider}</Badge>
                      )}
                    </div>

                    {/* Use Case */}
                    {selectedProject.use_case && (
                      <div
                        className="backdrop-blur-sm rounded-xl p-4 border"
                        style={{
                          background: `${signature.color}10`,
                          borderColor: signature.color + "30",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4" style={{ color: signature.color }} />
                          <h4 className="text-sm font-semibold" style={{ color: signature.color }}>
                            Use Case
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedProject.use_case}</p>
                      </div>
                    )}

                    {/* Technologies */}
                    {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold tracking-wide mb-3">Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 text-foreground border border-border font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {(selectedProject.github_url || selectedProject.demo_url || selectedProject.documentation_url) && (
                      <div className="flex flex-wrap gap-2.5 pt-6 border-t border-border">
                        {selectedProject.github_url && (
                          <Button asChild size="sm" className="rounded-full px-4">
                            <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4 mr-1.5" />
                              Source Code
                            </a>
                          </Button>
                        )}
                        {selectedProject.demo_url && (
                          <Button asChild size="sm" variant="outline" className="rounded-full px-4">
                            <a href={selectedProject.demo_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1.5" />
                              Live Demo
                            </a>
                          </Button>
                        )}
                        {selectedProject.documentation_url && (
                          <Button asChild size="sm" variant="outline" className="rounded-full px-4">
                            <a href={selectedProject.documentation_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-1.5" />
                              Documentation
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>LLM projects coming soon</p>
        </div>
      )}
    </div>
  );
};
