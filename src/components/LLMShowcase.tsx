import { useState, useEffect } from "react";
import { Sparkles, Plus, Github, ExternalLink, FileText, X, GripVertical, MoreVertical, ChevronDown, MessageSquare, Zap, Bot, Workflow } from "lucide-react";
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
      setProjects(data.map(p => ({
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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-3 shadow-purple">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural pb-1">
          AI Engineering
        </h3>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
          LLM integrations, RAG systems & agentic workflows
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-accent to-neural-pink mx-auto rounded-full mt-4" />
      </div>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {category === "all" ? "All Projects" : category}
            </button>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredProjects.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="space-y-6">
            {filteredProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No projects in this category</p>
            ) : filteredProjects.map((project) => (
              <SortableLLMCard
                key={project.id}
                project={project}
                isOwner={isOwner}
                onEdit={() => {
                  setEditingProject(project);
                  // Check if stored values are custom (not in predefined lists)
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
                onRemove={() => handleRemove(project.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
