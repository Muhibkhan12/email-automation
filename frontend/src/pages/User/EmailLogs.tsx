import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
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
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type EmailStatus = "Sent" | "Delivered" | "Failed" | "Bounced";

interface EmailLog {
  id: string;
  recipient: string;
  sender: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
}

const emailLogs: EmailLog[] = [
  {
    id: "LOG-10241",
    recipient: "john@example.com",
    sender: "marketing@company.com",
    campaign: "Summer Promotion",
    subject: "Summer Sale — 30% Off",
    status: "Delivered",
    sentAt: "Today, 04:32 PM",
  },
  {
    id: "LOG-10240",
    recipient: "sarah@example.com",
    sender: "sales@company.com",
    campaign: "Product Launch",
    subject: "Introducing Our New Product",
    status: "Sent",
    sentAt: "Today, 04:29 PM",
  },
  {
    id: "LOG-10239",
    recipient: "alex@example.com",
    sender: "hello@company.com",
    campaign: "August Newsletter",
    subject: "What's New This Month?",
    status: "Delivered",
    sentAt: "Today, 04:21 PM",
  },
  {
    id: "LOG-10238",
    recipient: "mike@example.com",
    sender: "marketing@company.com",
    campaign: "Summer Promotion",
    subject: "Summer Sale — 30% Off",
    status: "Failed",
    sentAt: "Today, 04:18 PM",
  },
  {
    id: "LOG-10237",
    recipient: "emma@example.com",
    sender: "sales@company.com",
    campaign: "Product Launch",
    subject: "Introducing Our New Product",
    status: "Bounced",
    sentAt: "Today, 04:15 PM",
  },
];

const PAGE_SIZE = 5;

const EmailLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All time");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return emailLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.recipient.toLowerCase().includes(q) ||
        log.sender.toLowerCase().includes(q) ||
        log.campaign.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || log.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar />

      <main className="flex-1 p-6 md:p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#E8E6E1]">
              Email Logs
            </h1>
            <p className="mt-1 text-sm text-[#9BA0A8]">
              Track every email sent through your campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors"
              style={{ 
                borderColor: "#2A2E37", 
                background: "#12151B", 
                color: "#C7C9CE" 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1B1E24";
                e.currentTarget.style.color = "#E8E6E1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#12151B";
                e.currentTarget.style.color = "#C7C9CE";
              }}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button 
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ 
                background: "#FF6A39",
                boxShadow: "0 4px 12px rgba(255,106,57,0.25)"
              }}
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Emails"
            value="48,250"
            description="All email attempts"
            icon={Inbox}
            accent="text-[#9BA0A8] bg-[#1B1E24]"
          />
          <StatCard
            title="Delivered"
            value="47,480"
            description="98.4% delivery rate"
            icon={CheckCircle2}
            accent="text-emerald-400 bg-emerald-500/10"
          />
          <StatCard
            title="Failed"
            value="520"
            description="1.1% failure rate"
            icon={XCircle}
            accent="text-rose-400 bg-rose-500/10"
          />
          <StatCard
            title="Bounced"
            value="250"
            description="0.5% bounce rate"
            icon={AlertTriangle}
            accent="text-amber-400 bg-amber-500/10"
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border p-4 shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B727C]"
              />
              <input
                type="text"
                placeholder="Search recipient, sender, campaign, or subject…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition"
                style={{ 
                  borderColor: "#2A2E37", 
                  background: "#0B0E12", 
                  color: "#E8E6E1"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FF6A39";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2A2E37";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border px-3.5 py-2.5 text-sm outline-none transition"
                style={{ 
                  borderColor: "#2A2E37", 
                  background: "#0B0E12", 
                  color: "#E8E6E1"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FF6A39";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2A2E37";
                }}
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
                className="rounded-lg border px-3.5 py-2.5 text-sm outline-none transition"
                style={{ 
                  borderColor: "#2A2E37", 
                  background: "#0B0E12", 
                  color: "#E8E6E1"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FF6A39";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2A2E37";
                }}
              >
                <option>All time</option>
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "All") && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#6B727C]">
              <span>
                {filteredLogs.length} result{filteredLogs.length !== 1 && "s"}
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPage(1);
                }}
                className="font-medium underline underline-offset-2 text-[#FF6A39] hover:text-[#e85a2c]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#2A2E37" }}>
            <div>
              <h2 className="text-sm font-semibold text-[#E8E6E1]">Email Activity</h2>
              <p className="mt-0.5 text-xs text-[#6B727C]">
                {filteredLogs.length} logs matching current filters
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: "#2A2E37", color: "#6B727C", background: "#0B0E12" }}>
                  <th className="px-6 py-3.5 font-medium">Recipient</th>
                  <th className="px-6 py-3.5 font-medium">Campaign</th>
                  <th className="px-6 py-3.5 font-medium">Subject</th>
                  <th className="px-6 py-3.5 font-medium">Sender</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Sent At</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#2A2E37" }}>
                {paginatedLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="group transition hover:bg-[#1B1E24]"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1B1E24";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#E8E6E1]">{log.recipient}</p>
                      <button
                        onClick={() => handleCopy(log.id)}
                        className="mt-1 flex items-center gap-1 font-mono text-[11px] text-[#6B727C] hover:text-[#E8E6E1]"
                      >
                        {log.id}
                        <Copy size={10} />
                        {copiedId === log.id && (
                          <span className="ml-1 text-emerald-400">Copied</span>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md px-2.5 py-1 text-xs font-medium" style={{ background: "#1B1E24", color: "#C7C9CE" }}>
                        {log.campaign}
                      </span>
                    </td>

                    <td className="max-w-[220px] px-6 py-4">
                      <p className="truncate text-sm text-[#9BA0A8]">{log.subject}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-[#9BA0A8]">{log.sender}</p>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B727C]">
                      {log.sentAt}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-[#6B727C] opacity-0 transition group-hover:opacity-100 hover:bg-[#1B1E24] hover:text-[#E8E6E1]">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "#1B1E24" }}>
                <Inbox size={18} className="text-[#6B727C]" />
              </div>
              <h3 className="text-sm font-medium text-[#E8E6E1]">No emails found</h3>
              <p className="mt-1 text-sm text-[#6B727C]">
                Try adjusting your search or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#2A2E37" }}>
              <p className="text-sm text-[#6B727C]">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ 
                    borderColor: "#2A2E37", 
                    color: "#C7C9CE",
                    background: "transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = "#1B1E24";
                      e.currentTarget.style.color = "#E8E6E1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#C7C9CE";
                  }}
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                      p === page
                        ? "border-[#FF6A39] bg-[#FF6A39] text-white"
                        : "border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ 
                    borderColor: "#2A2E37", 
                    color: "#C7C9CE",
                    background: "transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = "#1B1E24";
                      e.currentTarget.style.color = "#E8E6E1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#C7C9CE";
                  }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ========================= */
/* Stat Card */
/* ========================= */

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

const StatCard = ({ title, value, description, icon: Icon, accent }: StatCardProps) => {
  const isEmber = title === "Total Emails";
  return (
    <div className="rounded-xl border p-5 shadow-sm transition hover:shadow-md" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#9BA0A8]">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          isEmber ? "bg-ember-soft" : ""
        } ${!isEmber ? accent : ""}`}
        style={{ background: isEmber ? "rgba(255,106,57,0.12)" : undefined }}
        >
          <Icon size={16} className={isEmber ? "text-[#FF6A39]" : ""} style={{ color: isEmber ? "#FF6A39" : undefined }} />
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#E8E6E1]">{value}</h2>
      <p className="mt-1.5 text-xs text-[#6B727C]">{description}</p>
    </div>
  );
};

/* ========================= */
/* Status Badge */
/* ========================= */

const statusConfig: Record<
  EmailStatus,
  { className: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Sent: { className: "bg-blue-500/10 text-blue-400", icon: Clock },
  Delivered: { className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  Failed: { className: "bg-rose-500/10 text-rose-400", icon: XCircle },
  Bounced: { className: "bg-amber-500/10 text-amber-400", icon: AlertTriangle },
};

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const { className, icon: Icon } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
};

export default EmailLogs;