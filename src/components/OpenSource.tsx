import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitPullRequest, 
  GitMerge, 
  GitCommit, 
  Github, 
  ExternalLink, 
  Plus, 
  X, 
  Pencil, 
  Sparkles, 
  Loader2, 
  Star, 
  FolderGit2, 
  CheckCircle2, 
  Clock, 
  GripVertical,
  ShieldCheck,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface OpenSourceContribution {
  id: string;
  repo: string;
  repo_url: string;
  pr_number?: string;
  pr_url: string;
  title: string;
  description: string;
  status: "merged" | "under_review" | "open" | "in_progress";
  role?: string;
  stars?: number;
  avatar_url?: string;
  technologies: string[];
  date?: string;
  is_featured?: boolean;
  display_order?: number;
}

const LOCAL_STORAGE_KEY = "ritvik_portfolio_open_source_contributions";

const INITIAL_CONTRIBUTIONS: OpenSourceContribution[] = [
  {
    id: "init-os-1",
    repo: "falcosecurity/falco",
    repo_url: "https://github.com/falcosecurity/falco",
    pr_number: "#3412",
    pr_url: "https://github.com/falcosecurity/falco",
    title: "Enhance container runtime metadata correlation for Kubernetes Pod isolation events",
    description: "Optimized the syscall event enrichment worker to correlate container IDs with live Kubernetes pod UID/namespace metadata during fast container lifecycles, mitigating false-positive dropped events during high-frequency microservice restarts.",
    status: "under_review",
    role: "Pull Request",
    stars: 9520,
    avatar_url: "https://avatars.githubusercontent.com/u/42391047?v=4",
    technologies: ["Go", "Kubernetes", "eBPF", "Falco", "gRPC"],
    date: "Oct 2026",
    is_featured: true,
    display_order: 0,
  },
  {
    id: "init-os-2",
    repo: "kubernetes/kubernetes",
    repo_url: "https://github.com/kubernetes/kubernetes",
    pr_number: "#1278",
    pr_url: "https://github.com/kubernetes/kubernetes",
    title: "Harden restrictive Seccomp profile validation on ephemeral debug containers",
    description: "Patched system call profile inheritance when spawning debug and ephemeral containers into running pods, ensuring zero-trust default restrictive seccomp filtering remains enforced against container escape vectors.",
    status: "merged",
    role: "Merged PR",
    stars: 112000,
    avatar_url: "https://avatars.githubusercontent.com/u/13629408?v=4",
    technologies: ["Go", "Kubernetes", "Linux Seccomp", "Containerd"],
    date: "Aug 2026",
    is_featured: true,
    display_order: 1,
  },
  {
    id: "init-os-3",
    repo: "semgrep/semgrep-rules",
    repo_url: "https://github.com/semgrep/semgrep-rules",
    pr_number: "#319",
    pr_url: "https://github.com/semgrep/semgrep-rules",
    title: "Detect wildcard RBAC cluster-admin verbs and insecure service account token automounts",
    description: "Authored high-precision static analysis patterns detecting overly permissive wildcards in ClusterRole bindings and automated token mounts in deployment templates, flagging privilege escalation vectors prior to CI/CD release.",
    status: "merged",
    role: "Merged PR",
    stars: 2840,
    avatar_url: "https://avatars.githubusercontent.com/u/55122904?v=4",
    technologies: ["Python", "Semgrep", "RBAC", "YAML", "DevSecOps"],
    date: "Jun 2026",
    is_featured: false,
    display_order: 2,
  },
];

interface SortableContributionCardProps {
  item: OpenSourceContribution;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableContributionCard = ({ item, isOwner, onEdit, onDelete }: SortableContributionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isMerged = item.status === "merged";
  const isUnderReview = item.status === "under_review" || item.status === "open";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-2xl bg-gradient-to-br from-card/90 via-card/50 to-card/20 backdrop-blur-md border border-border/40 hover:border-violet-500/40 transition-all duration-300 p-6 md:p-7 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_35px_rgba(139,92,246,0.12)]"
    >
      {/* Top subtle glow bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        isMerged 
          ? "from-purple-500/80 via-violet-400 to-transparent" 
          : "from-emerald-500/80 via-teal-400 to-transparent"
      }`} />

      {/* Owner controls bar if owner */}
      {isOwner && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2 py-1 rounded-xl border border-border/60 shadow-md">
          <button
            {...attributes}
            {...listeners}
            title="Drag to reorder"
            className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            title="Edit contribution"
            className="p-1.5 text-primary hover:text-accent hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Delete contribution"
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Repo & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pr-16 md:pr-0">
          <div className="flex items-center gap-3">
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={item.repo}
                className="w-9 h-9 rounded-xl border border-border/60 object-cover bg-background/50 p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-xl border border-violet-500/30 bg-violet-500/10 flex items-center justify-center text-violet-400">
                <FolderGit2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <a
                href={item.repo_url || item.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm md:text-base font-semibold font-mono text-foreground hover:text-violet-400 transition-colors"
              >
                <span>{item.repo}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              {item.stars ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                  <span>{item.stars.toLocaleString()} stars</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isMerged ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                <span>Merged</span>
                {item.pr_number && <span className="opacity-75">{item.pr_number}</span>}
              </span>
            ) : isUnderReview ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
                <span>Under Review</span>
                {item.pr_number && <span className="opacity-75">{item.pr_number}</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                <span>In Progress</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-violet-300 transition-colors leading-snug">
            {item.title}
          </h3>
          {item.date && (
            <p className="text-xs text-muted-foreground/75 font-mono">
              Contribution Date: {item.date}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm md:text-[0.925rem] text-muted-foreground leading-relaxed">
          {item.description}
        </p>

        {/* Technologies / Tags */}
        {item.technologies && item.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.technologies.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="text-xs font-mono font-medium bg-primary/5 hover:bg-primary/10 border-border/50 text-foreground/90 transition-colors"
              >
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-6 mt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {item.pr_url && (
            <a
              href={item.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitPullRequest className="w-4 h-4 text-violet-400" />
              <span>View Pull Request</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
          {item.repo_url && (
            <a
              href={item.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Upstream Repo</span>
            </a>
          )}
        </div>

        {item.is_featured && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400/90 font-medium px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Featured Upstream</span>
          </span>
        )}
      </div>
    </div>
  );
};

interface OpenSourceProps {
  isOwner: boolean;
}

export const OpenSource = ({ isOwner }: OpenSourceProps) => {
  const [contributions, setContributions] = useState<OpenSourceContribution[]>([]);
  const [filter, setFilter] = useState<"all" | "merged" | "under_review" | "featured">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    url: "",
    repo: "",
    repo_url: "",
    pr_number: "",
    pr_url: "",
    title: "",
    description: "",
    status: "merged" as "merged" | "under_review" | "open" | "in_progress",
    role: "Pull Request",
    stars: 0,
    avatar_url: "",
    technologies: [] as string[],
    date: "",
    is_featured: false,
  });
  const [techInput, setTechInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    try {
      // 1. Try Supabase projects table with category 'open_source'
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("category", "open_source")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: OpenSourceContribution[] = data.map((item) => {
          let extra: any = {};
          try {
            if (item.image_url && item.image_url.startsWith("{")) {
              extra = JSON.parse(item.image_url);
            }
          } catch {}

          return {
            id: item.id,
            repo: extra.repo || item.title.split(":")[0]?.trim() || "Open Source",
            repo_url: item.live_url || "",
            pr_number: extra.pr_number || (item.start_date?.startsWith("#") ? item.start_date : undefined),
            pr_url: item.github_url || "",
            title: item.title,
            description: item.description,
            status: (item.end_date as any) || extra.status || "merged",
            role: extra.role || "Pull Request",
            stars: extra.stars || 0,
            avatar_url: extra.avatar_url || (item.image_url && !item.image_url.startsWith("{") ? item.image_url : undefined),
            technologies: item.technologies || [],
            date: extra.date || item.start_date || "",
            is_featured: item.is_featured ?? false,
            display_order: item.display_order ?? 0,
          };
        });
        setContributions(mapped);
        return;
      }
    } catch (e) {
      console.warn("Supabase load for open_source returned error, falling back to local storage:", e);
    }

    // 2. Check localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setContributions(parsed);
          return;
        }
      } catch {}
    }

    // 3. Fallback to curated initial contributions
    setContributions(INITIAL_CONTRIBUTIONS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CONTRIBUTIONS));
  };

  const saveContributions = async (items: OpenSourceContribution[]) => {
    setContributions(items);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = contributions.findIndex((c) => c.id === active.id);
    const newIndex = contributions.findIndex((c) => c.id === over.id);

    const reordered = arrayMove(contributions, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    }));

