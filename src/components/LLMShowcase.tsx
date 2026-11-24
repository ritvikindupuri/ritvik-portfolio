import { useState, useEffect } from "react";
import { Sparkles, Plus, Github, ExternalLink, FileText, X, GripVertical, MoreVertical, ChevronDown, MessageSquare, Zap, Bot, Workflow, ChevronRight, Layers, GitBranch, Network, Database, Cloud, Radar, ShieldCheck, Crosshair, Eye, Boxes, Bug, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LLMShowcaseProps {
  isOwner: boolean;
}

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

interface SortableLLMCardProps {
  project: LLMProject;
  isOwner: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

const projectTypes = [
  "RAG System",
  "AI Agent",
  "Chatbot",
  "Prompt Engineering",
  "Fine-tuning",
  "Embeddings Pipeline",
  "LLM Integration",
  "Agentic Workflow",
  "Multi-Agent System",
  "Tool-Use Agent",
  "Multimodal AI Application",
  "Knowledge Graph",
  "Other"
];

const llmProviders = [
  "OpenAI",
  "Anthropic",
  "Google AI",
  "Cohere",
  "Hugging Face",
  "LangChain",
  "LlamaIndex",
  "Local/Open Source",
  "Multiple",
  "Other"
];

const useCases = [
  "Cybersecurity Threat Modeling",
  "Automated Penetration Testing",
  "Multi-Agent Security Analysis",
  "Document Q&A",
  "Code Assistant",
  "Data Analysis",
  "Content Generation",
  "Task Automation",
  "Knowledge Base",
  "Workflow Orchestration",
  "Other"
];

const SortableLLMCard = ({ project, isOwner, onEdit, onRemove }: SortableLLMCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const shouldShowMore = project.description.length > 120;
  const displayDescription = isExpanded ? project.description : project.description.slice(0, 120);

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden hover:border-accent/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        {/* Subtle top accent line - purple for LLM */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        
        <div className="p-6 space-y-5">
          {/* Top row: Project type + Provider + Owner controls */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-accent font-semibold">{project.project_type || "LLM Project"}</span>
              {project.llm_provider && <span className="mx-2 text-border">·</span>}
              {project.llm_provider && <span>{project.llm_provider}</span>}
            </p>
            
            {isOwner && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  {...attributes}
                  {...listeners}
                  className="bg-secondary/50 rounded-lg p-1.5 cursor-grab active:cursor-grabbing hover:bg-secondary"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-secondary/50 hover:bg-secondary rounded-lg p-1.5">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border-border z-50" align="end">
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRemove} className="cursor-pointer text-destructive focus:text-destructive">
                      <X className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground leading-snug tracking-tight">
            {project.title}
          </h3>
          
          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayDescription}
              {shouldShowMore && !isExpanded && "..."}
            </p>
            {shouldShowMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
              >
                {isExpanded ? "Less" : "More"}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
              </button>
            )}
          </div>

          {/* Use Case */}
          {project.use_case && (
            <div className="bg-accent/10 rounded-lg px-3 py-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-accent/70" />
                Use Case
              </p>
              <p className="text-xs text-foreground/80">{project.use_case}</p>
            </div>
          )}

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech, i) => (
                <span 
                  key={i} 
                  className="text-[11px] px-2.5 py-1 rounded-full bg-accent/10 text-accent/80 border border-accent/20 font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Links - Bottom row */}
          {(project.github_url || project.demo_url || project.documentation_url) && (
            <div className="flex gap-4 pt-4 border-t border-border/20">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Code
                </a>
              )}
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Demo
                </a>
              )}
              {project.documentation_url && (
                <a
                  href={project.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Docs
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const LLMShowcase = ({ isOwner }: LLMShowcaseProps) => {
  const [projects, setProjects] = useState<LLMProject[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LLMProject | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Get unique project types for filter
  const categories = ["all", ...new Set(projects.map(p => p.project_type).filter(Boolean))] as string[];
  
  // Filter projects by selected category
  const filteredProjects = selectedCategory === "all" 
    ? projects 
    : projects.filter(p => p.project_type === selectedCategory);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_type: "",
    project_type_custom: "",
    llm_provider: "",
    llm_provider_custom: "",
    use_case: "",
    use_case_custom: "",
    github_url: "",
    demo_url: "",
    documentation_url: "",
    technologies: [] as string[],
  });

  const [newTech, setNewTech] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  // Auto-select first project when projects load
  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects]);

  // Auto-advance spotlight every 6s unless hovering
  useEffect(() => {
    if (isHovering || filteredProjects.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedProjectId(current => {
        const currentIndex = filteredProjects.findIndex(p => p.id === current);
        const nextIndex = (currentIndex + 1) % filteredProjects.length;
        return filteredProjects[nextIndex].id;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isHovering, filteredProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('llm_projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching LLM projects:', error);
      return;
    }

    if (data) {
      // Filter out internal chatbot project (migration pending on live DB)
      const filteredData = data.filter(p => 
        p.id !== 'nvgfgoykyeouwrksszpb' && 
        p.title !== 'Semantic RAG Portfolio Chatbot'
      );
      
      setProjects(filteredData.map(p => ({
        ...p,
        technologies: p.technologies || []
      })));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex(p => p.id === active.id);
    const newIndex = projects.findIndex(p => p.id === over.id);

    const newProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(newProjects);

    try {
      const updates = newProjects.map((project, index) =>
        supabase.from('llm_projects').update({ display_order: index }).eq('id', project.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to save order');
      fetchProjects();
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;

    // Validate custom fields when "Other" or "Multiple" is selected
    if ((formData.project_type === "Other") && !formData.project_type_custom.trim()) {
      toast.error("Please specify the project type");
      return;
    }
    if ((formData.llm_provider === "Other" || formData.llm_provider === "Multiple") && !formData.llm_provider_custom.trim()) {
      toast.error("Please specify the LLM provider(s)");
      return;
    }
    if ((formData.use_case === "Other") && !formData.use_case_custom.trim()) {
      toast.error("Please specify the use case");
      return;
    }

    setIsUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Use custom values when "Other" or "Multiple" is selected
      const finalProjectType = formData.project_type === "Other" 
        ? formData.project_type_custom 
        : formData.project_type;
      const finalLLMProvider = (formData.llm_provider === "Other" || formData.llm_provider === "Multiple")
        ? formData.llm_provider_custom 
        : formData.llm_provider;
      const finalUseCase = formData.use_case === "Other" 
        ? formData.use_case_custom 
        : formData.use_case;

      const projectData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        project_type: finalProjectType || null,
        llm_provider: finalLLMProvider || null,
        use_case: finalUseCase || null,
        github_url: formData.github_url || null,
        demo_url: formData.demo_url || null,
        documentation_url: formData.documentation_url || null,
        technologies: formData.technologies,
      };

      if (editingProject) {
        const { error } = await supabase
          .from('llm_projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success("Project updated successfully");
      } else {
        const { error } = await supabase
          .from('llm_projects')
          .insert({ ...projectData, display_order: projects.length });

        if (error) throw error;
        toast.success("Project added successfully");
      }

      await fetchProjects();
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Failed to save project");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('llm_projects')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to remove project");
      return;
    }

    setProjects(projects.filter(p => p.id !== id));
    toast.success("Project removed");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project_type: "",
      project_type_custom: "",
      llm_provider: "",
      llm_provider_custom: "",
      use_case: "",
      use_case_custom: "",
      github_url: "",
      demo_url: "",
      documentation_url: "",
      technologies: [],
    });
    setEditingProject(null);
    setIsAddDialogOpen(false);
    setNewTech("");
  };

  const addTechnology = () => {
    if (newTech && !formData.technologies.includes(newTech)) {
      setFormData({ ...formData, technologies: [...formData.technologies, newTech] });
      setNewTech("");
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData({ ...formData, technologies: formData.technologies.filter(t => t !== tech) });
  };

  const getProjectIcon = (project: LLMProject) => {
    const text = `${project.title} ${project.use_case || ''} ${project.description}`.toLowerCase();
    if (text.includes('cloud')) return Cloud;
    if (text.includes('intrusion') || text.includes('detection')) return Radar;
    if (text.includes('firewall') || text.includes('containment')) return ShieldCheck;
    if (text.includes('pentest') || text.includes('assessment')) return Crosshair;
    if (text.includes('threat intel')) return Eye;
    if (text.includes('orchestrator') || text.includes('falcon')) return Workflow;
    if (text.includes('kubernetes') || text.includes('karma')) return Boxes;
    if (text.includes('bot traffic') || text.includes('chaff')) return Bug;
    if (text.includes('graph') || text.includes('traceveil')) return Network;
    if (text.includes('aegis')) return Shield;
    return Sparkles;
  };

  const accentPalette = ['cyan', 'violet', 'emerald', 'amber', 'rose', 'sky', 'fuchsia', 'lime'];
  
  const getProjectAccent = (index: number) => {
    const color = accentPalette[index % accentPalette.length];
    const colorMap: Record<string, any> = {
      cyan: { 
        from: 'from-cyan-500', to: 'to-cyan-600', 
        bg: 'bg-cyan-500/20', border: 'border-cyan-500/50',
        text: 'text-cyan-400', glow: 'shadow-cyan-500/50',
        dot: 'bg-cyan-500'
      },
      violet: { 
        from: 'from-violet-500', to: 'to-violet-600', 
        bg: 'bg-violet-500/20', border: 'border-violet-500/50',
        text: 'text-violet-400', glow: 'shadow-violet-500/50',
        dot: 'bg-violet-500'
      },
      emerald: { 
        from: 'from-emerald-500', to: 'to-emerald-600', 
        bg: 'bg-emerald-500/20', border: 'border-emerald-500/50',
        text: 'text-emerald-400', glow: 'shadow-emerald-500/50',
        dot: 'bg-emerald-500'
      },
      amber: { 
        from: 'from-amber-500', to: 'to-amber-600', 
        bg: 'bg-amber-500/20', border: 'border-amber-500/50',
        text: 'text-amber-400', glow: 'shadow-amber-500/50',
        dot: 'bg-amber-500'
      },
      rose: { 
        from: 'from-rose-500', to: 'to-rose-600', 
        bg: 'bg-rose-500/20', border: 'border-rose-500/50',
        text: 'text-rose-400', glow: 'shadow-rose-500/50',
        dot: 'bg-rose-500'
      },
      sky: { 
        from: 'from-sky-500', to: 'to-sky-600', 
        bg: 'bg-sky-500/20', border: 'border-sky-500/50',
        text: 'text-sky-400', glow: 'shadow-sky-500/50',
        dot: 'bg-sky-500'
      },
      fuchsia: { 
        from: 'from-fuchsia-500', to: 'to-fuchsia-600', 
        bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50',
        text: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/50',
        dot: 'bg-fuchsia-500'
      },
      lime: { 
        from: 'from-lime-500', to: 'to-lime-600', 
        bg: 'bg-lime-500/20', border: 'border-lime-500/50',
        text: 'text-lime-400', glow: 'shadow-lime-500/50',
        dot: 'bg-lime-500'
      },
    };
    return colorMap[color];
  };

  const selectedProject = filteredProjects.find(p => p.id === selectedProjectId) || filteredProjects[0];
  const selectedIndex = filteredProjects.findIndex(p => p.id === selectedProjectId);
  const selectedAccent = selectedProject ? getProjectAccent(selectedIndex) : getProjectAccent(0);
  const SelectedIcon = selectedProject ? getProjectIcon(selectedProject) : Sparkles;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-3 shadow-purple">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural pb-1">
          Agentic Security Systems
        </h3>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
          Autonomous agents for cloud defense, detection & red teaming
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-accent to-neural-pink mx-auto rounded-full mt-4" />
      </div>

      {/* Category Filter - Segmented Pill Control */}
      {categories.length > 2 && (
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/40 shadow-lg">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                }}
                className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-accent/90 to-primary/90 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Spotlight Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 max-w-7xl mx-auto">
        {/* Left: Project List */}
        <div className="hidden lg:block space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {filteredProjects.map((project, index) => {
            const ProjectIcon = getProjectIcon(project);
            const accent = getProjectAccent(index);
            const isSelected = selectedProjectId === project.id;
            
            return (
              <motion.button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProjectId(project.id);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left w-full ${
                  isSelected 
                    ? `${accent.bg} ${accent.border} border backdrop-blur-sm` 
                    : 'hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${accent.bg} ${accent.border} border flex-shrink-0 flex items-center justify-center`}>
                  <ProjectIcon className={`w-5 h-5 ${accent.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {project.title}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${accent.dot} ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
              </motion.button>
            );
          })}
        </div>

        {/* Mobile: Horizontal Swipeable Chips */}
        <div className="lg:hidden overflow-x-auto pb-3">
          <div className="flex gap-2 min-w-min px-1">
            {filteredProjects.map((project, index) => {
              const ProjectIcon = getProjectIcon(project);
              const accent = getProjectAccent(index);
              const isSelected = selectedProjectId === project.id;
              
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                    isSelected
                      ? `${accent.bg} ${accent.border} border ${accent.text}`
                      : 'bg-secondary/50 text-muted-foreground border border-transparent'
                  }`}
                >
                  <ProjectIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{project.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Showcase Panel */}
        {selectedProject && (
          <motion.div
            key={selectedProjectId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setCursorPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }}
          >
            <div className={`relative min-h-[500px] rounded-3xl overflow-hidden backdrop-blur-sm border-2 ${selectedAccent.border} ${selectedAccent.glow} shadow-2xl transition-all duration-500`}>
              {/* Animated gradient mesh background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedAccent.from}/20 ${selectedAccent.to}/20 opacity-60`} />
              <div 
                className={`absolute inset-0 bg-gradient-radial ${selectedAccent.from}/30 ${selectedAccent.to}/30 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                style={{
                  background: `radial-gradient(circle 300px at ${cursorPosition.x}px ${cursorPosition.y}px, currentColor, transparent)`,
                }}
              />
              
              {/* Noise/grid texture */}
              <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              
              {/* Content */}
              <div className="relative z-10 p-8 md:p-12 space-y-6">
                {/* Owner Controls */}
                {isOwner && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProject(selectedProject);
                        const isCustomProjectType = selectedProject.project_type && !projectTypes.includes(selectedProject.project_type);
                        const isCustomProvider = selectedProject.llm_provider && !llmProviders.includes(selectedProject.llm_provider);
                        const isCustomUseCase = selectedProject.use_case && !useCases.includes(selectedProject.use_case);
                        
                        setFormData({
                          title: selectedProject.title,
                          description: selectedProject.description,
                          project_type: isCustomProjectType ? "Other" : (selectedProject.project_type || ""),
                          project_type_custom: isCustomProjectType ? selectedProject.project_type : "",
                          llm_provider: isCustomProvider ? "Other" : (selectedProject.llm_provider || ""),
                          llm_provider_custom: isCustomProvider ? selectedProject.llm_provider : "",
                          use_case: isCustomUseCase ? "Other" : (selectedProject.use_case || ""),
                          use_case_custom: isCustomUseCase ? selectedProject.use_case : "",
                          github_url: selectedProject.github_url || "",
                          demo_url: selectedProject.demo_url || "",
                          documentation_url: selectedProject.documentation_url || "",
                          technologies: selectedProject.technologies || [],
                        });
                        setIsAddDialogOpen(true);
                      }}
                      className="bg-background/90 hover:bg-background backdrop-blur-sm text-foreground rounded-lg p-2 transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button
                      onClick={() => handleRemove(selectedProject.id)}
                      className="bg-background/90 hover:bg-destructive backdrop-blur-sm text-destructive hover:text-white rounded-lg p-2 transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Large Icon */}
                <div className={`w-20 h-20 rounded-2xl ${selectedAccent.bg} ${selectedAccent.border} border-2 flex items-center justify-center backdrop-blur-sm`}>
                  <SelectedIcon className={`w-10 h-10 ${selectedAccent.text}`} />
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <h4 className={`text-3xl md:text-4xl font-bold leading-tight ${selectedAccent.text}`}>
                    {selectedProject.title}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.project_type && (
                      <span className={`inline-block text-xs px-3 py-1.5 rounded-full ${selectedAccent.bg} ${selectedAccent.text} ${selectedAccent.border} border font-medium`}>
                        {selectedProject.project_type}
                      </span>
                    )}
                    {selectedProject.llm_provider && (
                      <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-secondary/80 text-muted-foreground border border-border font-medium backdrop-blur-sm">
                        {selectedProject.llm_provider}
                      </span>
                    )}
                  </div>
                </div>

                {/* Impact Description */}
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed max-w-2xl">
                  {selectedProject.description}
                </p>

                {/* Use Case */}
                {selectedProject.use_case && (
                  <div className={`${selectedAccent.bg} backdrop-blur-sm rounded-xl p-4 border ${selectedAccent.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`w-4 h-4 ${selectedAccent.text}`} />
                      <h5 className={`text-sm font-semibold ${selectedAccent.text}`}>Use Case</h5>
                    </div>
                    <p className="text-sm text-foreground/80">{selectedProject.use_case}</p>
                  </div>
                )}

                {/* Technologies */}
                {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 backdrop-blur-sm text-foreground border border-border font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Gradient-filled Buttons */}
                {(selectedProject.github_url || selectedProject.demo_url) && (
                  <div className="flex gap-3 pt-4">
                    {selectedProject.github_url && (
                      <Button
                        asChild
                        size="lg"
                        className={`bg-gradient-to-r ${selectedAccent.from} ${selectedAccent.to} hover:opacity-90 text-white border-0 shadow-lg ${selectedAccent.glow} transition-all duration-300`}
                      >
                        <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-5 h-5 mr-2" />
                          Source Code
                        </a>
                      </Button>
                    )}
                    {selectedProject.demo_url && (
                      <Button
                        asChild
                        size="lg"
                        className={`bg-gradient-to-r ${selectedAccent.from} ${selectedAccent.to} hover:opacity-90 text-white border-0 shadow-lg ${selectedAccent.glow} transition-all duration-300`}
                      >
                        <a href={selectedProject.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Live Demo
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>


      {projects.length === 0 && !isOwner && (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>LLM projects coming soon</p>
        </div>
      )}

      {isOwner && (
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30">
              <Plus className="w-4 h-4 mr-2" />
              Add LLM Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingProject ? "Edit LLM Project" : "Add LLM Project"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Project Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-secondary/50 border-border"
              />
              <Textarea
                placeholder="Project Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary/50 border-border min-h-[100px]"
              />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value, project_type_custom: value === "Other" ? formData.project_type_custom : "" })}>
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="Project Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.llm_provider} onValueChange={(value) => setFormData({ ...formData, llm_provider: value, llm_provider_custom: (value === "Other" || value === "Multiple") ? formData.llm_provider_custom : "" })}>
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="LLM Provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {llmProviders.map((provider) => (
                        <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.use_case} onValueChange={(value) => setFormData({ ...formData, use_case: value, use_case_custom: value === "Other" ? formData.use_case_custom : "" })}>
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="Use Case" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {useCases.map((useCase) => (
                        <SelectItem key={useCase} value={useCase}>{useCase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom input fields for "Other" or "Multiple" selections */}
                {formData.project_type === "Other" && (
                  <Input
                    placeholder="Specify project type *"
                    value={formData.project_type_custom}
                    onChange={(e) => setFormData({ ...formData, project_type_custom: e.target.value })}
                    className="bg-secondary/50 border-border border-accent/50"
                  />
                )}
                {(formData.llm_provider === "Other" || formData.llm_provider === "Multiple") && (
                  <Input
                    placeholder={formData.llm_provider === "Multiple" ? "List the providers (e.g., OpenAI, Anthropic) *" : "Specify LLM provider *"}
                    value={formData.llm_provider_custom}
                    onChange={(e) => setFormData({ ...formData, llm_provider_custom: e.target.value })}
                    className="bg-secondary/50 border-border border-accent/50"
                  />
                )}
                {formData.use_case === "Other" && (
                  <Input
                    placeholder="Specify use case *"
                    value={formData.use_case_custom}
                    onChange={(e) => setFormData({ ...formData, use_case_custom: e.target.value })}
                    className="bg-secondary/50 border-border border-accent/50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add technology (e.g., LangChain, Pinecone)"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    className="bg-secondary/50 border-border"
                  />
                  <Button type="button" onClick={addTechnology} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="gap-1">
                        {tech}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTechnology(tech)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="GitHub URL"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
                <Input
                  placeholder="Demo URL"
                  value={formData.demo_url}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
                <Input
                  placeholder="Documentation URL"
                  value={formData.documentation_url}
                  onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isUpdating || !formData.title || !formData.description}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {isUpdating ? "Saving..." : (editingProject ? "Update Project" : "Add Project")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
