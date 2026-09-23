import React, { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  X, Info, ChevronRight, Menu, ArrowRight, FileText, Users, Clock, Check,
} from "lucide-react";
import { useUpload } from "../../contexts/UploadContext";
import type { UploadResult } from "../../services/UploadServices";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED = /\.(csv|xlsx|xls)$/i;

// Where "Next" goes. Change to match your router.
const TEMPLATES_ROUTE = (campaignId: string) => `/user/campaign/${campaignId}/templates`;

type UploadStatus = "uploading" | "processing" | "success" | "error";

interface CurrentUpload {
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  uploadId?: number | string;
  rows?: number;
  headers?: string[];
  preview?: Record<string, any>[];
  errorMsg?: string;
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

const STEPS = ["Campaign", "Recipients", "Template", "Account", "Send"];

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

const getErrorMessage = (err: any): string =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Upload failed. Please try again.";

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

const StatusPill: React.FC<{ tone: "success" | "danger"; children: React.ReactNode }> = ({ tone, children }) => {
  const map = {
    success: { bg: "rgba(52,211,153,0.10)", fg: "#34D399", ring: "rgba(52,211,153,0.20)" },
    danger: { bg: "rgba(248,113,113,0.10)", fg: "#F87171", ring: "rgba(248,113,113,0.20)" },
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

/* Step indicator: Campaign > Recipients > Template > Account > Send */
const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-6 md:mb-8">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
              done
                ? "bg-emerald-400/15 text-emerald-400 ring-1 ring-emerald-400/30"
                : active
                ? "bg-[#FF6A39] text-white"
                : "bg-[#1A1E27] text-[#6B727C] ring-1 ring-[#232833]"
            }`}
          >
            {done ? <Check size={11} /> : i + 1}
          </span>
          <span className={`text-xs ${active ? "text-white font-medium" : done ? "text-[#9BA0A8]" : "text-[#6B727C]"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="w-6 h-px bg-[#232833]" />}
        </li>
      );
    })}
  </ol>
);

/* ─────────────────────────────────────────────────────────
   Main Upload page
   ───────────────────────────────────────────────────────── */

