import { motion } from "framer-motion";

interface SectionTransitionProps {
  badge: string;
  subtitle: string;
}

export const SectionTransition = ({ badge, subtitle }: SectionTransitionProps) => {
  return (
    <motion.div 
      className="relative py-20 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6">
        <motion.div 
          className="flex items-center justify-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-primary/60"
            initial={{ scaleX: 0, originX: 1 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <motion.div 
              className="relative px-6 py-2.5 border border-primary/30 rounded-full bg-card/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <span className="text-xs font-mono tracking-wider text-primary/80 uppercase">
                {badge}
              </span>
            </motion.div>
          </div>
          <motion.div 
            className="flex-1 h-px bg-gradient-to-l from-transparent via-accent/40 to-accent/60"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </motion.div>
        
        <motion.p 
          className="text-center mt-5 text-muted-foreground text-sm max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {subtitle}
        </motion.p>
      </div>
      
      <motion.div 
        className="absolute left-1/2 top-full -translate-x-1/2 w-px h-12 bg-gradient-to-b from-primary/30 to-transparent"
        initial={{ scaleY: 0, originY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
    </motion.div>
  );
};
