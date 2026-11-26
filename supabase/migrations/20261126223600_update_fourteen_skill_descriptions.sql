-- Update 14 skill descriptions (recruiter voice). Match by name only; no rows deleted.
-- Java and Tines wording was softened slightly where repo evidence did not fully support the requested claim.

UPDATE public.skills SET description = $d0$Wrote Semgrep taint-tracking rules to find and confirm security flaws in source code.$d0$ WHERE name = 'Semgrep';
UPDATE public.skills SET description = $d1$Built Java applications using object-oriented design and server-side input validation.$d1$ WHERE name = 'Java';
UPDATE public.skills SET description = $d2$Wrote SQL queries and tested databases for injection flaws and their defenses.$d2$ WHERE name = 'SQL';
UPDATE public.skills SET description = $d3$Used Python to automate security tasks, analyze data, and build internal tools.$d3$ WHERE name = 'Python';
UPDATE public.skills SET description = $d4$Used Wireshark to inspect network traffic and trace suspicious connections.$d4$ WHERE name = 'Wireshark';
UPDATE public.skills SET description = $d5$Built a Tines workflow to triage Elastic Security alerts and send incident summaries.$d5$ WHERE name = 'Tines';
UPDATE public.skills SET description = $d6$Deployed OPA Gatekeeper policies and tested how well they blocked Kubernetes admission attacks.$d6$ WHERE name = 'OPA Gatekeeper';
UPDATE public.skills SET description = $d7$Wrote Kyverno policies to block risky pods and tested them against admission attacks.$d7$ WHERE name = 'Kyverno';
UPDATE public.skills SET description = $d8$Ran Ubuntu servers to forward logs and analyze system telemetry for detection work.$d8$ WHERE name = 'Ubuntu';
UPDATE public.skills SET description = $d9$Ran Nmap scans to map open ports, services, and network attack surface.$d9$ WHERE name = 'Nmap';
UPDATE public.skills SET description = $d10$Used Kali Linux tools to simulate attacks and confirm that detections fired.$d10$ WHERE name = 'Kali Linux';
UPDATE public.skills SET description = $d11$Used Gemini to power agentic pentesting, threat modeling, and detection tools.$d11$ WHERE name = 'Google Gemini';
UPDATE public.skills SET description = $d12$Used hping3 to craft custom packets and simulate network attacks.$d12$ WHERE name = 'hping3';
UPDATE public.skills SET description = $d13$Used GitHub Desktop to manage branches and commits across projects.$d13$ WHERE name = 'GitHub Desktop';
