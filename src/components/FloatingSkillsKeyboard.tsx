import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
}

// Brand colors for each tool - vibrant and matching their logos
const getBrandColor = (skillName: string): string => {
  const name = skillName.toLowerCase();
  
  if (name.includes('crowdstrike')) return 'from-red-500 to-red-600';
  if (name.includes('splunk')) return 'from-green-400 to-green-500';
  if (name.includes('wireshark')) return 'from-blue-400 to-blue-500';
  if (name.includes('nmap')) return 'from-purple-500 to-purple-600';
  if (name.includes('burp')) return 'from-orange-400 to-orange-500';
  if (name.includes('metasploit')) return 'from-blue-500 to-blue-600';
  if (name.includes('kali')) return 'from-slate-600 to-slate-700';
  if (name.includes('hashcat') || name.includes('john')) return 'from-yellow-400 to-yellow-500';
  if (name.includes('nessus')) return 'from-cyan-400 to-cyan-500';
  if (name.includes('ghidra')) return 'from-red-600 to-red-700';
  if (name.includes('ida')) return 'from-purple-600 to-purple-700';
  if (name.includes('autopsy')) return 'from-blue-600 to-blue-700';
  if (name.includes('volatility')) return 'from-teal-400 to-teal-500';
  if (name.includes('snort') || name.includes('suricata')) return 'from-rose-500 to-rose-600';
  if (name.includes('openvas')) return 'from-green-500 to-green-600';
  if (name.includes('aircrack')) return 'from-indigo-500 to-indigo-600';
  if (name.includes('hydra')) return 'from-emerald-400 to-emerald-500';
  if (name.includes('nikto')) return 'from-violet-500 to-violet-600';
  if (name.includes('sqlmap')) return 'from-amber-400 to-amber-500';
  if (name.includes('elastic') || name.includes('kibana')) return 'from-pink-400 to-pink-500';
  
  const fallbackColors = [
    'from-red-400 to-red-500', 'from-orange-400 to-orange-500', 
    'from-yellow-400 to-yellow-500', 'from-green-400 to-green-500',
    'from-teal-400 to-teal-500', 'from-cyan-400 to-cyan-500', 
    'from-blue-400 to-blue-500', 'from-indigo-400 to-indigo-500',
    'from-purple-400 to-purple-500', 'from-pink-400 to-pink-500'
  ];
  
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return fallbackColors[hash % fallbackColors.length];
};

interface KeycapProps {
  skill: Skill;
  index: number;
  onClick: () => void;
}

const Keycap = ({ skill, index, onClick }: KeycapProps) => {
  const delay = index * 0.05;
  const brandColor = getBrandColor(skill.name);
  
  return (
    <motion.button
      onClick={onClick}
      className="relative focus:outline-none group"
      initial={{ opacity: 0, scale: 0, rotateX: -45 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{
        y: -8,
        z: 20,
        scale: 1.15,
        rotateX: -10,
        transition: { duration: 0.15 },
      }}
      whileTap={{ scale: 0.92, y: 4 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        animate={{ 
          y: [0, -4, 0],
          rotateY: [0, 2, 0, -2, 0],
        }}
        transition={{
          duration: 3 + (index % 4) * 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.1,
          ease: "easeInOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 3D Keycap with depth */}
        <div 
          className="relative"
          style={{ 
            transformStyle: "preserve-3d",
            transform: "translateZ(0px)",
          }}
        >
          {/* Key bottom/sides (dark shadow) */}
          <div 
            className="absolute inset-0 bg-slate-900 rounded-lg"
            style={{ transform: "translateZ(-12px)" }}
          />
          
          {/* Key sides */}
          <div 
            className={`absolute inset-0 bg-gradient-to-b ${brandColor} rounded-lg opacity-60`}
            style={{ transform: "translateZ(-6px)" }}
          />
          
          {/* Key top surface with brand color */}
          <div 
            className={`
              relative w-12 h-12 sm:w-14 sm:h-14
              bg-gradient-to-br ${brandColor}
              rounded-lg
              shadow-lg
              group-hover:shadow-2xl
              transition-shadow duration-200
            `}
            style={{ transform: "translateZ(0px)" }}
          >
            {/* Glossy highlight */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
            
            {/* Icon container */}
            <div className="absolute inset-1.5 rounded-md bg-white/90 flex items-center justify-center overflow-hidden shadow-inner">
              {skill.icon ? (
                <img 
                  src={skill.icon} 
                  alt={skill.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                />
              ) : (
                <span className="text-slate-800 font-bold text-sm">
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
          bg-slate-900/95 backdrop-blur-sm
          text-white text-[10px] font-medium
          px-2.5 py-1 rounded-md
          shadow-xl border border-white/10
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
  const randomX = 10 + Math.random() * 80;
  const randomY = 10 + Math.random() * 80;
  const size = 2 + Math.random() * 4;
  const duration = 3 + Math.random() * 4;
  
  const springConfig = { damping: 30, stiffness: 80 };
  const particleX = useSpring(useTransform(mouseX, [-0.5, 0.5], [randomX - 20, randomX + 20]), springConfig);
  const particleY = useSpring(useTransform(mouseY, [-0.5, 0.5], [randomY - 20, randomY + 20]), springConfig);
  
  const colors = ['#00f5ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
  const color = colors[index % colors.length];
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${randomX}%`,
        top: `${randomY}%`,
        x: particleX,
        y: particleY,
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay: index * 0.2,
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
  
  const springConfig = { damping: 20, stiffness: 100 };
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
    <div 
      ref={containerRef} 
      className="relative"
      style={{ perspective: "1200px" }}
    >
      {/* Particle effects */}
      <div className="absolute inset-0 -m-12 overflow-visible pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle key={i} index={i} mouseX={mouseX} mouseY={mouseY} />
        ))}
      </div>

      {/* Keyboard with angle */}
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, rotateX: 30, rotateY: -25, rotateZ: 5 }}
        animate={{ opacity: 1, rotateX: 15, rotateY: -15, rotateZ: 3 }}
        transition={{ delay: 0.3, duration: 1, type: "spring", stiffness: 50 }}
      >
        {/* RGB Glow border - animated */}
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-75 blur-md"
          animate={{
            background: [
              'linear-gradient(90deg, #00f5ff, #a855f7, #22c55e, #00f5ff)',
              'linear-gradient(180deg, #a855f7, #22c55e, #00f5ff, #a855f7)',
              'linear-gradient(270deg, #22c55e, #00f5ff, #a855f7, #22c55e)',
              'linear-gradient(360deg, #00f5ff, #a855f7, #22c55e, #00f5ff)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Keyboard base */}
        <div 
          className="relative p-4 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-slate-700/50"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-xl" />
          
          {/* RGB Strip on edges */}
          <motion.div
            className="absolute inset-x-2 bottom-1 h-0.5 rounded-full"
            animate={{
              background: [
                'linear-gradient(90deg, #00f5ff, #a855f7, #22c55e)',
                'linear-gradient(90deg, #a855f7, #22c55e, #00f5ff)',
                'linear-gradient(90deg, #22c55e, #00f5ff, #a855f7)',
              ],
              boxShadow: [
                '0 0 10px #00f5ff, 0 0 20px #00f5ff',
                '0 0 10px #a855f7, 0 0 20px #a855f7',
                '0 0 10px #22c55e, 0 0 20px #22c55e',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Keys container */}
          <div 
            className="relative grid gap-2 sm:gap-2.5"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              transformStyle: "preserve-3d",
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
        
        {/* Keyboard shadow */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/50 rounded-full blur-xl" />
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
