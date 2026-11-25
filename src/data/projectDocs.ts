/**
 * Portfolio-hosted PDFs for "View documentation" links.
 * Paths are served from public/docs on Cloudflare Pages.
 */
const docsByGithub: Record<string, string> = {
  "https://github.com/ritvikindupuri/AgentStrike": "/docs/agentstrike.pdf",
  "https://github.com/ritvikindupuri/AgentPot": "/docs/agentpot.pdf",
  "https://github.com/ritvikindupuri/Containment": "/docs/containment.pdf",
  "https://github.com/ritvikindupuri/Lume---Skill-detection": "/docs/lume.pdf",
  "https://github.com/ritvikindupuri/grok-bot-container-hardening-team": "/docs/container-hardening.pdf",
  "https://github.com/ritvikindupuri/EscapeArmed": "/docs/escapearmed.pdf",
  "https://github.com/ritvikindupuri/K8Admission": "/docs/k8admission.pdf",
  "https://github.com/ritvikindupuri/BuildBreaker": "/docs/buildbreaker.pdf",
  "https://github.com/ritvikindupuri/KARMA": "/docs/karma.pdf",
  "https://github.com/ritvikindupuri/CIRRUS_Cloud_Audit": "/docs/cirrus.pdf",
  "https://github.com/ritvikindupuri/OriginTrace_DevSecOps": "/docs/origintrace.pdf",
  "https://github.com/ritvikindupuri/CloudPilot-AI---AWS-Security-Agent": "/docs/cloudpilot.pdf",
  "https://github.com/ritvikindupuri/PenTest": "/docs/spectra.pdf",
  "https://github.com/ritvikindupuri/Spectra-AI---Agentic-Pentesting": "/docs/spectra.pdf",
  "https://github.com/ritvikindupuri/Aegis.ai": "/docs/aegis.pdf",
  "https://github.com/ritvikindupuri/Blastline-AI": "/docs/blastline.pdf",
  "https://github.com/ritvikindupuri/aws-cloud-dfir": "/docs/aws-cloud-dfir.pdf",
};

export function docUrlForGithub(url?: string | null): string | undefined {
  if (!url) return undefined;
  return docsByGithub[url.replace(/\/$/, "")];
}
