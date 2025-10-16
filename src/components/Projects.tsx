import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Target, Cloud, Brain, ExternalLink, Plus, X, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProjectsProps {
  isOwner: boolean;
}

interface Project {
  title: string;
  type: string;
  startMonth: string;
  endMonth: string;
  skills: string[];
  github: string;
  description: string;
}

const initialProjects: Record<string, Project[]> = {
  security: [
    {
      title: "Network Intrusion Detection System",
      type: "Personal",
      startMonth: "Sep 2024",
      endMonth: "Dec 2024",
      skills: ["Python", "Wireshark", "ML"],
      github: "https://github.com/example/nids",
      description: "Built an ML-powered NIDS to detect anomalous network traffic patterns",
    },
    {
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
      title: "Secure Cloud Infrastructure",
      type: "Personal",
      startMonth: "Jun 2024",
      endMonth: "Aug 2024",
      skills: ["AWS", "Terraform", "IAM"],
      github: "https://github.com/example/cloud-infra",
      description: "Designed and deployed secure multi-tier cloud architecture on AWS",
    },
    {
      title: "Container Security Scanner",
      type: "Purdue",
      startMonth: "Feb 2024",
      endMonth: "Apr 2024",
      skills: ["Docker", "Python", "Security"],
      github: "https://github.com/example/container-scan",
      description: "Automated vulnerability scanning for containerized applications",
    },
  ],
  ai: [
    {
      title: "Malware Classification System",
      type: "Personal",
      startMonth: "Mar 2024",
      endMonth: "Present",
      skills: ["Python", "TensorFlow", "ML"],
      github: "https://github.com/example/malware-ml",
      description: "Deep learning model to classify and detect malware variants",
    },
    {
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
  const [activeTab, setActiveTab] = useState("security");
  const [projects, setProjects] = useState(initialProjects);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedProjects: Record<string, Project[]> = {
        security: [],
        cloud: [],
        ai: []
      };

      data.forEach(project => {
        const proj: Project = {
          title: project.title,
          type: "Personal",
          startMonth: "",
          endMonth: "",
          skills: project.technologies || [],
          github: project.github_url || "",
          description: project.description
        };

        // Simple categorization based on title/description
        const content = (project.title + project.description).toLowerCase();
        if (content.includes('security') || content.includes('nids') || content.includes('audit')) {
          categorizedProjects.security.push(proj);
        } else if (content.includes('cloud') || content.includes('aws') || content.includes('container')) {
          categorizedProjects.cloud.push(proj);
        } else {
          categorizedProjects.ai.push(proj);
        }
      });

      setProjects(categorizedProjects);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: newProject.title,
        description: newProject.description,
        github_url: newProject.github,
        technologies: newProject.skills
      });

    if (error) {
      toast.error("Failed to add project");
      console.error('Error adding project:', error);
      return;
    }

    setProjects({
      ...projects,
      [activeTab]: [...projects[activeTab], newProject],
    });
    
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
    setIsAddDialogOpen(false);
    toast.success("Project added successfully");
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

    setProjects({
      ...projects,
      [category]: projects[category].filter((p) => p.title !== projectTitle),
    });
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


  return (
    <section className="py-16 bg-card/30 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[150px] rounded-full" />
      
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
              <Target className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Projects
            </h2>
            <div className="w-24 h-1 bg-gradient-cyber mx-auto rounded-full" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-3 w-full mb-12 bg-secondary/50 p-2 h-auto gap-2">
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3 px-4 rounded-lg"
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="cloud"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3 px-4 rounded-lg"
              >
                <Cloud className="w-5 h-5" />
                <span className="text-sm font-medium">Cloud</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3 px-4 rounded-lg"
              >
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">AI</span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(projects).map(([key, projectList]) => (
              <TabsContent key={key} value={key} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {projectList.map((project, index) => (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="group relative bg-gradient-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-elegant transition-all duration-300"
                    >
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveProject(key, project.title)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-2xl font-bold font-sans group-hover:text-primary transition-colors flex-1">
                            {project.title}
                          </h3>
                          {project.type === "Purdue" && (
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png"
                              alt="Purdue"
                              className="h-7 flex-shrink-0"
                            />
                          )}
                        </div>

                        <p className="text-muted-foreground leading-relaxed">{project.description}</p>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                          <span className="text-primary">{project.startMonth}</span>
                          <span>→</span>
                          <span className="text-primary">{project.endMonth}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {project.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="font-mono text-xs px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium group/link"
                          >
                            <Github className="w-5 h-5" />
                            <span>View on GitHub</span>
                            <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Project Button - Owner Only */}
                  {isOwner && activeTab === key && (
                    <Dialog open={isAddDialogOpen && activeTab === key} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: projectList.length * 0.1, duration: 0.5 }}
                          className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[400px] group hover:bg-primary/5 transition-all duration-300"
                        >
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-7 h-7 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            Add New Project
                          </span>
                        </motion.button>
                      </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New {key === 'security' ? 'Security Engineering' : key === 'cloud' ? 'Cloud Security' : 'AI'} Project</DialogTitle>
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
                            <label className="text-sm font-medium">GitHub Repository</label>
                            <Input
                              placeholder="https://github.com/username/repo"
                              value={newProject.github}
                              onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Skills/Technologies</label>
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
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddProject} disabled={!newProject.title || !newProject.description}>
                            Add Project
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
