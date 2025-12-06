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

// Model icon mapping - intelligent based on model type
const ModelTypeIcon = ({ modelType, framework }: { modelType: string | null; framework: string | null }) => {
  const getIconAndColor = () => {
    // Priority: model type first, then framework
    switch (modelType?.toLowerCase()) {
      case "nlp":
        return { icon: <MessageSquare className="w-5 h-5" />, gradient: "from-primary to-data-blue" };
      case "computer vision":
        return { icon: <Eye className="w-5 h-5" />, gradient: "from-accent to-neural-pink" };
      case "classification":
        return { icon: <Layers className="w-5 h-5" />, gradient: "from-neural-pink to-accent" };
      case "anomaly detection":
        return { icon: <Search className="w-5 h-5" />, gradient: "from-primary to-cyber-matrix" };
      case "reinforcement learning":
        return { icon: <Cpu className="w-5 h-5" />, gradient: "from-cyber-matrix to-primary" };
      case "generative ai":
        return { icon: <Sparkles className="w-5 h-5" />, gradient: "from-data-blue to-accent" };
      case "time series":
        return { icon: <Clock className="w-5 h-5" />, gradient: "from-primary to-neural-pink" };
      case "clustering":
        return { icon: <Database className="w-5 h-5" />, gradient: "from-accent to-primary" };
      case "regression":
        return { icon: <Layers className="w-5 h-5" />, gradient: "from-neural-pink to-data-blue" };
      default:
        return { icon: <Brain className="w-5 h-5" />, gradient: "from-primary to-accent" };
    }
  };

  const { icon, gradient } = getIconAndColor();

  return (
    <motion.div
      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}
      animate={{ 
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 4px 20px rgba(0, 255, 255, 0.2)",
          "0 8px 30px rgba(0, 255, 255, 0.4)",
          "0 4px 20px rgba(0, 255, 255, 0.2)"
        ]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {icon}
    </motion.div>
  );
};

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

  const getModelTypeColor = (type: string | null) => {
    switch (type) {
      case "NLP":
        return "bg-primary/20 text-primary border-primary/30";
      case "Computer Vision":
        return "bg-accent/20 text-accent border-accent/30";
      case "Classification":
        return "bg-neural-pink/20 text-neural-pink border-neural-pink/30";
      case "Reinforcement Learning":
        return "bg-cyber-matrix/20 text-cyber-matrix border-cyber-matrix/30";
      case "Generative AI":
        return "bg-data-blue/20 text-data-blue border-data-blue/30";
      case "Anomaly Detection":
        return "bg-primary/20 text-primary border-primary/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const shouldShowMore = model.description.length > 100;
  const displayDescription = isExpanded ? model.description : model.description.slice(0, 100);

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-glow">
        {/* Header with gradient and framework icon */}
        <div className="relative h-28 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent overflow-hidden">
          <div className="absolute inset-0 neural-grid opacity-30" />
          
          {/* Model type icon - top left with animation */}
          <div className="absolute top-3 left-4">
            <ModelTypeIcon modelType={model.model_type} framework={model.framework} />
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <Badge className={`${getModelTypeColor(model.model_type)} border`}>
              {model.model_type || "ML Model"}
            </Badge>
            {model.framework && (
              <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {model.framework}
              </span>
            )}
          </div>
          
          {isOwner && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
              <button
                {...attributes}
                {...listeners}
                className="bg-background/80 backdrop-blur-sm rounded-lg p-1.5 cursor-grab active:cursor-grabbing hover:bg-background"
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-background/80 backdrop-blur-sm hover:bg-background rounded-lg p-1.5">
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

        <div className="p-5 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-foreground leading-tight">{model.title}</h3>
          
          {/* Description with expand/collapse */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayDescription}
              {shouldShowMore && !isExpanded && "..."}
            </p>
            {shouldShowMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {isExpanded ? "Show less" : "More"}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
              </button>
            )}
          </div>

          {/* Dataset - Clean styling */}
          {model.dataset && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
              <Database className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground leading-relaxed">{model.dataset}</span>
            </div>
          )}

          {/* Metrics */}
          {model.metrics && Object.keys(model.metrics).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(model.metrics).map(([key, value]) => (
                <div key={key} className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">{key}: </span>
                  <span className="text-sm font-semibold text-primary">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Technologies */}
          {model.technologies && model.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {model.technologies.map((tech, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-4 pt-2 border-t border-border/30">
            {model.github_url && (
              <a
                href={model.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
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
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
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
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <FileText className="w-4 h-4" />
                Paper
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
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
    framework: "",
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

    setIsUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const modelData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        model_type: formData.model_type || null,
        framework: formData.framework || null,
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
      framework: "",
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
    <section id="ml-showcase" className="py-32 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 neural-grid opacity-5" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 mb-4 shadow-purple">
            <Brain className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-neural">
            ML Model Showcase
          </h2>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            End-to-end machine learning solutions from data to deployment
          </p>
          <div className="w-32 h-1.5 bg-gradient-to-r from-accent to-neural-pink mx-auto rounded-full" />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={models.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models.map((model) => (
                <SortableModelCard
                  key={model.id}
                  model={model}
                  isOwner={isOwner}
                  onEdit={() => {
                    setEditingModel(model);
                    setFormData({
                      title: model.title,
                      description: model.description,
                      model_type: model.model_type || "",
                      framework: model.framework || "",
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
                          <Select value={formData.model_type} onValueChange={(val) => setFormData({ ...formData, model_type: val })}>
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
                          <Select value={formData.framework} onValueChange={(val) => setFormData({ ...formData, framework: val })}>
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
          <div className="text-center py-16">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No ML models to display yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};
