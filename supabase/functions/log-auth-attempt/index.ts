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

// Auto-block configuration
const HONEYPOT_BLOCK_THRESHOLD = 3; // Block IP after 3 honeypot triggers
const DEFAULT_BLOCK_DURATION_HOURS = 24; // 24-hour block by default

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

// Check if IP is blocked
async function checkBlockedIP(
  supabase: any,
  ipAddress: string
): Promise<{ isBlocked: boolean; reason?: string; expiresAt?: string }> {
  try {
    const { data: blockedIp, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !blockedIp) {
      return { isBlocked: false };
    }

    // Check if block has expired
    if (blockedIp.expires_at && new Date(blockedIp.expires_at) < new Date()) {
      // Block expired, deactivate it
      await supabase
        .from('blocked_ips')
        .update({ is_active: false })
        .eq('id', blockedIp.id);
      console.log(`Block expired for IP ${ipAddress}`);
      return { isBlocked: false };
    }

    console.log(`🚫 BLOCKED IP ATTEMPTED LOGIN: ${ipAddress} - ${blockedIp.reason}`);
    return { 
      isBlocked: true, 
      reason: blockedIp.reason,
      expiresAt: blockedIp.expires_at 
    };
  } catch (err) {
    console.error("Error checking blocked IP:", err);
    return { isBlocked: false };
  }
}

// Send auto-block notification email
async function sendAutoBlockNotification(
  ipAddress: string,
  triggerCount: number,
  honeypotEmail: string,
  expiresAt: Date,
  location: { city: string; country: string } | null
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping auto-block notification");
    return;
  }

  const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown Location';

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
        subject: `🚫 IP AUTO-BLOCKED: ${ipAddress}`,
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
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">🚫 IP Address Auto-Blocked</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Honeypot Threshold Exceeded</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    An IP address has been automatically blocked after triggering honeypot accounts ${triggerCount} times.
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Blocked IP</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: 600; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${ipAddress}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Location</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${locationStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Honeypot Triggers</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; font-size: 14px;">${triggerCount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Last Honeypot</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #7c3aed; font-weight: 500; font-size: 14px;">${honeypotEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Block Duration</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${DEFAULT_BLOCK_DURATION_HOURS} hours</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; color: #6b7280; font-size: 14px;">Expires At</td>
                        <td style="padding: 14px 16px; color: #111827; font-size: 14px;">${expiresAt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' })}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Protection Status -->
                  <div style="margin-top: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
                    <p style="color: #166534; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">✓ Protection Active</p>
                    <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">All login attempts from this IP will be rejected until the block expires or is manually removed.</p>
                  </div>

                  <!-- Action -->
                  <div style="margin-top: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                    <p style="color: #6b7280; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Manage Blocked IPs</p>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">You can view and manage blocked IPs from your dashboard's Security tab under "Honeypot & IP Block Management".</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #fef2f2; padding: 20px 32px; text-align: center; border-top: 1px solid #fecaca;">
                  <p style="color: #dc2626; font-size: 12px; margin: 0;">This is an automated security action from your portfolio threat detection system.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Failed to send auto-block notification email:", error);
    } else {
      console.log("Auto-block notification email sent successfully");
    }
  } catch (error) {
    console.error("Error sending auto-block notification email:", error);
  }
}

// Auto-block IP after honeypot threshold
async function checkAndAutoBlockIP(
  supabase: any,
  ipAddress: string,
  honeypotEmail: string,
  location: { city: string; country: string } | null
): Promise<{ blocked: boolean; triggerCount: number }> {
  try {
    // Count honeypot triggers from this IP
    const { data: triggers, error } = await supabase
      .from('honeypot_triggers')
      .select('id')
      .eq('ip_address', ipAddress);

    if (error) {
      console.error("Error counting honeypot triggers:", error);
      return { blocked: false, triggerCount: 0 };
    }

    const triggerCount = triggers?.length || 0;

    if (triggerCount >= HONEYPOT_BLOCK_THRESHOLD) {
      // Check if already blocked
      const { data: existingBlock } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ipAddress)
        .eq('is_active', true)
        .maybeSingle();

      if (!existingBlock) {
        // Auto-block the IP
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + DEFAULT_BLOCK_DURATION_HOURS);

        const { error: blockError } = await supabase
          .from('blocked_ips')
          .insert({
            ip_address: ipAddress,
            reason: `Auto-blocked: ${triggerCount} honeypot triggers`,
            honeypot_triggers: triggerCount,
            last_honeypot_email: honeypotEmail,
            expires_at: expiresAt.toISOString(),
            is_active: true
          });

        if (blockError) {
          console.error("Error auto-blocking IP:", blockError);
        } else {
          console.log(`🚫 AUTO-BLOCKED IP ${ipAddress} after ${triggerCount} honeypot triggers (expires: ${expiresAt.toISOString()})`);
          
          // Send email notification about the auto-block
          await sendAutoBlockNotification(ipAddress, triggerCount, honeypotEmail, expiresAt, location);
          
          return { blocked: true, triggerCount };
        }
      }
    }

    return { blocked: false, triggerCount };
  } catch (err) {
    console.error("Error in auto-block check:", err);
    return { blocked: false, triggerCount: 0 };
  }
}

