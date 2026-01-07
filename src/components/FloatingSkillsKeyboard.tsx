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
      style={{ transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -4, transition: { duration: 0.08 } }}
      whileTap={{ y: 2 }}
      title={skill.name}
    >
      {/* 3D Keycap with visible depth */}
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Bottom face - visible from angle */}
        <div 
          className="absolute inset-0 bg-slate-900 rounded-lg"
          style={{ 
            transform: "translateZ(-12px)",
          }} 
        />
        
        {/* Front face - visible when tilted */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-slate-700 to-slate-900 origin-bottom rounded-b-lg"
          style={{ 
            transform: "rotateX(-90deg) translateZ(0px)",
          }} 
        />
        
        {/* Left side face */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-slate-800 to-slate-700 origin-left rounded-l-lg"
          style={{ 
            transform: "rotateY(90deg) translateZ(0px)",
          }} 
        />
        
        {/* Main keycap top surface */}
        <div className="
          relative
          w-14 h-14 sm:w-16 sm:h-16
          bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700
          rounded-lg
          flex items-center justify-center
          border border-slate-400/30
          group-hover:from-slate-400 group-hover:via-slate-500 group-hover:to-slate-600
          transition-all duration-100
          shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3),inset_0_3px_6px_rgba(255,255,255,0.15)]
        ">
          {/* Concave/dished top surface */}
          <div className="absolute inset-[4px] rounded-md bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
          
          {skill.icon ? (
            <img 
              src={skill.icon} 
              alt={skill.name}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain relative z-10 drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`text-slate-200 font-bold text-base relative z-10 ${skill.icon ? 'hidden' : ''}`}>
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
    <div ref={containerRef} className="relative pt-4" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative"
        style={{ 
          transformStyle: "preserve-3d",
          rotateX: 25, // Fixed tilt - looking down at keyboard
          rotateY: -15, // Slight angle to the left
          rotateZ: 2, // Slight rotation for natural look
        }}
        initial={{ opacity: 0, x: 100, rotateY: -30 }}
        animate={{ opacity: 1, x: 0, rotateY: -15 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.3
        }}
      >
        {/* Keyboard base with depth */}
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* Keyboard shadow on surface */}
          <div 
            className="absolute inset-0 bg-black/40 rounded-xl blur-xl"
            style={{ transform: "translateZ(-20px) translateY(15px)" }}
          />
          
          {/* Keyboard case bottom */}
          <div 
            className="absolute inset-0 bg-slate-900 rounded-xl"
            style={{ transform: "translateZ(-8px)" }}
          />
          
          {/* Keyboard case */}
          <div 
            className="relative p-4 sm:p-5 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-500/30 shadow-2xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Inner bezel */}
            <div className="absolute inset-2 rounded-lg border border-slate-600/40 pointer-events-none" />
            
            <div 
              className="grid gap-2.5 sm:gap-3"
              style={{ 
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                transformStyle: "preserve-3d"
              }}
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
