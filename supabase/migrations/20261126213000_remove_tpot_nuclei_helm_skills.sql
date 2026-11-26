-- Remove T-Pot, Nuclei, and Helm from the Skills section.

DELETE FROM public.skills
WHERE (name = 'T-Pot' AND category = 'security')
   OR (name = 'Nuclei' AND category = 'security')
   OR (name = 'Helm' AND category = 'devops');
