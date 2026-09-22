import React, { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  X, Info, ChevronRight, Menu, ArrowRight, FileText,
  Search, Plus, Layout, Grid3x3, Star, Users, Sparkles, Clock, TrendingUp,
} from "lucide-react";
import type { UploadedFile } from "../../types/UploadTypes";
import { useUpload } from "../../contexts/UploadContext";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type UploadStatus = "uploading" | "processing" | "success" | "error";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  rows?: number;
  errorMsg?: string;
  fileData?: any;
  headers?: string[];
  preview?: any[];
}

interface RecentUpload {
  id: string;
  name: string;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  status: "Completed" | "Failed";
}

interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
  thumbnail: string;
  category: string;
  used: number;
  tags?: string[];
  featured?: boolean;
  created_at: string;
}

const mockTemplates: Template[] = [
  { id: "t1", name: "Newsletter Modern", subject: "Weekly Newsletter - {{ date }}", preview: "Modern newsletter template with hero image and responsive design...", thumbnail: "📰", category: "Newsletter", used: 234, tags: ["Modern", "Responsive", "Clean"], featured: true, created_at: "2024-01-15T10:30:00Z" },
  { id: "t2", name: "Promotional Flash Sale", subject: "🔥 Flash Sale Alert! {{ discount }}% Off", preview: "High-converting promotional template with countdown timer...", thumbnail: "🔥", category: "Promotion", used: 189, tags: ["Urgent", "Sales", "Conversion"], featured: true, created_at: "2024-02-20T14:15:00Z" },
  { id: "t3", name: "Welcome Series", subject: "Welcome to {{ company_name }}, {{ name }}!", preview: "Warm welcome email with onboarding steps and resources...", thumbnail: "👋", category: "Onboarding", used: 567, tags: ["Welcome", "Onboarding", "Friendly"], featured: false, created_at: "2024-01-05T09:00:00Z" },
  { id: "t4", name: "Event Invitation", subject: "You're Invited to {{ event_name }}!", preview: "Elegant event invitation template with RSVP button...", thumbnail: "🎪", category: "Event", used: 145, tags: ["Event", "Elegant", "RSVP"], featured: false, created_at: "2024-03-01T16:45:00Z" },
];

let idCounter = 0;

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* ─────────────────────────────────────────────────────────
   Shared primitives
   ───────────────────────────────────────────────────────── */

const SectionLabel: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; hint?: string }> = ({ icon, children, hint }) => (
  <div className="flex items-end justify-between gap-3 mb-3 md:mb-4">
    <div>
      <h2 style={{ fontFamily: FONT.display }} className="flex items-center gap-2 text-sm md:text-base font-semibold text-[#E8E6E1] tracking-tight">
        {icon}
        {children}
      </h2>
      {hint && <p className="text-[11px] md:text-xs text-[#6B727C] mt-1">{hint}</p>}
    </div>
  </div>
);

