// AdminEmailLogs.tsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Mail, Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Check,
  MoreHorizontal, Inbox, Menu, X, Sparkles, Layers, Loader2,
  CheckSquare, Square,
} from "lucide-react";

/* ─────────────── types ─────────────── */

type EmailStatus = "Sent" | "Delivered" | "Failed" | "Bounced";

interface NormalizedLog {
  id: string | number;
  recipient: string;
  sender: string;
  workspace: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
}

const PAGE_SIZE = 8;

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

/* ─────────────── helpers ─────────────── */

const normalizeLog = (log: any): NormalizedLog => ({
  id: log.id ?? "unknown",
  recipient: log.recipient_email || `Recipient ${log.recipient_id ?? ""}`,
  sender: log.sender_email || `Sender ${log.sender_account_id ?? ""}`,
  workspace: log.workspace_name || log.workspace_id || "—",
  campaign: log.campaign_name || `Campaign ${log.campaign_id ?? ""}`,
  subject: log.subject || "No Subject",
  status: (log.status || "Sent") as EmailStatus,
  sentAt: log.sent_at || log.created_at || "",
});

const formatSentAt = (value: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_META: Record<EmailStatus, { fg: string; bg: string; ring: string; icon: React.ElementType }> = {
  Sent:      { fg: T.info,    bg: T.infoSoft,    ring: T.infoBorder,    icon: Clock },
  Delivered: { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: CheckCircle2 },
  Bounced:   { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: AlertTriangle },
  Failed:    { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: XCircle },
};

const STATUS_FILTERS: ("All" | EmailStatus)[] = ["All", "Sent", "Delivered", "Failed", "Bounced"];
const RANGES = ["All time", "Today", "Last 7 days", "Last 30 days", "Last 90 days"] as const;

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className = "", style,
}) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING, ...style }}>
    {children}
  </div>
);

const StatusPill: React.FC<{ status: EmailStatus }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.Sent;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={10} />
      {status}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}> = ({ label, value, icon: Icon, accent, accentSoft }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} />
      </div>
    </div>
    <p className="text-[24px] font-semibold tracking-tight leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: T.textMuted }}>{label}</p>
  </Card>
);

const CopyChip: React.FC<{ value: string | number; copied: boolean; onCopy: () => void }> = ({ value, copied, onCopy }) => (
  <button
    onClick={onCopy}
    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors"
    style={{
      fontFamily: FONT.mono,
      color: copied ? T.success : T.textMuted,
      background: copied ? T.successSoft : T.surface2,
      boxShadow: `inset 0 0 0 1px ${copied ? T.successBorder : T.borderSoft}`,
    }}
    title="Copy log ID"
  >
    {copied ? <Check size={10} /> : <Copy size={10} />}
    {String(value)}
  </button>
);

/* ─────────────── page ─────────────── */

