import { motion, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, Github, Linkedin, Cloud, Lock } from "lucide-react";
import cyberBg from "@/assets/cyber-bg.jpg";

const TypewriterText = () => {
  const fullText = "Hi, my name is Ritvik Indupuri";
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(typeInterval);
        setTimeout(() => {
          setDisplayedText("");
          setIsComplete(false);
        }, 100);
      }
    }, 80);
    
    return () => clearInterval(typeInterval);
  }, [isComplete]);
  
  // Split the text to apply gradient to "Ritvik Indupuri"
  const splitIndex = "Hi, my name is ".length;
  const beforeName = displayedText.slice(0, splitIndex);
  const name = displayedText.slice(splitIndex);
  
  return (
    <span className="inline-block">
      {beforeName}
      {name && <span className="bg-gradient-cyber bg-clip-text text-transparent">{name}</span>}
      {!isComplete && <span className="animate-pulse ml-1">|</span>}
    </span>
  );
};

const CloudSecurityBackground = () => {
  // Create scattered nodes for a more organic cybersecurity network feel
  const nodes = Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    id: i,
    size: 2 + Math.random() * 3
  }));

  // Connect nearby nodes
  const connections = nodes.flatMap((node, i) => {
    return nodes
      .slice(i + 1)
      .filter(other => {
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 20; // Only connect nearby nodes
      })
      .map(other => ({ from: node, to: other }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Animated gradient for data flow */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          
          {/* Glow filter for nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Network connection lines */}
        {connections.map((conn, i) => (
          <g key={`connection-${i}`}>
            <line
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.2"
            />
            {/* Animated data flow on some connections */}
            {i % 3 === 0 && (
              <motion.line
                x1={`${conn.from.x}%`}
                y1={`${conn.from.y}%`}
                x2={`${conn.to.x}%`}
                y2={`${conn.to.y}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "linear"
                }}
              />
            )}
          </g>
        ))}
        
        {/* Network nodes - particles */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            {/* Node glow */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 2}
              fill="hsl(var(--primary))"
              opacity="0.15"
              filter="url(#glow)"
              animate={{
                r: [node.size * 2, node.size * 3, node.size * 2],
                opacity: [0.15, 0.3, 0.15]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
            {/* Main node */}
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="hsl(var(--primary))"
              opacity="0.6"
            />
          </g>
        ))}
      </svg>
      
      {/* Floating cloud icons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 20}%`,
            top: `${20 + (i % 2) * 30}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        >
          <Cloud className="w-6 h-6 text-primary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' }} />
        </motion.div>
      ))}
      
      {/* Security lock icons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 25}%`,
            top: `${30 + (i % 2) * 25}%`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        >
          <Lock className="w-5 h-5 text-accent" style={{ filter: 'drop-shadow(0 0 6px hsl(var(--accent) / 0.5))' }} />
        </motion.div>
      ))}
    </div>
  );
};

interface HeroProps {
  isOwner: boolean;
}

export const Hero = ({ isOwner }: HeroProps) => {
  const [profileImage, setProfileImage] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cyberBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Cloud Security Background Animation */}
      <CloudSecurityBackground />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Profile Picture */}
          <div className="relative inline-block group">
            <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-glow bg-secondary/50 flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            {isOwner && (
              <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full rounded-full bg-black/60 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-foreground" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Animated Greeting with Typewriter Effect */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-5xl md:text-7xl font-bold font-sans"
          >
            <TypewriterText />
          </motion.h1>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xl md:text-2xl text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-primary">Major:</span>
                <span className="font-mono">Cybersecurity</span>
              </div>
              <span className="hidden md:inline text-primary">•</span>
              <div className="flex items-center gap-2">
                <span className="text-primary">Minor:</span>
                <span className="font-mono">AI/ML</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4 text-lg">
              <div className="flex items-center justify-center gap-4">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png" 
                  alt="Purdue University" 
                  className="h-10"
                />
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-xl">Purdue University</span>
                  <span className="text-primary text-lg">•</span>
                  <span className="font-mono text-primary text-lg">2024-2028</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex items-center justify-center gap-6 pt-6"
          >
            <a
              href="https://github.com/ritvikindupuri"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-full transition-all duration-300 hover:shadow-elegant"
            >
              <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/ritvik-indupuri-4b6037288/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-full transition-all duration-300 hover:shadow-elegant"
            >
              <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">LinkedIn</span>
            </a>
          </motion.div>

          {/* Scroll Indicator - Clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pt-12"
          >
            <button
              onClick={() => {
                const skillsSection = document.getElementById('skills-section');
                skillsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-block animate-bounce cursor-pointer hover:scale-110 transition-transform focus:outline-none"
              aria-label="Scroll to skills section"
            >
              <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-primary rounded-full animate-glow-pulse" />
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
