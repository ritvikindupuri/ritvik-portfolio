import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; script-src 'none'; object-src 'none'; base-uri 'self';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_HOUR = 5;

function getRateLimitKey(req: Request): string {
  // Try to get real IP from various headers (for proxies/CDNs)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  return forwardedFor?.split(',')[0] || realIp || cfConnectingIp || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - entry.count };
}

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateInput(data: ContactEmailRequest): { valid: boolean; error?: string } {
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }
  if (data.name.length > 100) {
    return { valid: false, error: "Name must be less than 100 characters" };
  }

  if (!data.email || typeof data.email !== "string" || data.email.trim().length === 0) {
    return { valid: false, error: "Email is required" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "Email must be less than 255 characters" };
  }
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: "Invalid email address" };
  }

  if (!data.message || typeof data.message !== "string" || data.message.trim().length === 0) {
    return { valid: false, error: "Message is required" };
  }
  if (data.message.length > 2000) {
    return { valid: false, error: "Message must be less than 2000 characters" };
  }

  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit
    const rateLimitKey = getRateLimitKey(req);
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter: "1 hour"
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: ContactEmailRequest = await req.json();

    // Validate input
    const validation = validateInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { name, email, message } = requestData;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Sanitize inputs for HTML insertion
    const sanitizedName = sanitizeHtml(name.trim());
    const sanitizedEmail = sanitizeHtml(email.trim());
    const sanitizedMessage = sanitizeHtml(message.trim());

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com", "rindupur@purdue.edu"],
        reply_to: email.trim(),
        subject: `New Contact Form Message from ${name.trim()}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${sanitizedEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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