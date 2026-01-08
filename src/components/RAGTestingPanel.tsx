import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MessageSquare, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  Brain
} from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  content_type: string;
  content_id: string;
  content_text: string;
  similarity: number;
}

interface TestResult {
  query: string;
  response: string;
  retrievedContent: SearchResult[];
  timestamp: Date;
  responseTime: number;
}

export const RAGTestingPanel = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  const testRAGQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a test query");
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      // Step 1: Generate query embedding
      toast.info("Generating query embedding...");
      
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          action: 'generate_query_embedding',
          query: query.trim()
        }
      });

      if (embeddingError) {
        throw new Error(`Embedding error: ${embeddingError.message}`);
      }

      const embedding = embeddingData?.embedding;
      
      if (!embedding) {
        throw new Error('Failed to generate embedding');
      }

      // Step 2: Run semantic search
      toast.info("Running semantic search...");
      
      const embeddingStr = `[${embedding.join(',')}]`;
      
      const { data: matches, error: searchError } = await supabase.rpc('match_portfolio_content', {
        query_embedding: embeddingStr,
        match_threshold: 0.25,
        match_count: 15
      });

      if (searchError) {
        console.error('Search error:', searchError);
        throw new Error(`Search error: ${searchError.message}`);
      }

      // Step 3: Call chatbot for response
      toast.info("Getting chatbot response...");
      
      const { data: chatData, error: chatError } = await supabase.functions.invoke('portfolio-chatbot', {
        body: {
          messages: [{ role: 'user', content: query.trim() }]
        }
      });

      if (chatError) {
        throw new Error(`Chatbot error: ${chatError.message}`);
      }

      const responseTime = Date.now() - startTime;

      const result: TestResult = {
        query: query.trim(),
        response: chatData?.message || chatData?.response || 'No response received',
        retrievedContent: (matches || []) as SearchResult[],
        timestamp: new Date(),
        responseTime
      };

      setTestResults(prev => [result, ...prev]);
      setExpandedResults(prev => new Set([0, ...Array.from(prev).map(i => i + 1)]));
      setQuery("");
      
      toast.success(`Query completed in ${responseTime}ms`);
    } catch (error) {
      console.error('RAG test error:', error);
      toast.error(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getContentTypeBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'project': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'skill': 'bg-green-500/20 text-green-400 border-green-500/30',
      'experience': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'certification': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'documentation': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'ml_model': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'llm_project': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'github_content': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          RAG Chatbot Testing Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter a test query to see what content gets retrieved..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[80px] bg-background/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                testRAGQuery();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Press ⌘+Enter to test
            </span>
            <Button 
              onClick={testRAGQuery}
              disabled={loading || !query.trim()}
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Test Query
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="w-4 h-4 text-muted-foreground" />
              Test Results ({testResults.length})
            </div>
            
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-4">
                {testResults.map((result, index) => (
                  <Collapsible 
                    key={index} 
                    open={expandedResults.has(index)}
                    onOpenChange={() => toggleExpanded(index)}
                  >
                    <Card className="bg-muted/30 border-border/30">
                      <CollapsibleTrigger className="w-full">
                        <div className="p-3 flex items-start gap-3 text-left">
                          {expandedResults.has(index) ? (
                            <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium truncate">
                                {result.query}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                {result.retrievedContent.length} matches
                              </span>
                              <span>{result.responseTime}ms</span>
                              <span>{result.timestamp.toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-4">
                          {/* Retrieved Content */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Retrieved Content ({result.retrievedContent.length})
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {result.retrievedContent.length > 0 ? (
                                result.retrievedContent.map((content, i) => (
                                  <div 
                                    key={i} 
                                    className="p-2 bg-background/50 rounded border border-border/30 text-xs"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[10px] ${getContentTypeBadgeColor(content.content_type)}`}
                                      >
                                        {content.content_type}
                                      </Badge>
                                      <span className="text-green-400 font-mono">
                                        {(content.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2">
                                      {content.content_text}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 p-2 text-xs text-amber-400">
                                  <AlertCircle className="w-3 h-3" />
                                  No content matched the query
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Chatbot Response */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              Chatbot Response
                            </div>
                            <div className="p-3 bg-background/50 rounded border border-border/30 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {result.response}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {testResults.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter a query above to test the RAG system</p>
            <p className="text-xs mt-1">You'll see what content gets retrieved and the chatbot's response</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
