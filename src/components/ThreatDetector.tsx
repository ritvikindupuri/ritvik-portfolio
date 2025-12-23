import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Target, Info } from "lucide-react";

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
  evidence: string[];
  affectedIps: string[];
  timestamp: string;
}

interface ThreatDetectorProps {
  loginAttempts: LoginAttempt[];
}

export const ThreatDetector = ({ loginAttempts }: ThreatDetectorProps) => {
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

    // Detect Brute Force (T1110) - Multiple failed attempts from same IP
    Object.entries(ipAttempts).forEach(([ip, attempts]) => {
      const failedAttempts = attempts.filter(a => !a.success);
      const recentFailed = failedAttempts.filter(a => {
        const attemptTime = new Date(a.created_at);
        return (now.getTime() - attemptTime.getTime()) < 3600000; // Last hour
      });

      if (recentFailed.length >= 5) {
        threats.push({
          technique: MITRE_TECHNIQUES.T1110,
          confidence: Math.min(0.95, 0.5 + (recentFailed.length * 0.1)),
          evidence: [
            `${recentFailed.length} failed attempts in last hour`,
            `Target emails: ${[...new Set(recentFailed.map(a => a.email))].join(", ")}`
          ],
          affectedIps: [ip],
          timestamp: recentFailed[0]?.created_at || now.toISOString()
        });
      } else if (failedAttempts.length >= 3) {
        threats.push({
          technique: MITRE_TECHNIQUES.T1110_001,
          confidence: 0.6,
          evidence: [
            `${failedAttempts.length} total failed attempts`,
            `Pattern suggests password guessing`
          ],
          affectedIps: [ip],
          timestamp: failedAttempts[0]?.created_at || now.toISOString()
        });
      }
    });

    // Detect Password Spraying (T1110.003) - Same pattern across accounts
    const emailAttempts: Record<string, LoginAttempt[]> = {};
    loginAttempts.forEach(attempt => {
      if (!emailAttempts[attempt.email]) {
        emailAttempts[attempt.email] = [];
      }
      emailAttempts[attempt.email].push(attempt);
    });

    const failedEmails = Object.entries(emailAttempts)
      .filter(([_, attempts]) => attempts.some(a => !a.success))
      .map(([email]) => email);

    if (failedEmails.length >= 3) {
      const uniqueIps = [...new Set(loginAttempts.filter(a => !a.success && a.ip_address).map(a => a.ip_address!))];
      threats.push({
        technique: MITRE_TECHNIQUES.T1110_003,
        confidence: 0.7,
        evidence: [
          `Failed attempts across ${failedEmails.length} accounts`,
          `From ${uniqueIps.length} unique IPs`
        ],
        affectedIps: uniqueIps,
        timestamp: now.toISOString()
      });
    }

    // Detect unusual login patterns (T1078)
    const successfulLogins = loginAttempts.filter(a => a.success);
    const uniqueSuccessIps = [...new Set(successfulLogins.map(a => a.ip_address).filter(Boolean))];
    if (uniqueSuccessIps.length >= 3) {
      threats.push({
        technique: MITRE_TECHNIQUES.T1078,
        confidence: 0.5,
        evidence: [
          `Successful logins from ${uniqueSuccessIps.length} different locations`,
          `May indicate compromised credentials or legitimate travel`
        ],
        affectedIps: uniqueSuccessIps as string[],
        timestamp: successfulLogins[0]?.created_at || now.toISOString()
      });
    }

    return threats.sort((a, b) => b.confidence - a.confidence);
  }, [loginAttempts]);

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
                <span className="text-xs text-muted-foreground">
                  {Math.round(threat.confidence * 100)}% confidence
                </span>
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