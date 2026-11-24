import { motion } from "framer-motion";
import { Wrench, ExternalLink, Github, Bug, ScanSearch, PackageSearch, Siren, Scan, Fingerprint } from "lucide-react";
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
  color: string;
  gradient: string;
  shadow: string;
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
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/10',
    shadow: 'shadow-amber-500/30',
  },
  {
    name: "Lume Skill Detection",
    tagline: "Scans Claude skills for malicious intent before install",
    description: "Runs 35 offline checks for prompt injection, credential theft, and exfiltration patterns in skill files.",
    platform: "Claude skill",
    tryUrl: "https://lume---skill-detection.codeworker.workers.dev/",
    sourceUrl: "https://github.com/ritvikindupuri/Lume---Skill-detection",
    skills: ["Static Analysis", "AI Security", "OWASP"],
    icon: Scan,
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    shadow: 'shadow-cyan-500/30',
  },
  {
    name: "MCP Package Impersonation Auditor",
    tagline: "Audits installed MCP packages for supply-chain attacks",
    description: "Catches typosquats, wrong publishers, install scripts, and hidden data exfiltration in your MCP setup.",
    platform: "Claude skill",
    tryUrl: "https://www.agensi.io/skills/mcp-package-impersonation-auditor",
    skills: ["Supply Chain", "MCP", "SAST"],
    icon: Fingerprint,
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/10',
    shadow: 'shadow-violet-500/30',
  },
  {
    name: "AWS IR Pack",
    tagline: "GuardDuty + CloudTrail incident response workflows",
    description: "Triages AWS threats with ready Athena queries, timelines, and confirmation-gated containment playbooks.",
    platform: "Claude skill",
    tryUrl: "https://www.agensi.io/skills/aws-ir-pack-guardduty-cloudtrail-incident-response",
    skills: ["Incident Response", "AWS", "DFIR"],
    icon: Siren,
    color: '#dc2626',
    gradient: 'from-red-500/20 to-red-600/10',
    shadow: 'shadow-red-500/30',
  },
];

export const SecurityTools = ({ isOwner }: SecurityToolsProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3 shadow-cyan">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
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
            <div 
              className={`relative backdrop-blur-md border-2 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${tool.shadow}`}
              style={{ 
                background: `linear-gradient(to br, ${tool.color}10, ${tool.color}05)`,
                borderColor: tool.color + '50'
              }}
            >
              <div className="h-1" style={{ background: `linear-gradient(to r, ${tool.color}, ${tool.color}cc)` }} />
              
              <div className="p-6 space-y-4 flex flex-col h-full">
                {/* Icon and Badge Row */}
                <div className="flex items-start justify-between">
                  {/* Layered icon treatment */}
                  <div className="relative">
                    <div 
                      className={`absolute inset-0 blur-md opacity-50 rounded-xl bg-gradient-to-br ${tool.gradient}`}
                      style={{ transform: 'scale(1.3)' }}
                    />
                    <div 
                      className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} backdrop-blur-sm flex items-center justify-center border`}
                      style={{ borderColor: tool.color + '40' }}
                    >
                      <tool.icon className="w-6 h-6" style={{ color: tool.color }} />
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium backdrop-blur-sm">
                    {tool.platform}
                  </Badge>
                </div>

                {/* Name and Tagline */}
                <div className="space-y-1">
                  <h4 className="text-xl font-bold leading-tight" style={{ color: tool.color }}>
                    {tool.name}
                  </h4>
                  <p className="text-sm font-medium" style={{ color: tool.color + 'cc' }}>
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
                    className="flex-1 gap-2 hover:opacity-90"
                    style={{ 
                      background: `linear-gradient(to r, ${tool.color}, ${tool.color}cc)`
                    }}
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
                      style={{ 
                        borderColor: tool.color + '50'
                      }}
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
