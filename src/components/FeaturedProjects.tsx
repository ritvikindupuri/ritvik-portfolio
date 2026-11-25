import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Github, Youtube } from "lucide-react";
import { docUrlForGithub } from "@/data/projectDocs";
import { useEffect, useState } from "react";

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

interface SortableFeaturedProjectProps {
  project: FeaturedProject;
  getYoutubeEmbedUrl: (url: string) => string;
}

const SortableFeaturedProject = ({ project, getYoutubeEmbedUrl }: SortableFeaturedProjectProps) => {
  return (
    <div className="group relative bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-elegant hover:shadow-glow">
      <div className="aspect-video w-full overflow-hidden rounded-t-2xl">
        <iframe
          src={getYoutubeEmbedUrl(project.youtube_url)}
          title={project.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            {(project.start_date || project.end_date) && (
              <p className="text-sm text-muted-foreground">
                {project.start_date} {project.end_date && `- ${project.end_date}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {project.youtube_url && (
              <a
                href={project.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-primary" />
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="View source code"
              >
                <Github className="w-5 h-5 text-primary" />
              </a>
            )}
            {docUrlForGithub(project.github_url) && (
              <a
                href={docUrlForGithub(project.github_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="View documentation"
              >
                <FileText className="w-5 h-5 text-primary" />
              </a>
            )}
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">{project.description}</p>

        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const FeaturedProjects = () => {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching featured projects:", error);
      return;
    }

    if (data) {
      const featuredProjects: FeaturedProject[] = data.map((project) => ({
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
  return (
    <section id="featured-projects" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
            <Youtube className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Featured Projects</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Projects that have been featured on YouTube</p>
          <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
        </div>

        <>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.1 },
              },
            }}
          >
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={{
                  hidden: { opacity: 0, y: 40, scale: 0.95 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
                  },
                }}
              >
                <SortableFeaturedProject key={project.id} project={project} getYoutubeEmbedUrl={getYoutubeEmbedUrl} />
              </motion.div>
            ))}
          </motion.div>
        </>
      </div>
    </section>
  );
};
