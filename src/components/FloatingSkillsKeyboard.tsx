import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Web Audio API for keycap sounds
const createKeycapSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return {
    playHover: () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    },
    playClick: () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    }
  };
};

let keycapSound: ReturnType<typeof createKeycapSound> | null = null;
const getKeycapSound = () => {
  if (!keycapSound) {
    keycapSound = createKeycapSound();
  }
  return keycapSound;
};

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const handleHover = useCallback(() => {
    try {
      getKeycapSound().playHover();
    } catch (e) {
      // Audio context may not be available
    }
  }, []);
  
  const handleClick = useCallback(() => {
    try {
      getKeycapSound().playClick();
    } catch (e) {
      // Audio context may not be available
    }
    onClick();
  }, [onClick]);
  
  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -3, transition: { duration: 0.08 } }}
      whileTap={{ y: 1 }}
      title={skill.name}
    >
      {/* 3D Keycap - icon only */}
      <div className="relative">
        {/* Deep shadow for 3D depth */}
        <div className="absolute inset-0 bg-slate-950 rounded-lg translate-y-[4px]" />
        
        {/* Keycap side walls */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg translate-y-[2px]" />
        
        {/* Main keycap top surface */}
        <div className="
          relative
          w-12 h-12 sm:w-14 sm:h-14
          bg-gradient-to-b from-slate-600 via-slate-700 to-slate-750
          rounded-lg
          flex items-center justify-center
          border border-slate-500/40
          group-hover:from-slate-500 group-hover:via-slate-600 group-hover:to-slate-700
          transition-all duration-100
          shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),inset_0_2px_3px_rgba(255,255,255,0.1)]
        ">
          {/* Concave top surface effect */}
          <div className="absolute inset-[3px] rounded-md bg-gradient-to-br from-slate-500/15 via-transparent to-slate-900/25 pointer-events-none" />
          
          {skill.icon ? (
            <img 
              src={skill.icon} 
              alt={skill.name}
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain relative z-10 drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`text-slate-300 font-bold text-sm relative z-10 ${skill.icon ? 'hidden' : ''}`}>
            {skill.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export const FloatingSkillsKeyboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
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
    if (!loading && skills.length > 0 && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, skills, hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth) - 0.5;
      const normalizedY = (e.clientY / window.innerHeight) - 0.5;
      
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, hasAnimated]);

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
    <div ref={containerRef} className="relative pt-8" style={{ perspective: "800px" }}>
      <motion.div
        className="relative"
        style={{ 
          rotateX: hasAnimated ? rotateX : 0, 
          rotateY: hasAnimated ? rotateY : 0, 
          transformStyle: "preserve-3d" 
        }}
        initial={{ opacity: 0, x: 100, rotateY: -15 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.3
        }}
      >
        {/* Keyboard base with depth */}
        <div className="relative">
          {/* Keyboard shadow */}
          <div className="absolute inset-0 bg-slate-950 rounded-xl translate-y-3 blur-md opacity-60" />
          
          {/* Keyboard case */}
          <div className="relative p-4 sm:p-5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border border-slate-600/30 shadow-2xl">
            {/* Inner bezel */}
            <div className="absolute inset-2 rounded-lg border border-slate-700/50 pointer-events-none" />
            
            <div 
              className="grid gap-2 sm:gap-3"
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
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
