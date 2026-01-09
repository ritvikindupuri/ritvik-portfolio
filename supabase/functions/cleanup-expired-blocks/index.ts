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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`Running cleanup job at ${now.toISOString()}`);
    console.log(`Cleaning up records older than ${thirtyDaysAgo.toISOString()}`);

    // Deactivate expired IP blocks
    const { data: expiredBlocks, error: blocksError } = await supabase
      .from('blocked_ips')
      .update({ is_active: false, updated_at: now.toISOString() })
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', now.toISOString())
      .select('id, ip_address');

    if (blocksError) {
      console.error('Error deactivating expired blocks:', blocksError);
    }

    // Delete rate limit violations older than 30 days
    const { data: deletedViolations, error: violationsError } = await supabase
      .from('rate_limit_violations')
      .delete()
      .lt('last_violation_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (violationsError) {
      console.error('Error deleting rate limit violations:', violationsError);
    }

    // Delete old login attempts older than 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const { data: deletedAttempts, error: attemptsError } = await supabase
      .from('login_attempts')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (attemptsError) {
      console.error('Error deleting old login attempts:', attemptsError);
    }

    // Delete old visitor activity older than 60 days
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const { data: deletedActivity, error: activityError } = await supabase
      .from('visitor_activity')
      .delete()
      .lt('created_at', sixtyDaysAgo.toISOString())
      .select('id');

    if (activityError) {
      console.error('Error deleting old visitor activity:', activityError);
    }

    const summary = {
      expiredBlocksDeactivated: expiredBlocks?.length || 0,
      rateLimitViolationsDeleted: deletedViolations?.length || 0,
      oldLoginAttemptsDeleted: deletedAttempts?.length || 0,
      oldVisitorActivityDeleted: deletedActivity?.length || 0,
      cleanupTime: now.toISOString(),
    };

    console.log('Cleanup summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        summary,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cleanup job failed:', message);
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
