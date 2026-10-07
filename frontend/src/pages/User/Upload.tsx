import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  FileSpreadsheet, CheckCircle2, XCircle, Loader2, X, Menu, Users,
  Pencil, Lock, Trash2, Upload as UploadIcon, PlayCircle,
} from "lucide-react";
import { useUpload } from "../../contexts/UploadContext";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type Status = "Uploaded" | "Running" | "Completed" | "Failed";

interface UploadCardData {
  id: number;
  name: string;
  campaignId: number;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  status: Status;
}

const toStatus = (raw?: string): Status => {
  const s = (raw ?? "").toLowerCase();
  if (["failed", "error"].includes(s)) return "Failed";
  if (["running", "processing", "sending", "in_progress"].includes(s)) return "Running";
  if (["completed", "complete", "done", "success", "sent"].includes(s)) return "Completed";
  return "Uploaded";
};

// Rename is only allowed before the file is used.
const canEdit = (s: Status) => s === "Uploaded";
// Don't delete a file while it's being processed.
const canDelete = (s: Status) => s !== "Running";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getErrorMessage = (err: any): string =>
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong.";

/* ───────────── Primitives ───────────── */

const TONES: Record<Status, { bg: string; fg: string; ring: string; icon: React.ReactNode }> = {
  Uploaded:  { bg: "rgba(96,165,250,0.10)",  fg: "#60A5FA", ring: "rgba(96,165,250,0.20)",  icon: <UploadIcon size={10} /> },
  Running:   { bg: "rgba(251,191,36,0.10)",  fg: "#FBBF24", ring: "rgba(251,191,36,0.20)",  icon: <PlayCircle size={10} /> },
  Completed: { bg: "rgba(52,211,153,0.10)",  fg: "#34D399", ring: "rgba(52,211,153,0.20)",  icon: <CheckCircle2 size={10} /> },
  Failed:    { bg: "rgba(248,113,113,0.10)", fg: "#F87171", ring: "rgba(248,113,113,0.20)", icon: <XCircle size={10} /> },
};

