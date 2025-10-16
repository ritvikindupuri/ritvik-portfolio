import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Monitor, Globe, Cloud, Shield } from "lucide-react";

interface SkillsProps {
  isOwner: boolean;
}

const skillCategories = [
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
    icon: Shield,
    skills: [
      { name: "Wireshark", level: "Advanced", logo: "🦈" },
      { name: "Metasploit", level: "Intermediate", logo: "🎯" },
      { name: "Burp Suite", level: "Intermediate", logo: "🔐" },
      { name: "Nmap", level: "Advanced", logo: "🗺️" },
    ],
  },
];

export const Skills = ({ isOwner }: SkillsProps) => {
  const [activeTab, setActiveTab] = useState("programming");

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
            <span className="bg-gradient-cyber bg-clip-text text-transparent">Skills & Expertise</span>
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-8 bg-secondary/50 p-2">
              {skillCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{category.label.split(" ")[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {skillCategories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {category.skills.map((skill, index) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-glow transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{skill.logo}</span>
                          <div>
                            <h3 className="text-lg font-semibold font-mono">{skill.name}</h3>
                            <p className={`text-sm font-medium ${getLevelColor(skill.level)}`}>
                              {skill.level}
                            </p>
                          </div>
                        </div>
                        <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors">
                          <div className="text-xs font-bold text-primary">{skill.level[0]}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};
