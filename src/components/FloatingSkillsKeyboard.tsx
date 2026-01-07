import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Brand colors for common cybersecurity tools
const getBrandColor = (skillName: string): string => {
  const name = skillName.toLowerCase();
  
  if (name.includes('crowdstrike')) return 'bg-red-600';
  if (name.includes('splunk')) return 'bg-green-500';
  if (name.includes('wireshark')) return 'bg-blue-600';
  if (name.includes('nmap')) return 'bg-purple-600';
  if (name.includes('burp')) return 'bg-orange-500';
  if (name.includes('metasploit')) return 'bg-blue-700';
  if (name.includes('kali')) return 'bg-slate-700';
  if (name.includes('hashcat') || name.includes('john')) return 'bg-yellow-600';
  if (name.includes('nessus')) return 'bg-cyan-600';
  if (name.includes('ghidra')) return 'bg-red-700';
  if (name.includes('ida')) return 'bg-purple-700';
  if (name.includes('autopsy')) return 'bg-blue-800';
  if (name.includes('volatility')) return 'bg-teal-600';
  if (name.includes('snort') || name.includes('suricata')) return 'bg-rose-600';
  if (name.includes('openvas')) return 'bg-green-600';
  if (name.includes('aircrack')) return 'bg-indigo-600';
  if (name.includes('hydra')) return 'bg-emerald-600';
  if (name.includes('nikto')) return 'bg-violet-600';
  if (name.includes('sqlmap')) return 'bg-amber-600';
  if (name.includes('elastic') || name.includes('kibana')) return 'bg-pink-500';
  
  const fallbackColors = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-emerald-500'
  ];
  
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return fallbackColors[hash % fallbackColors.length];
};

interface KeycapProps {
  skill: Skill;
  index: number;
  row: number;
  col: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, row, col, onClick }: KeycapProps) => {
  const delay = index * 0.05;
  const brandColor = getBrandColor(skill.name);
  const zOffset = (row + col) % 3;
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        y: -6,
        scale: 1.1,
        zIndex: 50,
        transition: { duration: 0.15 },
      }}
      whileTap={{ scale: 0.92, y: 2 }}
      style={{ zIndex: 10 + zOffset }}
    >
      <motion.div
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2.5 + (index % 3) * 0.4,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.08,
          ease: "easeInOut",
        }}
      >
        {/* 3D Keycap */}
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          <div 
            className={`
              relative w-11 h-11 sm:w-12 sm:h-12
              ${brandColor}
              rounded-md cursor-pointer
              shadow-lg
              transition-shadow duration-200
              group-hover:shadow-xl group-hover:shadow-white/15
            `}
          >
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/35 via-white/10 to-transparent" />
            <div className="absolute inset-1 rounded bg-gradient-to-br from-white/15 to-black/20 flex items-center justify-center overflow-hidden">
              {skill.icon ? (
                <img 
                  src={skill.icon} 
                  alt={skill.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-md"
                />
              ) : (
                <span className="text-white font-bold text-xs drop-shadow-md">
                  {skill.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div 
              className={`absolute -bottom-1.5 left-0.5 right-0.5 h-1.5 ${brandColor} rounded-b opacity-50`}
              style={{ filter: 'brightness(0.5)' }}
            />
          </div>
        </div>
        
        {/* Tooltip */}
        <div className="
          absolute -bottom-8 left-1/2 -translate-x-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          whitespace-nowrap
          bg-background/95 backdrop-blur-sm
          text-foreground text-[10px] font-medium
          px-2 py-1 rounded
          shadow-lg border border-border/50
          z-50 pointer-events-none
        ">
          {skill.name}
        </div>
      </motion.div>
    </motion.button>
  );
};

export const FloatingSkillsKeyboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

  useEffect(() => {
    const fetchSecuritySkills = async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, icon")
        .eq("category", "security")
        .order("display_order");

      if (error) {
        console.error("Error fetching security skills:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSkills(data);
      }
      setLoading(false);
    };

    fetchSecuritySkills();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Normalize to -0.5 to 0.5 based on distance from center
      const normalizedX = (e.clientX - centerX) / window.innerWidth;
      const normalizedY = (e.clientY - centerY) / window.innerHeight;
      
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleKeycapClick = (skillId: string) => {
    const skillsSection = document.getElementById('skills-section');
    if (skillsSection) {
      skillsSection.scrollIntoView({ behavior: 'smooth' });
      
      setTimeout(() => {
        const securityTab = document.querySelector('[data-value="security"]') as HTMLElement;
        if (securityTab) {
          securityTab.click();
        }
        
        setTimeout(() => {
          const skillElement = document.querySelector(`[data-skill-id="${skillId}"]`) as HTMLElement;
          if (skillElement) {
            skillElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            skillElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            skillElement.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
              skillElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            }, 3000);
          }
        }, 300);
      }, 600);
    }
  };

  if (loading || skills.length === 0) {
    return null;
  }

  const cols = 4;

  return (
    <div ref={containerRef} className="relative" style={{ perspective: "1000px" }}>
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 -m-6 bg-gradient-radial from-primary/20 via-cyber-purple/10 to-transparent rounded-full blur-2xl opacity-50" />
        
        {/* Keyboard grid */}
        <div 
          className="relative grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {skills.map((skill, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            return (
              <Keycap
                key={skill.id}
                skill={skill}
                index={index}
                row={row}
                col={col}
                onClick={() => handleKeycapClick(skill.id)}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
