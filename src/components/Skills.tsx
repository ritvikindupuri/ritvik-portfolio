import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Monitor, Globe, Cloud, Lock, Plus, Upload, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SkillsProps {
  isOwner: boolean;
}

const initialSkillCategories = [
  {
    id: "programming",
    label: "Programming Languages",
    icon: Code,
    skills: [
      { name: "Python", level: "Advanced", logo: "🐍", description: "Primary language for security tools and automation", link: "" },
      { name: "JavaScript", level: "Advanced", logo: "📜", description: "Full-stack development and web security", link: "" },
      { name: "Java", level: "Intermediate", logo: "☕", description: "Enterprise applications and Android development", link: "" },
      { name: "C/C++", level: "Intermediate", logo: "⚙️", description: "Low-level programming and system security", link: "" },
    ],
  },
  {
    id: "os",
    label: "Operating Systems",
    icon: Monitor,
    skills: [
      { name: "Linux", level: "Advanced", logo: "🐧", description: "Primary OS for security testing and server administration", link: "" },
      { name: "Windows", level: "Advanced", logo: "🪟", description: "System administration and security auditing", link: "" },
      { name: "macOS", level: "Intermediate", logo: "🍎", description: "Development and security research", link: "" },
    ],
  },
  {
    id: "web",
    label: "Web Development & AI",
    icon: Globe,
    skills: [
      { name: "React", level: "Advanced", logo: "⚛️", description: "Building modern web applications", link: "" },
      { name: "Node.js", level: "Advanced", logo: "💚", description: "Backend development and APIs", link: "" },
      { name: "TypeScript", level: "Advanced", logo: "🔷", description: "Type-safe application development", link: "" },
      { name: "HTML/CSS", level: "Advanced", logo: "🎨", description: "Frontend design and development", link: "" },
    ],
  },
  {
    id: "cloud",
    label: "Cloud & Development",
    icon: Cloud,
    skills: [
      { name: "AWS", level: "Intermediate", logo: "☁️", description: "Cloud infrastructure and security", link: "" },
      { name: "Docker", level: "Intermediate", logo: "🐳", description: "Containerization and deployment", link: "" },
      { name: "Git", level: "Advanced", logo: "📚", description: "Version control and collaboration", link: "" },
    ],
  },
  {
    id: "security",
    label: "Cybersecurity Tools",
    icon: Lock,
    skills: [
      { name: "Wireshark", level: "Advanced", logo: "🦈", description: "Network traffic analysis and packet inspection", link: "" },
      { name: "Metasploit", level: "Intermediate", logo: "🎯", description: "Penetration testing framework", link: "" },
      { name: "Burp Suite", level: "Intermediate", logo: "🔐", description: "Web application security testing", link: "" },
      { name: "Nmap", level: "Advanced", logo: "🗺️", description: "Network discovery and security scanning", link: "" },
    ],
  },
];

interface Skill {
  name: string;
  level: string;
  logo: string;
  description: string;
  link: string;
}

export const Skills = ({ isOwner }: SkillsProps) => {
  const [activeTab, setActiveTab] = useState("programming");
  const [skillCategories, setSkillCategories] = useState(initialSkillCategories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
  const [uploadedLogo, setUploadedLogo] = useState<string>("");

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching skills:', error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedSkills = initialSkillCategories.map(cat => ({
        ...cat,
        skills: data
          .filter(skill => skill.category === cat.id)
          .map(skill => ({
            name: skill.name,
            level: "Intermediate",
            logo: skill.icon || "",
            description: "",
            link: ""
          }))
      }));
      setSkillCategories(categorizedSkills);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced":
        return "text-accent";
      case "Intermediate":
        return "text-primary";
      case "Beginner":
        return "text-muted-foreground";
      default:
        return "text-foreground";
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
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('skills')
      .insert({
        user_id: user.id,
        name: newSkill.name,
        category: activeTab,
        icon: newSkill.logo
      });

    if (error) {
      toast.error("Failed to add skill");
      console.error('Error adding skill:', error);
      return;
    }

    const updatedCategories = skillCategories.map((cat) =>
      cat.id === activeTab
        ? { ...cat, skills: [...cat.skills, newSkill] }
        : cat
    );
    
    setSkillCategories(updatedCategories);
    setNewSkill({ name: "", level: "Intermediate", logo: "", description: "", link: "" });
    setUploadedLogo("");
    setIsAddDialogOpen(false);
    toast.success("Skill added successfully");
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
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-cyber-purple/5 blur-[120px] rounded-full" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-6 mb-20">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 shadow-glow"
            >
              <Code className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Skills & Expertise
            </h2>
            <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <TabsList className="inline-flex flex-nowrap w-auto min-w-full md:min-w-0 md:flex-wrap md:justify-center mb-16 bg-card/60 backdrop-blur-sm border border-primary/20 p-4 gap-3 rounded-2xl shadow-elegant relative z-10">
                {skillCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-4 px-6 rounded-xl hover:bg-primary/10 whitespace-nowrap border border-transparent data-[state=active]:border-primary/40"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-semibold">{category.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {skillCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {category.skills.map((skill, index) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="group relative"
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute -inset-0.5 bg-gradient-cyber rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500" />
                      
                      <div className="relative bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-glow">
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveSkill(category.id, skill.name)}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg p-2 z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex items-center justify-center w-14 h-14 shrink-0 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {skill.logo && typeof skill.logo === 'string' && skill.logo.startsWith('data:') ? (
                              <img src={skill.logo} alt={skill.name} className="w-10 h-10 object-contain" />
                            ) : (
                              <span className="text-3xl leading-none">{skill.logo}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base font-sans mb-1 text-foreground truncate">{skill.name}</h3>
                            <span className={`text-xs font-semibold font-mono px-2 py-1 rounded-md ${getLevelColor(skill.level)} bg-primary/5`}>
                              {skill.level}
                            </span>
                          </div>
                        </div>

                        {skill.description && (
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                            {skill.description}
                          </p>
                        )}
                        
                        {skill.link && (
                          <a
                            href={skill.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors mb-4 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Learn More</span>
                          </a>
                        )}
                        
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Proficiency</span>
                            <span className="text-xs font-bold text-primary">
                              {skill.level === "Advanced" ? "90%" : 
                               skill.level === "Intermediate" ? "66%" : "40%"}
                            </span>
                          </div>
                          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ 
                                width: skill.level === "Advanced" ? "90%" : 
                                       skill.level === "Intermediate" ? "66%" : "40%" 
                              }}
                              transition={{ duration: 1, delay: index * 0.05 + 0.3, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                skill.level === "Advanced" ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                                skill.level === "Intermediate" ? "bg-gradient-to-r from-blue-500 to-cyan-500" : 
                                "bg-gradient-to-r from-yellow-500 to-orange-500"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Skill Button - Owner Only */}
                  {isOwner && activeTab === category.id && (
                    <Dialog open={isAddDialogOpen && activeTab === category.id} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: category.skills.length * 0.05 }}
                          className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[180px] group hover:bg-primary/5 transition-all duration-300"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            Add New Skill
                          </span>
                        </motion.button>
                      </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Skill to {category.label}</DialogTitle>
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
                                <div className="w-16 h-16 rounded-lg border-2 border-primary overflow-hidden">
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
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSkill} disabled={!newSkill.name || !newSkill.logo}>
                            Add Skill
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};
