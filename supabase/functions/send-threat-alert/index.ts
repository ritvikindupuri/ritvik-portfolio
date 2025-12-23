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

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f97316';
    case 'low': return '#eab308';
    default: return '#6b7280';
  }
};

const getSeverityEmoji = (severity: string): string => {
  switch (severity) {
    case 'high': return '🚨';
    case 'medium': return '⚠️';
    case 'low': return '📋';
    default: return '📌';
  }
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

    // Build login attempt log
    const loginLog = login_attempts.map(attempt => {
      const time = new Date(attempt.timestamp).toLocaleString();
      const status = attempt.success 
        ? '<span style="color: #22c55e;">✓ SUCCESS</span>' 
        : '<span style="color: #ef4444;">✗ FAILED</span>';
      const reason = attempt.failure_reason ? ` - ${sanitizeHtml(attempt.failure_reason)}` : '';
      const browser = attempt.user_agent ? ` (${sanitizeHtml(attempt.user_agent.substring(0, 50))}...)` : '';
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #252542;">${time}</td>
          <td style="padding: 8px; border-bottom: 1px solid #252542;">${status}${reason}</td>
          <td style="padding: 8px; border-bottom: 1px solid #252542; font-size: 11px;">${browser}</td>
        </tr>
      `;
    }).join('\n');

    // Build threat cards
    const threatCards = threats.map(threat => {
      const baseId = threat.technique_id.split('.')[0];
      const remediation = REMEDIATION_STEPS[threat.technique_id] || REMEDIATION_STEPS[baseId] || [];
      return `
        <div style="background: #1a1a2e; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid ${getSeverityColor(threat.severity)};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: #fff; margin: 0;">${getSeverityEmoji(threat.severity)} ${sanitizeHtml(threat.technique_name)}</h3>
            <span style="background: ${getSeverityColor(threat.severity)}20; color: ${getSeverityColor(threat.severity)}; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase;">
              ${sanitizeHtml(threat.severity)}
            </span>
          </div>
          
          <div style="margin-bottom: 10px;">
            <span style="color: #888; font-size: 12px;">MITRE ATT&CK ID:</span>
            <span style="color: #00d4ff; font-family: monospace;"> ${sanitizeHtml(threat.technique_id)}</span>
            <span style="color: #888; margin-left: 10px; font-size: 12px;">Tactic:</span>
            <span style="color: #f97316;"> ${sanitizeHtml(threat.tactic)}</span>
          </div>
          
          <p style="color: #ccc; font-size: 14px; margin: 10px 0;">${sanitizeHtml(threat.description)}</p>
          
          <div style="margin: 10px 0;">
            <span style="color: #888; font-size: 12px;">Confidence Score:</span>
            <div style="background: #252542; border-radius: 10px; height: 10px; margin-top: 5px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, ${getSeverityColor(threat.severity)}, ${getSeverityColor(threat.severity)}80); height: 100%; width: ${threat.confidence * 100}%;"></div>
            </div>
            <span style="color: #fff; font-size: 12px;">${Math.round(threat.confidence * 100)}%</span>
          </div>
          
          <div style="margin-top: 15px;">
            <h4 style="color: #00d4ff; margin: 0 0 8px 0; font-size: 13px;">📋 Evidence</h4>
            <ul style="color: #ccc; margin: 0; padding-left: 20px; font-size: 13px;">
              ${threat.evidence.map(e => `<li style="margin: 4px 0;">${sanitizeHtml(e)}</li>`).join('')}
            </ul>
          </div>
          
          <div style="margin-top: 15px; background: #252542; border-radius: 6px; padding: 12px;">
            <h4 style="color: #22c55e; margin: 0 0 8px 0; font-size: 13px;">🛡️ Remediation Steps</h4>
            <ol style="color: #ccc; margin: 0; padding-left: 20px; font-size: 13px;">
              ${remediation.map(r => `<li style="margin: 4px 0;">${sanitizeHtml(r)}</li>`).join('')}
            </ol>
          </div>
        </div>
      `;
    }).join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #e0e0e0; padding: 20px; margin: 0; }
            .container { max-width: 700px; margin: 0 auto; background: #16162a; border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${getSeverityColor(highestSeverity)}; padding-bottom: 20px; }
            .header h1 { color: ${getSeverityColor(highestSeverity)}; margin: 0; }
            .badge { display: inline-block; background: ${getSeverityColor(highestSeverity)}20; color: ${getSeverityColor(highestSeverity)}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 10px; text-transform: uppercase; }
            .attacker-info { background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid ${getSeverityColor(highestSeverity)}40; }
            .attacker-info h2 { color: #fff; margin: 0 0 15px 0; font-size: 18px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { padding: 10px; background: #252542; border-radius: 6px; }
            .info-label { color: #888; font-size: 12px; display: block; }
            .info-value { color: #fff; font-weight: 500; font-family: monospace; }
            .login-log { margin-top: 20px; }
            .login-log h3 { color: #00d4ff; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 10px 8px; background: #252542; color: #888; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #252542; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 SECURITY THREAT DETECTED</h1>
              <span class="badge">${sanitizeHtml(highestSeverity)} severity - ${threats.length} threat(s) identified</span>
            </div>
            
            <div class="attacker-info">
              <h2>👤 Attacker Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Email / Account</span>
                  <span class="info-value">${sanitizeHtml(attacker_email)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">IP Address</span>
                  <span class="info-value">${sanitizeHtml(attacker_ip)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Name (if known)</span>
                  <span class="info-value">${sanitizeHtml(attacker_name || 'Unknown')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Detection Time</span>
                  <span class="info-value">${new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="login-log">
              <h3>📜 Login Attempt Log</h3>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  ${loginLog || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #888;">No login attempts logged</td></tr>'}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 30px;">
              <h2 style="color: #fff; margin-bottom: 15px;">🎯 MITRE ATT&CK Threat Analysis</h2>
              ${threatCards}
            </div>

            <div style="margin-top: 30px; background: #1a1a2e; border-radius: 8px; padding: 20px;">
              <h3 style="color: #fff; margin: 0 0 15px 0;">📚 Reference Links</h3>
              <ul style="color: #ccc; margin: 0; padding-left: 20px;">
                ${threats.map(t => `
                  <li style="margin: 8px 0;">
                    <a href="https://attack.mitre.org/techniques/${t.technique_id.replace('.', '/')}/" style="color: #00d4ff;" target="_blank">
                      ${sanitizeHtml(t.technique_id)} - ${sanitizeHtml(t.technique_name)} (MITRE ATT&CK)
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="footer">
              <p>⚡ This is an automated security alert from your portfolio threat detection system.</p>
              <p>Take immediate action if this appears to be a genuine attack.</p>
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
        subject: `🚨 THREAT ALERT: ${highestSeverity.toUpperCase()} - ${threats[0]?.technique_name || 'Security Breach'} from ${attacker_ip}`,
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