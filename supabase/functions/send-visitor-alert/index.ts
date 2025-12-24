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

function formatActivityType(type: string): string {
  const typeMap: Record<string, string> = {
    'page_view': 'Page View',
    'resume_view': 'Resume View',
    'resume_download': 'Resume Download',
    'project_view': 'Project View',
    'chatbot_query': 'Chatbot Query',
    'section_view': 'Section View'
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

    // Build activity rows for the table
    const activityRows = activities.map(a => {
      const time = new Date(a.timestamp).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const activityType = formatActivityType(a.type);
      
      let detail = '';
      switch (a.type) {
        case 'page_view':
          detail = sanitizeHtml(a.data?.page || 'Home');
          break;
        case 'resume_view':
        case 'resume_download':
          detail = sanitizeHtml(a.data?.resume_name || 'Primary Resume');
          break;
        case 'project_view':
          detail = sanitizeHtml(a.data?.project_name || 'Project');
          break;
        case 'section_view':
          detail = sanitizeHtml(a.data?.section || 'Section');
          break;
        case 'chatbot_query':
          detail = 'Query submitted';
          break;
        default:
          detail = '-';
      }
      
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${time}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${activityType}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${detail}</td>
        </tr>
      `;
    }).join('\n');

    // Build chatbot queries section
    const chatbotSection = chatbot_queries && chatbot_queries.length > 0 
      ? `
        <div style="margin-top: 32px;">
          <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Chatbot Queries (${chatbot_queries.length})</h3>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            ${chatbot_queries.map((q, i) => `
              <div style="padding: 14px 16px; ${i < chatbot_queries.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">"${sanitizeHtml(q)}"</p>
              </div>
            `).join('\n')}
          </div>
        </div>
      `
      : '';

    // Calculate session stats
    const resumeViews = activities.filter(a => a.type === 'resume_view').length;
    const resumeDownloads = activities.filter(a => a.type === 'resume_download').length;
    const projectViews = activities.filter(a => a.type === 'project_view').length;
    const queryCount = chatbot_queries?.length || 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: #1f2937; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Portfolio Visitor Alert</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">New visitor activity detected</p>
            </div>
            
            <!-- Visitor Info -->
            <div style="padding: 32px;">
              <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Visitor Information</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Location</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${sanitizeHtml(locationStr)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${sanitizeHtml(ipAddress)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${sanitizeHtml(email || 'Not provided')}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Session ID</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-family: 'SF Mono', Monaco, monospace; font-size: 11px;">${sanitizeHtml(session_id)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Timestamp</td>
                  <td style="padding: 12px 0; color: #111827; font-size: 14px;">${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' })}</td>
                </tr>
              </table>
            </div>
            
            <!-- Session Summary -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Session Summary</h2>
              <div style="display: flex; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
                <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                  <div style="color: #111827; font-size: 24px; font-weight: 600;">${activities.length}</div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Total Activities</div>
                </div>
                <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                  <div style="color: #111827; font-size: 24px; font-weight: 600;">${resumeViews}</div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Resume Views</div>
                </div>
                <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                  <div style="color: #111827; font-size: 24px; font-weight: 600;">${resumeDownloads}</div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Downloads</div>
                </div>
                <div style="flex: 1; padding: 16px; text-align: center;">
                  <div style="color: #111827; font-size: 24px; font-weight: 600;">${queryCount}</div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Chatbot Queries</div>
                </div>
              </div>
            </div>

            <!-- Activity Log -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Activity Log</h2>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Time</th>
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Activity</th>
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activityRows || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">No activities recorded</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>

            ${chatbotSection ? `<div style="padding: 0 32px 32px;">${chatbotSection}</div>` : ''}

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated notification from your portfolio security system.</p>
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
        subject: `Portfolio Visitor: ${locationStr}${email ? ` - ${email}` : ''}`,
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