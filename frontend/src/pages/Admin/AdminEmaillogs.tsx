// AdminEmailLogs.tsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Mail, Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Check,
  MoreHorizontal, Inbox, Menu, X, Sparkles, Layers,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

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

/* ─────────────────────────── Tokens ─────────────────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  rowHover: "#11151E",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

/* ─────────────────────────── Helpers ─────────────────────────── */

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
  Sent:      { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    icon: Clock },
  Delivered: { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: CheckCircle2 },
  Bounced:   { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: AlertTriangle },
  Failed:    { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: XCircle },
};

const STATUS_FILTERS: ("All" | EmailStatus)[] = ["All", "Sent", "Delivered", "Failed", "Bounced"];
const RANGES = ["All time", "Today", "Last 7 days", "Last 30 days", "Last 90 days"] as const;

/* ─────────────────────────── Primitives ─────────────────────────── */

const StatusPill: React.FC<{ status: EmailStatus }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.Sent;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={11} />
      {status}
    </span>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  accentRing: string;
}> = ({ title, value, icon: Icon, accent, accentSoft, accentRing }) => (
  <div
    className="rounded-3xl p-4 md:p-5 soft-ring transition-colors hover:-translate-y-0.5"
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accentRing}` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: C.dark }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{title}</p>
  </div>
);

const CopyChip: React.FC<{ value: string | number; copied: boolean; onCopy: () => void }> = ({ value, copied, onCopy }) => (
  <button
    onClick={onCopy}
    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors"
    style={{
      fontFamily: FONT.mono,
      color: copied ? C.success : C.textMuted,
      background: copied ? C.successSoft : C.inner,
      boxShadow: `inset 0 0 0 1px ${copied ? C.successRing : C.border}`,
    }}
    title="Copy log ID"
  >
    {copied ? <Check size={11} /> : <Copy size={11} />}
    {String(value)}
  </button>
);

/* ─────────────────────────── Page ─────────────────────────── */

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

  /* Reset to page 1 on any filter change */
  useEffect(() => { setPage(1); }, [search, statusFilter, workspaceFilter, range]);

  /* Prune selection to current page + filtered set */
  useEffect(() => {
    setSelectedLogs((prev) => {
      const allowed = new Set(filteredLogs.map((l) => l.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredLogs]);

  const handleSearchChange = (value: string) => setSearch(value);
  const handleStatusChange = (value: "All" | EmailStatus) => setStatusFilter(value);
  const handleWorkspaceChange = (value: string) => setWorkspaceFilter(value);

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

  /* Safe to bail out now — every hook above already ran */
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: C.bg, color: C.dark, fontFamily: FONT.body }}>
        <p>EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes barUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .bar-up { animation: barUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .ael-main::-webkit-scrollbar { width: 10px; }
        .ael-main::-webkit-scrollbar-track { background: transparent; }
        .ael-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .ael-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        .ael-row:hover { background: ${C.rowHover}; }
        .ael-row .ael-actions { opacity: 0; transition: opacity 0.15s ease; }
        .ael-row:hover .ael-actions, .ael-row:focus-within .ael-actions { opacity: 1; }
        select option { background: #141821; color: #E8E6E1; }
        thead.ael-thead th { position: sticky; top: 0; background: ${C.inner}; z-index: 1; }
        input[type="checkbox"] { accent-color: ${C.primary}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ael-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                    >
                      <Sparkles size={11} /> Admin view
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {normalizedLogs.length} logs
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Email logs
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Track every email sent across all workspaces.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => refetch()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="px-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                  style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  aria-label="Time range"
                >
                  {RANGES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </header>

            {/* ── Error ──────────────────────────── */}
            {error && (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3"
                style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
              >
                <AlertTriangle size={15} style={{ color: C.danger }} className="shrink-0 mt-0.5" />
                <p className="text-[12.5px]" style={{ color: C.danger }}>{error}</p>
              </div>
            )}

            {/* ── Stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard title="Total emails" value={stats.total}     icon={Mail}         accent={C.primary} accentSoft={C.primarySoft} accentRing={C.primaryRing} />
              <StatCard title="Delivered"    value={stats.delivered} icon={CheckCircle2} accent={C.success} accentSoft={C.successSoft} accentRing={C.successRing} />
              <StatCard title="Failed"       value={stats.failed}    icon={XCircle}      accent={C.danger}  accentSoft={C.dangerSoft}  accentRing={C.dangerRing} />
              <StatCard title="Bounced"      value={stats.bounced}   icon={AlertTriangle} accent={C.warning} accentSoft={C.warningSoft} accentRing={C.warningRing} />
            </div>

            {/* ── Command bar ────────────────────── */}
            <div className="rounded-3xl p-3 mb-5 soft-ring sticky top-3 z-20"
              style={{ background: "rgba(20,24,33,0.85)", backdropFilter: "blur(10px)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0 transition-all"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
                  onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                >
                  <Search size={14} style={{ color: C.textMuted }} className="shrink-0" />
                  <input
                    placeholder="Search by recipient, campaign, subject, or ID…"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full bg-transparent text-[13.5px] outline-none"
                    style={{ color: C.textBody }}
                    aria-label="Search email logs"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-[#1B2130]"
                      style={{ color: C.textMuted }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Clock size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusChange(e.target.value as "All" | EmailStatus)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      aria-label="Filter by status"
                    >
                      {STATUS_FILTERS.map((f) => (
                        <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Layers size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={workspaceFilter}
                      onChange={(e) => handleWorkspaceChange(e.target.value)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
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
                      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                      style={{ background: C.inner, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11.5px]" style={{ color: C.textMuted }}>
                <span>
                  Showing{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredLogs.length}</span> of{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{normalizedLogs.length}</span> logs
                </span>
                <span className="hidden sm:inline" style={{ fontFamily: FONT.mono }}>
                  Page {page} / {totalPages}
                </span>
              </div>
            </div>

            {/* ── Table ──────────────────────────── */}
            <div className="rounded-3xl overflow-hidden soft-ring" style={{ background: C.surface }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 1100 }}>
                  <thead className="ael-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="px-4 md:px-5 py-3 w-[42px]" scope="col">
                        <button
                          onClick={toggleAll}
                          aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                          className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                        >
                          {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                      </th>
                      <th className="px-3 py-3 font-medium" scope="col">Log ID</th>
                      <th className="px-3 py-3 font-medium" scope="col">Recipient</th>
                      <th className="px-3 py-3 font-medium" scope="col">Campaign</th>
                      <th className="px-3 py-3 font-medium" scope="col">Subject</th>
                      <th className="px-3 py-3 font-medium" scope="col">Status</th>
                      <th className="px-3 py-3 font-medium" scope="col">Workspace</th>
                      <th className="px-4 md:px-5 py-3 font-medium text-right" scope="col">Sent at</th>
                      <th className="w-[48px]" scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading */}
                    {loading && normalizedLogs.length === 0 && (
                      <tr>
                        <td colSpan={9}>
                          <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 size={26} className="animate-spin" style={{ color: C.primary }} />
                            <p className="mt-3 text-[13px]" style={{ color: C.textMuted }}>Loading logs…</p>
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
                              className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                              style={{
                                background: error ? C.dangerSoft : C.primarySoft,
                                boxShadow: `inset 0 0 0 1px ${error ? C.dangerRing : C.primaryRing}`,
                              }}
                            >
                              {error ? (
                                <AlertTriangle size={26} style={{ color: C.danger }} />
                              ) : (
                                <Inbox size={26} style={{ color: C.primary }} />
                              )}
                            </div>
                            <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold text-[#F2F0EB]">
                              {error ? "Couldn't load logs" : "No logs found"}
                            </h3>
                            <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>
                              {error ? "Try refreshing the page." : "Try adjusting your filters or search."}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={() => { setSearch(""); setStatusFilter("All"); setWorkspaceFilter("All"); }}
                                className="mt-5 text-[12.5px] font-medium"
                                style={{ color: C.primary }}
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
                            borderBottom: `1px solid ${C.border}`,
                            background: isSelected ? "rgba(255,106,57,0.06)" : "transparent",
                          }}
                        >
                          <td className="px-4 md:px-5 py-3.5">
                            <button
                              onClick={() => toggleSelection(log.id)}
                              aria-label={isSelected ? "Deselect log" : "Select log"}
                              className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                            >
                              {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            </button>
                          </td>
                          <td className="px-3 py-3.5">
                            <CopyChip value={log.id} copied={isCopied} onCopy={() => handleCopy(log.id)} />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="min-w-0">
                              <p className="text-[12.5px] truncate max-w-[180px]" style={{ color: C.textBody }}>
                                {log.recipient}
                              </p>
                              <p className="text-[10.5px] truncate max-w-[180px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                {log.sender}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="text-[12.5px] truncate max-w-[160px]" style={{ color: C.dark }}>
                              {log.campaign}
                            </p>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="text-[12px] truncate max-w-[200px]" style={{ color: C.textMuted }}>
                              {log.subject}
                            </p>
                          </td>
                          <td className="px-3 py-3.5"><StatusPill status={log.status} /></td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] truncate max-w-[140px] block" style={{ color: C.textMuted }}>
                              {log.workspace}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5 text-right">
                            <span className="text-[11.5px] whitespace-nowrap" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                              {formatSentAt(log.sentAt)}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <button
                              aria-label="More options"
                              className="ael-actions p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                              style={{ color: C.textMuted }}
                            >
                              <MoreHorizontal size={14} />
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
                <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t" style={{ borderColor: C.border }}>
                  <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                    Showing{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}
                    </span>{" "}
                    of <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredLogs.length}</span> logs
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <ChevronLeft size={12} /> Prev
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => {
                      const active = p === page;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          aria-current={active ? "page" : undefined}
                          className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium transition-all hover:-translate-y-0.5"
                          style={{
                            background: active ? C.primary : C.inner,
                            color: active ? "#fff" : C.textBody,
                            boxShadow: active
                              ? "0 10px 24px -10px rgba(255,106,57,0.6)"
                              : `inset 0 0 0 1px ${C.border}`,
                            fontFamily: FONT.mono,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {totalPages > 5 && (
                      <>
                        <span className="text-[11.5px] px-1" style={{ color: C.textMuted }}>…</span>
                        <button
                          onClick={() => setPage(totalPages)}
                          aria-current={page === totalPages ? "page" : undefined}
                          className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium transition-all hover:-translate-y-0.5"
                          style={{
                            background: page === totalPages ? C.primary : C.inner,
                            color: page === totalPages ? "#fff" : C.textBody,
                            boxShadow: page === totalPages
                              ? "0 10px 24px -10px rgba(255,106,57,0.6)"
                              : `inset 0 0 0 1px ${C.border}`,
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
                      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bulk bar ──────────────────────── */}
        {selectedLogs.size > 0 && (
          <div
            className="bar-up fixed left-1/2 bottom-5 z-40 flex items-center gap-3 rounded-2xl px-3 py-2.5"
            style={{
              background: "#141821",
              boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.7)",
            }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="text-[12.5px] pl-1" style={{ color: C.textBody }}>
              <span style={{ fontFamily: FONT.mono, color: C.primary }}>{selectedLogs.size}</span> selected
            </span>
            <span className="w-px h-5" style={{ background: C.border }} />
            <button
              onClick={() => {
                const ids = Array.from(selectedLogs).map(String);
                navigator.clipboard?.writeText(ids.join(", "));
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <Copy size={12} /> Copy IDs
            </button>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="inline-flex items-center justify-center rounded-xl p-2 transition-colors"
              style={{ color: C.textMuted }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

/* ─────────────────────────── Icons used only here ─────────────────────────── */
import { CheckSquare, Square, Loader2 } from "lucide-react";

export default AdminEmailLogs;