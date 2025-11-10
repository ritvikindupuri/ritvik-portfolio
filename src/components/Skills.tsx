
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Monitor, Globe, Cloud, Lock, Plus, Upload, X, ExternalLink, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SkillsProps {
  isOwner: boolean;
}

const initialSkillCategories = [
  {
    id: "programming",
    label: "Programming Languages",
    icon: Code,
    skills: [] as Skill[],
  },
  {
    id: "os",
    label: "Operating Systems",
    icon: Monitor,
    skills: [] as Skill[],
  },
  {
    id: "web",
    label: "Web Development & AI",
    icon: Globe,
    skills: [] as Skill[],
  },
  {
    id: "cloud",
    label: "Cloud & Development",
    icon: Cloud,
    skills: [] as Skill[],
  },
  {
    id: "security",
    label: "Cybersecurity Tools",
    icon: Lock,
    skills: [] as Skill[],
  },
];

interface Skill {
  id: string;
  name: string;
  level: string;
  logo: string;
  description: string;
  link: string;
  display_order?: number;
}

interface SortableSkillProps {
  skill: Skill;
  categoryId: string;
  isOwner: boolean;
  onEdit: () => void;
  onRemove: () => void;
  getLevelColor: (level: string) => string;
}

const SortableSkill = ({ skill, categoryId, isOwner, onEdit, onRemove, getLevelColor }: SortableSkillProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center shadow-lg">
        {isOwner && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
            <button
              {...attributes}
              {...listeners}
              className="bg-background/80 backdrop-blur-sm rounded-lg p-1.5 cursor-grab active:cursor-grabbing hover:bg-background"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={onEdit}
              className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg p-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button
              onClick={onRemove}
              className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg p-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Logo */}
          <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
            {skill.logo && typeof skill.logo === 'string' && skill.logo.startsWith('data:') ? (
              <img src={skill.logo} alt={skill.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-5xl leading-none">{skill.logo}</span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-xl font-sans text-foreground">
            {skill.name}
          </h3>

          {/* Description */}
          {skill.description && (
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              {skill.description}
            </p>
          )}
          
          {/* Proficiency Badge */}
          <span className={`text-sm font-semibold font-sans px-4 py-1.5 rounded-full ${getLevelColor(skill.level)}`}>
            {skill.level}
          </span>
        </div>
        
        {skill.link && (
          <a
            href={skill.link}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-2 text-xs text-primary hover:text-accent transition-colors font-medium group/link"
          >
            <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            <span>Learn More</span>
          </a>
        )}
      </div>
    </div>
  );
};

export const Skills = ({ isOwner }: SkillsProps) => {
  const [activeTab, setActiveTab] = useState("programming");
  const [skillCategories, setSkillCategories] = useState(initialSkillCategories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{ name: string; category: string } | null>(null);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
  const [uploadedLogo, setUploadedLogo] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching skills:', error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedSkills = initialSkillCategories.map(cat => ({
        ...cat,
        skills: data
          .filter((skill: any) => skill.category === cat.id)
          .map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            level: skill.level ?? "Intermediate",
            logo: skill.icon || "",
            description: skill.description ?? "",
            link: skill.link ?? "",
            display_order: skill.display_order
          }))
      }));
      setSkillCategories(categorizedSkills);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const category = skillCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const oldIndex = category.skills.findIndex(skill => skill.id === active.id);
    const newIndex = category.skills.findIndex(skill => skill.id === over.id);

    const newSkills = arrayMove(category.skills, oldIndex, newIndex);
    
    // Update state immediately for smooth UX
    setSkillCategories(skillCategories.map(cat => 
      cat.id === categoryId ? { ...cat, skills: newSkills } : cat
    ));

    // Update database with new order
    try {
      const updates = newSkills.map((skill, index) => 
        supabase
          .from('skills')
          .update({ display_order: index })
          .eq('id', skill.id)
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating skill order:', error);
      toast.error('Failed to save order');
      fetchSkills(); // Revert on error
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced":
        return "bg-green-500 text-white";
      case "Intermediate":
        return "bg-amber-500 text-white";
      case "Beginner":
        return "bg-blue-500 text-white";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogo(reader.result as string);
        setNewSkill({ ...newSkill, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.logo) return;
    
    setIsUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (editingSkill) {
        // Update existing skill - use ID instead of name for more reliable updates
        const { data: existingSkill } = await supabase
          .from('skills')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', editingSkill.name)
          .eq('category', editingSkill.category)
          .single();

        if (existingSkill) {
          const { error } = await supabase
            .from('skills')
            .update({
              name: newSkill.name,
              icon: newSkill.logo,
              level: newSkill.level,
              description: newSkill.description,
              link: newSkill.link
            })
            .eq('id', existingSkill.id);

          if (error) {
            toast.error("Failed to update skill");
            console.error('Error updating skill:', error);
            return;
          }

          await fetchSkills();
          toast.success("Skill updated successfully");
        }
      } else {
        // Insert new skill
        const { error } = await supabase
          .from('skills')
          .insert({
            user_id: user.id,
            name: newSkill.name,
            category: activeTab,
            icon: newSkill.logo,
            level: newSkill.level,
            description: newSkill.description,
            link: newSkill.link
          });

        if (error) {
          toast.error("Failed to add skill");
          console.error('Error adding skill:', error);
          return;
        }
        
        await fetchSkills();
        toast.success("Skill added successfully");
      }
      
      setNewSkill({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
      setUploadedLogo("");
      setEditingSkill(null);
      setIsAddDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSkill = async (categoryId: string, skillName: string) => {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('name', skillName)
      .eq('category', categoryId);

    if (error) {
      toast.error("Failed to remove skill");
      console.error('Error removing skill:', error);
      return;
    }

    const updatedCategories = skillCategories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, skills: cat.skills.filter((s) => s.name !== skillName) }
        : cat
    );
    setSkillCategories(updatedCategories);
    toast.success(`Removed ${skillName} from skills`);
  };

  return (
    <section id="skills-section" className="py-32 px-4 bg-card/20 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div>
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
              <Code className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Skills & Expertise
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Total Skills: <span className="text-primary font-bold">{skillCategories.reduce((acc, cat) => acc + cat.skills.length, 0)}</span>
            </p>
            <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
              <div className="pb-4">
                <TabsList className="relative z-10 flex flex-wrap w-full justify-center mb-12 bg-transparent h-auto p-0 gap-6 rounded-none shadow-none border-0">
                  {skillCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">{category.label}</span>
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                          {category.skills.length}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

            {skillCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-8">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, category.id)}
                >
                  <SortableContext
                    items={category.skills.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
                      {category.skills.map((skill) => (
                        <SortableSkill
                          key={skill.id}
                          skill={skill}
                          categoryId={category.id}
                          isOwner={isOwner}
                          onEdit={() => {
                            setEditingSkill({ name: skill.name, category: category.id });
                            setNewSkill({
                              name: skill.name,
                              level: skill.level,
                              logo: skill.logo,
                              description: skill.description,
                              link: skill.link
                            });
                            setUploadedLogo(skill.logo);
                            setIsAddDialogOpen(true);
                          }}
                          onRemove={() => handleRemoveSkill(category.id, skill.name)}
                          getLevelColor={getLevelColor}
                        />
                      ))}

                      {/* Add Skill Button - Owner Only */}
                      {isOwner && activeTab === category.id && (
                    <Dialog open={isAddDialogOpen && activeTab === category.id} onOpenChange={(open) => {
                      setIsAddDialogOpen(open);
                      if (!open) {
                        setEditingSkill(null);
                        setNewSkill({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
                        setUploadedLogo("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <button 
                          onClick={() => {
                            setEditingSkill(null);
                            setNewSkill({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
                            setUploadedLogo("");
                            setIsAddDialogOpen(true);
                          }}
                          className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[180px] group hover:bg-primary/5 transition-all duration-300"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            Add New Skill
                          </span>
                          </button>
                        </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingSkill ? 'Edit' : 'Add New'} Skill {editingSkill ? 'in' : 'to'} {category.label}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Skill Name</label>
                            <Input
                              placeholder="e.g., Kubernetes"
                              value={newSkill.name}
                              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Proficiency Level</label>
                            <Select value={newSkill.level} onValueChange={(val) => setNewSkill({ ...newSkill, level: val })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Logo/Icon</label>
                            <div className="flex gap-3">
                               {uploadedLogo && (
                                <div className="w-20 h-20 rounded-lg border-2 border-primary overflow-hidden flex-shrink-0">
                                  <img src={uploadedLogo} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                                  <Upload className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {uploadedLogo ? "Change Logo" : "Upload Logo"}
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                              placeholder="How you use this skill..."
                              value={newSkill.description}
                              onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Project Link (optional)</label>
                            <Input
                              placeholder="https://github.com/username/repo"
                              value={newSkill.link}
                              onChange={(e) => setNewSkill({ ...newSkill, link: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => {
                            setIsAddDialogOpen(false);
                            setEditingSkill(null);
                            setNewSkill({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
                            setUploadedLogo("");
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddSkill} 
                            disabled={!newSkill.name || !newSkill.logo || isUpdating}
                            type="button"
                          >
                            {isUpdating ? 'Updating...' : (editingSkill ? 'Update' : 'Add')} Skill
                          </Button>
                        </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
