
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Target, Cloud, Brain, ExternalLink, Plus, X, Shield, GripVertical, ChevronDown, Container, FolderInput, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import purdueLogo from "@/assets/purdue-logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVisitorTracker } from "@/components/VisitorTrackerProvider";
import { scanGitHubRepoSkills, parseGitHubUrl } from "@/lib/githubSkillsScanner";

export const PROJECT_CATEGORIES = [
  { id: "security", label: "Security Engineering" },
  { id: "cloud", label: "Cloud Security" },
  { id: "devsecops", label: "Container & Kubernetes Security" },
  { id: "ai", label: "AI & Cybersecurity" },
];

interface ProjectsProps {
  isOwner: boolean;
}

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
  category: string;
  isOwner: boolean;
  categories: { id: string; label: string }[];
  onEdit: () => void;
  onRemove: () => void;
  onMove: (targetCategory: string) => void;
  onProjectClick: (name: string, url?: string) => void;
}

const SortableProject = ({ project, category, isOwner, categories, onEdit, onRemove, onMove, onProjectClick }: SortableProjectProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const shouldShowMore = project.description.length > 120;
  const displayDescription = isExpanded ? project.description : project.description.slice(0, 120);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative h-full"
    >
      <div className="relative bg-gradient-to-br from-card via-card/98 to-card/85 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 h-full flex flex-col shadow-2xl overflow-hidden">
        {isOwner && (
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              {...attributes}
              {...listeners}
              className="bg-muted/80 hover:bg-muted text-foreground rounded-xl p-2.5 backdrop-blur-sm cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {isOwner && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-20">
            <button
              onClick={onEdit}
              title="Edit project"
              className="bg-primary/20 hover:bg-primary/30 text-primary rounded-xl p-2.5 backdrop-blur-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Move to category"
                  className="bg-accent/20 hover:bg-accent/30 text-accent rounded-xl p-2.5 backdrop-blur-sm transition-colors flex items-center gap-1.5"
                >
                  <FolderInput className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border z-50 shadow-xl" align="end">
                <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50">
                  Move to Category
                </div>
                {categories
                  .filter(cat => cat.id !== category)
                  .map(cat => (
                    <DropdownMenuItem 
                      key={cat.id}
                      onClick={() => onMove(cat.id)}
                      className="cursor-pointer text-sm py-2 px-3 focus:bg-primary/10 focus:text-primary"
                    >
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={onRemove}
              title="Delete project"
              className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-xl p-2.5 backdrop-blur-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
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
                <img
                  src={purdueLogo}
                  alt="Purdue Logo"
                  className="w-7 h-7 object-contain"
                />
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
              <Badge key={skill} variant="secondary" className="font-mono text-xs px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 border border-primary/30 shadow-sm">
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
      description: "Correlates live runtime security events with the source code responsible for them, turning container alerts into actionable engineering context.",
    },
    {
      id: "init-devsecops-2",
      title: "Secure Cloud Infrastructure & CI/CD Pipeline",
      type: "Personal",
      startMonth: "Jun 2024",
      endMonth: "Aug 2024",
      skills: ["AWS", "Terraform", "GitHub Actions", "Docker"],
      github: "https://github.com/example/cloud-infra",
      description: "Designed and deployed secure multi-tier cloud architecture on AWS with automated security compliance scanning.",
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

export const Projects = ({ isOwner }: ProjectsProps) => {
  const { trackProjectClick } = useVisitorTracker();
  const [activeTab, setActiveTab] = useState("security");
  const [projectCategory, setProjectCategory] = useState<string>("security");
  const [projects, setProjects] = useState(initialProjects);
  const [showAll, setShowAll] = useState<Record<string, boolean>>({
    security: false,
    cloud: false,
    devsecops: false,
    ai: false,
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<Project>({
    title: "",
    type: "Personal",
    startMonth: "",
    endMonth: "",
    skills: [],
    github: "",
    description: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScanningSkills, setIsScanningSkills] = useState(false);

  const handleScanGitHubSkills = async (urlToScan?: string) => {
    const targetUrl = (urlToScan !== undefined ? urlToScan : newProject.github).trim();
    if (!targetUrl) {
      toast.error("Please enter a GitHub repository URL first");
      return;
    }

    const parsed = parseGitHubUrl(targetUrl);
    if (!parsed) {
      toast.error("Please enter a valid GitHub URL (e.g., https://github.com/username/repo)");
      return;
    }

    setIsScanningSkills(true);
    const toastId = toast.loading(`Scanning ${parsed.owner}/${parsed.repo} for top skills...`);

    try {
      const detectedSkills = await scanGitHubRepoSkills(targetUrl);
      if (detectedSkills.length > 0) {
        setNewProject((prev) => ({
          ...prev,
          skills: detectedSkills,
        }));
        toast.success(`Auto-detected top ${detectedSkills.length} skills: ${detectedSkills.join(', ')}`, {
          id: toastId,
        });
      } else {
        toast.info("No common skills detected from repository. You can add them manually below.", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error("Error scanning GitHub skills:", err);
      toast.error("Failed to scan repository. You can add skills manually.", {
        id: toastId,
      });
    } finally {
      setIsScanningSkills(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or('is_featured.is.null,is_featured.eq.false')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedProjects: Record<string, Project[]> = {
        security: [],
        cloud: [],
        devsecops: [],
        ai: []
      };

      data.forEach(project => {
        const proj: Project = {
          id: project.id,
          title: project.title,
          type: "Personal",
          startMonth: project.start_date || "",
          endMonth: project.end_date || "",
          skills: project.technologies || [],
          github: project.github_url || "",
          description: project.description,
          display_order: project.display_order || 0
        };

        // Use saved category, fallback to 'security' if not set
        const rawCategory = (project.category || 'security').toLowerCase().trim();
        if (rawCategory === 'security') {
          categorizedProjects.security.push(proj);
        } else if (rawCategory === 'cloud') {
          categorizedProjects.cloud.push(proj);
        } else if (
          rawCategory === 'devsecops' ||
          rawCategory === 'devops' ||
          rawCategory === 'cloud-infra' ||
          rawCategory === 'infrastructure' ||
          rawCategory === 'cloud infrastructure & devsecops' ||
          rawCategory === 'container & kubernetes security'
        ) {
          categorizedProjects.devsecops.push(proj);
        } else if (rawCategory === 'ai') {
          categorizedProjects.ai.push(proj);
        } else if (rawCategory === 'open_source' || rawCategory === 'open-source') {
          // Handled by dedicated Open Source Contributions section
          return;
        } else {
          categorizedProjects.security.push(proj);
        }
      });

      setProjects(categorizedProjects);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = projects[category].findIndex(p => p.id === active.id);
    const newIndex = projects[category].findIndex(p => p.id === over.id);

    const newOrder = arrayMove(projects[category], oldIndex, newIndex);
    
    setProjects({
      ...projects,
      [category]: newOrder
    });

    // Save the new order to database
    try {
      const updates = newOrder.map((project, index) => 
        supabase
          .from('projects')
          .update({ display_order: index })
          .eq('id', project.id)
      );
      
      await Promise.all(updates);
      toast.success("Order updated successfully");
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error("Failed to update order");
      fetchProjects(); // Revert on error
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMoveProject = async (projectId: string | undefined, fromCategory: string, toCategory: string, projectTitle: string) => {
    if (fromCategory === toCategory) return;
    
    const fromList = projects[fromCategory] || [];
    const toList = projects[toCategory] || [];

    const projectToMove = fromList.find(p => (projectId && p.id === projectId) || p.title === projectTitle);
    if (!projectToMove) return;

    // Optimistically update UI
    const newFromList = fromList.filter(p => (projectId && p.id ? p.id !== projectId : p.title !== projectTitle));
    const newToList = [...toList, { ...projectToMove, display_order: toList.length }];

    setProjects({
      ...projects,
      [fromCategory]: newFromList,
      [toCategory]: newToList,
    });

    const targetCategoryObj = PROJECT_CATEGORIES.find(c => c.id === toCategory);
    const targetLabel = targetCategoryObj ? targetCategoryObj.label : toCategory;

    try {
      let query = supabase.from('projects').update({ category: toCategory, display_order: toList.length });
      if (projectId) {
        query = query.eq('id', projectId);
      } else {
        query = query.eq('title', projectTitle);
      }
      const { error } = await query;

      if (error) {
        throw error;
      }

      toast.success(`Moved "${projectTitle}" to ${targetLabel}`);
      await fetchProjects();
    } catch (error) {
      console.error('Error moving project:', error);
      toast.error('Failed to move project');
      fetchProjects(); // Revert
    }
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description) return;
    
    setIsUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const targetCategory = projectCategory || activeTab;

      if (editingProject) {
        // Update existing project - use ID for more reliable updates
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', editingProject)
          .single();

        if (existingProject) {
          const { error } = await supabase
            .from('projects')
            .update({
              title: newProject.title,
              description: newProject.description,
              github_url: newProject.github,
              technologies: newProject.skills,
              category: targetCategory,
              start_date: newProject.startMonth,
              end_date: newProject.endMonth
            })
            .eq('id', existingProject.id);

          if (error) {
            toast.error("Failed to update project");
            console.error('Error updating project:', error);
            return;
          }

          await fetchProjects();
          toast.success("Project updated successfully");
        }
      } else {
        // Insert new project
        const { error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: newProject.title,
            description: newProject.description,
            github_url: newProject.github,
            technologies: newProject.skills,
            category: targetCategory,
            start_date: newProject.startMonth,
            end_date: newProject.endMonth
          });

        if (error) {
          toast.error("Failed to add project");
          console.error('Error adding project:', error);
          return;
        }

        await fetchProjects();
        toast.success("Project added successfully");
      }
      
      setNewProject({
        title: "",
        type: "Personal",
        startMonth: "",
        endMonth: "",
        skills: [],
        github: "",
        description: "",
      });
      setSkillInput("");
      setEditingProject(null);
      setIsAddDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveProject = async (category: string, projectTitle: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('title', projectTitle);

    if (error) {
      toast.error("Failed to remove project");
      console.error('Error removing project:', error);
      return;
    }

    await fetchProjects();
    toast.success(`Removed ${projectTitle} from projects`);
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setNewProject({
        ...newProject,
        skills: [...newProject.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setNewProject({
      ...newProject,
      skills: newProject.skills.filter((s) => s !== skill),
    });
  };

  const toggleShowAll = (category: string) => {
    setShowAll(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleCard = (projectId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'cloud': return Cloud;
      case 'devsecops': return Container;
      case 'ai': return Brain;
      default: return Target;
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
            <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">
              Projects
            </h2>
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

            {Object.entries(projects).map(([key, projectList]) => {
              const CategoryIcon = getCategoryIcon(key);
              const displayedProjects = showAll[key] ? projectList.filter(p => p.id) : projectList.filter(p => p.id).slice(0, 6);
              const totalCount = projectList.filter(p => p.id).length;
              
              return (
              <TabsContent key={key} value={key} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {displayedProjects.map((project, index) => {
                    const isExpanded = expandedCards.has(project.id!);
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="group relative"
                      >
                        <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]">
                          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                          
                          <div className="p-6 space-y-4">
                            {/* Icon and Edit Controls */}
                            <div className="flex items-start justify-between">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <CategoryIcon className="w-6 h-6 text-primary" />
                              </div>
                              
                              {isOwner && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingProject(project.title);
                                      setNewProject(project);
                                      setProjectCategory(key);
                                      setIsAddDialogOpen(true);
                                    }}
                                    className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg p-1.5 transition-colors"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveProject(key, project.title)}
                                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg p-1.5 transition-colors"
                                    title="Delete"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                              <h4 className="text-xl font-bold text-foreground leading-tight">
                                {project.title}
                              </h4>
                              <p className="text-xs text-muted-foreground font-mono">
                                {project.startMonth} - {project.endMonth}
                              </p>
                            </div>

                            {/* One-line description */}
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {project.description}
                            </p>

                            {/* Expand button for details */}
                            <button
                              onClick={() => toggleCard(project.id!)}
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                              {isExpanded ? 'Hide details' : 'Show details'}
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Expandable details panel */}
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 pt-3 border-t border-border/30"
                              >
                                {/* Full description */}
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {project.description}
                                </p>
                                
                                {/* Tech tags */}
                                {project.skills && project.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {project.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground border border-border/50 font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}

                            {/* GitHub link */}
                            {project.github && (
                              <div className="pt-2">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="w-full gap-2"
                                >
                                  <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackProjectClick(project.title, project.github)}
                                  >
                                    <Github className="w-4 h-4" />
                                    View Source
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                </div>

                {/* Show All / Show Less Button */}
                {totalCount > 6 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => toggleShowAll(key)}
                      variant="outline"
                      className="gap-2"
                    >
                      {showAll[key] ? (
                        <>
                          Show less
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </>
                      ) : (
                        <>
                          Show all {totalCount} projects
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Add Project Button - Owner Only */}
                {isOwner && activeTab === key && (
                  <div className="mt-8">
                    <div className="max-w-5xl mx-auto">
                      <Dialog open={isAddDialogOpen && activeTab === key} onOpenChange={(open) => {
                          setIsAddDialogOpen(open);
                          if (!open) {
                            setEditingProject(null);
                            setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                            setSkillInput("");
                            setProjectCategory(key);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <button 
                              onClick={() => {
                                setEditingProject(null);
                                setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                                setSkillInput("");
                                setProjectCategory(key);
                                setIsAddDialogOpen(true);
                              }}
                              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[400px] group hover:bg-primary/5 transition-all duration-300"
                            >
                              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Plus className="w-7 h-7 text-primary" />
                              </div>
                              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                Add New Project
                              </span>
                            </button>
                          </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingProject ? 'Edit' : 'Add New'} {PROJECT_CATEGORIES.find(c => c.id === projectCategory)?.label || 'Project'} Project</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Project Title</label>
                            <Input
                              placeholder="e.g., Web Application Firewall"
                              value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={projectCategory} onValueChange={setProjectCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROJECT_CATEGORIES.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Project Type</label>
                            <Select value={newProject.type} onValueChange={(val) => setNewProject({ ...newProject, type: val })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Personal">Personal Project</SelectItem>
                                <SelectItem value="Purdue">Purdue Project</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              placeholder="Brief description of your project..."
                              value={newProject.description}
                              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Start Month</label>
                              <Input
                                placeholder="e.g., Jan 2024"
                                value={newProject.startMonth}
                                onChange={(e) => setNewProject({ ...newProject, startMonth: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium">End Month</label>
                              <Input
                                placeholder="e.g., Present"
                                value={newProject.endMonth}
                                onChange={(e) => setNewProject({ ...newProject, endMonth: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">GitHub Repository</label>
                              {isScanningSkills && (
                                <span className="text-xs text-primary flex items-center gap-1.5 animate-pulse">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Scanning repo for top skills...
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://github.com/username/repo"
                                value={newProject.github}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewProject({ ...newProject, github: val });
                                  // Auto-scan if user pastes a full valid GitHub URL and skills are empty
                                  if (parseGitHubUrl(val) && newProject.skills.length === 0 && !isScanningSkills) {
                                    handleScanGitHubSkills(val);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleScanGitHubSkills(newProject.github)}
                                disabled={isScanningSkills || !newProject.github}
                                className="flex-shrink-0 border-primary/30 hover:border-primary/60 hover:bg-primary/10 gap-1.5"
                                title="Scan GitHub repository for top 5 skills"
                              >
                                {isScanningSkills ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-xs font-semibold">Auto-detect Skills</span>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Skills/Technologies</label>
                              {newProject.github && (
                                <button
                                  type="button"
                                  onClick={() => handleScanGitHubSkills(newProject.github)}
                                  disabled={isScanningSkills}
                                  className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 font-medium"
                                  title="Rescan GitHub repo for top skills"
                                >
                                  {isScanningSkills ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Scanning...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      <span>Auto-fill from GitHub</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a skill..."
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                              />
                              <Button type="button" onClick={handleAddSkill} size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newProject.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="gap-1">
                                  {skill}
                                  <button onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingProject(null);
                      setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                      setSkillInput("");
                    }} disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddProject}
                      disabled={!newProject.title || !newProject.description || isUpdating}
                      type="button"
                    >
                      {isUpdating ? 'Updating...' : (editingProject ? 'Update' : 'Add')} Project
                    </Button>
                  </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
