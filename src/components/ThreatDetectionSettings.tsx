import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw, Shield, AlertTriangle, Eye, Key, TriangleAlert, Info } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ThreatSettings {
  id: string;
  brute_force_window_minutes: number;
  brute_force_min_failures: number;
  password_guessing_min_failures: number;
  spray_window_minutes: number;
  spray_min_distinct_accounts: number;
  spray_min_total_failures: number;
  spray_max_failures_per_account: number;
  valid_accounts_min_locations: number;
}

interface ValidationWarning {
  field: string;
  message: string;
  type: 'too_low' | 'too_high';
}

// Default values for comparison
const DEFAULTS = {
  brute_force_window_minutes: 60,
  brute_force_min_failures: 5,
  password_guessing_min_failures: 3,
  spray_window_minutes: 30,
  spray_min_distinct_accounts: 5,
  spray_min_total_failures: 8,
  spray_max_failures_per_account: 2,
  valid_accounts_min_locations: 3,
};

const getValidationWarnings = (settings: ThreatSettings): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  // Brute Force Window
  if (settings.brute_force_window_minutes < 15) {
    warnings.push({
      field: 'brute_force_window_minutes',
      message: 'Very short window (<15 min) may cause false positives from normal user typos',
      type: 'too_low'
    });
  } else if (settings.brute_force_window_minutes > 1440) {
    warnings.push({
      field: 'brute_force_window_minutes',
      message: 'Very long window (>24 hrs) may delay detection of real attacks',
      type: 'too_high'
    });
  }

  // Brute Force Min Failures
  if (settings.brute_force_min_failures < 3) {
    warnings.push({
      field: 'brute_force_min_failures',
      message: 'Low threshold (<3) will flag normal login mistakes as attacks',
      type: 'too_low'
    });
  } else if (settings.brute_force_min_failures > 20) {
    warnings.push({
      field: 'brute_force_min_failures',
      message: 'High threshold (>20) may miss brute force attempts before lockout',
      type: 'too_high'
    });
  }

  // Password Guessing Min Failures
  if (settings.password_guessing_min_failures < 3) {
    warnings.push({
      field: 'password_guessing_min_failures',
      message: 'Low threshold (<3) may flag legitimate users who forgot passwords',
      type: 'too_low'
    });
  } else if (settings.password_guessing_min_failures > 10) {
    warnings.push({
      field: 'password_guessing_min_failures',
      message: 'High threshold (>10) may miss targeted password guessing attacks',
      type: 'too_high'
    });
  }

  // Spray Window
  if (settings.spray_window_minutes < 10) {
    warnings.push({
      field: 'spray_window_minutes',
      message: 'Very short window (<10 min) may miss slow spray attacks',
      type: 'too_low'
    });
  } else if (settings.spray_window_minutes > 120) {
    warnings.push({
      field: 'spray_window_minutes',
      message: 'Long window (>2 hrs) may aggregate unrelated login failures',
      type: 'too_high'
    });
  }

  // Spray Min Distinct Accounts
  if (settings.spray_min_distinct_accounts < 3) {
    warnings.push({
      field: 'spray_min_distinct_accounts',
      message: 'Low threshold (<3) may confuse normal multi-account usage with spraying',
      type: 'too_low'
    });
  } else if (settings.spray_min_distinct_accounts > 15) {
    warnings.push({
      field: 'spray_min_distinct_accounts',
      message: 'High threshold (>15) may only catch large-scale attacks',
      type: 'too_high'
    });
  }

  // Spray Min Total Failures
  if (settings.spray_min_total_failures < 5) {
    warnings.push({
      field: 'spray_min_total_failures',
      message: 'Low threshold (<5) may cause false positives',
      type: 'too_low'
    });
  } else if (settings.spray_min_total_failures > 25) {
    warnings.push({
      field: 'spray_min_total_failures',
      message: 'High threshold (>25) may only catch sustained attacks',
      type: 'too_high'
    });
  }

  // Valid Accounts Min Locations
  if (settings.valid_accounts_min_locations < 2) {
    warnings.push({
      field: 'valid_accounts_min_locations',
      message: 'Low threshold (<2) will flag normal VPN/mobile usage as suspicious',
      type: 'too_low'
    });
  } else if (settings.valid_accounts_min_locations > 10) {
    warnings.push({
      field: 'valid_accounts_min_locations',
      message: 'High threshold (>10) may miss credential compromise from multiple locations',
      type: 'too_high'
    });
  }

  return warnings;
};

