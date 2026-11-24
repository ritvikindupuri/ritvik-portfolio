/**
 * Enriched details for Agentic Security Systems projects.
 * Data sourced from actual GitHub repositories and READMEs.
 * 
 * Key features: 3-4 concrete bullets of what each project actually does
 * Architecture: One plain-language sentence on how it's built
 */

export interface ProjectDetails {
  keyFeatures: string[];
  architecture: string;
}

export const agenticProjectDetails: Record<string, ProjectDetails> = {
  "CloudPilot AI — AWS Security & Operations Agent": {
    keyFeatures: [
      "Intent classifier (Claude Sonnet 5) routes queries to 9 specialist personas with scoped tool allowlists for security, cost, drift, and ops domains",
      "Dual scan engines: Fast Scan (Claude Sonnet 5, 2-5 sec) for quick audits and Deep Audit (Claude Opus 5, 10-20 sec) for CIS Benchmarks and privilege escalation paths",
      "Safety gate reviews proposed AWS API actions before execution, checking against user policies and blocking unauthorized changes",
      "In-VPC Lambda agent catches CloudTrail events in under 2 seconds and autonomously closes high-risk ports and enforces S3 Public Access Blocks"
    ],
    architecture: "React dashboard with TanStack Start; Claude Sonnet 5 / Opus 5 orchestrate AWS SDK v3 calls via temporary STS credentials; triple-sink audit logging (CloudWatch, immutable S3 WORM, local SQLite); optional in-VPC Lambda sidecar for event-driven auto-remediation"
  },

  "STRATA — Autonomous Cloud Intrusion Detection System": {
    keyFeatures: [
      "Six specialized agents poll CloudTrail and GuardDuty across all AWS planes, normalize events, and feed them to AI for threat triage",
      "High-volume events triaged by Gemini 2.5 Flash; ATT&CK-mapped rule generation and executive reports use GPT-5",
      "Containment agent deactivates compromised IAM access keys the moment a critical threat is confirmed when auto-response is enabled",
      "Full agent reasoning, CLI commands, and telemetry stream live to the dashboard; every action is timestamped and attributed"
    ],
    architecture: "React 19 + TanStack Start dashboard; six autonomous agents (Rule Architect, Telemetry Collector, Threat Triage, Containment, Incident Reporter, Log Indexer) coordinate via Gemini 2.5 Flash and GPT-5; all state persisted in Supabase PostgreSQL with optional Elasticsearch integration"
  },

  "Cirrus — Autonomous Zero‑Trust Cloud Security Auditor": {
    keyFeatures: [
      "Specialized agents (Recon, IAM Auditor, S3 Hunter, EC2 Network) run read-only AWS SDK scans powered by Gemini 3.5 Flash",
      "AWS credentials stay in browser sessionStorage, transmitted over SSL to short-lived RPC endpoints, and never saved to the database",
      "Pre-remediation resource diff preview shows exact before/after changes with cryptographic state snapshots before CloudFormation deployment",
      "Live agent timeline streams via Supabase WebSockets; regex search filters agent thoughts and tool outputs in real time"
    ],
    architecture: "TanStack Start (React 19) web app with Supabase backend; Gemini 3.5 Flash drives read-only AWS SDK queries via temporary credentials; CloudFormation remediation playbooks deploy with capability acknowledgment gates; RLS isolates each organization's records"
  },

  "Containment — AI Agent Security Firewall": {
    keyFeatures: [
      "Deterministic guard engine (command normalization, path traversal resolution, DNS rebinding detection, prompt injection scanning) calculates risk scores under 10ms",
      "Hardened Kubernetes Sandbox Pods run with restricted security standards (non-root UID 1000, read-only rootfs, all capabilities dropped, dynamic NetworkPolicy egress isolation)",
      "Optional AI advisory layer (Claude Opus 5 / Sonnet 5.5) provides second opinions and plain-English risk explanations without ever overriding deterministic rules",
      "Human-in-the-loop approval queue pauses runs on risky actions and shows AI-suggested preconditions before execution resumes"
    ],
    architecture: "React 19 + TanStack Start frontend with server functions; deterministic policy engine intercepts proposed shell commands, filesystem access, and network requests; approved actions execute inside hardened Kubernetes Sandbox Pods or local emulator; Supabase stores policies, approval decisions, and audit logs"
  },

  "Spectra AI — Security Assessment, Orchestrated.": {
    keyFeatures: [
      "Real server-side Nmap service detection, Nikto/ZAP/Katana/Nuclei web checks, Semgrep source analysis, Trivy container scans, Prowler cloud posture, and Promptfoo AI red-teaming",
      "AI policy gate (Gemini 3.6 Flash for scope drafts, Gemini 2.5 Flash for execution) auto-approves legitimate sites, blocks sensitive targets, and flags ambiguous domains for review",
      "Ephemeral Docker containers (spectra-scanner:latest) spawn with dropped capabilities and read-only rootfs for each scan; live animated Kasm-style boot view in the UI",
      "Gemini 2.5 Flash Analysis Agent uses zero-false-positive deductive verification protocol to emit structured findings with CVSS scores and remediation"
    ],
    architecture: "Next.js 15 + React 18 dashboard; Gemini 2.5 Flash coordinates Nmap, Nikto, ZAP, Katana, Nuclei, Trivy, Semgrep, Schemathesis, Prowler, and Promptfoo inside ephemeral spectra-scanner Docker containers or cloud container runtime; optional Supabase for multi-tenant RBAC and verified target allowlists"
  },

  "AEGIS.ai – AI-Native Security Platform": {
    keyFeatures: [
      "Code scanner Edge Function (Gemini 2.5 Flash) performs context-aware static analysis for SQLi, XSS, and logic flaws",
      "GitHub scanner Edge Function retrieves public repo files via GitHub Contents API and analyzes code structures with Gemini 2.5 Flash",
      "Four specialized AI agents (SENTINEL, CODEX, AEGIS, ASSIST) use NVD CVE and CISA KEV context to guide developers through triage, code audits, threat modeling, and remediation",
      "Scheduled daily scans execute at 9:00 AM UTC via github-scanner Edge Function; dynamic 0-100 security score updates as vulnerabilities are detected or resolved"
    ],
    architecture: "React 18 + Vite dashboard; Supabase Edge Functions (Deno) run code-scanner and github-scanner powered by Gemini 2.5 Flash and GPT-5; findings, scan history, and security stats persist in Supabase PostgreSQL; automated CSV/JSON exports and AI-generated auto_fix patches"
  },

  "ThreatLens — Automated Threat Intelligence & Attack Surface Mapping Platform": {
    keyFeatures: [
      "AI policy gate (Gemini 3 Flash Preview) auto-approves legitimate sites, blocks .mil/critical infrastructure, and flags ambiguous domains for manual review",
      "Parallel analysis engines run endpoint discovery, technology fingerprinting (50+ stacks), security headers audit, and multi-source enrichment (RDAP WHOIS, GeoIP, SSL/TLS)",
      "Real CVE vulnerability detection: detected technology stacks queried against NIST NVD 2.0 database to surface published CVEs, CVSS scores, and official advisories",
      "Elasticsearch enterprise search (⌘K) auto-syncs scans, findings, and audit logs to Elastic Cloud for sub-second search and Kibana threat analytics"
    ],
    architecture: "React 18 + Vite dashboard; Firecrawl API crawls targets up to 500 endpoints; Gemini 3 Flash Preview powers policy evaluation, AI analyst chatbot, and threat report generation; findings and scans persist in Supabase; optional Elasticsearch sync for sub-second search across threatlens-scans, threatlens-findings, and threatlens-audit indices"
  },

  "AETHER — Autonomous Security Orchestrator": {
    keyFeatures: [
      "Deep forensic audits execute comprehensive analyses of CrowdStrike Falcon incidents and alerts via live API telemetry",
      "Attack lineage tracing tracks and visualizes threat progression through host, incident, and detection evidence gathered via MCP tool calls",
      "Network containment (Falcon host contain/lift actions) proposed by agent waits for analyst approval before execution at the kernel level",
      "MCP-native orchestration seamlessly integrates Gemini 3 Pro reasoning with CrowdStrike Falcon REST API (OAuth2) using Model Context Protocol"
    ],
    architecture: "React 19 + Tailwind CSS dashboard; MCP client (AgentController) uses Gemini 3 Pro Preview to dispatch tool calls to CrowdStrike MCP Server; MCP Server translates requests into CrowdStrike Falcon API calls; raw telemetry returned as observations and synthesized into expert-level reports"
  },

  "KARMA — Kubernetes Attack & Remediation Mapping Agent": {
    keyFeatures: [
      "Deploys real 3-node Kind cluster and executes 10 real-world Kubernetes attacks mapped to MITRE ATT&CK for Containers (HostPath escalation, RBAC escalation, container escape, secrets exfiltration, kubelet API abuse)",
      "Kubernetes watch-based detection monitors cluster mutations via real-time Watch APIs, evaluating pod creation, hostPath volumes, and privileged flags against 7 detection rules",
      "Claude Sonnet 4 autonomously remediates High/Critical incidents with full chain-of-thought reasoning in Full Engagement mode",
      "Every agent shows transparent execution: thinking → command → output, repeated for every step; detection alerts queue incidents for remediation"
    ],
    architecture: "Python CLI + FastAPI backend orchestrate attack modules via Kubernetes Python client; Claude Sonnet 4 ingests incident telemetry and synthesizes kubectl remediation commands executed via subprocess; real Kind cluster (3 nodes: 1 control plane + 2 workers) with intentionally vulnerable RBAC and test secrets"
  },

  "Chaff — Autonomous Bot-Traffic Analyst": {
    keyFeatures: [
      "Gemini tool-use agent investigates bot traffic in Elasticsearch, distinguishing scrapers, credential stuffing, and scanners from legitimate crawlers",
      "Agent autonomously executes search_logs and sample_requests tools to query customer Elasticsearch logs and record verified threats to Supabase",
      "Firecrawl integration crawls target sites and generates deceptive honeypot trap pages; traffic hitting hidden URLs flagged as malicious in dashboard",
      "Separate MCP server exposes four tools (known-bot checks, campaign lookup, recent campaigns, fingerprint lookup) for external MCP clients"
    ],
    architecture: "React + Vite + TanStack (Router, Query, Start) frontend; TanStack Server Functions orchestrate Gemini 3 Flash Preview agent with native tools (search_logs, sample_requests, record_threat); Supabase stores threats, campaigns, and block rules; Firecrawl API generates honeypot pages"
  },

  "Traceveil — Evidence-First Security Graph and Agentic Defense": {
    keyFeatures: [
      "Attack graphs bind entities and remediations to evidence (Git commit SHAs, source line numbers, HTTP/TLS probes); model cannot invent graph facts",
      "Feature-specific agents use Gemini 1.5 Pro for tenant-isolation reasoning and opening remediation pull requests, and Gemini 1.5 Flash for 60-second runtime watchdog on live web targets",
      "Architecture diagram threat modeling: upload draw.io XML, Cisco Packet Tracer (.pkt/.pka), or describe architectures in natural language; exports hardened draw.io files",
      "MCP guardrails auditor inspects tool manifests and execution transcripts to catch prompt injection, tool poisoning, and parameter escalation with fail-closed proxy relay"
    ],
    architecture: "TanStack Start (React 19) with server functions; Google Argon 4 and Gemini 1.5 Pro/Flash agents analyze repositories (GitHub API clone), live HTTPS endpoints, or topology diagrams; deterministic rules bind evidence to graph entities; self-contained SQLite (WAL mode) with Drizzle ORM, scrypt password hashing, and AES-256-GCM for GitHub PATs"
  }
};
