-- Remove GitHub Desktop and Visual Studio Code from the Skills section.

DELETE FROM public.skills
WHERE (name = 'GitHub Desktop' AND category = 'cloud')
   OR (name = 'Visual Studio Code' AND category = 'cloud');
