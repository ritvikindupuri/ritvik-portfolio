/**
 * Enriched details for Agentic Security Systems projects.
 * Data verified against each project's source code (not just its README).
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
      "Claude intent classifier routes each request to one of 9 specialist intents (plus a general fallback), each with a scoped tool allowlist for security, cost, drift, and ops domains",
      "Dual scan modes: Fast Scan (Claude Sonnet 5) for quick audits and Deep Audit (Claude Opus 5) for CIS Benchmark mapping and privilege escalation paths",
      "Claude safety-gate judge reviews every mutating AWS call and fails closed; changes also need a hash-bound human approval clicked in the UI before the executor runs them",
      "Optional in-VPC Lambda flags risky security-group and S3-policy changes from CloudTrail via EventBridge in real time; automatic remediation is scaffolded but not yet implemented"
    ],
    architecture: "React 18 + Vite dashboard on Supabase Edge Functions (Deno); Claude Sonnet 5 / Opus 5 orchestrate AWS API calls with temporary STS credentials; audit logs go to CloudWatch Logs and an S3 Object Lock (WORM) archive; optional in-VPC Lambda for event-driven detection"
  },

  "STRATA — Autonomous Cloud Intrusion Detection System": {
    keyFeatures: [
      "Four-stage agent pipeline (rule generation, telemetry sync with AI triage, approval-gated containment, incident reporting) pulls CloudTrail and GuardDuty findings every 5 minutes while the dashboard is open",
      "High-volume events triaged by Gemini 2.5 Flash; ATT&CK-mapped rule generation and executive reports use GPT-5",
      "Containment agent proposes deactivating compromised IAM access keys and waits for analyst approval before calling iam:UpdateAccessKey; requests expire after 1 hour",
      "Full agent reasoning, CLI commands, and telemetry stream live to the dashboard; every action is timestamped and attributed"
    ],
    architecture: "React 19 + TanStack Start on Cloudflare Workers; a four-stage agent pipeline (Rule Architect, Telemetry Sync and Triage, Containment, Incident Reporter) runs on Gemini 2.5 Flash and GPT-5; state persisted in Supabase PostgreSQL with AES-256-GCM-encrypted AWS secrets and optional Elasticsearch import"
  },

  "Cirrus — Autonomous Zero‑Trust Cloud Security Auditor": {
    keyFeatures: [
      "Specialized agents (Recon, IAM Auditor, S3 Hunter, EC2 Network) run read-only AWS SDK scans powered by Gemini 3.5 Flash",
      "AWS credentials stay in browser sessionStorage, transmitted over SSL to short-lived RPC endpoints, and never saved to the database",
      "Each AI-generated CloudFormation fix is previewed as a change set with a before/after resource diff, and every deployment appears in a per-resource history",
      "Live agent timeline streams agent thoughts and tool outputs via Supabase Realtime as each scan runs"
    ],
    architecture: "TanStack Start (React 19) web app with Supabase backend; Gemini 3.5 Flash drives read-only AWS SDK queries via temporary credentials; CloudFormation remediation playbooks deploy with capability acknowledgment gates; RLS isolates each organization's records"
  },

  "Containment — AI Agent Security Firewall": {
    keyFeatures: [
      "Deterministic in-process guard engine (command normalization, path-jail checks, cloud-metadata and encoded-IP blocking, known rebinding-domain flags, pattern-based prompt-injection scanning) scores every proposed action",
      "Hardened Kubernetes sandbox pods run non-root (UID 1000) with a read-only root filesystem on gVisor; NetworkPolicy manifests deny ingress and restrict egress, with per-request egress also checked against the policy allowlist",
      "Optional AI advisory layer (Claude Opus 5 / Sonnet 5.5) provides second opinions and plain-English risk explanations without ever overriding deterministic rules",
      "Human-in-the-loop approval queue pauses runs on risky actions and shows AI-suggested preconditions before execution resumes"
    ],
    architecture: "React 19 + TanStack Start frontend with server functions; deterministic policy engine intercepts proposed shell commands, filesystem access, and network requests; approved actions execute inside hardened Kubernetes sandbox pods (a non-isolated local fallback exists for development); Supabase stores policies, approval decisions, and audit logs"
  },

  "Spectra AI — Security Assessment, Orchestrated.": {
    keyFeatures: [
      "Real server-side Nmap service detection, Nikto/ZAP/Katana/Nuclei web checks, Semgrep source analysis, Trivy container scans, Prowler cloud posture, and Promptfoo AI red-teaming",
      "Deterministic authorization gate blocks public IP targets by default, requires env flags for active and cloud scans, and enforces a verified-target allowlist; Gemini 3.6 Flash only drafts the scope text",
      "Ephemeral hardened Docker containers (spectra-scanner:latest, Kali base) run each scan with capabilities dropped, a read-only rootfs and no-new-privileges; the UI shows an animated boot view",
      "Gemini 2.5 Flash Analysis Agent is prompted to verify each finding against raw tool evidence to reduce false positives, emitting structured findings with severity and remediation"
    ],
    architecture: "Next.js 15 + React 18 dashboard; Gemini 2.5 Flash coordinates Nmap, Nikto, ZAP, Katana, Nuclei, Trivy, Semgrep, Schemathesis, Prowler, and Promptfoo inside ephemeral spectra-scanner Docker containers (falling back to host execution when Docker is unavailable); optional Supabase for multi-tenant RBAC and verified target allowlists"
  },

  "AEGIS.ai – AI-Native Security Platform": {
    keyFeatures: [
      "Code scanner Edge Function (Gemini 2.5 Flash) performs context-aware static analysis for SQLi, XSS, and logic flaws",
      "GitHub scanner Edge Function retrieves public repo files via GitHub Contents API and analyzes code structures with Gemini 2.5 Flash",
      "Four specialized AI agents (SENTINEL, CODEX, AEGIS, ASSIST) use NVD CVE and CISA KEV context to guide developers through triage, code audits, threat modeling, and remediation",
      "Daily watch list of repos scanned by the scheduled-github-scan Edge Function when triggered by an external cron; a 0-100 security score is recalculated in SQL as vulnerabilities are found or resolved"
    ],
    architecture: "React 18 + Vite dashboard; Supabase Edge Functions (Deno) run code-scanner and github-scanner powered by Gemini 2.5 Flash and GPT-5; findings, scan history, and security stats persist in Supabase PostgreSQL; automated CSV/JSON exports and AI-generated auto_fix patches"
  },

  "ThreatLens — Automated Threat Intelligence & Attack Surface Mapping Platform": {
    keyFeatures: [
      "AI policy gate (Gemini 3 Flash Preview) auto-approves legitimate sites, blocks .mil/critical infrastructure, and flags ambiguous domains for manual review",
      "Analysis engines run endpoint discovery, technology fingerprinting (20 common frameworks, CMSs and analytics tools), a security headers audit, and enrichment from RDAP and GeoIP",
      "Real CVE vulnerability detection: detected technology stacks queried against NIST NVD 2.0 database to surface published CVEs, CVSS scores, and official advisories",
      "Elasticsearch enterprise search (⌘K) auto-syncs scans, findings, and audit logs to Elastic Cloud for sub-second search and Kibana threat analytics"
    ],
    architecture: "React 18 + Vite dashboard; Firecrawl API maps targets up to 200 URLs; Gemini 3 Flash Preview powers policy evaluation, AI analyst chatbot, and threat report generation; findings and scans persist in Supabase; optional Elasticsearch sync for sub-second search across threatlens-scans, threatlens-findings, and threatlens-audit indices"
  },

  "AETHER — Autonomous Security Orchestrator": {
    keyFeatures: [
      "Deep forensic audits execute comprehensive analyses of CrowdStrike Falcon incidents and alerts via live API telemetry",
      "Attack lineage tracing correlates host, incident, and detection evidence gathered through tool calls into a written timeline",
      "Network containment via the Falcon API: the agent pauses on contain_host and waits for analyst approval before isolating the host",
      "MCP-style tool interface (an in-process tool server modeled on MCP's list/call pattern) connects Gemini 3 Pro reasoning to the CrowdStrike Falcon REST API (OAuth2)"
    ],
    architecture: "Browser-only React 19 + Vite app; a Gemini 3 Pro Preview agent uses function calling to dispatch six tools on an in-process, MCP-style CrowdStrike tool server, which calls the Falcon API through a CORS proxy; raw telemetry is returned as observations and synthesized into reports"
  },

  "KARMA — Kubernetes Attack & Remediation Mapping Agent": {
    keyFeatures: [
      "Deploys real 3-node Kind cluster and executes 10 real-world Kubernetes attacks mapped to MITRE ATT&CK for Containers (HostPath escalation, RBAC escalation, container escape, secrets exfiltration, kubelet API abuse)",
      "Kubernetes watch-based detection monitors cluster mutations via real-time Watch APIs, evaluating pod creation, hostPath volumes, and privileged flags against 7 detection rules",
      "Claude Sonnet 4 reasons through High/Critical incidents and executes kubectl fixes one command per step, without a human approval step",
      "Every agent shows transparent execution: thinking → command → output, repeated for every step; detection alerts queue incidents for remediation"
    ],
    architecture: "Python CLI plus an optional FastAPI + React dashboard orchestrate attack modules via Kubernetes Python client; Claude Sonnet 4 ingests incident telemetry and synthesizes kubectl remediation commands executed via subprocess; real Kind cluster (3 nodes: 1 control plane + 2 workers) with intentionally vulnerable RBAC and test secrets"
  },

  "Chaff — Autonomous Bot-Traffic Analyst": {
    keyFeatures: [
      "Gemini tool-use agent investigates bot traffic in Elasticsearch, distinguishing scrapers, credential stuffing, and scanners from legitimate crawlers",
      "Agent autonomously executes search_logs and sample_requests tools to query customer Elasticsearch logs and record verified threats to Supabase",
      "Firecrawl scans the site during onboarding to detect its stack and exposed admin/login/API paths; honeypots are unique decoy trap URLs, and any visit is flagged as a bot",
      "MCP endpoint exposes four tools (known-bot checks, campaign lookup, recent campaigns, fingerprint lookup) for external MCP clients"
    ],
    architecture: "React + Vite + TanStack (Router, Query, Start) frontend; TanStack Server Functions orchestrate Gemini 3 Flash Preview agent with native tools (search_logs, sample_requests, record_threat); Supabase stores threats, campaigns, and block rules exportable to 7 targets (Cloudflare, nginx, Caddy, HAProxy, AWS WAF, iptables, Fastly); Firecrawl powers onboarding site scans"
  },

  "Traceveil — Evidence-First Security Graph and Agentic Defense": {
    keyFeatures: [
      "Attack graphs bind entities and remediations to evidence (Git commit SHAs, source line numbers, HTTP/TLS probes); model cannot invent graph facts",
      "Gemini 1.5 Pro powers tenant-isolation reasoning (with a deterministic offline fallback); remediation opens a real GitHub pull request with a rule-generated patch, and an in-browser drift check runs every 60 seconds",
      "Architecture diagram threat modeling: upload draw.io XML, Packet Tracer topology exports (JSON/XML), or describe architectures in natural language; exports hardened draw.io files",
      "MCP guardrails auditor inspects tool manifests and execution transcripts to catch prompt injection, tool poisoning, and parameter escalation with fail-closed proxy relay"
    ],
    architecture: "TanStack Start (React 19) with server functions; analyzes repositories (GitHub API tree), live HTTPS endpoints, or topology diagrams, with Gemini 1.5 Pro for tenant-isolation chat; deterministic rules bind evidence to graph entities; self-contained JSON file store with atomic writes, scrypt password hashing, and AES-256-GCM for GitHub PATs"
  }
};
