import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embeddings using OpenAI's text-embedding-3-small model
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Truncate to avoid token limits
      dimensions: 768, // Match our vector dimension
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI embedding error:', response.status, errorText);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.data?.[0]?.embedding;
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response from OpenAI');
  }

  console.log(`Generated embedding with ${embedding.length} dimensions`);
  return embedding;
}

// Extract GitHub URLs from item based on table type
function extractGitHubUrls(table: string, item: any): { url: string; sourceType: string }[] {
  const urls: { url: string; sourceType: string }[] = [];
  
  // Skills have project_links array
  if (table === 'skills' && item.project_links) {
    const links = Array.isArray(item.project_links) ? item.project_links : [];
    for (const link of links) {
      if (link.url && link.url.includes('github.com')) {
        urls.push({ url: link.url, sourceType: 'skill' });
      }
    }
  }
  
  // ML models, LLM projects, and projects have github_url
  if (item.github_url && item.github_url.includes('github.com')) {
    const sourceType = table === 'ml_models' ? 'ml_model' : 
                       table === 'llm_projects' ? 'llm_project' : 'project';
    urls.push({ url: item.github_url, sourceType });
  }
  
  return urls;
}

// Trigger GitHub content indexing
async function triggerGitHubIndexing(supabaseUrl: string, githubUrl: string, sourceType: string, sourceId: string): Promise<void> {
  try {
    console.log(`Triggering GitHub indexing for ${githubUrl}`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/index-github-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        github_url: githubUrl,
        source_type: sourceType,
        source_id: sourceId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub indexing error:', error);
    } else {
      const result = await response.json();
      console.log('GitHub indexing result:', result);
    }
  } catch (e) {
    console.error('Failed to trigger GitHub indexing:', e);
  }
}

// Generate text representation for different content types
function generateTextForContent(type: string, item: any): string {
  switch (type) {
    case 'documentation':
      return `Documentation: ${item.title}. Category: ${item.category || 'General'}. ${item.description}`;
    case 'projects':
      return `Project: ${item.title}. ${item.description}. Technologies: ${item.technologies?.join(', ') || 'N/A'}. Category: ${item.category || 'General'}`;
    case 'skills':
      return `Skill: ${item.name}. Level: ${item.level || 'Intermediate'}. Category: ${item.category}. ${item.description || ''}`;
    case 'experience':
      return `Experience: ${item.title} at ${item.company}. Location: ${item.location || 'N/A'}. ${item.description?.join(' ') || ''}. Skills: ${item.skills?.join(', ') || 'N/A'}`;
    case 'ml_models':
      return `ML Model: ${item.title}. Type: ${item.model_type || 'N/A'}. Framework: ${item.framework || 'N/A'}. ${item.description}. Technologies: ${item.technologies?.join(', ') || 'N/A'}`;
    case 'llm_projects':
      return `LLM Project: ${item.title}. Type: ${item.project_type || 'N/A'}. Provider: ${item.llm_provider || 'N/A'}. Use Case: ${item.use_case || 'N/A'}. ${item.description}`;
    case 'certifications':
      return `Certification: ${item.name} by ${item.issuer}. Date: ${item.date}`;
    default:
      return JSON.stringify(item);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, table, id, regenerate } = await req.json();

    if (action === 'generate_all') {
      // Generate embeddings for all content
      const tables = ['documentation', 'projects', 'skills', 'experience', 'ml_models', 'llm_projects', 'certifications'];
      const results: Record<string, { processed: number; skipped: number; errors: number }> = {};

      for (const tableName of tables) {
        // If regenerate is true, get all items; otherwise only items without embeddings
        let query = supabase.from(tableName).select('*');
        if (!regenerate) {
          query = query.is('embedding', null);
        }
        
        const { data: items, error } = await query;

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          results[tableName] = { processed: 0, skipped: 0, errors: 1 };
          continue;
        }

        let processed = 0;
        let errors = 0;
        
        for (const item of items || []) {
          try {
            const text = generateTextForContent(tableName, item);
            console.log(`Generating embedding for ${tableName}:`, item.id, text.substring(0, 100));
            
            const embedding = await generateEmbedding(text);
            
            // Convert to pgvector format string
            const embeddingStr = `[${embedding.join(',')}]`;
            
            const { error: updateError } = await supabase
              .from(tableName)
              .update({ embedding: embeddingStr })
              .eq('id', item.id);

            if (updateError) {
              console.error(`Error updating ${tableName} embedding:`, updateError);
              errors++;
            } else {
              processed++;
              console.log(`Successfully updated embedding for ${tableName}:`, item.id);
              
              // Trigger GitHub indexing for items with GitHub URLs
              const githubUrls = extractGitHubUrls(tableName, item);
              for (const { url, sourceType } of githubUrls) {
                await triggerGitHubIndexing(supabaseUrl, url, sourceType, item.id);
              }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (e) {
            console.error(`Error generating embedding for ${tableName}:`, e);
            errors++;
          }
        }
        
        results[tableName] = { 
          processed, 
          skipped: (items?.length || 0) - processed - errors,
          errors 
        };
      }

      console.log('Embedding generation complete:', results);
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_single' && table && id) {
      // Generate embedding for a single item
      const { data: item, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch item: ${error.message}`);
      }

      const text = generateTextForContent(table, item);
      console.log(`Generating single embedding for ${table}:`, id, text.substring(0, 100));
      
      const embedding = await generateEmbedding(text);
      const embeddingStr = `[${embedding.join(',')}]`;

      const { error: updateError } = await supabase
        .from(table)
        .update({ embedding: embeddingStr })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update embedding: ${updateError.message}`);
      }

      console.log(`Successfully generated embedding for ${table}:`, id);
      
      // Trigger GitHub indexing for items with GitHub URLs
      const githubUrls = extractGitHubUrls(table, item);
      for (const { url, sourceType } of githubUrls) {
        await triggerGitHubIndexing(supabaseUrl, url, sourceType, id);
      }
      
      return new Response(
        JSON.stringify({ success: true, github_indexed: githubUrls.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_query_embedding') {
      // Generate embedding for a query (used by chatbot)
      const { query } = await req.json();
      if (!query) {
        throw new Error('Query is required');
      }
      
      const embedding = await generateEmbedding(query);
      
      return new Response(
        JSON.stringify({ success: true, embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: generate_all, generate_single, or generate_query_embedding' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
