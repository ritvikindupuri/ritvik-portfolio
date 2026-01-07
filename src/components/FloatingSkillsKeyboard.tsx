import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Brand colors based on tool logos
const getBrandColors = (skillName: string): { bg: string; border: string; shadow: string } => {
  const name = skillName.toLowerCase();
  
  if (name.includes('kali')) return { bg: 'bg-blue-600', border: 'border-blue-500', shadow: 'shadow-blue-500/30' };
  if (name.includes('crowdstrike')) return { bg: 'bg-red-600', border: 'border-red-500', shadow: 'shadow-red-500/30' };
  if (name.includes('splunk')) return { bg: 'bg-green-600', border: 'border-green-500', shadow: 'shadow-green-500/30' };
  if (name.includes('wireshark')) return { bg: 'bg-sky-600', border: 'border-sky-500', shadow: 'shadow-sky-500/30' };
  if (name.includes('nmap')) return { bg: 'bg-indigo-600', border: 'border-indigo-500', shadow: 'shadow-indigo-500/30' };
  if (name.includes('burp')) return { bg: 'bg-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-400/30' };
  if (name.includes('metasploit')) return { bg: 'bg-blue-700', border: 'border-blue-600', shadow: 'shadow-blue-600/30' };
  if (name.includes('hashcat') || name.includes('john')) return { bg: 'bg-amber-500', border: 'border-amber-400', shadow: 'shadow-amber-400/30' };
  if (name.includes('nessus')) return { bg: 'bg-teal-600', border: 'border-teal-500', shadow: 'shadow-teal-500/30' };
  if (name.includes('ghidra')) return { bg: 'bg-rose-600', border: 'border-rose-500', shadow: 'shadow-rose-500/30' };
  if (name.includes('ida')) return { bg: 'bg-purple-600', border: 'border-purple-500', shadow: 'shadow-purple-500/30' };
  if (name.includes('autopsy')) return { bg: 'bg-cyan-700', border: 'border-cyan-600', shadow: 'shadow-cyan-600/30' };
  if (name.includes('volatility')) return { bg: 'bg-emerald-600', border: 'border-emerald-500', shadow: 'shadow-emerald-500/30' };
  if (name.includes('snort') || name.includes('suricata')) return { bg: 'bg-red-500', border: 'border-red-400', shadow: 'shadow-red-400/30' };
  if (name.includes('openvas')) return { bg: 'bg-lime-600', border: 'border-lime-500', shadow: 'shadow-lime-500/30' };
  if (name.includes('aircrack')) return { bg: 'bg-violet-600', border: 'border-violet-500', shadow: 'shadow-violet-500/30' };
  if (name.includes('hydra')) return { bg: 'bg-cyan-600', border: 'border-cyan-500', shadow: 'shadow-cyan-500/30' };
  if (name.includes('nikto')) return { bg: 'bg-fuchsia-600', border: 'border-fuchsia-500', shadow: 'shadow-fuchsia-500/30' };
  if (name.includes('sqlmap')) return { bg: 'bg-yellow-600', border: 'border-yellow-500', shadow: 'shadow-yellow-500/30' };
  if (name.includes('elastic') || name.includes('kibana')) return { bg: 'bg-pink-500', border: 'border-pink-400', shadow: 'shadow-pink-400/30' };
  
  // Fallback based on name hash
  const colors = [
    { bg: 'bg-blue-600', border: 'border-blue-500', shadow: 'shadow-blue-500/30' },
    { bg: 'bg-purple-600', border: 'border-purple-500', shadow: 'shadow-purple-500/30' },
    { bg: 'bg-green-600', border: 'border-green-500', shadow: 'shadow-green-500/30' },
    { bg: 'bg-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-400/30' },
    { bg: 'bg-cyan-600', border: 'border-cyan-500', shadow: 'shadow-cyan-500/30' },
  ];
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const colors = getBrandColors(skill.name);
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ y: 2 }}
    >
      {/* 3D Keycap with depth */}
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Bottom layer - darkest (creates depth) */}
        <div className={`absolute inset-0 translate-y-2.5 ${colors.bg} rounded-lg opacity-40`} 
          style={{ filter: 'brightness(0.3)' }} 
        />
        
        {/* Middle layer - side walls */}
        <div className={`absolute inset-0 translate-y-1.5 ${colors.bg} rounded-lg opacity-60`}
          style={{ filter: 'brightness(0.5)' }}
        />
        
        {/* Top layer - main keycap surface */}
        <div className={`
          relative w-12 h-12 sm:w-14 sm:h-14
          ${colors.bg} ${colors.border}
          rounded-lg border-2
          shadow-lg ${colors.shadow}
          group-hover:shadow-xl
          transition-shadow duration-150
        `}>
          {/* Top highlight gradient */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/30 via-transparent to-black/20" />
          
          {/* Icon container - slightly recessed look */}
          <div className="absolute inset-1.5 rounded-md bg-white/95 flex items-center justify-center shadow-inner">
            {skill.icon ? (
              <img 
                src={skill.icon} 
                alt={skill.name}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            ) : (
              <span className="text-slate-700 font-bold text-sm">
                {skill.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      <div className="
        absolute -bottom-9 left-1/2 -translate-x-1/2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        whitespace-nowrap
        bg-slate-900 text-white text-xs font-medium
        px-2.5 py-1 rounded-md
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
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);

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
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
          {/* Keys grid */}
          <div 
            className="grid gap-2.5"
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
