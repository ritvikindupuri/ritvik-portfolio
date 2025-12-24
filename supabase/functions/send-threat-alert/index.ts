import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThreatInfo {
  technique_id: string;
  technique_name: string;
  tactic: string;
  severity: string;
  confidence: number;
  description: string;
  evidence: string[];
}

interface ThreatAlertRequest {
  attacker_email: string;
  attacker_ip: string;
  attacker_name?: string;
  login_attempts: {
    success: boolean;
    timestamp: string;
    failure_reason?: string;
    user_agent?: string;
  }[];
  threats: ThreatInfo[];
}

// Remediation steps for each MITRE technique
const REMEDIATION_STEPS: Record<string, string[]> = {
  T1110: [
    "Implement account lockout after 5 failed attempts",
    "Enable multi-factor authentication (MFA)",
    "Use CAPTCHA after 3 failed attempts",
    "Implement exponential backoff for login attempts",
    "Consider IP-based rate limiting"
  ],
  "T1110.001": [
    "Enforce strong password policies (min 12 chars, complexity)",
    "Use password strength meters during registration",
    "Check passwords against known breached password databases",
    "Implement account lockout policies",
    "Enable MFA for all accounts"
  ],
  "T1110.003": [
    "Monitor for login attempts across multiple accounts from same IP",
    "Implement global rate limiting per IP",
    "Use behavioral analysis to detect spray patterns",
    "Alert on unusual login patterns across accounts",
    "Consider implementing honeypot accounts"
  ],
  T1078: [
    "Enable login notifications for users",
    "Implement geo-velocity checks (impossible travel)",
    "Require re-authentication for sensitive actions",
    "Monitor for unusual access patterns",
    "Implement session management best practices"
  ],
  T1090: [
    "Block known VPN/proxy IP ranges if not needed",
    "Implement additional verification for proxy-sourced logins",
    "Monitor Tor exit node access",
    "Consider risk-based authentication",
    "Log and review all proxy-based access"
  ],
  T1531: [
    "Implement account recovery mechanisms",
    "Enable admin notifications on mass lockout events",
    "Use progressive delays for failed attempts",
    "Maintain admin override capabilities",
    "Regular backup of authentication data"
  ]
};

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const getSeverityColor = (severity: string): { bg: string; text: string; border: string } => {
  switch (severity) {
    case 'high': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    case 'medium': return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
    case 'low': return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' };
    default: return { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' };
  }
};

const getSeverityLabel = (severity: string): string => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attacker_email, attacker_ip, attacker_name, login_attempts, threats }: ThreatAlertRequest = await req.json();

    console.log("Sending threat alert for:", attacker_email, "from IP:", attacker_ip);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Determine highest severity
    const highestSeverity = threats.reduce((max, t) => {
      const order: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (order[t.severity] || 0) > (order[max] || 0) ? t.severity : max;
    }, 'low');

    const severityColors = getSeverityColor(highestSeverity);

    // Build login attempt log
    const loginLog = login_attempts.map(attempt => {
      const time = new Date(attempt.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const statusColor = attempt.success ? '#16a34a' : '#dc2626';
      const statusText = attempt.success ? 'Success' : 'Failed';
      const reason = attempt.failure_reason ? ` - ${sanitizeHtml(attempt.failure_reason)}` : '';
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${time}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: ${statusColor}; font-weight: 500; font-size: 14px;">${statusText}</span>
            <span style="color: #6b7280; font-size: 13px;">${reason}</span>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${attempt.user_agent ? sanitizeHtml(attempt.user_agent.substring(0, 60)) : '-'}</td>
        </tr>
      `;
    }).join('\n');

    // Build threat cards
    const threatCards = threats.map(threat => {
      const colors = getSeverityColor(threat.severity);
      const baseId = threat.technique_id.split('.')[0];
      const remediation = REMEDIATION_STEPS[threat.technique_id] || REMEDIATION_STEPS[baseId] || [];
      return `
        <div style="background: #ffffff; border: 1px solid ${colors.border}; border-left: 4px solid ${colors.text}; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h3 style="color: #111827; margin: 0; font-size: 16px; font-weight: 600;">${sanitizeHtml(threat.technique_name)}</h3>
            <span style="background: ${colors.bg}; color: ${colors.text}; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; text-transform: uppercase;">
              ${getSeverityLabel(threat.severity)}
            </span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <table style="font-size: 13px;">
              <tr>
                <td style="padding: 4px 16px 4px 0; color: #6b7280;">MITRE ATT&CK ID</td>
                <td style="padding: 4px 0; color: #111827; font-family: 'SF Mono', Monaco, monospace;">${sanitizeHtml(threat.technique_id)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 16px 4px 0; color: #6b7280;">Tactic</td>
                <td style="padding: 4px 0; color: #111827;">${sanitizeHtml(threat.tactic)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 16px 4px 0; color: #6b7280;">Confidence</td>
                <td style="padding: 4px 0; color: #111827;">${Math.round(threat.confidence * 100)}%</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #374151; font-size: 14px; margin: 12px 0; line-height: 1.5;">${sanitizeHtml(threat.description)}</p>
          
          <div style="margin-top: 16px;">
            <h4 style="color: #6b7280; margin: 0 0 8px 0; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Evidence</h4>
            <ul style="color: #374151; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              ${threat.evidence.map(e => `<li style="margin: 4px 0;">${sanitizeHtml(e)}</li>`).join('')}
            </ul>
          </div>
          
          ${remediation.length > 0 ? `
          <div style="margin-top: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px;">
            <h4 style="color: #166534; margin: 0 0 8px 0; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Recommended Actions</h4>
            <ol style="color: #166534; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              ${remediation.map(r => `<li style="margin: 4px 0;">${sanitizeHtml(r)}</li>`).join('')}
            </ol>
          </div>
          ` : ''}
        </div>
      `;
    }).join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px;">
          <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: ${severityColors.text}; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Security Threat Detected</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">${getSeverityLabel(highestSeverity)} severity - ${threats.length} threat(s) identified</p>
            </div>
            
            <!-- Attacker Info -->
            <div style="padding: 32px;">
              <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Attacker Information</h2>
              
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 140px;">Email / Account</td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500; font-size: 14px;">${sanitizeHtml(attacker_email)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">IP Address</td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">${sanitizeHtml(attacker_ip)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Name</td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${sanitizeHtml(attacker_name || 'Unknown')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 16px; color: #6b7280; font-size: 14px;">Detection Time</td>
                    <td style="padding: 14px 16px; color: #111827; font-size: 14px;">${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' })}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Login Attempt Log -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Login Attempt Log</h2>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Timestamp</th>
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                      <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${loginLog || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">No login attempts logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Threat Analysis -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">MITRE ATT&CK Threat Analysis</h2>
              ${threatCards}
            </div>

            <!-- Reference Links -->
            <div style="padding: 0 32px 32px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Reference Documentation</h2>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <ul style="color: #374151; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  ${threats.map(t => `
                    <li style="margin: 4px 0;">
                      <a href="https://attack.mitre.org/techniques/${t.technique_id.replace('.', '/')}/" style="color: #2563eb; text-decoration: none;" target="_blank">
                        ${sanitizeHtml(t.technique_id)} - ${sanitizeHtml(t.technique_name)}
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: ${severityColors.bg}; border-top: 1px solid ${severityColors.border}; padding: 24px 32px; text-align: center;">
              <p style="color: ${severityColors.text}; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">Take immediate action if this appears to be a genuine attack.</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated security alert from your portfolio threat detection system.</p>
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
        from: "Security Alert <onboarding@resend.dev>",
        to: ["ritvik.indupuri@gmail.com"],
        subject: `Security Alert: ${getSeverityLabel(highestSeverity)} - ${threats[0]?.technique_name || 'Threat Detected'} from ${attacker_ip}`,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Threat alert email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-threat-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);