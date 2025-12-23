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

async function sendAlertEmail(email: string, ipAddress: string, userAgent: string, failedAttempts: number): Promise<void> {
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
        subject: `🚨 Security Alert: Suspicious Login Activity Detected`,
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
    const ipAddress = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || "unknown";

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

    // Send alert if threshold reached
    if (!success && rateLimit.count === MAX_FAILED_ATTEMPTS) {
      await sendAlertEmail(email, ipAddress, userAgent || "Unknown", rateLimit.count);
    }

    return new Response(
      JSON.stringify({ 
        logged: true, 
        blocked: false,
        remainingAttempts: success ? null : MAX_FAILED_ATTEMPTS - rateLimit.count
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