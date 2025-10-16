import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Shield, Cloud, Brain, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectsProps {
  isOwner: boolean;
}

const projects = {
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

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-center mb-12 font-sans">
            <span className="bg-gradient-cyber bg-clip-text text-transparent">Projects</span>
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-3 w-full mb-8 bg-secondary/50 p-2">
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className="w-4 h-4" />
                Security Engineering
              </TabsTrigger>
              <TabsTrigger
                value="cloud"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Cloud className="w-4 h-4" />
                Cloud Security
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Brain className="w-4 h-4" />
                AI Projects
              </TabsTrigger>
            </TabsList>

            {Object.entries(projects).map(([key, projectList]) => (
              <TabsContent key={key} value={key}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projectList.map((project, index) => (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-glow transition-all group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold font-sans group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          {project.type === "Purdue" && (
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png"
                              alt="Purdue"
                              className="h-6"
                            />
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{project.description}</p>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                          <span>{project.startMonth}</span>
                          <span>→</span>
                          <span>{project.endMonth}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {project.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="font-mono">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                        >
                          <Github className="w-4 h-4" />
                          View on GitHub
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};
