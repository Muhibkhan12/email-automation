import { useContext, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Inbox,
  Menu, Send, Mail,
} from "lucide-react";

type EmailStatus = "Sent" | "Delivered" | "Failed" | "Bounced";

interface NormalizedLog {
  id: string | number;
  recipient: string;
  sender: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
}

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

const PAGE_SIZE = 5;

const normalizeLog = (log: any): NormalizedLog => ({
  id: log.id ?? "unknown",
  recipient: log.recipient_email || `Recipient ${log.recipient_id ?? ""}`,
  sender: log.sender_email || `Sender ${log.sender_account_id ?? ""}`,
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
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/* ─────────────── primitives ─────────────── */

interface StatCardProps {
  title: string;
  value: number;
  rate?: number;
  rateLabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  accentSoft: string;
}

const StatCard = ({ title, value, rate, rateLabel, icon: Icon, accent, accentSoft }: StatCardProps) => (
  <div className="rounded-xl p-3.5 md:p-4" style={{ background: T.surface, boxShadow: RING }}>
    <div className="flex items-start justify-between mb-2.5">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} />
      </div>
      {rate !== undefined && rateLabel && (
        <span
          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: T.surface2, color: T.textFaint, fontFamily: FONT.mono }}
        >
          {rate.toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-[22px] md:text-[24px] font-semibold tracking-tight leading-none"
      style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>{title}</p>
    {rateLabel && rate !== undefined && (
      <p className="text-[10px] mt-0.5" style={{ color: T.textFaint }}>
        {rate.toFixed(1)}% {rateLabel} rate
      </p>
    )}
  </div>
);

const statusConfig: Record<
  EmailStatus,
  { bg: string; fg: string; ring: string; icon: React.ComponentType<{ size?: number }> }
> = {
  Sent:      { bg: T.infoSoft,    fg: T.info,    ring: T.infoBorder,    icon: Clock },
  Delivered: { bg: T.successSoft, fg: T.success, ring: T.successBorder, icon: CheckCircle2 },
  Failed:    { bg: T.dangerSoft,  fg: T.danger,  ring: T.dangerBorder,  icon: XCircle },
  Bounced:   { bg: T.warnSoft,    fg: T.warn,    ring: T.warnBorder,    icon: AlertTriangle },
};

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const config = statusConfig[status] ?? statusConfig.Sent;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.fg, boxShadow: `inset 0 0 0 1px ${config.ring}` }}
    >
      <Icon size={9} />
      {status}
    </span>
  );
};

/* ─────────────── page ─────────────── */

