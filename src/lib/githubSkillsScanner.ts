// Utility to scan a public GitHub repository for its top 5 skills and technologies

const IGNORED_LANGUAGES = new Set([
  'makefile', 'html', 'css', 'plpgsql', 'tex', 'cmake', 'batchfile', 'roff', 'powershell', 'vim script'
]);

const KNOWN_TECH_MAP: Record<string, string> = {
  // Languages
  'python': 'Python', 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'go': 'Go', 'golang': 'Go',
  'rust': 'Rust', 'java': 'Java', 'c++': 'C++', 'cpp': 'C++', 'c': 'C', 'c#': 'C#', 'csharp': 'C#',
  'ruby': 'Ruby', 'php': 'PHP', 'swift': 'Swift', 'kotlin': 'Kotlin', 'bash': 'Bash', 'shell': 'Shell',
  
  // Cloud & Infrastructure
  'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP', 'google cloud': 'GCP',
  'docker': 'Docker', 'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes', 'kind': 'Kind',
  'terraform': 'Terraform', 'ansible': 'Ansible', 'helm': 'Helm', 'linux': 'Linux',
  'cloudflare': 'Cloudflare', 'supabase': 'Supabase', 'firebase': 'Firebase',
  
  // Security & DevSecOps
  'devsecops': 'DevSecOps', 'ebpf': 'eBPF', 'falco': 'Falco', 'semgrep': 'Semgrep', 'trivy': 'Trivy',
  'wireshark': 'Wireshark', 'nmap': 'Nmap', 'suricata': 'Suricata', 'snort': 'Snort',
  'metasploit': 'Metasploit', 'burp suite': 'Burp Suite', 'waf': 'WAF', 'iam': 'IAM',
  'kms': 'KMS', 'vault': 'HashiCorp Vault', 'zero trust': 'Zero Trust', 'guardduty': 'AWS GuardDuty',
  'cloudtrail': 'AWS CloudTrail', 'sonarqube': 'SonarQube', 'snyk': 'Snyk', 'mitre': 'MITRE ATT&CK',
  'owasp': 'OWASP',
  
  // AI, LLM & Data
  'pytorch': 'PyTorch', 'tensorflow': 'TensorFlow', 'scikit-learn': 'Scikit-Learn', 'sklearn': 'Scikit-Learn',
  'openai': 'OpenAI', 'claude': 'Claude', 'gemini': 'Google Gemini', 'langchain': 'LangChain',
  'rag': 'RAG', 'nlp': 'NLP', 'machine learning': 'ML', 'ml': 'ML', 'deep learning': 'Deep Learning',
  'llm': 'LLM', 'transformers': 'Transformers',
  
  // Web & Backend Frameworks
  'react': 'React', 'next.js': 'Next.js', 'nextjs': 'Next.js', 'vue': 'Vue.js', 'angular': 'Angular',
  'node.js': 'Node.js', 'nodejs': 'Node.js', 'fastapi': 'FastAPI', 'flask': 'Flask', 'django': 'Django',
  'express': 'Express', 'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS', 'graphql': 'GraphQL',
  'rest api': 'REST API',
  
  // Databases & Storage
  'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL', 'mysql': 'MySQL', 'mongodb': 'MongoDB',
  'redis': 'Redis', 'elasticsearch': 'Elasticsearch', 'elk': 'ELK', 'kafka': 'Kafka',
  
  // CI/CD & Observability
  'github actions': 'GitHub Actions', 'ci/cd': 'CI/CD', 'prometheus': 'Prometheus', 'grafana': 'Grafana',
  'datadog': 'Datadog', 'splunk': 'Splunk'
};

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

/**
 * Scans a public GitHub repository and returns the top 5 detected skills/technologies.
 */
export async function scanGitHubRepoSkills(repoUrl: string): Promise<string[]> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return [];

  const { owner, repo } = parsed;
  const skillScores = new Map<string, number>();

  // Helper to add score to a skill
  const addSkillScore = (rawName: string, points: number) => {
    const key = rawName.toLowerCase().trim();
    if (IGNORED_LANGUAGES.has(key)) return;
    const canonicalName = KNOWN_TECH_MAP[key] || rawName.trim();
    if (!canonicalName || canonicalName.length < 2) return;
    skillScores.set(canonicalName, (skillScores.get(canonicalName) || 0) + points);
  };

  // 1. Query GitHub Languages API
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (langRes.ok) {
      const languages: Record<string, number> = await langRes.json();
      const sortedLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]);
      sortedLangs.forEach(([lang], idx) => {
        addSkillScore(lang, Math.max(30 - idx * 5, 10));
      });
    }
  } catch (err) {
    console.warn('Languages fetch failed:', err);
  }

  // 2. Query GitHub Repo Details (Topics, Primary Language, Description)
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoRes.ok) {
      const data = await repoRes.json();
      if (data.language) {
        addSkillScore(data.language, 25);
      }
      if (Array.isArray(data.topics)) {
        data.topics.forEach((topic: string) => {
          addSkillScore(topic, 20);
        });
      }
      if (data.description && typeof data.description === 'string') {
        const descLower = data.description.toLowerCase();
        for (const [key, displayName] of Object.entries(KNOWN_TECH_MAP)) {
          if (key.length >= 3 && descLower.includes(key)) {
            addSkillScore(displayName, 15);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Repo details fetch failed:', err);
  }

  // 3. Query Raw README across common branch names
  let readmeText = '';
  for (const branch of ['main', 'master', 'dev']) {
    try {
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`);
      if (readmeRes.ok) {
        readmeText = await readmeRes.text();
        break;
      }
    } catch {
      // try next branch
    }
  }

  if (readmeText) {
    for (const [key, displayName] of Object.entries(KNOWN_TECH_MAP)) {
      if (key.length < 3 && key !== 'c' && key !== 'go' && key !== 'ml') continue;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = readmeText.match(regex);
      if (matches && matches.length > 0) {
        const weight = Math.min(matches.length * 3, 25);
        addSkillScore(displayName, weight);
      }
    }
  }

  // 4. Check for key manifest indicators (requirements.txt, package.json, Dockerfile)
  for (const branch of ['main', 'master']) {
    try {
      // Check Dockerfile
      const dockerRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/Dockerfile`);
      if (dockerRes.ok) {
        addSkillScore('Docker', 20);
      }
    } catch {}

    try {
      // Check requirements.txt
      const reqRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/requirements.txt`);
      if (reqRes.ok) {
        const reqText = await reqRes.text();
        addSkillScore('Python', 15);
        for (const [key, displayName] of Object.entries(KNOWN_TECH_MAP)) {
          if (key.length >= 3 && reqText.toLowerCase().includes(key)) {
            addSkillScore(displayName, 12);
          }
        }
        break;
      }
    } catch {}
  }

  // Sort by score descending and return top 5
  const topSkills = Array.from(skillScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill)
    .filter(skill => !IGNORED_LANGUAGES.has(skill.toLowerCase()))
    .slice(0, 5);

  return topSkills;
}
