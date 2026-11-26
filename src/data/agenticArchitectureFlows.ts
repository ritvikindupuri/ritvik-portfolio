import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Zap, BrainCircuit, ShieldCheck, UserCheck, Cloud, Archive, Radar, KeyRound,
  Database, FileCode2, Bot, ShieldAlert, Container, Monitor, Code2, FileText, Globe, ScanSearch,
  Search, Wrench, SquareTerminal, Swords, Boxes, Server, ShieldBan, GitBranch, ListChecks,
  Network, HardDrive,
} from "lucide-react";

export interface FlowNode {
  icon: LucideIcon;
  label: string;
  sub?: string;
  /** "gate" = a human approval checkpoint; rendered with an amber accent */
  kind?: "gate";
}

/**
 * Icon-based architecture flows for the Agentic Security Systems side panel.
 * Built from the code-verified architecture in agenticProjectDetails.ts / the repo audit.
 * Keyed by a lowercase substring of the project title.
 */
export const agenticArchitectureFlows: { match: string; nodes: FlowNode[] }[] = [
  {
    match: "cloudpilot",
    nodes: [
      { icon: LayoutDashboard, label: "React dashboard", sub: "Vite SPA" },
      { icon: Zap, label: "Edge Functions", sub: "Supabase · Deno" },
      { icon: BrainCircuit, label: "Claude agent", sub: "Intent router" },
      { icon: ShieldCheck, label: "Safety judge", sub: "Fails closed" },
      { icon: UserCheck, label: "Human approval", sub: "Hash-bound", kind: "gate" },
      { icon: Cloud, label: "AWS APIs", sub: "STS temp creds" },
      { icon: Archive, label: "Audit trail", sub: "CloudWatch · S3 WORM" },
    ],
  },
  {
    match: "strata",
    nodes: [
      { icon: Monitor, label: "Dashboard", sub: "Cloudflare Workers" },
      { icon: Radar, label: "Telemetry sync", sub: "CloudTrail · GuardDuty" },
      { icon: BrainCircuit, label: "AI triage", sub: "Gemini 2.5 Flash" },
      { icon: FileText, label: "Rules & reports", sub: "GPT-5" },
      { icon: KeyRound, label: "Key review queue", sub: "Expires in 1h", kind: "gate" },
      { icon: Database, label: "Supabase", sub: "AES-256-GCM secrets" },
    ],
  },
  {
    match: "cirrus",
    nodes: [
      { icon: Monitor, label: "Web app", sub: "TanStack Start" },
      { icon: BrainCircuit, label: "Gemini agents", sub: "IAM · S3 · EC2" },
      { icon: Cloud, label: "AWS read-only", sub: "Session keys" },
      { icon: FileCode2, label: "CloudFormation fix", sub: "Change-set preview" },
      { icon: UserCheck, label: "Operator approval", sub: "Capability ack", kind: "gate" },
      { icon: Database, label: "Supabase", sub: "RLS · Realtime" },
    ],
  },
  {
    match: "containment",
    nodes: [
      { icon: Bot, label: "AI agent", sub: "Proposed action" },
      { icon: ShieldAlert, label: "Policy engine", sub: "Deterministic rules" },
      { icon: BrainCircuit, label: "Claude advisor", sub: "Second opinion" },
      { icon: UserCheck, label: "Human review", sub: "Borderline actions", kind: "gate" },
      { icon: Container, label: "K8s sandbox", sub: "Hardened pod" },
      { icon: Database, label: "Audit log", sub: "Supabase" },
    ],
  },
  {
    match: "spectra",
    nodes: [
      { icon: Monitor, label: "Dashboard", sub: "Next.js 15" },
      { icon: ShieldCheck, label: "Scope gate", sub: "Verified allowlist" },
      { icon: BrainCircuit, label: "Gemini planner", sub: "3 Flash" },
      { icon: Container, label: "Scanner containers", sub: "Hardened Kali" },
      { icon: FileText, label: "Findings report", sub: "Correlated results" },
      { icon: Database, label: "Supabase", sub: "Optional RBAC" },
    ],
  },
  {
    match: "aegis",
    nodes: [
      { icon: Code2, label: "Code / GitHub repo", sub: "Scan input" },
      { icon: LayoutDashboard, label: "Dashboard", sub: "React · Vite" },
      { icon: Zap, label: "Edge Functions", sub: "code & github scanner" },
      { icon: BrainCircuit, label: "Gemini analysis", sub: "2.5 Flash" },
      { icon: Database, label: "Supabase", sub: "Findings · history" },
      { icon: FileCode2, label: "Exports & fixes", sub: "CSV/JSON · auto_fix" },
    ],
  },
  {
    match: "threatlens",
    nodes: [
      { icon: Globe, label: "Target domain", sub: "User input" },
      { icon: ShieldCheck, label: "AI policy check", sub: "Approve / block" },
      { icon: ScanSearch, label: "Firecrawl", sub: "Up to 200 URLs" },
      { icon: BrainCircuit, label: "Gemini analyst", sub: "CVEs · reports" },
      { icon: Database, label: "Supabase", sub: "Scans · findings" },
      { icon: Search, label: "Elasticsearch", sub: "Optional sync" },
    ],
  },
  {
    match: "aether",
    nodes: [
      { icon: Monitor, label: "Browser app", sub: "React 19 · Vite" },
      { icon: BrainCircuit, label: "Gemini agent", sub: "Function calling" },
      { icon: Wrench, label: "MCP-style tools", sub: "6 Falcon tools" },
      { icon: UserCheck, label: "Analyst approval", sub: "contain_host", kind: "gate" },
      { icon: Cloud, label: "Falcon API", sub: "OAuth2 REST" },
      { icon: FileText, label: "Report", sub: "Synthesized intel" },
    ],
  },
  {
    match: "karma",
    nodes: [
      { icon: SquareTerminal, label: "CLI / dashboard", sub: "Python · FastAPI" },
      { icon: Swords, label: "Attack modules", sub: "10 MITRE techniques" },
      { icon: Boxes, label: "Kind cluster", sub: "1 control + 2 workers" },
      { icon: Radar, label: "Watch detection", sub: "7 alert rules" },
      { icon: BrainCircuit, label: "Claude Sonnet 4", sub: "Incident reasoning" },
      { icon: Wrench, label: "kubectl fixes", sub: "One cmd per step" },
    ],
  },
  {
    match: "chaff",
    nodes: [
      { icon: Search, label: "Elasticsearch logs", sub: "Customer traffic" },
      { icon: Server, label: "Server functions", sub: "TanStack Start" },
      { icon: BrainCircuit, label: "Gemini agent", sub: "search · sample · record" },
      { icon: Database, label: "Supabase", sub: "Threats · campaigns" },
      { icon: ShieldBan, label: "Block rules", sub: "7 export targets" },
    ],
  },
  {
    match: "traceveil",
    nodes: [
      { icon: GitBranch, label: "Inputs", sub: "3 input types" },
      { icon: Server, label: "Server functions", sub: "TanStack Start" },
      { icon: ListChecks, label: "Evidence rules", sub: "Deterministic" },
      { icon: Network, label: "Security graph", sub: "Evidence-bound" },
      { icon: BrainCircuit, label: "Gemini 1.5 Pro", sub: "Isolation chat" },
      { icon: HardDrive, label: "JSON store", sub: "AES-GCM PATs" },
    ],
  },
];

export const getArchitectureFlow = (title: string): FlowNode[] | undefined =>
  agenticArchitectureFlows.find((f) => title.toLowerCase().includes(f.match))?.nodes;