// Check if email matches a honeypot account and log the trigger
async function checkHoneypot(
  supabase: any,
  email: string,
  ipAddress: string,
  userAgent: string | null
): Promise<{ isHoneypot: boolean; honeypotId?: string; honeypotEmail?: string }> {
  try {
    // Check if the email matches any active honeypot account
    const { data: honeypot, error } = await supabase
      .from('honeypot_accounts')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !honeypot) {
      return { isHoneypot: false };
    }

    // Log the honeypot trigger
    const { error: triggerError } = await supabase
      .from('honeypot_triggers')
      .insert({
        honeypot_id: honeypot.id,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (triggerError) {
      console.error("Error logging honeypot trigger:", triggerError);
    } else {
      console.log(`🍯 HONEYPOT TRIGGERED: ${email} from IP ${ipAddress}`);
    }

    return { isHoneypot: true, honeypotId: honeypot.id, honeypotEmail: honeypot.email };
  } catch (err) {
    console.error("Error checking honeypot:", err);
    return { isHoneypot: false };
  }
}

// Send honeypot alert email
async function sendHoneypotAlert(
  email: string,
  ipAddress: string,
  userAgent: string,
  location: { city: string; country: string } | null
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping honeypot alert");
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
        subject: `🍯 HONEYPOT TRIGGERED: ${email}`,
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
                <div style="background: #7c3aed; padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">🍯 Honeypot Account Triggered!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Attacker Detected - MITRE T1078.001</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    An attacker attempted to login using a honeypot account. This is a fake account designed to catch malicious actors.
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Honeypot Email</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #7c3aed; font-weight: 600; font-size: 14px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Attacker IP</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${ipAddress}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Location</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${locationStr}</td>
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

                  <!-- MITRE Info -->
                  <div style="margin-top: 24px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px;">
                    <p style="color: #7c3aed; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">MITRE ATT&CK Classification</p>
                    <p style="color: #6b21a8; margin: 0; font-size: 14px; line-height: 1.5;">
                      <strong>T1078.001 - Default Accounts:</strong> Adversaries may attempt to use default or common usernames to gain initial access.
                    </p>
                  </div>

                  <!-- Action -->
                  <div style="margin-top: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                    <p style="color: #dc2626; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Recommended Actions</p>
                    <ul style="color: #991b1b; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                      <li>Block IP address ${ipAddress} if persistent</li>
                      <li>Monitor for additional reconnaissance activity</li>
                      <li>Check other accounts for attempted access</li>
                    </ul>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated honeypot alert from your portfolio security system.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Failed to send honeypot alert email:", error);
    } else {
      console.log("Honeypot alert email sent successfully");
    }
  } catch (error) {
    console.error("Error sending honeypot alert email:", error);
  }
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

    // Create Supabase client with service role for inserting
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if IP is blocked FIRST
    const blockedCheck = await checkBlockedIP(supabase, ipAddress);
    if (blockedCheck.isBlocked) {
      // Log the attempt anyway for monitoring
      await supabase
        .from('login_attempts')
        .insert({
          email,
          ip_address: ipAddress,
          user_agent: userAgent || null,
          success: false,
          failure_reason: `Blocked IP: ${blockedCheck.reason}`,
        });

      return new Response(
        JSON.stringify({ 
          error: "Access denied",
          blocked: true,
          reason: blockedCheck.reason,
          expiresAt: blockedCheck.expiresAt
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if this is a honeypot account FIRST
    const honeypotResult = await checkHoneypot(supabase, email, ipAddress, userAgent || null);
    
    if (honeypotResult.isHoneypot) {
      // Get location for the alert
      let location: { city: string; country: string } | null = null;
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=city,country,status`);
        const geoData = await geoResponse.json();
        if (geoData.status === 'success') {
          location = { city: geoData.city, country: geoData.country };
        }
      } catch (e) {
        console.error("Error getting location for honeypot alert:", e);
      }

      // Send honeypot alert
      await sendHoneypotAlert(email, ipAddress, userAgent || "Unknown", location);

      // Check if we should auto-block this IP
      const autoBlockResult = await checkAndAutoBlockIP(supabase, ipAddress, email, location);

      // Still log the attempt
      await supabase
        .from('login_attempts')
        .insert({
          email,
          ip_address: ipAddress,
          user_agent: userAgent || null,
          success: false,
          failure_reason: autoBlockResult.blocked 
            ? `Honeypot triggered - IP auto-blocked (${autoBlockResult.triggerCount} triggers)`
            : 'Honeypot account triggered',
        });

      // Return a generic error to not reveal honeypot
      return new Response(
        JSON.stringify({ 
          error: "Invalid login credentials",
          logged: true,
          blocked: autoBlockResult.blocked,
          honeypotTriggered: true, // Only visible in response for tracking
          autoBlocked: autoBlockResult.blocked,
          triggerCount: autoBlockResult.triggerCount
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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

    // Check if this IP is in known locations table
    let isNewLocation: boolean = false;
    let isTrustedLocation: boolean = false;
    let location: { city: string; country: string; countryCode: string; lat?: number; lon?: number } | null = null;
    
    if (success && ipAddress !== 'unknown') {
      // Check known_login_locations table first
      const { data: knownLocation } = await supabase
        .from('known_login_locations')
        .select('*')
        .eq('ip_address', ipAddress)
        .maybeSingle();
      
      if (knownLocation) {
        // Location is known, update last_seen_at and times_seen
        isTrustedLocation = knownLocation.is_trusted;
        const newTimesSeen = knownLocation.times_seen + 1;
        
        // Auto-trust after 5 successful logins from the same IP
        const AUTO_TRUST_THRESHOLD = 5;
        const shouldAutoTrust = !knownLocation.is_trusted && newTimesSeen >= AUTO_TRUST_THRESHOLD;
        
        await supabase
          .from('known_login_locations')
          .update({ 
            last_seen_at: new Date().toISOString(),
            times_seen: newTimesSeen,
            is_trusted: shouldAutoTrust ? true : knownLocation.is_trusted,
            notes: shouldAutoTrust ? `Auto-trusted after ${AUTO_TRUST_THRESHOLD} successful logins` : knownLocation.notes
          })
          .eq('ip_address', ipAddress);
        
        if (shouldAutoTrust) {
          console.log(`Auto-trusted location ${ipAddress} after ${AUTO_TRUST_THRESHOLD} successful logins`);
          isTrustedLocation = true;
        }
        
        console.log(`Known location login from ${ipAddress} (trusted: ${isTrustedLocation}, times_seen: ${newTimesSeen})`);
      } else {
        // New location - get geolocation and add to table
        isNewLocation = true;
        
        // Get geolocation data
        try {
          const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=city,country,countryCode,lat,lon,status`);
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            location = { 
              city: geoData.city, 
              country: geoData.country, 
              countryCode: geoData.countryCode,
              lat: geoData.lat,
              lon: geoData.lon
            };
          }
        } catch (geoError) {
          console.error("Error getting geolocation:", geoError);
        }
        
        // Insert new location into known_login_locations (not trusted by default)
        const { error: locationInsertError } = await supabase
          .from('known_login_locations')
          .insert({
            ip_address: ipAddress,
            city: location?.city || null,
            country: location?.country || null,
            country_code: location?.countryCode || null,
            latitude: location?.lat || null,
            longitude: location?.lon || null,
            is_trusted: false,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            times_seen: 1
          });
        
        if (locationInsertError) {
          console.error("Error inserting new location:", locationInsertError);
        } else {
          console.log(`New login location added: ${ipAddress} - ${location?.city}, ${location?.country}`);
        }
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
        newLocation: isNewLocation,
        isTrustedLocation: isTrustedLocation
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