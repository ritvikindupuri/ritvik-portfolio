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
        subject: `New Login Location: ${locationStr}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: #ca8a04; padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">New Login Location Detected</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Security Notice</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    A successful login to your portfolio dashboard was detected from a new location.
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Email</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Location</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${locationStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${ipAddress}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Browser</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${browser}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Operating System</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${os}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; color: #6b7280; font-size: 14px;">Time</td>
                        <td style="padding: 14px 16px; color: #111827; font-size: 14px;">${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' })}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Warning -->
                  <div style="margin-top: 24px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                    <p style="color: #dc2626; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Was this you?</p>
                    <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.5;">If you don't recognize this login, please change your password immediately. This could indicate unauthorized access to your account.</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated security notification from your portfolio.</p>
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
        subject: `Security Alert: ${failedAttempts} Failed Login Attempts`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: #dc2626; padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Suspicious Login Activity</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Multiple failed attempts detected</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    We detected ${failedAttempts} failed login attempts on your portfolio dashboard within the last 15 minutes.
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Email Attempted</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${ipAddress || 'Unknown'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Browser</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${browser}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Operating System</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${os}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; color: #6b7280; font-size: 14px;">Time</td>
                        <td style="padding: 14px 16px; color: #111827; font-size: 14px;">${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' })}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Protection Status -->
                  <div style="margin-top: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
                    <p style="color: #166534; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Automated Protection Active</p>
                    <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">Further login attempts from this IP address will be rate-limited for 15 minutes.</p>
                  </div>

                  <!-- Recommendation -->
                  <div style="margin-top: 16px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px;">
                    <p style="color: #854d0e; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Recommended Action</p>
                    <p style="color: #854d0e; margin: 0; font-size: 14px; line-height: 1.5;">If this was not you, please ensure your account is secure and consider changing your password.</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated security alert from your portfolio.</p>
                </div>
              </div>
            </body>
          </html>
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