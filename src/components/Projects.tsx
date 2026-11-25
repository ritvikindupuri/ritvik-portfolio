import purdueLogo from "@/assets/purdue-logo.svg";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitorTracker } from "@/components/VisitorTrackerProvider";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Brain, Cloud, Container, ExternalLink, Github, Shield, Target } from "lucide-react";
import { useEffect, useState } from "react";

export const PROJECT_CATEGORIES = [
  { id: "security", label: "Security Engineering" },
  { id: "cloud", label: "Cloud Security" },
  { id: "devsecops", label: "Container & Kubernetes Security" },
  { id: "ai", label: "AI & Cybersecurity" },
];

interface Project {
  id?: string;
  title: string;
  type: string;
  startMonth: string;
  endMonth: string;
  skills: string[];
  github: string;
  description: string;
  display_order?: number;
}

interface SortableProjectProps {
  project: Project;
  onProjectClick: (name: string, url?: string) => void;
}

const SortableProject = ({ project, onProjectClick }: SortableProjectProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowMore = project.description.length > 120;
  const displayDescription = isExpanded ? project.description : project.description.slice(0, 120);

  return (
    <div className="group relative h-full">
      <div className="relative bg-gradient-to-br from-card via-card/98 to-card/85 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 h-full flex flex-col shadow-2xl overflow-hidden">
        <div className="relative z-10 space-y-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl md:text-3xl font-bold font-sans bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                {project.title}
              </h3>
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-transparent rounded-full w-3/5" />
            </div>
            {project.type === "Purdue" && (
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg">
                <img src={purdueLogo} alt="Purdue Logo" className="w-7 h-7 object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground leading-relaxed text-sm border-l-2 border-primary/30 pl-4">
              {displayDescription}
              {shouldShowMore && !isExpanded && "..."}
            </p>
            {shouldShowMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium ml-4"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm font-mono bg-primary/5 rounded-xl p-3 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-primary font-semibold">{project.startMonth}</span>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
            <div className="flex items-center gap-2">
              <span className="text-accent font-semibold">{project.endMonth}</span>
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="font-mono text-xs px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 border border-primary/30 shadow-sm"
              >
                {skill}
              </Badge>
            ))}
          </div>

          {/* GitHub Link */}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onProjectClick(project.title, project.github)}
              className="inline-flex items-center gap-3 text-primary hover:text-accent transition-colors font-medium text-sm mt-auto group/link bg-primary/5 hover:bg-primary/10 px-5 py-3 rounded-xl border border-primary/20 hover:border-primary/40"
            >
              <Github className="w-5 h-5" />
              <span>View Source Code</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const initialProjects: Record<string, Project[]> = {
  security: [
    {
      id: "init-sec-1",
      title: "Network Intrusion Detection System",
      type: "Personal",
      startMonth: "Sep 2024",
      endMonth: "Dec 2024",
      skills: ["Python", "Wireshark", "ML"],
      github: "https://github.com/example/nids",
      description: "Built an ML-powered NIDS to detect anomalous network traffic patterns",
    },
    {
      id: "init-sec-2",
      title: "Security Audit Tool",
      type: "Purdue",
      startMonth: "Jan 2024",
      endMonth: "May 2024",
      skills: ["Python", "Nmap", "Scripting"],
      github: "https://github.com/example/audit",
      description: "Automated security assessment tool for network infrastructure",
    },
  ],
  cloud: [
    {
      id: "init-cloud-1",
      title: "Secure Cloud Infrastructure",
      type: "Personal",
      startMonth: "Jun 2024",
      endMonth: "Aug 2024",
      skills: ["AWS", "Terraform", "IAM"],
      github: "https://github.com/example/cloud-infra",
      description: "Designed and deployed secure multi-tier cloud architecture on AWS",
    },
    {
      id: "init-cloud-2",
      title: "Container Security Scanner",
      type: "Purdue",
      startMonth: "Feb 2024",
      endMonth: "Apr 2024",
      skills: ["Docker", "Python", "Security"],
      github: "https://github.com/example/container-scan",
      description: "Automated vulnerability scanning for containerized applications",
    },
  ],
  devsecops: [
    {
      id: "init-devsecops-1",
      title: "OriginTrace — Runtime-to-Source DevSecOps",
      type: "Personal",
      startMonth: "Sep 2026",
      endMonth: "Present",
      skills: ["Python", "ELK", "Semgrep", "Falco"],
      github: "https://github.com/ritvikindupuri/OriginTrace_DevSecOps",
      description:
        "Correlates live runtime security events with the source code responsible for them, turning container alerts into actionable engineering context.",
    },
    {
      id: "init-devsecops-2",
      title: "Secure Cloud Infrastructure & CI/CD Pipeline",
      type: "Personal",
      startMonth: "Jun 2024",
      endMonth: "Aug 2024",
      skills: ["AWS", "Terraform", "GitHub Actions", "Docker"],
      github: "https://github.com/example/cloud-infra",
      description:
        "Designed and deployed secure multi-tier cloud architecture on AWS with automated security compliance scanning.",
    },
  ],
  ai: [
    {
      id: "init-ai-1",
      title: "Malware Classification System",
      type: "Personal",
      startMonth: "Mar 2024",
      endMonth: "Present",
      skills: ["Python", "TensorFlow", "ML"],
      github: "https://github.com/example/malware-ml",
      description: "Deep learning model to classify and detect malware variants",
    },
    {
      id: "init-ai-2",
      title: "Threat Intelligence Analyzer",
      type: "Purdue",
      startMonth: "Oct 2023",
      endMonth: "Dec 2023",
      skills: ["Python", "NLP", "AI"],
      github: "https://github.com/example/threat-intel",
      description: "NLP-based system for analyzing security threat reports",
    },
  ],
};

export const Projects = () => {
  const { trackProjectClick } = useVisitorTracker();
  const [activeTab, setActiveTab] = useState("security");
  const [projects, setProjects] = useState(initialProjects);
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .or("is_featured.is.null,is_featured.eq.false")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedProjects: Record<string, Project[]> = {
        security: [],
        cloud: [],
        devsecops: [],
        ai: [],
      };

      data.forEach((project) => {
        const proj: Project = {
          id: project.id,
          title: project.title,
          type: "Personal",
          startMonth: project.start_date || "",
          endMonth: project.end_date || "",
          skills: project.technologies || [],
          github: project.github_url || "",
          description: project.description,
          display_order: project.display_order || 0,
        };

        // Use saved category, fallback to 'security' if not set
        const rawCategory = (project.category || "security").toLowerCase().trim();
        if (rawCategory === "security") {
          categorizedProjects.security.push(proj);
        } else if (rawCategory === "cloud") {
          categorizedProjects.cloud.push(proj);
        } else if (
          rawCategory === "devsecops" ||
          rawCategory === "devops" ||
          rawCategory === "cloud-infra" ||
          rawCategory === "infrastructure" ||
          rawCategory === "cloud infrastructure & devsecops" ||
          rawCategory === "container & kubernetes security"
        ) {
          categorizedProjects.devsecops.push(proj);
        } else if (rawCategory === "ai") {
          categorizedProjects.ai.push(proj);
        } else if (rawCategory === "open_source" || rawCategory === "open-source") {
          // Handled by dedicated Open Source Contributions section
          return;
        } else {
          categorizedProjects.security.push(proj);
        }
      });

      setProjects(categorizedProjects);
    }
  };
  return (
    <section id="projects" className="py-32 px-4 bg-card/20 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div>
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Projects</h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
            <div className="pb-4">
              <TabsList className="relative z-10 flex flex-wrap w-full justify-center mb-12 bg-transparent h-auto p-0 gap-6 rounded-none shadow-none border-0">
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Security Engineering Projects</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cloud"
                  className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                >
                  <Cloud className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Cloud Security Projects</span>
                </TabsTrigger>
                <TabsTrigger
                  value="devsecops"
                  className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                >
                  <Container className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Container & Kubernetes Security Projects</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                >
                  <Brain className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">AI Security Projects</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(projects).map(([key, projectList]) => (
              <TabsContent key={key} value={key} className="space-y-8">
                <>
                  <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.12, delayChildren: 0.1 },
                      },
                    }}
                  >
                    {projectList
                      .filter((p) => p.id)
                      .map((project) => (
                        <motion.div
                          key={project.id}
                          variants={{
                            hidden: { opacity: 0, y: 40, scale: 0.95 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
                            },
                          }}
                        >
                          <SortableProject key={project.id} project={project} onProjectClick={trackProjectClick} />
                        </motion.div>
                      ))}
                  </motion.div>
                </>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
