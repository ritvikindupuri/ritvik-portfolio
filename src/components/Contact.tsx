import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Github, Linkedin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z.string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be less than 2000 characters"),
});

export const Contact = () => {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      label: "Personal Email",
      value: "ritvik.indupuri@gmail.com",
      href: "mailto:ritvik.indupuri@gmail.com",
    },
    {
      icon: Mail,
      label: "University Email",
      value: "rindupur@purdue.edu",
      href: "mailto:rindupur@purdue.edu",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "github.com/ritvikindupuri",
      href: "https://github.com/ritvikindupuri",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "linkedin.com/in/ritvik-indupuri",
      href: "https://www.linkedin.com/in/ritvik-indupuri-4b6037288/",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(formData);

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: validatedData,
      });

      if (error) throw error;

      toast.success("Message sent successfully! I'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
      setIsEmailDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error sending email:', error);
        toast.error("Failed to send message. Please email me directly at ritvik.indupuri@gmail.com");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-b from-background to-card/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto relative z-10"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
          >
            <Mail className="w-8 h-8 text-primary" />
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-cyber bg-clip-text text-transparent">
            Get In Touch
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's connect and discuss opportunities in cybersecurity, cloud computing, and AI development
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {contactInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.label === "GitHub" || item.label === "LinkedIn" ? "_blank" : undefined}
                rel={item.label === "GitHub" || item.label === "LinkedIn" ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-elegant transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      {item.label}
                    </h3>
                    <p className="text-lg font-medium text-foreground group-hover:text-primary transition-colors break-words">
                      {item.value}
                    </p>
                  </div>
                </div>
                
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Available for cybersecurity internships, cloud development roles, and AI/ML projects
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Send me a message</DialogTitle>
                  <DialogDescription>
                    Fill out the form below and I'll get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      maxLength={100}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      maxLength={255}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your message..."
                      rows={5}
                      maxLength={2000}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length}/2000
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSending}>
                    {isSending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <a href="https://www.linkedin.com/in/ritvik-indupuri-4b6037288/" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
