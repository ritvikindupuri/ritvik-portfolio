import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OWNER_EMAIL = "rivtik.indupuri@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lastPasswordChange } = await req.json();
    
    // Calculate days since last password change
    const lastChange = lastPasswordChange ? new Date(lastPasswordChange) : null;
    const daysSinceChange = lastChange 
      ? Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Update Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #12121a; border-radius: 12px; border: 1px solid #2a2a3a;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #2a2a3a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #f59e0b; font-size: 24px; font-weight: 600;">
                      Password Update Reminder
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">
                      Security notification for your portfolio account
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Section -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #f59e0b; font-size: 16px; font-weight: 600;">
                      Action Required
                    </p>
                    <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">
                      ${daysSinceChange !== null 
                        ? `Your password has not been changed in <strong style="color: #f59e0b;">${daysSinceChange} days</strong>.`
                        : 'Your password update status could not be determined.'}
                      For optimal security, we recommend updating your password every 90 days.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Details Section -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 16px; font-weight: 600;">
                Security Details
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a24; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #2a2a3a;">
                    <span style="color: #888; font-size: 13px;">Last Password Change</span>
                    <p style="margin: 4px 0 0 0; color: #fff; font-size: 14px; font-weight: 500;">
                      ${lastChange ? lastChange.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Unknown'}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #2a2a3a;">
                    <span style="color: #888; font-size: 13px;">Days Since Change</span>
                    <p style="margin: 4px 0 0 0; color: ${daysSinceChange && daysSinceChange > 90 ? '#f59e0b' : '#22c55e'}; font-size: 14px; font-weight: 500;">
                      ${daysSinceChange !== null ? `${daysSinceChange} days` : 'Unknown'}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <span style="color: #888; font-size: 13px;">Recommendation</span>
                    <p style="margin: 4px 0 0 0; color: #fff; font-size: 14px; font-weight: 500;">
                      Update password every 90 days
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Password Tips Section -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 16px; font-weight: 600;">
                Strong Password Guidelines
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a24; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #ccc; font-size: 14px; line-height: 1.8;">
                      <li>Use at least 8 characters</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Include at least one number</li>
                      <li>Include at least one special character</li>
                      <li>Avoid using personal information</li>
                      <li>Do not reuse passwords from other accounts</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px 0; color: #888; font-size: 14px;">
                      Log in to your portfolio dashboard to update your password.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #2a2a3a; background-color: #0d0d14; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                This is an automated security reminder from your portfolio system.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio Security <onboarding@resend.dev>",
        to: [OWNER_EMAIL],
        subject: `Password Update Reminder - ${daysSinceChange || 'Unknown'} Days Since Last Change`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Password reminder email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
