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
    geoBlockedCount: number;
    honeypotTriggers: number;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

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
    }

    // Fetch previous week's risk scores for trend comparison
    const { data: prevRiskScores } = await supabase
      .from("risk_score_history")
      .select("risk_score")
      .gte("created_at", prevWeekStart.toISOString())
      .lt("created_at", startDate.toISOString());

    // Count geo-blocked and honeypot triggers
    let geoBlockedCount = 0;
    let honeypotTriggers = 0;
    (loginAttempts || []).forEach((attempt: any) => {
      if (attempt.failure_reason?.includes('Geographic block')) geoBlockedCount++;
      if (attempt.failure_reason?.includes('Honeypot')) honeypotTriggers++;
    });

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

      if (typedPrevRiskScores.length > 0) {
        const prevAverage = typedPrevRiskScores.reduce((a, b) => a + b.risk_score, 0) / typedPrevRiskScores.length;
        const currentAverage = riskScoreStats.weeklyAverage;
        const diff = currentAverage - prevAverage;
        riskScoreStats.trendPercentage = Math.round(Math.abs(diff));
        
        if (diff > 5) {
          riskScoreStats.trend = "declining";
        } else if (diff < -5) {
          riskScoreStats.trend = "improving";
        } else {
          riskScoreStats.trend = "stable";
        }
      }
    }

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
        geoBlockedCount,
        honeypotTriggers,
      },
      riskScoreStats,
      dateRange: {
        start: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        end: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    };

    const emailHtml = generateEmailHtml(digestData);

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

function getRiskLevelDescription(level: string | null): string {
  switch (level?.toLowerCase()) {
    case "critical": return "Immediate action required - active threats detected";
    case "high": return "Significant security concerns requiring attention";
    case "medium": return "Moderate risk - monitor closely";
    case "low": return "Normal security posture";
    default: return "Unable to determine risk level";
  }
}

function getTrendDescription(trend: string | null, percentage: number | null): string {
  if (!trend || percentage === null) return "No previous week data available for comparison";
  switch (trend) {
    case "improving": return `Security improved by ${percentage} points compared to last week. Lower scores indicate better security.`;
    case "declining": return `Security declined by ${percentage} points compared to last week. Higher scores indicate more risk.`;
    case "stable": return "Security posture remained stable compared to last week.";
    default: return "";
  }
}

