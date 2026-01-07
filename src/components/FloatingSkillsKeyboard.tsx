import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, Reorder } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
  display_order: number | null;
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
  isDragging?: boolean;
}

const Keycap = ({ skill, index, onClick, isDragging }: KeycapProps) => {
  const hasPlayedHoverSound = useRef(false);
  
  const handleMouseEnter = useCallback(() => {
    if (!hasPlayedHoverSound.current && !isDragging) {
      hasPlayedHoverSound.current = true;
      try {
        getKeycapSound().playHover();
      } catch (e) {
        // Audio context may not be available
      }
    }
  }, [isDragging]);
  
  const handleMouseLeave = useCallback(() => {
    hasPlayedHoverSound.current = false;
  }, []);
  
  const handleClick = useCallback(() => {
    if (isDragging) return;
    try {
      getKeycapSound().playClick();
    } catch (e) {
      // Audio context may not be available
    }
    onClick();
  }, [onClick, isDragging]);
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative focus:outline-none group touch-none"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, scale: 0.9, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.2, 
              delay: index * 0.03,
              y: { type: "spring", stiffness: 400, damping: 15 }
            }}
            whileHover={{ 
              y: -3, 
              transition: { duration: 0.1, ease: "easeOut" } 
            }}
            whileTap={{ 
              y: 8,
              scale: 0.92,
              transition: { duration: 0.04, ease: "easeIn" } 
            }}
          >
            {/* 3D Keycap with real depth */}
            <div 
              className="relative"
              style={{ 
                transformStyle: "preserve-3d",
                transform: "translateZ(0px)"
              }}
            >
              {/* Keycap stem/base - bottom layer */}
              <div 
                className="absolute inset-0 rounded-md"
                style={{ 
                  transform: "translateZ(-14px)",
                  background: "hsl(230 25% 7%)"
                }} 
              />
              
              {/* Front face */}
              <div 
                className="absolute left-0 right-0"
                style={{ 
                  height: "14px",
                  bottom: "0",
                  transformOrigin: "bottom",
                  transform: "rotateX(-90deg)",
                  borderRadius: "0 0 6px 6px",
                  background: "linear-gradient(to bottom, hsl(230 20% 25%), hsl(230 20% 18%))"
                }} 
              />
              
              {/* Right side face */}
              <div 
                className="absolute top-0 bottom-0"
                style={{ 
                  width: "14px",
                  right: "0",
                  transformOrigin: "right",
                  transform: "rotateY(90deg)",
                  borderRadius: "0 6px 6px 0",
                  background: "linear-gradient(to left, hsl(230 20% 22%), hsl(230 20% 16%))"
                }} 
              />
              
              {/* Left side face */}
              <div 
                className="absolute top-0 bottom-0"
                style={{ 
                  width: "14px",
                  left: "0",
                  transformOrigin: "left",
                  transform: "rotateY(-90deg)",
                  borderRadius: "6px 0 0 6px",
                  background: "linear-gradient(to right, hsl(230 20% 28%), hsl(230 20% 20%))"
                }} 
              />
              
              {/* Back face */}
              <div 
                className="absolute left-0 right-0"
                style={{ 
                  height: "14px",
                  top: "0",
                  transformOrigin: "top",
                  transform: "rotateX(90deg)",
                  borderRadius: "6px 6px 0 0",
                  background: "linear-gradient(to top, hsl(230 20% 20%), hsl(230 20% 16%))"
                }} 
              />
              
              {/* Main keycap top surface */}
              <div 
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-md flex items-center justify-center transition-all duration-100"
                style={{ 
                  transformStyle: "preserve-3d",
                  background: "linear-gradient(135deg, hsl(230 20% 22%) 0%, hsl(230 20% 16%) 100%)",
                  boxShadow: "inset 0 1px 0 hsl(230 20% 30%), inset 0 -1px 0 hsl(230 25% 10%)"
                }}
              >
                {/* Top surface highlight */}
                <div 
                  className="absolute inset-[3px] rounded pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, hsl(185 100% 50% / 0.08) 0%, transparent 50%, hsl(230 25% 4% / 0.3) 100%)"
                  }}
                />
                
                {/* Inner shadow for concave look */}
                <div 
                  className="absolute inset-[2px] rounded pointer-events-none"
                  style={{
                    boxShadow: "inset 0 3px 6px hsl(230 25% 4% / 0.3), inset 0 -1px 3px hsl(185 100% 50% / 0.1)"
                  }}
                />
                
                {skill.icon ? (
                  <img 
                    src={skill.icon} 
                    alt={skill.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain relative z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                    style={{ filter: "drop-shadow(0 1px 2px hsl(230 25% 4% / 0.5))" }}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span 
                  className={`font-bold text-sm relative z-10 ${skill.icon ? 'hidden' : ''}`}
                  style={{ color: "hsl(185 100% 50%)", textShadow: "0 0 8px hsl(185 100% 50% / 0.4)" }}
                >
                  {skill.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          sideOffset={8}
          className="bg-card/95 backdrop-blur-sm border-accent/30 text-foreground font-medium px-3 py-1.5 z-[200]"
        >
          {skill.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface FloatingSkillsKeyboardProps {
  isOwner?: boolean;
}

export const FloatingSkillsKeyboard = ({ isOwner = false }: FloatingSkillsKeyboardProps) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 150 };
  const parallaxRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [25, 15]), springConfig);
  const parallaxRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, -5]), springConfig);

  const fetchSecuritySkills = useCallback(async () => {
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, icon, display_order")
      .eq("category", "security")
      .order("display_order");

    if (error) {
      console.error("Error fetching security skills:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setSkills(data);
    } else {
      setSkills([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSecuritySkills();

    // Subscribe to realtime changes on skills table
    const channel = supabase
      .channel('skills-keyboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skills' },
        (payload) => {
          // Re-fetch skills on any change
          fetchSecuritySkills();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSecuritySkills]);

  useEffect(() => {
    if (!loading && skills.length > 0 && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, skills, hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth) - 0.5;
      const normalizedY = (e.clientY / window.innerHeight) - 0.5;
      
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, hasAnimated, isDragging]);

  const handleKeycapClick = (skillId: string) => {
    if (isDragging) return;
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

  const handleReorder = async (newOrder: Skill[]) => {
    setSkills(newOrder);
    
    // Save new order to database
    try {
      const updates = newOrder.map((skill, index) => 
        supabase
          .from('skills')
          .update({ display_order: index })
          .eq('id', skill.id)
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Failed to save key order:', error);
      toast.error('Failed to save key order');
      fetchSecuritySkills(); // Revert on error
    }
  };

  if (loading || skills.length === 0) return null;

  const keysPerRow = Math.min(skills.length, 8);

  return (
    <div ref={containerRef} className="relative pt-4" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative"
        style={{ 
          transformStyle: "preserve-3d",
          rotateX: isDragging ? 20 : parallaxRotateX,
          rotateY: isDragging ? -10 : parallaxRotateY,
          rotateZ: 1,
        }}
        initial={{ opacity: 0, x: 100, rotateY: -25 }}
        animate={{ opacity: 1, x: 0 }}
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
            className="absolute inset-0 rounded-xl blur-xl"
            style={{ 
              transform: "translateZ(-20px) translateY(15px)",
              background: "hsl(230 25% 2% / 0.6)"
            }}
          />
          
          {/* Keyboard case bottom */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{ 
              transform: "translateZ(-8px)",
              background: "hsl(230 25% 7%)"
            }}
          />
          
          {/* Keyboard case */}
          <div 
            className="relative p-3 sm:p-4 rounded-xl border shadow-2xl"
            style={{ 
              transformStyle: "preserve-3d",
              background: "linear-gradient(135deg, hsl(230 20% 14%) 0%, hsl(230 25% 9%) 100%)",
              borderColor: "hsl(230 20% 20%)"
            }}
          >
            {/* Inner bezel with subtle glow */}
            <div 
              className="absolute inset-2 rounded-lg pointer-events-none"
              style={{ 
                border: "1px solid hsl(185 100% 50% / 0.1)",
                boxShadow: "inset 0 0 20px hsl(185 100% 50% / 0.03)"
              }}
            />
            
            {/* Owner drag hint */}
            {isOwner && (
              <div className="absolute -top-6 left-0 right-0 text-center">
                <span className="text-xs text-muted-foreground/60">Drag keys to reorder</span>
              </div>
            )}
            
            {/* Key layout - Reorderable for owner */}
            {isOwner ? (
              <Reorder.Group
                axis="x"
                values={skills}
                onReorder={handleReorder}
                className="flex flex-wrap gap-2 sm:gap-2.5 justify-center"
                style={{ 
                  transformStyle: "preserve-3d",
                  maxWidth: `${keysPerRow * 56}px`
                }}
              >
                {skills.map((skill, index) => (
                  <Reorder.Item
                    key={skill.id}
                    value={skill}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => {
                      setTimeout(() => setIsDragging(false), 100);
                    }}
                    className="cursor-grab active:cursor-grabbing"
                    whileDrag={{ scale: 1.1, zIndex: 50 }}
                  >
                    <Keycap
                      skill={skill}
                      index={index}
                      onClick={() => handleKeycapClick(skill.id)}
                      isDragging={isDragging}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div 
                className="flex flex-wrap gap-2 sm:gap-2.5 justify-center"
                style={{ 
                  transformStyle: "preserve-3d",
                  maxWidth: `${keysPerRow * 56}px`
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
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingSkillsKeyboard;