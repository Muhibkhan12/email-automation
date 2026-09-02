// AdminSenderAccounts.tsx
import React, { useState, useMemo } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  AtSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Gauge,
  Mail,
  Send,
  Zap,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Menu,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type SenderStatus = "Active" | "Warning" | "Disconnected" | "Suspended";
type SenderProvider = "Gmail" | "Outlook" | "Custom SMTP" | "Amazon SES" | "SendGrid";

interface SenderAccount {
  id: string;
  email: string;
  name: string;
  provider: SenderProvider;
  status: SenderStatus;
  dailyLimit: number;
  sentToday: number;
  weeklySent: number;
  monthlySent: number;
  totalSent: number;
  hourlyLimit: number;
  sentThisHour: number;
  campaigns: number;
  openRate: number;
  bounceRate: number;
  spamRate: number;
  lastActive: string;
  joined: string;
  smtpHost?: string;
  smtpPort?: number;
  encryption?: "TLS" | "SSL" | "None";
  apiKey?: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const initialSenderAccounts: SenderAccount[] = [
  {
    id: "s1",
    email: "marketing@nimbusretail.com",
    name: "Marketing",
    provider: "Gmail",
    status: "Active",
    dailyLimit: 500,
    sentToday: 342,
    weeklySent: 2140,
    monthlySent: 8420,
    totalSent: 18420,
    hourlyLimit: 100,
    sentThisHour: 64,
    campaigns: 12,
    openRate: 52.4,
    bounceRate: 1.2,
    spamRate: 0.3,
    lastActive: "2 min ago",
    joined: "Jan 2025",
  },
  {
    id: "s2",
    email: "sales@venturehub.co",
    name: "Sales",
    provider: "Outlook",
    status: "Active",
    dailyLimit: 500,
    sentToday: 286,
    weeklySent: 1890,
    monthlySent: 7200,
    totalSent: 15830,
    hourlyLimit: 100,
    sentThisHour: 72,
    campaigns: 8,
    openRate: 48.1,
    bounceRate: 0.8,
    spamRate: 0.1,
    lastActive: "15 min ago",
    joined: "Mar 2025",
  },
  {
    id: "s3",
    email: "hello@brightpath.org",
    name: "General",
    provider: "Custom SMTP",
    status: "Warning",
    dailyLimit: 300,
    sentToday: 274,
    weeklySent: 1620,
    monthlySent: 6100,
    totalSent: 13920,
    hourlyLimit: 60,
    sentThisHour: 57,
    campaigns: 5,
    openRate: 39.8,
    bounceRate: 4.2,
    spamRate: 1.8,
    lastActive: "1 hour ago",
    joined: "Nov 2024",
    smtpHost: "smtp.brightpath.org",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "s4",
    email: "support@meridiancorp.net",
    name: "Support",
    provider: "Amazon SES",
    status: "Disconnected",
    dailyLimit: 500,
    sentToday: 0,
    weeklySent: 0,
    monthlySent: 0,
    totalSent: 0,
    hourlyLimit: 100,
    sentThisHour: 0,
    campaigns: 0,
    openRate: 0,
    bounceRate: 0,
    spamRate: 0,
    lastActive: "2 weeks ago",
    joined: "Aug 2024",
  },
  {
    id: "s5",
    email: "updates@lumenstack.io",
    name: "Updates",
    provider: "SendGrid",
    status: "Active",
    dailyLimit: 1000,
    sentToday: 876,
    weeklySent: 5400,
    monthlySent: 22100,
    totalSent: 51200,
    hourlyLimit: 200,
    sentThisHour: 142,
    campaigns: 15,
    openRate: 61.2,
    bounceRate: 0.6,
    spamRate: 0.2,
    lastActive: "5 min ago",
    joined: "Jun 2025",
  },
  {
    id: "s6",
    email: "dev@driftlabs.dev",
    name: "Development",
    provider: "Custom SMTP",
    status: "Suspended",
    dailyLimit: 200,
    sentToday: 0,
    weeklySent: 0,
    monthlySent: 0,
    totalSent: 3420,
    hourlyLimit: 50,
    sentThisHour: 0,
    campaigns: 0,
    openRate: 0,
    bounceRate: 0,
    spamRate: 0,
    lastActive: "3 days ago",
    joined: "Oct 2024",
    smtpHost: "smtp.driftlabs.dev",
    smtpPort: 465,
    encryption: "SSL",
  },
];

const stats = [
  { title: "Total Accounts", value: "6", change: "+2", trend: "up", icon: AtSign },
  { title: "Active", value: "3", change: "50%", trend: "up", icon: CheckCircle2 },
  { title: "Total Sent", value: "48.2K", change: "+12.4%", trend: "up", icon: Send },
  { title: "Avg. Open Rate", value: "52.4%", change: "+2.1%", trend: "up", icon: Eye },
];

const statusConfig: Record<SenderStatus, { bg: string; text: string; icon: React.ElementType; dot: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: ShieldCheck, dot: "bg-emerald-400" },
  Warning: { bg: "bg-amber-500/15", text: "text-amber-400", icon: ShieldAlert, dot: "bg-amber-400" },
  Disconnected: { bg: "bg-rose-500/15", text: "text-rose-400", icon: ShieldX, dot: "bg-rose-400" },
  Suspended: { bg: "bg-slate-500/15", text: "text-slate-400", icon: Shield, dot: "bg-slate-400" },
};

