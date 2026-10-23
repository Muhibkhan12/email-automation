import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  FileSpreadsheet, CheckCircle2, XCircle, Loader2, X, Menu, Users,
  Pencil, Lock, Trash2, Upload as UploadIcon, PlayCircle, AlertTriangle,
  Search, MoreHorizontal, ArrowUpDown, FileText, ChevronDown,
} from "lucide-react";
import { useUpload } from "../../contexts/UploadContext";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  surface:     "#111319",
  surface2:    "#161922",
  surfaceHi:   "#1B1F2A",
  border:      "#232838",
  borderSoft:  "#1B1F2A",
  text:        "#E9EBF0",
  textMuted:   "#9CA3B4",
  textFaint:   "#6B7280",
  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

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

/* ─────────────── status meta ─────────────── */

const STATUS_META: Record<Status, { bg: string; fg: string; ring: string; icon: React.ReactNode }> = {
  Uploaded:  { bg: T.infoSoft,    fg: T.info,    ring: T.infoBorder,    icon: <UploadIcon size={9} /> },
  Running:   { bg: T.warnSoft,    fg: T.warn,    ring: T.warnBorder,    icon: <PlayCircle size={9} /> },
  Completed: { bg: T.successSoft, fg: T.success, ring: T.successBorder, icon: <CheckCircle2 size={9} /> },
  Failed:    { bg: T.dangerSoft,  fg: T.danger,  ring: T.dangerBorder,  icon: <XCircle size={9} /> },
};

const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const t = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}` }}
    >
      {t.icon}
      {status}
    </span>
  );
};

/* ─────────────── escape hook ─────────────── */

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
        boxShadow: `0 20px 40px -12px rgba(0,0,0,0.6), inset 0 0 0 1px ${ok ? T.successBorder : T.dangerBorder}`,
        animation: "toastIn 0.2s ease-out",
      }}
    >
      {ok
        ? <CheckCircle2 size={15} style={{ color: T.success }} className="mt-0.5 shrink-0" />
        : <XCircle size={15} style={{ color: T.danger }} className="mt-0.5 shrink-0" />}
      <p className="flex-1 text-[12.5px]" style={{ color: T.text }}>{toast.message}</p>
      <button
        onClick={onClose}
        style={{ color: T.textFaint }}
        className="hover:text-white transition-colors"
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 bg-black/70"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md flex flex-col rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 64px -16px rgba(0,0,0,0.7)`,
          animation: "modalPop 0.15s ease",
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
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: T.brandSoft, color: T.brand }}
        >
          <Pencil size={13} />
        </div>
        <p className="flex-1 text-[14px] font-semibold" style={{ color: T.text }}>Rename file</p>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
          style={{ color: T.textFaint }}
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-4 py-4">
        <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
          File name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full rounded-md px-3 py-2 text-[13px] outline-none transition-shadow"
          style={{ background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
          onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
        />
        {error && <p className="mt-2 text-[11.5px]" style={{ color: T.danger }}>{error}</p>}
      </div>

      <div
        className="flex items-center justify-end gap-2 px-4 py-3"
        style={{ borderTop: `1px solid ${T.borderSoft}` }}
      >
        <button
          onClick={onClose}
          disabled={saving}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5"
          style={{ color: T.textMuted }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !trimmed || unchanged}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={{ background: T.brand }}
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
          className="w-11 h-11 mx-auto mb-3 rounded-lg flex items-center justify-center"
          style={{ background: T.dangerSoft, color: T.danger }}
        >
          <AlertTriangle size={18} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: T.text }}>Delete this file?</p>
        <p className="mt-1.5 text-[12.5px] leading-5" style={{ color: T.textMuted }}>
          <span style={{ color: T.text }} className="font-medium break-all">{upload.name}</span> and its{" "}
          {upload.rows.toLocaleString()} rows will be permanently removed. This can't be undone.
        </p>
        {error && <p className="mt-3 text-[11.5px]" style={{ color: T.danger }}>{error}</p>}
      </div>

      <div
        className="flex items-center justify-end gap-2 px-4 py-3"
        style={{ borderTop: `1px solid ${T.borderSoft}` }}
      >
        <button
          onClick={onClose}
          disabled={deleting}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5"
          style={{ color: T.textMuted }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: T.danger }}
        >
          {deleting && <Loader2 size={12} className="animate-spin" />}
          Delete
        </button>
      </div>
    </ModalShell>
  );
};

