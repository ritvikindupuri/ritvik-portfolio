-- Restore full use-case coverage on skill descriptions, grouped into 2-3 themes.
-- Java and R left unchanged. No rows deleted.

UPDATE public.skills SET description = $d0$Used Claude to review AWS, host, and Kubernetes security findings and recommend remediations during audits and SRE work.$d0$ WHERE name = ' Claude';
UPDATE public.skills SET description = $d1$Used Gemini to run agentic pentests and threat modeling, scan code, and power detection, WAF, and bot-defense tools.$d1$ WHERE name = 'Google Gemini';
UPDATE public.skills SET description = $d2$Used OpenAI models to review code and red-team prompts, map cloud attack surfaces, and power intrusion detection and a site chatbot.$d2$ WHERE name = 'OpenAI';
UPDATE public.skills SET description = $d3$Built Grok Bot workflows to harden containers, map AWS attack paths, investigate Windows detections, and automate SRE operations.$d3$ WHERE name = 'Grok Bot';
UPDATE public.skills SET description = $d4$Used Google Opal to automate incident reports and cloud alert triage, analyze code and vulnerabilities, and run AD governance checks.$d4$ WHERE name = 'Google Opal';
UPDATE public.skills SET description = $d5$Wrote Lambda functions to quarantine compromised resources and contain IAM abuse, run compliance checks, and test function security.$d5$ WHERE name = 'AWS Lambda ';
UPDATE public.skills SET description = $d6$Configured CloudWatch alarms for secret access and DNS failover, used log data-protection policies to mask sensitive fields, and built observability views.$d6$ WHERE name = 'AWS Cloudwatch';
UPDATE public.skills SET description = $d7$Used CloudTrail logs to trace API activity, investigate credential abuse and secret access, and feed intrusion detection and observability.$d7$ WHERE name = 'AWS CloudTrail';
UPDATE public.skills SET description = $d8$Deployed EC2 instances and Auto Scaling groups for VPC labs, DNS failover, threat detection, and security assessments.$d8$ WHERE name = 'AWS Elastic Compute Cloud (EC2)';
UPDATE public.skills SET description = $d9$Routed IAM and security events through EventBridge to trigger containment, detection, and automated incident response.$d9$ WHERE name = 'AWS EventBridge';
UPDATE public.skills SET description = $d10$Audited IAM roles and policies to find privilege escalation paths, contain compromised identities, and review secrets and account security.$d10$ WHERE name = 'AWS Identity Access Management (IAM)';
UPDATE public.skills SET description = $d11$Tested S3 bucket policies to find data exposure and simulate backdoor access, and used the results in compliance and security assessments.$d11$ WHERE name = 'AWS S3';
UPDATE public.skills SET description = $d12$Used Elasticsearch to correlate web traffic, threat intel, and security alerts in bot-defense and DevSecOps workflows.$d12$ WHERE name = 'Elasticsearch';
UPDATE public.skills SET description = $d13$Used Supabase for auth, data, and APIs in a WAF dashboard, threat-intel apps, and cloud security assessment tools.$d13$ WHERE name = 'Supabase';
UPDATE public.skills SET description = $d14$Built Docker Compose labs to test container escapes and simulate attacks, run a containerized SOC, and package pentest tooling.$d14$ WHERE name = 'Docker';
UPDATE public.skills SET description = $d15$Deployed and attacked Kubernetes clusters to test admission controls and runtime isolation, map blast radius, and apply remediations.$d15$ WHERE name = 'Kubernetes';
UPDATE public.skills SET description = $d16$Wrote Terraform to stand up AWS detection, forensics, and security tooling, and to automate SRE workflows.$d16$ WHERE name = 'Terraform';
UPDATE public.skills SET description = $d17$Set up GitHub Actions to run tests, secret scans, and security checks across cloud and container repos.$d17$ WHERE name = 'GitHub Actions';
UPDATE public.skills SET description = $d18$Administered Windows Server and Active Directory labs for adversary simulations, infrastructure attacks, and host telemetry analysis.$d18$ WHERE name = 'Windows';
UPDATE public.skills SET description = $d19$Used Python to build intrusion detection and attack-simulation tooling, analyze cloud and host telemetry, and automate container, Kubernetes, and SRE security work.$d19$ WHERE name = 'Python';
UPDATE public.skills SET description = $d20$Used Kali Linux to run Nmap and Hydra attacks, a full exploit chain, and cloud and IoT tests to confirm detections.$d20$ WHERE name = 'Kali Linux';
UPDATE public.skills SET description = $d21$Ingested security logs into Splunk to hunt brute-force and web attacks, build detection dashboards, and automate alert response.$d21$ WHERE name = 'Splunk';
UPDATE public.skills SET description = $d22$Wrote and tested Falco rules to detect container escapes, ingest runtime alerts, and triage findings in response workflows.$d22$ WHERE name = 'Falco';
UPDATE public.skills SET description = $d23$Wrote Kyverno policies to block risky pods, harden inference workloads, and test admission attacks and escapes.$d23$ WHERE name = 'Kyverno';
UPDATE public.skills SET description = $d24$Built React dashboards for threat modeling and agentic pentesting, and for live telemetry and security-platform tooling.$d24$ WHERE name = 'React';
UPDATE public.skills SET description = $d25$Used TypeScript to build type-safe dashboards and frontends for threat modeling, agentic pentesting, and live telemetry.$d25$ WHERE name = 'TypeScript';