const providerColors: Record<SenderProvider, { bg: string; text: string; icon: string }> = {
  Gmail: { bg: "bg-rose-500/15", text: "text-rose-400", icon: "G" },
  Outlook: { bg: "bg-blue-500/15", text: "text-blue-400", icon: "O" },
  "Custom SMTP": { bg: "bg-violet-500/15", text: "text-violet-400", icon: "SM" },
  "Amazon SES": { bg: "bg-amber-500/15", text: "text-amber-400", icon: "SES" },
  SendGrid: { bg: "bg-cyan-500/15", text: "text-cyan-400", icon: "SG" },
};

const FILTERS = ["All", "Active", "Warning", "Disconnected", "Suspended"];
const PROVIDER_FILTERS = ["All", "Gmail", "Outlook", "Custom SMTP", "Amazon SES", "SendGrid"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminSenderAccounts = () => {
  const [senderAccounts, setSenderAccounts] = useState(initialSenderAccounts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SenderAccount | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SenderAccount>>({
    email: "",
    name: "",
    provider: "Gmail",
    dailyLimit: 500,
    hourlyLimit: 100,
    smtpHost: "",
    smtpPort: 587,
    encryption: "TLS",
  });

  const filteredAccounts = useMemo(() => {
    let result = senderAccounts;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.email.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.provider.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (providerFilter !== "All") {
      result = result.filter((a) => a.provider === providerFilter);
    }

    return result;
  }, [search, statusFilter, providerFilter, senderAccounts]);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({
      email: "",
      name: "",
      provider: "Gmail",
      dailyLimit: 500,
      hourlyLimit: 100,
      smtpHost: "",
      smtpPort: 587,
      encryption: "TLS",
    });
    setShowModal(true);
  };

  const handleEditAccount = (account: SenderAccount) => {
    setEditingAccount(account);
    setFormData({ ...account });
    setShowModal(true);
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sender account?")) {
      setSenderAccounts(senderAccounts.filter((a) => a.id !== id));
    }
  };

  const handleSaveAccount = () => {
    if (!formData.email || !formData.name) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingAccount) {
      setSenderAccounts(
        senderAccounts.map((a) =>
          a.id === editingAccount.id
            ? { ...a, ...formData, id: a.id } as SenderAccount
            : a
        )
      );
    } else {
      const newAccount: SenderAccount = {
        id: `s${Date.now()}`,
        email: formData.email!,
        name: formData.name!,
        provider: formData.provider as SenderProvider,
        status: "Active",
        dailyLimit: formData.dailyLimit || 500,
        sentToday: 0,
        weeklySent: 0,
        monthlySent: 0,
        totalSent: 0,
        hourlyLimit: formData.hourlyLimit || 100,
        sentThisHour: 0,
        campaigns: 0,
        openRate: 0,
        bounceRate: 0,
        spamRate: 0,
        lastActive: "Just now",
        joined: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        encryption: formData.encryption as "TLS" | "SSL" | "None",
      };
      setSenderAccounts([newAccount, ...senderAccounts]);
    }

    setShowModal(false);
    setEditingAccount(null);
    setFormData({});
  };

  const toggleSelection = (id: string) => {
    setSelectedAccounts((prev) => {
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
    if (selectedAccounts.size === filteredAccounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(filteredAccounts.map((a) => a.id)));
    }
  };

  const getStatusBadge = (status: SenderStatus) => {
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

  const getProviderBadge = (provider: SenderProvider) => {
    const config = providerColors[provider];
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.icon}
      </span>
    );
  };

  const getUsageColor = (sent: number, limit: number) => {
    const percentage = (sent / limit) * 100;
    if (percentage >= 90) return "text-rose-400";
    if (percentage >= 70) return "text-amber-400";
    return "text-emerald-400";
  };

  const getUsageWidth = (sent: number, limit: number) => {
    return Math.min((sent / limit) * 100, 100);
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
        .stat-card {
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .account-row:hover {
          background-color: #1B1E24;
        }
        .modal-overlay {
          background: rgba(14, 16, 19, 0.8);
          backdrop-filter: blur(4px);
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
                  Sender Accounts
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Manage sender accounts across all workspaces.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddAccount}
            className="flex items-center gap-1.5 md:gap-2 rounded-lg bg-[#FF6A39] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white shadow-lg shadow-[#FF6A39]/20 hover:bg-[#e85a2c] transition w-full sm:w-auto justify-center"
          >
            <Plus size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" />
            <span className="hidden xs:inline">Add Sender Account</span>
            <span className="xs:hidden">Add</span>
          </button>
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
                    {stat.trend === "up" ? <TrendingUp size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" /> : <TrendingDown size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />}
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
                placeholder="Search sender accounts..."
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
                {FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
              >
                {PROVIDER_FILTERS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            {selectedAccounts.size > 0 && (
              <span className="text-[9px] md:text-xs text-[#8B8D94]">{selectedAccounts.size} selected</span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
            <button className="flex items-center gap-1 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[9px] md:text-xs font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition">
              <RefreshCw size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" />
              <span className="hidden xs:inline">Refresh</span>
            </button>
            <button className="flex items-center gap-1 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[9px] md:text-xs font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition">
              <Filter size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" />
              <span className="hidden xs:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Accounts List */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] md:min-w-[1000px] lg:min-w-[1200px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37] bg-[#0E1013]">
                <tr>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-6 md:w-8 lg:w-10">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.size === filteredAccounts.length && filteredAccounts.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                    />
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Account</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Provider</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Status</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Daily</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Hourly</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sent</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Performance</th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const isHovered = hoveredId === account.id;
                  const dailyPercent = getUsageWidth(account.sentToday, account.dailyLimit);
                  const hourlyPercent = getUsageWidth(account.sentThisHour, account.hourlyLimit);

                  return (
                    <tr
                      key={account.id}
                      className="account-row transition border-t border-[#2A2E37]"
                      onMouseEnter={() => setHoveredId(account.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.has(account.id)}
                          onChange={() => toggleSelection(account.id)}
                          className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                        />
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10 text-[#FF6A39] text-[9px] md:text-xs lg:text-sm font-semibold shrink-0">
                            {account.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] lg:text-[13.5px] font-medium text-[#E8E6E1] truncate">
                              {account.name}
                            </p>
                            <p className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94] truncate">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        {getProviderBadge(account.provider)}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        {getStatusBadge(account.status)}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <div className="w-16 md:w-20 lg:w-32">
                          <div className="flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px] mb-0.5 md:mb-1">
                            <span className="text-[#8B8D94]">{account.sentToday}</span>
                            <span className={`font-medium ${getUsageColor(account.sentToday, account.dailyLimit)}`}>
                              / {account.dailyLimit}
                            </span>
                          </div>
                          <div className="h-1 md:h-1.5 w-full overflow-hidden rounded-full bg-[#2A2E37]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                dailyPercent >= 90
                                  ? "bg-rose-500"
                                  : dailyPercent >= 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${dailyPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <div className="w-16 md:w-20 lg:w-32">
                          <div className="flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px] mb-0.5 md:mb-1">
                            <span className="text-[#8B8D94]">{account.sentThisHour}</span>
                            <span className={`font-medium ${getUsageColor(account.sentThisHour, account.hourlyLimit)}`}>
                              / {account.hourlyLimit}
                            </span>
                          </div>
                          <div className="h-1 md:h-1.5 w-full overflow-hidden rounded-full bg-[#2A2E37]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                hourlyPercent >= 90
                                  ? "bg-rose-500"
                                  : hourlyPercent >= 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${hourlyPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <div>
                          <p className="text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                            {account.totalSent.toLocaleString()}
                          </p>
                          <p className="text-[7px] md:text-[8px] lg:text-[9px] text-[#8B8D94]">
                            {account.campaigns} campaigns
                          </p>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <div className="space-y-0.5 md:space-y-1">
                          <div className="flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px]">
                            <span className="text-[#8B8D94]">Open</span>
                            <span className="text-[#E8E6E1] font-['JetBrains_Mono']">
                              {account.openRate}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] md:text-[9px] lg:text-[10px]">
                            <span className="text-[#8B8D94]">Bounce</span>
                            <span className={`font-['JetBrains_Mono'] ${
                              account.bounceRate > 5
                                ? "text-rose-400"
                                : account.bounceRate > 2
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}>
                              {account.bounceRate}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                        <div className="flex items-center justify-end gap-0.5 md:gap-1">
                          <button
                            onClick={() => handleEditAccount(account)}
                            className={`p-1 md:p-1.5 rounded transition ${
                              isHovered
                                ? "text-[#E8E6E1] hover:bg-[#2A2E37]"
                                : "text-[#8B8D94]"
                            }`}
                          >
                            <Edit size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className={`p-1 md:p-1.5 rounded transition ${
                              isHovered
                                ? "text-rose-400 hover:bg-rose-500/10"
                                : "text-[#8B8D94]"
                            }`}
                          >
                            <Trash2 size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                          </button>
                          <button
                            className={`p-1 md:p-1.5 rounded transition ${
                              isHovered
                                ? "text-[#E8E6E1] hover:bg-[#2A2E37]"
                                : "text-[#8B8D94]"
                            }`}
                          >
                            <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 md:px-5 py-10 md:py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#2A2E37] mb-2 md:mb-3">
                          <AtSign size={16} className="md:w-[18px] md:h-[18px] lg:w-[20px] lg:h-[20px] text-[#8B8D94]" />
                        </div>
                        <p className="text-xs md:text-sm text-[#8B8D94]">No sender accounts found</p>
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
              Showing {filteredAccounts.length} of {senderAccounts.length} accounts
            </span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[9px] md:text-xs font-medium">
                1
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
                <ChevronRight size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal - Responsive */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-3 md:p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-[#171A21] border border-[#2A2E37] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#2A2E37] p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[#FF6A39]/10 shrink-0">
                    <AtSign size={16} className="md:w-[17px] md:h-[17px] lg:w-[18px] lg:h-[18px] text-[#FF6A39]" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1]">
                      {editingAccount ? "Edit Sender Account" : "Add Sender Account"}
                    </h2>
                    <p className="text-[10px] md:text-sm text-[#8B8D94]">
                      {editingAccount
                        ? "Update the sender account configuration"
                        : "Add a new sender account to the platform"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 md:p-2 text-[#8B8D94] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition shrink-0"
                >
                  <X size={16} className="md:w-[17px] md:h-[17px] lg:w-[18px] lg:h-[18px]" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sender@company.com"
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Display Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Marketing"
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Provider
                    </label>
                    <select
                      value={formData.provider || "Gmail"}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value as SenderProvider })}
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    >
                      <option value="Gmail">Gmail</option>
                      <option value="Outlook">Outlook</option>
                      <option value="Custom SMTP">Custom SMTP</option>
                      <option value="Amazon SES">Amazon SES</option>
                      <option value="SendGrid">SendGrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Status
                    </label>
                    <select
                      value={formData.status || "Active"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as SenderStatus })}
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Warning">Warning</option>
                      <option value="Disconnected">Disconnected</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={formData.dailyLimit || 500}
                      onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                      Hourly Limit
                    </label>
                    <input
                      type="number"
                      value={formData.hourlyLimit || 100}
                      onChange={(e) => setFormData({ ...formData, hourlyLimit: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                </div>

                {formData.provider === "Custom SMTP" && (
                  <div className="space-y-3 md:space-y-4 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 md:p-4">
                    <h4 className="text-[11px] md:text-sm font-medium text-[#E8E6E1]">SMTP Configuration</h4>
                    <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={formData.smtpHost || ""}
                          onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                          placeholder="smtp.company.com"
                          className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={formData.smtpPort || 587}
                          onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                          placeholder="587"
                          className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 md:mb-2 block text-[11px] md:text-sm font-medium text-[#C7C9CE]">
                        Encryption
                      </label>
                      <select
                        value={formData.encryption || "TLS"}
                        onChange={(e) => setFormData({ ...formData, encryption: e.target.value as "TLS" | "SSL" | "None" })}
                        className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                      >
                        <option value="TLS">TLS</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                )}

                {editingAccount && (
                  <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 md:p-4">
                    <h4 className="text-[11px] md:text-sm font-medium text-[#E8E6E1]">Account Statistics</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 md:gap-4 text-[11px] md:text-sm">
                      <div>
                        <span className="text-[#8B8D94]">Total Sent</span>
                        <p className="text-[#E8E6E1] font-['JetBrains_Mono']">
                          {editingAccount.totalSent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#8B8D94]">Campaigns</span>
                        <p className="text-[#E8E6E1] font-['JetBrains_Mono']">
                          {editingAccount.campaigns}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#8B8D94]">Open Rate</span>
                        <p className="text-[#E8E6E1] font-['JetBrains_Mono']">
                          {editingAccount.openRate}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[#8B8D94]">Bounce Rate</span>
                        <p className="text-[#E8E6E1] font-['JetBrains_Mono']">
                          {editingAccount.bounceRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 md:gap-3 border-t border-[#2A2E37] p-4 md:p-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#2A2E37] px-3 md:px-4 py-1.5 md:py-2.5 text-[11px] md:text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccount}
                  className="flex items-center gap-1.5 md:gap-2 rounded-lg bg-[#FF6A39] px-4 md:px-5 py-1.5 md:py-2.5 text-[11px] md:text-sm font-medium text-white hover:bg-[#e85a2c] transition"
                >
                  <Save size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" />
                  {editingAccount ? "Update Account" : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSenderAccounts;