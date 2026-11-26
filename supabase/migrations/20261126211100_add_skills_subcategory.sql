-- Optional grouping used as filter chips on the Cybersecurity Tools skills tab.
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS subcategory text;

COMMENT ON COLUMN public.skills.subcategory IS
  'Optional grouping used as filter chips on the Cybersecurity Tools skills tab.';

UPDATE public.skills SET subcategory = 'Cloud & AWS Security'
WHERE category = 'security' AND name IN ('FortiGate NGFW', 'AWS GuardDuty', 'AWS Security Hub');

UPDATE public.skills SET subcategory = 'Container & Kubernetes'
WHERE category = 'security' AND name IN ('Trivy', 'Falco', 'Kyverno');

UPDATE public.skills SET subcategory = 'Code & Supply Chain'
WHERE category = 'security' AND name = 'Semgrep';

UPDATE public.skills SET subcategory = 'Offensive & Pentesting'
WHERE category = 'security' AND name IN ('Kali Linux', 'Metasploit', 'Burp Suite', 'PowerShell', 'hping3', 'Nmap');

UPDATE public.skills SET subcategory = 'Detection & Monitoring'
WHERE category = 'security' AND name IN (
  'Wireshark', 'Suricata', 'Snort', 'Splunk', 'Elastic SIEM',
  'Microsoft Sentinel', 'Falcon Sensor (EDR/XDR)', 'Elastic Defend (EDR)'
);
