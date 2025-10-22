import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Camera, Github, Linkedin, Cloud, Lock, ZoomIn, ZoomOut, X } from "lucide-react";
import cyberBg from "@/assets/cyber-bg.jpg";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TypewriterText = () => {
  const fullText = "Hi, my name is Ritvik Indupuri";
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;
    
    const startTyping = () => {
      let currentIndex = 0;
      setIsTyping(true);
      
      intervalId = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Finished typing
          clearInterval(intervalId);
          setIsTyping(false);
          
          // Wait 10 seconds, then reset and type again
          timeoutId = setTimeout(() => {
            setDisplayedText("");
            startTyping();
          }, 10000);
        }
      }, 80);
    };
    
    // Start the first typing animation
    startTyping();
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []); // Only run once on mount
  
  // Split the text to apply gradient to "Ritvik Indupuri"
  const splitIndex = "Hi, my name is ".length;
  const beforeName = displayedText.slice(0, splitIndex);
  const name = displayedText.slice(splitIndex);
  
  return (
    <span className="inline-block">
      {beforeName}
      {name && <span className="bg-gradient-cyber bg-clip-text text-transparent">{name}</span>}
      {isTyping && <span className="animate-pulse ml-1">|</span>}
    </span>
  );
};

const CloudSecurityBackground = () => {
  // Create scattered nodes for a more organic cybersecurity network feel
  const nodes = Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    id: i,
    size: 2 + Math.random() * 3
  }));

  // Connect nearby nodes
  const connections = nodes.flatMap((node, i) => {
    return nodes
      .slice(i + 1)
      .filter(other => {
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 20; // Only connect nearby nodes
      })
      .map(other => ({ from: node, to: other }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Animated gradient for data flow */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          
          {/* Glow filter for nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Network connection lines */}
        {connections.map((conn, i) => (
          <g key={`connection-${i}`}>
            <line
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.2"
            />
            {/* Animated data flow on some connections */}
            {i % 3 === 0 && (
              <motion.line
                x1={`${conn.from.x}%`}
                y1={`${conn.from.y}%`}
                x2={`${conn.to.x}%`}
                y2={`${conn.to.y}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "linear"
                }}
              />
            )}
          </g>
        ))}
        
        {/* Network nodes - particles */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            {/* Node glow */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 2}
              fill="hsl(var(--primary))"
              opacity="0.15"
              filter="url(#glow)"
              animate={{
                r: [node.size * 2, node.size * 3, node.size * 2],
                opacity: [0.15, 0.3, 0.15]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
            {/* Main node */}
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="hsl(var(--primary))"
              opacity="0.6"
            />
          </g>
        ))}
      </svg>
      
      {/* Floating cloud icons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 20}%`,
            top: `${20 + (i % 2) * 30}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        >
          <Cloud className="w-6 h-6 text-primary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' }} />
        </motion.div>
      ))}
      
      {/* Security lock icons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 25}%`,
            top: `${30 + (i % 2) * 25}%`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        >
          <Lock className="w-5 h-5 text-accent" style={{ filter: 'drop-shadow(0 0 6px hsl(var(--accent) / 0.5))' }} />
        </motion.div>
      ))}
    </div>
  );
};

interface HeroProps {
  isOwner: boolean;
}

export const Hero = ({ isOwner }: HeroProps) => {
  const [profileImage, setProfileImage] = useState<string>("");
  const [tempImage, setTempImage] = useState<string>("");
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    fetchProfileImage();
  }, []);

  const fetchProfileImage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single();

    if (data?.profile_image_url) {
      setProfileImage(data.profile_image_url);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      }, 'image/jpeg');
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropDialog(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = async () => {
    if (!croppedAreaPixels || !tempImage) return;

    try {
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ profile_image_url: croppedImage })
        .eq('id', user.id);

      if (error) {
        toast.error("Failed to save profile picture");
        console.error('Error saving profile image:', error);
        return;
      }

      setProfileImage(croppedImage);
      setShowCropDialog(false);
      setTempImage("");
      toast.success("Profile picture updated successfully");
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error("Failed to crop image");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cyberBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Cloud Security Background Animation */}
      <CloudSecurityBackground />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Profile Picture */}
          <div className="relative inline-block group">
            <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-glow bg-secondary/50 flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-20 h-20 text-muted-foreground" />
              )}
            </div>
            {isOwner && (
              <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full rounded-full bg-black/60 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-foreground" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Image Crop Dialog */}
          <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crop Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
                  {tempImage && (
                    <Cropper
                      image={tempImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <ZoomOut className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <ZoomIn className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCropDialog(false);
                      setTempImage("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCroppedImage}>
                    Save Profile Picture
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Animated Greeting with Typewriter Effect */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-5xl md:text-7xl font-bold font-sans"
          >
            <TypewriterText />
          </motion.h1>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-10 pt-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-xl md:text-2xl">
              <div className="flex items-center gap-3 px-6 py-3 bg-card/30 backdrop-blur-sm rounded-2xl border border-primary/20">
                <span className="text-primary font-semibold">Major:</span>
                <span className="font-mono font-medium">Cybersecurity</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-card/30 backdrop-blur-sm rounded-2xl border border-primary/20">
                <span className="text-primary font-semibold">Minor:</span>
                <span className="font-mono font-medium">AI/ML</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4 text-lg pt-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-5 px-8 py-5 bg-card/30 backdrop-blur-sm rounded-2xl border border-primary/20">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/1200px-Purdue_Boilermakers_logo.svg.png" 
                  alt="Purdue University" 
                  className="h-12"
                />
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <span className="font-semibold text-xl">Purdue University</span>
                  <span className="text-primary text-lg hidden md:inline">•</span>
                  <span className="font-mono text-primary text-lg">2024-2028</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex items-center justify-center gap-6 pt-6"
          >
            <a
              href="https://github.com/ritvikindupuri"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-full transition-all duration-300 hover:shadow-elegant"
            >
              <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/ritvik-indupuri-4b6037288/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-full transition-all duration-300 hover:shadow-elegant"
            >
              <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">LinkedIn</span>
            </a>
          </motion.div>

          {/* Scroll Indicator - Clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pt-12 text-center"
          >
            <button
              onClick={() => {
                const skillsSection = document.getElementById('skills-section');
                skillsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-block animate-bounce cursor-pointer hover:scale-110 transition-transform focus:outline-none"
              aria-label="Scroll to skills section"
            >
              <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2 mx-auto">
                <div className="w-1 h-2 bg-primary rounded-full animate-glow-pulse" />
              </div>
            </button>
            <a href="#skills-section" className="mt-3 block text-sm text-muted-foreground hover:text-primary transition-colors">
              Click here to view my skills
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
