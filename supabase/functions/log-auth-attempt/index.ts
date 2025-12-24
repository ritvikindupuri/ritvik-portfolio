import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthAttemptRequest {
  email: string;
  success: boolean;
  failureReason?: string;
  userAgent?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 900000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function getLocationFromIP(ip: string): Promise<{ city: string; country: string; countryCode: string } | null> {
  try {
    if (!ip || ip === 'unknown') return null;
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,countryCode,status`);
    const data = await response.json();
    if (data.status === 'success') {
      return { city: data.city, country: data.country, countryCode: data.countryCode };
    }
    return null;
  } catch (error) {
    console.error("Error getting location from IP:", error);
    return null;
  }
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  return 'Other';
}

function parseOS(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  return 'Other';
}

async function sendNewLocationAlert(
  email: string, 
  ipAddress: string, 
  userAgent: string,
  location: { city: string; country: string; countryCode: string } | null
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping new location alert");
    return;
  }

  const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown Location';
  const browser = parseBrowser(userAgent);
  const os = parseOS(userAgent);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Security <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com"],
        subject: `New Login Location Detected: ${locationStr}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #e0e0e0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #16162a; border-radius: 12px; padding: 30px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #ffc107; margin: 0; }
                .badge { display: inline-block; background: #ffc10720; color: #ffc107; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
                .info-box { background: #1a1a2e; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #252542; }
                .info-row:last-child { border-bottom: none; }
                .label { color: #888; }
                .value { color: #fff; font-weight: 500; }
                .warning { background: #ff572220; border: 1px solid #ff5722; border-radius: 8px; padding: 15px; margin-top: 20px; }
                .warning p { color: #ff8a65; margin: 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>New Login Location Detected</h1>
                  <span class="badge">SECURITY NOTICE</span>
                </div>
                
                <p style="color: #e0e0e0; text-align: center;">A successful login to your portfolio dashboard was detected from a new location.</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Email</span>
                    <span class="value">${email}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Location</span>
                    <span class="value">${locationStr}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">IP Address</span>
                    <span class="value" style="font-family: monospace;">${ipAddress}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Browser</span>
                    <span class="value">${browser}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Operating System</span>
                    <span class="value">${os}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Time</span>
                    <span class="value">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</span>
                  </div>
                </div>

                <div class="warning">
                  <p><strong>Was this you?</strong></p>
                  <p style="margin-top: 10px;">If you don't recognize this login, please change your password immediately. This could indicate unauthorized access to your account.</p>
                </div>

                <div class="footer">
                  <p>This is an automated security notification from your portfolio.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Failed to send new location alert email:", error);
    } else {
      console.log("New location alert email sent successfully");
    }
  } catch (error) {
    console.error("Error sending new location alert email:", error);
  }
}

async function sendSuspiciousActivityAlert(email: string, ipAddress: string, userAgent: string, failedAttempts: number): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping email alert");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Security <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com"],
        subject: `Security Alert: Suspicious Login Activity Detected`,
        html: `
          <h2 style="color: #e53935;">Security Alert: Multiple Failed Login Attempts</h2>
          <p>We detected suspicious login activity on your portfolio.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Email Attempted:</strong> ${email}</p>
            <p><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
            <p><strong>Failed Attempts:</strong> ${failedAttempts} in the last 15 minutes</p>
            <p><strong>User Agent:</strong> ${userAgent || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #666;">If this was not you, please ensure your account is secure and consider changing your password.</p>
          <p><strong>Automated protection is active:</strong> Further login attempts from this IP will be rate-limited.</p>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Failed to send alert email:", error);
    } else {
      console.log("Security alert email sent successfully");
    }
  } catch (error) {
    console.error("Error sending alert email:", error);
  }
}

function checkRateLimit(key: string, success: boolean): { blocked: boolean; count: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }
  }

  // Only track failed attempts for rate limiting
  if (success) {
    // Reset on successful login
    rateLimitMap.delete(key);
    return { blocked: false, count: 0 };
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { blocked: false, count: 1 };
  }

  entry.count++;
  const blocked = entry.count > MAX_FAILED_ATTEMPTS;
  return { blocked, count: entry.count };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, success, failureReason, userAgent }: AuthAttemptRequest = await req.json();
    
    // Get IP from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || "unknown";

    // Check rate limit
    const rateLimitKey = `${email}:${ipAddress}`;
    const rateLimit = checkRateLimit(rateLimitKey, success);

    if (rateLimit.blocked) {
      console.warn(`Rate limit exceeded for ${email} from ${ipAddress}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many failed login attempts. Please try again later.",
          blocked: true,
          retryAfter: "15 minutes"
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role for inserting
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this IP has been seen before (for new location detection)
    let isNewLocation: boolean = false;
    let location: { city: string; country: string; countryCode: string } | null = null;
    
    if (success && ipAddress !== 'unknown') {
      const { data: previousLogins } = await supabase
        .from('login_attempts')
        .select('ip_address')
        .eq('email', email)
        .eq('success', true)
        .neq('ip_address', ipAddress)
        .limit(1);
      
      // Check if this specific IP has been used before
      const { data: sameIPLogins } = await supabase
        .from('login_attempts')
        .select('id')
        .eq('email', email)
        .eq('ip_address', ipAddress)
        .eq('success', true)
        .limit(1);
      
      // It's a new location if there are previous logins from other IPs but not from this one
      isNewLocation = !!(previousLogins && previousLogins.length > 0 && (!sameIPLogins || sameIPLogins.length === 0));
      
      if (isNewLocation) {
        location = await getLocationFromIP(ipAddress);
        console.log(`New login location detected for ${email} from ${ipAddress}:`, location);
      }
    }

    // Log the attempt
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        user_agent: userAgent || null,
        success,
        failure_reason: failureReason || null,
      });

    if (insertError) {
      console.error("Error logging auth attempt:", insertError);
    } else {
      console.log(`Auth attempt logged: ${email}, success: ${success}, IP: ${ipAddress}`);
    }

    // Send new location alert for successful logins from new IPs
    if (isNewLocation) {
      await sendNewLocationAlert(email, ipAddress, userAgent || "Unknown", location);
    }

    // Send alert if threshold reached for failed attempts
    if (!success && rateLimit.count === MAX_FAILED_ATTEMPTS) {
      await sendSuspiciousActivityAlert(email, ipAddress, userAgent || "Unknown", rateLimit.count);
    }

    return new Response(
      JSON.stringify({ 
        logged: true, 
        blocked: false,
        remainingAttempts: success ? null : MAX_FAILED_ATTEMPTS - rateLimit.count,
        newLocation: isNewLocation
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in log-auth-attempt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);