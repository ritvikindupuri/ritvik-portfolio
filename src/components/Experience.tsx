import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExperienceProps {
  isOwner: boolean;
}

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
}

const Experience = ({ isOwner }: ExperienceProps) => {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: [""],
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experience")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching experiences:", error);
      return;
    }

    if (data) {
      setExperiences(data);
    }
  };

  const handleAddExperience = async () => {
    if (!newExperience.title || !newExperience.company || !newExperience.start_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to add experience");
      return;
    }

    const { error } = await supabase.from("experience").insert({
      user_id: user.id,
      title: newExperience.title,
      company: newExperience.company,
      location: newExperience.location || null,
      start_date: newExperience.start_date,
      end_date: newExperience.is_current ? null : newExperience.end_date || null,
      is_current: newExperience.is_current,
      description: newExperience.description.filter(d => d.trim() !== ""),
      skills: newExperience.skills,
    });

    if (error) {
      console.error("Error adding experience:", error);
      toast.error("Failed to add experience");
      return;
    }

    toast.success("Experience added successfully");
    setIsAddDialogOpen(false);
    setNewExperience({
      title: "",
      company: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: [""],
      skills: [],
    });
    setSkillInput("");
    fetchExperiences();
  };

  const handleRemoveExperience = async (id: string) => {
    const { error } = await supabase
      .from("experience")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing experience:", error);
      toast.error("Failed to remove experience");
      return;
    }

    toast.success("Experience removed successfully");
    fetchExperiences();
  };

  const handleAddDescription = () => {
    setNewExperience({
      ...newExperience,
      description: [...newExperience.description, ""],
    });
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updatedDescriptions = [...newExperience.description];
    updatedDescriptions[index] = value;
    setNewExperience({ ...newExperience, description: updatedDescriptions });
  };

  const handleRemoveDescription = (index: number) => {
    setNewExperience({
      ...newExperience,
      description: newExperience.description.filter((_, i) => i !== index),
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !newExperience.skills.includes(skillInput.trim())) {
      setNewExperience({
        ...newExperience,
        skills: [...newExperience.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setNewExperience({
      ...newExperience,
      skills: newExperience.skills.filter((s) => s !== skill),
    });
  };

  const formatDateRange = (startDate: string, endDate: string | null, isCurrent: boolean) => {
    const start = new Date(startDate);
    const startStr = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
    if (isCurrent) {
      const months = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      
      let duration = "";
      if (years > 0) duration += `${years} yr${years > 1 ? "s" : ""} `;
      if (remainingMonths > 0) duration += `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
      
      return `${startStr} – Present · ${duration.trim()}`;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      const endStr = end.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      
      let duration = "";
      if (years > 0) duration += `${years} yr${years > 1 ? "s" : ""} `;
      if (remainingMonths > 0) duration += `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
      
      return `${startStr} – ${endStr} · ${duration.trim()}`;
    }
    
    return startStr;
  };

  return (
    <section id="experience" className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-bold">
            <Briefcase className="inline-block mr-3 text-primary" size={36} />
            Experience
          </h2>
          
          {isOwner && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2" size={16} />
                  Add Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Experience</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={newExperience.company}
                      onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                      placeholder="e.g., Tech Corp"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newExperience.location}
                      onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                      placeholder="e.g., Boston, Massachusetts, United States · Remote"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newExperience.start_date}
                        onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newExperience.end_date}
                        onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                        disabled={newExperience.is_current}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_current"
                      checked={newExperience.is_current}
                      onCheckedChange={(checked) => 
                        setNewExperience({ ...newExperience, is_current: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_current">I currently work here</Label>
                  </div>
                  
                  <div>
                    <Label>Description (bullet points)</Label>
                    {newExperience.description.map((desc, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Textarea
                          value={desc}
                          onChange={(e) => handleDescriptionChange(index, e.target.value)}
                          placeholder="Describe your responsibilities and achievements"
                          rows={2}
                        />
                        {newExperience.description.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDescription(index)}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDescription}>
                      Add Bullet Point
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Skills</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Add a skill and press Enter"
                      />
                      <Button type="button" onClick={handleAddSkill}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newExperience.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer">
                          {skill}
                          <X
                            size={14}
                            className="ml-1"
                            onClick={() => handleRemoveSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleAddExperience} className="w-full">
                    Add Experience
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[17px] top-0 bottom-0 w-[2px] bg-border" />
          
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-9 h-9 rounded-full bg-primary border-4 border-background flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-background" />
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{exp.title}</h3>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExperience(exp.id)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-lg font-semibold text-primary mb-2">{exp.company}</p>
                  
                  <p className="text-muted-foreground mb-2">
                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                  </p>
                  
                  {exp.location && (
                    <p className="text-muted-foreground flex items-center gap-1 mb-4">
                      <MapPin size={16} />
                      {exp.location}
                    </p>
                  )}
                  
                  {exp.description && exp.description.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-2 mb-4">
                      {exp.description.map((desc, idx) => (
                        <li key={idx} className="text-muted-foreground">{desc}</li>
                      ))}
                    </ul>
                  )}
                  
                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;