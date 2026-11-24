import { useState, useEffect } from "react";
import { Sparkles, Plus, Github, ExternalLink, FileText, X, GripVertical, MoreVertical, ChevronDown, MessageSquare, Zap, Bot, Workflow, ChevronRight, Layers, GitBranch, Network, Database } from "lucide-react";
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
  const [showAll, setShowAll] = useState(false);
  const [detailsProject, setDetailsProject] = useState<LLMProject | null>(null);

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

  const getCategoryIcon = (projectType: string | null) => {
    switch (projectType) {
      case 'Agentic Workflow': return Workflow;
      case 'Multi-Agent System': return Network;
      case 'Tool-Use Agent': return Bot;
      case 'RAG System': return Database;
      case 'AI Agent': return Sparkles;
      default: return Layers;
    }
  };

  const getCategoryColor = (projectType: string | null) => {
    switch (projectType) {
      case 'Agentic Workflow': return { from: 'from-violet-500/20', to: 'to-purple-500/20', border: 'border-violet-500/30', glow: 'hover:shadow-violet-500/20', text: 'text-violet-400', bg: 'bg-violet-500/10' };
      case 'Multi-Agent System': return { from: 'from-blue-500/20', to: 'to-cyan-500/20', border: 'border-blue-500/30', glow: 'hover:shadow-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'Tool-Use Agent': return { from: 'from-emerald-500/20', to: 'to-teal-500/20', border: 'border-emerald-500/30', glow: 'hover:shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'RAG System': return { from: 'from-amber-500/20', to: 'to-orange-500/20', border: 'border-amber-500/30', glow: 'hover:shadow-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/10' };
      case 'AI Agent': return { from: 'from-pink-500/20', to: 'to-rose-500/20', border: 'border-pink-500/30', glow: 'hover:shadow-pink-500/20', text: 'text-pink-400', bg: 'bg-pink-500/10' };
      default: return { from: 'from-accent/20', to: 'to-primary/20', border: 'border-accent/30', glow: 'hover:shadow-accent/20', text: 'text-accent', bg: 'bg-accent/10' };
    }
  };

  const getBentoSize = (index: number) => {
    // First card is hero (2x2), then mixed sizes
    if (index === 0) return 'md:col-span-2 md:row-span-2';
    // Some 2-wide cards
    if (index % 5 === 1 || index % 7 === 3) return 'md:col-span-2';
    // Rest are 1-wide
    return 'md:col-span-1';
  };

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
        <div className="inline-flex p-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/40 shadow-lg mx-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setShowAll(false);
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
      )}

      {/* Bento-Style Asymmetric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto auto-rows-fr">
        {(showAll ? filteredProjects : filteredProjects.slice(0, 6)).map((project, index) => {
          const CategoryIcon = getCategoryIcon(project.project_type);
          const colors = getCategoryColor(project.project_type);
          const bentoSize = getBentoSize(index);
          const isHero = index === 0;
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`group relative ${bentoSize} cursor-pointer`}
              onClick={() => setDetailsProject(project)}
            >
              <div className={`relative h-full bg-gradient-to-br ${colors.from} ${colors.to} backdrop-blur-md border ${colors.border} rounded-2xl overflow-hidden transition-all duration-500 ${colors.glow} hover:shadow-2xl hover:-translate-y-1`}>
                <div className={`h-1 bg-gradient-to-r ${colors.from} ${colors.to}`} />
                
                <div className={`p-6 space-y-4 h-full flex flex-col ${isHero ? 'justify-center' : ''}`}>
                  {/* Owner Edit Controls */}
                  {isOwner && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          const isCustomProjectType = project.project_type && !projectTypes.includes(project.project_type);
                          const isCustomProvider = project.llm_provider && !llmProviders.includes(project.llm_provider);
                          const isCustomUseCase = project.use_case && !useCases.includes(project.use_case);
                          
                          setFormData({
                            title: project.title,
                            description: project.description,
                            project_type: isCustomProjectType ? "Other" : (project.project_type || ""),
                            project_type_custom: isCustomProjectType ? project.project_type : "",
                            llm_provider: isCustomProvider ? "Other" : (project.llm_provider || ""),
                            llm_provider_custom: isCustomProvider ? project.llm_provider : "",
                            use_case: isCustomUseCase ? "Other" : (project.use_case || ""),
                            use_case_custom: isCustomUseCase ? project.use_case : "",
                            github_url: project.github_url || "",
                            demo_url: project.demo_url || "",
                            documentation_url: project.documentation_url || "",
                            technologies: project.technologies || [],
                          });
                          setIsAddDialogOpen(true);
                        }}
                        className="bg-background/90 hover:bg-background text-foreground rounded-lg p-1.5 transition-colors backdrop-blur-sm"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(project.id);
                        }}
                        className="bg-background/90 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-colors backdrop-blur-sm"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Category Icon - Bigger on hero */}
                  <div className={`${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center ${isHero ? 'w-20 h-20' : 'w-12 h-12'}`}>
                    <CategoryIcon className={`${colors.text} ${isHero ? 'w-10 h-10' : 'w-6 h-6'}`} />
                  </div>

                  {/* Title and Category */}
                  <div className="space-y-2">
                    <h4 className={`font-bold leading-tight ${colors.text} ${isHero ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
                      {project.title}
                    </h4>
                    {project.project_type && (
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border} font-medium`}>
                        {project.project_type}
                      </span>
                    )}
                  </div>

                  {/* Description - 2 lines for regular, impact line for hero */}
                  <p className={`text-muted-foreground leading-relaxed ${isHero ? 'text-base md:text-lg font-medium' : 'text-sm line-clamp-2'}`}>
                    {isHero && project.use_case ? project.use_case : project.description}
                  </p>

                  {/* Links */}
                  {(project.github_url || project.demo_url) && (
                    <div className="flex gap-2 mt-auto pt-4">
                      {project.github_url && (
                        <Button
                          asChild
                          size={isHero ? "default" : "sm"}
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={(e: any) => e.stopPropagation()}
                        >
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                            <Github className="w-4 h-4" />
                            Code
                          </a>
                        </Button>
                      )}
                      {project.demo_url && (
                        <Button
                          asChild
                          size={isHero ? "default" : "sm"}
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={(e: any) => e.stopPropagation()}
                        >
                          <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            Demo
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Project Details Modal */}
      {detailsProject && (
        <Dialog open={!!detailsProject} onOpenChange={() => setDetailsProject(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {(() => {
                  const CategoryIcon = getCategoryIcon(detailsProject.project_type);
                  const colors = getCategoryColor(detailsProject.project_type);
                  return (
                    <>
                      <div className={`${colors.bg} border ${colors.border} rounded-xl p-2`}>
                        <CategoryIcon className={`${colors.text} w-6 h-6`} />
                      </div>
                      <span>{detailsProject.title}</span>
                    </>
                  );
                })()}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Category & Provider */}
              <div className="flex flex-wrap gap-2">
                {detailsProject.project_type && (
                  <span className={`inline-block text-xs px-3 py-1.5 rounded-full ${getCategoryColor(detailsProject.project_type).bg} ${getCategoryColor(detailsProject.project_type).text} border ${getCategoryColor(detailsProject.project_type).border} font-medium`}>
                    {detailsProject.project_type}
                  </span>
                )}
                {detailsProject.llm_provider && (
                  <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border font-medium">
                    {detailsProject.llm_provider}
                  </span>
                )}
              </div>

              {/* Full Description */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailsProject.description}
                </p>
              </div>

              {/* Use Case */}
              {detailsProject.use_case && (
                <div className="bg-accent/10 rounded-lg px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-semibold text-accent">Use Case</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {detailsProject.use_case}
                  </p>
                </div>
              )}

              {/* Technologies */}
              {detailsProject.technologies && detailsProject.technologies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailsProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-foreground border border-border font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(detailsProject.github_url || detailsProject.demo_url || detailsProject.documentation_url) && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  {detailsProject.github_url && (
                    <Button asChild variant="outline" className="flex-1 gap-2">
                      <a href={detailsProject.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4" />
                        Source Code
                      </a>
                    </Button>
                  )}
                  {detailsProject.demo_url && (
                    <Button asChild variant="outline" className="flex-1 gap-2">
                      <a href={detailsProject.demo_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {detailsProject.documentation_url && (
                    <Button asChild variant="outline" className="flex-1 gap-2">
                      <a href={detailsProject.documentation_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4" />
                        Documentation
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Show All / Show Less Button */}
      {filteredProjects.length > 6 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            className="gap-2"
          >
            {showAll ? (
              <>
                Show less
                <ChevronDown className="w-4 h-4 rotate-180" />
              </>
            ) : (
              <>
                Show all {filteredProjects.length} projects
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}

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
