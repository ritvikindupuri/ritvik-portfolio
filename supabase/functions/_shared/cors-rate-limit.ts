/**
 * Shared CORS and Rate Limiting Utilities
 * 
 * This module provides:
 * 1. Strict CORS policies - Only allows requests from the portfolio domain
 * 2. IP-based rate limiting - Configurable limits per endpoint
 * 
 * SECURITY FEATURES:
 * - Origin validation against allowlist
 * - IP extraction from proxy headers (x-forwarded-for, x-real-ip, cf-connecting-ip)
 * - In-memory rate limiting with automatic cleanup
 * - Security headers (CSP, X-Frame-Options, etc.)
 */

// Allowed origins - only the portfolio domain and local development
const ALLOWED_ORIGINS = [
  'https://ritvik-portfolio.lovable.app',
  'https://ritvikindupuri.com',
  'https://www.ritvikindupuri.com',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

// Rate limit storage: Map<endpoint:ip, { count, resetTime }>
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit violation tracking for alerting: Map<endpoint:ip, { violations, lastAlertTime }>
const rateLimitViolations = new Map<string, { violations: number; lastAlertTime: number; windowStart: number }>();

// Alert configuration
const ALERT_CONFIG = {
  minViolationsForAlert: 3,        // Minimum violations before sending alert
  alertCooldownMs: 3600000,        // 1 hour cooldown between alerts for same IP/endpoint
  violationWindowMs: 3600000,      // 1 hour window to count violations
};

// Default rate limit configuration
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  endpoint: string;      // Endpoint identifier for separate limits
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'chatbot': { windowMs: 3600000, maxRequests: 30, endpoint: 'chatbot' },      // 30/hour
  'contact': { windowMs: 3600000, maxRequests: 5, endpoint: 'contact' },        // 5/hour
  'auth': { windowMs: 900000, maxRequests: 10, endpoint: 'auth' },              // 10/15min
  'general': { windowMs: 60000, maxRequests: 100, endpoint: 'general' },        // 100/min
  'geolocate': { windowMs: 60000, maxRequests: 45, endpoint: 'geolocate' },     // 45/min (ip-api limit)
  'visitor-alert': { windowMs: 60000, maxRequests: 30, endpoint: 'visitor' },   // 30/min
  'embeddings': { windowMs: 60000, maxRequests: 50, endpoint: 'embeddings' },   // 50/min
};

/**
 * Get strict CORS headers that validate origin
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin =
    requestOrigin &&
    ALLOWED_ORIGINS.some(
      (allowed) =>
        requestOrigin === allowed ||
        requestOrigin.endsWith('.lovable.app') ||
        requestOrigin.endsWith('.lovableproject.com')
    )
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none'; base-uri 'self';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
  };
}

/**
 * Validate if the request origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(
    (allowed) =>
      origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  );
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new Response(null, { 
      status: 204,
      headers: getCorsHeaders(origin) 
    });
  }
  return null;
}

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations (CloudFlare, nginx, etc.)
 */
export function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  // x-forwarded-for can contain multiple IPs, take the first (original client)
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || cfConnectingIp || 'unknown';
}

/**
 * Check rate limit for a given IP and endpoint
 * Returns whether the request is allowed and remaining requests
 */
export function checkRateLimit(
  ip: string, 
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.general
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = `${config.endpoint}:${ip}`;
  
  // Probabilistic cleanup (10% chance each call)
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }
  
  const entry = rateLimitStore.get(key);
  
  // No entry or expired - create new
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { 
      count: 1, 
      resetTime: now + config.windowMs 
    });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs
    };
  }
  
  // Check if over limit
  if (entry.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: entry.resetTime - now
    };
  }
  
  // Increment and allow
  entry.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(
  origin: string | null,
  resetIn: number
): Response {
  const headers = getCorsHeaders(origin);
  const retryAfter = Math.ceil(resetIn / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: `${retryAfter} seconds`,
    }),
    {
      status: 429,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

/**
 * Create a CORS error response for blocked origins
 */
export function corsBlockedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  remaining: number,
  resetIn: number
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetIn / 1000).toString(),
  };
}

/**
 * Log rate limit event for monitoring and trigger alerts if needed
 */
