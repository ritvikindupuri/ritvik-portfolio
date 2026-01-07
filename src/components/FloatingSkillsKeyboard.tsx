import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Lighter keycap colors for better icon visibility
const getKeycapColor = (skillName: string): string => {
  const name = skillName.toLowerCase();
  
  // Use lighter shades so icons are visible
  if (name.includes('kali')) return 'bg-slate-700';
  if (name.includes('crowdstrike')) return 'bg-slate-700';
  if (name.includes('splunk')) return 'bg-slate-700';
  if (name.includes('wireshark')) return 'bg-slate-700';
  if (name.includes('nmap')) return 'bg-slate-700';
  if (name.includes('burp')) return 'bg-slate-700';
  if (name.includes('metasploit')) return 'bg-slate-700';
  if (name.includes('hashcat') || name.includes('john')) return 'bg-slate-700';
  if (name.includes('nessus')) return 'bg-slate-700';
  if (name.includes('ghidra')) return 'bg-slate-700';
  if (name.includes('ida')) return 'bg-slate-700';
  if (name.includes('autopsy')) return 'bg-slate-700';
  if (name.includes('volatility')) return 'bg-slate-700';
  if (name.includes('snort') || name.includes('suricata')) return 'bg-slate-700';
  if (name.includes('openvas')) return 'bg-slate-700';
  if (name.includes('aircrack')) return 'bg-slate-700';
  if (name.includes('hydra')) return 'bg-slate-700';
  if (name.includes('nikto')) return 'bg-slate-700';
  if (name.includes('sqlmap')) return 'bg-slate-700';
  if (name.includes('elastic') || name.includes('kibana')) return 'bg-slate-700';
  if (name.includes('sentinel')) return 'bg-slate-700';
  
  return 'bg-slate-700';
};

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const bgColor = getKeycapColor(skill.name);
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -2, transition: { duration: 0.1 } }}
      whileTap={{ y: 2 }}
    >
      {/* 3D Keycap with depth */}
      <div className="relative">
        {/* Keycap shadow/base for 3D effect */}
        <div className="absolute inset-0 bg-slate-900 rounded-md translate-y-1" />
        
        {/* Main keycap surface */}
        <div className={`
          relative
          w-12 h-12 sm:w-14 sm:h-14
          ${bgColor}
          rounded-md
          flex items-center justify-center
          border-t border-l border-slate-600
          border-b-2 border-r-2 border-b-slate-900 border-r-slate-800
          group-hover:bg-slate-600
          transition-colors duration-150
        `}>
          {/* Inner highlight for keycap look */}
          <div className="absolute inset-1 rounded-sm bg-gradient-to-br from-slate-600/30 to-transparent pointer-events-none" />
          
          {skill.icon ? (
            <img 
              src={skill.icon} 
              alt={skill.name}
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain relative z-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`text-white font-bold text-sm relative z-10 ${skill.icon ? 'hidden' : ''}`}>
            {skill.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Tooltip - positioned above with proper z-index */}
      <div className="
        absolute -top-10 left-1/2 -translate-x-1/2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        whitespace-nowrap
        bg-slate-900 text-white text-xs font-medium
        px-3 py-1.5 rounded-md
        shadow-lg border border-slate-700
        z-[100] pointer-events-none
      ">
        {skill.name}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-slate-900" />
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
    // Enable mouse tracking after entrance animation completes
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
    <div ref={containerRef} className="relative overflow-visible" style={{ perspective: "800px" }}>
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
          <div className="absolute inset-0 bg-slate-950 rounded-xl translate-y-2 blur-sm" />
          
          {/* Main keyboard body */}
          <div className="relative p-4 sm:p-5 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
            <div 
              className="grid gap-2 sm:gap-2.5"
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
