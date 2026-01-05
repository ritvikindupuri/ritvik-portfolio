import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting expired IP blocks cleanup...');

    // Find expired blocks
    const now = new Date().toISOString();
    const { data: expiredBlocks, error: fetchError } = await supabase
      .from('blocked_ips')
      .select('id, ip_address, expires_at, reason')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (fetchError) {
      console.error('Error fetching expired blocks:', fetchError);
      throw fetchError;
    }

    if (!expiredBlocks || expiredBlocks.length === 0) {
      console.log('No expired IP blocks found');
      return new Response(
        JSON.stringify({ message: 'No expired blocks to clean up', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredBlocks.length} expired IP blocks to deactivate`);

    // Deactivate expired blocks
    const expiredIds = expiredBlocks.map(b => b.id);
    const { error: updateError } = await supabase
      .from('blocked_ips')
      .update({ is_active: false, updated_at: now })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error deactivating expired blocks:', updateError);
      throw updateError;
    }

    console.log(`Successfully deactivated ${expiredBlocks.length} expired IP blocks`);
    
    // Log the cleaned up IPs
    expiredBlocks.forEach(block => {
      console.log(`Deactivated: ${block.ip_address} (expired: ${block.expires_at}, reason: ${block.reason})`);
    });

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully', 
        count: expiredBlocks.length,
        deactivated: expiredBlocks.map(b => b.ip_address)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cleanup error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