export const ThreatDetectionSettings = () => {
  const [settings, setSettings] = useState<ThreatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setWarnings(getValidationWarnings(settings));
    }
  }, [settings]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('threat_detection_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching threat settings:', err);
      toast.error('Failed to load threat detection settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('threat_detection_settings')
        .update({
          brute_force_window_minutes: settings.brute_force_window_minutes,
          brute_force_min_failures: settings.brute_force_min_failures,
          password_guessing_min_failures: settings.password_guessing_min_failures,
          spray_window_minutes: settings.spray_window_minutes,
          spray_min_distinct_accounts: settings.spray_min_distinct_accounts,
          spray_min_total_failures: settings.spray_min_total_failures,
          spray_max_failures_per_account: settings.spray_max_failures_per_account,
          valid_accounts_min_locations: settings.valid_accounts_min_locations,
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('Threat detection settings saved');
    } catch (err) {
      console.error('Error saving threat settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      ...DEFAULTS
    });
    toast.info('Reset to default values - click Save to apply');
  };

  const updateField = (field: keyof ThreatSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const getFieldWarning = (field: string): ValidationWarning | undefined => {
    return warnings.find(w => w.field === field);
  };

  const getInputClassName = (field: string) => {
    const warning = getFieldWarning(field);
    if (!warning) return "h-9";
    return warning.type === 'too_low' 
      ? "h-9 border-yellow-500/50 focus:border-yellow-500" 
      : "h-9 border-orange-500/50 focus:border-orange-500";
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="text-center py-8 text-muted-foreground">
          No settings found. Contact admin.
        </CardContent>
      </Card>
    );
  }

  const tooLowWarnings = warnings.filter(w => w.type === 'too_low');
  const tooHighWarnings = warnings.filter(w => w.type === 'too_high');

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Threat Detection Thresholds
        </CardTitle>
        <CardDescription>
          Configure detection sensitivity for MITRE ATT&CK techniques
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Warnings Summary */}
        {tooLowWarnings.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <TriangleAlert className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200 text-xs">
              <strong>False Positive Risk:</strong> {tooLowWarnings.length} threshold(s) set too low may trigger on normal user behavior
            </AlertDescription>
          </Alert>
        )}
        {tooHighWarnings.length > 0 && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <Info className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-200 text-xs">
              <strong>Detection Gap Risk:</strong> {tooHighWarnings.length} threshold(s) set high may miss real attacks
            </AlertDescription>
          </Alert>
        )}

        {/* Brute Force */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-500">
            <Shield className="w-4 h-4" />
            Brute Force (T1110)
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Window (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={settings.brute_force_window_minutes}
                onChange={(e) => updateField('brute_force_window_minutes', parseInt(e.target.value) || 60)}
                className={getInputClassName('brute_force_window_minutes')}
              />
              {getFieldWarning('brute_force_window_minutes') && (
                <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('brute_force_window_minutes')?.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Failures</Label>
              <Input
                type="number"
                min={1}
                value={settings.brute_force_min_failures}
                onChange={(e) => updateField('brute_force_min_failures', parseInt(e.target.value) || 5)}
                className={getInputClassName('brute_force_min_failures')}
              />
              {getFieldWarning('brute_force_min_failures') && (
                <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('brute_force_min_failures')?.message}</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Password Guessing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-500">
            <Key className="w-4 h-4" />
            Password Guessing (T1110.001)
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Total Failures (across multiple sessions)</Label>
            <Input
              type="number"
              min={1}
              value={settings.password_guessing_min_failures}
              onChange={(e) => updateField('password_guessing_min_failures', parseInt(e.target.value) || 3)}
              className={`${getInputClassName('password_guessing_min_failures')} max-w-[150px]`}
            />
            {getFieldWarning('password_guessing_min_failures') && (
              <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('password_guessing_min_failures')?.message}</p>
            )}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Password Spraying */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
            <AlertTriangle className="w-4 h-4" />
            Password Spraying (T1110.003)
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Window (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_window_minutes}
                onChange={(e) => updateField('spray_window_minutes', parseInt(e.target.value) || 30)}
                className={getInputClassName('spray_window_minutes')}
              />
              {getFieldWarning('spray_window_minutes') && (
                <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('spray_window_minutes')?.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Distinct Accounts</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_min_distinct_accounts}
                onChange={(e) => updateField('spray_min_distinct_accounts', parseInt(e.target.value) || 5)}
                className={getInputClassName('spray_min_distinct_accounts')}
              />
              {getFieldWarning('spray_min_distinct_accounts') && (
                <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('spray_min_distinct_accounts')?.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Total Failures</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_min_total_failures}
                onChange={(e) => updateField('spray_min_total_failures', parseInt(e.target.value) || 8)}
                className={getInputClassName('spray_min_total_failures')}
              />
              {getFieldWarning('spray_min_total_failures') && (
                <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('spray_min_total_failures')?.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max per Account</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_max_failures_per_account}
                onChange={(e) => updateField('spray_max_failures_per_account', parseInt(e.target.value) || 2)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Valid Accounts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
            <Eye className="w-4 h-4" />
            Valid Accounts (T1078)
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min Unique Locations</Label>
            <Input
              type="number"
              min={1}
              value={settings.valid_accounts_min_locations}
              onChange={(e) => updateField('valid_accounts_min_locations', parseInt(e.target.value) || 3)}
              className={`${getInputClassName('valid_accounts_min_locations')} max-w-[150px]`}
            />
            {getFieldWarning('valid_accounts_min_locations') && (
              <p className="text-xs text-yellow-500 mt-1">{getFieldWarning('valid_accounts_min_locations')?.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleResetDefaults} disabled={saving}>
            Reset Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
