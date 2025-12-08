import { ArrowLeft, Database, Brain, Search, MessageSquare, Zap, Code, Layers, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RAGDocumentation = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Button>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              Technical Documentation
            </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl px-4 py-12">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Semantic RAG Architecture
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A deep dive into the Retrieval-Augmented Generation system powering the portfolio chatbot
          </p>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                This RAG (Retrieval-Augmented Generation) system combines <strong className="text-foreground">semantic vector search</strong> with 
                a large language model to provide accurate, context-aware responses about portfolio content. Unlike traditional 
                keyword-based search, the system understands the <em>meaning</em> behind queries, enabling natural language 
                conversations about skills, projects, and experience.
              </p>
              <p>
                The architecture consists of three main components: an <strong className="text-foreground">embedding pipeline</strong> that 
                converts portfolio content into vector representations, a <strong className="text-foreground">vector database</strong> for 
                similarity search, and a <strong className="text-foreground">chat orchestrator</strong> that combines retrieved context 
                with conversation history to generate responses.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Architecture Diagram */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Architecture Flow</h2>
          <Card className="border-border/50 bg-card/50 p-6">
            <div className="overflow-x-auto">
              <div className="flex min-w-[800px] items-center justify-between gap-4">
                {/* User Query */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-primary/20 p-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium">User Query</span>
                </div>
                
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
                
                {/* Embedding */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-amber-500/20 p-3">
                    <Code className="h-8 w-8 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium">OpenAI Embedding</span>
                  <span className="text-xs text-muted-foreground">text-embedding-3-small</span>
                </div>
                
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
                
                {/* Vector Search */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-cyan-500/20 p-3">
                    <Search className="h-8 w-8 text-cyan-500" />
                  </div>
                  <span className="text-sm font-medium">Vector Search</span>
                  <span className="text-xs text-muted-foreground">pgvector cosine</span>
                </div>
                
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
                
                {/* Database */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-green-500/20 p-3">
                    <Database className="h-8 w-8 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">Supabase</span>
                  <span className="text-xs text-muted-foreground">7 tables indexed</span>
                </div>
                
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
                
                {/* LLM */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <Brain className="h-8 w-8 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">Gemini 2.5 Pro</span>
                  <span className="text-xs text-muted-foreground">via Lovable AI</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Core Components</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Embedding Generation */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Embedding Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Uses OpenAI's <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">text-embedding-3-small</code> model 
                  to convert text into 768-dimensional vectors.
                </p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 font-medium text-foreground">Edge Function: generate-embeddings</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Batch processing for all portfolio content</li>
                    <li>Single-item embedding on content creation</li>
                    <li>Query embedding for runtime search</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Vector Database */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-green-500" />
                  Vector Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Supabase with <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">pgvector</code> extension 
                  stores embeddings directly alongside content.
                </p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 font-medium text-foreground">Indexed Tables (84 items)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["documentation", "projects", "skills", "experience", "ml_models", "llm_projects", "certifications"].map((table) => (
                      <Badge key={table} variant="secondary" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Semantic Search */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-cyan-500" />
                  Semantic Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  SQL function <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">match_portfolio_content</code> performs 
                  cosine similarity search across all tables.
                </p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 font-medium text-foreground">Search Parameters</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Similarity threshold: 0.5</li>
                    <li>Top-K results: 10</li>
                    <li>Fallback: keyword search</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Chat Orchestrator */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  Chat Orchestrator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Edge function that combines RAG context, portfolio data, and conversation history 
                  for Gemini 2.5 Pro.
                </p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 font-medium text-foreground">Edge Function: portfolio-chatbot</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>In-memory rate limiting</li>
                    <li>Conversation history (last 20 msgs)</li>
                    <li>Dynamic system prompt generation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Flow */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Request Flow</h2>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <ol className="relative border-l border-primary/30 pl-6 space-y-8">
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
                  <h3 className="font-semibold text-foreground">Query Reception</h3>
                  <p className="text-sm text-muted-foreground">
                    User submits a natural language question to the chatbot interface. Input is validated 
                    for length and potential injection attempts.
                  </p>
                </li>
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
                  <h3 className="font-semibold text-foreground">Query Embedding</h3>
                  <p className="text-sm text-muted-foreground">
                    The query is sent to OpenAI's embedding API, returning a 768-dimensional vector 
                    representing its semantic meaning.
                  </p>
                </li>
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</div>
                  <h3 className="font-semibold text-foreground">Similarity Search</h3>
                  <p className="text-sm text-muted-foreground">
                    The query embedding is compared against all stored embeddings using cosine similarity. 
                    Results above threshold 0.5 are returned, ranked by relevance.
                  </p>
                </li>
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</div>
                  <h3 className="font-semibold text-foreground">Context Assembly</h3>
                  <p className="text-sm text-muted-foreground">
                    Top 10 results are formatted as RAG context. Full portfolio data is fetched. 
                    A comprehensive system prompt is constructed with role instructions, portfolio details, 
                    and security measures.
                  </p>
                </li>
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">5</div>
                  <h3 className="font-semibold text-foreground">LLM Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    The assembled prompt (system + RAG context + conversation history + user query) 
                    is sent to Gemini 2.5 Pro via Lovable AI Gateway for response generation.
                  </p>
                </li>
                <li>
                  <div className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">6</div>
                  <h3 className="font-semibold text-foreground">Response Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    The generated response is returned to the client. Conversation history is updated 
                    in memory (not persisted) for context continuity.
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Tech Stack */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Technology Stack</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "OpenAI Embeddings", desc: "text-embedding-3-small (768d)", color: "bg-amber-500/20 text-amber-500" },
              { name: "Supabase pgvector", desc: "Vector storage & similarity search", color: "bg-green-500/20 text-green-500" },
              { name: "Gemini 2.5 Pro", desc: "Response generation LLM", color: "bg-purple-500/20 text-purple-500" },
              { name: "Lovable AI Gateway", desc: "LLM API routing", color: "bg-primary/20 text-primary" },
              { name: "Deno Edge Functions", desc: "Serverless compute layer", color: "bg-cyan-500/20 text-cyan-500" },
              { name: "PostgreSQL", desc: "RPC functions for search", color: "bg-blue-500/20 text-blue-500" },
            ].map((tech) => (
              <Card key={tech.name} className="border-border/50 bg-card/50">
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className={`rounded-lg p-2 ${tech.color}`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Code Snippets */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Key Implementation Details</h2>
          <div className="space-y-6">
            {/* SQL Function */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Vector Search SQL Function</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`-- match_portfolio_content function
SELECT 
  content_type,
  content_id,
  content_text,
  1 - (embedding <=> query_embedding) as similarity
FROM portfolio_content
WHERE embedding IS NOT NULL
  AND 1 - (embedding <=> query_embedding) > match_threshold
ORDER BY similarity DESC
LIMIT match_count;`}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Embedding Generation */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Embedding Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{`// OpenAI embedding call
const response = await fetch(
  'https://api.openai.com/v1/embeddings',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${OPENAI_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: textToEmbed,
      dimensions: 768
    })
  }
);`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Performance */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Performance Characteristics</h2>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">84</p>
                  <p className="text-sm text-muted-foreground">Indexed Items</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">768</p>
                  <p className="text-sm text-muted-foreground">Vector Dimensions</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">~200ms</p>
                  <p className="text-sm text-muted-foreground">Search Latency</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">20</p>
                  <p className="text-sm text-muted-foreground">Context Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Security Measures</h2>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "In-memory rate limiting per IP",
                  "Input validation & sanitization",
                  "Prompt injection detection",
                  "Message length constraints",
                  "Service role key isolation",
                  "CORS headers configured",
                  "No chat history persistence",
                  "RLS policies on all tables"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>Built by Ritvik Indupuri • Part of the AI Engineering Portfolio</p>
          <div className="mt-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                Return to Portfolio
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RAGDocumentation;
