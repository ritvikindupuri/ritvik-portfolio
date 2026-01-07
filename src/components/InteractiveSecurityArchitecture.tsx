import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Lock, Eye, Zap, Database, Server, 
  User, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, Globe, Key, FileText, Keyboard, ExternalLink, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SecurityLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  components: string[];
  threats: string[];
}

const securityLayers: SecurityLayer[] = [
  {
    id: "geographic",
    name: "Geographic Filtering",
    icon: Globe,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    description: "Country-level access controls block threats at the perimeter",
    components: ["Country Rules", "IP Geolocation", "Region Blocking"],
    threats: ["Nation-state attacks", "High-risk regions"],
  },
  {
    id: "ip-blocking",
    name: "IP Block List",
    icon: Lock,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    description: "Automatic and manual IP blocking after honeypot triggers",
    components: ["Auto-block (3 triggers)", "24hr Expiration", "Manual Blocks"],
    threats: ["Repeat offenders", "Brute force IPs"],
  },
  {
    id: "honeypot",
    name: "Honeypot Detection",
    icon: Eye,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    description: "Decoy accounts detect and track credential attacks",
    components: ["Fake Admin Accounts", "Trigger Logging", "Location Mapping"],
    threats: ["Default credential attacks", "T1078.001"],
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    description: "IP-based request throttling prevents abuse",
    components: ["30/hr Chatbot", "5/hr Contact", "Session Limits"],
    threats: ["DDoS", "Spam", "Brute force"],
  },
  {
    id: "auth",
    name: "Authentication",
    icon: Key,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "JWT-based auth with server-enforced RBAC",
    components: ["Supabase Auth", "Password Policies", "Session Handling"],
    threats: ["Unauthorized access", "Session hijacking"],
  },
  {
    id: "database",
    name: "Database Security",
    icon: Database,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    description: "Row-Level Security ensures data isolation",
    components: ["RLS Policies", "Audit Logging", "Input Validation"],
    threats: ["Data leakage", "SQL injection", "Privilege escalation"],
  },
];

interface AttackSimulation {
  id: string;
  name: string;
  description: string;
  blockedAt: string;
  steps: { layer: string; status: "blocked" | "passed" | "pending" }[];
}

const attackSimulations: AttackSimulation[] = [
  {
    id: "geo-block",
    name: "Attack from Blocked Country",
    description: "Attacker from a geo-blocked region attempts login",
    blockedAt: "geographic",
    steps: [
      { layer: "geographic", status: "blocked" },
      { layer: "ip-blocking", status: "pending" },
      { layer: "honeypot", status: "pending" },
      { layer: "rate-limiting", status: "pending" },
      { layer: "auth", status: "pending" },
      { layer: "database", status: "pending" },
    ],
  },
  {
    id: "honeypot-trigger",
    name: "Default Credential Attack",
    description: "Attacker tries admin@portfolio.dev (honeypot)",
    blockedAt: "honeypot",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "blocked" },
      { layer: "rate-limiting", status: "pending" },
      { layer: "auth", status: "pending" },
      { layer: "database", status: "pending" },
    ],
  },
  {
    id: "repeat-offender",
    name: "Repeat Honeypot Offender",
    description: "IP with 3+ honeypot triggers attempts login",
    blockedAt: "ip-blocking",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "blocked" },
      { layer: "honeypot", status: "pending" },
      { layer: "rate-limiting", status: "pending" },
      { layer: "auth", status: "pending" },
      { layer: "database", status: "pending" },
    ],
  },
  {
    id: "brute-force",
    name: "Brute Force Attack",
    description: "Rapid repeated login attempts from single IP",
    blockedAt: "rate-limiting",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "passed" },
      { layer: "rate-limiting", status: "blocked" },
      { layer: "auth", status: "pending" },
      { layer: "database", status: "pending" },
    ],
  },
  {
    id: "legitimate",
    name: "Legitimate User Login",
    description: "Valid user with correct credentials",
    blockedAt: "",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "passed" },
      { layer: "rate-limiting", status: "passed" },
      { layer: "auth", status: "passed" },
      { layer: "database", status: "passed" },
    ],
  },
];

