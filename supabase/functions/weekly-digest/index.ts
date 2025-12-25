import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RiskScoreEntry {
  risk_score: number;
  risk_level: string;
  summary: string;
  created_at: string;
}

interface WeeklyDigestData {
  visitorStats: {
    totalSessions: number;
    totalActivities: number;
    chatbotQueries: number;
    resumeDownloads: number;
    resumeViews: number;
    projectClicks: number;
    sectionViews: number;
  };
  topQueries: { query: string; count: number }[];
  topSections: { section: string; count: number }[];
  topProjects: { project: string; count: number }[];
  securityStats: {
    totalLoginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueIPs: number;
    suspiciousIPs: string[];
  };
  riskScoreStats: {
    currentScore: number | null;
    currentLevel: string | null;
    weeklyAverage: number | null;
    trend: "improving" | "stable" | "declining" | null;
    trendPercentage: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    assessmentCount: number;
    latestSummary: string | null;
  };
  dateRange: { start: string; end: string };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Previous week for comparison
    const prevWeekEnd = new Date(startDate);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    console.log(`Generating weekly digest for ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch visitor activities
    const { data: activities, error: activitiesError } = await supabase
      .from("visitor_activity")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      throw activitiesError;
    }

    // Fetch login attempts
    const { data: loginAttempts, error: loginError } = await supabase
      .from("login_attempts")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (loginError) {
      console.error("Error fetching login attempts:", loginError);
      throw loginError;
    }

    // Fetch risk score history for this week
    const { data: riskScores, error: riskError } = await supabase
      .from("risk_score_history")
      .select("risk_score, risk_level, summary, created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (riskError) {
      console.error("Error fetching risk scores:", riskError);
      // Don't throw, just continue without risk data
    }

    // Fetch previous week's risk scores for trend comparison
    const { data: prevRiskScores } = await supabase
      .from("risk_score_history")
      .select("risk_score")
      .gte("created_at", prevWeekStart.toISOString())
      .lt("created_at", startDate.toISOString());

    // Process visitor stats
    const activityCounts: Record<string, number> = {};
    const queryCounts: Record<string, number> = {};
    const sectionCounts: Record<string, number> = {};
    const projectCounts: Record<string, number> = {};
    const uniqueSessions = new Set<string>();

    (activities || []).forEach((a: any) => {
      uniqueSessions.add(a.session_id);
      activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;

      if (a.activity_type === "chatbot_query" && a.activity_data?.query) {
        const query = a.activity_data.query.toLowerCase().trim();
        queryCounts[query] = (queryCounts[query] || 0) + 1;
      }

      if (a.activity_type === "section_view" && a.activity_data?.section) {
        const section = a.activity_data.section;
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      }

      if (a.activity_type === "project_click" && a.activity_data?.project_name) {
        const project = a.activity_data.project_name;
        projectCounts[project] = (projectCounts[project] || 0) + 1;
      }
    });

    // Process security stats
    const uniqueIPs = new Set<string>();
    const ipFailCounts: Record<string, number> = {};
    let successCount = 0;
    let failCount = 0;

    (loginAttempts || []).forEach((attempt: any) => {
      if (attempt.ip_address) {
        uniqueIPs.add(attempt.ip_address);
        if (!attempt.success) {
          ipFailCounts[attempt.ip_address] = (ipFailCounts[attempt.ip_address] || 0) + 1;
        }
      }
      if (attempt.success) successCount++;
      else failCount++;
    });

    // Identify suspicious IPs (3+ failed attempts)
    const suspiciousIPs = Object.entries(ipFailCounts)
      .filter(([_, count]) => count >= 3)
      .map(([ip]) => ip);

    // Process risk score statistics
    const typedRiskScores = (riskScores || []) as RiskScoreEntry[];
    const typedPrevRiskScores = (prevRiskScores || []) as { risk_score: number }[];
    
    let riskScoreStats: WeeklyDigestData["riskScoreStats"] = {
      currentScore: null,
      currentLevel: null,
      weeklyAverage: null,
      trend: null,
      trendPercentage: null,
      highestScore: null,
      lowestScore: null,
      assessmentCount: typedRiskScores.length,
      latestSummary: null,
    };

    if (typedRiskScores.length > 0) {
      const scores = typedRiskScores.map(r => r.risk_score);
      const latestEntry = typedRiskScores[typedRiskScores.length - 1];
      
      riskScoreStats.currentScore = latestEntry.risk_score;
      riskScoreStats.currentLevel = latestEntry.risk_level;
      riskScoreStats.latestSummary = latestEntry.summary;
      riskScoreStats.weeklyAverage = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      riskScoreStats.highestScore = Math.max(...scores);
      riskScoreStats.lowestScore = Math.min(...scores);

      // Calculate trend compared to previous week
      if (typedPrevRiskScores.length > 0) {
        const prevAverage = typedPrevRiskScores.reduce((a, b) => a + b.risk_score, 0) / typedPrevRiskScores.length;
        const currentAverage = riskScoreStats.weeklyAverage;
        const diff = currentAverage - prevAverage;
        riskScoreStats.trendPercentage = Math.round(Math.abs(diff));
        
        if (diff > 5) {
          riskScoreStats.trend = "declining"; // Higher score = worse security
        } else if (diff < -5) {
          riskScoreStats.trend = "improving"; // Lower score = better security
        } else {
          riskScoreStats.trend = "stable";
        }
      }
    }

    // Prepare digest data
    const digestData: WeeklyDigestData = {
      visitorStats: {
        totalSessions: uniqueSessions.size,
        totalActivities: activities?.length || 0,
        chatbotQueries: activityCounts["chatbot_query"] || 0,
        resumeDownloads: activityCounts["resume_download"] || 0,
        resumeViews: activityCounts["resume_view"] || 0,
        projectClicks: activityCounts["project_click"] || 0,
        sectionViews: activityCounts["section_view"] || 0,
      },
      topQueries: Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([query, count]) => ({ query, count })),
      topSections: Object.entries(sectionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([section, count]) => ({ section, count })),
      topProjects: Object.entries(projectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([project, count]) => ({ project, count })),
      securityStats: {
        totalLoginAttempts: loginAttempts?.length || 0,
        successfulLogins: successCount,
        failedLogins: failCount,
        uniqueIPs: uniqueIPs.size,
        suspiciousIPs,
      },
      riskScoreStats,
      dateRange: {
        start: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        end: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    };

    // Generate email HTML
    const emailHtml = generateEmailHtml(digestData);

    // Send email
    const ownerEmail = "ritvik.indupuri@gmail.com";
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Portfolio Weekly Digest <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `Portfolio Weekly Digest: ${digestData.dateRange.start} - ${digestData.dateRange.end}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Weekly digest sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly digest sent successfully",
        digestData 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in weekly-digest function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getRiskColor(score: number | null): string {
  if (score === null) return "#666";
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f97316";
  if (score >= 25) return "#eab308";
  return "#22c55e";
}

function getTrendIcon(trend: string | null): string {
  switch (trend) {
    case "improving": return "📉";
    case "declining": return "📈";
    case "stable": return "➡️";
    default: return "❓";
  }
}

function getTrendText(trend: string | null, percentage: number | null): string {
  if (!trend || percentage === null) return "No previous data";
  switch (trend) {
    case "improving": return `↓ ${percentage} points better than last week`;
    case "declining": return `↑ ${percentage} points worse than last week`;
    case "stable": return "Stable compared to last week";
    default: return "";
  }
}

function generateEmailHtml(data: WeeklyDigestData): string {
  const { visitorStats, topQueries, topSections, topProjects, securityStats, riskScoreStats, dateRange } = data;

  const hasSuspiciousActivity = securityStats.suspiciousIPs.length > 0;
  const hasRiskData = riskScoreStats.assessmentCount > 0;
  const riskColor = getRiskColor(riskScoreStats.currentScore);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portfolio Weekly Digest</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00d4ff 0%, #0891b2 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #0a0a0f; margin: 0; font-size: 28px; font-weight: 700;">📊 Portfolio Weekly Digest</h1>
          <p style="color: #0a0a0f; margin: 10px 0 0; opacity: 0.8;">${dateRange.start} - ${dateRange.end}</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: #1a1a2e; padding: 30px; border-radius: 0 0 16px 16px;">
          
          <!-- AI Risk Score Summary -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #a855f7; margin: 0 0 20px; font-size: 18px;">
              🤖 AI Security Risk Analysis
            </h2>
            ${hasRiskData ? `
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(${riskScoreStats.currentScore && riskScoreStats.currentScore >= 50 ? '239, 68, 68' : '34, 197, 94'}, 0.1) 100%); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 15px;">
                <div style="position: relative; width: 80px; height: 80px;">
                  <svg viewBox="0 0 100 100" style="width: 80px; height: 80px; transform: rotate(-90deg);">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="${riskColor}" stroke-width="8" stroke-dasharray="${(riskScoreStats.currentScore || 0) * 2.51} 251" stroke-linecap="round"/>
                  </svg>
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="color: ${riskColor}; font-size: 24px; font-weight: 700;">${riskScoreStats.currentScore}</span>
                    <span style="color: #666; font-size: 10px;">RISK</span>
                  </div>
                </div>
                <div style="flex: 1;">
                  <div style="color: ${riskColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">
                    ${riskScoreStats.currentLevel} RISK
                  </div>
                  <div style="color: #c0c0c0; font-size: 12px; line-height: 1.4;">
                    ${riskScoreStats.latestSummary || 'No summary available'}
                  </div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                  <div style="color: #a855f7; font-size: 18px; font-weight: 600;">${riskScoreStats.weeklyAverage}</div>
                  <div style="color: #888; font-size: 10px;">Avg Score</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                  <div style="color: #22c55e; font-size: 18px; font-weight: 600;">${riskScoreStats.lowestScore}</div>
                  <div style="color: #888; font-size: 10px;">Lowest</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                  <div style="color: #ef4444; font-size: 18px; font-weight: 600;">${riskScoreStats.highestScore}</div>
                  <div style="color: #888; font-size: 10px;">Highest</div>
                </div>
              </div>
              
              <div style="border-top: 1px solid rgba(168, 85, 247, 0.2); padding-top: 12px;">
                <div style="color: #c0c0c0; font-size: 12px; display: flex; align-items: center; gap: 8px;">
                  <span>${getTrendIcon(riskScoreStats.trend)}</span>
                  <span style="color: ${riskScoreStats.trend === 'improving' ? '#22c55e' : riskScoreStats.trend === 'declining' ? '#ef4444' : '#eab308'};">
                    ${getTrendText(riskScoreStats.trend, riskScoreStats.trendPercentage)}
                  </span>
                </div>
                <div style="color: #666; font-size: 11px; margin-top: 5px;">
                  Based on ${riskScoreStats.assessmentCount} AI assessments this week • Powered by Google Gemini 2.5 Pro
                </div>
              </div>
            </div>
            ` : `
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center;">
              <div style="color: #888; font-size: 14px;">No AI risk assessments recorded this week</div>
              <div style="color: #666; font-size: 12px; margin-top: 5px;">Visit the Security tab in your dashboard to generate risk analysis</div>
            </div>
            `}
          </div>

          <!-- Visitor Overview -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #00d4ff; margin: 0 0 20px; font-size: 18px; display: flex; align-items: center;">
              👥 Visitor Overview
            </h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="color: #00d4ff; font-size: 32px; font-weight: 700;">${visitorStats.totalSessions}</div>
                <div style="color: #a0a0a0; font-size: 12px; margin-top: 5px;">Unique Visitors</div>
              </div>
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="color: #22c55e; font-size: 32px; font-weight: 700;">${visitorStats.totalActivities}</div>
                <div style="color: #a0a0a0; font-size: 12px; margin-top: 5px;">Total Actions</div>
              </div>
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="color: #3b82f6; font-size: 32px; font-weight: 700;">${visitorStats.chatbotQueries}</div>
                <div style="color: #a0a0a0; font-size: 12px; margin-top: 5px;">Chatbot Queries</div>
              </div>
              <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="color: #f97316; font-size: 32px; font-weight: 700;">${visitorStats.resumeDownloads}</div>
                <div style="color: #a0a0a0; font-size: 12px; margin-top: 5px;">Resume Downloads</div>
              </div>
            </div>
          </div>

          <!-- Top Chatbot Queries -->
          ${topQueries.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #00d4ff; margin: 0 0 15px; font-size: 18px;">💬 Top Chatbot Questions</h2>
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden;">
              ${topQueries.map((q, i) => `
                <div style="padding: 12px 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); ${i === topQueries.length - 1 ? 'border-bottom: none;' : ''}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #e0e0e0; font-size: 14px; text-transform: capitalize;">${q.query.substring(0, 50)}${q.query.length > 50 ? '...' : ''}</span>
                    <span style="background: #00d4ff; color: #0a0a0f; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;">${q.count}x</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Top Sections & Projects -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
            ${topSections.length > 0 ? `
            <div>
              <h3 style="color: #a855f7; margin: 0 0 10px; font-size: 14px;">📍 Top Sections</h3>
              ${topSections.map(s => `
                <div style="color: #c0c0c0; font-size: 12px; padding: 5px 0; display: flex; justify-content: space-between;">
                  <span>${s.section}</span>
                  <span style="color: #a855f7;">${s.count}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
            ${topProjects.length > 0 ? `
            <div>
              <h3 style="color: #22c55e; margin: 0 0 10px; font-size: 14px;">🔗 Top Projects</h3>
              ${topProjects.map(p => `
                <div style="color: #c0c0c0; font-size: 12px; padding: 5px 0; display: flex; justify-content: space-between;">
                  <span>${p.project.substring(0, 20)}${p.project.length > 20 ? '...' : ''}</span>
                  <span style="color: #22c55e;">${p.count}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <!-- Security Overview -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: ${hasSuspiciousActivity ? '#ef4444' : '#00d4ff'}; margin: 0 0 15px; font-size: 18px;">
              🛡️ Security Overview ${hasSuspiciousActivity ? '⚠️' : ''}
            </h2>
            <div style="background: ${hasSuspiciousActivity ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; border: 1px solid ${hasSuspiciousActivity ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}; border-radius: 12px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                  <div style="color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Login Attempts</div>
                  <div style="color: #e0e0e0; font-size: 24px; font-weight: 600;">${securityStats.totalLoginAttempts}</div>
                </div>
                <div>
                  <div style="color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Unique IPs</div>
                  <div style="color: #e0e0e0; font-size: 24px; font-weight: 600;">${securityStats.uniqueIPs}</div>
                </div>
                <div>
                  <div style="color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Successful</div>
                  <div style="color: #22c55e; font-size: 24px; font-weight: 600;">${securityStats.successfulLogins}</div>
                </div>
                <div>
                  <div style="color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Failed</div>
                  <div style="color: #ef4444; font-size: 24px; font-weight: 600;">${securityStats.failedLogins}</div>
                </div>
              </div>
              ${hasSuspiciousActivity ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(239, 68, 68, 0.3);">
                <div style="color: #ef4444; font-size: 12px; font-weight: 600; margin-bottom: 8px;">⚠️ Suspicious IPs Detected:</div>
                <div style="color: #c0c0c0; font-size: 12px; font-family: monospace;">
                  ${securityStats.suspiciousIPs.join(', ')}
                </div>
              </div>
              ` : `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(34, 197, 94, 0.3);">
                <div style="color: #22c55e; font-size: 12px;">✅ No suspicious activity detected this week</div>
              </div>
              `}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #666;">
          <p style="margin: 0; font-size: 12px;">This is an automated weekly digest from your portfolio.</p>
          <p style="margin: 5px 0 0; font-size: 12px;">View full analytics at your dashboard.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

serve(handler);
