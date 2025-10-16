import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface AboutProps {
  isOwner: boolean;
}

export const About = ({ isOwner }: AboutProps) => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-4xl font-bold font-sans">
              Aspiring Cybersecurity Professional
            </h2>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-card border border-border">
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                I am a passionate cybersecurity student at Purdue University, dedicated to protecting 
                digital assets and building secure systems. My journey in cybersecurity is driven by 
                curiosity and a commitment to staying ahead of emerging threats.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary">•</span> Core Interests
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20 hover:border-primary/50 transition-colors">
                    <h4 className="text-primary font-semibold mb-2">Cloud Security</h4>
                    <p className="text-sm">
                      Securing cloud infrastructure, implementing IAM policies, and ensuring data protection 
                      across distributed systems.
                    </p>
                  </div>
                  
                  <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20 hover:border-primary/50 transition-colors">
                    <h4 className="text-primary font-semibold mb-2">AI/ML in Security</h4>
                    <p className="text-sm">
                      Leveraging machine learning for threat detection, anomaly detection, and predictive 
                      security analytics.
                    </p>
                  </div>
                  
                  <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20 hover:border-primary/50 transition-colors">
                    <h4 className="text-primary font-semibold mb-2">Security Engineering</h4>
                    <p className="text-sm">
                      Building secure applications, conducting security assessments, and implementing 
                      defense-in-depth strategies.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                I'm constantly learning and applying my knowledge through hands-on projects, exploring 
                everything from penetration testing to security automation. My goal is to contribute to 
                making the digital world safer for everyone.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
