-- Remove 'Semantic RAG Portfolio Chatbot' from llm_projects
-- This project is being hidden as it represents the site's internal chatbot
-- rather than a standalone security tool/agent project

DELETE FROM public.llm_projects
WHERE id = 'nvgfgoykyeouwrksszpb';