const EmailLogs = () => {
  const ctx = useContext(EmailLogsContext);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All time");
  const [page, setPage] = useState(1);
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

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return normalizedLogs.filter((log) => {
      const matchesSearch =
        log.recipient.toLowerCase().includes(q) ||
        log.sender.toLowerCase().includes(q) ||
        log.campaign.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedLogs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = normalizedLogs.length;
    const delivered = normalizedLogs.filter((l) => l.status === "Delivered").length;
    const failed = normalizedLogs.filter((l) => l.status === "Failed").length;
    const bounced = normalizedLogs.filter((l) => l.status === "Bounced").length;
    const sent = normalizedLogs.filter((l) => l.status === "Sent").length;
    return { total, delivered, failed, bounced, sent };
  }, [normalizedLogs]);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusChange = (value: string) => { setStatusFilter(value); setPage(1); };

  const handleCopy = (id: string | number) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const hasActiveFilters = !!search || statusFilter !== "All";

  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: T.bg, color: T.text, fontFamily: FONT.body }}>
        <p className="text-[13px]" style={{ color: T.textMuted }}>
          EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: T.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .el-main::-webkit-scrollbar { width: 8px; }
        .el-main::-webkit-scrollbar-track { background: transparent; }
        .el-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .el-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        @media (prefers-reduced-motion: reduce) { .el-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="el-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
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
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Activity</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.brand }}>Email logs</span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Email logs
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Every email sent through your campaigns, in one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <AlertTriangle size={13} style={{ color: T.danger }} className="mt-0.5 shrink-0" />
              <p className="text-[12.5px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mb-5 md:mb-6">
            <StatCard title="Total emails" value={stats.total}     icon={Inbox}        accent={T.brand}   accentSoft={T.brandSoft} />
            <StatCard title="Delivered"    value={stats.delivered} icon={CheckCircle2} accent={T.success} accentSoft={T.successSoft}
              rate={stats.total ? (stats.delivered / stats.total) * 100 : 0} rateLabel="delivery" />
            <StatCard title="Failed"       value={stats.failed}    icon={XCircle}      accent={T.danger}  accentSoft={T.dangerSoft}
              rate={stats.total ? (stats.failed / stats.total) * 100 : 0} rateLabel="failure" />
            <StatCard title="Bounced"      value={stats.bounced}   icon={AlertTriangle} accent={T.warn}   accentSoft={T.warnSoft}
              rate={stats.total ? (stats.bounced / stats.total) * 100 : 0} rateLabel="bounce" />
          </div>

          {/* Filters */}
          <div className="mb-4 md:mb-5 rounded-lg p-2.5" style={{ background: T.surface, boxShadow: RING }}>
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div
                className="flex items-center gap-2 rounded-md px-2.5 py-2 flex-1 min-w-0 transition-shadow"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Search recipient, sender, campaign, or subject…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent text-[12.5px] outline-none"
                  style={{ color: T.text }}
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: T.textFaint }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none transition-shadow"
                  style={{ background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
                >
                  <option value="All">All statuses</option>
                  <option value="Sent">Sent</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                  <option value="Bounced">Bounced</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none transition-shadow"
                  style={{ background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
                >
                  <option>All time</option>
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text }} className="font-medium">{filteredLogs.length}</span>{" "}
                  {filteredLogs.length === 1 ? "result" : "results"} matching filters
                </p>
                <button
                  onClick={() => { setSearch(""); setStatusFilter("All"); setPage(1); }}
                  className="text-[11.5px] font-medium transition-colors"
                  style={{ color: T.brand }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div>
                <h2 className="text-[12.5px] font-semibold" style={{ color: T.text }}>Email activity</h2>
                <p className="mt-0.5 text-[11px]" style={{ color: T.textFaint }}>
                  {filteredLogs.length} log{filteredLogs.length !== 1 && "s"} matching current filters
                </p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textFaint }}>
                  <RefreshCw size={10} className="animate-spin" /> Syncing…
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "840px" }}>
                <thead className="sticky top-0 z-10" style={{ background: T.surface }}>
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Recipient</th>
                    <th className="px-3 py-2.5 font-medium">Campaign</th>
                    <th className="px-3 py-2.5 font-medium">Subject</th>
                    <th className="px-3 py-2.5 font-medium">Sender</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Sent at</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && normalizedLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div
                          className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                          style={{ borderColor: T.brand, borderTopColor: "transparent" }}
                        />
                        <p className="mt-2.5 text-[11.5px]" style={{ color: T.textFaint }}>Loading logs…</p>
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedLogs.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div
                          className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                          style={{ background: T.surface2 }}
                        >
                          <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />
                        </div>
                        <p className="text-[13px] font-medium" style={{ color: T.text }}>No email logs yet</p>
                        <p className="mt-1 text-[11.5px]" style={{ color: T.textMuted }}>
                          Once you launch a campaign, activity will show up here.
                        </p>
                        <button
                          onClick={() => refetch()}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors hover:bg-white/5"
                          style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                        >
                          <RefreshCw size={11} /> Refresh
                        </button>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedLogs.map((log) => {
                      const initial = (log.recipient?.trim()?.[0] || "?").toUpperCase();
                      return (
                        <tr
                          key={log.id}
                          className="transition-colors hover:bg-white/[0.02]"
                          style={{ borderTop: `1px solid ${T.borderSoft}` }}
                        >
                          <td className="px-4 md:px-5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-semibold"
                                style={{
                                  background: T.brandSoft,
                                  color: T.brand,
                                  boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
                                }}
                              >
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                  {log.recipient}
                                </p>
                                <button
                                  onClick={() => handleCopy(log.id)}
                                  className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] transition-colors hover:text-white"
                                  style={{ color: T.textFaint, fontFamily: FONT.mono }}
                                >
                                  #{log.id}
                                  <Copy size={9} />
                                  {copiedId === log.id && <span style={{ color: T.success }}>✓</span>}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium max-w-[160px]"
                              style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                            >
                              <Send size={9} style={{ color: T.textFaint }} className="shrink-0" />
                              <span className="truncate">{log.campaign}</span>
                            </span>
                          </td>

                          <td className="px-3 py-3 max-w-[220px]">
                            <span className="block text-[12px] truncate" style={{ color: T.textMuted }} title={log.subject}>
                              {log.subject}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className="text-[11.5px] truncate max-w-[180px] inline-block"
                              style={{ color: T.textFaint, fontFamily: FONT.mono }}
                              title={log.sender}
                            >
                              {log.sender}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <StatusBadge status={log.status} />
                          </td>

                          <td className="px-4 md:px-5 py-3 whitespace-nowrap">
                            <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {formatSentAt(log.sentAt)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3"
                style={{ borderTop: `1px solid ${T.borderSoft}` }}
              >
                <p className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  Showing{" "}
                  <span style={{ color: T.text }}>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}
                  </span>{" "}
                  of <span style={{ color: T.text }}>{filteredLogs.length}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <ChevronLeft size={12} /> Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => {
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                        style={{
                          background: active ? T.brand : T.surface2,
                          color: active ? "#fff" : T.textMuted,
                          boxShadow: active ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
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
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                        style={{
                          background: page === totalPages ? T.brand : T.surface2,
                          color: page === totalPages ? "#fff" : T.textMuted,
                          boxShadow: page === totalPages ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmailLogs;