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
  "AgentPot": {
    keyFeatures: [
      "Decoy MCP server with fake tools, resources, and planted credentials that log every connection and tool call",
      "Classification engine scores sessions 0-100 based on severity (keyless probes=20, real tool calls=60, credential misuse=100)",
      "Live dashboard updates every 4 seconds showing visitor IPs, timestamps, session activity, and risk scores",
      "Grok Bot team (4 specialized agents) designs lures, analyzes traffic, tests surfaces, and posts daily plain-words summaries"
    ],
    architecture: "React dashboard and Next.js API routes serve public decoy pages, MCP endpoints, and canary links; every request is header-sanitized and written to Supabase; Grok bots coordinate via imported templates"
  },
  
  "Lume Skill Detection": {
    keyFeatures: [
      "35 deterministic regex rules check for prompt injection, data exfiltration, supply-chain compromise, and bias patterns",
      "Live GPT review streams reasoning tokens via SSE, surfacing multi-step semantic threats that pattern matching misses",
      "Human-in-the-loop approval queue where analysts confirm real risks or dismiss false positives with written notes",
      "Policy board lets admins set review and block score thresholds, preview how changes reclassify existing scans"
    ],
    architecture: "TanStack Start (React 19) web app runs client-side deterministic checks, sends artifact content to authenticated `/api/ai-scan` server function that streams GPT-6-astra reasoning, then merges findings and applies risk scoring against workspace policy stored in Supabase"
  }
};