function generateEmailHtml(data: WeeklyDigestData): string {
  const { visitorStats, topQueries, topSections, topProjects, securityStats, riskScoreStats, dateRange } = data;

  const hasSuspiciousActivity = securityStats.suspiciousIPs.length > 0 || securityStats.geoBlockedCount > 0 || securityStats.honeypotTriggers > 0;
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
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Portfolio Weekly Digest</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">${dateRange.start} - ${dateRange.end}</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          
          <!-- AI Risk Score Summary -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #111827; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              AI Security Risk Analysis
            </h2>
            ${hasRiskData ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
              <div style="display: flex; align-items: flex-start; gap: 20px; margin-bottom: 15px;">
                <div style="text-align: center; min-width: 80px;">
                  <div style="font-size: 48px; font-weight: 700; color: ${riskColor};">${riskScoreStats.currentScore}</div>
                  <div style="font-size: 12px; color: ${riskColor}; font-weight: 600; text-transform: uppercase;">${riskScoreStats.currentLevel} Risk</div>
                </div>
                <div style="flex: 1; border-left: 1px solid #e5e7eb; padding-left: 20px;">
                  <div style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                    ${riskScoreStats.latestSummary || 'No summary available'}
                  </div>
                  <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #6b7280;">
                    <strong>What this means:</strong> ${getRiskLevelDescription(riskScoreStats.currentLevel)}
                  </div>
                </div>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 10px; text-align: center; background: #f3f4f6; border-radius: 6px 0 0 6px;">
                    <div style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Weekly Avg</div>
                    <div style="color: #111827; font-size: 20px; font-weight: 600;">${riskScoreStats.weeklyAverage}</div>
                    <div style="color: #9ca3af; font-size: 10px;">Average of ${riskScoreStats.assessmentCount} assessments</div>
                  </td>
                  <td style="padding: 10px; text-align: center; background: #f3f4f6;">
                    <div style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Best Score</div>
                    <div style="color: #22c55e; font-size: 20px; font-weight: 600;">${riskScoreStats.lowestScore}</div>
                    <div style="color: #9ca3af; font-size: 10px;">Lower is better (less risk)</div>
                  </td>
                  <td style="padding: 10px; text-align: center; background: #f3f4f6; border-radius: 0 6px 6px 0;">
                    <div style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Worst Score</div>
                    <div style="color: #ef4444; font-size: 20px; font-weight: 600;">${riskScoreStats.highestScore}</div>
                    <div style="color: #9ca3af; font-size: 10px;">Higher means more risk</div>
                  </td>
                </tr>
              </table>
              
              <div style="background: ${riskScoreStats.trend === 'improving' ? '#f0fdf4' : riskScoreStats.trend === 'declining' ? '#fef2f2' : '#fefce8'}; border: 1px solid ${riskScoreStats.trend === 'improving' ? '#bbf7d0' : riskScoreStats.trend === 'declining' ? '#fecaca' : '#fef08a'}; border-radius: 6px; padding: 12px;">
                <div style="color: ${riskScoreStats.trend === 'improving' ? '#166534' : riskScoreStats.trend === 'declining' ? '#dc2626' : '#854d0e'}; font-size: 13px; font-weight: 500;">
                  ${riskScoreStats.trend === 'improving' ? 'Improving' : riskScoreStats.trend === 'declining' ? 'Declining' : 'Stable'} 
                  ${riskScoreStats.trendPercentage ? `(${riskScoreStats.trendPercentage} points)` : ''}
                </div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
                  ${getTrendDescription(riskScoreStats.trend, riskScoreStats.trendPercentage)}
                </div>
              </div>
              
              <div style="margin-top: 12px; color: #9ca3af; font-size: 11px; text-align: center;">
                Powered by Google Gemini 2.5 Pro
              </div>
            </div>
            ` : `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
              <div style="color: #6b7280; font-size: 14px;">No AI risk assessments recorded this week</div>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 5px;">Visit the Security tab in your dashboard to generate risk analysis</div>
            </div>
            `}
          </div>

          <!-- Visitor Overview -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #111827; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Visitor Overview
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 15px; text-align: center; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px;">
                  <div style="color: #0d9488; font-size: 32px; font-weight: 700;">${visitorStats.totalSessions}</div>
                  <div style="color: #5eead4; font-size: 12px; margin-top: 5px;">Unique Visitors</div>
                  <div style="color: #99f6e4; font-size: 10px; margin-top: 2px;">Distinct browsing sessions this week</div>
                </td>
              </tr>
            </table>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 12px; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px 0 0 8px; width: 33%;">
                  <div style="color: #22c55e; font-size: 24px; font-weight: 700;">${visitorStats.totalActivities}</div>
                  <div style="color: #86efac; font-size: 11px;">Total Actions</div>
                  <div style="color: #bbf7d0; font-size: 9px;">Clicks, views, queries</div>
                </td>
                <td style="padding: 12px; text-align: center; background: #eff6ff; border: 1px solid #bfdbfe; width: 33%;">
                  <div style="color: #3b82f6; font-size: 24px; font-weight: 700;">${visitorStats.chatbotQueries}</div>
                  <div style="color: #93c5fd; font-size: 11px;">Chatbot Queries</div>
                  <div style="color: #bfdbfe; font-size: 9px;">AI assistant questions</div>
                </td>
                <td style="padding: 12px; text-align: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 0 8px 8px 0; width: 33%;">
                  <div style="color: #f97316; font-size: 24px; font-weight: 700;">${visitorStats.resumeDownloads}</div>
                  <div style="color: #fdba74; font-size: 11px;">Resume Downloads</div>
                  <div style="color: #fed7aa; font-size: 9px;">High-intent actions</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Top Chatbot Queries -->
          ${topQueries.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #111827; margin: 0 0 15px; font-size: 16px;">Top Chatbot Questions</h2>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${topQueries.map((q, i) => `
                <div style="padding: 12px 15px; border-bottom: ${i === topQueries.length - 1 ? 'none' : '1px solid #e5e7eb'};">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #374151; font-size: 13px;">${q.query.substring(0, 50)}${q.query.length > 50 ? '...' : ''}</span>
                    <span style="background: #0891b2; color: #ffffff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">${q.count}x</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Top Sections & Projects -->
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${topSections.length > 0 ? `
              <tr>
                <td style="vertical-align: top; padding-right: 10px; width: 50%;">
                  <h3 style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">Top Sections Viewed</h3>
                  ${topSections.map(s => `
                    <div style="color: #374151; font-size: 12px; padding: 5px 0; display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6;">
                      <span>${s.section}</span>
                      <span style="color: #6b7280; font-weight: 500;">${s.count} views</span>
                    </div>
                  `).join('')}
                </td>
                ${topProjects.length > 0 ? `
                <td style="vertical-align: top; padding-left: 10px; width: 50%; border-left: 1px solid #e5e7eb;">
                  <h3 style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">Top Projects Clicked</h3>
                  ${topProjects.map(p => `
                    <div style="color: #374151; font-size: 12px; padding: 5px 0; display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6;">
                      <span>${p.project.substring(0, 20)}${p.project.length > 20 ? '...' : ''}</span>
                      <span style="color: #6b7280; font-weight: 500;">${p.count} clicks</span>
                    </div>
                  `).join('')}
                </td>
                ` : ''}
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Security Overview -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: ${hasSuspiciousActivity ? '#dc2626' : '#111827'}; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid ${hasSuspiciousActivity ? '#fecaca' : '#e5e7eb'}; padding-bottom: 10px;">
              Security Overview ${hasSuspiciousActivity ? '- Attention Required' : ''}
            </h2>
            <div style="background: ${hasSuspiciousActivity ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${hasSuspiciousActivity ? '#fecaca' : '#bbf7d0'}; border-radius: 8px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; text-align: center; width: 25%;">
                    <div style="color: #6b7280; font-size: 10px; text-transform: uppercase;">Login Attempts</div>
                    <div style="color: #111827; font-size: 24px; font-weight: 600;">${securityStats.totalLoginAttempts}</div>
                    <div style="color: #9ca3af; font-size: 9px;">Total authentication requests</div>
                  </td>
                  <td style="padding: 10px; text-align: center; width: 25%;">
                    <div style="color: #6b7280; font-size: 10px; text-transform: uppercase;">Unique IPs</div>
                    <div style="color: #111827; font-size: 24px; font-weight: 600;">${securityStats.uniqueIPs}</div>
                    <div style="color: #9ca3af; font-size: 9px;">Distinct source addresses</div>
                  </td>
                  <td style="padding: 10px; text-align: center; width: 25%;">
                    <div style="color: #6b7280; font-size: 10px; text-transform: uppercase;">Successful</div>
                    <div style="color: #22c55e; font-size: 24px; font-weight: 600;">${securityStats.successfulLogins}</div>
                    <div style="color: #9ca3af; font-size: 9px;">Legitimate logins</div>
                  </td>
                  <td style="padding: 10px; text-align: center; width: 25%;">
                    <div style="color: #6b7280; font-size: 10px; text-transform: uppercase;">Failed</div>
                    <div style="color: #ef4444; font-size: 24px; font-weight: 600;">${securityStats.failedLogins}</div>
                    <div style="color: #9ca3af; font-size: 9px;">Rejected attempts</div>
                  </td>
                </tr>
              </table>
              
              ${securityStats.geoBlockedCount > 0 || securityStats.honeypotTriggers > 0 ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${hasSuspiciousActivity ? '#fecaca' : '#bbf7d0'};">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    ${securityStats.geoBlockedCount > 0 ? `
                    <td style="padding: 8px; text-align: center;">
                      <div style="color: #dc2626; font-size: 18px; font-weight: 600;">${securityStats.geoBlockedCount}</div>
                      <div style="color: #ef4444; font-size: 11px;">Geographic Blocks</div>
                      <div style="color: #fca5a5; font-size: 9px;">Logins blocked by country rules</div>
                    </td>
                    ` : ''}
                    ${securityStats.honeypotTriggers > 0 ? `
                    <td style="padding: 8px; text-align: center;">
                      <div style="color: #7c3aed; font-size: 18px; font-weight: 600;">${securityStats.honeypotTriggers}</div>
                      <div style="color: #8b5cf6; font-size: 11px;">Honeypot Triggers</div>
                      <div style="color: #c4b5fd; font-size: 9px;">Attackers caught by decoy accounts</div>
                    </td>
                    ` : ''}
                  </tr>
                </table>
              </div>
              ` : ''}
              
              ${hasSuspiciousActivity && securityStats.suspiciousIPs.length > 0 ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fecaca;">
                <div style="color: #dc2626; font-size: 12px; font-weight: 600; margin-bottom: 8px;">Suspicious IPs (3+ failed attempts):</div>
                <div style="color: #7f1d1d; font-size: 12px; font-family: monospace; background: #fee2e2; padding: 8px; border-radius: 4px;">
                  ${securityStats.suspiciousIPs.join(', ')}
                </div>
                <div style="color: #9ca3af; font-size: 10px; margin-top: 6px;">These IPs had multiple failed login attempts this week</div>
              </div>
              ` : `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #bbf7d0;">
                <div style="color: #166534; font-size: 12px;">No suspicious IP activity detected this week</div>
              </div>
              `}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280;">
          <p style="margin: 0; font-size: 12px;">This is an automated weekly digest from your portfolio.</p>
          <p style="margin: 5px 0 0; font-size: 12px;">View full analytics at your dashboard.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

serve(handler);
