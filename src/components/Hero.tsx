import React, { useState, useEffect, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { Camera, Github, Linkedin, Brain, Lock, ZoomIn, ZoomOut, X, FileText, Upload, BarChart3 } from "lucide-react";
import cyberBg from "@/assets/cyber-bg.jpg";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";

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
      {name && <span className="text-gradient-cyber">{name}</span>}
      {isTyping && <span className="animate-pulse ml-1 text-primary">|</span>}
    </span>
  );
};

const NeuralNetworkBackground = () => {
  // Neural network layers - create nodes in a layered structure
  const layers = [
    { nodes: 4, x: 10 },
    { nodes: 6, x: 25 },
    { nodes: 8, x: 40 },
    { nodes: 8, x: 55 },
    { nodes: 6, x: 70 },
    { nodes: 4, x: 85 },
  ];

  const allNodes = layers.flatMap((layer, layerIndex) =>
    Array.from({ length: layer.nodes }, (_, i) => ({
      x: layer.x + (Math.random() - 0.5) * 8,
      y: 15 + (i / (layer.nodes - 1 || 1)) * 70 + (Math.random() - 0.5) * 5,
      layerIndex,
      id: `${layerIndex}-${i}`,
      size: 2 + Math.random() * 2,
    }))
  );

  // Connect nodes between adjacent layers
  const connections: { from: typeof allNodes[0]; to: typeof allNodes[0] }[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const currentLayer = allNodes.filter((n) => n.layerIndex === i);
    const nextLayer = allNodes.filter((n) => n.layerIndex === i + 1);
    currentLayer.forEach((node) => {
      nextLayer.forEach((nextNode) => {
        if (Math.random() > 0.4) {
          connections.push({ from: node, to: nextNode });
        }
      });
    });
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Cyan to purple gradient */}
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--cyber-glow))" />
            <stop offset="100%" stopColor="hsl(var(--cyber-purple))" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="neuralGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Neural connections */}
        {connections.map((conn, i) => (
          <g key={`conn-${i}`}>
            <line
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="url(#neuralGradient)"
              strokeWidth="1"
              strokeOpacity="0.15"
            />
            {/* Animated data pulse */}
            {i % 4 === 0 && (
              <motion.circle
                r="3"
                fill="hsl(var(--cyber-glow))"
                filter="url(#neuralGlow)"
                initial={{ 
                  cx: `${conn.from.x}%`, 
                  cy: `${conn.from.y}%`,
                  opacity: 0 
                }}
                animate={{
                  cx: [`${conn.from.x}%`, `${conn.to.x}%`],
                  cy: [`${conn.from.y}%`, `${conn.to.y}%`],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              />
            )}
          </g>
        ))}

        {/* Neural nodes */}
        {allNodes.map((node, i) => (
          <g key={`node-${node.id}`}>
            {/* Outer glow */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 3}
              fill={node.layerIndex % 2 === 0 ? "hsl(var(--cyber-glow))" : "hsl(var(--cyber-purple))"}
              opacity="0.1"
              filter="url(#neuralGlow)"
              animate={{
                r: [node.size * 3, node.size * 4, node.size * 3],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
            {/* Core node */}
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill={node.layerIndex % 2 === 0 ? "hsl(var(--cyber-glow))" : "hsl(var(--cyber-purple))"}
              opacity="0.7"
            />
          </g>
        ))}
      </svg>

      {/* Floating ML/Cyber icons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`brain-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 30}%`,
            top: `${15 + (i % 2) * 60}%`,
          }}
          animate={{
            y: [-15, 15, -15],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        >
          <Brain className="w-8 h-8 text-cyber-purple" style={{ filter: 'drop-shadow(0 0 12px hsl(var(--cyber-purple) / 0.6))' }} />
        </motion.div>
      ))}

      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`lock-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 35}%`,
            top: `${40 + (i % 2) * 30}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          <Lock className="w-6 h-6 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--cyber-glow) / 0.6))' }} />
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
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    // Try to fetch profile with resume first, fallback to any profile
    const { data: profileWithResume } = await supabase
      .from('profiles')
      .select('profile_image_url, resume_url')
      .not('resume_url', 'is', null)
      .limit(1)
      .maybeSingle();

    if (profileWithResume) {
      if (profileWithResume.profile_image_url) {
        setProfileImage(profileWithResume.profile_image_url);
      }
      if (profileWithResume.resume_url) {
        setResumeUrl(profileWithResume.resume_url);
      }
      return;
    }

    // Fallback: get any profile for profile image
    const { data } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .not('profile_image_url', 'is', null)
      .limit(1)
      .maybeSingle();

    if (data?.profile_image_url) {
      setProfileImage(data.profile_image_url);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploadingResume(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload");
        return;
      }

      // Upload to storage
      const fileName = `resume_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload resume");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resume')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error("Failed to save resume URL");
        return;
      }

      setResumeUrl(urlData.publicUrl);
      toast.success("Resume uploaded successfully");
    } catch (error) {
      console.error('Resume upload error:', error);
      toast.error("Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const trackResumeEvent = async (eventType: 'view' | 'download') => {
    try {
      await supabase
        .from('resume_analytics')
        .insert({
          event_type: eventType,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
    } catch (error) {
      console.error('Failed to track resume event:', error);
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
      
      {/* Neural Network Background Animation */}
      <NeuralNetworkBackground />

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
            <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-2 border-primary/50 bg-secondary/30 flex items-center justify-center relative">
              {/* Animated glow ring */}
              <div className="absolute inset-0 rounded-full animate-neural-pulse" />
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover relative z-10" />
              ) : (
                <Camera className="w-20 h-20 text-muted-foreground relative z-10" />
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
            <div className="flex items-center justify-center text-xl md:text-2xl">
              <div className="flex items-center gap-3 px-8 py-4 bg-card/30 backdrop-blur-sm rounded-2xl border border-primary/20">
                <span className="font-mono font-medium">Cybersecurity Major</span>
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

          {/* Social Links & Resume */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-6"
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
            
            {/* Resume Button */}
            {resumeUrl ? (
              <button
                onClick={() => {
                  trackResumeEvent('view');
                  setShowResumeDialog(true);
                }}
                className="group flex items-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 hover:border-primary rounded-full transition-all duration-300 hover:shadow-elegant"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm text-primary">View Resume</span>
              </button>
            ) : isOwner ? (
              <label className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-full transition-all duration-300 hover:shadow-elegant cursor-pointer">
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-sm">{isUploadingResume ? "Uploading..." : "Upload Resume"}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={isUploadingResume}
                />
              </label>
            ) : null}
            
            {/* Owner: Update Resume */}
            {isOwner && resumeUrl && (
              <label className="group flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 rounded-full transition-all duration-300 cursor-pointer">
                <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-xs">{isUploadingResume ? "Uploading..." : "Update"}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={isUploadingResume}
                />
              </label>
            )}
          </motion.div>

          {/* Resume Viewer Dialog */}
          <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
            <DialogContent className="max-w-4xl h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Resume
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 h-full min-h-0">
                <iframe
                  src={resumeUrl}
                  className="w-full h-[calc(85vh-100px)] rounded-lg border border-border"
                  title="Resume"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </a>
                  <a
                    href={resumeUrl}
                    download
                    onClick={() => trackResumeEvent('download')}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Resume Analytics - Owner Only */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="max-w-md mx-auto mt-8"
            >
              <ResumeAnalytics />
            </motion.div>
          )}

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
