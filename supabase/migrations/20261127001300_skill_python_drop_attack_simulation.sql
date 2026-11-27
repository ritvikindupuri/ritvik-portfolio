-- Drop 'attack-simulation tooling' from the Python skill description.
-- No rows deleted.

UPDATE public.skills
SET description = $python_desc$Used Python to build intrusion detection tooling, analyze cloud and host telemetry, and automate container, Kubernetes, and SRE security work.$python_desc$
WHERE name = 'Python'
