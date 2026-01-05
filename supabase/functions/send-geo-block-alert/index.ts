import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoBlockAlertRequest {
  email: string;
  ipAddress: string;
  countryCode: string;
  countryName: string;
  city: string | null;
  action: "block" | "flag";
  userAgent: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, ipAddress, countryCode, countryName, city, action, userAgent }: GeoBlockAlertRequest = await req.json();

    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);
    const locationStr = city ? `${city}, ${countryName}` : countryName;
    const isBlocked = action === "block";

    const headerColor = isBlocked ? "#dc2626" : "#ca8a04";
    const headerText = isBlocked ? "Geographic Block Triggered" : "Geographic Flag Triggered";
    const statusText = isBlocked ? "LOGIN BLOCKED" : "LOGIN FLAGGED";
    const statusDescription = isBlocked 
      ? "This login attempt was automatically blocked based on geographic blocking rules."
      : "This login attempt was flagged for review based on geographic rules but was allowed through.";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Security <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com"],
        subject: `Geographic ${isBlocked ? 'Block' : 'Flag'}: Login from ${countryName}`,
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
                <div style="background: ${headerColor}; padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">${headerText}</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">${statusText}</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    ${statusDescription}
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Email Attempted</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${ipAddress}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Location</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: ${headerColor}; font-weight: 600; font-size: 14px;">${locationStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Country Code</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${countryCode}</td>
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

                  <!-- Action Status -->
                  <div style="margin-top: 24px; background: ${isBlocked ? '#f0fdf4' : '#fefce8'}; border: 1px solid ${isBlocked ? '#bbf7d0' : '#fef08a'}; border-radius: 8px; padding: 16px;">
                    <p style="color: ${isBlocked ? '#166534' : '#854d0e'}; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">
                      ${isBlocked ? 'Access Denied' : 'Access Allowed (Flagged)'}
                    </p>
                    <p style="color: ${isBlocked ? '#166534' : '#854d0e'}; margin: 0; font-size: 14px; line-height: 1.5;">
                      ${isBlocked 
                        ? 'The login attempt was rejected. The user received an access denied message.'
                        : 'The login attempt was allowed but recorded for your review. Consider updating your blocking rules if this is suspicious.'}
                    </p>
                  </div>

                  <!-- Manage Rules -->
                  <div style="margin-top: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                    <p style="color: #6b7280; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Manage Geographic Rules</p>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
                      You can update your geographic blocking rules from the Locations tab in your dashboard's Analytics & Security Center.
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated geographic security alert from your portfolio.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Failed to send geo block alert email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Geographic ${action} alert sent for ${countryName}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-geo-block-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