const StatusPill: React.FC<{ tone: "success" | "danger" | "warn" | "info" | "muted"; children: React.ReactNode }> = ({ tone, children }) => {
  const map = {
    success: { bg: "rgba(52,211,153,0.10)", fg: "#34D399", ring: "rgba(52,211,153,0.20)" },
    danger: { bg: "rgba(248,113,113,0.10)", fg: "#F87171", ring: "rgba(248,113,113,0.20)" },
    warn: { bg: "rgba(251,191,36,0.10)", fg: "#FBBF24", ring: "rgba(251,191,36,0.20)" },
    info: { bg: "rgba(255,106,57,0.10)", fg: "#FF6A39", ring: "rgba(255,106,57,0.20)" },
    muted: { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.20)" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium"
      style={{ backgroundColor: map.bg, color: map.fg, boxShadow: `inset 0 0 0 1px ${map.ring}` }}
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Template card
   ───────────────────────────────────────────────────────── */

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: "grid" | "list";
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect, viewMode }) => {
  const base = `group relative cursor-pointer rounded-2xl transition-all duration-200 ${
    isSelected
      ? "bg-[#FF6A39]/5 ring-1 ring-[#FF6A39]/60 shadow-[0_8px_30px_-12px_rgba(255,106,57,0.35)]"
      : "bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] hover:bg-[#161B25]"
  }`;

  if (viewMode === "grid") {
    return (
      <div onClick={onSelect} className={`${base} p-3.5 md:p-4`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-[#1F242E] to-[#151922] ring-1 ring-[#2A2E37]">
            {template.thumbnail}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#E8E6E1] text-sm truncate">{template.name}</h3>
              {template.featured && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-amber-400/10 text-amber-300">
                  <Sparkles size={9} /> Featured
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B727C] mt-0.5 line-clamp-2 leading-relaxed">{template.preview}</p>
            <p className="text-[10px] text-[#9BA0A8] mt-1.5 font-mono truncate">Subject · {template.subject}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1F242E] text-[#9BA0A8] ring-1 ring-[#2A2E37]">
                {template.category}
              </span>
              <span className="text-[10px] text-[#6B727C] inline-flex items-center gap-1">
                <TrendingUp size={10} /> {template.used}
              </span>
              {template.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FF6A39]/8 text-[#FF6A39]/90">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            isSelected ? "bg-[#FF6A39] text-white" : "bg-[#1F242E] ring-1 ring-[#2A2E37] group-hover:ring-[#3A3F4A]"
          }`}>
            {isSelected && <CheckCircle2 size={12} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onSelect} className={`${base} flex items-center gap-3 p-3`}>
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-[#1F242E] to-[#151922] ring-1 ring-[#2A2E37]">
        {template.thumbnail}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#E8E6E1] text-sm truncate">{template.name}</h3>
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[#1F242E] text-[#9BA0A8] ring-1 ring-[#2A2E37]">
            {template.category}
          </span>
          {template.featured && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-medium">
              Featured
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#6B727C] truncate mt-0.5">{template.subject}</p>
      </div>
      {isSelected && (
        <span className="shrink-0 w-5 h-5 rounded-full bg-[#FF6A39] text-white flex items-center justify-center">
          <CheckCircle2 size={12} />
        </span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Upload page
   ───────────────────────────────────────────────────────── */

const Upload = () => {
  const navigate = useNavigate();

  const {
    files: uploadedFiles,
    loading: uploadingLoading,
    error: uploadError,
    fetchAllFiles,
  } = useUpload();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => { fetchAllFiles(); }, [fetchAllFiles]);

  useEffect(() => {
    if (uploadingLoading) return;
    if (uploadError) {
      console.error("❌ Failed to load user uploads:", uploadError);
      return;
    }
    console.log("📁 Uploaded files for this user:", uploadedFiles);
  }, [uploadedFiles, uploadingLoading, uploadError]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      setTimeout(() => {
        setTemplates(mockTemplates);
        setIsLoadingTemplates(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setIsLoadingTemplates(false);
    }
  };

  const categories = ["all", ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.featured);

  const parseFile = (file: UploadFile): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const headers = ['email', 'name', 'company', 'tags'];
        const rowCount = Math.floor(Math.random() * 3000) + 200;
        const preview = Array.from({ length: 5 }, (_, i) => ({
          email: `user${i + 1}@example.com`,
          name: `User ${i + 1}`,
          company: `Company ${i + 1}`,
          tags: 'tag1, tag2'
        }));
        resolve({ headers, rows: rowCount, preview, data: preview });
      }, 1500);
    });
  };

  const simulateUpload = async (file: UploadFile) => {
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== file.id) return f;
          if (f.status === "uploading") {
            const next = f.progress + Math.random() * 25;
            if (next >= 100) return { ...f, progress: 100, status: "processing" };
            return { ...f, progress: next };
          }
          return f;
        })
      );
    }, 350);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const parsedData = await parseFile(file);
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== file.id) return f;
            const willFail = f.name.toLowerCase().includes("fail");
            return willFail
              ? { ...f, status: "error", errorMsg: "Missing required 'email' column" }
              : {
                  ...f,
                  status: "success",
                  rows: parsedData.rows,
                  headers: parsedData.headers,
                  preview: parsedData.preview,
                  fileData: parsedData.data,
                };
          })
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== file.id) return f;
            return { ...f, status: "error", errorMsg: "Failed to parse file" };
          })
        );
      }
    }, 2600);
  };

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((f) => /\.(csv|xlsx|xls)$/i.test(f.name));
    const newFiles: UploadFile[] = accepted.map((f) => ({
      id: `f${idCounter++}`,
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...newFiles, ...prev]);
    newFiles.forEach(simulateUpload);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleStartCampaign = () => {
    const successfulFiles = files.filter(f => f.status === "success");
    if (successfulFiles.length > 0 && selectedTemplate) {
      sessionStorage.setItem('uploadedFileData', JSON.stringify(successfulFiles[0]));
      sessionStorage.setItem('selectedTemplate', JSON.stringify(
        templates.find(t => t.id === selectedTemplate)
      ));
      navigate('/user/campaign');
    } else if (!selectedTemplate) {
      setShowTemplateSelector(true);
    }
  };

  const hasSuccessfulUpload = files.some(f => f.status === "success");

  const recentUploads: RecentUpload[] = (uploadedFiles || []).map((u: any) => {
    const total = u.total_records ?? 0;
    const processed = u.processed_records ?? 0;
    return {
      id: String(u.id),
      name: u.original_filename ?? u.stored_filename ?? "Unnamed file",
      rows: total,
      addedCount: processed,
      skippedCount: Math.max(total - processed, 0),
      uploadedAt: formatDate(u.created_at ?? u.updated_at),
      status:
        (u.status ?? "").toLowerCase() === "failed" ||
        (u.status ?? "").toLowerCase() === "error"
          ? "Failed"
          : "Completed",
    };
  });

  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log("🔎 FIRST FILE RAW:", uploadedFiles[0]);
      console.log("🔎 KEYS:", Object.keys(uploadedFiles[0] as any));
    }
  }, [uploadedFiles]);

  /* ─────────────────────── RENDER ─────────────────────── */

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0D1015" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .drag-ring::after {
          content: ""; position: absolute; inset: -2px; border-radius: 1.25rem;
          border: 1px solid #FF6A39; animation: pulse-ring 1.4s ease-out infinite;
          pointer-events: none;
        }
        .mf-main::-webkit-scrollbar { width: 8px; }
        .mf-main::-webkit-scrollbar-track { background: transparent; }
        .mf-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .mf-main::-webkit-scrollbar-thumb:hover { background: #333A48; }
        .fade-in { animation: fadeIn 0.25s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className="mf-main flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ───────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] transition-colors"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#6B727C]">Campaigns</span>
                  <ChevronRight size={10} className="text-[#3A3F4A]" />
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#FF6A39]">New upload</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Import your recipients
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8] max-w-xl">
                  Drop a CSV or Excel file, pick a template, and we'll take care of the rest.
                </p>
              </div>
            </div>

            {hasSuccessfulUpload && (
              <button
                onClick={handleStartCampaign}
                disabled={!selectedTemplate}
                className={`group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedTemplate
                    ? "bg-[#FF6A39] hover:bg-[#e85a2c] text-white shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
                    : "bg-[#1A1E27] text-[#6B727C] ring-1 ring-[#232833] cursor-not-allowed"
                }`}
              >
                Start campaign
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </header>

          {/* ── Dropzone ─────────────────────────────── */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative mb-4 md:mb-5 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
              isDragging
                ? "bg-[#FF6A39]/5 ring-1 ring-[#FF6A39]/60 drag-ring"
                : "bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48]"
            }`}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(600px 120px at 50% 0%, rgba(255,106,57,0.08), transparent 60%)",
              }}
            />
            <div className="relative px-6 py-10 md:py-14 lg:py-16 flex flex-col items-center text-center">
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />

              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isDragging ? "scale-110" : ""}`}
                style={{ background: "linear-gradient(135deg, rgba(255,106,57,0.22), rgba(255,106,57,0.06))", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.25)" }}>
                <UploadCloud size={26} className="text-[#FF6A39]" />
              </div>

              <p style={{ fontFamily: FONT.display }} className="text-lg md:text-xl font-semibold text-white">
                {isDragging ? "Drop your file to begin" : "Drag & drop your file"}
              </p>
              <p className="mt-1.5 text-sm text-[#9BA0A8]">
                or{" "}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FF6A39]/10 text-[#FF6A39] font-medium ring-1 ring-[#FF6A39]/20">
                  browse files
                </span>
              </p>

              <div className="mt-5 flex items-center gap-3 text-[11px] text-[#6B727C]">
                <span className="inline-flex items-center gap-1.5"><FileText size={12} /> CSV</span>
                <span className="w-px h-3 bg-[#232833]" />
                <span className="inline-flex items-center gap-1.5"><FileSpreadsheet size={12} /> XLSX / XLS</span>
                <span className="w-px h-3 bg-[#232833]" />
                <span className="inline-flex items-center gap-1.5"><Clock size={12} /> up to 25 MB</span>
              </div>
            </div>
          </div>

          {/* ── Tip ──────────────────────────────────── */}
          <div className="mb-6 md:mb-10 flex items-start gap-3 rounded-2xl bg-[#141821] ring-1 ring-[#232833] px-4 py-3">
            <div className="shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
              <Info size={12} className="text-[#FF6A39]" />
            </div>
            <p className="text-xs md:text-[13px] leading-relaxed text-[#C7C9CE]">
              Required column: <span className="font-mono text-[#FF6A39]">email</span>. Optional:{" "}
              <span className="font-mono text-[#E8E6E1]">name</span>,{" "}
              <span className="font-mono text-[#E8E6E1]">company</span>,{" "}
              <span className="font-mono text-[#E8E6E1]">tags</span> (comma-separated).
            </p>
          </div>

          {/* ── Template selection ───────────────────── */}
          <section className="mb-6 md:mb-10">
            <div className="flex items-end justify-between gap-3 mb-3 md:mb-4">
              <div>
                <h2 style={{ fontFamily: FONT.display }} className="flex items-center gap-2 text-sm md:text-base font-semibold text-[#E8E6E1] tracking-tight">
                  Email template <span className="text-[#FF6A39]">*</span>
                </h2>
                <p className="text-[11px] md:text-xs text-[#6B727C] mt-1">Pick a starting point for your campaign.</p>
              </div>
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] hover:bg-[#161B25] text-[#E8E6E1] text-xs md:text-sm font-medium transition-all"
              >
                {showTemplateSelector ? 'Hide' : 'Browse'}
                <ChevronRight size={14} className={`transform transition-transform ${showTemplateSelector ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {selectedTemplate && (
              <div className="rounded-2xl bg-[#FF6A39]/5 ring-1 ring-[#FF6A39]/25 p-3 md:p-4 mb-3 fade-in">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl bg-gradient-to-br from-[#1F242E] to-[#151922] ring-1 ring-[#2A2E37]">
                    {templates.find(t => t.id === selectedTemplate)?.thumbnail || '📧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-[15px] font-semibold text-white truncate">
                      {templates.find(t => t.id === selectedTemplate)?.name || 'Selected template'}
                    </p>
                    <p className="text-[11px] md:text-xs text-[#9BA0A8] font-mono truncate">
                      {templates.find(t => t.id === selectedTemplate)?.subject || ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1F242E] text-[#9BA0A8] ring-1 ring-[#2A2E37]">
                        {templates.find(t => t.id === selectedTemplate)?.category}
                      </span>
                      <span className="text-[10px] text-[#6B727C] inline-flex items-center gap-1">
                        <TrendingUp size={10} /> Used {templates.find(t => t.id === selectedTemplate)?.used} times
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="shrink-0 p-1.5 rounded-lg text-[#6B727C] hover:text-[#E8E6E1] hover:bg-[#232833] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {showTemplateSelector && (
              <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden fade-in">
                {/* Search + filter */}
                <div className="p-3 md:p-4 border-b border-[#1F242E]">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B727C]" />
                      <input
                        type="text"
                        placeholder="Search templates…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#0F131A] ring-1 ring-[#232833] rounded-xl text-[#E8E6E1] placeholder:text-[#6B727C] focus:ring-[#FF6A39]/60 focus:outline-none text-sm transition-all"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2.5 bg-[#0F131A] ring-1 ring-[#232833] rounded-xl text-[#E8E6E1] text-sm focus:ring-[#FF6A39]/60 focus:outline-none cursor-pointer transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : cat}</option>
                      ))}
                    </select>
                    <div className="flex rounded-xl overflow-hidden ring-1 ring-[#232833]">
                      <button type="button" onClick={() => setViewMode('grid')}
                        className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#FF6A39] text-white' : 'bg-[#0F131A] text-[#6B727C] hover:text-[#E8E6E1]'}`}>
                        <Grid3x3 size={16} />
                      </button>
                      <button type="button" onClick={() => setViewMode('list')}
                        className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#FF6A39] text-white' : 'bg-[#0F131A] text-[#6B727C] hover:text-[#E8E6E1]'}`}>
                        <Layout size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Templates list */}
                <div className="p-3 md:p-4 max-h-[420px] overflow-y-auto mf-main">
                  {isLoadingTemplates ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-7 h-7 animate-spin text-[#FF6A39] mx-auto" />
                      <p className="text-xs text-[#6B727C] mt-2">Loading templates…</p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                        <FileText className="w-5 h-5 text-[#6B727C]" />
                      </div>
                      <p className="text-sm text-[#9BA0A8]">No templates found</p>
                    </div>
                  ) : (
                    <>
                      {searchQuery === '' && selectedCategory === 'all' && featuredTemplates.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[11px] font-medium text-[#6B727C] flex items-center gap-1.5 mb-2.5 uppercase tracking-wider">
                            <Star size={12} className="text-amber-400" /> Featured
                          </p>
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                            {featuredTemplates.map((template) => (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                isSelected={selectedTemplate === template.id}
                                onSelect={() => { setSelectedTemplate(template.id); setShowTemplateSelector(false); }}
                                viewMode={viewMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                        {filteredTemplates
                          .filter(t => !t.featured || searchQuery !== '' || selectedCategory !== 'all')
                          .map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              isSelected={selectedTemplate === template.id}
                              onSelect={() => { setSelectedTemplate(template.id); setShowTemplateSelector(false); }}
                              viewMode={viewMode}
                            />
                          ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 md:p-4 border-t border-[#1F242E] flex items-center justify-between">
                  <button className="inline-flex items-center gap-1.5 text-[#9BA0A8] hover:text-[#E8E6E1] text-xs md:text-sm font-medium transition-colors">
                    <Plus size={14} /> Create new template
                  </button>
                  <span className="text-[11px] text-[#6B727C]">{filteredTemplates.length} templates</span>
                </div>
              </div>
            )}
          </section>

          {/* ── Active uploads ───────────────────────── */}
          {files.length > 0 && (
            <section className="mb-6 md:mb-10">
              <SectionLabel icon={<FileSpreadsheet size={14} className="text-[#FF6A39]" />} hint="Files currently being processed in this session.">
                Active uploads
              </SectionLabel>
              <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
                <div className="divide-y divide-[#1F242E]">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/15">
                        <FileSpreadsheet size={15} className="text-[#FF6A39]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{f.name}</p>
                          <span className="shrink-0 text-[11px] font-mono text-[#6B727C]">{f.size}</span>
                        </div>

                        {f.status === "uploading" && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-[#1F242E] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#FF6A39] to-[#FF8A5C] transition-all duration-300"
                                style={{ width: `${f.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-[#6B727C] w-8 text-right">{Math.round(f.progress)}%</span>
                          </div>
                        )}
                        {f.status === "processing" && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-amber-400">
                            <Loader2 size={11} className="spin" /> Validating rows…
                          </p>
                        )}
                        {f.status === "success" && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                            <CheckCircle2 size={11} /> {f.rows?.toLocaleString()} recipients imported
                          </p>
                        )}
                        {f.status === "error" && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-red-400">
                            <XCircle size={11} /> {f.errorMsg}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeFile(f.id)}
                        className="shrink-0 p-1.5 rounded-lg text-[#6B727C] hover:text-[#E8E6E1] hover:bg-[#232833] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Stats summary ────────────────────────── */}
          {hasSuccessfulUpload && (
            <section className="mb-6 md:mb-10">
              <div className="rounded-2xl bg-gradient-to-br from-[#141821] to-[#10141B] ring-1 ring-[#232833] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 flex-1">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Recipients</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                        {files.filter(f => f.status === "success").reduce((acc, f) => acc + (f.rows || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Files</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                        {files.filter(f => f.status === "success").length}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Columns</p>
                      <p className="text-xs font-mono text-emerald-400 truncate">
                        {files.find(f => f.status === "success")?.headers?.join(", ") || "email, name, company, tags"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartCampaign}
                    disabled={!selectedTemplate}
                    className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                      selectedTemplate
                        ? "bg-[#FF6A39] hover:bg-[#e85a2c] text-white shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
                        : "bg-[#1A1E27] text-[#6B727C] ring-1 ring-[#232833] cursor-not-allowed"
                    }`}
                  >
                    {selectedTemplate ? "Continue to campaign" : "Select a template first"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Recent uploads ───────────────────────── */}
          <section>
            <SectionLabel icon={<Clock size={14} className="text-[#FF6A39]" />} hint="Every file you've imported, most recent first.">
              Recent uploads
            </SectionLabel>

            <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
              {uploadingLoading ? (
                <div className="text-center py-14">
                  <Loader2 className="w-7 h-7 animate-spin text-[#FF6A39] mx-auto" />
                  <p className="text-xs text-[#6B727C] mt-2">Loading your uploads…</p>
                </div>
              ) : uploadError ? (
                <div className="text-center py-14">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-red-500/10 ring-1 ring-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-xs text-red-400">{uploadError}</p>
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                    <Users className="w-6 h-6 text-[#6B727C]" />
                  </div>
                  <p className="text-sm text-[#9BA0A8]">No uploads yet</p>
                  <p className="text-xs text-[#6B727C] mt-1">Upload a CSV to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto mf-main">
                  <table className="w-full text-left" style={{ minWidth: "640px" }}>
                    <thead className="sticky top-0 bg-[#141821] z-10">
                      <tr className="text-[10px] uppercase tracking-widest text-[#6B727C]">
                        <th className="px-4 md:px-6 py-3 font-medium">File</th>
                        <th className="px-3 py-3 font-medium text-right">Rows</th>
                        <th className="px-3 py-3 font-medium text-right">Added</th>
                        <th className="px-3 py-3 font-medium text-right">Skipped</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUploads.map((u) => (
                        <tr key={u.id} className="border-t border-[#1F242E] hover:bg-[#161B25] transition-colors">
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                                <FileSpreadsheet size={13} className="text-[#9BA0A8]" />
                              </div>
                              <span className="text-[13px] font-medium text-[#E8E6E1] truncate max-w-[220px]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px] font-mono text-[#9BA0A8]">{u.rows.toLocaleString()}</td>
                          <td className="px-3 py-3.5 text-right text-[12px] font-mono text-emerald-400">{u.addedCount.toLocaleString()}</td>
                          <td className="px-3 py-3.5 text-right text-[12px] font-mono text-[#6B727C]">{u.skippedCount.toLocaleString()}</td>
                          <td className="px-3 py-3.5">
                            {u.status === "Completed"
                              ? <StatusPill tone="success"><CheckCircle2 size={10} /> Completed</StatusPill>
                              : <StatusPill tone="danger"><XCircle size={10} /> Failed</StatusPill>}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right text-[11px] text-[#6B727C] whitespace-nowrap font-mono">{u.uploadedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Upload;