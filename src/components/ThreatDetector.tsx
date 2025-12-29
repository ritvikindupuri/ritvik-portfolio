import { useMemo, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Target, Info, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// MITRE ATT&CK Technique Mapping for Authentication Attacks
const MITRE_TECHNIQUES = {
  T1110: {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
    description: "Adversary attempts to gain access by systematically guessing passwords.",
    indicators: ["Multiple failed login attempts from same IP", "Rapid succession of attempts"],
    severity: "high",
    color: "red"
  },
  T1110_001: {
    id: "T1110.001",
    name: "Password Guessing",
    tactic: "Credential Access",
    description: "Attempting to access accounts using common passwords or variations.",
    indicators: ["Failed attempts with different passwords", "Common password patterns"],
    severity: "high",
    color: "red"
  },
  T1110_003: {
    id: "T1110.003",
    name: "Password Spraying",
    tactic: "Credential Access",
    description: "Single password against many accounts to avoid lockouts.",
    indicators: ["Same failure pattern across accounts", "Low volume per account"],
    severity: "medium",
    color: "orange"
  },
  T1078: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Defense Evasion",
    description: "Adversaries may obtain and use credentials of existing accounts.",
    indicators: ["Login from unusual location", "Login at unusual time"],
    severity: "medium",
    color: "orange"
  },
  T1090: {
    id: "T1090",
    name: "Proxy",
    tactic: "Command and Control",
    description: "Using proxies to disguise source of malicious traffic.",
    indicators: ["Known VPN/proxy IP ranges", "Tor exit nodes"],
    severity: "low",
    color: "yellow"
  },
  T1531: {
    id: "T1531",
    name: "Account Access Removal",
    tactic: "Impact",
    description: "Attempting to deny access by disrupting account availability.",
    indicators: ["Account lockout attempts", "Password reset flooding"],
    severity: "high",
    color: "red"
  }
};

// Confidence calculation explanations for each technique
const CONFIDENCE_EXPLANATIONS: Record<string, string> = {
  T1110: "Confidence = Base 50% + 10% per failed attempt in window (max 95%). More failures = higher confidence.",
  "T1110.001": "Confidence = Fixed 60% baseline when total failures meet threshold. Pattern matching adds certainty.",
  "T1110.003": "Confidence = Base 55% + 3% per distinct account + 1% per excess failure (max 85%). Spray pattern confirmation.",
  T1078: "Confidence = Fixed 50% baseline. Multiple login locations suggest credential reuse or compromise.",
  T1090: "Confidence = Variable based on proxy detection signals.",
  T1531: "Confidence = Based on lockout attempt frequency and pattern."
};

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface DetectedThreat {
  technique: typeof MITRE_TECHNIQUES[keyof typeof MITRE_TECHNIQUES];
  confidence: number;
  confidenceExplanation: string;
  evidence: string[];
  affectedIps: string[];
  timestamp: string;
}

interface ThreatDetectorProps {
  loginAttempts: LoginAttempt[];
}

interface ThreatSettings {
  brute_force_window_minutes: number;
  brute_force_min_failures: number;
  password_guessing_min_failures: number;
  spray_window_minutes: number;
  spray_min_distinct_accounts: number;
  spray_min_total_failures: number;
  spray_max_failures_per_account: number;
  valid_accounts_min_locations: number;
}

const DEFAULT_SETTINGS: ThreatSettings = {
  brute_force_window_minutes: 60,
  brute_force_min_failures: 5,
  password_guessing_min_failures: 3,
  spray_window_minutes: 30,
  spray_min_distinct_accounts: 5,
  spray_min_total_failures: 8,
  spray_max_failures_per_account: 2,
  valid_accounts_min_locations: 3,
};

