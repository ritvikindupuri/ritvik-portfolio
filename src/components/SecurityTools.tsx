import { motion } from "framer-motion";
import { Wrench, ExternalLink, Github, Bug, ScanSearch, PackageSearch, Siren } from "lucide-react";
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
  icon: React.ComponentType<{ className?: string }>;
  accent: {
    from: string;
    to: string;
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
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
    icon: Bug,
    accent: {
      from: 'from-amber-500',
      to: 'to-orange-500',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/50'
    }
  },
  {
    name: "Lume Skill Detection",
    tagline: "Scans Claude skills for malicious intent before install",
    description: "Runs 35 offline checks for prompt injection, credential theft, and exfiltration patterns in skill files.",
    platform: "Claude skill",
    tryUrl: "https://lume---skill-detection.codeworker.workers.dev/",
    sourceUrl: "https://github.com/ritvikindupuri/Lume---Skill-detection",
    skills: ["Static Analysis", "AI Security", "OWASP"],
    icon: ScanSearch,
    accent: {
      from: 'from-violet-500',
      to: 'to-purple-500',
      bg: 'bg-violet-500/20',
      border: 'border-violet-500/50',
      text: 'text-violet-400',
      glow: 'shadow-violet-500/50'
    }
  },
  {
    name: "MCP Package Impersonation Auditor",
    tagline: "Audits installed MCP packages for supply-chain attacks",
    description: "Catches typosquats, wrong publishers, install scripts, and hidden data exfiltration in your MCP setup.",
    platform: "Claude skill",
    tryUrl: "https://www.agensi.io/skills/mcp-package-impersonation-auditor",
    skills: ["Supply Chain", "MCP", "SAST"],
    icon: PackageSearch,
    accent: {
      from: 'from-emerald-500',
      to: 'to-teal-500',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/50'
    }
  },
  {
    name: "AWS IR Pack",
    tagline: "GuardDuty + CloudTrail incident response workflows",
    description: "Triages AWS threats with ready Athena queries, timelines, and confirmation-gated containment playbooks.",
    platform: "Claude skill",
    tryUrl: "https://www.agensi.io/skills/aws-ir-pack-guardduty-cloudtrail-incident-response",
    skills: ["Incident Response", "AWS", "DFIR"],
    icon: Siren,
    accent: {
      from: 'from-rose-500',
      to: 'to-pink-500',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/50',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/50'
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {securityTools.map((tool, index) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group relative"
          >
            <div className={`relative bg-gradient-to-br ${tool.accent.bg} backdrop-blur-md border-2 ${tool.accent.border} rounded-2xl overflow-hidden transition-all duration-500 hover:${tool.accent.glow} hover:shadow-2xl hover:-translate-y-1`}>
              <div className={`h-1 bg-gradient-to-r ${tool.accent.from} ${tool.accent.to}`} />
              
              <div className="p-6 space-y-4 flex flex-col h-full">
                {/* Icon and Badge Row */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${tool.accent.bg} border ${tool.accent.border} flex items-center justify-center`}>
                    <tool.icon className={`w-6 h-6 ${tool.accent.text}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium backdrop-blur-sm">
                    {tool.platform}
                  </Badge>
                </div>

                {/* Name and Tagline */}
                <div className="space-y-1">
                  <h4 className={`text-xl font-bold leading-tight ${tool.accent.text}`}>
                    {tool.name}
                  </h4>
                  <p className={`text-sm font-medium ${tool.accent.text} opacity-80`}>
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

                {/* Action Buttons - Always at bottom with consistent layout */}
                <div className="flex gap-3 pt-2 mt-auto">
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
                      {(tool.name === "AgentPot" || tool.name === "Lume Skill Detection") ? "Try it" : "Get skill"}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
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