export const InteractiveSecurityArchitecture = () => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [focusedLayerIndex, setFocusedLayerIndex] = useState(-1);
  const [focusedSimIndex, setFocusedSimIndex] = useState(-1);
  const [selectedSimulation, setSelectedSimulation] = useState<AttackSimulation | null>(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const simRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Screen reader announcement helper
  const announce = useCallback((message: string) => {
    setAnnouncement("");
    // Small delay to ensure the announcement is picked up
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  useEffect(() => {
    if (selectedSimulation && isAnimating) {
      const timer = setInterval(() => {
        setAnimationStep((prev) => {
          const nextStep = prev + 1;
          const currentStep = selectedSimulation.steps[prev];
          const currentLayer = securityLayers.find(l => l.id === currentStep?.layer);
          
          if (nextStep >= selectedSimulation.steps.length) {
            setIsAnimating(false);
            announce("Simulation complete. Legitimate access granted through all security layers.");
            return prev;
          }
          
          // Announce current layer status
          if (currentStep?.status === "blocked") {
            setIsAnimating(false);
            announce(`Attack blocked! ${currentLayer?.name} layer stopped the attack.`);
            return prev;
          } else if (currentStep?.status === "passed") {
            announce(`Passed through ${currentLayer?.name} layer. Moving to next layer.`);
          }
          
          return nextStep;
        });
      }, 600);
      return () => clearInterval(timer);
    }
  }, [selectedSimulation, isAnimating, announce]);

  const startSimulation = (sim: AttackSimulation) => {
    setSelectedSimulation(sim);
    setAnimationStep(0);
    setIsAnimating(true);
  };

  const getLayerStatus = (layerId: string) => {
    if (!selectedSimulation) return "idle";
    const stepIndex = selectedSimulation.steps.findIndex(s => s.layer === layerId);
    if (stepIndex === -1) return "idle";
    if (stepIndex > animationStep) return "pending";
    return selectedSimulation.steps[stepIndex].status;
  };

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isInLayers = focusedLayerIndex >= 0;
    const isInSims = focusedSimIndex >= 0;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (isInLayers) {
          const nextIndex = Math.min(focusedLayerIndex + 1, securityLayers.length - 1);
          setFocusedLayerIndex(nextIndex);
          layerRefs.current[nextIndex]?.focus();
        } else if (!isInSims) {
          setFocusedLayerIndex(0);
          layerRefs.current[0]?.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isInLayers) {
          const prevIndex = Math.max(focusedLayerIndex - 1, 0);
          setFocusedLayerIndex(prevIndex);
          layerRefs.current[prevIndex]?.focus();
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (isInSims) {
          const nextIndex = Math.min(focusedSimIndex + 1, attackSimulations.length - 1);
          setFocusedSimIndex(nextIndex);
          simRefs.current[nextIndex]?.focus();
        } else if (isInLayers) {
          // Move from layers to simulations
          setFocusedLayerIndex(-1);
          setFocusedSimIndex(0);
          simRefs.current[0]?.focus();
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (isInSims) {
          const prevIndex = focusedSimIndex - 1;
          if (prevIndex < 0) {
            // Move back to layers
            setFocusedSimIndex(-1);
            setFocusedLayerIndex(0);
            layerRefs.current[0]?.focus();
          } else {
            setFocusedSimIndex(prevIndex);
            simRefs.current[prevIndex]?.focus();
          }
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isInLayers) {
          const layerId = securityLayers[focusedLayerIndex].id;
          setActiveLayer(activeLayer === layerId ? null : layerId);
        } else if (isInSims) {
          startSimulation(attackSimulations[focusedSimIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setActiveLayer(null);
        setFocusedLayerIndex(-1);
        setFocusedSimIndex(-1);
        containerRef.current?.focus();
        break;
      case "Tab":
        // Allow natural tab flow but reset focus indices
        if (!e.shiftKey && isInLayers && focusedLayerIndex === securityLayers.length - 1) {
          setFocusedLayerIndex(-1);
          setFocusedSimIndex(0);
        }
        break;
    }
  }, [focusedLayerIndex, focusedSimIndex, activeLayer]);

  return (
    <Card 
      ref={containerRef}
      className="bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Interactive Security Architecture - Use arrow keys to navigate, Enter to select"
    >
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Portfolio Security Architecture</CardTitle>
              <CardDescription>
                This portfolio website implements a defense-in-depth security model. 
                Use arrow keys to navigate, Enter to expand, Escape to close.
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              Defense-in-Depth
            </Badge>
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              Zero Trust
            </Badge>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400 gap-1">
              <Keyboard className="h-3 w-3" />
              Keyboard Nav
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Layers Visualization */}
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-yellow-500 to-purple-500 opacity-30" />
          
          <div className="space-y-3">
            {securityLayers.map((layer, index) => {
              const Icon = layer.icon;
              const status = getLayerStatus(layer.id);
              const isFocused = focusedLayerIndex === index;
              
              return (
                <motion.div
                  key={layer.id}
                  ref={(el) => { layerRefs.current[index] = el; }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={activeLayer === layer.id}
                  aria-label={`${layer.name} - Layer ${index + 1}. ${layer.description}`}
                  className={`relative pl-16 cursor-pointer group outline-none ${
                    activeLayer === layer.id ? "z-10" : ""
                  } ${isFocused ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" : ""}`}
                  onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                  onFocus={() => setFocusedLayerIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveLayer(activeLayer === layer.id ? null : layer.id);
                    }
                  }}
                >
                  {/* Layer Node */}
                  <motion.div
                    className={`absolute left-4 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      status === "blocked" 
                        ? "bg-red-500 border-red-400" 
                        : status === "passed" 
                        ? "bg-green-500 border-green-400"
                        : status === "pending"
                        ? "bg-muted border-muted-foreground/30"
                        : `${layer.bgColor} border-current ${layer.color}`
                    }`}
                    animate={status === "blocked" || status === "passed" ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {status === "blocked" ? (
                      <XCircle className="h-4 w-4 text-white" />
                    ) : status === "passed" ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <Icon className={`h-4 w-4 ${status === "pending" ? "text-muted-foreground/50" : layer.color}`} />
                    )}
                  </motion.div>

                  {/* Layer Card */}
                  <div
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      activeLayer === layer.id
                        ? `${layer.bgColor} border-current ${layer.color}`
                        : "bg-background/50 border-border/50 hover:border-border group-hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${layer.color}`}>{layer.name}</span>
                        <Badge variant="outline" className="text-xs">Layer {index + 1}</Badge>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          activeLayer === layer.id ? "rotate-90" : ""
                        }`} 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{layer.description}</p>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {activeLayer === layer.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Components</p>
                              <div className="space-y-1">
                                {layer.components.map((comp, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${layer.color.replace("text-", "bg-")}`} />
                                    {comp}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Threats Blocked</p>
                              <div className="space-y-1">
                                {layer.threats.map((threat, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <AlertTriangle className="w-3 h-3 text-destructive" />
                                    {threat}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Attack Simulations */}
        <div className="pt-4 border-t border-border/50">
          <div className="mb-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Attack Simulations
            </h4>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Play className="h-3 w-3" />
              Click any scenario below to visualize how the attack progresses through each security layer
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="group" aria-label="Attack simulation scenarios - click to run simulation">
            {attackSimulations.map((sim, index) => (
              <Button
                key={sim.id}
                ref={(el) => { simRefs.current[index] = el; }}
                variant={selectedSimulation?.id === sim.id ? "default" : "outline"}
                size="sm"
                className={`justify-start h-auto py-2 text-left ${
                  focusedSimIndex === index ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => startSimulation(sim)}
                onFocus={() => setFocusedSimIndex(index)}
                aria-label={`Run simulation: ${sim.name}. ${sim.description}`}
              >
                <div>
                  <div className="font-medium text-xs">{sim.name}</div>
                  <div className="text-xs text-muted-foreground font-normal truncate">
                    {sim.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* Simulation Result */}
          <AnimatePresence>
            {selectedSimulation && !isAnimating && animationStep > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-3 rounded-lg ${
                  selectedSimulation.blockedAt 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-blue-500/10 border border-blue-500/30"
                }`}
                role="status"
              >
                <div className="flex items-center gap-2">
                  {selectedSimulation.blockedAt ? (
                    <>
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Attack blocked at {securityLayers.find(l => l.id === selectedSimulation.blockedAt)?.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        Legitimate access granted through all layers
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Documentation Link - External GitHub */}
        <div className="pt-2 border-t border-border/50">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between group">
            <a 
              href="https://github.com/yourusername/portfolio/blob/main/TECHNICAL_DOCUMENTATION.md#security-architecture-overview" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Full Security Documentation on GitHub
              </span>
              <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>

        {/* Screen Reader Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {announcement}
        </div>
      </CardContent>
    </Card>
  );
};
