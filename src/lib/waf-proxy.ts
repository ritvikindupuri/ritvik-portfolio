/**
 * Deflectra WAF Proxy Integration
 * 
 * Two modes:
 * - PRE_FLIGHT: Inspect payload at WAF, then call edge function directly
 * - FULL_PROXY: Route entire request through WAF proxy which forwards to edge function
 */

import { supabase } from "@/integrations/supabase/client";

const DEFLECTRA_PROXY = "https://mgveeoqkhthibpmmljxz.supabase.co/functions/v1/waf-proxy";
const SITE_ID = "c3311d01-1dff-4074-93cc-6e1b768fd1e8";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// WAF proxy is disabled since Deflectra isn't configured for this site.
// Pattern detection still runs server-side in edge functions.
const WAF_ENABLED = false;

export type WafMode = 'preflight' | 'full_proxy';
const WAF_MODE: WafMode = 'full_proxy';

const WAF_PROTECTED_FUNCTIONS = [
  'send-contact-email',
  'log-auth-attempt', 
  'send-visitor-alert',
  'send-recruiter-alert',
];

export interface WafResponse {
  blocked: boolean;
  reason?: string;
  data?: any;
  error?: any;
}

/**
 * Log WAF event to database for analytics
 */
async function logWafEvent(functionName: string, blocked: boolean, reason?: string) {
  try {
    await supabase.from('waf_events').insert({
      function_name: functionName,
      blocked,
      reason: reason || null,
      waf_mode: WAF_MODE,
    } as any);
  } catch (e) {
    // Don't let logging failures break the flow
    console.warn('[WAF] Failed to log event:', e);
  }
}

export function isWafProtected(functionName: string): boolean {
  return WAF_ENABLED && WAF_PROTECTED_FUNCTIONS.includes(functionName);
}

export function getWafMode(): WafMode {
  return WAF_MODE;
}

/**
 * Pre-flight inspection only
 */
export async function wafInspect(
  functionName: string,
  method: string = 'POST',
  body?: Record<string, any>,
): Promise<WafResponse> {
  if (!WAF_ENABLED) return { blocked: false };

  try {
    const url = `${DEFLECTRA_PROXY}?site_id=${SITE_ID}&path=/${functionName}`;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      const reason = data.reason || data.message || 'Request blocked by WAF';
      await logWafEvent(functionName, true, reason);
      return { blocked: true, reason, error: data.rule || 'waf_blocked' };
    }

    await logWafEvent(functionName, false);
    return { blocked: false };
  } catch (error) {
    console.warn('[WAF] Proxy unreachable, failing open:', error);
    await logWafEvent(functionName, false, 'proxy_unreachable');
    return { blocked: false };
  }
}

/**
 * Full proxy routing — WAF inspects AND forwards to edge function
 */
export async function wafInvoke(
  functionName: string,
  body?: Record<string, any>,
): Promise<{ data: any; error: any }> {
  try {
    const url = `${DEFLECTRA_PROXY}?site_id=${SITE_ID}&path=/functions/v1/${functionName}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (response.status === 403) {
      const reason = data?.reason || data?.message || 'Request blocked by WAF';
      await logWafEvent(functionName, true, reason);
      return { data: null, error: { message: reason, waf_blocked: true } };
    }

    if (!response.ok) {
      const message = data?.error || data?.message || `HTTP ${response.status}`;

      // If this function/path is not configured in Deflectra, fail open to direct invoke.
      if (response.status === 404 && /not protected by deflectra/i.test(String(message))) {
        console.warn('[WAF] Site/path not protected in proxy, falling back to direct invoke:', functionName);
        await logWafEvent(functionName, false, 'proxy_site_not_configured_fallback');
        return directInvoke(functionName, body);
      }

      return { data: null, error: { message } };
    }

    await logWafEvent(functionName, false);
    return { data, error: null };
  } catch (error) {
    // Fail open: direct call
    console.warn('[WAF] Full proxy failed, falling back:', error);
    await logWafEvent(functionName, false, 'proxy_fallback');
    return directInvoke(functionName, body);
  }
}

async function directInvoke(
  functionName: string,
  body?: Record<string, any>,
): Promise<{ data: any; error: any }> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, error: { message: data?.error || `HTTP ${response.status}` } };
    }
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
}

/**
 * Smart invoke: Uses configured WAF mode.
 * - preflight: inspects, caller still needs to call edge function if not blocked
 * - full_proxy: routes entirely through WAF, returns edge function response
 */
export async function smartInvoke(
  functionName: string,
  body?: Record<string, any>,
): Promise<{ blocked: boolean; data?: any; error?: any }> {
  if (!WAF_ENABLED || !WAF_PROTECTED_FUNCTIONS.includes(functionName)) {
    return { blocked: false };
  }

  if (WAF_MODE === 'full_proxy') {
    const result = await wafInvoke(functionName, body);
    if (result.error?.waf_blocked) {
      return { blocked: true, error: result.error };
    }
    return { blocked: false, data: result.data, error: result.error };
  }

  // Preflight mode
  const inspection = await wafInspect(functionName, 'POST', body);
  return { blocked: inspection.blocked, error: inspection.blocked ? { message: inspection.reason } : undefined };
}

export function getWafConfig() {
  return {
    proxyUrl: DEFLECTRA_PROXY,
    siteId: SITE_ID,
    enabled: WAF_ENABLED,
    mode: WAF_MODE,
    protectedFunctions: WAF_PROTECTED_FUNCTIONS,
  };
}
