import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Plus, X, ExternalLink, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DocumentationProps {
  isOwner: boolean;
}

interface Document {
  id?: string;
  title: string;
  projectName: string;
  description: string;
  fileUrl: string;
  uploadDate: string;
  tags: string[];
}

const initialDocuments: Document[] = [
  {
    title: "Network Security Architecture",
    projectName: "Enterprise NIDS",
    description: "Comprehensive documentation covering the network intrusion detection system architecture, implementation details, and deployment guide.",
    fileUrl: "#",
    uploadDate: "Dec 2024",
    tags: ["Network Security", "Architecture", "Python"],
  },
  {
    title: "Cloud Infrastructure Design",
    projectName: "AWS Secure Deploy",
    description: "Technical documentation for secure cloud infrastructure deployment including IAM policies, VPC configuration, and security best practices.",
    fileUrl: "#",
    uploadDate: "Nov 2024",
    tags: ["AWS", "Cloud Security", "Infrastructure"],
  },
];

export const Documentation = ({ isOwner }: DocumentationProps) => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [newDoc, setNewDoc] = useState({
    title: "",
    projectName: "",
    description: "",
    fileUrl: "",
    uploadDate: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documentation:', error);
      return;
    }

    if (data && data.length > 0) {
      const docs = data.map(doc => ({
        id: doc.id,
        title: doc.title,
        projectName: doc.category || "General",
        description: doc.description,
        fileUrl: doc.url,
        uploadDate: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "",
        tags: []
      }));
      setDocuments(docs);
    }
  };


  const handleAddTag = () => {
    if (tagInput.trim() && !newDoc.tags.includes(tagInput.trim())) {
      setNewDoc({
        ...newDoc,
        tags: [...newDoc.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewDoc({
      ...newDoc,
      tags: newDoc.tags.filter((t) => t !== tag),
    });
  };

  const handleAddDocument = async () => {
    if (!newDoc.title || !newDoc.projectName || !newDoc.description || !newDoc.fileUrl) return;

    setIsUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from('documentation')
        .insert({
          user_id: user.id,
          title: newDoc.title,
          description: newDoc.description,
          url: newDoc.fileUrl,
          category: newDoc.projectName
        });

      if (error) {
        toast.error("Failed to add documentation");
        console.error('Error adding documentation:', error);
        return;
      }

      // Refresh from backend so guests get a working public link
      await fetchDocumentation();

      setNewDoc({
        title: "",
        projectName: "",
        description: "",
        fileUrl: "",
        uploadDate: "",
        tags: [],
      });
      setTagInput("");
      setIsAddDialogOpen(false);
      toast.success("Documentation added successfully");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    const { error } = await supabase
      .from('documentation')
      .delete()
      .eq('id', docId);

    if (error) {
      toast.error("Failed to remove documentation");
      console.error('Error removing documentation:', error);
      return;
    }

    setDocuments(documents.filter((d) => d.id !== docId));
    toast.success("Documentation removed");
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocId(doc.id || null);
    setNewDoc({
      title: doc.title,
      projectName: doc.projectName,
      description: doc.description,
      fileUrl: doc.fileUrl,
      uploadDate: doc.uploadDate,
      tags: doc.tags,
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateDocument = async () => {
    if (!editingDocId || !newDoc.title || !newDoc.projectName || !newDoc.description || !newDoc.fileUrl) return;

    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('documentation')
        .update({
          title: newDoc.title,
          description: newDoc.description,
          url: newDoc.fileUrl,
          category: newDoc.projectName
        })
        .eq('id', editingDocId);

      if (error) {
        toast.error("Failed to update documentation");
        console.error('Error updating documentation:', error);
        return;
      }

      await fetchDocumentation();

      setNewDoc({
        title: "",
        projectName: "",
        description: "",
        fileUrl: "",
        uploadDate: "",
        tags: [],
      });
      setTagInput("");
      setEditingDocId(null);
      setIsAddDialogOpen(false);
      toast.success("Documentation updated successfully");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExpanded = (docId: string) => {
    setExpandedDocs(prev => {
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
            <h2 className="text-6xl md:text-7xl font-bold font-sans bg-gradient-cyber bg-clip-text text-transparent">
              Technical Documentation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
              Comprehensive technical documentation for some of my notable projects
            </p>
            <div className="w-32 h-1.5 bg-gradient-cyber mx-auto rounded-full shadow-glow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                viewport={{ once: true }}
                className="group relative"
              >
                
                
                <div className="relative bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-glow">
                  {isOwner && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                      <button
                        onClick={() => handleEditDocument(doc)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary rounded-lg p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveDocument(doc.id!)}
                        className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-5 flex flex-col h-full">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-mono mb-3 bg-primary/10 px-3 py-1.5 rounded-lg w-fit">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary">{doc.projectName}</span>
                      </div>
                      <h3 className="text-2xl font-bold font-sans group-hover:text-primary transition-colors mb-3 leading-tight">
                        {doc.title}
                      </h3>
                      <div className="space-y-2">
                        <p className={`text-muted-foreground leading-relaxed text-sm ${expandedDocs.has(doc.id!) ? '' : 'line-clamp-3'}`}>
                          {doc.description}
                        </p>
                        {doc.description.length > 150 && (
                          <button
                            onClick={() => toggleExpanded(doc.id!)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            {expandedDocs.has(doc.id!) ? (
                              <>
                                Show less <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                      <span className="text-sm text-muted-foreground font-mono">
                        {doc.uploadDate}
                      </span>
                      <a
                        href={doc.fileUrl || "https://github.com/ritvikindupuri"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold text-sm group/link"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Documentation Button - Owner Only */}
            {isOwner && (
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setNewDoc({ title: "", projectName: "", description: "", fileUrl: "", uploadDate: "", tags: [] });
                  setTagInput("");
                  setEditingDocId(null);
                }
              }}>
                <DialogTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: documents.length * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    onClick={() => {
                      setNewDoc({ title: "", projectName: "", description: "", fileUrl: "", uploadDate: "", tags: [] });
                      setTagInput("");
                      setIsAddDialogOpen(true);
                    }}
                    className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[350px] group hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Add Documentation
                    </span>
                  </motion.button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDocId ? 'Edit' : 'Add'} Technical Documentation</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Document Title</label>
                      <Input
                        placeholder="e.g., API Security Implementation Guide"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        placeholder="e.g., Web Application Firewall"
                        value={newDoc.projectName}
                        onChange={(e) => setNewDoc({ ...newDoc, projectName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Brief description of the documentation content..."
                        value={newDoc.description}
                        onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">GitHub URL</label>
                      <Input
                        placeholder="https://github.com/username/repo or direct file URL"
                        value={newDoc.fileUrl}
                        onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Paste a GitHub repo, file, or release link.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newDoc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-xs font-mono bg-secondary rounded-full inline-flex items-center gap-2"
                          >
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Date (optional)</label>
                      <Input
                        placeholder="e.g., Dec 2024"
                        value={newDoc.uploadDate}
                        onChange={(e) => setNewDoc({ ...newDoc, uploadDate: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setNewDoc({ title: "", projectName: "", description: "", fileUrl: "", uploadDate: "", tags: [] });
                      setTagInput("");
                      setEditingDocId(null);
                    }} disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={editingDocId ? handleUpdateDocument : handleAddDocument} 
                      disabled={!newDoc.title || !newDoc.projectName || !newDoc.description || !newDoc.fileUrl || isUpdating}
                      type="button"
                    >
                      {isUpdating ? 'Saving...' : editingDocId ? 'Update Documentation' : 'Save Documentation'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
