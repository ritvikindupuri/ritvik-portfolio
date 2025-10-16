import { motion } from "framer-motion";
import { Mail, Phone, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "ritvik.indupuri@gmail.com",
      href: "mailto:ritvik.indupuri@gmail.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "(317) 514-9996",
      href: "tel:+13175149996",
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                {/* Hover effect */}
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
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Available for cybersecurity internships, cloud development roles, and AI/ML projects
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2"
            >
              <a href="mailto:ritvik.indupuri@gmail.com">
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </Button>
            
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
