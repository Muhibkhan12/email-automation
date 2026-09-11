import { useContext, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Inbox,
  MoreHorizontal,
  Menu,
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    return { total, delivered, failed, bounced };
  }, [normalizedLogs]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCopy = (id: string | number) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // 2) Now it's safe to bail out — every hook above already ran
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12151B] text-[#E8E6E1]">
        <p>EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#12151B] font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 lg:sticky lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto bg-[#12151B] p-3 md:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] p-2 text-[#C7C9CE] hover:bg-[#1B1E24] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#E8E6E1]">Email Logs</h1>
              <p className="text-xs text-[#9BA0A8]">Track every email sent through your campaigns.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-4 py-2 text-xs font-medium text-[#C7C9CE] transition-colors hover:bg-[#1B1E24] hover:text-[#E8E6E1] disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-4 py-2 text-xs font-medium text-white shadow-[0_4px_12px_rgba(255,106,57,0.25)] transition hover:opacity-90">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-400">
            Error: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Emails" value={stats.total} icon={Inbox} color="text-[#FF6A39]" bg="bg-[#FF6A39]/10" />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            description={stats.total ? `${((stats.delivered / stats.total) * 100).toFixed(1)}% delivery rate` : "—"}
            icon={CheckCircle2}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            description={stats.total ? `${((stats.failed / stats.total) * 100).toFixed(1)}% failure rate` : "—"}
            icon={XCircle}
            color="text-rose-400"
            bg="bg-rose-500/10"
          />
          <StatCard
            title="Bounced"
            value={stats.bounced}
            description={stats.total ? `${((stats.bounced / stats.total) * 100).toFixed(1)}% bounce rate` : "—"}
            icon={AlertTriangle}
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-[#2A2E37] bg-[#12151B] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B727C]" />
              <input
                type="text"
                placeholder="Search recipient, sender, campaign, or subject…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-[#2A2E37] bg-[#0B0E12] py-2.5 pl-8 pr-3 text-sm text-[#E8E6E1] outline-none transition focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="flex-1 rounded-lg border border-[#2A2E37] bg-[#0B0E12] px-3.5 py-2.5 text-sm text-[#E8E6E1] outline-none transition focus:border-[#FF6A39]"
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
                className="flex-1 rounded-lg border border-[#2A2E37] bg-[#0B0E12] px-3.5 py-2.5 text-sm text-[#E8E6E1] outline-none transition focus:border-[#FF6A39]"
              >
                <option>All time</option>
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "All") && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6B727C]">
              <span>{filteredLogs.length} result{filteredLogs.length !== 1 && "s"}</span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPage(1);
                }}
                className="font-medium text-[#FF6A39] underline underline-offset-2 hover:text-[#e85a2c]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#2A2E37] bg-[#12151B]">
          <div className="border-b border-[#2A2E37] px-4 py-3 lg:px-6 lg:py-4">
            <h2 className="text-sm font-semibold text-[#E8E6E1]">Email Activity</h2>
            <p className="mt-0.5 text-xs text-[#6B727C]">{filteredLogs.length} logs matching current filters</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
              <thead>
                <tr className="border-b border-[#2A2E37] bg-[#0B0E12] text-xs uppercase tracking-wide text-[#6B727C]">
                  <th className="px-4 py-3.5 font-medium lg:px-6">Recipient</th>
                  <th className="px-4 py-3.5 font-medium lg:px-6">Campaign</th>
                  <th className="px-4 py-3.5 font-medium lg:px-6">Subject</th>
                  <th className="px-4 py-3.5 font-medium lg:px-6">Sender</th>
                  <th className="px-4 py-3.5 font-medium lg:px-6">Status</th>
                  <th className="px-4 py-3.5 font-medium lg:px-6">Sent At</th>
                  <th className="px-4 py-3.5 lg:px-6" />
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2A2E37]">
                {loading && normalizedLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#6B727C]">
                      Loading logs from database...
                    </td>
                  </tr>
                )}

                {!loading && paginatedLogs.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#6B727C]">
                      <div className="flex flex-col items-center">
                        <Inbox size={24} className="mb-2 text-[#6B727C]" />
                        <p className="text-xs">No email logs found in database</p>
                        <button onClick={() => refetch()} className="mt-2 text-xs text-[#FF6A39] hover:underline">
                          Click to refresh
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="group transition hover:bg-[#1B1E24]">
                      <td className="px-4 py-4 lg:px-6">
                        <p className="text-sm font-medium text-[#E8E6E1]">{log.recipient}</p>
                        <button
                          onClick={() => handleCopy(log.id)}
                          className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-[#6B727C] hover:text-[#E8E6E1]"
                        >
                          ID: {log.id}
                          <Copy size={9} />
                          {copiedId === log.id && <span className="ml-1 text-emerald-400">✓</span>}
                        </button>
                      </td>

                      <td className="px-4 py-4 lg:px-6">
                        <span className="inline-flex rounded-md bg-[#1B1E24] px-2.5 py-0.5 text-xs font-medium text-[#C7C9CE]">
                          {log.campaign}
                        </span>
                      </td>

                      <td className="max-w-[100px] truncate px-4 py-4 text-sm text-[#9BA0A8] lg:px-6">{log.subject}</td>

                      <td className="px-4 py-4 text-sm text-[#9BA0A8] lg:px-6">{log.sender}</td>

                      <td className="px-4 py-4 lg:px-6">
                        <StatusBadge status={log.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#6B727C] lg:px-6">
                        {formatSentAt(log.sentAt)}
                      </td>

                      <td className="px-4 py-4 text-right lg:px-6">
                        <button className="rounded-lg p-2 text-[#6B727C] opacity-0 transition hover:bg-[#1B1E24] hover:text-[#E8E6E1] group-hover:opacity-100">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2E37] px-4 py-3 lg:px-6">
              <p className="text-xs text-[#6B727C]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-[#2A2E37] px-3 py-1.5 text-xs text-[#C7C9CE] transition hover:bg-[#1B1E24] hover:text-[#E8E6E1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={12} />
                  Prev
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs transition ${
                      p === page
                        ? "border-[#FF6A39] bg-[#FF6A39] text-white"
                        : "border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {totalPages > 5 && (
                  <>
                    <span className="text-xs text-[#6B727C]">…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`rounded-lg border px-3.5 py-1.5 text-xs transition ${
                        page === totalPages
                          ? "border-[#FF6A39] bg-[#FF6A39] text-white"
                          : "border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-[#2A2E37] px-3 py-1.5 text-xs text-[#C7C9CE] transition hover:bg-[#1B1E24] hover:text-[#E8E6E1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ---------- Stat Card ---------- */

interface StatCardProps {
  title: string;
  value: number;
  description?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}

const StatCard = ({ title, value, description, icon: Icon, color, bg }: StatCardProps) => (
  <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] p-4 shadow-sm transition hover:shadow-md lg:p-5">
    <div className="flex items-start justify-between">
      <p className="text-sm text-[#9BA0A8]">{title}</p>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
        <Icon size={14} className={color} />
      </span>
    </div>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#E8E6E1]">{value}</h2>
    {description && <p className="mt-1 text-xs text-[#6B727C]">{description}</p>}
  </div>
);

/* ---------- Status Badge ---------- */

const statusConfig: Record<EmailStatus, { className: string; icon: React.ComponentType<{ size?: number }> }> = {
  Sent: { className: "bg-blue-500/10 text-blue-400", icon: Clock },
  Delivered: { className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  Failed: { className: "bg-rose-500/10 text-rose-400", icon: XCircle },
  Bounced: { className: "bg-amber-500/10 text-amber-400", icon: AlertTriangle },
};

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const config = statusConfig[status] ?? statusConfig.Sent;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon size={10} />
      {status}
    </span>
  );
};

export default EmailLogs;