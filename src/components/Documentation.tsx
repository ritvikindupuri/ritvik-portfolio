import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface Document {
  id: string;
  title: string;
  projectName: string;
  description: string;
  fileUrl: string;
  tags: string[];
  display_order?: number;
}

interface SortableDocProps {
  doc: Document;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const SortableDoc = ({ doc, isExpanded, toggleExpanded }: SortableDocProps) => {
  const truncatedDescription =
    doc.description.length > 200 ? doc.description.substring(0, 200) + "..." : doc.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/50 hover:border-primary/30 rounded-2xl p-8 shadow-elegant hover:shadow-glow transition-all duration-300"
    >
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow">
            <FileText className="w-8 h-8 text-background" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors mb-2 leading-tight">
                {doc.title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">{doc.projectName}</p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-4">
            {isExpanded ? doc.description : truncatedDescription}
          </p>

          {doc.description.length > 200 && (
            <button
              onClick={toggleExpanded}
              className="text-primary hover:text-accent transition-colors text-sm font-medium flex items-center gap-1 mb-4"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Read More <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {doc.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-medium text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Documentation
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const initialDocuments: Document[] = [];

export const Documentation = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    const { data, error } = await supabase
      .from("documentation")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching documentation:", error);
      return;
    }

    if (data && data.length > 0) {
      const docs = data.map((doc) => ({
        id: doc.id,
        title: doc.title,
        projectName: doc.category || "General",
        description: doc.description,
        fileUrl: doc.url,
        tags: [],
        display_order: doc.display_order,
      }));
      setDocuments(docs);
    }
  };
  const toggleExpanded = (docId: string) => {
    setExpandedDocs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  return (
    <section className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[150px] rounded-full" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-6 mb-20">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 shadow-glow"
            >
              <FileText className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-6xl md:text-7xl font-bold font-sans text-gradient-cyber">Technical Documentation</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
              Comprehensive technical documentation for some of my notable projects
            </p>
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full shadow-glow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <>
              {documents.map((doc) => (
                <SortableDoc
                  key={doc.id}
                  doc={doc}
                  isExpanded={expandedDocs.has(doc.id)}
                  toggleExpanded={() => toggleExpanded(doc.id)}
                />
              ))}
            </>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
