/**
 * Deflectra WAF Proxy Integration
 * 
 * Two modes:
 * - PRE_FLIGHT: Inspect payload at WAF, then call edge function directly (default)
 * - FULL_PROXY: Route entire request through WAF proxy which forwards to edge function
 * 
 * Toggle via WAF_MODE. Full proxy requires Deflectra to be configured to forward
 * to the portfolio's Supabase edge functions.
 */

const DEFLECTRA_PROXY = "https://mgveeoqkhthibpmmljxz.supabase.co/functions/v1/waf-proxy";
const SITE_ID = "c3311d01-1dff-4074-93cc-6e1b768fd1e8";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Enable/disable WAF protection globally
const WAF_ENABLED = true;

// Routing mode: 'preflight' or 'full_proxy'
export type WafMode = 'preflight' | 'full_proxy';
const WAF_MODE: WafMode = 'preflight';

// Edge functions that should be WAF-protected (public-facing)
const WAF_PROTECTED_FUNCTIONS = [
  'send-contact-email',
  'portfolio-chatbot',
  'log-auth-attempt',
  'send-visitor-alert',
  'send-recruiter-alert',
];

export interface WafResponse {
  blocked: boolean;
  reason?: string;
  data?: any;
  error?: string;
}

export interface WafInvokeResult {
  data: any;
  error: any;
}

/**
 * Check if a given edge function should be WAF-protected
 */
export function isWafProtected(functionName: string): boolean {
  return WAF_ENABLED && WAF_PROTECTED_FUNCTIONS.includes(functionName);
}

/**
 * Get the current WAF mode
 */
export function getWafMode(): WafMode {
  return WAF_MODE;
}

/**
 * Pre-flight inspection: Send payload to WAF for inspection only.
 * Returns whether the request was blocked.
 */
export async function wafInspect(
  functionName: string,
  method: string = 'POST',
  body?: Record<string, any>,
  headers?: Record<string, string>
): Promise<WafResponse> {
  if (!WAF_ENABLED) {
    return { blocked: false };
  }

  try {
    const url = `${DEFLECTRA_PROXY}?site_id=${SITE_ID}&path=/${functionName}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // If WAF blocks the request (typically 403)
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      console.warn(`[WAF] Request to ${functionName} blocked:`, data);
      return {
        blocked: true,
        reason: data.reason || data.message || 'Request blocked by WAF',
        error: data.rule || 'waf_blocked',
      };
    }

    // WAF allowed the request through
    return { blocked: false };
  } catch (error) {
    // Fail open if WAF is unreachable
    console.warn('[WAF] Proxy unreachable, failing open:', error);
    return { blocked: false };
  }
}

/**
 * Full proxy routing: Send the entire request through the WAF proxy.
 * The WAF inspects the payload and, if clean, forwards it to the actual edge function.
 * Returns the edge function response directly.
 */
export async function wafInvoke(
  functionName: string,
  body?: Record<string, any>,
): Promise<WafInvokeResult> {
  if (!WAF_ENABLED || WAF_MODE !== 'full_proxy') {
    // Fall back to direct call
    return directInvoke(functionName, body);
  }

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

    // WAF blocked
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          message: errorData.reason || 'Request blocked by WAF',
          waf_blocked: true,
        },
      };
    }

    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      return { data: null, error: { message: data?.error || `HTTP ${response.status}` } };
    }

    return { data, error: null };
  } catch (error) {
    // Fail open: fall back to direct call
    console.warn('[WAF] Full proxy failed, falling back to direct call:', error);
    return directInvoke(functionName, body);
  }
}

/**
 * Direct edge function invocation (bypasses WAF)
 */
async function directInvoke(
  functionName: string,
  body?: Record<string, any>,
): Promise<WafInvokeResult> {
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
 * Smart invoke: Uses the configured WAF mode to call an edge function.
 * - preflight mode: Inspects first, then calls directly via supabase SDK (caller handles this)
 * - full_proxy mode: Routes entirely through WAF proxy
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

  // Preflight mode: just inspect
  const inspection = await wafInspect(functionName, 'POST', body);
  return { blocked: inspection.blocked, error: inspection.blocked ? { message: inspection.reason } : undefined };
}

/**
 * Get WAF proxy configuration for display purposes
 */
export function getWafConfig() {
  return {
    proxyUrl: DEFLECTRA_PROXY,
    siteId: SITE_ID,
    enabled: WAF_ENABLED,
    mode: WAF_MODE,
    protectedFunctions: WAF_PROTECTED_FUNCTIONS,
  };
}
