import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Cloud, Brain, Lock, Edit3, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface AboutProps {
  isOwner: boolean;
}

export const About = ({ isOwner }: AboutProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [aboutText, setAboutText] = useState(
    "I am a passionate cybersecurity student at Purdue University, dedicated to protecting digital assets and building secure systems. My journey in cybersecurity is driven by curiosity and a commitment to staying ahead of emerging threats."
  );
  const [closingText, setClosingText] = useState(
    "I'm constantly learning and applying my knowledge through hands-on projects, exploring everything from penetration testing to security automation. I'm particularly passionate about working in defense, where I can leverage my skills to protect critical infrastructure and contribute to national security. My goal is to make a meaningful impact in safeguarding our digital future."
  );
  const [interests, setInterests] = useState([
    {
      icon: "Cloud",
      title: "Cloud Security",
      description: "Securing cloud infrastructure, implementing IAM policies, and ensuring data protection across distributed systems.",
    },
    {
      icon: "Brain",
      title: "AI/ML in Security",
      description: "Leveraging machine learning for threat detection, anomaly detection, and predictive security analytics.",
    },
    {
      icon: "Lock",
      title: "Security Engineering",
      description: "Building secure applications, conducting security assessments, and implementing defense-in-depth strategies.",
    }
  ]);

  useEffect(() => {
    fetchProfileImage();
  }, []);

  const fetchProfileImage = async () => {
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

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/5 blur-[100px] rounded-full" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-16"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold font-sans text-gradient-cyber">
              About Me
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
          </div>

          {/* Main Content - Profile + Bio */}
          <div className="relative">
            {isOwner && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="ghost"
                className="absolute top-4 right-4 z-20 opacity-70 hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? "Done" : "Edit"}
              </Button>
            )}

            <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">
              {/* Profile Image Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col items-center lg:sticky lg:top-24"
              >
                <div className="relative group">
                  {/* Glow effect behind image */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Profile image container */}
                  <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-primary/30 bg-card shadow-xl">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-6xl font-bold text-primary/50">RI</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick stats / highlight */}
                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Cybersecurity Major</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-primary">
                    <span className="px-2 py-1 bg-primary/10 rounded-full">Purdue '28</span>
                  </div>
                </div>
              </motion.div>

              {/* Bio Content */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                {/* Quote-style intro */}
                <div className="relative">
                  <Quote className="absolute -left-2 -top-2 w-8 h-8 text-primary/30" />
                  <div className="pl-8 pr-8 border-l-2 border-primary/30">
                    {isEditing ? (
                      <Textarea
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        className="min-h-[100px] text-lg bg-secondary/50 border-primary/30 focus:border-primary"
                      />
                    ) : (
                      <p className="text-lg text-muted-foreground leading-relaxed italic">
                        {aboutText}
                      </p>
                    )}
                  </div>
                  
                </div>

                {/* Closing paragraph */}
                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                  {isEditing ? (
                    <Textarea
                      value={closingText}
                      onChange={(e) => setClosingText(e.target.value)}
                      className="min-h-[120px] text-base bg-secondary/50 border-primary/30 focus:border-primary"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {closingText}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Core Interests Section */}
          <div className="space-y-8 pt-8">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-bold text-foreground text-center">
                Core Interests
              </h3>
              {isOwner && (
                <Button
                  onClick={() => setIsEditingInterests(!isEditingInterests)}
                  size="sm"
                  variant="ghost"
                  className="opacity-70 hover:opacity-100"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {isEditingInterests ? "Done" : "Edit"}
                </Button>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {interests.map((interest, index) => {
                const iconMap: Record<string, any> = {
                  Cloud: Cloud,
                  Brain: Brain,
                  Lock: Lock
                };
                const Icon = iconMap[interest.icon];
                const gradients = [
                  "from-primary/20 to-cyber-purple/20",
                  "from-cyber-purple/20 to-accent/20",
                  "from-accent/20 to-primary/20"
                ];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                    className="group/card relative"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % 3]} rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl`} />
                    <div className="relative bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/40 transition-all duration-500 h-full space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        {isEditingInterests ? (
                          <input
                            value={interest.title}
                            onChange={(e) => {
                              const newInterests = [...interests];
                              newInterests[index].title = e.target.value;
                              setInterests(newInterests);
                            }}
                            className="text-lg font-semibold text-foreground bg-transparent border-b border-primary/30 focus:border-primary outline-none flex-1"
                          />
                        ) : (
                          <h4 className="text-lg font-semibold text-foreground">{interest.title}</h4>
                        )}
                      </div>
                      {isEditingInterests ? (
                        <Textarea
                          value={interest.description}
                          onChange={(e) => {
                            const newInterests = [...interests];
                            newInterests[index].description = e.target.value;
                            setInterests(newInterests);
                          }}
                          className="text-sm leading-relaxed bg-secondary/50 border-primary/30 focus:border-primary min-h-[80px]"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">{interest.description}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};