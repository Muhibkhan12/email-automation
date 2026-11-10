// AdminEmailLogs.tsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Inbox,
  Menu, Send, Mail, ChevronRight as ChevronRightIcon,
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

/* ─────────────── design tokens (matching user EmailLogs page) ─────────────── */

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
  info:       "#6EC1E7",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

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
  <div className="rounded-xl p-4" style={{ background: T.surface, border: HAIRLINE }}>
    <div className="flex items-start justify-between mb-3">
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
    <p className="text-[24px] font-medium tracking-tight leading-none"
      style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11.5px] mt-1.5" style={{ color: T.textMuted }}>{title}</p>
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
  Sent:      { bg: "rgba(110,193,231,0.10)", fg: T.info,   ring: "rgba(110,193,231,0.28)", icon: Clock },
  Delivered: { bg: "rgba(110,231,168,0.10)", fg: T.ok,     ring: "rgba(110,231,168,0.28)", icon: CheckCircle2 },
  Failed:    { bg: "rgba(224,106,106,0.10)", fg: T.danger, ring: "rgba(224,106,106,0.28)", icon: XCircle },
  Bounced:   { bg: "rgba(224,166,74,0.10)",  fg: T.warn,   ring: "rgba(224,166,74,0.28)",  icon: AlertTriangle },
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

const AdminEmailLogs = () => {
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: T.bg, color: T.text, fontFamily: FONT.ui }}>
        <p className="text-[13px]" style={{ color: T.textMuted }}>
          EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: T.bg, fontFamily: FONT.ui }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        .el-main::-webkit-scrollbar { width: 8px; height: 8px; }
        .el-main::-webkit-scrollbar-track { background: transparent; }
        .el-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .el-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        .el-input::placeholder { color: ${T.textFaint}; }
        @media (prefers-reduced-motion: reduce) { .el-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="el-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

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
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Activity</span>
                  <ChevronRightIcon size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.accent }}>Email logs</span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Email logs
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Every email sent across all workspaces.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors duration-[120ms] disabled:opacity-50"
                style={{ color: T.textMuted, border: HAIRLINE }}
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{ background: "rgba(224,106,106,0.08)", border: "1px solid rgba(224,106,106,0.28)" }}
            >
              <AlertTriangle size={13} style={{ color: T.danger }} className="mt-0.5 shrink-0" />
              <p className="text-[12.5px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard title="Total emails" value={stats.total}     icon={Inbox}        accent={T.accent} accentSoft="rgba(110,231,168,0.10)" />
            <StatCard title="Delivered"    value={stats.delivered} icon={CheckCircle2} accent={T.ok}     accentSoft="rgba(110,231,168,0.10)"
              rate={stats.total ? (stats.delivered / stats.total) * 100 : 0} rateLabel="delivery" />
            <StatCard title="Failed"       value={stats.failed}    icon={XCircle}      accent={T.danger} accentSoft="rgba(224,106,106,0.10)"
              rate={stats.total ? (stats.failed / stats.total) * 100 : 0} rateLabel="failure" />
            <StatCard title="Bounced"      value={stats.bounced}   icon={AlertTriangle} accent={T.warn}  accentSoft="rgba(224,166,74,0.10)"
              rate={stats.total ? (stats.bounced / stats.total) * 100 : 0} rateLabel="bounce" />
          </div>

          {/* Filters */}
          <div className="mb-5 rounded-xl p-3" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0 transition-colors duration-[120ms]"
                style={{ background: T.surface2, border: HAIRLINE_SOFT }}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Search recipient, sender, campaign, or subject…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="el-input w-full bg-transparent text-[12.5px] outline-none"
                  style={{ color: T.text }}
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="shrink-0 text-[11px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
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
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none transition-colors duration-[120ms]"
                  style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
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
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none transition-colors duration-[120ms]"
                  style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
                >
                  <option>All time</option>
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-2.5 flex items-center justify-between gap-3 pt-2.5" style={{ borderTop: HAIRLINE_SOFT }}>
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text }} className="font-medium">{filteredLogs.length}</span>{" "}
                  {filteredLogs.length === 1 ? "result" : "results"} matching filters
                </p>
                <button
                  onClick={() => { setSearch(""); setStatusFilter("All"); setPage(1); }}
                  className="text-[11.5px] font-medium transition-colors duration-[120ms]"
                  style={{ color: T.accent }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3"
              style={{ borderBottom: HAIRLINE_SOFT }}
            >
              <div>
                <h2 className="text-[12.5px] font-medium" style={{ color: T.text }}>Email activity</h2>
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
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
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
                          style={{ borderColor: T.border, borderTopColor: T.accent }}
                        />
                        <p className="mt-2.5 text-[11.5px]" style={{ color: T.textFaint }}>Loading logs…</p>
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedLogs.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div
                          className="w-11 h-11 mx-auto mb-3 rounded-lg flex items-center justify-center"
                          style={{ background: T.surfaceHi, border: HAIRLINE }}
                        >
                          <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />
                        </div>
                        <p className="text-[13px] font-medium" style={{ color: T.text }}>No email logs yet</p>
                        <p className="mt-1 text-[11.5px]" style={{ color: T.textMuted }}>
                          Once you launch a campaign, activity will show up here.
                        </p>
                        <button
                          onClick={() => refetch()}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors duration-[120ms]"
                          style={{ color: T.textMuted, border: HAIRLINE }}
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
                          className="transition-colors duration-[120ms]"
                          style={{ borderTop: HAIRLINE_SOFT }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-4 md:px-5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-medium"
                                style={{
                                  background: "rgba(110,231,168,0.10)",
                                  color: T.accent,
                                  boxShadow: "inset 0 0 0 1px rgba(110,231,168,0.28)",
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
                                  className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] transition-colors duration-[120ms]"
                                  style={{ color: T.textFaint, fontFamily: FONT.mono }}
                                >
                                  #{log.id}
                                  <Copy size={9} />
                                  {copiedId === log.id && <span style={{ color: T.ok }}>✓</span>}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium max-w-[160px]"
                              style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT }}
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
                style={{ borderTop: HAIRLINE_SOFT }}
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
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
                  >
                    <ChevronLeft size={12} /> Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => {
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms]"
                        style={{
                          background: active ? T.accent : T.surface2,
                          color: active ? T.accentInk : T.textMuted,
                          border: active ? `1px solid ${T.accent}` : HAIRLINE_SOFT,
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
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms]"
                        style={{
                          background: page === totalPages ? T.accent : T.surface2,
                          color: page === totalPages ? T.accentInk : T.textMuted,
                          border: page === totalPages ? `1px solid ${T.accent}` : HAIRLINE_SOFT,
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
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

export default AdminEmailLogs;