export async function logRateLimitEvent(
  ip: string,
  endpoint: string,
  allowed: boolean,
  remaining: number,
  req?: Request
): Promise<void> {
  if (!allowed) {
    console.warn(`[RATE_LIMIT] IP ${ip} exceeded limit for ${endpoint}`);
    
    // Track violations and potentially send alert
    await trackViolationAndAlert(ip, endpoint, req);
  } else if (remaining <= 5) {
    console.log(`[RATE_LIMIT] IP ${ip} approaching limit for ${endpoint}: ${remaining} remaining`);
  }
}

/**
 * Track rate limit violations and send alerts when threshold is reached
 * Also persists violations to database for dashboard visibility
 */
async function trackViolationAndAlert(
  ip: string,
  endpoint: string,
  req?: Request
): Promise<void> {
  const now = Date.now();
  const key = `${endpoint}:${ip}`;
  
  let record = rateLimitViolations.get(key);
  
  // Create new record or reset if window expired
  if (!record || now > record.windowStart + ALERT_CONFIG.violationWindowMs) {
    record = {
      violations: 1,
      lastAlertTime: 0,
      windowStart: now,
    };
    rateLimitViolations.set(key, record);
    
    // Persist first violation to database
    await persistViolationToDatabase(ip, endpoint, 1, req);
    return;
  }
  
  // Increment violations
  record.violations++;
  
  // Persist updated violation count to database
  await persistViolationToDatabase(ip, endpoint, record.violations, req);
  
  // Check if we should send an alert
  const shouldAlert = 
    record.violations >= ALERT_CONFIG.minViolationsForAlert &&
    (now - record.lastAlertTime) > ALERT_CONFIG.alertCooldownMs;
  
  if (shouldAlert) {
    record.lastAlertTime = now;
    
    // Get location info if possible
    let location: { city?: string; country?: string; countryCode?: string } | undefined;
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,countryCode`);
      if (geoResponse.ok) {
        location = await geoResponse.json();
      }
    } catch (e) {
      console.log('[RATE_LIMIT] Could not fetch geolocation for alert');
    }
    
    // Update database with location and alert timestamp
    await updateViolationWithAlert(ip, endpoint, location);
    
    // Send alert via edge function
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
      
      await fetch(`${SUPABASE_URL}/functions/v1/send-rate-limit-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ipAddress: ip,
          endpoint: endpoint,
          rateLimitCount: record.violations,
          windowMinutes: Math.round(ALERT_CONFIG.violationWindowMs / 60000),
          userAgent: req?.headers.get('user-agent') || undefined,
          location: location,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log(`[RATE_LIMIT_ALERT] Alert sent for IP ${ip} (${record.violations} violations on ${endpoint})`);
    } catch (error) {
      console.error('[RATE_LIMIT_ALERT] Failed to send alert:', error);
    }
  }
}

/**
 * Persist violation to database for dashboard visibility
 */
async function persistViolationToDatabase(
  ip: string,
  endpoint: string,
  violationCount: number,
  req?: Request
): Promise<void> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[RATE_LIMIT] Missing Supabase credentials for persistence');
      return;
    }

    const userAgent = req?.headers.get('user-agent') || null;
    const now = new Date().toISOString();

    // Upsert violation record
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rate_limit_violations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        ip_address: ip,
        endpoint: endpoint,
        violation_count: violationCount,
        last_violation_at: now,
        user_agent: userAgent,
      }),
    });

    if (!response.ok) {
      console.error('[RATE_LIMIT] Failed to persist violation:', await response.text());
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Error persisting violation:', error);
  }
}

/**
 * Update violation record with location and alert timestamp
 */
async function updateViolationWithAlert(
  ip: string,
  endpoint: string,
  location?: { city?: string; country?: string; countryCode?: string }
): Promise<void> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

    const updateData: Record<string, any> = {
      alert_sent_at: new Date().toISOString(),
    };

    if (location) {
      if (location.city) updateData.city = location.city;
      if (location.country) updateData.country = location.country;
      if (location.countryCode) updateData.country_code = location.countryCode;
    }

    // Update the existing record
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rate_limit_violations?ip_address=eq.${encodeURIComponent(ip)}&endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      console.error('[RATE_LIMIT] Failed to update violation with alert:', await response.text());
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Error updating violation with alert:', error);
  }
}

/**
 * Get current violation count for an IP/endpoint (for monitoring)
 */
export function getViolationCount(ip: string, endpoint: string): number {
  const key = `${endpoint}:${ip}`;
  const record = rateLimitViolations.get(key);
  
  if (!record || Date.now() > record.windowStart + ALERT_CONFIG.violationWindowMs) {
    return 0;
  }
  
  return record.violations;
}
