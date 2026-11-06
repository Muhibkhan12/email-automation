import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  FileSpreadsheet, CheckCircle2, XCircle, Loader2, X, Menu,
  Pencil, Lock, Trash2, Upload as UploadIcon, PlayCircle, AlertTriangle,
  Search, ChevronUp, ChevronDown, Inbox, RefreshCw, ArrowUpDown,
} from "lucide-react";
import { useUpload } from "../../contexts/UploadContext";

/* ─────────────── tokens ─────────────── */
const T = {
  bg:         "#0B0C0E",
  surface:    "#111214",
  surface2:   "#16181B",
  surfaceHi:  "#1C1F23",
  border:     "#24282E",
  borderSoft: "#1B1E22",

  text:       "#E8EAED",
  textMuted:  "#9AA0A6",
  textFaint:  "#6B7075",

  accent:     "#6EE7A8",
  accentInk:  "#0B0C0E",
  accentLine: "#2E6B4D",

  ok:         "#6EE7A8",
  warn:       "#E0A64A",
  danger:     "#E06A6A",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

type Status = "Uploaded" | "Running" | "Completed" | "Failed";

interface UploadCardData {
  id: number;
  name: string;
  campaignId: number;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  uploadedAtRaw?: string;
  status: Status;
}

const toStatus = (raw?: string): Status => {
  const s = (raw ?? "").toLowerCase();
  if (["failed", "error"].includes(s)) return "Failed";
  if (["running", "processing", "sending", "in_progress"].includes(s)) return "Running";
  if (["completed", "complete", "done", "success", "sent"].includes(s)) return "Completed";
  return "Uploaded";
};

const canEdit = (s: Status) => s === "Uploaded";
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

const STATUS_META: Record<Status, { fg: string; dot: string }> = {
  Uploaded:  { fg: T.textMuted, dot: T.textFaint },
  Running:   { fg: T.warn,      dot: T.warn },
  Completed: { fg: T.ok,        dot: T.ok },
  Failed:    { fg: T.danger,    dot: T.danger },
};

const StatusTag: React.FC<{ status: Status }> = ({ status }) => {
  const t = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] whitespace-nowrap" style={{ color: t.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.dot }} />
      {status}
    </span>
  );
};

/* ─────────────── hooks ─────────────── */

const useEscape = (onEscape: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onEscape, enabled]);
};

/* ─────────────── toast ─────────────── */

interface ToastData { id: number; tone: "success" | "error"; message: string }

const Toast: React.FC<{ toast: ToastData; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  const ok = toast.tone === "success";
  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] sm:w-[360px] flex items-start gap-3 rounded-lg px-3.5 py-3"
      style={{
        background: T.surface,
        border: HAIRLINE,
        boxShadow: "0 12px 32px -16px rgba(0,0,0,0.9)",
        animation: "unslop-toast-in 120ms ease-out",
      }}
    >
      {ok
        ? <CheckCircle2 size={14} style={{ color: T.ok }} className="mt-0.5 shrink-0" />
        : <XCircle size={14} style={{ color: T.danger }} className="mt-0.5 shrink-0" />}
      <p className="flex-1 text-[12.5px]" style={{ color: T.text }}>{toast.message}</p>
      <button
        onClick={onClose}
        style={{ color: T.textFaint }}
        className="transition-colors duration-[120ms]"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/* ─────────────── modal shell ─────────────── */

const ModalShell: React.FC<{
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}> = ({ onClose, busy, children }) => {
  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(close);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6"
      style={{ background: "rgba(11,12,14,0.78)" }}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md flex flex-col rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          border: HAIRLINE,
          boxShadow: "0 16px 48px -24px rgba(0,0,0,0.9)",
          animation: "unslop-modal-fade 120ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

/* ─────────────── rename modal ─────────────── */

const RenameModal: React.FC<{
  upload: UploadCardData;
  onClose: () => void;
  onDone: (msg: string) => void;
}> = ({ upload, onClose, onDone }) => {
  const { renameFile } = useUpload();
  const [name, setName] = useState(upload.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const unchanged = trimmed === upload.name;

  const handleSave = async () => {
    if (!trimmed || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      await renameFile(upload.id, trimmed);
      onDone("File renamed.");
    } catch (e) {
      setError(getErrorMessage(e));
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} busy={saving}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: HAIRLINE_SOFT }}>
        <Pencil size={14} style={{ color: T.textMuted }} />
        <p className="flex-1 text-[14px] font-medium" style={{ color: T.text }}>Rename file</p>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-1.5 rounded-md transition-colors duration-[120ms]"
          style={{ color: T.textFaint }}
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-5 py-5">
        <label className="block text-[12px] mb-2" style={{ color: T.textMuted }}>
          File name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full rounded-md px-3 py-2 text-[13px] outline-none transition-colors duration-[120ms]"
          style={{ background: T.surface2, color: T.text, border: HAIRLINE }}
          onFocus={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
          onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
        />
        {error && <p className="mt-2.5 text-[11.5px]" style={{ color: T.danger }}>{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: HAIRLINE_SOFT }}>
        <button
          onClick={onClose}
          disabled={saving}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
          style={{ color: T.textMuted, border: HAIRLINE }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !trimmed || unchanged}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: T.text, color: T.accentInk, border: `1px solid ${T.text}` }}
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Save
        </button>
      </div>
    </ModalShell>
  );
};

