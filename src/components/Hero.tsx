import cyberBg from "@/assets/cyber-bg.jpg";
import purdueLogo from "@/assets/purdue-logo.svg";
import { FloatingSkillsKeyboard } from "@/components/FloatingSkillsKeyboard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Cpu,
  FolderOpen,
  Github,
  Linkedin,
  Lock,
  Mail,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

// Table of contents data
const tableOfContents = [
  {
    id: "about-section",
    label: "About",
    icon: User,
    tooltip: "Learn about my background, interests, and what drives my passion for cybersecurity and machine learning.",
    color: "text-blue-400",
  },
  {
    id: "skills-section",
    label: "Skills",
    icon: Cpu,
    tooltip:
      "Explore my technical arsenal including programming languages, frameworks, security tools, and ML technologies.",
    color: "text-green-400",
  },
  {
    id: "security-tools-section",
    label: "Security Tools",
    icon: Wrench,
    tooltip:
      "Open-source security tools for AI agents and cloud infrastructure — honeypots, skill scanners, and threat detection.",
    color: "text-purple-400",
  },
  {
    id: "featured-projects-section",
    label: "Featured",
    icon: Sparkles,
    tooltip: "Highlighted flagship projects demonstrating end-to-end problem solving and technical excellence.",
    color: "text-yellow-400",
  },
  {
    id: "experience-section",
    label: "Experience",
    icon: Briefcase,
    tooltip: "My professional journey including internships, research positions, and real-world industry experience.",
    color: "text-orange-400",
  },
  {
    id: "projects-section",
    label: "Projects",
    icon: FolderOpen,
    tooltip: "A comprehensive archive of all my technical work, personal projects, and explorations.",
    color: "text-cyan-400",
  },
  {
    id: "certifications-section",
    label: "Certs",
    icon: Award,
    tooltip: "Industry certifications validating my expertise in security, cloud, and technology domains.",
    color: "text-red-400",
  },
  {
    id: "documentation-section",
    label: "Docs",
    icon: BookOpen,
    tooltip: "Technical documentation, detailed project write-ups, and knowledge base articles.",
    color: "text-indigo-400",
  },
  {
    id: "contact-section",
    label: "Contact",
    icon: Mail,
    tooltip: "Get in touch with me for opportunities, collaborations, or just to say hello.",
    color: "text-pink-400",
  },
];
const NeuralNetworkBackground = () => {
  // Neural network layers - create nodes in a layered structure
  const layers = [
    { nodes: 4, x: 10 },
    { nodes: 6, x: 25 },
    { nodes: 8, x: 40 },
    { nodes: 8, x: 55 },
    { nodes: 6, x: 70 },
    { nodes: 4, x: 85 },
  ];

  const allNodes = layers.flatMap((layer, layerIndex) =>
    Array.from({ length: layer.nodes }, (_, i) => {
      const size = 2 + Math.random() * 2;
      return {
        x: layer.x + (Math.random() - 0.5) * 8,
        y: 15 + (i / (layer.nodes - 1 || 1)) * 70 + (Math.random() - 0.5) * 5,
        layerIndex,
        id: `${layerIndex}-${i}`,
        size: isNaN(size) ? 3 : size, // Safety fallback
      };
    }),
  );

  // Connect nodes between adjacent layers
  const connections: { from: (typeof allNodes)[0]; to: (typeof allNodes)[0] }[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const currentLayer = allNodes.filter((n) => n.layerIndex === i);
    const nextLayer = allNodes.filter((n) => n.layerIndex === i + 1);
    currentLayer.forEach((node) => {
      nextLayer.forEach((nextNode) => {
        if (Math.random() > 0.4) {
          connections.push({ from: node, to: nextNode });
        }
      });
    });
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Cyan to purple gradient */}
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--cyber-glow))" />
            <stop offset="100%" stopColor="hsl(var(--cyber-purple))" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neuralGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Neural connections */}
        {connections.map((conn, i) => (
          <g key={`conn-${i}`}>
            <line
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="url(#neuralGradient)"
              strokeWidth="1"
              strokeOpacity="0.15"
            />
            {/* Animated data pulse */}
            {i % 4 === 0 && (
              <motion.circle
                r="3"
                fill="hsl(var(--cyber-glow))"
                filter="url(#neuralGlow)"
                initial={{
                  cx: `${conn.from.x}%`,
                  cy: `${conn.from.y}%`,
                  opacity: 0,
                }}
                animate={{
                  cx: [`${conn.from.x}%`, `${conn.to.x}%`],
                  cy: [`${conn.from.y}%`, `${conn.to.y}%`],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              />
            )}
          </g>
        ))}

        {/* Neural nodes */}
        {allNodes
          .filter((node) => node && node.size != null && !isNaN(node.size))
          .map((node) => {
            const safeSize = Math.max(2, node.size || 3); // Ensure valid size
            return (
              <g key={`node-${node.id}`}>
                {/* Outer glow */}
                <motion.circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={safeSize * 3}
                  fill={node.layerIndex % 2 === 0 ? "hsl(var(--cyber-glow))" : "hsl(var(--cyber-purple))"}
                  opacity="0.1"
                  filter="url(#neuralGlow)"
                  animate={{
                    r: [safeSize * 3, safeSize * 4, safeSize * 3],
                    opacity: [0.1, 0.25, 0.1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut",
                  }}
                />
                {/* Core node */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={safeSize}
                  fill={node.layerIndex % 2 === 0 ? "hsl(var(--cyber-glow))" : "hsl(var(--cyber-purple))"}
                  opacity="0.7"
                />
              </g>
            );
          })}
      </svg>

      {/* Floating ML/Cyber icons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`brain-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 30}%`,
            top: `${15 + (i % 2) * 60}%`,
          }}
          animate={{
            y: [-15, 15, -15],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        >
          <Brain
            className="w-8 h-8 text-cyber-purple"
            style={{ filter: "drop-shadow(0 0 12px hsl(var(--cyber-purple) / 0.6))" }}
          />
        </motion.div>
      ))}

      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 35}%`,
            top: `${40 + (i % 2) * 30}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          <Lock
            className="w-6 h-6 text-primary"
            style={{ filter: "drop-shadow(0 0 10px hsl(var(--cyber-glow) / 0.6))" }}
          />
        </motion.div>
      ))}
    </div>
  );
};

interface HeroProps {
  showKeyboard?: boolean;
}

export const Hero = ({ showKeyboard = true }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cyberBg})` }} />
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Neural Network Background Animation */}
      <NeuralNetworkBackground />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {/* Main Hero Layout - Side by Side */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 min-h-[60vh]">
            {/* Left Column - Name & Info (Centered) with keyboard reflection overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative flex flex-col items-center text-center space-y-3"
            >
              {/* Subtle keyboard reflection overlay */}
              <div
                className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none opacity-[0.04] blur-sm hidden lg:block"
                style={{
                  background: "linear-gradient(135deg, hsl(185 100% 50%) 0%, hsl(280 85% 60%) 50%, transparent 100%)",
                  borderRadius: "20px",
                  transform: "translateY(-50%) perspective(500px) rotateY(-15deg) rotateX(10deg)",
                }}
              />

              {/* Intro text */}
              <span className="text-muted-foreground text-base tracking-wide">Hi, I am</span>

              {/* Large Name - Single Line with nowrap */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] whitespace-nowrap">
                <span className="text-foreground">Ritvik </span>
                <span className="text-gradient-cyber">Indupuri</span>
              </h1>

              {/* Title */}
              <p className="text-muted-foreground text-base font-medium tracking-wide italic">A Cybersecurity Major</p>

              {/* University Badge */}
              <div className="flex items-center gap-3 px-5 py-3 bg-card/40 backdrop-blur-sm rounded-xl border border-primary/20">
                <img src={purdueLogo} alt="Purdue Logo" className="h-7" />
                <span className="font-semibold text-sm">Purdue University</span>
                <span className="text-primary">•</span>
                <span className="font-mono text-primary text-sm">2024-2028</span>
              </div>

              {/* Social Links - Centered */}
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://github.com/ritvikindupuri"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-lg transition-all duration-300 group"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://www.linkedin.com/in/ritvik-indupuri-4b6037288/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-lg transition-all duration-300 group"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            </motion.div>

            {/* Right Column - Skills Keyboard - Only shows after access choice */}
            {showKeyboard && (
              <motion.div
                initial={{ opacity: 0, x: 100, rotateY: -25 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden md:block"
              >
                <FloatingSkillsKeyboard />
              </motion.div>
            )}
          </div>

          {/* Mobile Keyboard - Only shows after access choice */}
          {showKeyboard && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="md:hidden flex justify-center mt-8"
            >
              <FloatingSkillsKeyboard />
            </motion.div>
          )}

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-12 mb-8"
          >
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-primary/50" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Quick Navigation
                </span>
                <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-primary/50" />
              </div>

              {/* TOC Grid */}
              <div className="flex flex-wrap justify-center gap-2">
                <TooltipProvider delayDuration={100}>
                  {tableOfContents.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                            onClick={() => {
                              const element = document.getElementById(item.id);
                              element?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                          >
                            <Icon className={`w-4 h-4 ${item.color} transition-transform group-hover:scale-110`} />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                              {item.label}
                            </span>
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[250px] p-3" sideOffset={8}>
                          <div className="flex items-start gap-2">
                            <Icon className={`w-4 h-4 ${item.color} flex-shrink-0 mt-0.5`} />
                            <div>
                              <p className="text-xs font-semibold mb-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.tooltip}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-center pt-8"
          >
            <button
              onClick={() => {
                const aboutSection = document.getElementById("about-section");
                aboutSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-block animate-bounce cursor-pointer hover:scale-110 transition-transform focus:outline-none"
              aria-label="Scroll to about section"
            >
              <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2 mx-auto">
                <div className="w-1 h-2 bg-primary rounded-full" />
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Image Crop Dialog */}
    </section>
  );
};
