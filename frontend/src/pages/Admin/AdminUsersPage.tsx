// AdminUsers.tsx
import React, { useContext, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Users, Search, MoreHorizontal, UserPlus, Shield, ShieldCheck, ArrowUpDown,
  ChevronLeft, ChevronRight, ChevronDown, Trash2, Edit, Key, Ban, UserCheck,
  ArrowUpRight, ArrowDownRight, Send, AlertTriangle, CheckCircle2, XCircle,
  Menu, X,
} from "lucide-react";

import UsersContext from "../../contexts/UsersContext";
import type { UserWithSenderAccounts } from "../../types/UserTypes";

/* ------------------------------------------------------------------ */
/* Constants + lookup tables                                          */
/* ------------------------------------------------------------------ */

const FILTERS = ["All", "Active", "Suspended"];
const ROLES = ["All", "ADMIN", "EMPLOYEE"];

type SenderStatus = "Connected" | "Warning" | "Error" | "Disconnected";

const roleColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  ADMIN: { bg: "bg-purple-500/10", text: "text-purple-400", icon: ShieldCheck },
  EMPLOYEE: { bg: "bg-blue-500/10", text: "text-blue-400", icon: Shield },
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Suspended: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  Inactive: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

const senderStatusColors: Record<SenderStatus, { bg: string; text: string; bar: string; icon: React.ElementType }> = {
  Connected: { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-400", icon: CheckCircle2 },
  Warning: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-400", icon: AlertTriangle },
  Error: { bg: "bg-red-500/10", text: "text-red-400", bar: "bg-red-400", icon: XCircle },
  Disconnected: { bg: "bg-gray-500/10", text: "text-gray-400", bar: "bg-gray-400", icon: XCircle },
};

const getSenderStatus = (status?: string): SenderStatus =>
  status === "Connected" || status === "Warning" || status === "Error" || status === "Disconnected"
    ? status
    : "Disconnected";

// All providers currently render the same icon; kept as a function so a
// provider-specific icon can be dropped in later without touching callers.
const getProviderIcon = (_provider?: string) => Send;

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

type Stat = {
  title: string; value: string; change: string; trend: string;
  icon: React.ElementType; accent: string; isRatio?: boolean;
};

const StatCard = ({ stat }: { stat: Stat }) => {
  const Icon = stat.icon;
  return (
    <div className="stat-card rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-5 border border-[#2A2E37] hover:border-[#3A3F4A]">
      <div className="flex items-start justify-between">
        <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg" style={{ background: `${stat.accent}15` }}>
          <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: stat.accent }} />
        </div>
        {stat.isRatio ? (
          <span className="text-[9px] md:text-[10px] lg:text-[11.5px] font-medium text-[#8B8D94]">{stat.change}</span>
        ) : (
          <span className={`flex items-center gap-0.5 text-[9px] md:text-[10px] lg:text-[11.5px] font-medium ${stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"}`}>
            {stat.trend === "up" ? <ArrowUpRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" /> : <ArrowDownRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />}
            {stat.change}
          </span>
        )}
      </div>
      <h2 className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">{stat.value}</h2>
      <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE]">{stat.title}</p>
    </div>
  );
};

