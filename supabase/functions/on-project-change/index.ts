import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is triggered by a database webhook when projects are inserted or updated
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

    // Supabase webhook format
    const { type, table, record, old_record } = payload;

    if (table !== 'projects') {
      console.log('Ignoring non-projects webhook:', table);
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored - not projects table' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is an insert or update with a GitHub URL
    const project = record;
    const oldProject = old_record;

    if (!project?.github_url) {
      console.log('No GitHub URL in project, skipping indexing');
      return new Response(
        JSON.stringify({ success: true, message: 'No GitHub URL to index' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if GitHub URL changed (for updates) or is new (for inserts)
    const shouldIndex = type === 'INSERT' || 
      (type === 'UPDATE' && project.github_url !== oldProject?.github_url);

    if (!shouldIndex && type === 'UPDATE') {
      console.log('GitHub URL unchanged, skipping re-index');
      return new Response(
        JSON.stringify({ success: true, message: 'GitHub URL unchanged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Triggering GitHub content indexing for project: ${project.title}`);

    // Call the index-github-content function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const indexResponse = await fetch(`${supabaseUrl}/functions/v1/index-github-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        github_url: project.github_url,
        source_type: 'project',
        source_id: project.id,
      }),
    });

    const indexResult = await indexResponse.json();
    console.log('Index result:', indexResult);

    // Also generate embedding for the project itself
    const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_single',
        table: 'projects',
        id: project.id,
      }),
    });

    const generateResult = await generateResponse.json();
    console.log('Embedding generation result:', generateResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'GitHub content indexed and embedding generated',
        indexResult,
        generateResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in on-project-change webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
