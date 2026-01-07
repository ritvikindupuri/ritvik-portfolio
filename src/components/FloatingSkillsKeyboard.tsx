import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  
  // Fallback colors based on index
  const fallbackColors = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-emerald-500'
  ];
  
  // Use a hash of the name to pick a consistent color
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
  const delay = index * 0.06;
  const brandColor = getBrandColor(skill.name);
  
  // Different heights for 3D effect - creates the floating look
  const zOffset = (row + col) % 3;
  const yOffset = zOffset * -4;
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ 
        opacity: 0, 
        scale: 0,
        rotateX: -30,
        rotateY: 20,
        y: 30,
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 150,
        damping: 15,
      }}
      whileHover={{
        y: yOffset - 8,
        scale: 1.08,
        zIndex: 50,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95, y: yOffset + 2 }}
      style={{ zIndex: 10 + zOffset }}
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [yOffset, yOffset - 6, yOffset],
          rotateZ: [-1, 1, -1],
        }}
        transition={{
          duration: 3 + (index % 4) * 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.1,
          ease: "easeInOut",
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* 3D Keycap container */}
        <div 
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "perspective(800px) rotateX(10deg)",
          }}
        >
          {/* Keycap top face */}
          <div 
            className={`
              relative w-14 h-14 md:w-16 md:h-16
              ${brandColor}
              rounded-lg cursor-pointer
              shadow-xl
              transition-shadow duration-200
              group-hover:shadow-2xl group-hover:shadow-white/20
            `}
          >
            {/* Glossy highlight */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
            
            {/* Inner face with icon */}
            <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-white/20 to-black/20 flex items-center justify-center overflow-hidden">
              {skill.icon ? (
                <img 
                  src={skill.icon} 
                  alt={skill.name}
                  className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-lg"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
              ) : (
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  {skill.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Bottom edge for 3D depth */}
            <div 
              className={`absolute -bottom-2 left-1 right-1 h-2 ${brandColor} rounded-b-lg opacity-60`}
              style={{ 
                filter: 'brightness(0.5)',
                transform: 'perspective(100px) rotateX(-45deg)',
              }}
            />
          </div>
          
          {/* Shadow on ground */}
          <div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/30 rounded-full blur-md"
          />
        </div>
        
        {/* Tooltip */}
        <div className="
          absolute -bottom-10 left-1/2 -translate-x-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap
          bg-background/95 backdrop-blur-sm
          text-foreground text-xs font-medium
          px-2.5 py-1.5 rounded-md
          shadow-xl border border-border/50
          z-50
          pointer-events-none
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

  // Calculate grid layout - aim for roughly 4 columns like a numpad
  const cols = 4;
  const rows = Math.ceil(skills.length / cols);

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      style={{
        perspective: "1000px",
      }}
    >
      {/* Keyboard container with 3D perspective */}
      <motion.div
        className="relative"
        initial={{ rotateX: 30, rotateY: -20, rotateZ: 5 }}
        animate={{ rotateX: 15, rotateY: -10, rotateZ: 3 }}
        transition={{ duration: 1, delay: 0.3 }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Ambient glow behind keyboard */}
        <div className="absolute inset-0 -m-8 bg-gradient-radial from-primary/30 via-cyber-purple/20 to-transparent rounded-full blur-3xl opacity-60" />
        
        {/* Keyboard grid */}
        <div 
          className="relative grid gap-3 md:gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            transformStyle: "preserve-3d",
          }}
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
    </motion.div>
  );
};

export default FloatingSkillsKeyboard;
