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
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      whileTap={{ y: 1 }}
    >
      {/* Clean keycap design */}
      <div className="relative">
        {/* Key shadow/depth */}
        <div className="absolute inset-0 translate-y-1 bg-slate-700 rounded-md" />
        
        {/* Key top */}
        <div className="relative w-12 h-12 bg-slate-800 rounded-md border border-slate-600 group-hover:border-slate-500 transition-colors">
          {/* Inner white area with icon */}
          <div className="absolute inset-1 rounded bg-slate-100 flex items-center justify-center">
            {skill.icon ? (
              <img 
                src={skill.icon} 
                alt={skill.name}
                className="w-7 h-7 object-contain"
              />
            ) : (
              <span className="text-slate-700 font-semibold text-xs">
                {skill.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      <div className="
        absolute -bottom-8 left-1/2 -translate-x-1/2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        whitespace-nowrap
        bg-slate-900 text-white text-xs font-medium
        px-2 py-1 rounded
        z-50 pointer-events-none
      ">
        {skill.name}
      </div>
    </motion.button>
  );
};

export const FloatingSkillsKeyboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

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
        if (securityTab) securityTab.click();
        
        setTimeout(() => {
          const skillElement = document.querySelector(`[data-skill-id="${skillId}"]`) as HTMLElement;
          if (skillElement) {
            skillElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            skillElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            setTimeout(() => {
              skillElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            }, 3000);
          }
        }, 300);
      }, 600);
    }
  };

  if (loading || skills.length === 0) return null;

  const cols = 4;

  return (
    <div ref={containerRef} className="relative" style={{ perspective: "800px" }}>
      <motion.div
        className="relative"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Keyboard frame */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
          {/* Keys grid */}
          <div 
            className="grid gap-2"
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
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
