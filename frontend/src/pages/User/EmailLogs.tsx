import { useContext, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Inbox,
  MoreHorizontal, Menu, Send, TrendingUp, Mail,
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

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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

const EmailLogs = () => {
  // 1) Context + ALL hooks go first, no conditions above them
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

  // 2) Now it's safe to bail out — every hook above already ran
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0D1015", color: "#E8E6E1", fontFamily: FONT.body }}>
        <p>EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: "#0D1015", fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .el-main::-webkit-scrollbar { width: 8px; }
        .el-main::-webkit-scrollbar-track { background: transparent; }
        .el-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .el-main::-webkit-scrollbar-thumb:hover { background: #333A48; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.25s ease-out; }
        select option { background: #141821; color: #E8E6E1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="el-main flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ─────────────────────────────── */}
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
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#6B727C]">Activity</span>
                  <ChevronRight size={10} className="text-[#3A3F4A]" />
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#FF6A39]">Email logs</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Email logs
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8]">
                  Every email sent through your campaigns, in one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs md:text-sm font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#FF6A39] hover:bg-[#e85a2c] text-white transition-all shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]">
                <Download size={15} />
                Export
              </button>
            </div>
          </header>

          {/* ── Error ──────────────────────────────── */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-500/5 ring-1 ring-rose-500/20 px-4 py-3">
              <div className="shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center bg-rose-500/10 ring-1 ring-rose-500/20">
                <AlertTriangle size={12} className="text-rose-400" />
              </div>
              <p className="text-xs md:text-[13px] text-rose-400">{error}</p>
            </div>
          )}

          {/* ── Stats ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <StatCard
              title="Total emails"
              value={stats.total}
              icon={Inbox}
              accent="#FF6A39"
            />
            <StatCard
              title="Delivered"
              value={stats.delivered}
              rate={stats.total ? (stats.delivered / stats.total) * 100 : 0}
              rateLabel="delivery"
              icon={CheckCircle2}
              accent="#34D399"
            />
            <StatCard
              title="Failed"
              value={stats.failed}
              rate={stats.total ? (stats.failed / stats.total) * 100 : 0}
              rateLabel="failure"
              icon={XCircle}
              accent="#F87171"
            />
            <StatCard
              title="Bounced"
              value={stats.bounced}
              rate={stats.total ? (stats.bounced / stats.total) * 100 : 0}
              rateLabel="bounce"
              icon={AlertTriangle}
              accent="#FBBF24"
            />
          </div>

          {/* ── Filters ────────────────────────────── */}
          <div className="mb-5 md:mb-6 rounded-2xl bg-[#141821] ring-1 ring-[#232833] p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-[#0F131A] ring-1 ring-[#232833] focus-within:ring-[#FF6A39]/50 px-3 py-2.5 flex-1 min-w-0 transition-all">
                <Search size={14} className="text-[#6B727C] shrink-0" />
                <input
                  type="text"
                  placeholder="Search recipient, sender, campaign, or subject…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="shrink-0 text-[10px] text-[#6B727C] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#232833] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#0F131A] ring-1 ring-[#232833] text-[#E8E6E1] text-sm focus:ring-[#FF6A39]/50 focus:outline-none cursor-pointer transition-all"
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
                  className="px-3 py-2.5 rounded-xl bg-[#0F131A] ring-1 ring-[#232833] text-[#E8E6E1] text-sm focus:ring-[#FF6A39]/50 focus:outline-none cursor-pointer transition-all"
                >
                  <option>All time</option>
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#6B727C]">
                  <span className="text-[#E8E6E1] font-medium">{filteredLogs.length}</span>{" "}
                  {filteredLogs.length === 1 ? "result" : "results"} matching filters
                </p>
                <button
                  onClick={() => { setSearch(""); setStatusFilter("All"); setPage(1); }}
                  className="text-xs font-medium text-[#FF6A39] hover:text-[#e85a2c] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* ── Table ──────────────────────────────── */}
          <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F242E] px-4 md:px-6 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-[#E8E6E1]">Email activity</h2>
                <p className="mt-0.5 text-[11px] text-[#6B727C]">
                  {filteredLogs.length} log{filteredLogs.length !== 1 && "s"} matching current filters
                </p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6B727C]">
                  <RefreshCw size={11} className="animate-spin" /> Syncing…
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "840px" }}>
                <thead className="sticky top-0 bg-[#141821] z-10">
                  <tr className="border-b border-[#1F242E] text-[10px] uppercase tracking-widest text-[#6B727C]">
                    <th className="px-4 md:px-6 py-3 font-medium">Recipient</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Campaign</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Subject</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Sender</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Status</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Sent at</th>
                    <th className="px-4 md:px-6 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {loading && normalizedLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="mt-3 text-xs text-[#6B727C]">Loading logs…</p>
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedLogs.length === 0 && !error && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                          <Inbox className="w-6 h-6 text-[#6B727C]" />
                        </div>
                        <p className="text-sm text-[#E8E6E1] font-medium">No email logs yet</p>
                        <p className="mt-1 text-xs text-[#6B727C]">
                          Once you launch a campaign, activity will show up here.
                        </p>
                        <button
                          onClick={() => refetch()}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs font-medium transition-all"
                        >
                          <RefreshCw size={13} /> Refresh
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
                          className="group fade-in-up border-t border-[#1F242E] hover:bg-[#161B25] transition-colors"
                        >
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold text-white bg-gradient-to-br from-[#FF6A39]/30 to-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-medium text-[#E8E6E1] truncate">
                                  {log.recipient}
                                </p>
                                <button
                                  onClick={() => handleCopy(log.id)}
                                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-[#6B727C] hover:text-[#E8E6E1] transition-colors"
                                >
                                  #{log.id}
                                  <Copy size={10} />
                                  {copiedId === log.id && <span className="text-emerald-400">✓</span>}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 md:px-6 py-3.5">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F131A] ring-1 ring-[#232833] px-2.5 py-1 text-[11px] font-medium text-[#C7C9CE]">
                              <Send size={10} className="text-[#6B727C]" />
                              <span className="truncate max-w-[140px]">{log.campaign}</span>
                            </span>
                          </td>

                          <td className="px-4 md:px-6 py-3.5 max-w-[220px]">
                            <span className="block text-[12.5px] text-[#9BA0A8] truncate" title={log.subject}>
                              {log.subject}
                            </span>
                          </td>

                          <td className="px-4 md:px-6 py-3.5">
                            <span className="text-[12.5px] text-[#9BA0A8] font-mono truncate max-w-[180px] inline-block">
                              {log.sender}
                            </span>
                          </td>

                          <td className="px-4 md:px-6 py-3.5">
                            <StatusBadge status={log.status} />
                          </td>

                          <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
                            <span className="text-[11.5px] text-[#6B727C] font-mono">
                              {formatSentAt(log.sentAt)}
                            </span>
                          </td>

                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <button className="rounded-lg p-2 text-[#6B727C] opacity-0 transition hover:bg-[#232833] hover:text-[#E8E6E1] group-hover:opacity-100">
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1F242E] px-4 md:px-6 py-3.5">
                <p className="text-xs text-[#6B727C] font-mono">
                  Showing{" "}
                  <span className="text-[#E8E6E1]">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}
                  </span>{" "}
                  of <span className="text-[#E8E6E1]">{filteredLogs.length}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:ring-[#333A48] hover:text-[#E8E6E1] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-[#232833] transition-all"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => {
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                          active
                            ? "bg-[#FF6A39] text-white ring-1 ring-[#FF6A39] shadow-[0_6px_20px_-8px_rgba(255,106,57,0.6)]"
                            : "bg-[#0F131A] text-[#C7C9CE] ring-1 ring-[#232833] hover:ring-[#333A48] hover:text-[#E8E6E1]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <span className="text-xs text-[#6B727C] px-1">…</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                          page === totalPages
                            ? "bg-[#FF6A39] text-white ring-1 ring-[#FF6A39] shadow-[0_6px_20px_-8px_rgba(255,106,57,0.6)]"
                            : "bg-[#0F131A] text-[#C7C9CE] ring-1 ring-[#232833] hover:ring-[#333A48] hover:text-[#E8E6E1]"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:ring-[#333A48] hover:text-[#E8E6E1] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-[#232833] transition-all"
                  >
                    Next <ChevronRight size={13} />
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

/* ────────────────────── Stat Card ────────────────────── */

interface StatCardProps {
  title: string;
  value: number;
  rate?: number;
  rateLabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

const StatCard = ({ title, value, rate, rateLabel, icon: Icon, accent }: StatCardProps) => (
  <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] p-4 md:p-5 transition-colors hover:ring-[#333A48]">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
      >
        <Icon size={15} className="text-white" />
      </div>
      {rate !== undefined && rateLabel && (
        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium text-[#9BA0A8] bg-[#0F131A] ring-1 ring-[#232833]">
          <TrendingUp size={10} />
          {rate.toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-2xl md:text-[26px] font-bold tracking-tight text-white font-mono leading-none">
      {value.toLocaleString()}
    </p>
    <p className="text-[11px] text-[#9BA0A8] mt-1.5">{title}</p>
    {rateLabel && rate !== undefined && (
      <p className="text-[10px] text-[#6B727C] mt-0.5">
        {rate.toFixed(1)}% {rateLabel} rate
      </p>
    )}
  </div>
);

/* ────────────────────── Status Badge ────────────────────── */

const statusConfig: Record<
  EmailStatus,
  { bg: string; fg: string; ring: string; icon: React.ComponentType<{ size?: number }> }
> = {
  Sent:      { bg: "rgba(59,130,246,0.10)",  fg: "#60A5FA", ring: "rgba(59,130,246,0.22)",  icon: Clock },
  Delivered: { bg: "rgba(34,197,94,0.10)",   fg: "#34D399", ring: "rgba(34,197,94,0.22)",   icon: CheckCircle2 },
  Failed:    { bg: "rgba(239,68,68,0.10)",   fg: "#F87171", ring: "rgba(239,68,68,0.22)",   icon: XCircle },
  Bounced:   { bg: "rgba(234,179,8,0.10)",   fg: "#FBBF24", ring: "rgba(234,179,8,0.22)",   icon: AlertTriangle },
};

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const config = statusConfig[status] ?? statusConfig.Sent;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.fg, boxShadow: `inset 0 0 0 1px ${config.ring}` }}
    >
      <Icon size={10} />
      {status}
    </span>
  );
};

export default EmailLogs;