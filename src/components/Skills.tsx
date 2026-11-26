import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Brain, Cloud, Code, ExternalLink, Globe, Lock, Monitor, Server, Workflow } from "lucide-react";
import { useEffect, useState } from "react";

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
    label: "Web Development",
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
    id: "devops",
    label: "DevOps & Infrastructure",
    icon: Server,
    skills: [] as Skill[],
  },
  {
    id: "security",
    label: "Cybersecurity Tools",
    icon: Lock,
    skills: [] as Skill[],
  },
  {
    id: "ai",
    label: "AI Systems",
    icon: Brain,
    skills: [] as Skill[],
  },
  {
    id: "automation",
    label: "Automation & Orchestration",
    icon: Workflow,
    skills: [] as Skill[],
  },
];

interface ProjectLink {
  name: string;
  url: string;
}

const SECURITY_SUBCATEGORY_ORDER = [
  "Cloud & AWS Security",
  "Container & Kubernetes Security",
  "Code & Supply Chain",
  "Offensive & Pentesting",
  "Detection & Monitoring",
];

// Wide marks look small in the default 64px square. Give them the same height
// as neighbors and let width follow the artwork, capped so cards stay aligned.
const WIDE_SKILL_ICONS: Record<string, { wrap: string; img: string }> = {
  Pacu: {
    wrap: "w-[6.5rem] h-20 max-w-full flex items-center justify-center flex-shrink-0 overflow-visible",
    img: "h-16 w-auto max-w-[6.5rem] object-contain",
  },
};

interface Skill {
  id: string;
  name: string;
  level: string;
  logo: string;
  description: string;
  link: string;
  projectLinks: ProjectLink[];
  display_order?: number;
  subcategory?: string | null;
}


function getSecurityFilterChips(skills: Skill[]) {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    if (skill.subcategory) {
      counts.set(skill.subcategory, (counts.get(skill.subcategory) || 0) + 1);
    }
  }

  return [
    { id: "all", label: "All", count: skills.length },
    ...SECURITY_SUBCATEGORY_ORDER.filter((name) => counts.has(name)).map((name) => ({
      id: name,
      label: name,
      count: counts.get(name) || 0,
    })),
  ];
}

interface SortableSkillProps {
  skill: Skill;
  getLevelColor: (level: string) => string;
}

const SortableSkill = ({ skill, getLevelColor }: SortableSkillProps) => {
  return (
    <div className="group relative" data-skill-id={skill.id}>
      <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center shadow-lg">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Logo */}
          <div
            className={
              WIDE_SKILL_ICONS[skill.name]?.wrap ??
              "w-20 h-20 flex items-center justify-center flex-shrink-0"
            }
          >
            {skill.logo && typeof skill.logo === "string" && skill.logo.startsWith("data:") ? (
              <img
                src={skill.logo}
                alt={skill.name}
                className={WIDE_SKILL_ICONS[skill.name]?.img ?? "w-16 h-16 object-contain"}
              />
            ) : (
              <span className="text-5xl leading-none">{skill.logo}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-xl font-sans text-foreground">{skill.name}</h3>

          {/* Description */}
          {skill.description && (
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">{skill.description}</p>
          )}

          {/* Proficiency Badge */}
          <span className={`text-sm font-semibold font-sans px-4 py-1.5 rounded-full ${getLevelColor(skill.level)}`}>
            {skill.level}
          </span>

          {/* Project Links */}
          {skill.projectLinks && skill.projectLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {skill.projectLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex items-center gap-1.5 text-xs text-primary hover:text-accent transition-colors font-medium group/link bg-primary/10 px-3 py-1.5 rounded-full"
                >
                  <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  <span>{link.name || "Project"}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Skills = () => {
  const [activeTab, setActiveTab] = useState("programming");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [skillCategories, setSkillCategories] = useState(initialSkillCategories);
  useEffect(() => {
    fetchSkills();
  }, []);
  const fetchSkills = async () => {
    const { data, error } = await supabase.from("skills").select("*").order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching skills:", error);
      return;
    }

    if (data && data.length > 0) {
      const categorizedSkills = initialSkillCategories.map((cat) => ({
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
            projectLinks: (skill.project_links as ProjectLink[]) || [],
            display_order: skill.display_order,
            subcategory: skill.subcategory ?? null,
          })),
      }));
      setSkillCategories(categorizedSkills);
    }
  };
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
      case "Intermediate":
        return "bg-accent/20 text-accent border border-accent/40 shadow-[0_0_12px_hsl(280_85%_60%/0.3)]";
      case "Beginner":
        return "bg-primary/20 text-primary border border-primary/40 shadow-[0_0_12px_hsl(185_100%_50%/0.3)]";
      default:
        return "bg-accent/20 text-accent border border-accent/40";
    }
  };
  return (
    <section id="skills-section" className="py-32 px-4 bg-card/20 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div>
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4 shadow-glow">
              <Code className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Skills & Expertise</h2>
            <p className="text-lg text-muted-foreground font-medium">
              Total Skills:{" "}
              <span className="text-primary font-bold">
                {skillCategories.reduce((acc, cat) => acc + cat.skills.length, 0)}
              </span>
            </p>
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
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
                      data-value={category.id}
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

            <>
              {skillCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-8">
                  <>
                    {category.id === "security" && category.skills.length > 0 && (
                      <div
                        className="flex justify-center mt-4"
                        role="group"
                        aria-label="Filter cybersecurity tools"
                      >
                        <div className="flex flex-wrap justify-center gap-2 max-w-full px-1">
                          {getSecurityFilterChips(category.skills).map((chip) => {
                            const selected = selectedSubcategory === chip.id;
                            return (
                              <button
                                key={chip.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setSelectedSubcategory(chip.id)}
                                className={`inline-flex items-center gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-200 ${
                                  selected
                                    ? "bg-primary/20 text-primary border-primary/40 shadow-lg"
                                    : "bg-card/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-primary/10 hover:border-primary/30"
                                }`}
                              >
                                <span>{chip.label}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    selected ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
                                  }`}
                                >
                                  {chip.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <motion.div
                      key={`${category.id}-${category.id === "security" ? selectedSubcategory : "all"}`}
                      className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ${
                        category.id === "security" ? "mt-6" : "mt-10"
                      }`}
                      initial="hidden"
                      animate="visible"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.08, delayChildren: 0.04 },
                        },
                      }}
                    >
                      {(category.id === "security" && selectedSubcategory !== "all"
                        ? category.skills.filter((skill) => skill.subcategory === selectedSubcategory)
                        : category.skills
                      ).map((skill) => (
                        <motion.div
                          key={skill.id}
                          variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.95 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] },
                            },
                          }}
                        >
                          <SortableSkill key={skill.id} skill={skill} getLevelColor={getLevelColor} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                </TabsContent>
              ))}
            </>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
