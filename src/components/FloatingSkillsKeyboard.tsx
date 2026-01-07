import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const delay = index * 0.04;
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay,
        type: "spring",
        stiffness: 250,
        damping: 20,
      }}
      whileHover={{
        y: -4,
        scale: 1.08,
        zIndex: 50,
        transition: { duration: 0.12 },
      }}
      whileTap={{ scale: 0.9, y: 2 }}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{
          duration: 2 + (index % 3) * 0.3,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.06,
          ease: "easeInOut",
        }}
      >
        {/* Keycap with white/light background for visibility */}
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* Key base (dark) */}
          <div className="absolute inset-0 translate-y-1 bg-slate-800 rounded-md" />
          
          {/* Key top surface (white/cream for visibility) */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-b from-slate-100 to-slate-200 rounded-md shadow-md group-hover:shadow-lg transition-shadow duration-150 border border-slate-300">
            {/* Inner content area */}
            <div className="absolute inset-0.5 rounded flex items-center justify-center overflow-hidden bg-white">
              {skill.icon ? (
                <img 
                  src={skill.icon} 
                  alt={skill.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                />
              ) : (
                <span className="text-slate-700 font-bold text-xs">
                  {skill.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Tooltip */}
        <div className="
          absolute -bottom-7 left-1/2 -translate-x-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          whitespace-nowrap
          bg-slate-900/95 backdrop-blur-sm
          text-white text-[10px] font-medium
          px-2 py-1 rounded
          shadow-lg
          z-50 pointer-events-none
        ">
          {skill.name}
        </div>
      </motion.div>
    </motion.button>
  );
};

// Particle component
const Particle = ({ 
  index, 
  mouseX, 
  mouseY 
}: { 
  index: number; 
  mouseX: ReturnType<typeof useMotionValue<number>>; 
  mouseY: ReturnType<typeof useMotionValue<number>>; 
}) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const size = 2 + Math.random() * 3;
  const duration = 3 + Math.random() * 4;
  
  const springConfig = { damping: 30, stiffness: 100 };
  const particleX = useSpring(useTransform(mouseX, [-0.5, 0.5], [randomX - 15, randomX + 15]), springConfig);
  const particleY = useSpring(useTransform(mouseY, [-0.5, 0.5], [randomY - 15, randomY + 15]), springConfig);
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: particleX,
        top: particleY,
        background: index % 3 === 0 
          ? 'hsl(var(--primary))' 
          : index % 3 === 1 
            ? 'hsl(var(--cyber-purple))' 
            : 'hsl(var(--cyber-glow))',
        boxShadow: `0 0 ${size * 2}px currentColor`,
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0.2, 0.6, 0.2],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay: index * 0.15,
        ease: "easeInOut",
      }}
    />
  );
};

export const FloatingSkillsKeyboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

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

  // Keyboard layout - 4 columns
  const cols = 4;
  const rows = Math.ceil(skills.length / cols);

  return (
    <div ref={containerRef} className="relative" style={{ perspective: "1000px" }}>
      {/* Particle effects layer */}
      <div className="absolute inset-0 -m-8 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} index={i} mouseX={mouseX} mouseY={mouseY} />
        ))}
      </div>

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
        {/* Keyboard base/frame */}
        <div className="relative p-4 sm:p-5 rounded-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border border-slate-600/50">
          {/* Keyboard top bezel highlight */}
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-transparent via-slate-500/30 to-transparent" />
          
          {/* Inner keyboard plate */}
          <div className="relative p-2 sm:p-3 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
            {/* Subtle LED underglow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
            
            {/* Keys grid */}
            <div 
              className="relative grid gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {skills.map((skill, index) => (
                <Keycap
                  key={skill.id}
                  skill={skill}
                  index={index}
                  onClick={() => handleKeycapClick(skill.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Keyboard bottom edge (3D depth) */}
          <div className="absolute -bottom-2 left-2 right-2 h-2 rounded-b-xl bg-slate-900 border-x border-b border-slate-700/50" />
        </div>
        
        {/* Shadow underneath keyboard */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/40 rounded-full blur-xl" />
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
