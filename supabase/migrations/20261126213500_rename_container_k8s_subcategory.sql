-- Rename the Cybersecurity Tools chip from Container & Kubernetes
-- to Container & Kubernetes Security.

UPDATE public.skills
SET subcategory = 'Container & Kubernetes Security'
WHERE category = 'security'
  AND subcategory = 'Container & Kubernetes';
