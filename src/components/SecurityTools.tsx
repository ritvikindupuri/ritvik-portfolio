import { motion } from "framer-motion";
import { Wrench, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SecurityToolsProps {
  isOwner: boolean;
}

interface SecurityTool {
  name: string;
  tagline: string;
  description: string;
  platform: string;
  tryUrl?: string;
  sourceUrl?: string;
  skills: string[];
  icon: string;
}

const securityTools: SecurityTool[] = [
  {
    name: "AgentPot",
    tagline: "Agentic honeypot that baits AI agents with decoys",
    description: "Logs agent behavior when they interact with fake infrastructure tools, secrets, and documentation lures.",
    platform: "MCP Registry",
    tryUrl: "https://agentpot-app.vercel.app",
    sourceUrl: "https://github.com/ritvikindupuri/AgentPot",
    skills: ["Honeypot", "MCP", "Threat Intel"],
    icon: "🍯"
  },
  {
    name: "Lume Skill Detection",
    tagline: "Scans Claude skills for malicious intent before install",
    description: "Runs 35 offline checks for prompt injection, credential theft, and exfiltration patterns in skill files.",
    platform: "Agensi",
    tryUrl: "https://www.agensi.io/skills/lume-skill-detection",
    sourceUrl: "https://github.com/ritvikindupuri/Lume---Skill-detection",
    skills: ["Static Analysis", "AI Security", "OWASP"],
    icon: "🔍"
  },
  {
    name: "MCP Package Impersonation Auditor",
    tagline: "Audits installed MCP packages for supply-chain attacks",
    description: "Catches typosquats, wrong publishers, install scripts, and hidden data exfiltration in your MCP setup.",
    platform: "Agensi",
    tryUrl: "https://www.agensi.io/skills/mcp-package-impersonation-auditor",
    skills: ["Supply Chain", "MCP", "SAST"],
    icon: "🔐"
  },
  {
    name: "AWS IR Pack",
    tagline: "GuardDuty + CloudTrail incident response workflows",
    description: "Triages AWS threats with ready Athena queries, timelines, and confirmation-gated containment playbooks.",
    platform: "Agensi",
    tryUrl: "https://www.agensi.io/skills/aws-ir-pack-guardduty-cloudtrail-incident-response",
    skills: ["Incident Response", "AWS", "DFIR"],
    icon: "🚨"
  },
];

export const SecurityTools = ({ isOwner }: SecurityToolsProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3 shadow-cyan">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-4xl md:text-5xl font-bold font-sans text-gradient-neural">
          Security Tools
        </h3>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
          Open-source security tools for AI agents and cloud infrastructure
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {securityTools.map((tool, index) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group relative"
          >
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              
              <div className="p-6 space-y-4">
                {/* Icon and Badge Row */}
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{tool.icon}</div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {tool.platform}
                  </Badge>
                </div>

                {/* Name and Tagline */}
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-foreground leading-tight">
                    {tool.name}
                  </h4>
                  <p className="text-sm text-primary font-medium">
                    {tool.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {tool.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground border border-border/50 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {tool.tryUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <a
                        href={tool.tryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Try it
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  {tool.sourceUrl && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <a
                        href={tool.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {securityTools.length === 0 && !isOwner && (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Security tools coming soon</p>
        </div>
      )}
    </div>
  );
};
