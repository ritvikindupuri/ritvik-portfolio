import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Lock, Eye, Zap, Database, Server, 
  User, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, Globe, Key, FileText, Keyboard, ExternalLink, Play, Pause, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComponentDetail {
  name: string;
  tooltip: string;
}

interface ThreatDetail {
  name: string;
  tooltip: string;
}

interface SecurityLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  components: ComponentDetail[];
  threats: ThreatDetail[];
  passedExplanation: string;
  blockedExplanation: string;
}

const securityLayers: SecurityLayer[] = [
  {
    id: "geographic",
    name: "Geographic Filtering",
    icon: Globe,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    description: "Country-level access controls block threats at the perimeter",
    components: [
      { name: "Country Rules", tooltip: "Database table (geographic_blocking_rules) that stores which countries are blocked/monitored. Admin can add countries by code (e.g., CN, RU) with 'block' or 'monitor' actions." },
      { name: "IP Geolocation", tooltip: "Uses ipapi.co API to convert visitor IP addresses into geographic data (country, city, coordinates). Called via the geolocate-ip edge function." },
      { name: "Region Blocking", tooltip: "When a blocked country is detected, the request is immediately rejected. Optionally sends email alerts to the portfolio owner when triggered." },
    ],
    threats: [
      { name: "Nation-state attacks", tooltip: "Sophisticated attacks originating from countries known for state-sponsored hacking. Blocking high-risk regions reduces attack surface from APT groups." },
      { name: "High-risk regions", tooltip: "Countries with historically high rates of credential stuffing, spam, and automated attacks. Proactive blocking prevents reconnaissance." },
    ],
    passedExplanation: "The request originated from a country that is not on the blocked list. The IP was geolocated and the country code was checked against geographic_blocking_rules table. Since no matching block rule exists, the request proceeds to the next layer.",
    blockedExplanation: "The request was blocked because the IP address geolocated to a country in the blocked list. The geographic_blocking_rules table has an active 'block' action for this country code. The connection is immediately terminated with no further processing.",
  },
  {
    id: "ip-blocking",
    name: "IP Block List",
    icon: Lock,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    description: "Automatic and manual IP blocking after honeypot triggers",
    components: [
      { name: "Auto-block (3 triggers)", tooltip: "When an IP triggers honeypot accounts 3+ times, it's automatically added to the blocked_ips table with a 24-hour expiration. This catches persistent attackers." },
      { name: "24hr Expiration", tooltip: "Auto-blocks expire after 24 hours (expires_at field). This prevents permanently blocking IPs that may be shared (NAT, VPNs) while still deterring attacks." },
      { name: "Manual Blocks", tooltip: "Portfolio owner can manually add IPs to the blocklist with custom expiration or permanent blocks. Useful for known malicious IPs or targeted harassment." },
    ],
    threats: [
      { name: "Repeat offenders", tooltip: "Attackers who return multiple times to try different credentials. The escalating response (trigger → warn → block) adapts to threat persistence." },
      { name: "Brute force IPs", tooltip: "IPs that have been identified attempting brute force attacks. Once blocked, all requests from that IP are rejected at the perimeter." },
    ],
    passedExplanation: "This IP address was not found in the blocked_ips table, or the block has expired (is_active = false). The system checked for active blocks and found none, allowing the request to continue to honeypot detection.",
    blockedExplanation: "This IP was found in the blocked_ips table with is_active = true and expires_at in the future. The IP was auto-blocked after triggering honeypot accounts 3+ times, or was manually blocked by the owner. Request rejected immediately.",
  },
  {
    id: "honeypot",
    name: "Honeypot Detection",
    icon: Eye,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    description: "Decoy accounts detect and track credential attacks",
    components: [
      { name: "Fake Admin Accounts", tooltip: "Fake email accounts like 'admin@portfolio.dev' or 'root@portfolio.dev' that don't exist. Any login attempt using these emails is automatically flagged as malicious." },
      { name: "Trigger Logging", tooltip: "Every honeypot trigger is logged in honeypot_triggers table with IP, user agent, and timestamp. This creates an audit trail and feeds threat intelligence." },
      { name: "Location Mapping", tooltip: "Honeypot triggers are geolocated and visualized on a map in the security dashboard. Shows geographic distribution of attackers for pattern analysis." },
    ],
    threats: [
      { name: "Default credential attacks", tooltip: "Attackers trying common admin emails (admin@, root@, test@) with default or common passwords. These are automated scans looking for easy targets." },
      { name: "T1078.001 (Valid Accounts)", tooltip: "MITRE ATT&CK technique where attackers use valid-looking credentials. Honeypots detect this by creating attractive-but-fake credentials that legitimate users would never use." },
    ],
    passedExplanation: "The login attempt used an email that does not match any honeypot_accounts entries. This appears to be a legitimate login attempt rather than an attacker trying default/common credentials. The request continues to rate limiting.",
    blockedExplanation: "The attacker tried to log in with a honeypot email (e.g., admin@portfolio.dev). The system logged the trigger in honeypot_triggers, geolocated the IP, and sent an alert. If this IP has 3+ triggers, it will be auto-blocked for 24 hours.",
  },
  {
    id: "rate-limiting",
    name: "CORS & Rate Limiting",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    description: "Origin validation and IP-based request throttling prevents abuse",
    components: [
      { name: "Strict CORS", tooltip: "Only requests from ritvik-portfolio.lovable.app and ritvikindupuri.com are allowed. All other origins are rejected with 403 Forbidden. Prevents cross-site request forgery and unauthorized API access." },
      { name: "100/min General", tooltip: "General API endpoints allow 100 requests per minute per IP. Prevents abuse while allowing normal usage. Uses in-memory rate limiting with automatic cleanup." },
      { name: "30/hr Chatbot", tooltip: "The AI chatbot allows 30 queries per IP per hour. Prevents abuse of the LLM API and protects against prompt injection attacks at scale." },
      { name: "5/hr Contact", tooltip: "Contact form submissions are limited to 5 per IP per hour. Prevents spam campaigns and email bombing through the contact form." },
    ],
    threats: [
      { name: "CORS Bypass", tooltip: "Attackers attempting to make API requests from malicious websites are blocked at the origin validation layer. Only whitelisted domains can access the API." },
      { name: "DDoS", tooltip: "Distributed Denial of Service attempts to overwhelm the application. Rate limiting caps requests per IP, reducing single-source attack effectiveness." },
      { name: "API Abuse", tooltip: "Automated scripts attempting to scrape data or abuse API endpoints. Rate limits per endpoint type prevent resource exhaustion." },
    ],
    passedExplanation: "The request originated from an allowed domain (CORS check passed) and the IP has not exceeded the rate limit thresholds. The request frequency is within acceptable bounds and proceeds to authentication.",
    blockedExplanation: "The request was blocked due to CORS policy violation (unauthorized origin) or rate limit exceeded. Too many requests from this IP triggered the throttle. Response includes Retry-After header indicating when to retry.",
  },
  {
    id: "auth",
    name: "Authentication",
    icon: Key,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "JWT-based auth with server-enforced RBAC",
    components: [
      { name: "Supabase Auth", tooltip: "Handles user authentication, password hashing (bcrypt), and JWT token issuance. Passwords are never stored in plaintext." },
      { name: "Password Policies", tooltip: "Enforces minimum password requirements and checks against known breached passwords. Weak or compromised passwords are rejected." },
      { name: "Session Handling", tooltip: "JWT tokens with secure expiration. Sessions are validated on each request. Token refresh happens automatically before expiration." },
    ],
    threats: [
      { name: "Unauthorized access", tooltip: "Attempts to access protected resources without valid credentials. Auth layer ensures only authenticated users with valid JWTs can proceed." },
      { name: "Session hijacking", tooltip: "Attempts to steal or forge session tokens. Secure JWT implementation with proper signing prevents token tampering." },
    ],
    passedExplanation: "Valid credentials were provided. Supabase Auth verified the email/password combination, checked against the leaked password database, and issued a JWT token. The user's role was verified via the user_roles table for RBAC enforcement.",
    blockedExplanation: "Authentication failed. Either the credentials were incorrect, the password failed complexity requirements, or was found in a known data breach. The login attempt is logged and may contribute to threat detection patterns.",
  },
  {
    id: "database",
    name: "Database Security",
    icon: Database,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    description: "Row-Level Security ensures data isolation",
    components: [
      { name: "RLS Policies", tooltip: "PostgreSQL Row-Level Security policies on every table. Each policy defines who can SELECT, INSERT, UPDATE, DELETE based on auth.uid() matching the row's user_id." },
      { name: "Audit Logging", tooltip: "All login attempts, visitor activity, and security events are logged with timestamps, IPs, and user agents. Creates accountability and forensic capability." },
      { name: "Input Validation", tooltip: "All user inputs are validated and sanitized before database operations. Prevents SQL injection, XSS, and other injection attacks." },
    ],
    threats: [
      { name: "Data leakage", tooltip: "Unauthorized access to sensitive data. RLS ensures users can only query rows they own—even with direct database access, other users' data is invisible." },
      { name: "SQL injection", tooltip: "Malicious SQL in user inputs. Parameterized queries and input validation prevent attackers from executing arbitrary SQL commands." },
      { name: "Privilege escalation", tooltip: "Attempts to gain higher access than authorized. user_roles table combined with RLS policies strictly enforce the owner/viewer role separation." },
    ],
    passedExplanation: "The authenticated user's JWT was validated and their user_id extracted. RLS policies on each table ensure they can only access rows where the policy conditions are met (e.g., user_id = auth.uid()). All queries are logged for audit purposes.",
    blockedExplanation: "RLS policies prevented access. Even with a valid session, the user cannot access data that doesn't belong to them. The database enforces that only the owner role can access sensitive tables like visitor_activity and login_attempts.",
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
    id: "cors-attack",
    name: "Cross-Origin Request Attack",
    description: "Malicious site attempts API request from unauthorized origin",
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
    id: "rate-limit-bypass",
    name: "Rate Limit Exhaustion Attack",
    description: "Attacker sends 100+ requests/minute to exhaust API limits",
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
    id: "geo-block",
    name: "Attack from Blocked Country",
    description: "Attacker from geo-blocked region (e.g., sanctioned country) attempts login",
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
    name: "Default Credential Attack (T1078)",
    description: "Attacker tries admin@portfolio.dev honeypot account",
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
    description: "Previously flagged IP (3+ honeypot triggers) returns",
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
    name: "Brute Force Attack (T1110)",
    description: "Rapid password guessing from single IP exceeds threshold",
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
    id: "password-spray",
    name: "Password Spray Attack (T1110.003)",
    description: "Same password tried across multiple accounts slowly",
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
    id: "credential-stuffing",
    name: "Credential Stuffing Attack",
    description: "Leaked credentials from breached sites tested",
    blockedAt: "auth",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "passed" },
      { layer: "rate-limiting", status: "passed" },
      { layer: "auth", status: "blocked" },
      { layer: "database", status: "pending" },
    ],
  },
  {
    id: "sql-injection",
    name: "SQL Injection Attempt (T1190)",
    description: "Malicious SQL in login form: ' OR 1=1 --",
    blockedAt: "database",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "passed" },
      { layer: "rate-limiting", status: "passed" },
      { layer: "auth", status: "passed" },
      { layer: "database", status: "blocked" },
    ],
  },
  {
    id: "privilege-escalation",
    name: "Privilege Escalation (T1548)",
    description: "Viewer account attempts to access owner-only data",
    blockedAt: "database",
    steps: [
      { layer: "geographic", status: "passed" },
      { layer: "ip-blocking", status: "passed" },
      { layer: "honeypot", status: "passed" },
      { layer: "rate-limiting", status: "passed" },
      { layer: "auth", status: "passed" },
      { layer: "database", status: "blocked" },
    ],
  },
  {
    id: "legitimate",
    name: "Legitimate Owner Login",
    description: "Valid owner with correct credentials from trusted location",
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
  const [isPaused, setIsPaused] = useState(false);
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

  // Calculate progress percentage
  const progressPercentage = selectedSimulation 
    ? ((animationStep + 1) / selectedSimulation.steps.length) * 100 
    : 0;

  // Get current layer name for progress indicator
  const currentLayerName = selectedSimulation && animationStep < selectedSimulation.steps.length
    ? securityLayers.find(l => l.id === selectedSimulation.steps[animationStep]?.layer)?.name
    : null;

  useEffect(() => {
    if (selectedSimulation && isAnimating && !isPaused) {
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
      }, 800);
      return () => clearInterval(timer);
    }
  }, [selectedSimulation, isAnimating, isPaused, announce]);

  const startSimulation = (sim: AttackSimulation) => {
    setSelectedSimulation(sim);
    setAnimationStep(0);
    setIsAnimating(true);
    setIsPaused(false);
    announce(`Starting simulation: ${sim.name}. ${sim.description}`);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    announce(isPaused ? "Simulation resumed" : "Simulation paused");
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
    <div 
      ref={containerRef}
      className="relative overflow-hidden focus:outline-none rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 sm:p-6 lg:p-8"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Interactive Security Architecture - Use arrow keys to navigate, Enter to select"
    >
      {/* Background gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Security Architecture
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Defense-in-depth model with 6 security layers. Click any layer to explore, or run attack simulations.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Defense-in-Depth
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
              <Lock className="h-3 w-3 mr-1" />
              Zero Trust
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Left Panel - Security Layers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Layers</span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
          </div>
          
          <div className="relative">
            {/* Animated gradient line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 overflow-hidden rounded-full">
              <motion.div 
                className="w-full h-full bg-gradient-to-b from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
                animate={isAnimating ? { 
                  y: ["-100%", "0%"],
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="space-y-2">
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
                    transition={{ delay: index * 0.08 }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={activeLayer === layer.id}
                    aria-label={`${layer.name} - Layer ${index + 1}. ${layer.description}`}
                    className={`relative pl-12 cursor-pointer group outline-none ${
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
                      className={`absolute left-1 w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-lg ${
                        status === "blocked" 
                          ? "bg-gradient-to-br from-red-500 to-red-600 border-red-400 shadow-red-500/25" 
                          : status === "passed" 
                          ? "bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-green-500/25"
                          : status === "pending"
                          ? "bg-muted/50 border-muted-foreground/20"
                          : `bg-gradient-to-br ${layer.bgColor} border-current ${layer.color}`
                      }`}
                      animate={status === "blocked" || status === "passed" ? { scale: [1, 1.15, 1] } : {}}
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
                      className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                        activeLayer === layer.id
                          ? `${layer.bgColor} border-current ${layer.color} shadow-lg`
                          : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/80 group-hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${activeLayer === layer.id ? layer.color : "text-foreground"}`}>
                            {layer.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            L{index + 1}
                          </Badge>
                        </div>
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            activeLayer === layer.id ? "rotate-90" : ""
                          }`} 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{layer.description}</p>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {activeLayer === layer.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ 
                              height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                              opacity: { duration: 0.25, ease: "easeOut" }
                            }}
                            className="overflow-hidden"
                          >
                            <motion.div 
                              className="pt-3 space-y-3"
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
                            >
                              {/* Simulation Explanation */}
                              {selectedSimulation && (status === "passed" || status === "blocked") && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                  className={`p-2.5 rounded-lg border ${
                                    status === "blocked" 
                                      ? "bg-red-500/10 border-red-500/30" 
                                      : "bg-green-500/10 border-green-500/30"
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {status === "blocked" ? (
                                      <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className={`text-[10px] font-semibold mb-0.5 ${
                                        status === "blocked" ? "text-red-400" : "text-green-400"
                                      }`}>
                                        {status === "blocked" ? "BLOCKED" : "PASSED"}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        {status === "blocked" ? layer.blockedExplanation : layer.passedExplanation}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Components</p>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-2.5 w-2.5 text-muted-foreground/60 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                          <p className="text-xs">Security mechanisms that make up this layer.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div className="space-y-0.5">
                                    {layer.components.map((comp, i) => (
                                      <TooltipProvider key={i}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1.5 text-[10px] cursor-help hover:text-foreground transition-colors">
                                              <div className={`w-1 h-1 rounded-full ${layer.color.replace("text-", "bg-")}`} />
                                              <span className="underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">{comp.name}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[280px]">
                                            <p className="text-xs font-semibold mb-1">{comp.name}</p>
                                            <p className="text-xs text-muted-foreground">{comp.tooltip}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Threats</p>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-2.5 w-2.5 text-muted-foreground/60 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                          <p className="text-xs">Attack types this layer prevents.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div className="space-y-0.5">
                                    {layer.threats.map((threat, i) => (
                                      <TooltipProvider key={i}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1.5 text-[10px] cursor-help hover:text-foreground transition-colors">
                                              <AlertTriangle className="w-2.5 h-2.5 text-destructive flex-shrink-0" />
                                              <span className="underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">{threat.name}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[280px]">
                                            <p className="text-xs font-semibold mb-1">{threat.name}</p>
                                            <p className="text-xs text-muted-foreground">{threat.tooltip}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Attack Simulations */}
        <div className="lg:border-l lg:border-border/50 lg:pl-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/50 lg:from-primary/50" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attack Simulations</span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent lg:to-transparent" />
          </div>

          {/* Simulation Status Card */}
          <AnimatePresence mode="wait">
            {selectedSimulation ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                  !isAnimating && animationStep > 0
                    ? selectedSimulation.blockedAt 
                      ? "bg-green-500/5 border-green-500/30" 
                      : "bg-blue-500/5 border-blue-500/30"
                    : "bg-card/50 border-primary/30"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{selectedSimulation.name}</span>
                        {isAnimating && (
                          <motion.div 
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedSimulation.description}</p>
                    </div>
                    {isAnimating && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePause}
                        className="h-8 px-3 gap-1.5"
                        aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-3 w-3" />
                            <span className="text-xs">Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3" />
                            <span className="text-xs">Pause</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Visual Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {securityLayers.map((layer, idx) => {
                        const stepStatus = getLayerStatus(layer.id);
                        return (
                          <TooltipProvider key={layer.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div 
                                  className={`flex-1 h-2 rounded-full cursor-help transition-colors ${
                                    stepStatus === "blocked" 
                                      ? "bg-red-500" 
                                      : stepStatus === "passed" 
                                      ? "bg-green-500"
                                      : stepStatus === "pending"
                                      ? "bg-muted"
                                      : "bg-primary/30"
                                  }`}
                                  animate={stepStatus === "blocked" || stepStatus === "passed" ? { scale: [1, 1.1, 1] } : {}}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{layer.name}: {stepStatus}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Entry</span>
                      <span>Layer {Math.min(animationStep + 1, securityLayers.length)}/{securityLayers.length}</span>
                      <span>Database</span>
                    </div>
                  </div>

                  {/* Result */}
                  {!isAnimating && animationStep > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 pt-3 border-t border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        {selectedSimulation.blockedAt ? (
                          <>
                            <div className="p-1.5 rounded-lg bg-green-500/10">
                              <Shield className="h-4 w-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-400">Attack Blocked</p>
                              <p className="text-[10px] text-muted-foreground">
                                Stopped at {securityLayers.find(l => l.id === selectedSimulation.blockedAt)?.name}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 rounded-lg bg-blue-500/10">
                              <CheckCircle className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-400">Access Granted</p>
                              <p className="text-[10px] text-muted-foreground">
                                Legitimate user passed all layers
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-4 rounded-xl border border-dashed border-border/50 bg-muted/20"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Play className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Select a scenario</p>
                    <p className="text-xs">Click any attack below to see how it's handled</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulation Buttons */}
          <div className="grid grid-cols-1 gap-2" role="group" aria-label="Attack simulation scenarios">
            {attackSimulations.map((sim, index) => {
              const blockedLayer = securityLayers.find(l => l.id === sim.blockedAt);
              const isSelected = selectedSimulation?.id === sim.id;
              
              return (
                <Button
                  key={sim.id}
                  ref={(el) => { simRefs.current[index] = el; }}
                  variant="outline"
                  size="sm"
                  className={`justify-between h-auto py-2.5 px-3 text-left transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "hover:border-primary/50 hover:bg-card/80"
                  } ${focusedSimIndex === index ? "ring-2 ring-primary" : ""}`}
                  onClick={() => startSimulation(sim)}
                  onFocus={() => setFocusedSimIndex(index)}
                  aria-label={`Run simulation: ${sim.name}. ${sim.description}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{sim.name}</span>
                      {isSelected && isAnimating && (
                        <motion.div 
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {sim.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ml-2 flex-shrink-0 ${
                      sim.blockedAt 
                        ? `border-${blockedLayer?.color.replace("text-", "")}/50 ${blockedLayer?.color}`
                        : "border-blue-500/50 text-blue-400"
                    }`}
                  >
                    {sim.blockedAt ? `L${securityLayers.findIndex(l => l.id === sim.blockedAt) + 1}` : "✓"}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Documentation Link */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between group hover:bg-primary/5">
              <a 
                href="https://github.com/ritvikindupuri/ritvik-portfolio/blob/main/TECHNICAL_DOCUMENTATION.md" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <span className="flex items-center gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Full Documentation
                </span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
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
    </div>
  );
};