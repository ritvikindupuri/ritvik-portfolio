// Utility to scan a public GitHub repository and extract its actual skills & tech stack directly from the repo

export interface GitHubRepoParseResult {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): GitHubRepoParseResult | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const match = trimmed.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/i);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/i, '')
    };
  } catch {
    return null;
  }
}

const JUNK_TOKENS = new Set([
  'and', 'or', 'the', 'with', 'using', 'module', 'modules', 'engine', 'frontend', 'backend',
  'database', 'auth', 'server', 'category', 'technologies', 'technology', 'tools', 'used',
  'api', 'provider', 'providers', 'core', 'html', 'css', 'makefile', 'plpgsql', 'tex',
  'version', 'overview', 'features', 'installation', 'usage', 'license', 'description',
  'getting started', 'table', 'row', 'column', 'framework', 'library', 'platform', 'app'
]);

function cleanSkillName(raw: string): string {
  let s = raw
    // Strip markdown formatting, links, bullets, and symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown link -> text
    .replace(/!\[.*?\]\(.*?\)/g, '') // strip images
    .replace(/^[@*_`#\-\s•|:]+|[@*_`#\-\s•|:]+$/g, '')
    .replace(/\s*\(.*?\)/g, '') // remove parentheticals like (PostgreSQL, Edge Functions)
    .replace(/\s*v\d+(\.\d+)*/gi, '') // remove version numbers like v1.177.0
    .replace(/\s*\d+\.\d+\+?/g, '') // remove version numbers like 3.10+
    .trim();

  // Normalize common casing for known industry standards while preserving arbitrary terms
  const lower = s.toLowerCase();
  if (lower === 'ebpf' || lower === 'linux ebpf') return 'eBPF';
  if (lower === 'falco' || lower === 'sysdig falco') return 'Falco';
  if (lower === 'fastapi') return 'FastAPI';
  if (lower === 'typescript') return 'TypeScript';
  if (lower === 'javascript') return 'JavaScript';
  if (lower === 'python') return 'Python';
  if (lower === 'react') return 'React';
  if (lower === 'nextjs' || lower === 'next.js') return 'Next.js';
  if (lower === 'tailwind' || lower === 'tailwind css') return 'Tailwind CSS';
  if (lower === 'supabase') return 'Supabase';
  if (lower === 'postgresql' || lower === 'postgres') return 'PostgreSQL';
  if (lower === 'docker') return 'Docker';
  if (lower === 'kubernetes' || lower === 'k8s') return 'Kubernetes';
  if (lower === 'aws' || lower.startsWith('aws sdk')) return 'AWS SDK';
  if (lower === 'gemini' || lower.includes('google gemini')) return 'Google Gemini';
  if (lower.includes('openai')) return 'OpenAI';
  if (lower.includes('semgrep')) return 'Semgrep';
  if (lower.includes('framer motion')) return 'Framer Motion';
  if (lower === 'github actions') return 'GitHub Actions';
  if (lower === 'ci/cd' || lower === 'cicd') return 'CI/CD';

  // Capitalize title-case if all lowercase
  if (s.length > 1 && s === s.toLowerCase()) {
    return s.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return s;
}

/**
 * Extracts tech stack items directly from README sections (Tech Stack, Built With, Architecture, etc.)
 */
function extractFromReadmeTechSection(readme: string): string[] {
  const skills: string[] = [];

  // 1. Extract from shields.io badges in the README (e.g. ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python))
  const badgeMatches = [...readme.matchAll(/img\.shields\.io\/badge\/([^-\s?&/]+)/gi)];
  for (const m of badgeMatches) {
    try {
      const decoded = decodeURIComponent(m[1]).replace(/_/g, ' ');
      const cleaned = cleanSkillName(decoded);
      if (cleaned && cleaned.length >= 2 && !JUNK_TOKENS.has(cleaned.toLowerCase())) {
        skills.push(cleaned);
      }
    } catch {}
  }

  // 2. Extract from dedicated tech stack sections
  const sectionRegex = /(?:#+\s*(?:Tech\s*Stack|Built\s*With|Technologies(?:\s*Used)?|Technology\s*Stack|Tools\s*Used|Architecture|Stack))([\s\S]*?)(?=\n#+|$)/i;
  const sectionMatch = readme.match(sectionRegex);
  if (sectionMatch) {
    const content = sectionMatch[1];

    // Check table rows: | Category | Tech1, Tech2 |
    const tableLines = content.split('\n').filter(l => l.includes('|'));
    for (const line of tableLines) {
      if (line.includes('---')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        // Cells often contain comma/semicolon/bullet separated technologies
        const textToSplit = cells.slice(1).join(', ');
        const items = textToSplit.split(/[,;&•\n]/);
        for (const item of items) {
          const cleaned = cleanSkillName(item);
          if (cleaned && cleaned.length >= 2 && !JUNK_TOKENS.has(cleaned.toLowerCase())) {
            skills.push(cleaned);
          }
        }
      }
    }

    // Check list items: * **Frontend:** React, TypeScript, Tailwind CSS
    const listLines = content.split('\n').filter(l => /^\s*[-*•]/.test(l));
    for (const line of listLines) {
      const colonIdx = line.indexOf(':');
      const textToParse = colonIdx !== -1 ? line.slice(colonIdx + 1) : line.replace(/^[\s\-*•]+/, '');
      const items = textToParse.split(/[,;&•\n]/);
      for (const item of items) {
        const cleaned = cleanSkillName(item);
        if (cleaned && cleaned.length >= 2 && !JUNK_TOKENS.has(cleaned.toLowerCase())) {
          skills.push(cleaned);
        }
      }
    }
  }

  return skills;
}

/**
 * Extracts dependencies directly from package.json
 */
function extractFromPackageJson(pkg: any): string[] {
  const skills: string[] = [];
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  for (const dep of Object.keys(deps)) {
    if (dep.startsWith('@types/')) continue;
    if (dep.startsWith('@aws-sdk/')) {
      skills.push('AWS SDK');
      continue;
    }
    if (dep.includes('supabase')) {
      skills.push('Supabase');
      continue;
    }
    if (dep === 'react' || dep === 'react-dom') {
      skills.push('React');
      continue;
    }
    if (dep === 'next') {
      skills.push('Next.js');
      continue;
    }
    if (dep.includes('tailwind')) {
      skills.push('Tailwind CSS');
      continue;
    }
    if (dep.includes('framer-motion')) {
      skills.push('Framer Motion');
      continue;
    }
    if (dep.includes('google') && dep.includes('ai')) {
      skills.push('Google Gemini');
      continue;
    }
    if (dep.includes('openai')) {
      skills.push('OpenAI');
      continue;
    }
    if (dep.includes('reactflow') || dep.includes('@xyflow')) {
      skills.push('ReactFlow');
      continue;
    }
    if (dep === 'vue') {
      skills.push('Vue.js');
      continue;
    }
    if (dep === 'express') {
      skills.push('Express');
      continue;
    }
    if (dep === 'fastify') {
      skills.push('Fastify');
      continue;
    }
    if (dep === 'prisma' || dep === '@prisma/client') {
      skills.push('Prisma');
      continue;
    }
    if (dep === 'graphql') {
      skills.push('GraphQL');
      continue;
    }
    // Clean general package name
    const cleaned = cleanSkillName(dep.replace(/^@[^/]+\//, ''));
    if (cleaned && cleaned.length >= 3 && !JUNK_TOKENS.has(cleaned.toLowerCase())) {
      skills.push(cleaned);
    }
  }
  return skills;
}

/**
 * Extracts dependencies directly from requirements.txt
 */
function extractFromRequirementsTxt(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const pkg = line.split(/[=<>~;#\s]/)[0].trim().toLowerCase();
    if (!pkg) continue;
    if (pkg === 'fastapi') skills.push('FastAPI');
    else if (pkg === 'uvicorn') skills.push('Uvicorn');
    else if (pkg === 'pydantic') skills.push('Pydantic');
    else if (pkg === 'torch' || pkg === 'pytorch') skills.push('PyTorch');
    else if (pkg === 'tensorflow') skills.push('TensorFlow');
    else if (pkg === 'scikit-learn' || pkg === 'sklearn') skills.push('Scikit-Learn');
    else if (pkg === 'boto3') skills.push('AWS SDK');
    else if (pkg === 'langchain') skills.push('LangChain');
    else if (pkg === 'flask') skills.push('Flask');
    else if (pkg === 'django') skills.push('Django');
    else if (pkg === 'httpx' || pkg === 'requests') skills.push('HTTPX');
    else if (pkg === 'elasticsearch') skills.push('Elasticsearch');
    else if (pkg.length > 2 && !JUNK_TOKENS.has(pkg)) {
      skills.push(pkg.charAt(0).toUpperCase() + pkg.slice(1));
    }
  }
  return skills;
}

/**
 * Directly scans and extracts whatever skills/technologies exist in the GitHub repository.
 */
export async function scanGitHubRepoSkills(repoUrl: string): Promise<string[]> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return [];

  const { owner, repo } = parsed;
  const discovered: string[] = [];

  // 1. Check README directly for Tech Stack / Built With section & badges
  for (const branch of ['main', 'master', 'dev']) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`);
      if (res.ok) {
        const text = await res.text();
        const readmeSkills = extractFromReadmeTechSection(text);
        discovered.push(...readmeSkills);
        break;
      }
    } catch {}
  }

  // 2. Check package.json directly for actual project dependencies
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`);
      if (res.ok) {
        const pkg = await res.json();
        discovered.push(...extractFromPackageJson(pkg));
        break;
      }
    } catch {}
  }

  // 3. Check requirements.txt directly for actual Python dependencies
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/requirements.txt`);
      if (res.ok) {
        const text = await res.text();
        discovered.push(...extractFromRequirementsTxt(text));
        break;
      }
    } catch {}
  }

  // 4. Check Dockerfile
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/Dockerfile`);
      if (res.ok) {
        discovered.push('Docker');
        break;
      }
    } catch {}
  }

  // 5. Query GitHub Languages API directly from repository code
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (res.ok) {
      const langs = await res.json();
      Object.keys(langs).forEach(lang => {
        if (!JUNK_TOKENS.has(lang.toLowerCase())) {
          discovered.push(cleanSkillName(lang));
        }
      });
    }
  } catch {}

  // 6. Query GitHub Repo Topics directly from repo tags
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.topics)) {
        data.topics.forEach((t: string) => {
          const cleaned = cleanSkillName(t);
          if (cleaned && !JUNK_TOKENS.has(cleaned.toLowerCase())) {
            discovered.push(cleaned);
          }
        });
      }
      if (data.language && !JUNK_TOKENS.has(data.language.toLowerCase())) {
        discovered.push(cleanSkillName(data.language));
      }
    }
  } catch {}

  // Deduplicate preserving discovery order
  const uniqueSkills: string[] = [];
  const seen = new Set<string>();

  for (const skill of discovered) {
    const key = skill.toLowerCase().trim();
    if (!seen.has(key) && key.length >= 2 && !JUNK_TOKENS.has(key)) {
      seen.add(key);
      uniqueSkills.push(skill);
    }
  }

  return uniqueSkills.slice(0, 5);
}
