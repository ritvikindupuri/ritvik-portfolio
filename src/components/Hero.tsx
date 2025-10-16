import { motion, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, Github, Linkedin, Cloud, Lock } from "lucide-react";
import cyberBg from "@/assets/cyber-bg.jpg";

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 80);
    
    return () => clearInterval(interval);
  }, [text]);
  
  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse ml-1">|</span>}
    </span>
  );
};

const CloudSecurityBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      {/* Floating Cloud Icons */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute text-cyber-glow"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          <Cloud className="w-8 h-8" />
        </motion.div>
      ))}
      
      {/* Network Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="hsl(var(--cyber-purple))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>
      
      {/* Lock/Shield Icons */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute text-accent"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 6 + 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <Lock className="w-6 h-6" />
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
