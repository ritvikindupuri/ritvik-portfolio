import { motion } from "framer-motion";
import { ResumeManager } from "@/components/ResumeManager";

interface ResumeSectionProps {
  isOwner: boolean;
}

export const ResumeSection = ({ isOwner }: ResumeSectionProps) => {
  return (
    <section className="py-16 px-4 relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background">
      <div className="absolute inset-0 neural-grid opacity-5" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <div className="space-y-3">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
              Resume
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Download My Resume
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              View or download my latest resume for a detailed overview of my skills and experience
            </p>
          </div>
          
          <div className="flex justify-center">
            <ResumeManager isOwner={isOwner} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResumeSection;
