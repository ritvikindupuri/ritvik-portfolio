-- Tighten overloaded and vague skill descriptions to the 2-3 strongest concrete use cases.
-- Java and R left unchanged. No rows deleted.

UPDATE public.skills SET description = $d0$Used Gemini to run agentic pentests and power AI-driven detection and WAF tools.$d0$ WHERE name = 'Google Gemini';
UPDATE public.skills SET description = $d1$Used OpenAI models to red-team LLM prompts, map cloud attack surfaces, and detect intrusions.$d1$ WHERE name = 'OpenAI';
UPDATE public.skills SET description = $d2$Used Claude to review AWS and Kubernetes security findings and recommend remediations.$d2$ WHERE name = ' Claude';
UPDATE public.skills SET description = $d3$Used Python to build intrusion detection tooling and analyze cloud and host telemetry.$d3$ WHERE name = 'Python';
UPDATE public.skills SET description = $d4$Used Google Opal to automate incident reports, cloud alert triage, and vulnerability research.$d4$ WHERE name = 'Google Opal';
UPDATE public.skills SET description = $d5$Built React dashboards for threat modeling, agentic pentesting, and live telemetry analysis.$d5$ WHERE name = 'React';
UPDATE public.skills SET description = $d6$Used Next.js to build dashboards for threat modeling, agentic pentesting, and anomaly detection.$d6$ WHERE name = 'Next.js';
UPDATE public.skills SET description = $d7$Used TypeScript to build type-safe dashboards for threat modeling and agentic pentesting.$d7$ WHERE name = 'TypeScript';
UPDATE public.skills SET description = $d8$Configured CloudWatch alarms and logs to catch secret access, mask sensitive data, and watch DNS failover.$d8$ WHERE name = 'AWS Cloudwatch';
UPDATE public.skills SET description = $d9$Wrote Lambda functions to quarantine compromised resources, contain IAM abuse, and run compliance checks.$d9$ WHERE name = 'AWS Lambda ';
UPDATE public.skills SET description = $d10$Used CloudTrail logs to trace API activity, investigate credential abuse, and monitor secret access.$d10$ WHERE name = 'AWS CloudTrail';
UPDATE public.skills SET description = $d11$Audited IAM roles and policies to find privilege escalation paths and contain compromised identities.$d11$ WHERE name = 'AWS Identity Access Management (IAM)';
UPDATE public.skills SET description = $d12$Tested S3 bucket policies to find data exposure and simulate backdoor access paths.$d12$ WHERE name = 'AWS S3';
UPDATE public.skills SET description = $d13$Routed IAM and security events through EventBridge to trigger containment and automated incident response.$d13$ WHERE name = 'AWS EventBridge';
UPDATE public.skills SET description = $d14$Built Grok Bot workflows to harden containers, map AWS attack paths, and investigate Windows detections.$d14$ WHERE name = 'Grok Bot';
UPDATE public.skills SET description = $d15$Ingested security logs into Splunk to hunt brute-force and web attacks and build detection dashboards.$d15$ WHERE name = 'Splunk';
UPDATE public.skills SET description = $d16$Used Kali Linux to run Nmap and Hydra attacks and confirm detections in SIEM and IoT labs.$d16$ WHERE name = 'Kali Linux';
UPDATE public.skills SET description = $d17$Deployed EC2 instances and Auto Scaling groups for DNS failover and threat detection labs.$d17$ WHERE name = 'AWS Elastic Compute Cloud (EC2)';
UPDATE public.skills SET description = $d18$Used Elasticsearch to correlate web traffic and threat intel for bot-defense and alert analysis.$d18$ WHERE name = 'Elasticsearch';
UPDATE public.skills SET description = $d19$Used Supabase for auth and data in a personal site, a WAF, and threat-intel apps.$d19$ WHERE name = 'Supabase';
UPDATE public.skills SET description = $d20$Built Docker Compose labs to test container escapes, run a containerized SOC, and package pentest tooling.$d20$ WHERE name = 'Docker';
UPDATE public.skills SET description = $d21$Deployed and attacked Kubernetes clusters to test admission controls and map blast radius.$d21$ WHERE name = 'Kubernetes';
UPDATE public.skills SET description = $d22$Wrote Terraform to stand up AWS detection, forensics, and cloud security automation.$d22$ WHERE name = 'Terraform';
UPDATE public.skills SET description = $d23$Set up GitHub Actions to run tests and secret scans across cloud and container repos.$d23$ WHERE name = 'GitHub Actions';
UPDATE public.skills SET description = $d24$Administered Windows Server and Active Directory labs for adversary simulations and infrastructure attacks.$d24$ WHERE name = 'Windows';
UPDATE public.skills SET description = $d25$Ran Ubuntu servers to forward security logs and collect system metrics for observability dashboards.$d25$ WHERE name = 'Ubuntu';
UPDATE public.skills SET description = $d26$Wrote Falco rules to detect container escapes and triage runtime alerts in response workflows.$d26$ WHERE name = 'Falco';
UPDATE public.skills SET description = $d27$Wrote Kyverno policies to block risky pods, harden inference workloads, and test admission attacks.$d27$ WHERE name = 'Kyverno';
UPDATE public.skills SET description = $d28$Built n8n workflows to enrich SIEM alerts and hunt threats with multiple models during incident response.$d28$ WHERE name = 'n8n';
UPDATE public.skills SET description = $d29$Used Falcon Sensor telemetry to reconstruct attack activity in Active Directory and endpoint investigations.$d29$ WHERE name = 'Falcon Sensor (EDR/XDR)';
UPDATE public.skills SET description = $d30$Designed MongoDB schemas and ETL pipelines and tuned aggregations for analytics reporting.$d30$ WHERE name = 'MongoDB';
UPDATE public.skills SET description = $d31$Used Trivy to scan container images and IaC for vulnerabilities during container hardening and pentests.$d31$ WHERE name = 'Trivy';