/* ─────────────── row ─────────────── */

const UploadRow: React.FC<{
  u: UploadCardData;
  onRename: () => void;
  onDelete: () => void;
}> = ({ u, onRename, onDelete }) => {
  const editable = canEdit(u.status);
  const deletable = canDelete(u.status);
  const lockedReason =
    u.status === "Running" ? "Locked while running"
    : u.status === "Completed" ? "Already used"
    : "Can't be renamed";

  const processedPct = u.rows > 0 ? Math.round((u.addedCount / u.rows) * 100) : 0;

  return (
    <tr
      className="transition-colors hover:bg-white/[0.02] group"
      style={{ borderTop: `1px solid ${T.borderSoft}` }}
    >
      {/* File */}
      <td className="px-4 md:px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: T.brandSoft, color: T.brand }}
          >
            <FileSpreadsheet size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }} title={u.name}>
              {u.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              #{u.id} · Campaign #{u.campaignId}
            </p>
          </div>
        </div>
      </td>

      {/* Rows */}
      <td className="px-3 py-3 text-right">
        <p className="text-[12px] tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
          {u.rows.toLocaleString()}
        </p>
      </td>

      {/* Added / Skipped */}
      <td className="px-3 py-3 text-right hidden lg:table-cell">
        <div className="inline-flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
            <span className="text-[11.5px] tabular-nums" style={{ color: T.success, fontFamily: FONT.mono }}>
              {u.addedCount.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: T.textFaint }}>·</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.textMuted }} />
            <span className="text-[11.5px] tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
              {u.skippedCount.toLocaleString()}
            </span>
          </div>
        </div>
      </td>

      {/* Progress (subtle bar) */}
      <td className="px-3 py-3 hidden xl:table-cell">
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${processedPct}%`,
                background: u.status === "Failed" ? T.danger : u.status === "Completed" ? T.success : T.brand,
              }}
            />
          </div>
          <span className="text-[10.5px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            {processedPct}%
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusPill status={u.status} />
      </td>

      {/* Uploaded at */}
      <td className="px-3 py-3 text-right hidden md:table-cell">
        <p className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
          {u.uploadedAt}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 md:px-5 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {editable ? (
            <button
              onClick={onRename}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              title="Rename file"
            >
              <Pencil size={11} />
              <span className="hidden md:inline">Rename</span>
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]"
              style={{ color: T.textFaint }}
              title={lockedReason}
            >
              <Lock size={11} />
              <span className="hidden md:inline">{lockedReason}</span>
            </span>
          )}
          {deletable && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
              style={{ color: T.danger }}
              title="Delete file"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

/* ─────────────── mobile card (kept for small screens) ─────────────── */

const UploadMobileCard: React.FC<{
  u: UploadCardData;
  onRename: () => void;
  onDelete: () => void;
}> = ({ u, onRename, onDelete }) => {
  const editable = canEdit(u.status);
  const deletable = canDelete(u.status);

  return (
    <div className="rounded-xl p-3.5" style={{ background: T.surface, boxShadow: RING }}>
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: T.brandSoft, color: T.brand }}
        >
          <FileSpreadsheet size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{u.name}</p>
          <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            #{u.id} · {u.uploadedAt}
          </p>
        </div>
        <StatusPill status={u.status} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <div>
          <p className="text-[9.5px] uppercase tracking-wider" style={{ color: T.textFaint }}>Rows</p>
          <p className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
            {u.rows.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-wider" style={{ color: T.textFaint }}>Added</p>
          <p className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.success, fontFamily: FONT.mono }}>
            {u.addedCount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-wider" style={{ color: T.textFaint }}>Skipped</p>
          <p className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
            {u.skippedCount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        {editable && (
          <button
            onClick={onRename}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <Pencil size={11} /> Rename
          </button>
        )}
        {deletable && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ color: T.danger, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <Trash2 size={11} /> Delete
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = uploads;
    if (q) {
      list = uploads.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        String(u.id).includes(q) ||
        String(u.campaignId).includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
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
    return sorted;
  }, [uploads, query, sortKey, sortDir]);

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

  const SortHead: React.FC<{ k: SortKey; label: string; align?: "left" | "right"; className?: string }> =
    ({ k, label, align = "left", className = "" }) => {
      const active = sortKey === k;
      return (
        <th className={`px-3 py-2.5 font-medium ${align === "right" ? "text-right" : ""} ${className}`}>
          <button
            onClick={() => toggleSort(k)}
            className={`inline-flex items-center gap-1 transition-colors hover:text-white ${align === "right" ? "flex-row-reverse" : ""}`}
            style={{ color: active ? T.text : T.textFaint }}
          >
            {label}
            <ArrowUpDown size={10} style={{ color: active ? T.brand : T.textFaint, opacity: active ? 1 : 0.5 }} />
          </button>
        </th>
      );
    };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
        .uf-main::-webkit-scrollbar { width: 8px; height: 8px; }
        .uf-main::-webkit-scrollbar-track { background: transparent; }
        .uf-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .uf-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        @media (max-width: 767px) { .uf-table { display: none; } }
        @media (min-width: 768px) { .uf-mobile { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .spin, [style*="toastIn"], [style*="modalPop"] { animation: none !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="uf-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {totals.completed} completed
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {uploads.length} files
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Your uploads
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Files you've uploaded. Running or completed files are locked.
                </p>
              </div>
            </div>
          </header>

          {/* Summary strip */}
          {uploads.length > 0 && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 mb-5 md:mb-6 rounded-xl overflow-hidden"
              style={{ background: T.surface, boxShadow: RING }}
            >
              <SummaryTile label="Files" value={uploads.length} />
              <SummaryTile label="Rows" value={totals.rows} tone={T.text} />
              <SummaryTile label="Added" value={totals.added} tone={T.success} />
              <SummaryTile label="Skipped" value={totals.skipped} tone={T.textMuted} />
            </div>
          )}

          {/* Toolbar */}
          {uploads.length > 0 && (
            <div className="mb-4 flex items-center gap-2.5">
              <div
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 flex-1 min-w-0 transition-shadow"
                style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.border}`)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by file name, ID, or campaign…"
                  className="w-full bg-transparent text-[12.5px] outline-none"
                  style={{ color: T.text }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: T.textFaint }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-5 h-5 spin mx-auto" style={{ color: T.brand }} />
              <p className="text-[11.5px] mt-2.5" style={{ color: T.textFaint }}>Loading your uploads…</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-xl"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.18)" }}
              >
                <XCircle className="w-4 h-4" style={{ color: T.danger }} />
              </div>
              <p className="text-[12.5px]" style={{ color: T.danger }}>{error}</p>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-20 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}>
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2 }}
              >
                <Users className="w-5 h-5" style={{ color: T.textFaint }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>No uploads yet</p>
              <p className="text-[12px] mt-1.5" style={{ color: T.textMuted }}>
                Files you import will show up here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}>
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2 }}
              >
                <Search className="w-4 h-4" style={{ color: T.textFaint }} />
              </div>
              <p className="text-[12.5px]" style={{ color: T.textMuted }}>
                No files match your search.
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-2.5 text-[11.5px] font-medium"
                style={{ color: T.brand }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="uf-table rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest">
                        <SortHead k="name" label="File" />
                        <SortHead k="rows" label="Rows" align="right" />
                        <th className="px-3 py-2.5 font-medium text-right hidden lg:table-cell" style={{ color: T.textFaint }}>
                          Added / Skipped
                        </th>
                        <th className="px-3 py-2.5 font-medium hidden xl:table-cell" style={{ color: T.textFaint }}>
                          Progress
                        </th>
                        <SortHead k="status" label="Status" />
                        <SortHead k="uploadedAt" label="Uploaded" align="right" className="hidden md:table-cell" />
                        <th className="px-4 md:px-5 py-2.5 font-medium text-right w-[120px]" style={{ color: T.textFaint }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <UploadRow
                          key={u.id}
                          u={u}
                          onRename={() => setRenaming(u)}
                          onDelete={() => setDeleting(u)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="uf-mobile space-y-2.5">
                {filtered.map((u) => (
                  <UploadMobileCard
                    key={u.id}
                    u={u}
                    onRename={() => setRenaming(u)}
                    onDelete={() => setDeleting(u)}
                  />
                ))}
              </div>
            </>
          )}
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

/* ─────────────── summary tile ─────────────── */

const SummaryTile: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = T.text }) => (
  <div className="px-4 py-3.5" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
    <p className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>{label}</p>
    <p className="text-[20px] font-semibold mt-1 leading-none tabular-nums" style={{ color: tone, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
  </div>
);

export default Upload;