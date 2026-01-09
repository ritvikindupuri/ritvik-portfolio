import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * Rate Limit Alert Edge Function
 * 
 * Sends email alerts when an IP address is being rate limited frequently.
 * This function is called when an IP exceeds the rate limit threshold multiple times.
 * 
 * SECURITY FEATURES:
 * - CORS validation against allowed origins
 * - Input sanitization
 * - HTML escaping to prevent XSS in emails
 * 
 * ALERT CONTENTS:
 * - IP address being rate limited
 * - Endpoint that triggered the limit
 * - Number of times rate limited in the time window
 * - Geographic location (if available)
 * - User agent information
 * - Recommended actions
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OWNER_EMAIL = "ritvik777@gmail.com";
const FROM_EMAIL = "Portfolio Security <security@ritvikindupuri.com>";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://ritvik-portfolio.lovable.app',
  'https://ritvikindupuri.com',
  'https://www.ritvikindupuri.com',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

interface RateLimitAlertRequest {
  ipAddress: string;
  endpoint: string;
  rateLimitCount: number;
  windowMinutes: number;
  userAgent?: string;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: string;
}

function buildAlertEmail(data: RateLimitAlertRequest): string {
  const locationInfo = data.location 
    ? `${data.location.city || 'Unknown'}, ${data.location.country || 'Unknown'}`
    : 'Unknown';
  
  const severityColor = data.rateLimitCount >= 10 ? '#dc2626' : 
                        data.rateLimitCount >= 5 ? '#f59e0b' : '#3b82f6';
  
  const severityLevel = data.rateLimitCount >= 10 ? 'HIGH' :
                        data.rateLimitCount >= 5 ? 'MEDIUM' : 'LOW';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rate Limit Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center; border: 1px solid #334155; border-bottom: none;">
      <div style="font-size: 48px; margin-bottom: 16px;">🚦</div>
      <h1 style="color: #f8fafc; margin: 0; font-size: 24px; font-weight: 700;">Rate Limit Alert</h1>
      <div style="margin-top: 12px;">
        <span style="background-color: ${severityColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          ${severityLevel} SEVERITY
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div style="background: #1e293b; padding: 30px; border: 1px solid #334155; border-top: none;">
      <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 14px;">
        An IP address has been rate limited <strong style="color: #f8fafc;">${data.rateLimitCount} times</strong> 
        within the last <strong style="color: #f8fafc;">${data.windowMinutes} minutes</strong> on your portfolio.
      </p>

      <!-- Alert Details Card -->
      <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">📋</span> Alert Details
        </h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px; width: 120px;">IP Address</td>
            <td style="color: #f8fafc; padding: 8px 0; font-size: 13px; font-family: monospace; background: #334155; padding-left: 8px; border-radius: 4px;">
              ${escapeHtml(data.ipAddress)}
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px;">Endpoint</td>
            <td style="color: #38bdf8; padding: 8px 0; font-size: 13px; font-family: monospace;">
              ${escapeHtml(data.endpoint)}
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px;">Location</td>
            <td style="color: #f8fafc; padding: 8px 0; font-size: 13px;">
              📍 ${escapeHtml(locationInfo)}
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px;">Times Limited</td>
            <td style="color: ${severityColor}; padding: 8px 0; font-size: 13px; font-weight: 600;">
              ${data.rateLimitCount}x in ${data.windowMinutes} min
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px;">Timestamp</td>
            <td style="color: #f8fafc; padding: 8px 0; font-size: 13px;">
              ${new Date(data.timestamp).toLocaleString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </td>
          </tr>
          ${data.userAgent ? `
          <tr>
            <td style="color: #64748b; padding: 8px 0; font-size: 13px; vertical-align: top;">User Agent</td>
            <td style="color: #94a3b8; padding: 8px 0; font-size: 11px; word-break: break-word;">
              ${escapeHtml(data.userAgent.substring(0, 150))}${data.userAgent.length > 150 ? '...' : ''}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Threat Analysis -->
      <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">🔍</span> Threat Analysis
        </h3>
        <p style="color: #94a3b8; margin: 0 0 12px 0; font-size: 13px;">
          This activity may indicate:
        </p>
        <ul style="color: #94a3b8; margin: 0; padding-left: 20px; font-size: 13px;">
          <li style="margin-bottom: 8px;">
            <strong style="color: #f59e0b;">Automated Bot Activity</strong> - Scripted requests targeting your endpoints
          </li>
          <li style="margin-bottom: 8px;">
            <strong style="color: #f59e0b;">Denial of Service Attempt</strong> - Intentional resource exhaustion
          </li>
          <li style="margin-bottom: 8px;">
            <strong style="color: #f59e0b;">API Abuse</strong> - Excessive querying of chatbot or contact endpoints
          </li>
          <li>
            <strong style="color: #94a3b8;">Misconfigured Client</strong> - Legitimate user with buggy implementation
          </li>
        </ul>
      </div>

      <!-- Recommended Actions -->
      <div style="background: linear-gradient(135deg, #164e63 0%, #0f172a 100%); border-radius: 12px; padding: 20px; border: 1px solid #0891b2;">
        <h3 style="color: #22d3ee; margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">✅</span> Recommended Actions
        </h3>
        <ol style="color: #94a3b8; margin: 0; padding-left: 20px; font-size: 13px;">
          <li style="margin-bottom: 8px;">
            <strong style="color: #f8fafc;">Monitor</strong> - Check if this IP continues to hit rate limits
          </li>
          <li style="margin-bottom: 8px;">
            <strong style="color: #f8fafc;">Review Logs</strong> - Check edge function logs for request patterns
          </li>
          ${data.rateLimitCount >= 10 ? `
          <li style="margin-bottom: 8px;">
            <strong style="color: #ef4444;">Consider Blocking</strong> - High frequency suggests malicious intent
          </li>
          ` : ''}
          <li>
            <strong style="color: #f8fafc;">Block if Needed</strong> - Add to IP blocklist via Owner Dashboard
          </li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0f172a; border-radius: 0 0 16px 16px; padding: 20px; text-align: center; border: 1px solid #334155; border-top: none;">
      <p style="color: #64748b; margin: 0; font-size: 12px;">
        🛡️ Portfolio Security Monitoring System
      </p>
      <p style="color: #475569; margin: 8px 0 0 0; font-size: 11px;">
        Rate limiting protects your portfolio from abuse and ensures fair resource usage.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const data: RateLimitAlertRequest = await req.json();

    // Validate required fields
    if (!data.ipAddress || !data.endpoint || !data.rateLimitCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ipAddress, endpoint, rateLimitCount' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Build and send email
    const htmlContent = buildAlertEmail({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      windowMinutes: data.windowMinutes || 60,
    });

    const severityLevel = data.rateLimitCount >= 10 ? '🔴 HIGH' :
                          data.rateLimitCount >= 5 ? '🟡 MEDIUM' : '🔵 LOW';

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        subject: `${severityLevel} Rate Limit Alert: ${data.ipAddress} on ${data.endpoint}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailResponse = await res.json();
    console.log(`[RATE_LIMIT_ALERT] Email sent for IP ${data.ipAddress} (${data.rateLimitCount}x on ${data.endpoint})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.id,
        message: 'Rate limit alert sent successfully' 
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('[RATE_LIMIT_ALERT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
};

serve(handler);
