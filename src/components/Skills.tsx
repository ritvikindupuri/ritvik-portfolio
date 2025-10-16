import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Monitor, Globe, Cloud, Lock, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SkillsProps {
  isOwner: boolean;
}

const initialSkillCategories = [
  {
    id: "programming",
    label: "Programming Languages",
    icon: Code,
    skills: [
      { name: "Python", level: "Advanced", logo: "🐍" },
      { name: "JavaScript", level: "Advanced", logo: "📜" },
      { name: "Java", level: "Intermediate", logo: "☕" },
      { name: "C/C++", level: "Intermediate", logo: "⚙️" },
    ],
  },
  {
    id: "os",
    label: "Operating Systems",
    icon: Monitor,
    skills: [
      { name: "Linux", level: "Advanced", logo: "🐧" },
      { name: "Windows", level: "Advanced", logo: "🪟" },
      { name: "macOS", level: "Intermediate", logo: "🍎" },
    ],
  },
  {
    id: "web",
    label: "Web Technologies",
    icon: Globe,
    skills: [
      { name: "React", level: "Advanced", logo: "⚛️" },
      { name: "Node.js", level: "Advanced", logo: "💚" },
      { name: "TypeScript", level: "Advanced", logo: "🔷" },
      { name: "HTML/CSS", level: "Advanced", logo: "🎨" },
    ],
  },
  {
    id: "cloud",
    label: "Cloud & Development",
    icon: Cloud,
    skills: [
      { name: "AWS", level: "Intermediate", logo: "☁️" },
      { name: "Docker", level: "Intermediate", logo: "🐳" },
      { name: "Git", level: "Advanced", logo: "📚" },
    ],
  },
  {
    id: "security",
    label: "Cybersecurity Tools",
    icon: Lock,
    skills: [
      { name: "Wireshark", level: "Advanced", logo: "🦈" },
      { name: "Metasploit", level: "Intermediate", logo: "🎯" },
      { name: "Burp Suite", level: "Intermediate", logo: "🔐" },
      { name: "Nmap", level: "Advanced", logo: "🗺️" },
    ],
  },
];

interface Skill {
  name: string;
  level: string;
  logo: string;
}

export const Skills = ({ isOwner }: SkillsProps) => {
  const [activeTab, setActiveTab] = useState("programming");
  const [skillCategories, setSkillCategories] = useState(initialSkillCategories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate", logo: "" });
  const [uploadedLogo, setUploadedLogo] = useState<string>("");

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

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.logo) return;
    
    const updatedCategories = skillCategories.map((cat) =>
      cat.id === activeTab
        ? { ...cat, skills: [...cat.skills, newSkill] }
        : cat
    );
    
    setSkillCategories(updatedCategories);
    setNewSkill({ name: "", level: "Intermediate", logo: "" });
    setUploadedLogo("");
    setIsAddDialogOpen(false);
  };

  const handleRemoveSkill = (categoryId: string, skillName: string) => {
    const updatedCategories = skillCategories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, skills: cat.skills.filter((s) => s.name !== skillName) }
        : cat
    );
    setSkillCategories(updatedCategories);
  };

  return (
    <section className="py-32 bg-card/20 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-cyber-purple/5 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-4 mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
            >
              <Code className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Skills & Expertise
            </h2>
            <div className="w-24 h-1 bg-gradient-cyber mx-auto rounded-full" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-12 bg-secondary/50 p-2 h-auto gap-2">
              {skillCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col md:flex-row items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3 px-4 rounded-lg"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs md:text-sm font-medium">{category.label.split(" ")[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {skillCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.skills.map((skill, index) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-gradient-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-elegant transition-all duration-300"
                    >
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveSkill(category.id, skill.name)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl">{skill.logo}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg font-sans mb-1">{skill.name}</h3>
                          <span className={`text-sm font-medium font-mono ${getLevelColor(skill.level)}`}>
                            {skill.level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: skill.level === "Advanced" ? "100%" : 
                                   skill.level === "Intermediate" ? "66%" : "33%" 
                          }}
                          transition={{ duration: 1, delay: index * 0.05 + 0.2 }}
                          className={`h-full rounded-full ${
                            skill.level === "Advanced" ? "bg-accent" :
                            skill.level === "Intermediate" ? "bg-primary" : "bg-muted-foreground"
                          }`}
                        />
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
