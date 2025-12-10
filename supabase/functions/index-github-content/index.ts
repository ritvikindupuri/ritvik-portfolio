import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract owner/repo from GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /github\.com\/([^\/]+)\/([^\/]+)\.git/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch README content from GitHub
async function fetchReadmeContent(owner: string, repo: string): Promise<string | null> {
  const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md', 'README', 'readme'];
  
  for (const filename of readmeFiles) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filename}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`Found README at ${url}, length: ${content.length}`);
        return content;
      }
      
      // Try master branch
      const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${filename}`;
      const masterResponse = await fetch(masterUrl);
      
      if (masterResponse.ok) {
        const content = await masterResponse.text();
        console.log(`Found README at ${masterUrl}, length: ${content.length}`);
        return content;
      }
    } catch (e) {
      console.log(`Error fetching ${filename}:`, e);
    }
  }
  
  return null;
}

// Clean and truncate content for embedding
function cleanContent(content: string, maxLength: number = 8000): string {
  // Remove images, links to images, and excessive whitespace
  let cleaned = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image markdown
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/```[\s\S]*?```/g, (match) => match.slice(0, 500)) // Truncate code blocks
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .trim();
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength) + '...';
  }
  
  return cleaned;
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[] | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY not set');
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 768, // Match existing portfolio embeddings
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI embedding error:', error);
      return null;
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (e) {
    console.error('Error generating embedding:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { github_url, source_type, source_id } = await req.json();
    
    console.log(`Indexing GitHub content: ${github_url} for ${source_type}/${source_id}`);
    
    if (!github_url || !source_type || !source_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: github_url, source_type, source_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse GitHub URL
    const parsed = parseGitHubUrl(github_url);
    if (!parsed) {
      console.log('Invalid GitHub URL:', github_url);
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL', url: github_url }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { owner, repo } = parsed;
    console.log(`Parsed: owner=${owner}, repo=${repo}`);
    
    // Fetch README content
    const readmeContent = await fetchReadmeContent(owner, repo);
    
    if (!readmeContent) {
      console.log('No README found for:', github_url);
      return new Response(
        JSON.stringify({ success: false, message: 'No README found', url: github_url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Clean content
    const cleanedContent = cleanContent(readmeContent);
    console.log(`Cleaned content length: ${cleanedContent.length}`);
    
    // Generate embedding
    const embedding = await generateEmbedding(cleanedContent);
    
    if (!embedding) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('github_content')
      .upsert({
        source_type,
        source_id,
        github_url,
        repo_name: `${owner}/${repo}`,
        content_text: cleanedContent,
        embedding: `[${embedding.join(',')}]`,
        indexed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'source_type,source_id,github_url',
      })
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store content', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Successfully indexed GitHub content:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        repo: `${owner}/${repo}`,
        content_length: cleanedContent.length,
        id: data?.[0]?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (e) {
    console.error('Error in index-github-content:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
