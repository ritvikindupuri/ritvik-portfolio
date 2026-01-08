import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, Printer, FileText, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import mermaid from "mermaid";

// Initialize mermaid with dark theme settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#22d3ee',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#22d3ee',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    secondBkg: '#0f172a',
    nodeBorder: '#22d3ee',
    clusterBkg: '#1e293b',
    clusterBorder: '#334155',
    defaultLinkColor: '#64748b',
    titleColor: '#f8fafc',
    edgeLabelBackground: '#1e293b',
    nodeTextColor: '#f8fafc',
    actorTextColor: '#f8fafc',
    actorLineColor: '#64748b',
    signalColor: '#22d3ee',
    signalTextColor: '#f8fafc',
    labelBoxBkgColor: '#1e293b',
    labelBoxBorderColor: '#334155',
    labelTextColor: '#f8fafc',
    loopTextColor: '#f8fafc',
    noteBorderColor: '#22d3ee',
    noteBkgColor: '#1e293b',
    noteTextColor: '#f8fafc',
    activationBorderColor: '#22d3ee',
    activationBkgColor: '#1e293b',
    sequenceNumberColor: '#f8fafc',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

const TechnicalDocumentation = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [diagramsRendered, setDiagramsRendered] = useState(false);

  useEffect(() => {
    // Fetch the markdown file
    fetch("/TECHNICAL_DOCUMENTATION.md")
      .then((res) => {
        if (!res.ok) {
          // Try alternative path
          return fetch("/TECHNICAL_DOCUMENTATION.md");
        }
        return res;
      })
      .then((res) => res.text())
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading documentation:", err);
        setLoading(false);
      });

    // Scroll listener for scroll-to-top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Render mermaid diagrams after content is loaded
  useEffect(() => {
    if (!loading && markdown && contentRef.current && !diagramsRendered) {
      const renderDiagrams = async () => {
        const diagrams = contentRef.current?.querySelectorAll('.mermaid-diagram');
        if (diagrams) {
          for (let i = 0; i < diagrams.length; i++) {
            const diagram = diagrams[i] as HTMLElement;
            const code = diagram.getAttribute('data-mermaid');
            if (code) {
              try {
                const id = `mermaid-${i}-${Date.now()}`;
                const { svg } = await mermaid.render(id, code);
                diagram.innerHTML = svg;
                diagram.classList.add('mermaid-rendered');
              } catch (err) {
                console.error('Mermaid rendering error:', err);
                // Keep the fallback view
              }
            }
          }
        }
        setDiagramsRendered(true);
      };
      
      // Small delay to ensure DOM is ready
      setTimeout(renderDiagrams, 100);
    }
  }, [loading, markdown, diagramsRendered]);

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleDownloadPDF = () => {
    toast.info("Opening print dialog - select 'Save as PDF' as destination", {
      duration: 5000,
    });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TECHNICAL_DOCUMENTATION.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Documentation downloaded as Markdown");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simple markdown to HTML converter (basic implementation)
  const convertMarkdownToHtml = (md: string): string => {
    let html = md;

    // Convert headers
    html = html.replace(/^######\s+(.*)$/gm, '<h6 class="text-sm font-semibold mt-6 mb-2">$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gm, '<h5 class="text-base font-semibold mt-6 mb-2">$1</h5>');
    html = html.replace(/^####\s+(.*)$/gm, '<h4 class="text-lg font-semibold mt-8 mb-3">$1</h4>');
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold mt-10 mb-4 text-primary">$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 id="$1" class="text-2xl font-bold mt-12 mb-6 pb-2 border-b border-border scroll-mt-20">$1</h2>');
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>');

    // Generate header IDs for linking
    html = html.replace(/id="([^"]+)"/g, (match, content) => {
      const id = content.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `id="${id}"`;
    });

    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />');

    // Convert bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert images with center alignment (handle various src formats)
    html = html.replace(/<p align="center">\s*<img src="([^"]+)" alt="([^"]*)" width="(\d+)"\/>\s*<\/p>/g, 
      (match, src, alt, width) => {
        // Normalize image paths for portfolio viewer
        let normalizedSrc = src;
        if (src.startsWith('./images/')) {
          normalizedSrc = src.replace('./images/', '/images/');
        } else if (src.startsWith('./public/images/')) {
          normalizedSrc = src.replace('./public/images/', '/images/');
        } else if (src.startsWith('public/images/')) {
          normalizedSrc = src.replace('public/images/', '/images/');
        }
        return `<figure class="my-8 flex flex-col items-center">
          <img src="${normalizedSrc}" alt="${alt}" class="max-w-full rounded-lg shadow-lg border border-border" style="max-width: ${width}px" loading="lazy" />
          <figcaption class="mt-3 text-sm text-muted-foreground italic text-center max-w-2xl">${alt}</figcaption>
        </figure>`;
      });
    
    // Convert regular markdown images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      let normalizedSrc = src;
      if (src.startsWith('./images/')) {
        normalizedSrc = src.replace('./images/', '/images/');
      } else if (src.startsWith('./public/images/')) {
        normalizedSrc = src.replace('./public/images/', '/images/');
      } else if (src.startsWith('public/images/')) {
        normalizedSrc = src.replace('public/images/', '/images/');
      }
      return `<img src="${normalizedSrc}" alt="${alt}" class="my-4 max-w-full rounded-lg shadow-md" loading="lazy" />`;
    });

    // Convert mermaid code blocks to diagram containers
    html = html.replace(/```mermaid\n([\s\S]*?)```/g, (match, content) => {
      // Clean up the mermaid content - fix common syntax issues
      let cleanContent = content.trim();
      
      // Fix "5 plus" -> "5+" and similar text issues in node labels
      cleanContent = cleanContent.replace(/5 plus/g, '5+');
      cleanContent = cleanContent.replace(/3 plus/g, '3+');
      cleanContent = cleanContent.replace(/at least/g, '>=');
      
      // Escape HTML entities in the data attribute
      const escapedContent = cleanContent
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Parse the mermaid content to determine diagram type
      const lines = cleanContent.split('\n');
      const isFlowchart = lines[0]?.includes('flowchart') || lines[0]?.includes('graph');
      const isSequence = lines[0]?.includes('sequenceDiagram');
      
      let diagramType = 'Diagram';
      let diagramIcon = '📊';
      if (isFlowchart) {
        diagramType = 'Architecture Flowchart';
        diagramIcon = '🔀';
      } else if (isSequence) {
        diagramType = 'Sequence Diagram';
        diagramIcon = '📋';
      }

      return `<div class="my-8 rounded-lg border border-border bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
        <div class="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
          <span class="text-lg">${diagramIcon}</span>
          <span class="font-semibold text-sm">${diagramType}</span>
          <span class="ml-auto text-xs text-muted-foreground">Interactive Diagram</span>
        </div>
        <div class="p-4 overflow-x-auto">
          <div class="mermaid-diagram min-h-[200px] flex items-center justify-center" data-mermaid="${escapedContent}">
            <div class="text-center text-muted-foreground">
              <div class="animate-pulse">Loading diagram...</div>
            </div>
          </div>
        </div>
        <details class="border-t border-border">
          <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 bg-muted/30">
            View diagram source code
          </summary>
          <pre class="p-3 bg-background overflow-x-auto"><code class="text-xs font-mono text-muted-foreground">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </details>
      </div>`;
    });
    
    // Convert other code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="my-6 p-4 bg-muted rounded-lg overflow-x-auto border border-border"><code class="text-sm font-mono">$2</code></pre>');

    // Convert tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c.trim()))) {
        return ""; // Skip separator row
      }
      const isHeader = match.includes("---");
      const cellType = isHeader ? "th" : "td";
      const cellClass = isHeader 
        ? "px-4 py-2 text-left font-semibold bg-muted" 
        : "px-4 py-2 border-t border-border";
      return `<tr>${cells.map((c) => `<${cellType} class="${cellClass}">${c.trim()}</${cellType}>`).join("")}</tr>`;
    });

    // Wrap table rows in table
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)\n*/g, (match, rows) => {
      if (!match.includes("<table")) {
        return `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse border border-border rounded-lg">${rows}</table></div>`;
      }
      return match;
    });

    // Convert unordered lists
    html = html.replace(/^[-*]\s+(.*)$/gm, '<li class="ml-6 list-disc">$1</li>');
    
    // Convert ordered lists  
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-6 list-decimal">$1</li>');

    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      const isOrdered = match.includes("list-decimal");
      const tag = isOrdered ? "ol" : "ul";
      return `<${tag} class="my-4 space-y-1">${match}</${tag}>`;
    });

    // Convert paragraphs (lines that aren't already HTML)
    const lines = html.split("\n");
    html = lines
      .map((line) => {
        const trimmed = line.trim();
        if (
          !trimmed ||
          trimmed.startsWith("<") ||
          trimmed.startsWith("|") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          /^\d+\./.test(trimmed)
        ) {
          return line;
        }
        return `<p class="my-3 text-muted-foreground leading-relaxed">${line}</p>`;
      })
      .join("\n");

    return html;
  };

  const htmlContent = convertMarkdownToHtml(markdown);
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ADD_TAGS: ["style"],
    ADD_ATTR: ["target", "rel", "loading"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-content {
            max-width: 100% !important;
            padding: 0 !important;
          }
          h1, h2, h3, h4 {
            page-break-after: avoid;
          }
          pre, blockquote, table, figure {
            page-break-inside: avoid;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      {/* Header - Hidden in print */}
      <header className="no-print sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Button>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown} className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Download .md</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save as PDF</span>
            </Button>
            <Badge variant="outline" className="border-primary/50 text-primary hidden md:inline-flex">
              Technical Documentation
            </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl px-4 py-8 print-content" ref={contentRef}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading documentation...</span>
          </div>
        ) : markdown ? (
          <>
            {/* Document Header */}
            <div className="mb-8 text-center no-print">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Technical Documentation
              </h1>
              <p className="text-muted-foreground">
                Comprehensive guide to the portfolio's architecture and features
              </p>
              <div className="mt-4 flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary">React + Vite</Badge>
                <Badge variant="secondary">Supabase</Badge>
                <Badge variant="secondary">Edge Functions</Badge>
                <Badge variant="secondary">MITRE ATT&CK</Badge>
              </div>
            </div>

            <Separator className="mb-8 no-print" />

            {/* Quick Actions */}
            <Card className="mb-8 no-print">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{markdown.split("\n").length.toLocaleString()} lines</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-2">
                    <span>{markdown.length.toLocaleString()} characters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <article
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Documentation Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The technical documentation file could not be loaded.
            </p>
            <Button asChild>
              <Link to="/">Return to Portfolio</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Scroll to Top Button - Hidden in print */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="no-print fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer - Hidden in print */}
      <footer className="no-print border-t border-border/40 py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            Generated from TECHNICAL_DOCUMENTATION.md •{" "}
            <Link to="/" className="text-primary hover:underline">
              Return to Portfolio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TechnicalDocumentation;
