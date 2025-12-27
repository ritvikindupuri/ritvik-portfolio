import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecruiterAlertRequest {
  session_id: string;
  recruiter_score: number;
  activities: {
    type: string;
    data: any;
    timestamp: string;
  }[];
  chatbot_queries: string[];
  sections_viewed: string[];
  resume_views: number;
  resume_downloads: number;
  session_duration_minutes: number;
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

function getRecruiterBadge(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: 'HIGH CONFIDENCE', color: '#22c55e', bgColor: '#22c55e20' };
  if (score >= 50) return { label: 'LIKELY RECRUITER', color: '#f97316', bgColor: '#f9731620' };
  return { label: 'POTENTIAL RECRUITER', color: '#eab308', bgColor: '#eab30820' };
}

function getSignalStrength(value: number, maxValue: number): string {
  const percentage = Math.min((value / maxValue) * 100, 100);
  if (percentage >= 75) return '🟢';
  if (percentage >= 50) return '🟡';
  if (percentage >= 25) return '🟠';
  return '⚪';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      session_id, 
      recruiter_score, 
      activities, 
      chatbot_queries,
      sections_viewed,
      resume_views,
      resume_downloads,
      session_duration_minutes
    }: RecruiterAlertRequest = await req.json();

    // Get actual IP from request headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || "unknown";

    console.log("Sending recruiter alert for session:", session_id, "Score:", recruiter_score);

    // Get location from IP
    const location = await getLocationFromIP(ipAddress);
    const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown Location';

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const badge = getRecruiterBadge(recruiter_score);
    
    // Identify which recruiter signals were triggered
    const signals: string[] = [];
    if (resume_downloads > 0) signals.push(`📥 Downloaded resume ${resume_downloads}x`);
    if (resume_views > 0) signals.push(`👁️ Viewed resume ${resume_views}x`);
    if (sections_viewed.length > 3) signals.push(`📋 Viewed ${sections_viewed.length} professional sections`);
    if (session_duration_minutes >= 3) signals.push(`⏱️ ${session_duration_minutes}+ min session`);
    
    // Find recruiter-related queries
    const recruiterKeywords = ['experience', 'resume', 'skills', 'work', 'projects', 'contact', 'hire', 'job', 'position', 'role', 'team', 'available', 'salary', 'rate'];
    const recruitingQueries = chatbot_queries.filter(q => 
      recruiterKeywords.some(kw => q.toLowerCase().includes(kw))
    );
    if (recruitingQueries.length > 0) signals.push(`💬 Asked ${recruitingQueries.length} recruiting-related questions`);

    // Build the funnel visualization
    const funnelSteps = [
      { 
        label: 'Sections Viewed', 
        value: sections_viewed.length, 
        icon: '📄',
        status: sections_viewed.length >= 3 ? '✅' : '⚪'
      },
      { 
        label: 'Resume Views', 
        value: resume_views, 
        icon: '👁️',
        status: resume_views > 0 ? '✅' : '⚪'
      },
      { 
        label: 'Resume Downloads', 
        value: resume_downloads, 
        icon: '📥',
        status: resume_downloads > 0 ? '✅' : '⚪'
      }
    ];

    const funnelHtml = funnelSteps.map((step, i) => `
      <div style="display: flex; align-items: center; gap: 12px; ${i < funnelSteps.length - 1 ? 'margin-bottom: 16px;' : ''}">
        <div style="width: 40px; height: 40px; background: ${step.status === '✅' ? '#22c55e20' : '#6b728020'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${step.icon}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #374151; font-size: 14px;">${step.label}</span>
            <span style="color: ${step.status === '✅' ? '#22c55e' : '#6b7280'}; font-weight: 600;">${step.value} ${step.status}</span>
          </div>
          <div style="background: #e5e7eb; border-radius: 4px; height: 6px; margin-top: 6px;">
            <div style="background: ${step.status === '✅' ? '#22c55e' : '#d1d5db'}; height: 100%; border-radius: 4px; width: ${Math.min((step.value / 3) * 100, 100)}%;"></div>
          </div>
        </div>
        ${i < funnelSteps.length - 1 ? '<div style="color: #d1d5db; font-size: 20px;">→</div>' : ''}
      </div>
    `).join('\n');

    // Build chatbot queries section
    const chatbotSection = recruitingQueries.length > 0 
      ? `
        <div style="margin-top: 32px;">
          <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
            🔍 Recruiting-Related Questions (${recruitingQueries.length})
          </h3>
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; overflow: hidden;">
            ${recruitingQueries.slice(0, 5).map((q, i) => `
              <div style="padding: 14px 16px; ${i < recruitingQueries.length - 1 ? 'border-bottom: 1px solid #fcd34d;' : ''}">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">"${sanitizeHtml(q)}"</p>
              </div>
            `).join('\n')}
          </div>
        </div>
      `
      : '';

    // Build sections viewed
    const sectionsHtml = sections_viewed.length > 0 ? `
      <div style="margin-top: 24px;">
        <h4 style="color: #374151; margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">Sections Viewed</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${sections_viewed.map(s => `
            <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;">
              ${sanitizeHtml(s)}
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header with Recruiter Badge -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
              <div style="background: ${badge.bgColor}; border: 2px solid ${badge.color}; display: inline-block; padding: 6px 16px; border-radius: 999px; margin-bottom: 16px;">
                <span style="color: ${badge.color}; font-size: 12px; font-weight: 700; letter-spacing: 0.05em;">${badge.label}</span>
              </div>
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">🎯 Recruiter Detected!</h1>
              <p style="color: #fed7aa; margin: 0; font-size: 14px;">Score: ${recruiter_score}/100 points</p>
            </div>

            <!-- Score Breakdown -->
            <div style="padding: 32px;">
              <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📊 Confidence Signals</h2>
              
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                ${signals.map((signal, i) => `
                  <div style="display: flex; align-items: center; gap: 8px; ${i < signals.length - 1 ? 'margin-bottom: 12px;' : ''}">
                    <span style="color: #22c55e;">✓</span>
                    <span style="color: #374151; font-size: 14px;">${signal}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Recruiter Funnel -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📈 Recruiter Funnel Progress</h2>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                ${funnelHtml}
              </div>
              ${sectionsHtml}
            </div>

            <!-- Visitor Info -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📍 Visitor Details</h2>
              <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Location</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${sanitizeHtml(locationStr)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${sanitizeHtml(ipAddress)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Session Duration</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${session_duration_minutes} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Total Actions</td>
                  <td style="padding: 12px 16px; color: #111827; font-size: 14px;">${activities.length} activities</td>
                </tr>
              </table>
            </div>

            ${chatbotSection}

            <!-- Call to Action -->
            <div style="padding: 0 32px 32px;">
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
                  🚀 This visitor shows strong recruiting intent!
                </p>
                <p style="color: #3b82f6; font-size: 12px; margin: 0;">
                  Check your dashboard for real-time updates and detailed analytics.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated recruiter detection alert from your portfolio security system.</p>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">Session ID: ${sanitizeHtml(session_id)}</p>
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
        subject: `🎯 Likely Recruiter Detected! (Score: ${recruiter_score}) - ${locationStr}`,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Recruiter alert email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-recruiter-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