const AdminEmailLogs = () => {
  const ctx = useContext(EmailLogsContext);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EmailStatus>("All");
  const [workspaceFilter, setWorkspaceFilter] = useState("All");
  const [range, setRange] = useState<string>(RANGES[0]);
  const [page, setPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const emaillogs = ctx?.emaillogs ?? [];
  const loading = ctx?.loading ?? false;
  const error = ctx?.error ?? null;
  const refetch = ctx?.refetch ?? (() => {});

  const normalizedLogs = useMemo(() => {
    if (!Array.isArray(emaillogs)) return [];
    return emaillogs.map(normalizeLog);
  }, [emaillogs]);

  const workspaceOptions = useMemo(() => {
    const set = new Set(normalizedLogs.map((l) => l.workspace).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [normalizedLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return normalizedLogs.filter((log) => {
      const matchesSearch =
        !q ||
        log.recipient.toLowerCase().includes(q) ||
        log.sender.toLowerCase().includes(q) ||
        log.campaign.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q) ||
        String(log.id).toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;
      const matchesWorkspace = workspaceFilter === "All" || log.workspace === workspaceFilter;
      return matchesSearch && matchesStatus && matchesWorkspace;
    });
  }, [normalizedLogs, search, statusFilter, workspaceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = normalizedLogs.length;
    const delivered = normalizedLogs.filter((l) => l.status === "Delivered").length;
    const failed = normalizedLogs.filter((l) => l.status === "Failed").length;
    const bounced = normalizedLogs.filter((l) => l.status === "Bounced").length;
    return { total, delivered, failed, bounced };
  }, [normalizedLogs]);

  useEffect(() => { setPage(1); }, [search, statusFilter, workspaceFilter, range]);

  useEffect(() => {
    setSelectedLogs((prev) => {
      const allowed = new Set(filteredLogs.map((l) => l.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredLogs]);

  const allVisibleSelected =
    paginatedLogs.length > 0 && paginatedLogs.every((log) => selectedLogs.has(log.id));

  const toggleSelection = (id: string | number) =>
    setSelectedLogs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    setSelectedLogs((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) paginatedLogs.forEach((log) => next.delete(log.id));
      else paginatedLogs.forEach((log) => next.add(log.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedLogs(new Set());

  const handleCopy = useCallback((id: string | number) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  }, []);

  const hasActiveFilters = !!search || statusFilter !== "All" || workspaceFilter !== "All";

  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: T.bg, color: T.text, fontFamily: FONT.body }}>
        <p>EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes barUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .bar-up { animation: barUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .ael-main::-webkit-scrollbar { width: 8px; }
        .ael-main::-webkit-scrollbar-track { background: transparent; }
        .ael-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .ael-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .ael-row:hover { background: rgba(255,255,255,0.02); }
        .ael-row .ael-actions { opacity: 0; transition: opacity 0.15s ease; }
        .ael-row:hover .ael-actions, .ael-row:focus-within .ael-actions { opacity: 1; }
        select option { background: ${T.surface2}; color: ${T.text}; }
        input[type="checkbox"] { accent-color: ${T.brand}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ael-main flex-1 overflow-y-auto" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
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
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                  >
                    <Sparkles size={10} /> Admin view
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {normalizedLogs.length} logs
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Email logs
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Track every email sent across all workspaces.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="px-3 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                aria-label="Time range"
              >
                {RANGES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <AlertTriangle size={14} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
              <p className="text-[12.5px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard label="Total emails" value={stats.total}     icon={Mail}          accent={T.brand}   accentSoft={T.brandSoft} />
            <StatCard label="Delivered"    value={stats.delivered} icon={CheckCircle2}  accent={T.success} accentSoft={T.successSoft} />
            <StatCard label="Failed"       value={stats.failed}    icon={XCircle}       accent={T.danger}  accentSoft={T.dangerSoft} />
            <StatCard label="Bounced"      value={stats.bounced}   icon={AlertTriangle} accent={T.warn}    accentSoft={T.warnSoft} />
          </div>

          {/* Command bar */}
          <div
            className="rounded-xl p-3 mb-5 sticky top-3 z-20"
            style={{ background: T.surface, boxShadow: RING }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  placeholder="Search by recipient, campaign, subject, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[13px] outline-none"
                  style={{ color: T.text }}
                  aria-label="Search email logs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: T.textMuted }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Clock size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "All" | EmailStatus)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    aria-label="Filter by status"
                  >
                    {STATUS_FILTERS.map((f) => (
                      <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Layers size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={workspaceFilter}
                    onChange={(e) => setWorkspaceFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    aria-label="Filter by workspace"
                  >
                    {workspaceOptions.map((w) => (
                      <option key={w} value={w}>{w === "All" ? "All workspaces" : w}</option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(""); setStatusFilter("All"); setWorkspaceFilter("All"); }}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors"
                    style={{ background: T.surface2, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px]" style={{ color: T.textFaint }}>
              <span>
                Showing{" "}
                <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredLogs.length}</span> of{" "}
                <span style={{ color: T.text, fontFamily: FONT.mono }}>{normalizedLogs.length}</span> logs
              </span>
              <span className="hidden sm:inline" style={{ fontFamily: FONT.mono }}>
                Page {page} / {totalPages}
              </span>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 1100 }}>
                <thead>
                  <tr
                    className="text-[10px] uppercase tracking-widest"
                    style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}
                  >
                    <th className="px-4 md:px-5 py-2.5 w-10.5" scope="col">
                      <button
                        onClick={toggleAll}
                        aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                        style={{ color: T.textFaint }}
                        className="transition-colors hover:text-[#E9EBF0]"
                      >
                        {allVisibleSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Log ID</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Recipient</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Campaign</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Subject</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Status</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Workspace</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium text-right" scope="col">Sent at</th>
                    <th className="w-12" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Loading */}
                  {loading && normalizedLogs.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="py-20 flex flex-col items-center justify-center">
                          <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
                          <p className="mt-3 text-[12.5px]" style={{ color: T.textMuted }}>Loading logs…</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Empty */}
                  {!loading && paginatedLogs.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                          <div
                            className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                            style={{
                              background: error ? T.dangerSoft : T.brandSoft,
                              color: error ? T.danger : T.brand,
                            }}
                          >
                            {error ? <AlertTriangle size={22} /> : <Inbox size={22} />}
                          </div>
                          <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                            {error ? "Couldn't load logs" : "No logs found"}
                          </h3>
                          <p className="mt-2 text-[12.5px] max-w-md" style={{ color: T.textMuted }}>
                            {error ? "Try refreshing the page." : "Try adjusting your filters or search."}
                          </p>
                          {hasActiveFilters && (
                            <button
                              onClick={() => { setSearch(""); setStatusFilter("All"); setWorkspaceFilter("All"); }}
                              className="mt-4 text-[12px] font-medium"
                              style={{ color: T.brand }}
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Rows */}
                  {!loading && paginatedLogs.map((log) => {
                    const isSelected = selectedLogs.has(log.id);
                    const isCopied = copiedId === log.id;
                    return (
                      <tr
                        key={log.id}
                        className="ael-row transition-colors float-in"
                        style={{
                          borderTop: `1px solid ${T.borderSoft}`,
                          background: isSelected ? "rgba(99,102,241,0.06)" : "transparent",
                        }}
                      >
                        <td className="px-4 md:px-5 py-3">
                          <button
                            onClick={() => toggleSelection(log.id)}
                            aria-label={isSelected ? "Deselect log" : "Select log"}
                            style={{ color: T.textFaint }}
                            className="transition-colors hover:text-[#E9EBF0]"
                          >
                            {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <CopyChip value={log.id} copied={isCopied} onCopy={() => handleCopy(log.id)} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-[12px] truncate max-w-45" style={{ color: T.textMuted }}>
                              {log.recipient}
                            </p>
                            <p className="text-[10.5px] truncate max-w-45 mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {log.sender}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[12px] truncate max-w-40" style={{ color: T.text }}>
                            {log.campaign}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[11.5px] truncate max-w-50" style={{ color: T.textMuted }}>
                            {log.subject}
                          </p>
                        </td>
                        <td className="px-3 py-3"><StatusPill status={log.status} /></td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px] truncate max-w-35 block" style={{ color: T.textMuted }}>
                            {log.workspace}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <span className="text-[11px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                            {formatSentAt(log.sentAt)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            aria-label="More options"
                            className="ael-actions p-1.5 rounded-md transition-colors hover:bg-white/5"
                            style={{ color: T.textFaint }}
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t"
                style={{ borderColor: T.borderSoft }}>
                <span className="text-[11px]" style={{ color: T.textFaint }}>
                  Showing{" "}
                  <span style={{ color: T.text, fontFamily: FONT.mono }}>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}
                  </span>{" "}
                  of <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredLogs.length}</span> logs
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                  >
                    <ChevronLeft size={11} /> Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => {
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        aria-current={active ? "page" : undefined}
                        className="min-w-7.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                        style={{
                          background: active ? T.brand : "transparent",
                          color: active ? "#fff" : T.textMuted,
                          boxShadow: active ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
                          fontFamily: FONT.mono,
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <span className="text-[11px] px-1" style={{ color: T.textFaint }}>…</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        aria-current={page === totalPages ? "page" : undefined}
                        className="min-w-7.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                        style={{
                          background: page === totalPages ? T.brand : "transparent",
                          color: page === totalPages ? "#fff" : T.textMuted,
                          boxShadow: page === totalPages ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
                          fontFamily: FONT.mono,
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                  >
                    Next <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Bulk bar */}
        {selectedLogs.size > 0 && (
          <div
            className="bar-up fixed left-1/2 bottom-5 z-40 flex items-center gap-2.5 rounded-xl px-3 py-2"
            style={{
              background: T.surface,
              boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 48px -16px rgba(0,0,0,0.7)`,
            }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="text-[12px] pl-1" style={{ color: T.textMuted }}>
              <span style={{ fontFamily: FONT.mono, color: T.brand }}>{selectedLogs.size}</span> selected
            </span>
            <span className="w-px h-4" style={{ background: T.border }} />
            <button
              onClick={() => {
                const ids = Array.from(selectedLogs).map(String);
                navigator.clipboard?.writeText(ids.join(", "));
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
              style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <Copy size={11} /> Copy IDs
            </button>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/5"
              style={{ color: T.textFaint }}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminEmailLogs;