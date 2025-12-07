interface SectionTransitionProps {
  badge: string;
  subtitle: string;
}

export const SectionTransition = ({ badge, subtitle }: SectionTransitionProps) => {
  return (
    <div className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative px-6 py-2.5 border border-primary/30 rounded-full bg-card/50 backdrop-blur-sm">
              <span className="text-xs font-mono tracking-wider text-primary/80 uppercase">
                {badge}
              </span>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-accent/40 to-accent/60" />
        </div>
        
        <p className="text-center mt-5 text-muted-foreground text-sm max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>
      
      <div className="absolute left-1/2 top-full -translate-x-1/2 w-px h-12 bg-gradient-to-b from-primary/30 to-transparent" />
    </div>
  );
};