const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const t = TONES[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium"
      style={{ backgroundColor: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}` }}
    >
      {t.icon} {status}
    </span>
  );
};

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = "text-white" }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-1">{label}</p>
    <p className={`text-lg font-semibold ${tone}`} style={{ fontFamily: FONT.display }}>{value.toLocaleString()}</p>
  </div>
);

/* ───────────── Card ───────────── */

const UploadCard: React.FC<{
  u: UploadCardData;
  deleting: boolean;
  onRename: () => void;
  onDelete: () => void;
}> = ({ u, deleting, onRename, onDelete }) => {
  const editable = canEdit(u.status);
  const lockedReason =
    u.status === "Running" ? "Locked while the campaign is running"
    : u.status === "Completed" ? "Locked — this file has already been used"
    : "Failed files can't be renamed";

  return (
    <article className="flex flex-col rounded-2xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] transition-colors">
      <div className="flex items-start gap-3 p-4 md:p-5">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/15">
          <FileSpreadsheet size={16} className="text-[#FF6A39]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#E8E6E1] truncate" title={u.name}>{u.name}</p>
          <p className="mt-0.5 text-[11px] text-[#6B727C]">
            Campaign #{u.campaignId} · {u.uploadedAt}
          </p>
        </div>
        <StatusPill status={u.status} />
      </div>

      <div className="grid grid-cols-3 gap-4 px-4 md:px-5 pb-4">
        <Stat label="Rows" value={u.rows} />
        <Stat label="Added" value={u.addedCount} tone="text-emerald-400" />
        <Stat label="Skipped" value={u.skippedCount} tone="text-[#9BA0A8]" />
      </div>

      <div className="mt-auto flex items-center gap-2 px-4 md:px-5 py-3 border-t border-[#1F242E]">
        {editable ? (
          <button
            onClick={onRename}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#FF6A39] hover:bg-[#e85a2c] transition-colors"
          >
            <Pencil size={13} /> Rename
          </button>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-[11px] text-[#6B727C]">
            <Lock size={12} /> {lockedReason}
          </p>
        )}
        {canDelete(u.status) && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {deleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Delete
          </button>
        )}
      </div>
    </article>
  );
};

/* ───────────── Rename modal ───────────── */

const RenameModal: React.FC<{ upload: UploadCardData; onClose: () => void }> = ({ upload, onClose }) => {
  const { renameFile } = useUpload();
  const [name, setName] = useState(upload.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const unchanged = trimmed === upload.name;

  const handleSave = async () => {
    if (!trimmed || unchanged) return;
    setSaving(true);
    setError(null);
    try {
      await renameFile(upload.id, trimmed);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md flex flex-col rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-[#1F242E]">
          <p style={{ fontFamily: FONT.display }} className="flex-1 text-base font-semibold text-white">Rename file</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6B727C] hover:text-[#E8E6E1] hover:bg-[#232833] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 md:px-5 py-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full rounded-md bg-[#0D1015] px-3 py-2 text-[13px] text-[#E8E6E1] outline-none ring-1 ring-[#232833] focus:ring-[#FF6A39]"
          />
          {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-4 md:px-5 py-3 border-t border-[#1F242E]">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs font-medium text-[#C7C9CE] hover:bg-[#232833]">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !trimmed || unchanged}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#FF6A39] hover:bg-[#e85a2c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={12} className="spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────── Page ───────────── */

const Upload = () => {
  const { files: uploadedFiles, loading, error, fetchAllFiles, removeFile } = useUpload();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renaming, setRenaming] = useState<UploadCardData | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => { fetchAllFiles(); }, [fetchAllFiles]);

  const handleDelete = async (u: UploadCardData) => {
    if (!window.confirm(`Delete "${u.name}"? This can't be undone.`)) return;
    setDeletingId(u.id);
    setActionError(null);
    try {
      await removeFile(u.id);
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const uploads: UploadCardData[] = (uploadedFiles || []).map((u) => {
    const total = u.total_records ?? 0;
    const processed = u.processed_records ?? 0;
    return {
      id: u.id,
      name: u.original_filename ?? u.stored_filename ?? "Unnamed file",
      campaignId: u.campaign_id,
      rows: total,
      addedCount: processed,
      skippedCount: Math.max(total - processed, 0),
      uploadedAt: formatDate(u.created_at ?? u.updated_at),
      status: toStatus(u.status),
    };
  });

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0D1015" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .mf-main::-webkit-scrollbar { width: 8px; height: 8px; }
        .mf-main::-webkit-scrollbar-track { background: transparent; }
        .mf-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .mf-main::-webkit-scrollbar-thumb:hover { background: #333A48; }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="mf-main flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">
          <header className="flex items-start gap-3 md:gap-4 mb-6 md:mb-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mt-1 p-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }} className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight">
                Your uploads
              </h1>
              <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8] max-w-xl">
                Files you've uploaded. Files that are running or completed are locked.
              </p>
            </div>
          </header>

          {actionError && (
            <p className="mb-4 text-xs text-red-400">{actionError}</p>
          )}

          {loading ? (
            <div className="text-center py-24">
              <Loader2 className="w-7 h-7 spin text-[#FF6A39] mx-auto" />
              <p className="text-xs text-[#6B727C] mt-2">Loading your uploads…</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-red-500/10 ring-1 ring-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                <Users className="w-6 h-6 text-[#6B727C]" />
              </div>
              <p className="text-sm text-[#9BA0A8]">No uploads yet</p>
              <p className="text-xs text-[#6B727C] mt-1">Files you import will show up here.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {uploads.map((u) => (
                <UploadCard
                  key={u.id}
                  u={u}
                  deleting={deletingId === u.id}
                  onRename={() => setRenaming(u)}
                  onDelete={() => handleDelete(u)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {renaming && canEdit(renaming.status) && (
        <RenameModal upload={renaming} onClose={() => setRenaming(null)} />
      )}
    </div>
  );
};

export default Upload;