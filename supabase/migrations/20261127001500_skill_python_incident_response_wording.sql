-- Update the Python skill description to the approved wording.
-- No rows deleted.

UPDATE public.skills
SET description = $python_desc$Used Python to build intrusion detection tooling, analyze cloud and host telemetry, and automate container, Kubernetes, and incident response tasks.$python_desc$
WHERE name = 'Python'
