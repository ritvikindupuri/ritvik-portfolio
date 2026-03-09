import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Shield, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Activity,
  FileText,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestResult {
  name: string;
  category: string;
  payload: string;
  expectedBlock: boolean;
  passed: boolean | null;
  status: 'pending' | 'running' | 'passed' | 'failed';
  response?: any;
  error?: string;
  duration?: number;
}

const WAF_TEST_CASES: Omit<TestResult, 'passed' | 'status' | 'response' | 'error' | 'duration'>[] = [
  // SQL Injection Tests
  { name: "SQL Injection - Classic OR 1=1", category: "SQL Injection", payload: "admin' OR 1=1--", expectedBlock: true },
  { name: "SQL Injection - UNION SELECT", category: "SQL Injection", payload: "' UNION SELECT * FROM users--", expectedBlock: true },
  { name: "SQL Injection - Time-based Blind", category: "SQL Injection", payload: "'; WAITFOR DELAY '00:00:05'--", expectedBlock: true },
  { name: "SQL Injection - Comment Injection", category: "SQL Injection", payload: "admin'/**/OR/**/1=1--", expectedBlock: true },
  
  // XSS Tests
  { name: "XSS - Basic Script Tag", category: "XSS", payload: "<script>alert('XSS')</script>", expectedBlock: true },
  { name: "XSS - Event Handler", category: "XSS", payload: "<img src=x onerror=alert('XSS')>", expectedBlock: true },
  { name: "XSS - SVG Vector", category: "XSS", payload: "<svg onload=alert('XSS')>", expectedBlock: true },
  
  // Legitimate Payloads
  { name: "Legitimate - Normal Contact", category: "Legitimate", payload: "Hello, I'm interested in your services!", expectedBlock: false },
  { name: "Legitimate - Code Discussion", category: "Legitimate", payload: "Can you explain the SELECT statement in SQL?", expectedBlock: false },
  { name: "Legitimate - Special Characters", category: "Legitimate", payload: "My email is test@example.com & phone is (555) 123-4567", expectedBlock: false },
];

const WafTesting = () => {
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, blocked: 0, allowed: 0 });

  useEffect(() => {
    checkOwnerAccess();
    fetchRecentEvents();
    fetchWafStats();
  }, []);

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. Owner privileges required.");
        navigate('/');
        return;
      }

      setIsOwner(true);
    } catch (error) {
      console.error('Error checking owner access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from('waf_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setRecentEvents(data);
  };

  const fetchWafStats = async () => {
    const { data } = await supabase
      .from('waf_events')
      .select('blocked');
    
    if (data) {
      const total = data.length;
      const blocked = data.filter(e => e.blocked).length;
      setStats({ total, blocked, allowed: total - blocked });
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const results: TestResult[] = WAF_TEST_CASES.map(test => ({
      ...test,
      passed: null,
      status: 'pending'
    }));
    
    setTestResults(results);

    for (let i = 0; i < results.length; i++) {
      const test = results[i];
      results[i].status = 'running';
      setTestResults([...results]);

      const startTime = Date.now();
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              name: 'WAF Test',
              email: 'test@example.com',
              message: test.payload
            })
          }
        );

        const duration = Date.now() - startTime;
        const isBlocked = response.status === 403 || !response.ok;
        const passed = test.expectedBlock ? isBlocked : !isBlocked;

        results[i] = {
          ...test,
          passed,
          status: passed ? 'passed' : 'failed',
          response: { status: response.status, ok: response.ok },
          duration
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const isBlocked = error.message?.includes('Failed to fetch') || error.message?.includes('403');
        const passed = test.expectedBlock ? isBlocked : false;
        
        results[i] = {
          ...test,
          passed,
          status: passed ? 'passed' : 'failed',
          error: error.message,
          duration
        };
      }

      setTestResults([...results]);
      setProgress(((i + 1) / results.length) * 100);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    await fetchRecentEvents();
    await fetchWafStats();
    
    const passedCount = results.filter(r => r.passed).length;
    toast.success(`Test suite completed: ${passedCount}/${results.length} passed`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) return null;

  const passedTests = testResults.filter(r => r.passed === true).length;
  const failedTests = testResults.filter(r => r.passed === false).length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">WAF Testing Suite</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.blocked}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Allowed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.allowed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Block Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.blocked / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Runner */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  WAF Test Suite
                </CardTitle>
                <CardDescription>
                  Run comprehensive tests to validate WAF protection against malicious payloads
                </CardDescription>
              </div>
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {testResults.length > 0 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Results:</span>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {passedTests} Passed
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      {failedTests} Failed
                    </Badge>
                    <span className="text-muted-foreground">
                      ({totalTests} total)
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {testResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No tests run yet. Click "Run All Tests" to begin.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {['SQL Injection', 'XSS', 'Legitimate'].map(category => {
                  const categoryTests = testResults.filter(t => t.category === category);
                  if (categoryTests.length === 0) return null;

                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category} Tests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {categoryTests.map((test, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-start gap-3 p-3 border rounded-lg"
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {test.status === 'running' && (
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                  )}
                                  {test.status === 'passed' && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  )}
                                  {test.status === 'failed' && (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  {test.status === 'pending' && (
                                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{test.name}</span>
                                    {test.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {test.duration}ms
                                      </span>
                                    )}
                                  </div>
                                  
                                  <code className="block text-xs bg-muted p-2 rounded">
                                    {test.payload}
                                  </code>
                                  
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant={test.expectedBlock ? "destructive" : "secondary"}>
                                      Expected: {test.expectedBlock ? 'Block' : 'Allow'}
                                    </Badge>
                                    {test.response && (
                                      <Badge variant="outline">
                                        Status: {test.response.status}
                                      </Badge>
                                    )}
                                    {test.error && (
                                      <span className="text-muted-foreground">{test.error}</span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent WAF Events
                </CardTitle>
                <CardDescription>Last 50 WAF events from the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {recentEvents.map(event => (
                      <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {event.blocked ? (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{event.function_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          </div>
                          {event.reason && (
                            <p className="text-xs text-muted-foreground">{event.reason}</p>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {event.waf_mode}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Test Coverage Analysis</CardTitle>
                <CardDescription>Overview of WAF protection capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Attack Vectors Tested
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• SQL Injection (4 variants)</li>
                      <li>• Cross-Site Scripting (3 variants)</li>
                      <li>• Legitimate payloads (3 scenarios)</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Protection Layers
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• External Deflectra WAF Proxy</li>
                      <li>• Internal pattern detection</li>
                      <li>• Rate limiting (5 req/hour)</li>
                      <li>• Event logging & monitoring</li>
                    </ul>
                  </div>
                </div>

                {testResults.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold">Test Suite Summary:</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">SQL Injection: </span>
                            <span className="font-medium">
                              {testResults.filter(t => t.category === 'SQL Injection' && t.passed).length}/
                              {testResults.filter(t => t.category === 'SQL Injection').length} passed
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">XSS: </span>
                            <span className="font-medium">
                              {testResults.filter(t => t.category === 'XSS' && t.passed).length}/
                              {testResults.filter(t => t.category === 'XSS').length} passed
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Legitimate: </span>
                            <span className="font-medium">
                              {testResults.filter(t => t.category === 'Legitimate' && t.passed).length}/
                              {testResults.filter(t => t.category === 'Legitimate').length} passed
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Overall: </span>
                            <span className="font-medium">
                              {passedTests}/{totalTests} passed ({((passedTests/totalTests)*100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WafTesting;
