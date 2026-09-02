// AdminEmailLogs.tsx
import React, { useState, useMemo } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Mail,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Eye,
  MoreHorizontal,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
  Send,
  Activity,
  Menu,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type EmailStatus = "Delivered" | "Opened" | "Clicked" | "Bounced" | "Failed" | "Spam";

interface EmailLog {
  id: string;
  recipient: string;
  sender: string;
  workspace: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const emailLogs: EmailLog[] = [
  {
    id: "LOG-10241",
    recipient: "john.doe@example.com",
    sender: "marketing@nimbusretail.com",
    workspace: "Nimbus Retail",
    campaign: "Summer Sale 2026",
    subject: "Summer Sale — 30% Off Everything!",
    status: "Opened",
    sentAt: "2026-08-20 14:32:21",
    openedAt: "2026-08-20 14:35:12",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "LOG-10240",
    recipient: "sarah.smith@venturehub.co",
    sender: "sales@venturehub.co",
    workspace: "VentureHub Co",
    campaign: "Weekly Newsletter #42",
    subject: "What's New This Week at VentureHub",
    status: "Delivered",
    sentAt: "2026-08-20 14:28:15",
    ipAddress: "10.0.0.1",
    userAgent: "Firefox/121.0.0.0",
  },
  {
    id: "LOG-10239",
    recipient: "mike.johnson@brightpath.org",
    sender: "hello@brightpath.org",
    workspace: "BrightPath Org",
    campaign: "Product Launch",
    subject: "Introducing Our New Product Line",
    status: "Clicked",
    sentAt: "2026-08-20 14:22:45",
    openedAt: "2026-08-20 14:25:30",
    clickedAt: "2026-08-20 14:26:18",
    ipAddress: "172.16.0.1",
    userAgent: "Safari/17.0.0.0",
  },
  {
    id: "LOG-10238",
    recipient: "emily.wilson@driftlabs.dev",
    sender: "dev@driftlabs.dev",
    workspace: "Driftlabs Dev",
    campaign: "Cart Abandonment Flow",
    subject: "You left something behind in your cart",
    status: "Bounced",
    sentAt: "2026-08-20 14:18:33",
    ipAddress: "192.168.1.2",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "LOG-10237",
    recipient: "david.kim@lumenstack.io",
    sender: "updates@lumenstack.io",
    workspace: "Lumenstack Inc",
    campaign: "Onboarding Sequence",
    subject: "Welcome to Lumenstack — Let's Get Started",
    status: "Opened",
    sentAt: "2026-08-20 14:15:09",
    openedAt: "2026-08-20 14:17:42",
    ipAddress: "10.0.0.2",
    userAgent: "Edge/120.0.0.0",
  },
  {
    id: "LOG-10236",
    recipient: "lisa.thompson@stackline.app",
    sender: "hello@stackline.app",
    workspace: "Stackline App",
    campaign: "Feature Announcement",
    subject: "New Features You'll Love",
    status: "Failed",
    sentAt: "2026-08-20 14:11:57",
    ipAddress: "172.16.0.2",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "LOG-10235",
    recipient: "alex.morgan@forgeworks.com",
    sender: "team@forgeworks.com",
    workspace: "Forgeworks",
    campaign: "Customer Feedback Survey",
    subject: "We'd Love Your Feedback",
    status: "Spam",
    sentAt: "2026-08-20 14:08:44",
    ipAddress: "192.168.1.3",
    userAgent: "Firefox/121.0.0.0",
  },
  {
    id: "LOG-10234",
    recipient: "priya.patel@meridiancorp.net",
    sender: "support@meridiancorp.net",
    workspace: "Meridian Corp",
    campaign: "Order Confirmation",
    subject: "Your Order #ORD-12345 is Confirmed",
    status: "Delivered",
    sentAt: "2026-08-20 14:05:21",
    ipAddress: "10.0.0.3",
    userAgent: "Safari/17.0.0.0",
  },
];

const stats = [
  { title: "Total Emails", value: "48,250", change: "+12.4%", trend: "up", icon: Mail },
  { title: "Delivered", value: "47,480", change: "+13.2%", trend: "up", icon: CheckCircle2 },
  { title: "Failed", value: "520", change: "-4.1%", trend: "down", icon: XCircle },
  { title: "Bounced", value: "250", change: "-2.8%", trend: "down", icon: AlertTriangle },
];

const statusConfig: Record<EmailStatus, { bg: string; text: string; icon: React.ElementType; dot: string }> = {
  Delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2, dot: "bg-emerald-400" },
  Opened: { bg: "bg-blue-500/15", text: "text-blue-400", icon: Eye, dot: "bg-blue-400" },
  Clicked: { bg: "bg-[#FF6A39]/15", text: "text-[#FF6A39]", icon: ArrowUpRight, dot: "bg-[#FF6A39]" },
  Bounced: { bg: "bg-amber-500/15", text: "text-amber-400", icon: AlertTriangle, dot: "bg-amber-400" },
  Failed: { bg: "bg-rose-500/15", text: "text-rose-400", icon: XCircle, dot: "bg-rose-400" },
  Spam: { bg: "bg-violet-500/15", text: "text-violet-400", icon: Inbox, dot: "bg-violet-400" },
};

