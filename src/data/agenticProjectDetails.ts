/**
 * Enriched details for Agentic Security Systems projects.
 * Data verified against each project's source code (not just its README).
 * 
 * Key features: 3-4 concrete bullets of what each project actually does
 * Architecture: 1-2 plain-language sentences that follow the diagram, start to finish
 */

export interface ProjectDetails {
  keyFeatures: string[];
  architecture: string;
}

export const agenticProjectDetails: Record<string, ProjectDetails> = {
  "CloudPilot AI: AWS Security & Operations Agent": {
    keyFeatures: [
      "Claude intent classifier routes each request to one of 9 specialist intents (plus a general fallback), each with a scoped tool allowlist for security, cost, drift, and ops domains",
      "Dual scan modes: Fast Scan (Claude Sonnet 5) for quick audits and Deep Audit (Claude Opus 5) for CIS Benchmark mapping and privilege escalation paths",
      "Claude safety-gate judge reviews every mutating AWS call and fails closed; changes also need a hash-bound human approval clicked in the UI before the executor runs them",
      "Optional in-VPC Lambda flags risky security-group and S3-policy changes from CloudTrail via EventBridge in real time; automatic remediation is scaffolded but not yet implemented"
    ],
    architecture: "A React dashboard sends each request to Supabase Edge Functions, where a Claude agent (Sonnet 5 or Opus 5) decides which AWS calls to make. Any change is checked by a safety judge and approved by a person before it runs with temporary AWS credentials, and every action is logged to CloudWatch and a write-once S3 archive."
  },

  "STRATA: Autonomous Cloud Intrusion Detection System": {
    keyFeatures: [
      "Four-stage agent pipeline (rule generation, telemetry sync with AI triage, containment requests, incident reporting) pulls CloudTrail and GuardDuty findings every 5 minutes while the dashboard is open",
      "Gemini 2.5 Flash triages each event and explains blocked actions; ATT&CK-mapped rule generation and incident reports use GPT-5",
      "When auto-response is on, critical findings that name an IAM access key become deactivation requests that expire after 1 hour; STRATA never disables a key on its own and refuses to target its own credentials",
      "Agent reasoning, findings, and incident reports land on a timeline that refreshes every 15 seconds, and every action is written to an audit log"
    ],
    architecture: "A dashboard on Cloudflare Workers pulls in CloudTrail and GuardDuty events every 5 minutes, Gemini 2.5 Flash triages each one, and GPT-5 writes detection rules and incident reports. If an IAM access key looks compromised, STRATA queues a deactivation request instead of acting alone, and all state lives in Supabase with AWS secrets encrypted."
  },

  "Cirrus: Autonomous Zero-Trust Cloud Security Auditor": {
    keyFeatures: [
      "Specialized agents (Recon, IAM Auditor, S3 Hunter, EC2 Network) run read-only AWS SDK scans powered by Gemini 3.5 Flash",
      "AWS credentials stay in browser sessionStorage, travel over HTTPS only with each scan request, and are never saved to the database",
      "Each AI-generated CloudFormation fix is previewed as a change set with a before/after resource diff, and every deployment appears in a per-resource history",
      "Live agent timeline streams agent thoughts and tool outputs via Supabase Realtime as each scan runs"
    ],
    architecture: "From the web app, Gemini 3.5 Flash agents audit IAM, S3 and EC2 using only read-only AWS calls, with keys that stay in the browser session. Each fix is a CloudFormation change that an operator previews and approves before it deploys, while Supabase keeps each user's data private with row-level security and streams scan progress live."
  },

  "Containment: AI Agent Security Firewall": {
    keyFeatures: [
      "Deterministic in-process guard engine (command normalization, path-jail checks, cloud-metadata and encoded-IP blocking, known rebinding-domain flags, pattern-based prompt-injection scanning) scores every proposed action",
      "Hardened Kubernetes sandbox pods run non-root (UID 1000) with a read-only root filesystem, all capabilities dropped and the RuntimeDefault seccomp profile; NetworkPolicy manifests deny ingress and restrict egress, with per-request egress also checked against the policy allowlist",
      "Optional AI advisory layer (Claude Opus 5 / Sonnet 5.5) provides second opinions and plain-English risk explanations without ever overriding deterministic rules",
      "Human-in-the-loop approval queue pauses runs on risky actions and shows AI-suggested preconditions before execution resumes"
    ],
    architecture: "Every shell command, file access or network request an AI agent proposes is checked by a deterministic policy engine, with Claude giving an optional second opinion that never overrides the rules. Risky actions wait for a human, approved ones can run in a locked-down Kubernetes sandbox pod, and Supabase keeps the policies, decisions and audit log."
  },

  "Spectra AI: Security Assessment, Orchestrated.": {
    keyFeatures: [
      "Real server-side Nmap service detection, Nikto/ZAP/Katana/Nuclei web checks, Semgrep source analysis, Trivy container scans, Prowler cloud posture, and Promptfoo AI red-teaming",
      "Deterministic authorization gate blocks public IP targets by default, requires env flags for active and cloud scans, and with Supabase enabled only scans verified project targets; Gemini only drafts the scope text",
      "Ephemeral hardened Docker containers (spectra-scanner:latest, Kali base) run each scan with capabilities dropped, a read-only rootfs and no-new-privileges; the UI shows an animated boot view",
      "Gemini 3 Flash Analysis Agent is prompted to verify each finding against raw tool evidence to reduce false positives, emitting structured findings with severity and remediation"
    ],
    architecture: "Scans start from a Next.js dashboard, and a scope check blocks public IPs and restricted domains by default, or anything off the verified target list when Supabase is on. Gemini 3 Flash then runs tools like Nmap, ZAP, Nuclei, Trivy and Semgrep in throwaway Docker containers and turns the output into a findings report, with Supabase as an optional add-on for team roles."
  },

  "AEGIS.ai: AI-Native Security Platform": {
    keyFeatures: [
      "Code scanner Edge Function (Gemini 2.5 Flash) performs context-aware static analysis for SQLi, XSS, and logic flaws",
      "GitHub scanner Edge Function retrieves public repo files via GitHub Contents API and analyzes code structures with Gemini 2.5 Flash",
      "Four specialized AI agents (SENTINEL, CODEX, AEGIS, ASSIST) on Gemini 2.5 Flash and GPT-5 use NVD CVE and CISA KEV context to guide developers through triage, code audits, threat modeling, and remediation",
      "Daily watch list of repos scanned by the scheduled-github-scan Edge Function when triggered by an external cron; a 0-100 security score is recalculated in SQL as vulnerabilities are found or resolved"
    ],
    architecture: "Code or a GitHub repo submitted in the dashboard goes to Supabase Edge Functions, which analyze it with Gemini 2.5 Flash, while GPT-5 powers the deeper chat assistants. Findings and scan history are saved in Supabase and can be exported as CSV or JSON along with AI-suggested fix patches."
  },

  "ThreatLens: Automated Threat Intelligence & Attack Surface Mapping Platform": {
    keyFeatures: [
      "AI policy check (Gemini 3 Flash Preview) runs before each scan from the browser, approving legitimate sites, blocking .mil and critical infrastructure, and flagging ambiguous domains for manual review",
      "Analysis engines run endpoint discovery, technology fingerprinting (about 20 common frameworks, CMSs and analytics tools), a security header review based on Firecrawl page data, and enrichment from RDAP and GeoIP",
      "CVE lookup: each detected technology is searched by keyword in the NIST NVD 2.0 API to surface related published CVEs, CVSS scores, and official advisories",
      "Optional Elasticsearch sync pushes scans, findings, and audit logs to your own cluster after each scan, powering ⌘K search and Kibana dashboards"
    ],
    architecture: "You enter a target domain and an AI policy check in the browser approves it, blocks it or flags it for review. Approved sites are mapped by Firecrawl (up to 200 URLs) and matched to NVD CVEs by keyword, Gemini writes the analysis and threat report, and results are saved in Supabase with optional Elasticsearch sync for fast search."
  },

  "AETHER: Autonomous Security Orchestrator": {
    keyFeatures: [
      "Investigates CrowdStrike Falcon incidents, detections, and host details through live Falcon API calls",
      "Correlates the host, incident, and detection data gathered through tool calls into a written attack timeline",
      "Network containment via the Falcon API: the agent pauses on contain_host and waits for analyst approval before isolating the host",
      "MCP-style tool interface (an in-process tool server modeled on MCP's list/call pattern) connects Gemini 3 Pro reasoning to the CrowdStrike Falcon REST API (OAuth2)"
    ],
    architecture: "The whole app runs in the browser, where a Gemini 3 Pro agent calls six CrowdStrike tools on a built-in MCP-style tool server that talks to the Falcon API, with an optional CORS proxy. Isolating a host waits for analyst approval, and the raw telemetry is turned into a written report."
  },

  "KARMA: Kubernetes Attack & Remediation Mapping Agent": {
    keyFeatures: [
      "Deploys real 3-node Kind cluster and executes 10 real-world Kubernetes attacks mapped to MITRE ATT&CK for Containers (HostPath escalation, RBAC escalation, container escape, secrets exfiltration, kubelet API abuse)",
      "Kubernetes watch-based detection monitors cluster mutations via real-time Watch APIs, evaluating pod creation, hostPath volumes, and privileged flags against 7 detection rules",
      "Claude Sonnet 4 reasons through High/Critical incidents and executes kubectl fixes one command per step, without a human approval step",
      "Every agent shows transparent execution: thinking → command → output, repeated for every step; detection alerts queue incidents for remediation"
    ],
    architecture: "A Python CLI or optional web dashboard launches 10 MITRE ATT&CK attacks against a deliberately vulnerable three-node Kind cluster. Kubernetes watch rules detect them, and Claude Sonnet 4 works through each serious incident and applies kubectl fixes one command at a time, with no human approval step."
  },

  "Chaff: Autonomous Bot-Traffic Analyst": {
    keyFeatures: [
      "Gemini tool-use agent investigates bot traffic in Elasticsearch, distinguishing scrapers, credential stuffing, and scanners from legitimate crawlers",
      "Agent autonomously executes search_logs and sample_requests tools to query customer Elasticsearch logs and record verified threats to Supabase",
      "Firecrawl scans the site during onboarding to detect its stack and exposed admin/login/API paths; honeypots are unique decoy trap URLs, and any visit is flagged as a bot",
      "MCP endpoint exposes four tools (known-bot checks, campaign lookup, recent campaigns, fingerprint lookup) for external MCP clients"
    ],
    architecture: "A Gemini agent running in TanStack Start server functions searches and samples customer traffic in Elasticsearch to spot bots. Confirmed threats and campaigns are saved in Supabase and can be exported as block rules for seven targets, including Cloudflare, nginx and AWS WAF."
  },

  "Traceveil: Evidence-First Security Graph and Agentic Defense": {
    keyFeatures: [
      "Attack graphs bind entities and remediations to evidence (Git commit SHAs, source line numbers, HTTP/TLS probes); model cannot invent graph facts",
      "Gemini 1.5 Pro powers tenant-isolation reasoning (with a deterministic offline fallback); remediation opens a real GitHub pull request with a rule-generated patch, and an in-browser drift check runs every 60 seconds",
      "Architecture diagram threat modeling: upload draw.io XML, Packet Tracer topology exports (JSON/XML), or describe architectures in natural language; exports hardened draw.io files",
      "MCP guardrails auditor inspects tool manifests and execution transcripts to catch prompt injection, tool poisoning, and parameter escalation, with an optional fail-closed audit relay"
    ],
    architecture: "Traceveil takes a code repo, a live URL or an architecture diagram and runs deterministic rules on the server, so every part of its security graph is tied to real evidence. Gemini 1.5 Pro handles the tenant-isolation chat, and data is kept in a local JSON store with GitHub tokens encrypted."
  }
};