/* ─────────────── delete modal ─────────────── */

const DeleteModal: React.FC<{
  upload: UploadCardData;
  onClose: () => void;
  onDone: (msg: string) => void;
}> = ({ upload, onClose, onDone }) => {
  const { removeFile } = useUpload();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await removeFile(upload.id);
      onDone(`"${upload.name}" deleted.`);
    } catch (e) {
      setError(getErrorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} busy={deleting}>
      <div className="px-5 pt-6 pb-4 text-center">
        <div
          className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
          style={{ background: T.surfaceHi, border: HAIRLINE }}
        >
          <AlertTriangle size={16} style={{ color: T.danger }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: T.text }}>Delete this file</p>
        <p className="mt-1.5 text-[12.5px] leading-5" style={{ color: T.textMuted }}>
          <span style={{ color: T.text }} className="break-all">{upload.name}</span> and its{" "}
          <span style={{ fontFamily: FONT.mono, color: T.text }}>{upload.rows.toLocaleString()}</span> rows
          will be permanently removed. This cannot be undone.
        </p>
        {error && <p className="mt-3 text-[11.5px]" style={{ color: T.danger }}>{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: HAIRLINE_SOFT }}>
        <button
          onClick={onClose}
          disabled={deleting}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
          style={{ color: T.textMuted, border: HAIRLINE }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "transparent", color: T.danger, border: `1px solid ${T.border}` }}
        >
          {deleting && <Loader2 size={12} className="animate-spin" />}
          Delete
        </button>
      </div>
    </ModalShell>
  );
};

/* ─────────────── capacity bar (added vs skipped, stacked) ─────────────── */

