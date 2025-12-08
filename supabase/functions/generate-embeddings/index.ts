import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embeddings using Lovable AI Gateway
async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  // Use Gemini to generate embeddings via a structured prompt
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are an embedding generator. When given text, you will analyze it and return a semantic embedding as a JSON array of 768 floating point numbers between -1 and 1. The embedding should capture the semantic meaning of the text for similarity search. Return ONLY the JSON array, nothing else.'
        },
        {
          role: 'user',
          content: `Generate a 768-dimensional semantic embedding for the following text. Return only a valid JSON array of 768 numbers:\n\n${text}`
        }
      ],
      temperature: 0,
      max_tokens: 10000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding generation error:', errorText);
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No embedding content returned');
  }

  // Parse the JSON array from the response
  try {
    // Clean up the response - remove markdown code blocks if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    
    const embedding = JSON.parse(cleaned);
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding dimension: ${embedding?.length || 'not an array'}`);
    }
    return embedding;
  } catch (e) {
    console.error('Failed to parse embedding:', e, content.substring(0, 500));
    throw new Error('Failed to parse embedding response');
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

    const { action, table, id } = await req.json();

    if (action === 'generate_all') {
      // Generate embeddings for all content
      const tables = ['documentation', 'projects', 'skills', 'experience', 'ml_models', 'llm_projects', 'certifications'];
      const results: Record<string, number> = {};

      for (const tableName of tables) {
        const { data: items, error } = await supabase
          .from(tableName)
          .select('*')
          .is('embedding', null);

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          continue;
        }

        let count = 0;
        for (const item of items || []) {
          try {
            const text = generateTextForContent(tableName, item);
            const embedding = await generateEmbedding(text);
            
            const { error: updateError } = await supabase
              .from(tableName)
              .update({ embedding })
              .eq('id', item.id);

            if (updateError) {
              console.error(`Error updating ${tableName} embedding:`, updateError);
            } else {
              count++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            console.error(`Error generating embedding for ${tableName}:`, e);
          }
        }
        results[tableName] = count;
      }

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
      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from(table)
        .update({ embedding })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update embedding: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
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
