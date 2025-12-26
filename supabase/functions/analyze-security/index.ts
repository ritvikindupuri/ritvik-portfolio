import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAnalysisRequest {
  type: "security" | "visitor";
  saveHistory?: boolean;
  data: {
    loginAttempts?: {
      total: number;
      failed: number;
      successful: number;
      uniqueIPs: number;
      suspiciousIPs: number;
      recentFailedFromSameIP: number;
    };
    threats?: {
      count: number;
      highSeverity: number;
      techniques: string[];
    };
    visitors?: {
      totalSessions: number;
      totalActivities: number;
      chatbotQueries: number;
      resumeDownloads: number;
      projectClicks: number;
      avgSessionDuration: number;
      engagedVisitors: number;
      potentialRecruiters: number;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, saveHistory = true }: SecurityAnalysisRequest = await req.json();

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "security") {
      systemPrompt = `You are a cybersecurity analyst providing brief, actionable security assessments. 
Analyze the provided security metrics and respond with a JSON object containing:
1. riskScore: A number from 0-100 representing overall risk level
2. riskLevel: One of "low", "medium", "high", "critical"
3. summary: A 1-2 sentence summary of the security posture
4. factors: An array of 3-5 key factors contributing to the risk score
5. recommendation: A single actionable recommendation

Be concise and focus on the most important security implications.`;

      userPrompt = `Analyze these security metrics:
- Total login attempts: ${data.loginAttempts?.total || 0}
- Failed attempts: ${data.loginAttempts?.failed || 0}
- Successful attempts: ${data.loginAttempts?.successful || 0}
- Unique IP addresses: ${data.loginAttempts?.uniqueIPs || 0}
- Suspicious IPs (3+ failures): ${data.loginAttempts?.suspiciousIPs || 0}
- Recent failed attempts from same IP: ${data.loginAttempts?.recentFailedFromSameIP || 0}
- Active threats detected: ${data.threats?.count || 0}
- High severity threats: ${data.threats?.highSeverity || 0}
- MITRE techniques identified: ${data.threats?.techniques?.join(", ") || "None"}

Provide your analysis as a JSON object.`;
    } else {
      systemPrompt = `You are a visitor analytics expert providing insights about website engagement.
Analyze the provided visitor metrics and respond with a JSON object containing:
1. engagementScore: A number from 0-100 representing overall visitor engagement
2. engagementLevel: One of "low", "moderate", "good", "excellent"
3. summary: A 1-2 sentence summary of visitor engagement patterns
4. insights: An array of 3-4 key insights about visitor behavior
5. suggestion: A single suggestion to improve engagement

Be concise and focus on actionable insights.`;

      userPrompt = `Analyze these visitor metrics:
- Total unique sessions: ${data.visitors?.totalSessions || 0}
- Total activities: ${data.visitors?.totalActivities || 0}
- Chatbot queries: ${data.visitors?.chatbotQueries || 0}
- Resume downloads: ${data.visitors?.resumeDownloads || 0}
- Project clicks: ${data.visitors?.projectClicks || 0}
- Engaged visitors (3+ queries): ${data.visitors?.engagedVisitors || 0}
- Potential recruiters (downloaded resume): ${data.visitors?.potentialRecruiters || 0}

Provide your analysis as a JSON object.`;
    }

    console.log(`Analyzing ${type} data with google/gemini-2.5-pro...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from the response
    let analysisResult;
    try {
      // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```")) {
        // Remove opening code block (```json or ```)
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, "");
        // Remove closing code block
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, "");
      }
      
      // Try to extract JSON from the cleaned response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed AI response");
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 200));
      // Provide fallback response
      if (type === "security") {
        analysisResult = {
          riskScore: data.threats?.highSeverity ? 75 : (data.loginAttempts?.failed || 0) > 5 ? 50 : 25,
          riskLevel: data.threats?.highSeverity ? "high" : "medium",
          summary: "Unable to generate detailed analysis. Basic metrics indicate moderate security posture.",
          factors: ["Manual review recommended"],
          recommendation: "Review login attempt patterns manually."
        };
      } else {
        analysisResult = {
          engagementScore: 50,
          engagementLevel: "moderate",
          summary: "Unable to generate detailed analysis.",
          insights: ["Manual review recommended"],
          suggestion: "Review visitor patterns manually."
        };
      }
    }

    console.log(`${type} analysis complete:`, analysisResult);

    // Save security risk score to history if enabled and it's a security analysis
    if (type === "security" && saveHistory && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { error: insertError } = await supabase
          .from("risk_score_history")
          .insert({
            risk_score: analysisResult.riskScore,
            risk_level: analysisResult.riskLevel,
            summary: analysisResult.summary,
            factors: analysisResult.factors,
            recommendation: analysisResult.recommendation,
            login_attempts_total: data.loginAttempts?.total || 0,
            login_attempts_failed: data.loginAttempts?.failed || 0,
            threats_count: data.threats?.count || 0,
            threats_high_severity: data.threats?.highSeverity || 0,
          });

        if (insertError) {
          console.error("Failed to save risk score history:", insertError);
        } else {
          console.log("Risk score saved to history");
        }
      } catch (historyError) {
        console.error("Error saving risk score history:", historyError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in analyze-security function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
