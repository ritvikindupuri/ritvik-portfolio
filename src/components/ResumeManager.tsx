import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVisitorTracker } from "@/components/VisitorTrackerProvider";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Resume {
  id: string;
  name: string;
  file_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export const ResumeManager = () => {
  const { trackResumeView, trackResumeDownload } = useVisitorTracker();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase.from("resumes").select("*").order("display_order", { ascending: true });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackResumeEvent = async (eventType: "view" | "download") => {
    try {
      await supabase.from("resume_analytics").insert({
        event_type: eventType,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track resume event:", error);
    }
  };
  const handleDownload = async (resume: Resume) => {
    trackResumeEvent("download");
    trackResumeDownload(resume.name); // Track for visitor analytics
    try {
      const response = await fetch(resume.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Resume downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download. Try opening in new tab.");
    }
  };

  const handleView = (resume: Resume) => {
    trackResumeEvent("view");
    trackResumeView(resume.name); // Track for visitor analytics
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

  // No resumes - don't show anything
  if (resumes.length === 0) {
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
              {
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
              }
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Dialog */}

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