const Upload = () => {
  const navigate = useNavigate();
  // Route should look like /user/campaign/:campaignId/upload
  const { campaignId } = useParams<{ campaignId: string }>();

  const {
    files: uploadedFiles,
    loading: uploadingLoading,
    error: uploadError,
    fetchAllFiles,
    upload,
  } = useUpload();

  const [current, setCurrent] = useState<CurrentUpload | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAllFiles(); }, [fetchAllFiles]);

  const patch = (p: Partial<CurrentUpload>) =>
    setCurrent(prev => (prev ? { ...prev, ...p } : prev));

  const startUpload = useCallback(
    async (file: File) => {
      if (!campaignId) return;

      setCurrent({ name: file.name, size: formatSize(file.size), progress: 0, status: "uploading" });

      try {
        const result: UploadResult = await upload(campaignId, file, (pct) => {
          // Bytes are all sent -> server is now extracting the rows
          if (pct >= 100) patch({ progress: 100, status: "processing" });
          else patch({ progress: pct });
        });

        const failed = ["failed", "error"].includes(String(result?.status ?? "").toLowerCase());
        if (failed) {
          patch({ status: "error", errorMsg: result?.error_message || "File could not be processed" });
          return;
        }

        patch({
          status: "success",
          progress: 100,
          uploadId: result?.id,
          rows: result?.processed_records ?? result?.total_records ?? 0,
          headers: result?.headers,
          preview: result?.preview,
        });
      } catch (err) {
        patch({ status: "error", errorMsg: getErrorMessage(err) });
      }
    },
    [campaignId, upload]
  );

  const addFile = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0]; // one recipients file per campaign

      if (!ACCEPTED.test(file.name)) {
        setCurrent({ name: file.name, size: formatSize(file.size), progress: 0, status: "error", errorMsg: "Unsupported type. Use CSV, XLSX or XLS." });
      } else if (file.size > MAX_FILE_SIZE) {
        setCurrent({ name: file.name, size: formatSize(file.size), progress: 0, status: "error", errorMsg: "File exceeds the 25 MB limit." });
      } else {
        startUpload(file);
      }

      if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    },
    [startUpload]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    addFile(e.dataTransfer.files);
  };

  const isBusy = current?.status === "uploading" || current?.status === "processing";
  const canContinue = current?.status === "success" && !!campaignId;

  const handleNext = () => {
    if (!canContinue || !campaignId) return;
    navigate(TEMPLATES_ROUTE(campaignId), {
      state: { uploadId: current?.uploadId, recipients: current?.rows },
    });
  };

  const recentUploads: RecentUpload[] = (uploadedFiles || []).map((u: any) => {
    const total = u.total_records ?? 0;
    const processed = u.processed_records ?? 0;
    const st = (u.status ?? "").toLowerCase();
    return {
      id: String(u.id),
      name: u.original_filename ?? u.stored_filename ?? "Unnamed file",
      rows: total,
      addedCount: processed,
      skippedCount: Math.max(total - processed, 0),
      uploadedAt: formatDate(u.created_at ?? u.updated_at),
      status: st === "failed" || st === "error" ? "Failed" : "Completed",
    };
  });

  const previewHeaders =
    current?.headers?.length
      ? current.headers
      : current?.preview?.[0]
      ? Object.keys(current.preview[0])
      : [];

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
        .mf-main::-webkit-scrollbar { width: 8px; height: 8px; }
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
      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className="mf-main flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ───────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
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
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#FF6A39]">Recipients</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Import your recipients
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8] max-w-xl">
                  Upload a CSV or Excel file. We read it as soon as it lands, so you can check the data before moving on.
                </p>
              </div>
            </div>

            {canContinue && (
              <button
                onClick={handleNext}
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all bg-[#FF6A39] hover:bg-[#e85a2c] text-white shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
              >
                Next: choose template
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </header>

          <Stepper current={1} />

          {/* No campaign in the URL */}
          {!campaignId && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-500/5 ring-1 ring-red-500/25 px-4 py-3">
              <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs md:text-[13px] text-[#C7C9CE]">
                No campaign selected. Create a campaign first, then upload recipients to it.
                <button onClick={() => navigate("/user/campaign")} className="ml-2 text-[#FF6A39] font-medium hover:underline">
                  Go to campaigns
                </button>
              </div>
            </div>
          )}

          {/* ── Dropzone ─────────────────────────────── */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (campaignId && !isBusy) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => { if (campaignId && !isBusy) inputRef.current?.click(); }}
            className={`relative mb-4 md:mb-5 rounded-2xl transition-all duration-200 overflow-hidden ${
              !campaignId || isBusy ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            } ${
              isDragging
                ? "bg-[#FF6A39]/5 ring-1 ring-[#FF6A39]/60 drag-ring"
                : "bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48]"
            }`}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ background: "radial-gradient(600px 120px at 50% 0%, rgba(255,106,57,0.08), transparent 60%)" }}
            />
            <div className="relative px-6 py-10 md:py-14 lg:py-16 flex flex-col items-center text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => addFile(e.target.files)}
              />

              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isDragging ? "scale-110" : ""}`}
                style={{ background: "linear-gradient(135deg, rgba(255,106,57,0.22), rgba(255,106,57,0.06))", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.25)" }}
              >
                <UploadCloud size={26} className="text-[#FF6A39]" />
              </div>

              <p style={{ fontFamily: FONT.display }} className="text-lg md:text-xl font-semibold text-white">
                {isDragging ? "Drop your file to begin" : current?.status === "success" ? "Replace your file" : "Drag & drop your file"}
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
              Required column: <span className="font-mono text-[#FF6A39]">email</span>. Any other columns
              (like <span className="font-mono text-[#E8E6E1]">name</span> or{" "}
              <span className="font-mono text-[#E8E6E1]">company</span>) can be used as variables in your template.
            </p>
          </div>

          {/* ── Current upload ───────────────────────── */}
          {current && (
            <section className="mb-6 md:mb-10 fade-in">
              <SectionLabel icon={<FileSpreadsheet size={14} className="text-[#FF6A39]" />} hint="Extracted from your file.">
                Uploaded file
              </SectionLabel>

              <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
                <div className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/15">
                    <FileSpreadsheet size={15} className="text-[#FF6A39]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{current.name}</p>
                      <span className="shrink-0 text-[11px] font-mono text-[#6B727C]">{current.size}</span>
                    </div>

                    {current.status === "uploading" && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[#1F242E] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF6A39] to-[#FF8A5C] transition-all duration-300"
                            style={{ width: `${current.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#6B727C] w-8 text-right">{Math.round(current.progress)}%</span>
                      </div>
                    )}
                    {current.status === "processing" && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-amber-400">
                        <Loader2 size={11} className="spin" /> Reading recipients…
                      </p>
                    )}
                    {current.status === "success" && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 size={11} /> {current.rows?.toLocaleString()} recipients imported
                      </p>
                    )}
                    {current.status === "error" && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-red-400">
                        <XCircle size={11} /> {current.errorMsg}
                      </p>
                    )}
                  </div>

                  {!isBusy && (
                    <button
                      onClick={() => setCurrent(null)}
                      className="shrink-0 p-1.5 rounded-lg text-[#6B727C] hover:text-[#E8E6E1] hover:bg-[#232833] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Extracted details from the backend */}
                {current.status === "success" && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-4 md:px-5 py-4 border-t border-[#1F242E]">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Recipients</p>
                        <p className="text-2xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                          {current.rows?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Columns</p>
                        <p className="text-2xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                          {previewHeaders.length || "—"}
                        </p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1.5">Fields found</p>
                        <p className="text-xs font-mono text-emerald-400 break-words">
                          {previewHeaders.length ? previewHeaders.join(", ") : "—"}
                        </p>
                      </div>
                    </div>

                    {current.preview && current.preview.length > 0 && (
                      <div className="border-t border-[#1F242E]">
                        <p className="px-4 md:px-5 pt-3 text-[11px] text-[#6B727C]">
                          Preview · first {current.preview.length} rows
                        </p>
                        <div className="overflow-x-auto mf-main">
                          <table className="w-full text-left" style={{ minWidth: "520px" }}>
                            <thead>
                              <tr className="text-[10px] uppercase tracking-widest text-[#6B727C]">
                                {previewHeaders.map(h => (
                                  <th key={h} className="px-4 md:px-5 py-2.5 font-medium whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {current.preview.map((row, i) => (
                                <tr key={i} className="border-t border-[#1F242E]">
                                  {previewHeaders.map(h => (
                                    <td key={h} className="px-4 md:px-5 py-2.5 text-[12px] font-mono text-[#C7C9CE] whitespace-nowrap">
                                      {String(row[h] ?? "")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="px-4 md:px-5 py-4 border-t border-[#1F242E] flex justify-end">
                      <button
                        onClick={handleNext}
                        className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all bg-[#FF6A39] hover:bg-[#e85a2c] text-white shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
                      >
                        Next: choose template
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </>
                )}
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