import { useState, useEffect } from "react";
import { Youtube, Plus, X, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProjectsProps {
  isOwner: boolean;
}

interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  github_url?: string;
  technologies: string[];
  start_date?: string;
  end_date?: string;
}

export const FeaturedProjects = ({ isOwner }: FeaturedProjectsProps) => {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    youtube_url: "",
    github_url: "",
    technologies: [] as string[],
    start_date: "",
    end_date: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured projects:', error);
      return;
    }

    if (data) {
      const featuredProjects: FeaturedProject[] = data.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        youtube_url: project.youtube_url || "",
        github_url: project.github_url || "",
        technologies: project.technologies || [],
        start_date: project.start_date || "",
        end_date: project.end_date || "",
      }));
      setProjects(featuredProjects);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.youtube_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            title: newProject.title,
            description: newProject.description,
            youtube_url: newProject.youtube_url,
            github_url: newProject.github_url,
            technologies: newProject.technologies,
            start_date: newProject.start_date,
            end_date: newProject.end_date,
            is_featured: true,
          })
          .eq('id', editingProject);

        if (error) {
          toast.error("Failed to update featured project");
          console.error('Error updating project:', error);
          return;
        }

        toast.success("Featured project updated successfully");
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: newProject.title,
            description: newProject.description,
            youtube_url: newProject.youtube_url,
            github_url: newProject.github_url,
            technologies: newProject.technologies,
            start_date: newProject.start_date,
            end_date: newProject.end_date,
            is_featured: true,
          });

        if (error) {
          toast.error("Failed to add featured project");
          console.error('Error adding project:', error);
          return;
        }

        toast.success("Featured project added successfully");
      }

      await fetchFeaturedProjects();
      setNewProject({
        title: "",
        description: "",
        youtube_url: "",
        github_url: "",
        technologies: [],
        start_date: "",
        end_date: "",
      });
      setSkillInput("");
      setEditingProject(null);
      setIsAddDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error("Failed to remove featured project");
      console.error('Error removing project:', error);
      return;
    }

    setProjects(projects.filter((p) => p.id !== projectId));
    toast.success("Featured project removed");
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setNewProject({
        ...newProject,
        technologies: [...newProject.technologies, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setNewProject({
      ...newProject,
      technologies: newProject.technologies.filter((s) => s !== skill),
    });
  };

  return (
    <section id="featured-projects" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
            <Youtube className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
            Featured Projects
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Projects that have been featured on YouTube
          </p>
          <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group relative h-full">
              <div className="relative bg-gradient-to-br from-card via-card/98 to-card/85 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 h-full flex flex-col shadow-2xl overflow-hidden">
                {isOwner && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                    <button
                      onClick={() => {
                        setEditingProject(project.id);
                        setNewProject({
                          title: project.title,
                          description: project.description,
                          youtube_url: project.youtube_url,
                          github_url: project.github_url || "",
                          technologies: project.technologies,
                          start_date: project.start_date || "",
                          end_date: project.end_date || "",
                        });
                        setIsAddDialogOpen(true);
                      }}
                      className="bg-primary/20 hover:bg-primary/30 text-primary rounded-xl p-2.5 backdrop-blur-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button
                      onClick={() => handleRemoveProject(project.id)}
                      className="bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-xl p-2.5 backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="space-y-5 flex flex-col h-full">
                  {/* Video Embed */}
                  {project.youtube_url && getYoutubeEmbedUrl(project.youtube_url) && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-primary/30">
                      <iframe
                        src={getYoutubeEmbedUrl(project.youtube_url)}
                        title={project.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold font-sans bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                      {project.title}
                    </h3>
                    <div className="h-1 bg-gradient-to-r from-primary via-accent to-transparent rounded-full w-3/5" />
                  </div>

                  <p className="text-muted-foreground leading-relaxed text-sm border-l-2 border-primary/30 pl-4">
                    {project.description}
                  </p>

                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-3 text-sm font-mono bg-primary/5 rounded-xl p-3 border border-primary/20">
                      {project.start_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-primary font-semibold">{project.start_date}</span>
                        </div>
                      )}
                      {project.start_date && project.end_date && (
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                      )}
                      {project.end_date && (
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-semibold">{project.end_date}</span>
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        </div>
                      )}
                    </div>
                  )}

                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="font-mono text-xs px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 border border-primary/30 shadow-sm"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mt-auto">
                    {project.youtube_url && (
                      <a
                        href={project.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-medium text-sm bg-primary/5 hover:bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20 hover:border-primary/40"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>Watch Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-medium text-sm bg-primary/5 hover:bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20 hover:border-primary/40"
                      >
                        <Github className="w-4 h-4" />
                        <span>View Code</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Project Button - Owner Only */}
          {isOwner && (
            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingProject(null);
                  setNewProject({
                    title: "",
                    description: "",
                    youtube_url: "",
                    github_url: "",
                    technologies: [],
                    start_date: "",
                    end_date: "",
                  });
                  setSkillInput("");
                }
              }}
            >
              <DialogTrigger asChild>
                <button className="group relative h-full min-h-[400px] bg-gradient-to-br from-card/50 via-card/30 to-transparent backdrop-blur-sm border-2 border-dashed border-primary/30 rounded-2xl hover:border-primary/60 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-primary">Add Featured Project</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Featured Project" : "Add Featured Project"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Project title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Project description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">YouTube URL *</label>
                    <Input
                      value={newProject.youtube_url}
                      onChange={(e) => setNewProject({ ...newProject, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">GitHub URL (Optional)</label>
                    <Input
                      value={newProject.github_url}
                      onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        value={newProject.start_date}
                        onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                        placeholder="Sep 2024"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        value={newProject.end_date}
                        onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                        placeholder="Dec 2024"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Technologies</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                        placeholder="Add technology"
                      />
                      <Button onClick={handleAddSkill} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProject.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="gap-1">
                          {tech}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveSkill(tech)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddProject} className="w-full" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : editingProject ? "Update Project" : "Add Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </section>
  );
};