const SenderAccountCard = ({ account }: { account: UserWithSenderAccounts["sender_accounts"][number] }) => {
  const status = getSenderStatus(account.status);
  const style = senderStatusColors[status];
  const StatusIcon = style.icon;
  const ProviderIcon = getProviderIcon(account.provider);
  const sentToday = account.sentToday ?? 0;
  const dailyLimit = account.dailyLimit ?? 100;
  const usagePct = dailyLimit > 0 ? Math.min(100, Math.round((sentToday / dailyLimit) * 100)) : 0;

  return (
    <div className="flex items-center gap-2 md:gap-3 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2.5 md:px-3.5 py-2.5 md:py-3">
      <div className="flex h-7 w-7 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0E1013] border border-[#2A2E37]">
        <ProviderIcon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] text-[#8B8D94]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <p className="truncate text-[10px] md:text-[11px] lg:text-[12.5px] font-medium text-[#E8E6E1]">{account.email}</p>
          <span className={`inline-flex flex-shrink-0 items-center gap-0.5 md:gap-1 rounded-full px-1 md:px-1.5 py-0.5 text-[8px] md:text-[9px] lg:text-[10px] font-medium ${style.bg} ${style.text}`}>
            <StatusIcon size={7} className="md:w-[8px] md:h-[8px] lg:w-[9px] lg:h-[9px]" />
            <span className="hidden xs:inline">{status}</span>
            <span className="xs:hidden">{status.charAt(0)}</span>
          </span>
        </div>

        <div className="mt-1 md:mt-1.5 flex items-center gap-1.5 md:gap-2">
          <div className="h-1 flex-1 rounded-full bg-[#0E1013] overflow-hidden">
            <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${usagePct}%` }} />
          </div>
          <span className="flex-shrink-0 text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94] font-['JetBrains_Mono']">
            {sentToday}/{dailyLimit}
          </span>
        </div>

        {account.warmupProgress !== undefined && (
          <p className="mt-0.5 md:mt-1 text-[8px] md:text-[9px] lg:text-[10px] text-[#4FA3FF]">Warming up · {account.warmupProgress}%</p>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminUsers = () => {
  // Users come from UsersContext; this page never calls axios directly.
  const context = useContext(UsersContext);
  const users = context?.users ?? [];
  const loading = context?.loading ?? false;
  const error = context?.error ?? null;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof UserWithSenderAccounts>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalSenderAccounts = useMemo(
    () => users.reduce((sum, u) => sum + (u.sender_accounts?.length ?? 0), 0),
    [users]
  );

  const connectedSenderAccounts = useMemo(
    () =>
      users.reduce(
        (sum, u) => sum + (u.sender_accounts ?? []).filter((a) => getSenderStatus(a.status) === "Connected").length,
        0
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => {
        const username = u.username?.toLowerCase() ?? "";
        const email = u.email?.toLowerCase() ?? "";
        const senderMatch = u.sender_accounts?.some((a) => a.email?.toLowerCase().includes(q)) ?? false;
        return username.includes(q) || email.includes(q) || senderMatch;
      });
    }

    if (roleFilter !== "All") {
      result = result.filter((u) => u.role === roleFilter);
    }

    result.sort((a, b) => {
      const cmp = String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""));
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, search, roleFilter, sortField, sortDirection]);

  const toggleSort = (field: keyof UserWithSenderAccounts) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleInSet = (set: Set<number>, id: number) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const toggleUserSelection = (id: number) => setSelectedUsers((prev) => toggleInSet(prev, id));
  const toggleExpanded = (id: number) => setExpandedUsers((prev) => toggleInSet(prev, id));

  const toggleAllUsers = () => {
    setSelectedUsers(
      selectedUsers.size === filteredUsers.length ? new Set() : new Set(filteredUsers.map((u) => u.id))
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0E1013]">
        <div className="sticky top-0 h-screen flex-shrink-0"><AdminSidebar /></div>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-xs md:text-sm text-[#8B8D94]">Loading users...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#0E1013]">
        <div className="sticky top-0 h-screen flex-shrink-0"><AdminSidebar /></div>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="rounded-xl border border-red-500/20 bg-[#171A21] px-4 md:px-6 py-4 md:py-5 w-full max-w-md">
            <p className="text-xs md:text-sm text-red-400">Failed to load users.</p>
            <p className="mt-1 text-[10px] md:text-xs text-[#8B8D94]">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const stats = [
    { title: "Total Users", value: users.length.toString(), change: "+12.4%", trend: "up", icon: Users, accent: "#FF6A39" },
    { title: "Active Users", value: users.length.toString(), change: "+8.2%", trend: "up", icon: UserCheck, accent: "#7FD98A" },
    { title: "Sender Accounts", value: `${connectedSenderAccounts}/${totalSenderAccounts}`, change: "connected", trend: "up", icon: Send, accent: "#4FA3FF", isRatio: true },
    { title: "Suspended Users", value: "0", change: "-4.1%", trend: "down", icon: Ban, accent: "#FF5C6C" },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: #0E1013; }
        .main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        .mf-row:hover, .mf-row.is-selected { background-color: #1B1E24; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); }
        .expand-chevron { transition: transform 0.18s ease; }
        .expand-chevron.is-open { transform: rotate(180deg); }
        @keyframes mf-expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .mf-expand-panel { animation: mf-expand 0.16s ease-out; }
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
        @media (prefers-reduced-motion: reduce) {
          .stat-card, .expand-chevron, .mf-expand-panel { transition: none !important; animation: none !important; }
        }
        @media (max-width: 480px) {
          .filter-selects {
            flex-direction: column;
            width: 100%;
          }
          .filter-selects select {
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
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">Users</h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">Admin View</span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">Manage users and the sender accounts they send campaigns from.</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 md:gap-2 rounded-lg bg-[#FF6A39] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white shadow-lg shadow-[#FF6A39]/20 hover:bg-[#e85a2c] transition w-full sm:w-auto justify-center">
            <UserPlus size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => <StatCard key={stat.title} stat={stat} />)}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 focus-within:border-[#FF6A39] transition flex-1 lg:flex-none">
              <Search size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#8B8D94] shrink-0" />
              <input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#C7C9CE] w-[100px] md:w-[160px] lg:w-[240px] placeholder:text-[#8B8D94]"
              />
            </div>

            <div className="filter-selects flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]">
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>

              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="flex-1 lg:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]">
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-end">
              <span className="text-[9px] md:text-xs text-[#8B8D94]">{selectedUsers.size} selected</span>
              <button className="rounded-lg border border-rose-500/30 px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition">
                <Trash2 size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px] inline mr-0.5 md:mr-1" /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] md:min-w-[860px] lg:min-w-[960px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                <tr>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-8 md:w-10">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAllUsers}
                      className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                    />
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition" onClick={() => toggleSort("username")}>
                    <span className="flex items-center gap-0.5 md:gap-1">User <ArrowUpDown size={9} className="md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px]" /></span>
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition" onClick={() => toggleSort("role")}>
                    <span className="flex items-center gap-0.5 md:gap-1">Role <ArrowUpDown size={9} className="md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px]" /></span>
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Status</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sender Accounts</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Campaigns</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Created</th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-6 md:w-8 lg:w-10" />
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const roleStyle = roleColors[user.role] ?? roleColors.EMPLOYEE;
                  const RoleIcon = roleStyle.icon;
                  const status = "Active";
                  const statusStyle = statusColors[status];
                  const accounts = user.sender_accounts ?? [];
                  const isExpanded = expandedUsers.has(user.id);
                  const connectedCount = accounts.filter((a) => getSenderStatus(a.status) === "Connected").length;
                  const needsAttention = accounts.some((a) => {
                    const s = getSenderStatus(a.status);
                    return s === "Warning" || s === "Error";
                  });

                  return (
                    <React.Fragment key={user.id}>
                      <tr className={`group mf-row transition border-t border-[#2A2E37] ${selectedUsers.has(user.id) ? "is-selected" : ""}`}>
                        <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                          />
                        </td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-[#FF6A39]/20 text-[#FF6A39] text-[10px] md:text-xs lg:text-sm font-semibold shrink-0">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] md:text-[11px] lg:text-[13.5px] font-medium text-[#E8E6E1] truncate">{user.username}</p>
                              <p className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94] truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <span className={`inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] lg:text-[11px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                            <RoleIcon size={9} className="md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px]" /> 
                            <span className="hidden xs:inline">{user.role}</span>
                            <span className="xs:hidden">{user.role.charAt(0)}</span>
                          </span>
                        </td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <span className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] lg:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${statusStyle.dot}`} /> 
                            <span className="hidden xs:inline">{status}</span>
                            <span className="xs:hidden">{status.charAt(0)}</span>
                          </span>
                        </td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          {accounts.length > 0 ? (
                            <button
                              onClick={() => toggleExpanded(user.id)}
                              aria-expanded={isExpanded}
                              className="inline-flex items-center gap-0.5 md:gap-1.5 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-1.5 md:px-2.5 py-1 md:py-1.5 text-[9px] md:text-[10px] lg:text-[12px] text-[#C7C9CE] hover:border-[#3A3F4A] hover:text-[#E8E6E1] transition"
                            >
                              <Send size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px] text-[#4FA3FF]" />
                              <span className="font-['JetBrains_Mono']">{connectedCount}/{accounts.length}</span>
                              {needsAttention && <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-amber-400" />}
                              <ChevronDown size={10} className={`md:w-[11px] md:h-[11px] lg:w-[13px] lg:h-[13px] expand-chevron text-[#8B8D94] ${isExpanded ? "is-open" : ""}`} />
                            </button>
                          ) : (
                            <span className="text-[9px] md:text-[10px] lg:text-[12px] text-[#5C5F68]">No accounts</span>
                          )}
                        </td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">—</td>

                        <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                          <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94]">{new Date(user.created_at).toLocaleDateString()}</span>
                        </td>

                        <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-0.5 md:p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition"><Edit size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" /></button>
                            <button className="p-0.5 md:p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition"><Key size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" /></button>
                            <button className="p-0.5 md:p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition"><MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" /></button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && accounts.length > 0 && (
                        <tr className="border-t border-[#2A2E37] bg-[#12141A]">
                          <td colSpan={8} className="px-2 md:px-4 lg:px-6 py-2 md:py-4">
                            <div className="mf-expand-panel grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2.5">
                              {accounts.map((account) => <SenderAccountCard key={account.id} account={account} />)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 md:px-5 py-8 md:py-12 text-center text-[10px] md:text-sm text-[#8B8D94]">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
            <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition"><ChevronLeft size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" /></button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[9px] md:text-xs font-medium">1</button>
              <button className="hidden sm:inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">2</button>
              <button className="hidden sm:inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">3</button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition"><ChevronRight size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;