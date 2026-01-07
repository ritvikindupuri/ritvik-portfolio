import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Brand colors based on tool logos
const getBrandColors = (skillName: string): string => {
  const name = skillName.toLowerCase();
  
  if (name.includes('kali')) return 'bg-blue-600';
  if (name.includes('crowdstrike')) return 'bg-red-600';
  if (name.includes('splunk')) return 'bg-green-600';
  if (name.includes('wireshark')) return 'bg-sky-600';
  if (name.includes('nmap')) return 'bg-indigo-600';
  if (name.includes('burp')) return 'bg-orange-500';
  if (name.includes('metasploit')) return 'bg-blue-700';
  if (name.includes('hashcat') || name.includes('john')) return 'bg-amber-500';
  if (name.includes('nessus')) return 'bg-teal-600';
  if (name.includes('ghidra')) return 'bg-rose-600';
  if (name.includes('ida')) return 'bg-purple-600';
  if (name.includes('autopsy')) return 'bg-cyan-700';
  if (name.includes('volatility')) return 'bg-emerald-600';
  if (name.includes('snort') || name.includes('suricata')) return 'bg-red-500';
  if (name.includes('openvas')) return 'bg-lime-600';
  if (name.includes('aircrack')) return 'bg-violet-600';
  if (name.includes('hydra')) return 'bg-cyan-600';
  if (name.includes('nikto')) return 'bg-fuchsia-600';
  if (name.includes('sqlmap')) return 'bg-yellow-600';
  if (name.includes('elastic') || name.includes('kibana')) return 'bg-pink-500';
  
  const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-500', 'bg-cyan-600'];
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const bgColor = getBrandColors(skill.name);
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Flat keycap */}
      <div className={`
        w-11 h-11 sm:w-12 sm:h-12
        ${bgColor}
        rounded-md
        flex items-center justify-center
        shadow-md
        border border-white/10
        group-hover:brightness-110
        transition-all duration-150
      `}>
        {skill.icon ? (
          <img 
            src={skill.icon} 
            alt={skill.name}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={`text-white font-bold text-xs ${skill.icon ? 'hidden' : ''}`}>
          {skill.name.slice(0, 2).toUpperCase()}
        </span>
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
  
  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

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
      const normalizedX = (e.clientX / window.innerWidth) - 0.5;
      const normalizedY = (e.clientY / window.innerHeight) - 0.5;
      
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
    <div ref={containerRef} className="relative" style={{ perspective: "600px" }}>
      <motion.div
        className="relative"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Keyboard base */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-sm">
          <div 
            className="grid gap-1.5 sm:gap-2"
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
