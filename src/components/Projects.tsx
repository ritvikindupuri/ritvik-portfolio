
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
          startMonth: project.start_date || "",
          endMonth: project.end_date || "",
          skills: project.technologies || [],
          github: project.github_url || "",
          description: project.description
        };

        // Use saved category, fallback to 'security' if not set
        const category = project.category || 'security';
        if (category === 'security') {
          categorizedProjects.security.push(proj);
        } else if (category === 'cloud') {
          categorizedProjects.cloud.push(proj);
        } else if (category === 'ai') {
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

    if (editingProject) {
      // Update existing project
      const { error } = await supabase
        .from('projects')
        .update({
          title: newProject.title,
          description: newProject.description,
          github_url: newProject.github,
          technologies: newProject.skills,
          category: activeTab,
          start_date: newProject.startMonth,
          end_date: newProject.endMonth
        })
        .eq('user_id', user.id)
        .eq('title', editingProject);

      if (error) {
        toast.error("Failed to update project");
        console.error('Error updating project:', error);
        return;
      }

      await fetchProjects();
      toast.success("Project updated successfully");
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
          category: activeTab,
          start_date: newProject.startMonth,
          end_date: newProject.endMonth
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
    <section id="projects" className="py-32 px-4 bg-card/20 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div>
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Projects
            </h2>
            <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
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
                  value="ai"
                  className="flex items-center gap-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all py-3 md:py-4 px-5 md:px-6 rounded-xl hover:bg-primary/10 border border-transparent data-[state=active]:border-primary/40"
                >
                  <Brain className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">AI & Cybersecurity Projects</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(projects).map(([key, projectList]) => (
              <TabsContent key={key} value={key} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                  {projectList.map((project) => (
                    <div
                      key={project.title}
                      className="group relative h-full"
                    >
                      <div className="relative bg-gradient-to-br from-card via-card/98 to-card/85 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 h-full flex flex-col shadow-2xl overflow-hidden">

                        {isOwner && (
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                            <button
                              onClick={() => {
                                setEditingProject(project.title);
                                setNewProject(project);
                                setIsAddDialogOpen(true);
                              }}
                              className="bg-primary/20 hover:bg-primary/30 text-primary rounded-xl p-2.5 backdrop-blur-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                            <button
                              onClick={() => handleRemoveProject(key, project.title)}
                              className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-xl p-2.5 backdrop-blur-sm"
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
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png"
                                  alt="Purdue"
                                  className="w-7 h-7 object-contain"
                                />
                              </div>
                            )}
                          </div>

                          <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3 border-l-2 border-primary/30 pl-4">{project.description}</p>

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
                  ))}

                  {/* Add Project Button - Owner Only */}
                  {isOwner && activeTab === key && (
                    <Dialog open={isAddDialogOpen && activeTab === key} onOpenChange={(open) => {
                      setIsAddDialogOpen(open);
                      if (!open) {
                        setEditingProject(null);
                        setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                        setSkillInput("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <button 
                          onClick={() => {
                            setEditingProject(null);
                            setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                            setSkillInput("");
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
                          <DialogTitle>{editingProject ? 'Edit' : 'Add New'} {key === 'security' ? 'Security Engineering' : key === 'cloud' ? 'Cloud Security' : 'AI'} Project</DialogTitle>
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
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingProject(null);
                      setNewProject({ title: "", type: "Personal", startMonth: "", endMonth: "", skills: [], github: "", description: "" });
                      setSkillInput("");
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddProject} 
                      disabled={!newProject.title || !newProject.description}
                      type="button"
                    >
                      {editingProject ? 'Update Project' : 'Add Project'}
                    </Button>
                  </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