const STATUS_FILTERS = ["All", "Delivered", "Opened", "Clicked", "Bounced", "Failed", "Spam"];
const WORKSPACE_FILTERS = ["All", "Nimbus Retail", "VentureHub Co", "BrightPath Org", "Driftlabs Dev", "Lumenstack Inc", "Stackline App", "Forgeworks", "Meridian Corp"];
const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days", "Last 90 days"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminEmailLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [workspaceFilter, setWorkspaceFilter] = useState("All");
  const [range, setRange] = useState(RANGES[1]);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    let result = emailLogs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.recipient.toLowerCase().includes(q) ||
          log.sender.toLowerCase().includes(q) ||
          log.campaign.toLowerCase().includes(q) ||
          log.subject.toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((log) => log.status === statusFilter);
    }

    if (workspaceFilter !== "All") {
      result = result.filter((log) => log.workspace === workspaceFilter);
    }

    return result;
  }, [search, statusFilter, workspaceFilter]);

  const toggleSelection = (id: string) => {
    setSelectedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLogs.size === filteredLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(filteredLogs.map((log) => log.id)));
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const getStatusBadge = (status: EmailStatus) => {
    const config = statusConfig[status];
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

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0E1013;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
        .log-row:hover {
          background-color: #1B1E24;
        }
        .stat-card {
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 480px) {
          .filter-controls {
            flex-direction: column;
            width: 100%;
          }
          .filter-controls select {
            width: 100%;
          }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#0E1013] h-screen w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
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
            <button className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition flex-1 sm:flex-none justify-center">
              <RefreshCw size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
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

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => {
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
                  <span
                    className={`flex items-center gap-0.5 text-[9px] md:text-[10px] lg:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" /> : <ArrowDownRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />}
                    {stat.change}
                  </span>
                </div>
                <h2 className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
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
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#C7C9CE] w-[100px] md:w-[150px] lg:w-[200px] placeholder:text-[#8B8D94]"
              />
            </div>

            <div className="filter-controls flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>

              <select
                value={workspaceFilter}
                onChange={(e) => setWorkspaceFilter(e.target.value)}
                className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
              >
                {WORKSPACE_FILTERS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>

            {selectedLogs.size > 0 && (
              <span className="text-[9px] md:text-xs text-[#8B8D94]">{selectedLogs.size} selected</span>
            )}
          </div>

          <div className="text-[9px] md:text-xs text-[#8B8D94]">
            Showing {filteredLogs.length} of {emailLogs.length} logs
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
                      checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
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
                {filteredLogs.map((log) => {
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
                          <span className="hidden xs:inline">{log.id}</span>
                          <span className="xs:hidden">{log.id.substring(0, 8)}</span>
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
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] truncate max-w-[80px] md:max-w-[120px] lg:max-w-none block">
                          {log.workspace}
                        </span>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <span className="text-[7px] md:text-[8px] lg:text-[11px] text-[#8B8D94] font-['JetBrains_Mono'] whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleDateString()}
                          <span className="hidden md:inline"> {new Date(log.sentAt).toLocaleTimeString()}</span>
                        </span>
                      </td>
                      <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                        <button
                          className={`p-1 rounded transition ${
                            isHovered
                              ? "text-[#E8E6E1] hover:bg-[#2A2E37]"
                              : "text-[#8B8D94]"
                          }`}
                        >
                          <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 md:px-5 py-10 md:py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#2A2E37] mb-2 md:mb-3">
                          <Inbox size={16} className="md:w-[18px] md:h-[18px] lg:w-[20px] lg:h-[20px] text-[#8B8D94]" />
                        </div>
                        <p className="text-xs md:text-sm text-[#8B8D94]">No logs found</p>
                        <p className="text-[9px] md:text-xs text-[#6B727C] mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
            <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">
              Showing 1-{Math.min(filteredLogs.length, 10)} of {filteredLogs.length} logs
            </span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[9px] md:text-xs font-medium">
                1
              </button>
              <button className="hidden sm:inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
                2
              </button>
              <button className="hidden sm:inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
                3
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
                <ChevronRight size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEmailLogs;