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

            {/* ... keep existing code (owner add skill dialog and skill cards) */}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};
