-- Move FortiGate to Detection & Monitoring and refresh Docker/Kubernetes project links.

UPDATE public.skills
SET subcategory = 'Detection & Monitoring'
WHERE category = 'security' AND name = 'FortiGate NGFW';

UPDATE public.skills
SET
  link = 'https://github.com/ritvikindupuri/EscapeArmed',
  project_links = $docker_links$[
    {"url": "https://github.com/ritvikindupuri/EscapeArmed", "name": "Container Escape Readiness Scanner"},
    {"url": "https://github.com/ritvikindupuri/Spectra-AI---Agentic-Pentesting", "name": "Agentic Penetration Testing"},
    {"url": "https://github.com/ritvikindupuri/containerizedattacks", "name": "Container Threat Detection & Attack Simulation"},
    {"url": "https://github.com/ritvikindupuri/SentraSoc", "name": "Containerized SOC Platform"}
  ]$docker_links$::jsonb
WHERE category = 'devops' AND name = 'Docker';

UPDATE public.skills
SET
  link = 'https://github.com/ritvikindupuri/K8Admission',
  project_links = $k8s_links$[
    {"url": "https://github.com/ritvikindupuri/K8Admission", "name": "Kubernetes Admission Attack Lab"},
    {"url": "https://github.com/ritvikindupuri/KARMA", "name": "Kubernetes Attack & Remediation Platform"},
    {"url": "https://github.com/ritvikindupuri/EscapeArmed", "name": "Container Escape Readiness Scanner"},
    {"url": "https://github.com/ritvikindupuri/FathomK8", "name": "Kubernetes Blast Radius Scanner"},
    {"url": "https://github.com/ritvikindupuri/Containment", "name": "Agent Containment Platform"}
  ]$k8s_links$::jsonb
WHERE category = 'devops' AND name = 'Kubernetes';
