import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Briefcase, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string[];
  skills: string[];
  display_order?: number;
}

interface SortableExperienceProps {
  exp: ExperienceEntry;
  index: number;
  formatDateRange: (startDate: string, endDate: string | null, isCurrent: boolean) => string;
}

const SortableExperience = ({ exp, index, formatDateRange }: SortableExperienceProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-16 group"
    >
      {/* Enhanced Timeline dot with icon */}
      <div className="absolute left-0 top-3 w-11 h-11 rounded-full bg-gradient-cyber border-4 border-background flex items-center justify-center shadow-glow z-10">
        <Briefcase className="w-5 h-5 text-background" />
      </div>

      <div className="relative">
        <div className="relative bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-glow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors mb-2 leading-tight">
                {exp.title}
              </h3>
              <p className="text-lg font-semibold text-primary mb-2">{exp.company}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {exp.location && (
              <p className="flex items-center text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                {exp.location}
              </p>
            )}
            <p className="text-sm text-muted-foreground font-medium">
              {formatDateRange(exp.start_date, exp.end_date || null, exp.is_current)}
            </p>
          </div>

          {exp.description && exp.description.length > 0 && (
            <ul className="space-y-3 mb-6 list-none">
              {exp.description.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-foreground/90 leading-relaxed">
                  <span className="text-primary mt-1.5 flex-shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {exp.skills && exp.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {exp.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Experience = () => {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  // Force re-render every minute to update "Present" durations in realtime
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchExperiences();

    // Update every minute for realtime duration updates
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchExperiences = async () => {
    const { data, error } = await supabase.from("experience").select("*").order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching experiences:", error);
      return;
    }

    if (data) {
      setExperiences(data);
    }
  };
  const formatDateRange = useCallback((startDate: string, endDate: string | null, isCurrent: boolean) => {
    // Parse the date string properly - add day if not present for proper parsing
    const parseDate = (dateStr: string) => {
      // Handle YYYY-MM-DD format from database
      return parseISO(dateStr);
    };

    const start = parseDate(startDate);
    const startStr = format(start, "MMM yyyy");

    const calculateDuration = (fromDate: Date, toDate: Date) => {
      const totalMonths = differenceInMonths(toDate, fromDate);
      // Add 1 to include the starting month (e.g., Oct 2025 to Dec 2025 = 3 months, not 2)
      const adjustedMonths = totalMonths + 1;
      const years = Math.floor(adjustedMonths / 12);
      const remainingMonths = adjustedMonths % 12;

      let duration = "";
      if (years > 0) duration += `${years} yr${years > 1 ? "s" : ""} `;
      if (remainingMonths > 0 || years === 0) duration += `${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;

      return duration.trim();
    };

    if (isCurrent) {
      const duration = calculateDuration(start, new Date());
      return `${startStr} – Present · ${duration}`;
    }

    if (endDate) {
      const end = parseDate(endDate);
      const endStr = format(end, "MMM yyyy");
      const duration = calculateDuration(start, end);
      return `${startStr} – ${endStr} · ${duration}`;
    }

    return startStr;
  }, []);

  return (
    <section id="experience" className="py-32 px-4 relative overflow-hidden bg-card/20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto relative z-10"
      >
        <div className="text-center space-y-6 mb-20">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 shadow-glow mx-auto"
          >
            <Briefcase className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Experience</h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
        </div>

        <div className="flex justify-end mb-12"></div>

        <div className="relative max-w-4xl mx-auto">
          {/* Enhanced Timeline line */}
          <div className="absolute left-[21px] top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />

          <div className="space-y-10 pb-8">
            <>
              {experiences.map((exp, index) => (
                <SortableExperience key={exp.id} exp={exp} index={index} formatDateRange={formatDateRange} />
              ))}
            </>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;
