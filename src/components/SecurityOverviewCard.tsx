import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Zap, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const SecurityOverviewCard = () => {
  const securityLayers = [
    {
      icon: Shield,
      title: "Geographic Blocking",
      description: "Country-level access controls",
      color: "text-red-400",
    },
    {
      icon: Lock,
      title: "IP Block List",
      description: "Auto-blocks repeat offenders",
      color: "text-orange-400",
    },
    {
      icon: Eye,
      title: "Honeypot Detection",
      description: "Decoy accounts catch attackers",
      color: "text-yellow-400",
    },
    {
      icon: Zap,
      title: "Rate Limiting",
      description: "30/hr chatbot, 5/hr contact",
      color: "text-green-400",
    },
  ];

  const mitigations = [
    { threat: "XSS Attacks", solution: "DOMPurify Sanitization" },
    { threat: "Prompt Injection", solution: "Input Validation" },
    { threat: "Unauthorized Access", solution: "Supabase RLS + RBAC" },
    { threat: "Brute Force", solution: "IP Rate Limiting" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Security Architecture</CardTitle>
                <CardDescription>Enterprise-grade defense-in-depth</CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                OWASP Compliant
              </Badge>
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                MITRE ATT&CK
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Layered Defense */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Layered Defense Architecture</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {securityLayers.map((layer, index) => {
                const Icon = layer.icon;
                return (
                  <motion.div
                    key={layer.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-background/50 border border-border/50 text-center"
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-2 ${layer.color}`} />
                    <p className="text-xs font-medium">{layer.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{layer.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Threat Mitigations */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Threat Mitigations</h4>
            <div className="grid grid-cols-2 gap-2">
              {mitigations.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{item.threat}:</span>
                  <span className="font-medium truncate">{item.solution}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documentation Link */}
          <div className="pt-2 border-t border-border/50">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between group">
              <Link to="/technical-documentation">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Full Security Documentation
                </span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
