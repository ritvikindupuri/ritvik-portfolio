import { motion } from "framer-motion";
import { useState } from "react";
import { User, Cloud, Brain, Lock, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AboutProps {
  isOwner: boolean;
}

export const About = ({ isOwner }: AboutProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [aboutText, setAboutText] = useState(
    "I am a passionate cybersecurity student at Purdue University, dedicated to protecting digital assets and building secure systems. My journey in cybersecurity is driven by curiosity and a commitment to staying ahead of emerging threats."
  );
  const [closingText, setClosingText] = useState(
    "I'm constantly learning and applying my knowledge through hands-on projects, exploring everything from penetration testing to security automation. My goal is to contribute to making the digital world safer for everyone."
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

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-16"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
            >
              <User className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              About Me
            </h2>
            <div className="w-24 h-1 bg-gradient-cyber mx-auto rounded-full" />
          </div>

          {/* Main Content Card */}
          <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-12 shadow-elegant border border-border/50 hover:border-primary/30 transition-all duration-500 relative group">
            {isOwner && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="ghost"
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? "Done" : "Edit"}
              </Button>
            )}

            <div className="space-y-10 text-lg text-muted-foreground leading-relaxed">
              {isEditing ? (
                <Textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="min-h-[100px] text-lg bg-secondary/50 border-primary/30 focus:border-primary"
                />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-center text-xl"
                >
                  {aboutText}
                </motion.p>
              )}
              
              {/* Core Interests */}
              <div className="space-y-8">
                <div className="flex items-center justify-center gap-3 relative">
                  <h3 className="text-3xl font-bold text-foreground text-center flex items-center justify-center gap-3">
                    <span className="text-primary text-4xl">•</span>
                    <span>Core Interests</span>
                  </h3>
                  {isOwner && (
                    <Button
                      onClick={() => setIsEditingInterests(!isEditingInterests)}
                      size="sm"
                      variant="ghost"
                      className="ml-2"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {isEditingInterests ? "Done" : "Edit"}
                    </Button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {interests.map((interest, index) => {
                    const iconMap: Record<string, any> = {
                      Cloud: Cloud,
                      Brain: Brain,
                      Lock: Lock
                    };
                    const Icon = iconMap[interest.icon];
                    const gradients = [
                      "from-blue-500/20 to-cyan-500/20",
                      "from-purple-500/20 to-pink-500/20",
                      "from-green-500/20 to-emerald-500/20"
                    ];
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15, duration: 0.5 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className="group/card relative"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % 3]} rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl`} />
                        <div className="relative bg-secondary/40 backdrop-blur-sm rounded-xl p-8 border border-border hover:border-primary/40 transition-all duration-500 h-full space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300">
                              <Icon className="w-7 h-7 text-primary" />
                            </div>
                            {isEditingInterests ? (
                              <input
                                value={interest.title}
                                onChange={(e) => {
                                  const newInterests = [...interests];
                                  newInterests[index].title = e.target.value;
                                  setInterests(newInterests);
                                }}
                                className="text-xl font-bold text-primary bg-transparent border-b border-primary/30 focus:border-primary outline-none"
                              />
                            ) : (
                              <h4 className="text-xl font-bold text-primary">{interest.title}</h4>
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
                            <p className="text-sm leading-relaxed">{interest.description}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {isEditing ? (
                <Textarea
                  value={closingText}
                  onChange={(e) => setClosingText(e.target.value)}
                  className="min-h-[100px] text-lg bg-secondary/50 border-primary/30 focus:border-primary"
                />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center text-xl"
                >
                  {closingText}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
