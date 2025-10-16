import { motion, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, Github, Linkedin, Cloud, Lock } from "lucide-react";
import cyberBg from "@/assets/cyber-bg.jpg";

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(typeInterval);
        // Reset after a delay to repeat
        setTimeout(() => {
          setDisplayedText("");
          setIsComplete(false);
        }, 2000);
      }
    }, 80);
    
    return () => clearInterval(typeInterval);
  }, [text, isComplete]);
  
  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse ml-1">|</span>}
    </span>
  );
};

const CloudSecurityBackground = () => {
  // Generate consistent positions for connections
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    x: (i % 4) * 25 + 12.5,
    y: Math.floor(i / 4) * 33 + 16.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {/* Grid Lines - Network Infrastructure */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--cyber-purple))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--cyber-purple))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[...Array(4)].map((_, i) => (
          <motion.line
            key={`h-grid-${i}`}
            x1="0%"
            y1={`${i * 25}%`}
            x2="100%"
            y2={`${i * 25}%`}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeOpacity="0.15"
            strokeDasharray="5,5"
          />
        ))}
        
        {/* Vertical grid lines */}
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={`v-grid-${i}`}
            x1={`${i * 25}%`}
            y1="0%"
            x2={`${i * 25}%`}
            y2="100%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeOpacity="0.15"
            strokeDasharray="5,5"
          />
        ))}
        
        {/* Animated connection lines between nodes */}
        {nodes.map((node, i) => {
          const nextNode = nodes[(i + 1) % nodes.length];
          const nextNode2 = nodes[(i + 3) % nodes.length];
          
          return (
            <g key={`connections-${i}`}>
              <motion.line
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${nextNode.x}%`}
                y2={`${nextNode.y}%`}
                stroke="url(#lineGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 0.8, 0.8, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
              {i % 3 === 0 && (
                <motion.line
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${nextNode2.x}%`}
                  y2={`${nextNode2.y}%`}
                  stroke="url(#lineGradient)"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1, 1, 0],
                    opacity: [0, 0.6, 0.6, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    delay: i * 0.4 + 1,
                    ease: "easeInOut"
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Cloud Nodes - Positioned at grid intersections */}
      {nodes.map((node, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute text-cyber-glow"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        >
          <Cloud className="w-10 h-10" />
        </motion.div>
      ))}
      
      {/* Security Lock Icons - Scattered strategically */}
      {nodes.filter((_, i) => i % 2 === 0).map((node, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute text-accent"
          style={{
            left: `${node.x + 10}%`,
            top: `${node.y - 8}%`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        >
          <Lock className="w-7 h-7" />
        </motion.div>
      ))}
      
      {/* Data pulse points */}
      {nodes.filter((_, i) => i % 3 === 0).map((node, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-primary"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          />
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
            <TypewriterText text="Hi, my name is " />
            {" "}
            <span className="bg-gradient-cyber bg-clip-text text-transparent">
              Ritvik Indupuri
            </span>
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
