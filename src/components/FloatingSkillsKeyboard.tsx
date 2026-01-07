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
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
}

const Keycap = ({ skill, index, position, rotation }: KeycapProps) => {
  const delay = index * 0.1;
  
  // Generate a vibrant color based on index
  const colors = [
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-yellow-500 to-yellow-600",
    "from-green-500 to-green-600",
    "from-teal-500 to-teal-600",
    "from-cyan-500 to-cyan-600",
    "from-blue-500 to-blue-600",
    "from-indigo-500 to-indigo-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-rose-500 to-rose-600",
    "from-emerald-500 to-emerald-600",
  ];
  
  const colorClass = colors[index % colors.length];
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${50 + position.x}%`,
        top: `${50 + position.y}%`,
        zIndex: Math.round(position.z + 10),
      }}
      initial={{ 
        opacity: 0, 
        scale: 0,
        rotateX: 45,
        rotateY: 45,
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: rotation.x,
        rotateY: rotation.y,
        y: [0, -8, 0],
        x: [0, position.x > 0 ? 3 : -3, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: delay + Math.random(),
          ease: "easeInOut",
        },
        x: {
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: delay + Math.random() * 0.5,
          ease: "easeInOut",
        },
      }}
      whileHover={{
        scale: 1.15,
        rotateX: 0,
        rotateY: 0,
        zIndex: 100,
        transition: { duration: 0.2 },
      }}
    >
      {/* 3D Keycap */}
      <div 
        className={`
          relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
          bg-gradient-to-br ${colorClass}
          rounded-lg cursor-pointer
          shadow-lg hover:shadow-xl
          transition-shadow duration-200
          group
        `}
        style={{
          transformStyle: "preserve-3d",
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Top face of keycap */}
        <div 
          className="absolute inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-md flex items-center justify-center overflow-hidden"
          style={{
            transform: "translateZ(4px)",
          }}
        >
          {skill.icon ? (
            <img 
              src={skill.icon} 
              alt={skill.name}
              className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 object-contain drop-shadow-md"
            />
          ) : (
            <span className="text-white font-bold text-xs md:text-sm">
              {skill.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Side shadow for 3D effect */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 rounded-b-lg"
          style={{
            transform: "translateZ(-4px) translateY(4px)",
          }}
        />
        
        {/* Tooltip */}
        <div className="
          absolute -bottom-8 left-1/2 -translate-x-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap
          bg-background/90 backdrop-blur-sm
          text-foreground text-xs
          px-2 py-1 rounded-md
          shadow-lg border border-border/50
          z-50
        ">
          {skill.name}
        </div>
      </div>
    </motion.div>
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

  // Calculate positions for a floating keyboard-like arrangement
  const keyPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = [];
    const totalKeys = skills.length;
    
    if (totalKeys === 0) return positions;

    // Create a more organic floating arrangement
    const cols = Math.ceil(Math.sqrt(totalKeys));
    const rows = Math.ceil(totalKeys / cols);
    
    skills.forEach((_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Offset odd rows for a more organic look
      const xOffset = row % 2 === 1 ? 4 : 0;
      
      // Base positions with some randomness
      const baseX = (col - cols / 2) * 18 + xOffset;
      const baseY = (row - rows / 2) * 18;
      
      // Add slight randomness for organic feel
      const randomX = (Math.random() - 0.5) * 6;
      const randomY = (Math.random() - 0.5) * 6;
      const randomZ = Math.random() * 5;
      
      positions.push({
        x: baseX + randomX,
        y: baseY + randomY,
        z: randomZ,
      });
    });

    return positions;
  }, [skills]);

  // Generate rotations for 3D effect
  const keyRotations = useMemo(() => {
    return skills.map((_, index) => ({
      x: -15 + Math.random() * 10,
      y: -10 + (index % 3) * 10,
    }));
  }, [skills]);

  if (loading || skills.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-72 md:h-80 lg:h-96 mt-8">
      {/* Glow effect behind keys */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-radial from-primary/20 via-cyber-purple/10 to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* Floating keycaps */}
      <div className="relative w-full h-full">
        {skills.map((skill, index) => (
          <Keycap
            key={skill.id}
            skill={skill}
            index={index}
            position={keyPositions[index] || { x: 0, y: 0, z: 0 }}
            rotation={keyRotations[index] || { x: 0, y: 0 }}
          />
        ))}
      </div>
    </div>
  );
};

export default FloatingSkillsKeyboard;
