/**
 * Deflectra WAF Proxy Integration
 * 
 * Routes requests through the Deflectra WAF proxy for inspection
 * before reaching the actual edge functions. Blocks SQLi, XSS,
 * and other malicious payloads at the proxy layer.
 */

const DEFLECTRA_PROXY = "https://mgveeoqkhthibpmmljxz.supabase.co/functions/v1/waf-proxy";
const SITE_ID = "c3311d01-1dff-4074-93cc-6e1b768fd1e8";

// Enable/disable WAF protection globally
const WAF_ENABLED = true;

// Edge functions that should be routed through WAF (public-facing)
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

/**
 * Check if a given edge function should be WAF-protected
 */
export function isWafProtected(functionName: string): boolean {
  return WAF_ENABLED && WAF_PROTECTED_FUNCTIONS.includes(functionName);
}

/**
 * Send a request through the Deflectra WAF proxy for inspection.
 * Returns the WAF decision (blocked or allowed).
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
    // If WAF proxy is unreachable, fail open (allow the request)
    // This ensures the portfolio still works if Deflectra is down
    console.warn('[WAF] Proxy unreachable, failing open:', error);
    return { blocked: false };
  }
}

/**
 * Get WAF proxy configuration for display purposes
 */
export function getWafConfig() {
  return {
    proxyUrl: DEFLECTRA_PROXY,
    siteId: SITE_ID,
    enabled: WAF_ENABLED,
    protectedFunctions: WAF_PROTECTED_FUNCTIONS,
  };
}