const CapacityBar: React.FC<{ added: number; skipped: number; failed?: boolean }> = ({ added, skipped, failed }) => {
  const total = added + skipped;
  const addedPct = total > 0 ? (added / total) * 100 : 0;
  const addedColor = failed ? T.danger : T.ok;
  return (
    <div className="w-full flex items-center gap-2">
      <div
        className="relative h-1.5 flex-1 rounded-full overflow-hidden"
        style={{ background: T.surfaceHi }}
        role="presentation"
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${addedPct}%`, background: addedColor }}
        />
      </div>
      <span
        className="text-[10.5px] tabular-nums shrink-0"
        style={{ color: T.textFaint, fontFamily: FONT.mono }}
      >
        {Math.round(addedPct)}%
      </span>
    </div>
  );
};

/* ─────────────── live row (running files) ─────────────── */

const LiveRow: React.FC<{ u: UploadCardData }> = ({ u }) => {
  const total = u.rows;
  const added = u.addedCount;
  const pct = total > 0 ? Math.round((added / total) * 100) : 0;

  return (
    <div
      className="relative rounded-lg p-4"
      style={{ background: T.surface2, border: HAIRLINE }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: T.accent }}
      />
      <div className="flex items-start gap-3">
        <FileSpreadsheet size={14} strokeWidth={1.5} style={{ color: T.textFaint }} className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>{u.name}</p>
            <span
              className="text-[12px] tabular-nums shrink-0"
              style={{ color: T.accent, fontFamily: FONT.mono }}
            >
              {pct}%
            </span>
          </div>
          <div className="mt-2">
            <CapacityBar added={added} skipped={u.skippedCount} />
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            {added.toLocaleString()} / {total.toLocaleString()} processed · #{u.id} · campaign #{u.campaignId}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── library row ─────────────── */

const LibraryRow: React.FC<{
  u: UploadCardData;
  onRename: () => void;
  onDelete: () => void;
}> = ({ u, onRename, onDelete }) => {
  const editable = canEdit(u.status);
  const deletable = canDelete(u.status);
  const lockedReason =
    u.status === "Completed" ? "Already used"
    : "Cannot be renamed";

  return (
    <div
      className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 md:px-5 py-3 transition-colors duration-[120ms]"
      onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Identity */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <FileSpreadsheet size={14} strokeWidth={1.5} style={{ color: T.textFaint }} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: T.text }} title={u.name}>
            {u.name}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            #{u.id} · campaign #{u.campaignId}
          </p>
        </div>
      </div>

      {/* Capacity */}
      <div className="w-full md:w-[200px] shrink-0">
        <CapacityBar added={u.addedCount} skipped={u.skippedCount} failed={u.status === "Failed"} />
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10.5px] tabular-nums" style={{ color: T.ok, fontFamily: FONT.mono }}>
            {u.addedCount.toLocaleString()} added
          </span>
          <span className="text-[10.5px] tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
            {u.skippedCount.toLocaleString()} skipped
          </span>
        </div>
      </div>

      {/* Status + meta */}
      <div className="w-full md:w-[220px] shrink-0 flex items-center justify-between md:justify-end gap-4">
        <div className="flex flex-col items-start md:items-end gap-1">
          <StatusTag status={u.status} />
          <span className="text-[10.5px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            {u.rows.toLocaleString()} rows · {u.uploadedAt}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 shrink-0">
        {editable ? (
          <button
            onClick={onRename}
            className="p-1.5 rounded-md transition-colors duration-[120ms]"
            style={{ color: T.textFaint }}
            title="Rename file"
            aria-label="Rename file"
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.background = "transparent" }}
          >
            <Pencil size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <span
            className="p-1.5"
            style={{ color: T.textFaint }}
            title={lockedReason}
          >
            <Lock size={13} strokeWidth={1.5} />
          </span>
        )}
        {deletable && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md transition-colors duration-[120ms]"
            style={{ color: T.textFaint }}
            title="Delete file"
            aria-label="Delete file"
            onMouseEnter={(e) => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.surfaceHi }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.background = "transparent" }}
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────── page ─────────────── */

type SortKey = "name" | "rows" | "added" | "uploadedAt" | "status";

const Upload = () => {
  const { files: uploadedFiles, loading, error, fetchAllFiles } = useUpload();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renaming, setRenaming] = useState<UploadCardData | null>(null);
  const [deleting, setDeleting] = useState<UploadCardData | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("uploadedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => { fetchAllFiles(); }, [fetchAllFiles]);

  const notify = (tone: ToastData["tone"], message: string) =>
    setToast({ id: Date.now(), tone, message });
  const closeToast = useCallback(() => setToast(null), []);

  const uploads: UploadCardData[] = useMemo(() => (uploadedFiles || []).map((u) => {
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
      uploadedAtRaw: u.created_at ?? u.updated_at,
      status: toStatus(u.status),
    };
  }), [uploadedFiles]);

  const running = useMemo(() => uploads.filter((u) => u.status === "Running"), [uploads]);
  const library = useMemo(() => uploads.filter((u) => u.status !== "Running"), [uploads]);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = library;
    if (q) {
      list = library.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        String(u.id).includes(q) ||
        String(u.campaignId).includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const sign = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":       return sign * a.name.localeCompare(b.name);
        case "rows":       return sign * (a.rows - b.rows);
        case "added":      return sign * (a.addedCount - b.addedCount);
        case "status":     return sign * a.status.localeCompare(b.status);
        case "uploadedAt":
        default:           return sign * (new Date(a.uploadedAtRaw ?? 0).getTime() - new Date(b.uploadedAtRaw ?? 0).getTime());
      }
    });
  }, [library, query, sortKey, sortDir]);

  const totals = useMemo(() => {
    const t = { rows: 0, added: 0, skipped: 0, completed: 0, running: 0 };
    uploads.forEach((u) => {
      t.rows += u.rows;
      t.added += u.addedCount;
      t.skipped += u.skippedCount;
      if (u.status === "Completed") t.completed++;
      if (u.status === "Running") t.running++;
    });
    return t;
  }, [uploads]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortChip: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] transition-colors duration-[120ms]"
        style={{
          background: active ? T.surface2 : "transparent",
          color: active ? T.text : T.textMuted,
          border: active ? HAIRLINE_SOFT : "1px solid transparent",
        }}
      >
        {label}
        {active && (sortDir === "asc"
          ? <ChevronUp size={11} strokeWidth={1.5} style={{ color: T.accentLine }} />
          : <ChevronDown size={11} strokeWidth={1.5} style={{ color: T.accentLine }} />
        )}
      </button>
    );
  };

  const hasAny = uploads.length > 0;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .uf-main::-webkit-scrollbar { width: 8px; height: 8px; }
        .uf-main::-webkit-scrollbar-track { background: transparent; }
        .uf-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .uf-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .uf-input::placeholder { color: ${T.textFaint}; }
        .uf-input:focus { outline: none; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }

        @keyframes unslop-toast-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes unslop-modal-fade { from { opacity: 0; } to { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="uf-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1200 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: totals.running > 0 ? T.accent : T.textFaint }}
                    />
                    {totals.running} running
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {uploads.length} files
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Uploads
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Imports in flight, and everything they produced.
                </p>
              </div>
            </div>

            {/* Compact totals */}
            {hasAny && (
              <div className="flex items-center gap-6">
                {[
                  { label: "Rows",    value: totals.rows,    tone: T.text },
                  { label: "Added",   value: totals.added,   tone: T.ok },
                  { label: "Skipped", value: totals.skipped, tone: T.textMuted },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10.5px]" style={{ color: T.textFaint }}>{s.label}</p>
                    <p
                      className="text-[16px] font-medium mt-1 leading-none tabular-nums"
                      style={{ color: s.tone, fontFamily: FONT.mono }}
                    >
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* Live band */}
          {running.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                <p className="text-[12px]" style={{ color: T.textMuted }}>In flight</p>
                <span className="text-[12px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  · {running.length}
                </span>
              </div>
              <div className="space-y-2">
                {running.map((u) => (
                  <LiveRow key={u.id} u={u} />
                ))}
              </div>
            </section>
          )}

          {/* Library */}
          <section>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <p className="text-[12px]" style={{ color: T.textMuted }}>Library</p>
                <span className="text-[12px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  · {library.length}
                </span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
              {/* Library header strip */}
              <div
                className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 md:px-5 py-3"
                style={{ borderBottom: HAIRLINE_SOFT }}
              >
                <div
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 flex-1 min-w-0 transition-colors duration-[120ms]"
                  style={{ background: T.surface2, border: HAIRLINE_SOFT }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
                >
                  <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by file name, id or campaign"
                    className="uf-input w-full bg-transparent text-[12.5px] outline-none"
                    style={{ color: T.text }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="shrink-0 text-[11px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
                      style={{ color: T.textFaint }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto shrink-0">
                  <SortChip k="name"       label="File"     />
                  <SortChip k="rows"       label="Rows"     />
                  <SortChip k="uploadedAt" label="Uploaded" />
                </div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="text-center py-16">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: T.border, borderTopColor: T.accent }}
                  />
                  <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading uploads</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <XCircle size={18} className="mx-auto mb-3" style={{ color: T.danger }} />
                  <p className="text-[13px] mb-4" style={{ color: T.danger }}>{error}</p>
                  <button
                    onClick={() => fetchAllFiles()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
                    style={{ color: T.textMuted, border: HAIRLINE }}
                  >
                    <RefreshCw size={12} /> Try again
                  </button>
                </div>
              ) : !hasAny ? (
                <div className="text-center py-16 px-4">
                  <div
                    className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                    style={{ background: T.surfaceHi, border: HAIRLINE }}
                  >
                    <Inbox size={18} style={{ color: T.textFaint }} />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: T.text }}>No uploads yet</p>
                  <p className="text-[12.5px] mt-1.5" style={{ color: T.textMuted }}>
                    Files you import will appear here.
                  </p>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Search size={18} className="mx-auto mb-3" style={{ color: T.textFaint }} />
                  <p className="text-[12.5px]" style={{ color: T.textMuted }}>No files match your search.</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-3 text-[11.5px] font-medium px-3 py-1.5 rounded-md transition-colors duration-[120ms]"
                    style={{ color: T.textMuted, border: HAIRLINE }}
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div>
                  {filteredLibrary.map((u, i) => (
                    <div key={u.id} style={{ borderTop: i === 0 ? "none" : HAIRLINE_SOFT }}>
                      <LibraryRow
                        u={u}
                        onRename={() => setRenaming(u)}
                        onDelete={() => setDeleting(u)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {renaming && canEdit(renaming.status) && (
        <RenameModal
          upload={renaming}
          onClose={() => setRenaming(null)}
          onDone={(msg) => { setRenaming(null); notify("success", msg); }}
        />
      )}

      {deleting && canDelete(deleting.status) && (
        <DeleteModal
          upload={deleting}
          onClose={() => setDeleting(null)}
          onDone={(msg) => { setDeleting(null); notify("success", msg); }}
        />
      )}

      {toast && <Toast toast={toast} onClose={closeToast} />}
    </div>
  );
};

export default Upload;