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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Email Logs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track every email sent through your campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <RefreshCw size={15} />
              Refresh
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
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
            accent="text-slate-900 bg-slate-100"
          />
          <StatCard
            title="Delivered"
            value="47,480"
            description="98.4% delivery rate"
            icon={CheckCircle2}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Failed"
            value="520"
            description="1.1% failure rate"
            icon={XCircle}
            accent="text-rose-600 bg-rose-50"
          />
          <StatCard
            title="Bounced"
            value="250"
            description="0.5% bounce rate"
            icon={AlertTriangle}
            accent="text-amber-600 bg-amber-50"
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search recipient, sender, campaign, or subject…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
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
                className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option>All time</option>
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "All") && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>
                {filteredLogs.length} result{filteredLogs.length !== 1 && "s"}
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPage(1);
                }}
                className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Email Activity</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredLogs.length} logs matching current filters
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5 font-medium">Recipient</th>
                  <th className="px-6 py-3.5 font-medium">Campaign</th>
                  <th className="px-6 py-3.5 font-medium">Subject</th>
                  <th className="px-6 py-3.5 font-medium">Sender</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Sent At</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="group transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{log.recipient}</p>
                      <button
                        onClick={() => handleCopy(log.id)}
                        className="mt-1 flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-slate-700"
                      >
                        {log.id}
                        <Copy size={10} />
                        {copiedId === log.id && (
                          <span className="ml-1 text-emerald-600">Copied</span>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {log.campaign}
                      </span>
                    </td>

                    <td className="max-w-[220px] px-6 py-4">
                      <p className="truncate text-sm text-slate-600">{log.subject}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{log.sender}</p>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {log.sentAt}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700">
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
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <Inbox size={18} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">No emails found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</h2>
      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
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
  Sent: { className: "bg-blue-50 text-blue-700", icon: Clock },
  Delivered: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  Failed: { className: "bg-rose-50 text-rose-700", icon: XCircle },
  Bounced: { className: "bg-amber-50 text-amber-700", icon: AlertTriangle },
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