import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Download, Eye, Trash2, Edit2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Resume {
  id: string;
  name: string;
  file_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

interface ResumeManagerProps {
  isOwner: boolean;
}

export const ResumeManager = ({ isOwner }: ResumeManagerProps) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackResumeEvent = async (eventType: 'view' | 'download', resumeId: string) => {
    try {
      await supabase
        .from('resume_analytics')
        .insert({
          event_type: eventType,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
    } catch (error) {
      console.error('Failed to track resume event:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    if (!newResumeName) {
      // Use filename without extension as default name
      setNewResumeName(file.name.replace('.pdf', ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newResumeName.trim()) {
      toast.error("Please provide a name and select a file");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload");
        return;
      }

      // Upload to storage
      const fileName = `resume_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('resume')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload resume");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resume')
        .getPublicUrl(fileName);

      // Insert into resumes table
      const { error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          name: newResumeName.trim(),
          file_url: urlData.publicUrl,
          display_order: resumes.length,
          is_primary: resumes.length === 0,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error("Failed to save resume");
        return;
      }

      toast.success("Resume uploaded successfully!");
      setShowUploadDialog(false);
      setNewResumeName("");
      setSelectedFile(null);
      fetchResumes();
    } catch (error) {
      console.error('Resume upload error:', error);
      toast.error("Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resumeId: string) => {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) throw error;
      toast.success("Resume deleted");
      fetchResumes();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete resume");
    }
  };

  const handleRename = async (resumeId: string) => {
    if (!editName.trim()) return;

    try {
      const { error } = await supabase
        .from('resumes')
        .update({ name: editName.trim() })
        .eq('id', resumeId);

      if (error) throw error;
      toast.success("Resume renamed");
      setEditingId(null);
      fetchResumes();
    } catch (error) {
      console.error('Rename error:', error);
      toast.error("Failed to rename resume");
    }
  };

  const handleDownload = async (resume: Resume) => {
    trackResumeEvent('download', resume.id);
    try {
      const response = await fetch(resume.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Resume downloaded!");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download. Try opening in new tab.");
    }
  };

  const handleView = (resume: Resume) => {
    trackResumeEvent('view', resume.id);
    setSelectedResume(resume);
    setShowViewDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-card/50 border border-border rounded-full animate-pulse">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm">Loading resumes...</span>
      </div>
    );
  }

  // No resumes and not owner - don't show anything
  if (resumes.length === 0 && !isOwner) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Resume List */}
        <AnimatePresence>
          {resumes.map((resume) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative"
            >
              {editingId === resume.id ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/50 rounded-full">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 w-32 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(resume.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleRename(resume.id)}
                    className="p-1 hover:bg-primary/20 rounded"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-primary/20 rounded"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleView(resume)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 hover:border-primary rounded-full transition-all duration-300 hover:shadow-elegant"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-primary">{resume.name}</span>
                  {resume.is_primary && (
                    <span className="text-xs bg-primary/30 px-1.5 py-0.5 rounded text-primary">Primary</span>
                  )}
                </button>
              )}

              {/* Owner Actions */}
              {isOwner && editingId !== resume.id && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(resume.id);
                      setEditName(resume.name);
                    }}
                    className="p-1.5 bg-secondary hover:bg-secondary/80 rounded-full border border-border shadow-sm"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(resume.id);
                    }}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-full border border-red-500/30 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Resume Button - Owner Only */}
        {isOwner && (
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-card/50 hover:bg-card border border-dashed border-primary/50 hover:border-primary rounded-full transition-all duration-300"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-muted-foreground">Add Resume</span>
          </button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload New Resume
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Name</label>
              <Input
                placeholder="e.g., Software Engineer Resume"
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF File</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !newResumeName.trim()}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Resume Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedResume?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {selectedResume && (
              <>
                <iframe
                  src={selectedResume.file_url}
                  className="w-full h-[calc(85vh-120px)] rounded-lg border border-border"
                  title={selectedResume.name}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <a
                    href={selectedResume.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => handleDownload(selectedResume)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};