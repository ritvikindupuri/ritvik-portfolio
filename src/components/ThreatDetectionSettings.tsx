import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw, Shield, AlertTriangle, Eye, Key } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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

export const ThreatDetectionSettings = () => {
  const [settings, setSettings] = useState<ThreatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const updateField = (field: keyof ThreatSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
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
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Failures</Label>
              <Input
                type="number"
                min={1}
                value={settings.brute_force_min_failures}
                onChange={(e) => updateField('brute_force_min_failures', parseInt(e.target.value) || 5)}
                className="h-9"
              />
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
            <Label className="text-xs text-muted-foreground">Min Total Failures</Label>
            <Input
              type="number"
              min={1}
              value={settings.password_guessing_min_failures}
              onChange={(e) => updateField('password_guessing_min_failures', parseInt(e.target.value) || 3)}
              className="h-9 max-w-[150px]"
            />
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
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Distinct Accounts</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_min_distinct_accounts}
                onChange={(e) => updateField('spray_min_distinct_accounts', parseInt(e.target.value) || 5)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min Total Failures</Label>
              <Input
                type="number"
                min={1}
                value={settings.spray_min_total_failures}
                onChange={(e) => updateField('spray_min_total_failures', parseInt(e.target.value) || 8)}
                className="h-9"
              />
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
              className="h-9 max-w-[150px]"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
