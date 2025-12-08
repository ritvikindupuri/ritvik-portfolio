import { useState, useEffect } from "react";
import { Brain, Plus, Github, ExternalLink, FileText, X, GripVertical, MoreVertical, ChevronDown, Database, Cpu, Eye, MessageSquare, Sparkles, Clock, Search, Layers } from "lucide-react";
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

interface MLShowcaseProps {
  isOwner: boolean;
}

interface MLModel {
  id: string;
  title: string;
  description: string;
  model_type: string | null;
  framework: string | null;
  dataset: string | null;
  metrics: Record<string, string>;
  github_url: string | null;
  demo_url: string | null;
  paper_url: string | null;
  image_url: string | null;
  technologies: string[];
  display_order: number;
}

interface SortableModelCardProps {
  model: MLModel;
  isOwner: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

const modelTypes = [
  "Classification",
  "Regression",
  "NLP",
  "Computer Vision",
  "Reinforcement Learning",
  "Generative AI",
  "Time Series",
  "Clustering",
  "Anomaly Detection",
  "Embedding Classifier",
  "Reconstruction Autoencoder",
  "Other"
];

const frameworks = [
  "PyTorch",
  "TensorFlow",
  "scikit-learn",
  "Keras",
  "JAX",
  "Hugging Face",
  "OpenCV",
  "spaCy",
  "XGBoost",
  "LightGBM",
  "Other"
];

const SortableModelCard = ({ model, isOwner, onEdit, onRemove }: SortableModelCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: model.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const shouldShowMore = model.description.length > 120;
  const displayDescription = isExpanded ? model.description : model.description.slice(0, 120);

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]">
        {/* Subtle top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        
        <div className="p-6 space-y-5">
          {/* Top row: Model type + Framework + Owner controls */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">{model.model_type || "ML Model"}</span>
              {model.framework && <span className="mx-2 text-border">·</span>}
              {model.framework && <span>{model.framework}</span>}
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
            {model.title}
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
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
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

          {/* Dataset */}
          {model.dataset && (
            <div className="bg-secondary/20 rounded-lg px-3 py-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                <Database className="w-3 h-3 text-primary/70" />
                Training Data
              </p>
              <p className="text-xs text-foreground/80">{model.dataset}</p>
            </div>
          )}

          {/* Metrics - Sleek horizontal layout */}
          {model.metrics && Object.keys(model.metrics).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(model.metrics).map(([key, value]) => (
                <div key={key} className="relative overflow-hidden rounded-lg bg-secondary/30 p-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{key}</p>
                  <p className="text-lg font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Technologies */}
          {model.technologies && model.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {model.technologies.map((tech, i) => (
                <span 
                  key={i} 
                  className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground border border-border/50 font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Links - Bottom row */}
          {(model.github_url || model.demo_url || model.paper_url) && (
            <div className="flex gap-4 pt-4 border-t border-border/20">
              {model.github_url && (
                <a
                  href={model.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Code
                </a>
              )}
              {model.demo_url && (
                <a
                  href={model.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Demo
                </a>
              )}
              {model.paper_url && (
                <a
                  href={model.paper_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Paper
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const MLShowcase = ({ isOwner }: MLShowcaseProps) => {
  const [models, setModels] = useState<MLModel[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<MLModel | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    model_type: "",
    model_type_custom: "",
    framework: "",
    framework_custom: "",
    dataset: "",
    metrics: {} as Record<string, string>,
    github_url: "",
    demo_url: "",
    paper_url: "",
    technologies: [] as string[],
  });

  const [newMetricKey, setNewMetricKey] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");
  const [newTech, setNewTech] = useState("");

  useEffect(() => {
    fetchModels();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchModels = async () => {
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching ML models:', error);
      return;
    }

    if (data) {
      setModels(data.map(m => ({
        ...m,
        metrics: (m.metrics as Record<string, string>) || {},
        technologies: m.technologies || []
      })));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = models.findIndex(m => m.id === active.id);
    const newIndex = models.findIndex(m => m.id === over.id);

    const newModels = arrayMove(models, oldIndex, newIndex);
    setModels(newModels);

    try {
      const updates = newModels.map((model, index) =>
        supabase.from('ml_models').update({ display_order: index }).eq('id', model.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to save order');
      fetchModels();
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;

    // Validate custom fields when "Other" is selected
    if (formData.model_type === "Other" && !formData.model_type_custom.trim()) {
      toast.error("Please specify the model type");
      return;
    }
    if (formData.framework === "Other" && !formData.framework_custom.trim()) {
      toast.error("Please specify the framework");
      return;
    }

    setIsUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Use custom values when "Other" is selected
      const finalModelType = formData.model_type === "Other" 
        ? formData.model_type_custom 
        : formData.model_type;
      const finalFramework = formData.framework === "Other" 
        ? formData.framework_custom 
        : formData.framework;

      const modelData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        model_type: finalModelType || null,
        framework: finalFramework || null,
        dataset: formData.dataset || null,
        metrics: formData.metrics,
        github_url: formData.github_url || null,
        demo_url: formData.demo_url || null,
        paper_url: formData.paper_url || null,
        technologies: formData.technologies,
      };

      if (editingModel) {
        const { error } = await supabase
          .from('ml_models')
          .update(modelData)
          .eq('id', editingModel.id);

        if (error) throw error;
        toast.success("Model updated successfully");
      } else {
        const { error } = await supabase
          .from('ml_models')
          .insert({ ...modelData, display_order: models.length });

        if (error) throw error;
        toast.success("Model added successfully");
      }

      await fetchModels();
      resetForm();
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error("Failed to save model");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('ml_models')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to remove model");
      return;
    }

    setModels(models.filter(m => m.id !== id));
    toast.success("Model removed");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      model_type: "",
      model_type_custom: "",
      framework: "",
      framework_custom: "",
      dataset: "",
      metrics: {},
      github_url: "",
      demo_url: "",
      paper_url: "",
      technologies: [],
    });
    setEditingModel(null);
    setIsAddDialogOpen(false);
    setNewMetricKey("");
    setNewMetricValue("");
    setNewTech("");
  };

  const addMetric = () => {
    if (newMetricKey && newMetricValue) {
      setFormData({
        ...formData,
        metrics: { ...formData.metrics, [newMetricKey]: newMetricValue }
      });
      setNewMetricKey("");
      setNewMetricValue("");
    }
  };

  const removeMetric = (key: string) => {
    const { [key]: _, ...rest } = formData.metrics;
    setFormData({ ...formData, metrics: rest });
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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3 shadow-cyan">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural">
          ML Models
        </h3>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
          End-to-end machine learning from data to deployment
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={models.map(m => m.id)} strategy={rectSortingStrategy}>
          <div className="space-y-6">
              {models.map((model) => (
                <SortableModelCard
                  key={model.id}
                  model={model}
                  isOwner={isOwner}
                  onEdit={() => {
                    setEditingModel(model);
                    // Check if stored values are custom (not in predefined lists)
                    const isCustomModelType = model.model_type && !modelTypes.includes(model.model_type);
                    const isCustomFramework = model.framework && !frameworks.includes(model.framework);
                    
                    setFormData({
                      title: model.title,
                      description: model.description,
                      model_type: isCustomModelType ? "Other" : (model.model_type || ""),
                      model_type_custom: isCustomModelType ? model.model_type : "",
                      framework: isCustomFramework ? "Other" : (model.framework || ""),
                      framework_custom: isCustomFramework ? model.framework : "",
                      dataset: model.dataset || "",
                      metrics: model.metrics || {},
                      github_url: model.github_url || "",
                      demo_url: model.demo_url || "",
                      paper_url: model.paper_url || "",
                      technologies: model.technologies || [],
                    });
                    setIsAddDialogOpen(true);
                  }}
                  onRemove={() => handleRemove(model.id)}
                />
              ))}

              {/* Add Model Card - Owner Only */}
              {isOwner && (
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <button className="border-2 border-dashed border-border hover:border-accent/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[300px] group hover:bg-accent/5 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <Plus className="w-8 h-8 text-accent" />
                      </div>
                      <span className="text-lg font-medium text-muted-foreground group-hover:text-accent transition-colors">
                        Add ML Model
                      </span>
                    </button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingModel ? 'Edit' : 'Add'} ML Model</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title *</label>
                          <Input
                            placeholder="e.g., Sentiment Analysis Model"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Model Type</label>
                          <Select value={formData.model_type} onValueChange={(val) => setFormData({ ...formData, model_type: val, model_type_custom: val === "Other" ? formData.model_type_custom : "" })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Custom model type input */}
                      {formData.model_type === "Other" && (
                        <Input
                          placeholder="Specify model type *"
                          value={formData.model_type_custom}
                          onChange={(e) => setFormData({ ...formData, model_type_custom: e.target.value })}
                          className="border-primary/50"
                        />
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description *</label>
                        <Textarea
                          placeholder="Describe what this model does..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Framework</label>
                          <Select value={formData.framework} onValueChange={(val) => setFormData({ ...formData, framework: val, framework_custom: val === "Other" ? formData.framework_custom : "" })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select framework" />
                            </SelectTrigger>
                            <SelectContent>
                              {frameworks.map(fw => (
                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Dataset</label>
                          <Input
                            placeholder="e.g., MNIST, Custom Dataset"
                            value={formData.dataset}
                            onChange={(e) => setFormData({ ...formData, dataset: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Custom framework input */}
                      {formData.framework === "Other" && (
                        <Input
                          placeholder="Specify framework *"
                          value={formData.framework_custom}
                          onChange={(e) => setFormData({ ...formData, framework_custom: e.target.value })}
                          className="border-primary/50"
                        />
                      )}

                      {/* Metrics */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Performance Metrics</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Metric name (e.g., Accuracy)"
                            value={newMetricKey}
                            onChange={(e) => setNewMetricKey(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value (e.g., 95%)"
                            value={newMetricValue}
                            onChange={(e) => setNewMetricValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" onClick={addMetric}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(formData.metrics).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                              {key}: {value}
                              <X className="w-3 h-3 cursor-pointer" onClick={() => removeMetric(key)} />
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Technologies */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Technologies Used</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Python, CUDA"
                            value={newTech}
                            onChange={(e) => setNewTech(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                          />
                          <Button type="button" variant="outline" onClick={addTechnology}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.technologies.map((tech) => (
                            <span key={tech} className="inline-flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded text-sm">
                              {tech}
                              <X className="w-3 h-3 cursor-pointer" onClick={() => removeTechnology(tech)} />
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">GitHub URL</label>
                          <Input
                            placeholder="https://github.com/..."
                            value={formData.github_url}
                            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Demo URL</label>
                          <Input
                            placeholder="https://..."
                            value={formData.demo_url}
                            onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Paper URL</label>
                          <Input
                            placeholder="https://arxiv.org/..."
                            value={formData.paper_url}
                            onChange={(e) => setFormData({ ...formData, paper_url: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetForm}>Cancel</Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!formData.title || !formData.description || isUpdating}
                      >
                        {isUpdating ? 'Saving...' : (editingModel ? 'Update' : 'Add')} Model
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
          </div>
        </SortableContext>
      </DndContext>

      {models.length === 0 && !isOwner && (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>ML models coming soon</p>
        </div>
      )}
    </div>
  );
};
