import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisitorAlertRequest {
  session_id: string;
  ip_address: string;
  email?: string;
  activities: {
    type: string;
    data: any;
    timestamp: string;
  }[];
  chatbot_queries?: string[];
}

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getLocationFromIP(ip: string): Promise<{ city: string; country: string } | null> {
  try {
    if (!ip || ip === 'unknown') return null;
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`);
    const data = await response.json();
    if (data.status === 'success') {
      return { city: data.city, country: data.country };
    }
    return null;
  } catch (error) {
    console.error("Error getting location from IP:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, email, activities, chatbot_queries }: VisitorAlertRequest = await req.json();

    // Get actual IP from request headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || "unknown";

    console.log("Sending visitor alert for session:", session_id, "IP:", ipAddress);

    // Get location from IP
    const location = await getLocationFromIP(ipAddress);
    const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown Location';

    // Update visitor_activity records with the IP address
    if (ipAddress !== 'unknown') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: updateError } = await supabase
        .from('visitor_activity')
        .update({ ip_address: ipAddress })
        .eq('session_id', session_id)
        .is('ip_address', null);
      
      if (updateError) {
        console.error("Error updating visitor IP:", updateError);
      } else {
        console.log("Updated visitor activity with IP:", ipAddress);
      }
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Build activity summary
    const activitySummary = activities.map(a => {
      const time = new Date(a.timestamp).toLocaleString();
      const safeData = sanitizeHtml(JSON.stringify(a.data || {}));
      switch (a.type) {
        case 'page_view':
          return `<li>📄 Viewed page: <strong>${sanitizeHtml(a.data?.page || 'Home')}</strong> at ${time}</li>`;
        case 'resume_view':
          return `<li>📋 Viewed resume: <strong>${sanitizeHtml(a.data?.resume_name || 'Primary')}</strong> at ${time}</li>`;
        case 'resume_download':
          return `<li>⬇️ Downloaded resume: <strong>${sanitizeHtml(a.data?.resume_name || 'Primary')}</strong> at ${time}</li>`;
        case 'project_view':
          return `<li>🔍 Viewed project: <strong>${sanitizeHtml(a.data?.project_name || 'Unknown')}</strong> at ${time}</li>`;
        case 'chatbot_query':
          return `<li>💬 Chatbot query at ${time}</li>`;
        case 'section_view':
          return `<li>👁️ Viewed section: <strong>${sanitizeHtml(a.data?.section || 'Unknown')}</strong> at ${time}</li>`;
        default:
          return `<li>📌 ${sanitizeHtml(a.type)}: ${safeData} at ${time}</li>`;
      }
    }).join('\n');

    // Build chatbot queries section
    const chatbotSection = chatbot_queries && chatbot_queries.length > 0 
      ? `
        <div style="margin-top: 20px; padding: 15px; background: #1a1a2e; border-radius: 8px; border-left: 4px solid #00d4ff;">
          <h3 style="color: #00d4ff; margin: 0 0 10px 0;">💬 Chatbot Queries (${chatbot_queries.length})</h3>
          <ul style="color: #e0e0e0; margin: 0; padding-left: 20px;">
            ${chatbot_queries.map(q => `<li style="margin: 8px 0; padding: 8px; background: #252542; border-radius: 4px;">"${sanitizeHtml(q)}"</li>`).join('\n')}
          </ul>
        </div>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #e0e0e0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #16162a; border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #00d4ff; margin: 0; }
            .badge { display: inline-block; background: #00d4ff20; color: #00d4ff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
            .info-box { background: #1a1a2e; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #252542; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #888; }
            .value { color: #fff; font-weight: 500; }
            .activities { margin-top: 20px; }
            .activities h3 { color: #00d4ff; margin-bottom: 10px; }
            .activities ul { list-style: none; padding: 0; margin: 0; }
            .activities li { padding: 8px 0; border-bottom: 1px solid #252542; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Portfolio Visitor Alert</h1>
              <span class="badge">GUEST ACTIVITY</span>
            </div>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Session ID</span>
                <span class="value" style="font-family: monospace; font-size: 12px;">${sanitizeHtml(session_id)}</span>
              </div>
              <div class="info-row">
                <span class="label">IP Address</span>
                <span class="value" style="font-family: monospace;">${sanitizeHtml(ipAddress)}</span>
              </div>
              <div class="info-row">
                <span class="label">Location</span>
                <span class="value">${sanitizeHtml(locationStr)}</span>
              </div>
              <div class="info-row">
                <span class="label">Visitor Email</span>
                <span class="value">${sanitizeHtml(email || 'Not provided')}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Activities</span>
                <span class="value">${activities.length}</span>
              </div>
              <div class="info-row">
                <span class="label">Time</span>
                <span class="value">${new Date().toLocaleString()}</span>
              </div>
            </div>

            <div class="activities">
              <h3>📊 Activity Log</h3>
              <ul>
                ${activitySummary || '<li>No activities recorded</li>'}
              </ul>
            </div>

            ${chatbotSection}

            <div class="footer">
              <p>This is an automated notification from your portfolio security system.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Alert <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com"],
        subject: `Portfolio Viewed by Guest${email ? ` (${email})` : ''} - ${locationStr}`,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Visitor alert email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-visitor-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);