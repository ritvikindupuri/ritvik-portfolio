import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, Plus, RefreshCw, Bug, AlertTriangle, Clock, 
  MapPin, Monitor, ChevronDown, ChevronUp, Shield
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface HoneypotAccount {
  id: string;
  email: string;
  description: string | null;
  is_active: boolean;
  times_triggered: number;
  last_triggered_at: string | null;
  created_at: string;
}

interface HoneypotTrigger {
  id: string;
  honeypot_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const HoneypotManager = () => {
  const [accounts, setAccounts] = useState<HoneypotAccount[]>([]);
  const [triggers, setTriggers] = useState<HoneypotTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime honeypot triggers
    const channel = supabase
      .channel('honeypot_triggers_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'honeypot_triggers' }, (payload) => {
        toast.warning('🍯 Honeypot Triggered!', { 
          description: `Attacker detected from IP: ${payload.new.ip_address}` 
        });
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, triggersRes] = await Promise.all([
        supabase
          .from('honeypot_accounts')
          .select('*')
          .order('times_triggered', { ascending: false }),
        supabase
          .from('honeypot_triggers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (triggersRes.error) throw triggersRes.error;

      setAccounts(accountsRes.data || []);
      setTriggers(triggersRes.data || []);
    } catch (err) {
      console.error('Error fetching honeypot data:', err);
      toast.error('Failed to load honeypot data');
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('honeypot_accounts')
        .insert({
          email: newEmail.toLowerCase().trim(),
          description: newDescription.trim() || null
        });

      if (error) throw error;
      toast.success('Honeypot account added');
      setNewEmail("");
      setNewDescription("");
      fetchData();
    } catch (err: any) {
      console.error('Error adding honeypot:', err);
      toast.error(err.message || 'Failed to add honeypot account');
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('honeypot_accounts')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Honeypot ${!currentState ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err) {
      console.error('Error toggling honeypot:', err);
      toast.error('Failed to update honeypot');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this honeypot account? This will also delete all trigger history.')) return;

    try {
      const { error } = await supabase
        .from('honeypot_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Honeypot account deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting honeypot:', err);
      toast.error('Failed to delete honeypot');
    }
  };

  const parseBrowser = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Other';
  };

  const totalTriggers = accounts.reduce((sum, a) => sum + a.times_triggered, 0);
  const activeAccounts = accounts.filter(a => a.is_active).length;

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bug className="w-5 h-5 text-purple-500" />
          Honeypot Accounts
        </CardTitle>
        <CardDescription>
          Fake accounts that catch and track attackers attempting default usernames
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-500">{accounts.length}</div>
            <div className="text-xs text-muted-foreground">Total Honeypots</div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{activeAccounts}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{totalTriggers}</div>
            <div className="text-xs text-muted-foreground">Total Triggers</div>
          </div>
        </div>

        {/* Add New Honeypot */}
        <div className="space-y-3 p-3 bg-secondary/20 rounded-lg">
          <Label className="text-sm font-medium">Add New Honeypot</Label>
          <div className="flex gap-2">
            <Input
              placeholder="admin@yourdomain.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 h-9"
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="flex-1 h-9"
            />
            <Button onClick={addAccount} disabled={adding} size="sm">
              {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Honeypot List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`p-3 rounded-lg border transition-colors ${
                account.times_triggered > 0 
                  ? 'bg-purple-500/10 border-purple-500/30' 
                  : 'bg-secondary/30 border-border/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={account.is_active}
                  onCheckedChange={() => toggleActive(account.id, account.is_active)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm truncate">{account.email}</span>
                    {account.times_triggered > 0 && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        {account.times_triggered} {account.times_triggered === 1 ? 'trigger' : 'triggers'}
                      </Badge>
                    )}
                  </div>
                  {account.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{account.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {account.last_triggered_at && (
                    <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {format(new Date(account.last_triggered_at), 'MMM d, h:mm a')}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAccount(account.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Triggers Section */}
        {triggers.length > 0 && (
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full justify-between text-sm"
              onClick={() => setShowTriggers(!showTriggers)}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Recent Trigger Activity ({triggers.length})
              </span>
              {showTriggers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showTriggers && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {triggers.map((trigger) => {
                  const account = accounts.find(a => a.id === trigger.honeypot_id);
                  return (
                    <div
                      key={trigger.id}
                      className="p-2 bg-red-500/10 rounded-lg text-xs border border-red-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-400">{account?.email || 'Unknown'}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(trigger.created_at), 'MMM d, h:mm:ss a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trigger.ip_address || 'Unknown IP'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {parseBrowser(trigger.user_agent)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MITRE Info */}
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-1">
            <Shield className="w-4 h-4" />
            MITRE ATT&CK: T1078.001 - Default Accounts
          </div>
          <p className="text-xs text-muted-foreground">
            Honeypot accounts detect adversaries attempting to use default or common usernames. 
            When triggered, attacks are logged and alerts are sent with attacker IP and browser info.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
