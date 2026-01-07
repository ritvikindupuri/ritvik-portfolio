import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

interface KeycapProps {
  skill: Skill;
  index: number;
  total: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, total, onClick }: KeycapProps) => {
  const delay = index * 0.08;
  
  // Cyber-themed colors
  const colors = [
    "from-cyan-500 to-cyan-600",
    "from-emerald-500 to-emerald-600",
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-teal-500 to-teal-600",
    "from-indigo-500 to-indigo-600",
    "from-sky-500 to-sky-600",
    "from-purple-500 to-purple-600",
    "from-green-500 to-green-600",
    "from-fuchsia-500 to-fuchsia-600",
    "from-blue-600 to-indigo-600",
    "from-cyan-600 to-teal-600",
  ];
  
  const colorClass = colors[index % colors.length];
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
      initial={{ 
        opacity: 0, 
        scale: 0,
        y: 20,
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
      }}
      transition={{
        opacity: { duration: 0.4, delay },
        scale: { duration: 0.4, delay, type: "spring", stiffness: 200 },
        y: { duration: 0.4, delay },
      }}
      whileHover={{
        scale: 1.1,
        y: -4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Floating animation wrapper */}
      <motion.div
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2 + (index % 3) * 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.15,
          ease: "easeInOut",
        }}
      >
        {/* 3D Keycap */}
        <div 
          className={`
            relative w-12 h-12 sm:w-14 sm:h-14
            bg-gradient-to-br ${colorClass}
            rounded-lg cursor-pointer
            shadow-lg hover:shadow-xl hover:shadow-primary/20
            transition-shadow duration-200
            group
          `}
          style={{
            transformStyle: "preserve-3d",
            transform: "perspective(500px) rotateX(-8deg)",
          }}
        >
          {/* Top face of keycap */}
          <div 
            className="absolute inset-1 bg-gradient-to-br from-white/25 to-transparent rounded-md flex items-center justify-center overflow-hidden"
          >
            {skill.icon ? (
              <img 
                src={skill.icon} 
                alt={skill.name}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-md"
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {skill.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Bottom edge for 3D effect */}
          <div className="absolute -bottom-1 left-0.5 right-0.5 h-1.5 bg-black/40 rounded-b-lg" />
          
          {/* Tooltip */}
          <div className="
            absolute -bottom-9 left-1/2 -translate-x-1/2
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            whitespace-nowrap
            bg-background/95 backdrop-blur-sm
            text-foreground text-xs font-medium
            px-2.5 py-1 rounded-md
            shadow-lg border border-border/50
            z-50
            pointer-events-none
          ">
            {skill.name}
            <span className="block text-[10px] text-primary/80 mt-0.5">Click to view</span>
          </div>
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

  const handleKeycapClick = (skillId: string, skillName: string) => {
    // Scroll to skills section
    const skillsSection = document.getElementById('skills-section');
    if (skillsSection) {
      skillsSection.scrollIntoView({ behavior: 'smooth' });
      
      // After scrolling, highlight the specific skill
      setTimeout(() => {
        // Try to find and click the security tab first
        const securityTab = document.querySelector('[data-value="security"]') as HTMLElement;
        if (securityTab) {
          securityTab.click();
        }
        
        // Then highlight the specific skill card
        setTimeout(() => {
          const skillElement = document.querySelector(`[data-skill-id="${skillId}"]`) as HTMLElement;
          if (skillElement) {
            skillElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            skillElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            skillElement.style.transition = 'all 0.3s ease';
            
            // Remove highlight after 3 seconds
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

  return (
    <div className="relative w-full py-6">
      {/* Section label */}
      <motion.p 
        className="text-center text-sm text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-primary font-medium">Cybersecurity Tools</span> — Click to explore
      </motion.p>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-md h-32 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-2xl" />
      </div>
      
      {/* Grid layout for keycaps */}
      <div className="relative flex flex-wrap justify-center gap-3 sm:gap-4 max-w-lg mx-auto px-4">
        {skills.map((skill, index) => (
          <Keycap
            key={skill.id}
            skill={skill}
            index={index}
            total={skills.length}
            onClick={() => handleKeycapClick(skill.id, skill.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