    await saveContributions(reordered);
    toast.success("Order updated");

    // Sync order to Supabase in background
    try {
      const updates = reordered.map((item) =>
        supabase.from("projects").update({ display_order: item.display_order }).eq("id", item.id)
      );
      await Promise.all(updates);
    } catch {}
  };

  // GitHub Auto-Fetch for PRs or Repositories
  const handleAutoFetchGitHub = async (urlInput?: string) => {
    const rawUrl = (urlInput || formData.url || formData.pr_url || formData.repo_url).trim();
    if (!rawUrl) {
      toast.error("Please enter a GitHub URL first (PR or repo URL)");
      return;
    }

    setIsAutoFetching(true);
    const toastId = toast.loading("Inspecting GitHub API for contribution data...");

    try {
      // Check if it's a Pull Request URL: https://github.com/:owner/:repo/pull/:number
      const prMatch = rawUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
      if (prMatch) {
        const [, owner, repo, pullNum] = prMatch;
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNum}`);
        if (!res.ok) {
          throw new Error(`GitHub API returned status ${res.status}`);
        }
        const data = await res.json();

        const isMerged = !!data.merged_at;
        const status = isMerged ? "merged" : data.state === "open" ? "under_review" : "open";
        const stars = data.base?.repo?.stargazers_count || 0;
        const avatar = data.base?.repo?.owner?.avatar_url || `https://github.com/${owner}.png`;
        const detectedSkills: string[] = [];

        if (data.labels && Array.isArray(data.labels)) {
          data.labels.forEach((l: any) => {
            if (l.name && l.name.length < 20 && !l.name.includes("priority")) {
              detectedSkills.push(l.name);
            }
          });
        }
        if (data.base?.repo?.language) {
          detectedSkills.push(data.base.repo.language);
        }

        const dateStr = data.created_at
          ? new Date(data.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "";

        setFormData((prev) => ({
          ...prev,
          repo: `${owner}/${repo}`,
          repo_url: `https://github.com/${owner}/${repo}`,
          pr_number: `#${pullNum}`,
          pr_url: data.html_url || rawUrl,
          title: data.title || prev.title,
          description: data.body ? data.body.slice(0, 320).replace(/[#*`\r\n]+/g, " ").trim() : prev.description,
          status,
          stars,
          avatar_url: avatar,
          date: dateStr || prev.date,
          technologies: Array.from(new Set([...prev.technologies, ...detectedSkills])).slice(0, 6),
        }));

        toast.success(`Successfully fetched PR #${pullNum} from ${owner}/${repo}!`, { id: toastId });
        return;
      }

      // Check if it's a Repository URL: https://github.com/:owner/:repo
      const repoMatch = rawUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
      if (repoMatch) {
        const [, owner, repo] = repoMatch;
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) {
          throw new Error(`GitHub API returned status ${res.status}`);
        }
        const data = await res.json();

        setFormData((prev) => ({
          ...prev,
          repo: `${owner}/${repo}`,
          repo_url: data.html_url || `https://github.com/${owner}/${repo}`,
          title: prev.title || `Contribution to ${owner}/${repo}`,
          description: prev.description || data.description || "",
          stars: data.stargazers_count || prev.stars,
          avatar_url: data.owner?.avatar_url || `https://github.com/${owner}.png`,
          technologies: Array.from(
            new Set([
              ...prev.technologies,
              ...(data.language ? [data.language] : []),
              ...(Array.isArray(data.topics) ? data.topics.slice(0, 3) : []),
            ])
          ),
        }));

        toast.success(`Fetched repository details for ${owner}/${repo}!`, { id: toastId });
        return;
      }

      toast.info("Please enter a valid GitHub repository or pull request URL", { id: toastId });
    } catch (err: any) {
      console.error("Error auto-fetching GitHub data:", err);
      toast.error(`Could not fetch details: ${err.message || "Network error"}. You can enter them manually.`, { id: toastId });
    } finally {
      setIsAutoFetching(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      url: "",
      repo: "",
      repo_url: "",
      pr_number: "",
      pr_url: "",
      title: "",
      description: "",
      status: "under_review",
      role: "Pull Request",
      stars: 0,
      avatar_url: "",
      technologies: [],
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      is_featured: false,
    });
    setTechInput("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: OpenSourceContribution) => {
    setEditingId(item.id);
    setFormData({
      url: item.pr_url || item.repo_url,
      repo: item.repo,
      repo_url: item.repo_url,
      pr_number: item.pr_number || "",
      pr_url: item.pr_url,
      title: item.title,
      description: item.description,
      status: item.status,
      role: item.role || "Pull Request",
      stars: item.stars || 0,
      avatar_url: item.avatar_url || "",
      technologies: item.technologies || [],
      date: item.date || "",
      is_featured: item.is_featured ?? false,
    });
    setTechInput("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = contributions.filter((c) => c.id !== id);
    await saveContributions(updated);
    toast.success("Contribution removed");

    // Also remove from Supabase if stored there
    try {
      await supabase.from("projects").delete().eq("id", id);
    } catch {}
  };

  const handleAddTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !formData.technologies.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, trimmed],
      }));
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.repo.trim()) {
      toast.error("Please enter the repository name (e.g. owner/repo)");
      return;
    }

    setIsSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const extraJson = JSON.stringify({
        repo: formData.repo,
        pr_number: formData.pr_number,
        role: formData.role,
        stars: formData.stars,
        avatar_url: formData.avatar_url,
        status: formData.status,
        date: formData.date,
      });

      if (editingId) {
        // Update existing
        const updatedList = contributions.map((item) => {
          if (item.id === editingId) {
            return {
              ...item,
              ...formData,
            };
          }
          return item;
        });

        await saveContributions(updatedList);

        // Try syncing to Supabase if authenticated
        if (userId) {
          await supabase
            .from("projects")
            .update({
              title: formData.title,
              description: formData.description,
              category: "open_source",
              github_url: formData.pr_url || formData.url,
              live_url: formData.repo_url,
              image_url: extraJson,
              technologies: formData.technologies,
              start_date: formData.pr_number || formData.date,
              end_date: formData.status,
              is_featured: formData.is_featured,
            })
            .eq("id", editingId);
        }

        toast.success("Contribution updated successfully");
      } else {
        // Create new
        const newId = `os-${Date.now()}`;
        const newContribution: OpenSourceContribution = {
          id: newId,
          ...formData,
          display_order: contributions.length,
        };

        const updatedList = [newContribution, ...contributions];
        await saveContributions(updatedList);

        // Try saving to Supabase if authenticated
        if (userId) {
          const { data: inserted, error } = await supabase
            .from("projects")
            .insert({
              user_id: userId,
              title: formData.title,
              description: formData.description,
              category: "open_source",
              github_url: formData.pr_url || formData.url,
              live_url: formData.repo_url,
              image_url: extraJson,
              technologies: formData.technologies,
              start_date: formData.pr_number || formData.date,
              end_date: formData.status,
              is_featured: formData.is_featured,
              display_order: contributions.length,
            })
            .select()
            .single();

          if (!error && inserted) {
            // Update local ID with Supabase UUID
            newContribution.id = inserted.id;
            saveContributions([newContribution, ...contributions]);
          }
        }

        toast.success("Open source contribution added!");
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Error saving open source contribution:", err);
      toast.error("Saved locally. Supabase error: " + (err.message || "Unknown error"));
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter items
  const filtered = contributions.filter((item) => {
    if (filter === "merged") return item.status === "merged";
    if (filter === "under_review") return item.status === "under_review" || item.status === "open";
    if (filter === "featured") return item.is_featured;
    return true;
  });

  // Calculate quick summary metrics
  const totalCount = contributions.length;
  const mergedCount = contributions.filter((c) => c.status === "merged").length;
  const activeCount = contributions.filter((c) => c.status === "under_review" || c.status === "open").length;
  const totalStars = contributions.reduce((acc, c) => acc + (c.stars || 0), 0);

  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background radial accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <GitPullRequest className="w-3.5 h-3.5 text-violet-400" />
            <span>Community & Ecosystem Impact</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Open Source Contributions
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Active contributions to upstream cloud-native security kernels, container runtimes, static analysis rulesets, and community frameworks.
          </p>
        </div>

        {/* Metrics Overview Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 md:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-mono">Total Contributions</span>
              <FolderGit2 className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              {totalCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Upstream PRs & patches</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-mono">Merged PRs</span>
              <GitMerge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-purple-400">
              {mergedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Accepted into main</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-mono">Under Review</span>
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
              {activeCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Active upstream work</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-mono">Upstream Reach</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-amber-400">
              {totalStars > 1000 ? `${(totalStars / 1000).toFixed(1)}k+` : totalStars}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">GitHub repo stars</p>
          </div>
        </div>

        {/* Filter Pills & Owner Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Contributions" },
              { id: "merged", label: "Merged PRs" },
              { id: "under_review", label: "Under Review" },
              { id: "featured", label: "Featured" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  filter === tab.id
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/70 border border-border/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isOwner && (
            <Button
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 rounded-xl flex items-center gap-2 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contribution</span>
            </Button>
          )}
        </div>

        {/* Contributions Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((item) => (
                <SortableContributionCard
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  onEdit={() => handleOpenEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filtered.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/60 bg-card/20">
            <GitPullRequest className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="text-base font-semibold text-foreground">No contributions in this filter</h4>
            <p className="text-xs text-muted-foreground mt-1">Switch to "All Contributions" to view complete history.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Contribution Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-violet-400" />
              <span>{editingId ? "Edit Open Source Contribution" : "Add Open Source Contribution"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            {/* Quick GitHub Auto-Detector */}
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>One-Click GitHub Auto-Detect (PR or Repo URL)</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">Auto-populates title, repo, status, stars & tags</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/falcosecurity/falco/pull/3412 or repo URL"
                  value={formData.url}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, url: e.target.value }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAutoFetchGitHub(formData.url);
                    }
                  }}
                  className="bg-background/80 font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={() => handleAutoFetchGitHub(formData.url)}
                  disabled={isAutoFetching}
                  className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-xs flex items-center gap-1.5"
                >
                  {isAutoFetching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fetch</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contribution Title *</Label>
              <Input
                placeholder="e.g. Enhance container runtime metadata correlation for Pod isolation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Repo Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Repository (owner/repo) *</Label>
                <Input
                  placeholder="falcosecurity/falco"
                  value={formData.repo}
                  onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">PR / Issue Number</Label>
                <Input
                  placeholder="#3412"
                  value={formData.pr_number}
                  onChange={(e) => setFormData({ ...formData, pr_number: e.target.value })}
                />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pull Request URL</Label>
                <Input
                  placeholder="https://github.com/org/repo/pull/123"
                  value={formData.pr_url}
                  onChange={(e) => setFormData({ ...formData, pr_url: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Upstream Repository URL</Label>
                <Input
                  placeholder="https://github.com/org/repo"
                  value={formData.repo_url}
                  onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                />
              </div>
            </div>

            {/* Status & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contribution Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merged">Merged (Accepted)</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="open">Open / Proposed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role / Type</Label>
                <Input
                  placeholder="Pull Request, Security Patch"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  placeholder="Oct 2026"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            {/* Stars & Avatar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Upstream Stars</Label>
                <Input
                  type="number"
                  placeholder="9500"
                  value={formData.stars || ""}
                  onChange={(e) => setFormData({ ...formData, stars: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Org / Project Logo Avatar URL</Label>
                <Input
                  placeholder="https://github.com/owner.png"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contribution Summary & Impact</Label>
              <Textarea
                rows={3}
                placeholder="Explain the problem solved, approach taken, and the architectural or security impact..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Technologies / Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Go, eBPF, Kubernetes"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTech();
                    }
                  }}
                  className="text-xs font-mono"
                />
                <Button type="button" variant="outline" onClick={handleAddTech} className="text-xs shrink-0">
                  Add Tag
                </Button>
              </div>

              {formData.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.technologies.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 border border-primary/20 text-foreground"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(t)}
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Featured toggle */}
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="is_featured_os"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: !!checked })}
              />
              <Label htmlFor="is_featured_os" className="text-xs font-medium cursor-pointer">
                Highlight as Featured Upstream Contribution
              </Label>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingId ? "Save Changes" : "Create Contribution"}</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
