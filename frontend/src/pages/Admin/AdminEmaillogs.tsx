// AdminEmailLogs.tsx
import React, { useContext, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import {
  Mail,
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
  MoreHorizontal,
  Inbox,
  Menu,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                */
/* ---------------------------------------------------------------------- */

const normalizeLog = (log: any): NormalizedLog => ({
  id: log.id ?? "unknown",
  recipient: log.recipient_email || `Recipient ${log.recipient_id ?? ""}`,
  sender: log.sender_email || `Sender ${log.sender_account_id ?? ""}`,
  // workspace isn't in the payload yet — falls back to "—" until the backend sends it
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

const statusConfig: Record<EmailStatus, { bg: string; text: string; icon: React.ElementType }> = {
  Sent: { bg: "bg-blue-500/15", text: "text-blue-400", icon: Clock },
  Delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2 },
  Bounced: { bg: "bg-amber-500/15", text: "text-amber-400", icon: AlertTriangle },
  Failed: { bg: "bg-rose-500/15", text: "text-rose-400", icon: XCircle },
};

const STATUS_FILTERS: ("All" | EmailStatus)[] = ["All", "Sent", "Delivered", "Failed", "Bounced"];
const RANGES = ["All time", "Today", "Last 7 days", "Last 30 days", "Last 90 days"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminEmailLogs = () => {
  // Context + ALL hooks first, no conditional hooks
  const ctx = useContext(EmailLogsContext);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EmailStatus>("All");
  const [workspaceFilter, setWorkspaceFilter] = useState("All");
  const [range, setRange] = useState(RANGES[0]);
  const [page, setPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState<Set<string | number>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
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

  const statCards = [
    { title: "Total Emails", value: stats.total, icon: Mail },
    { title: "Delivered", value: stats.delivered, icon: CheckCircle2 },
    { title: "Failed", value: stats.failed, icon: XCircle },
    { title: "Bounced", value: stats.bounced, icon: AlertTriangle },
  ];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: "All" | EmailStatus) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleWorkspaceChange = (value: string) => {
    setWorkspaceFilter(value);
    setPage(1);
  };

  const toggleSelection = (id: string | number) => {
    setSelectedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLogs.size === paginatedLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(paginatedLogs.map((log) => log.id)));
    }
  };

  const handleCopy = (id: string | number) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const getStatusBadge = (status: EmailStatus) => {
    const config = statusConfig[status] ?? statusConfig.Sent;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
        <span className="hidden xs:inline">{status}</span>
        <span className="xs:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  // Safe to bail out now — every hook above already ran
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E1013] text-[#E8E6E1]">
        <p>EmailLogsContext not found — wrap this page in &lt;EmailLogsProvider&gt;.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: #0E1013; }
        .main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        .log-row:hover { background-color: #1B1E24; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); }
        .sidebar-overlay { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-slide { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (max-width: 480px) {
          .filter-controls { flex-direction: column; width: 100%; }
          .filter-controls select { width: 100%; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        sidebar-slide
      `}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#0E1013] h-screen w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                  Email Logs
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin View
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Track every email sent across all workspaces.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition flex-1 sm:flex-none justify-center disabled:opacity-50"
            >
              <RefreshCw size={12} className={`md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] ${loading ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
            <button className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition flex-1 sm:flex-none justify-center">
              <Download size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              <span className="hidden xs:inline">Export</span>
            </button>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {RANGES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-400">
            Error: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="stat-card rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10">
                    <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FF6A39]" />
                  </div>
                </div>
                <h2 className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value.toLocaleString()}
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 flex-1 lg:flex-none">
              <Search size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#8B8D94] shrink-0" />
              <input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#C7C9CE] w-[100px] md:w-[150px] lg:w-[200px] placeholder:text-[#8B8D94]"
              />
            </div>

            <div className="filter-controls flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as "All" | EmailStatus)}
                className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>

              <select
                value={workspaceFilter}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
              >
                {workspaceOptions.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>

            {selectedLogs.size > 0 && (
              <span className="text-[9px] md:text-xs text-[#8B8D94]">{selectedLogs.size} selected</span>
            )}

            {(search || statusFilter !== "All" || workspaceFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setWorkspaceFilter("All");
                  setPage(1);
                }}
                className="text-[9px] md:text-xs font-medium text-[#FF6A39] underline underline-offset-2 hover:text-[#e85a2c]"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="text-[9px] md:text-xs text-[#8B8D94]">
            Showing {filteredLogs.length} of {normalizedLogs.length} logs
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] md:min-w-[950px] lg:min-w-[1100px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37] bg-[#0E1013]">
                <tr>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-6 md:w-8 lg:w-10">
                    <input
                      type="checkbox"
                      checked={selectedLogs.size === paginatedLogs.length && paginatedLogs.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                    />
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Log ID</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Recipient</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Campaign</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Subject</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Status</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Workspace</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sent At</th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-6 md:w-8 lg:w-10" />
                </tr>
              </thead>
              <tbody>
                {loading && normalizedLogs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 md:px-5 py-10 md:py-16 text-center text-xs text-[#8B8D94]">
                      Loading logs from database...
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedLogs.map((log) => {
                    const isHovered = hoveredId === log.id;
                    const isCopied = copiedId === log.id;

                    return (
                      <tr
                        key={log.id}
                        className="log-row transition border-t border-[#2A2E37]"
                        onMouseEnter={() => setHoveredId(log.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedLogs.has(log.id)}
                            onChange={() => toggleSelection(log.id)}
                            className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                          />
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <button
                            onClick={() => handleCopy(log.id)}
                            className="flex items-center gap-1 md:gap-1.5 font-mono text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94] hover:text-[#E8E6E1] transition"
                          >
                            <span>{log.id}</span>
                            <Copy size={9} className="md:w-[10px] md:h-[10px] lg:w-[10px] lg:h-[10px]" />
                            {isCopied && (
                              <span className="text-[#7FD98A] text-[8px] md:text-[9px] lg:text-[10px]">✓</span>
                            )}
                          </button>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <div>
                            <p className="text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] truncate max-w-[100px] md:max-w-[140px] lg:max-w-none">
                              {log.recipient}
                            </p>
                            <p className="text-[7px] md:text-[8px] lg:text-[10px] text-[#8B8D94] truncate max-w-[100px] md:max-w-[140px] lg:max-w-none">
                              {log.sender}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <p className="text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] truncate max-w-[80px] md:max-w-[120px] lg:max-w-none">
                            {log.campaign}
                          </p>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <p className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] truncate max-w-[80px] md:max-w-[120px] lg:max-w-[180px]">
                            {log.subject}
                          </p>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">{getStatusBadge(log.status)}</td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] truncate max-w-[80px] md:max-w-[120px] lg:max-w-none block">
                            {log.workspace}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <span className="text-[7px] md:text-[8px] lg:text-[11px] text-[#8B8D94] font-['JetBrains_Mono'] whitespace-nowrap">
                            {formatSentAt(log.sentAt)}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                          <button
                            className={`p-1 rounded transition ${
                              isHovered ? "text-[#E8E6E1] hover:bg-[#2A2E37]" : "text-[#8B8D94]"
                            }`}
                          >
                            <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 md:px-5 py-10 md:py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#2A2E37] mb-2 md:mb-3">
                          <Inbox size={16} className="md:w-[18px] md:h-[18px] lg:w-[20px] lg:h-[20px] text-[#8B8D94]" />
                        </div>
                        <p className="text-xs md:text-sm text-[#8B8D94]">
                          {error ? "Could not load logs" : "No logs found"}
                        </p>
                        <p className="text-[9px] md:text-xs text-[#6B727C] mt-1">
                          {error ? "Try refreshing the page" : "Try adjusting your filters"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
              <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of{" "}
                {filteredLogs.length} logs
              </span>
              <div className="flex items-center gap-1 md:gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-xs font-medium transition ${
                      p === page
                        ? "bg-[#FF6A39] text-white"
                        : "border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24]"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {totalPages > 5 && (
                  <>
                    <span className="text-[9px] md:text-xs text-[#8B8D94]">…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-xs font-medium transition ${
                        page === totalPages
                          ? "bg-[#FF6A39] text-white"
                          : "border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24]"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminEmailLogs;