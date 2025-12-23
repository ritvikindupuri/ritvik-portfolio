import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, TrendingUp, HelpCircle, Hash } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChatbotQuery {
  id: string;
  activity_data: {
    query?: string;
  } | null;
  created_at: string;
}

// Common topics and their keywords
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Experience": ["experience", "work", "job", "career", "internship", "worked", "company"],
  "Skills": ["skill", "know", "language", "technology", "tech", "programming", "code", "python", "java"],
  "Projects": ["project", "built", "build", "created", "developed", "portfolio", "github"],
  "Education": ["education", "university", "school", "degree", "major", "purdue", "study", "gpa"],
  "Certifications": ["certification", "certified", "certificate", "aws", "security+", "cissp"],
  "Contact": ["contact", "email", "reach", "hire", "available", "linkedin"],
  "ML/AI": ["machine learning", "ml", "ai", "artificial intelligence", "model", "neural", "deep learning"],
  "Cybersecurity": ["security", "cyber", "hack", "vulnerability", "penetration", "threat"],
  "Resume": ["resume", "cv", "download", "pdf"],
};

function categorizeQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const matchedTopics: string[] = [];
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      matchedTopics.push(topic);
    }
  }
  
  return matchedTopics.length > 0 ? matchedTopics : ["General"];
}

function extractKeyQuestions(queries: string[]): { question: string; count: number }[] {
  const questionCounts: Record<string, number> = {};
  
  queries.forEach(query => {
    // Normalize the question
    const normalized = query.toLowerCase().trim().replace(/[?!.,]+$/g, "");
    if (normalized.length > 10 && normalized.length < 150) {
      questionCounts[normalized] = (questionCounts[normalized] || 0) + 1;
    }
  });
  
  // Group similar questions
  const groupedQuestions: Record<string, number> = {};
  const processed = new Set<string>();
  
  Object.entries(questionCounts).forEach(([q1, count1]) => {
    if (processed.has(q1)) return;
    
    let totalCount = count1;
    let bestQuestion = q1;
    
    Object.entries(questionCounts).forEach(([q2, count2]) => {
      if (q1 !== q2 && !processed.has(q2)) {
        // Simple similarity check - if one contains most of the other
        const words1 = new Set(q1.split(/\s+/));
        const words2 = new Set(q2.split(/\s+/));
        const intersection = [...words1].filter(w => words2.has(w));
        const similarity = intersection.length / Math.max(words1.size, words2.size);
        
        if (similarity > 0.6) {
          totalCount += count2;
          processed.add(q2);
          if (q2.length > bestQuestion.length) bestQuestion = q2;
        }
      }
    });
    
    processed.add(q1);
    groupedQuestions[bestQuestion] = totalCount;
  });
  
  return Object.entries(groupedQuestions)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export const ChatbotQueryAnalysis = () => {
  const [queries, setQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueries();
    
    const channel = supabase
      .channel('chatbot_queries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_activity' },
        () => fetchQueries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueries = async () => {
    try {
      const { data, error } = await supabase
        .from('visitor_activity')
        .select('id, activity_data, created_at')
        .eq('activity_type', 'chatbot_query')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      const queryTexts = (data || [])
        .map((item: ChatbotQuery) => item.activity_data?.query)
        .filter((q): q is string => !!q && q.length > 0);
      
      setQueries(queryTexts);
    } catch (error) {
      console.error('Error fetching chatbot queries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Topic distribution
  const topicDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    queries.forEach(query => {
      const topics = categorizeQuery(query);
      topics.forEach(topic => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }, [queries]);

  // Common questions
  const commonQuestions = useMemo(() => {
    return extractKeyQuestions(queries);
  }, [queries]);

  // Recent queries (last 10)
  const recentQueries = useMemo(() => {
    return queries.slice(0, 10);
  }, [queries]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Analyzing chatbot queries...
        </CardContent>
      </Card>
    );
  }

  if (queries.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Chatbot Query Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          No chatbot queries yet. Visitors will see this data once they start asking questions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{queries.length}</p>
            <p className="text-xs text-muted-foreground">Total Queries</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{topicDistribution.length}</p>
            <p className="text-xs text-muted-foreground">Topics Covered</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {topicDistribution[0]?.topic || "—"}
            </p>
            <p className="text-xs text-muted-foreground">Top Topic</p>
          </CardContent>
        </Card>
      </div>

      {/* Topics of Interest */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Topics of Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topicDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicDistribution.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="topic" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  width={90} 
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-4">No topic data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Common Questions */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Common Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commonQuestions.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {commonQuestions.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg bg-secondary/20"
                >
                  <Badge variant="secondary" className="shrink-0 mt-0.5">
                    {item.count}x
                  </Badge>
                  <p className="text-sm text-foreground/80 capitalize">
                    {item.question}?
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Not enough query data to identify common questions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            Recent Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentQueries.map((query, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-border/30"
              >
                <MessageCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-foreground/70 truncate">
                  {query}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