export const ThreatDetector = ({ loginAttempts }: ThreatDetectorProps) => {
  const alertSentRef = useRef<Set<string>>(new Set());
  const [settings, setSettings] = useState<ThreatSettings>(DEFAULT_SETTINGS);

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('threat_detection_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setSettings({
            brute_force_window_minutes: data.brute_force_window_minutes,
            brute_force_min_failures: data.brute_force_min_failures,
            password_guessing_min_failures: data.password_guessing_min_failures,
            spray_window_minutes: data.spray_window_minutes,
            spray_min_distinct_accounts: data.spray_min_distinct_accounts,
            spray_min_total_failures: data.spray_min_total_failures,
            spray_max_failures_per_account: data.spray_max_failures_per_account,
            valid_accounts_min_locations: data.valid_accounts_min_locations,
          });
        }
      } catch (err) {
        console.error('Error fetching threat settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const detectedThreats = useMemo(() => {
    const threats: DetectedThreat[] = [];
    const now = new Date();

    // Group attempts by IP
    const ipAttempts: Record<string, LoginAttempt[]> = {};
    loginAttempts.forEach(attempt => {
      if (attempt.ip_address) {
        if (!ipAttempts[attempt.ip_address]) {
          ipAttempts[attempt.ip_address] = [];
        }
        ipAttempts[attempt.ip_address].push(attempt);
      }
    });

    const bruteForceWindowMs = settings.brute_force_window_minutes * 60 * 1000;

    // Detect Brute Force (T1110) - Multiple failed attempts from same IP
    Object.entries(ipAttempts).forEach(([ip, attempts]) => {
      const failedAttempts = attempts.filter(a => !a.success);
      const recentFailed = failedAttempts.filter(a => {
        const attemptTime = new Date(a.created_at);
        return (now.getTime() - attemptTime.getTime()) < bruteForceWindowMs;
      });

      if (recentFailed.length >= settings.brute_force_min_failures) {
        const confidence = Math.min(0.95, 0.5 + (recentFailed.length * 0.1));
        threats.push({
          technique: MITRE_TECHNIQUES.T1110,
          confidence,
          confidenceExplanation: `Base 50% + (${recentFailed.length} failures × 10%) = ${Math.round(confidence * 100)}% (capped at 95%)`,
          evidence: [
            `${recentFailed.length} failed attempts in last ${settings.brute_force_window_minutes} minutes`,
            `Target emails: ${[...new Set(recentFailed.map(a => a.email))].join(", ")}`
          ],
          affectedIps: [ip],
          timestamp: recentFailed[0]?.created_at || now.toISOString()
        });
      }
      
      // Password Guessing (T1110.001) - More restrictive to avoid false positives
      // Requires: multiple failed attempts within the same window as brute force
      // AND must have at least 2 unique failed attempt timestamps (not just a single login retry)
      const recentGuessing = failedAttempts.filter(a => {
        const attemptTime = new Date(a.created_at);
        return (now.getTime() - attemptTime.getTime()) < bruteForceWindowMs;
      });
      
      // Get unique timestamps (rounded to minute) to distinguish real attack patterns
      const uniqueTimestamps = new Set(
        recentGuessing.map(a => Math.floor(new Date(a.created_at).getTime() / 60000))
      );
      
      // Only flag as password guessing if:
      // 1. Met minimum failures threshold
      // 2. Failures occurred across multiple distinct minutes (not a single rapid retry)
      // 3. Didn't already get flagged as brute force (less failures but still suspicious)
      if (
        recentGuessing.length >= settings.password_guessing_min_failures &&
        recentGuessing.length < settings.brute_force_min_failures &&
        uniqueTimestamps.size >= 2
      ) {
        threats.push({
          technique: MITRE_TECHNIQUES.T1110_001,
          confidence: 0.6,
          confidenceExplanation: `Fixed 60% baseline when ≥${settings.password_guessing_min_failures} failures across ${uniqueTimestamps.size} distinct attempts`,
          evidence: [
            `${recentGuessing.length} failed attempts in last ${settings.brute_force_window_minutes} minutes`,
            `${uniqueTimestamps.size} distinct attempt timeframes detected`,
            `Pattern suggests methodical password guessing`
          ],
          affectedIps: [ip],
          timestamp: recentGuessing[0]?.created_at || now.toISOString()
        });
      }
    });

    // Detect Password Spraying (T1110.003)
    const sprayWindowMs = settings.spray_window_minutes * 60 * 1000;

    const recentFailed = loginAttempts.filter(a => {
      if (a.success) return false;
      if (!a.ip_address) return false;
      const t = new Date(a.created_at).getTime();
      return (now.getTime() - t) < sprayWindowMs;
    });

    const failedByIp: Record<string, LoginAttempt[]> = {};
    recentFailed.forEach(a => {
      const ip = a.ip_address!;
      if (!failedByIp[ip]) failedByIp[ip] = [];
      failedByIp[ip].push(a);
    });

    Object.entries(failedByIp).forEach(([ip, attempts]) => {
      const byEmail: Record<string, number> = {};
      attempts.forEach(a => {
        byEmail[a.email] = (byEmail[a.email] || 0) + 1;
      });

      const distinctAccounts = Object.keys(byEmail).length;
      const totalFailures = attempts.length;
      const maxFailuresPerAccount = Math.max(0, ...Object.values(byEmail));

      if (
        distinctAccounts >= settings.spray_min_distinct_accounts &&
        totalFailures >= settings.spray_min_total_failures &&
        maxFailuresPerAccount <= settings.spray_max_failures_per_account
      ) {
        const sampleAccounts = Object.keys(byEmail).slice(0, 5);
        const excessFailures = totalFailures - settings.spray_min_total_failures;
        const confidence = Math.min(0.85, 0.55 + distinctAccounts * 0.03 + excessFailures * 0.01);

        threats.push({
          technique: MITRE_TECHNIQUES.T1110_003,
          confidence,
          confidenceExplanation: `Base 55% + (${distinctAccounts} accounts × 3%) + (${excessFailures} excess failures × 1%) = ${Math.round(confidence * 100)}% (capped at 85%)`,
          evidence: [
            `${totalFailures} failed attempts in last ${settings.spray_window_minutes} minutes from one IP`,
            `${distinctAccounts} distinct target accounts (≤${settings.spray_max_failures_per_account} attempts/account)`,
            `Source IP: ${ip}`,
            `Sample targets: ${sampleAccounts.join(", ")}${distinctAccounts > sampleAccounts.length ? "…" : ""}`
          ],
          affectedIps: [ip],
          timestamp: attempts[0]?.created_at || now.toISOString()
        });
      }
    });

    // Detect unusual login patterns (T1078)
    const successfulLogins = loginAttempts.filter(a => a.success);
    const uniqueSuccessIps = [...new Set(successfulLogins.map(a => a.ip_address).filter(Boolean))];
    if (uniqueSuccessIps.length >= settings.valid_accounts_min_locations) {
      threats.push({
        technique: MITRE_TECHNIQUES.T1078,
        confidence: 0.5,
        confidenceExplanation: `Fixed 50% baseline when ≥${settings.valid_accounts_min_locations} unique login locations detected`,
        evidence: [
          `Successful logins from ${uniqueSuccessIps.length} different locations`,
          `May indicate compromised credentials or legitimate travel`
        ],
        affectedIps: uniqueSuccessIps as string[],
        timestamp: successfulLogins[0]?.created_at || now.toISOString()
      });
    }

    return threats.sort((a, b) => b.confidence - a.confidence);
  }, [loginAttempts, settings]);

  // Send threat alert email when high-severity threats detected
  useEffect(() => {
    const highSeverityThreats = detectedThreats.filter(t => t.technique.severity === 'high' && t.confidence >= 0.6);
    
    if (highSeverityThreats.length === 0) return;

    // Create unique key for this threat combination
    const threatKey = highSeverityThreats.map(t => `${t.technique.id}-${t.affectedIps.join(',')}`).join('|');
    
    if (alertSentRef.current.has(threatKey)) return;
    alertSentRef.current.add(threatKey);

    // Get attacker info from first threat
    const attackerIp = highSeverityThreats[0]?.affectedIps[0] || 'Unknown';
    const attackerAttempts = loginAttempts.filter(a => a.ip_address === attackerIp);
    const attackerEmail = attackerAttempts[0]?.email || 'Unknown';

    // Send threat alert
    supabase.functions.invoke('send-threat-alert', {
      body: {
        attacker_email: attackerEmail,
        attacker_ip: attackerIp,
        login_attempts: attackerAttempts.map(a => ({
          success: a.success,
          timestamp: a.created_at,
          failure_reason: a.failure_reason,
          user_agent: a.user_agent
        })),
        threats: highSeverityThreats.map(t => ({
          technique_id: t.technique.id,
          technique_name: t.technique.name,
          tactic: t.technique.tactic,
          severity: t.technique.severity,
          confidence: t.confidence,
          confidence_explanation: t.confidenceExplanation,
          description: t.technique.description,
          evidence: t.evidence
        }))
      }
    }).then(({ error }) => {
      if (error) {
        console.error('Failed to send threat alert:', error);
        alertSentRef.current.delete(threatKey);
      } else {
        toast.error('🚨 Threat Alert Sent', { description: 'Security threat detected and email sent.' });
      }
    });
  }, [detectedThreats, loginAttempts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-red-500/20 text-red-500 border-red-500/50",
      medium: "bg-orange-500/20 text-orange-500 border-orange-500/50",
      low: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  if (detectedThreats.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            MITRE ATT&CK Threat Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-6">
          <div className="flex items-center justify-center gap-2 text-green-500">
            <ShieldAlert className="w-5 h-5" />
            <span>No active threats detected</span>
          </div>
          <p className="text-xs mt-2">Monitoring for credential attacks, brute force, and anomalies</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-red-500" />
          MITRE ATT&CK Threat Detection
          <Badge variant="destructive" className="ml-auto">
            {detectedThreats.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {detectedThreats.map((threat, index) => (
          <div
            key={`${threat.technique.id}-${index}`}
            className="p-3 rounded-lg border border-border/50 bg-secondary/20 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getSeverityIcon(threat.technique.severity)}
                <div>
                  <p className="font-medium text-sm">{threat.technique.name}</p>
                  <p className="text-xs text-muted-foreground">{threat.technique.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className={getSeverityBadge(threat.technique.severity)}>
                  {threat.technique.severity.toUpperCase()}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                        {Math.round(threat.confidence * 100)}% confidence
                        <HelpCircle className="w-3 h-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs font-medium mb-1">How confidence is calculated:</p>
                      <p className="text-xs text-muted-foreground">{threat.confidenceExplanation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">{threat.technique.description}</p>
            
            <div className="space-y-1">
              <p className="text-xs font-medium">Evidence:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {threat.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-primary">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-xs">
                Tactic: {threat.technique.tactic}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(threat.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};