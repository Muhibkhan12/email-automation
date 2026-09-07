// AdminUsers.tsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import UsersContext from "../../contexts/UsersContext";
import type { UserWithSenderAccounts } from "../../types/UserTypes";
import {
  Menu,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  MoreHorizontal,
  Shield,
  UserCheck,
} from "lucide-react";

type SenderAccountItem = UserWithSenderAccounts["senderAccount"][number];

const ROLES = ["All", "ADMIN", "EMPLOYEE"];

const roleColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  ADMIN: { bg: "bg-purple-500/10", text: "text-purple-400", icon: Shield },
  EMPLOYEE: { bg: "bg-blue-500/10", text: "text-blue-400", icon: UserCheck },
};

const senderStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Connected: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Warning: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Error: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  Disconnected: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

const getSenderStatus = (status?: string): keyof typeof senderStatusColors =>
  status === "Connected" || status === "Warning" || status === "Error" || status === "Disconnected"
    ? status
    : "Disconnected";

type Stat = { title: string; value: string; note?: string; accent: string };

const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="rounded-xl bg-[#171A21] p-4 border border-[#2A2E37] hover:border-[#3A3F4A] transition-colors">
    <div className="flex items-start justify-between">
      <span className="text-xs font-medium text-[#8B8D94]">{stat.title}</span>
      {stat.note && <span className="text-[11px] font-medium text-[#8B8D94]">{stat.note}</span>}
    </div>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#E8E6E1]" style={{ color: stat.accent }}>
      {stat.value}
    </h2>
  </div>
);

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof UserWithSenderAccounts>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

  // Fix: Try both import styles
  let context;
  try {
    context = useContext(UsersContext);
  } catch (e) {
    console.error("Context error:", e);
    context = null;
  }
  
  const { usersWithSenderAccounts, loading, fetchUserWithSenderAccounts } = context || { usersWithSenderAccounts: [], loading: false };

  // Fix: Only fetch once
  useEffect(() => {
    let mounted = true;
    if (fetchUserWithSenderAccounts && mounted) {
      fetchUserWithSenderAccounts();
    }
    return () => { mounted = false; };
  }, []); // Empty dependency array - only runs once

  const users = Array.isArray(usersWithSenderAccounts) ? usersWithSenderAccounts : [];

  const totalSenderAccounts = useMemo(
    () => users.reduce((sum, u) => sum + (u.senderAccount?.length ?? 0), 0),
    [users]
  );

  const connectedSenderAccounts = useMemo(
    () =>
      users.reduce(
        (sum, u) => sum + (u.senderAccount ?? []).filter((a) => getSenderStatus(a.status) === "Connected").length,
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
        const senderMatch = u.senderAccount?.some((a) => a.email?.toLowerCase().includes(q)) ?? false;
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

  const stats: Stat[] = [
    { title: "Total Users", value: users.length.toString(), accent: "#FF6A39" },
    { title: "Sender Accounts", value: `${connectedSenderAccounts}/${totalSenderAccounts}`, note: "connected", accent: "#4FA3FF" },
  ];

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
        <div className="fixed lg:sticky top-0 z-50 h-screen flex-shrink-0">
          <AdminSidebar onClose={() => {}} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-sm text-[#8B8D94]">Loading users...</p>
          </div>
        </main>
      </div>
    );
  }

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
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                  Users
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin View
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Manage users and their sender accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 border border-[#2A2E37] bg-[#171A21] flex-1 lg:flex-none min-w-[180px]">
              <Search size={14} className="text-[#8B8D94] shrink-0" />
              <input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-full placeholder:text-[#8B8D94]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B8D94]">{selectedUsers.size} selected</span>
              <button className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition">
                Remove
              </button>
            </div>
          )}
        </div>

        {/* User List */}
        {users.length === 0 ? (
          <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#FF6A39]/10 flex items-center justify-center mb-4">
                <User size={32} className="text-[#FF6A39]" />
              </div>
              <h3 className="text-lg font-semibold text-[#E8E6E1]">No Users Found</h3>
              <p className="mt-2 text-sm text-[#8B8D94] max-w-md">
                There are no users in the system yet.
              </p>
              <button
                onClick={() => fetchUserWithSenderAccounts?.()}
                className="mt-4 rounded-lg bg-[#FF6A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a2c] transition"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#8B8D94]/10 flex items-center justify-center mb-4">
                <Search size={32} className="text-[#8B8D94]" />
              </div>
              <h3 className="text-lg font-semibold text-[#E8E6E1]">No Results Found</h3>
              <p className="mt-2 text-sm text-[#8B8D94]">
                No users match your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("All");
                }}
                className="mt-4 text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[780px]">
                <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                  <tr>
                    <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-8">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleAllUsers}
                        className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                      />
                    </th>
                    <th 
                      className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                      onClick={() => toggleSort("username")}
                    >
                      <span className="flex items-center gap-1">
                        User
                        <ChevronDown size={10} className={`transition-transform ${sortField === "username" ? (sortDirection === "asc" ? "rotate-180" : "") : "opacity-30"}`} />
                      </span>
                    </th>
                    <th 
                      className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                      onClick={() => toggleSort("role")}
                    >
                      <span className="flex items-center gap-1">
                        Role
                        <ChevronDown size={10} className={`transition-transform ${sortField === "role" ? (sortDirection === "asc" ? "rotate-180" : "") : "opacity-30"}`} />
                      </span>
                    </th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sender Accounts</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Campaigns</th>
                    <th 
                      className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                      onClick={() => toggleSort("created_at")}
                    >
                      <span className="flex items-center gap-1">
                        Created
                        <ChevronDown size={10} className={`transition-transform ${sortField === "created_at" ? (sortDirection === "asc" ? "rotate-180" : "") : "opacity-30"}`} />
                      </span>
                    </th>
                    <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-8" />
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const roleStyle = roleColors[user.role] ?? roleColors.EMPLOYEE;
                    const RoleIcon = roleStyle.icon;
                    const accounts = user.senderAccount ?? [];
                    const isExpanded = expandedUsers.has(user.id);
                    const connectedCount = accounts.filter((a) => getSenderStatus(a.status) === "Connected").length;
                    const needsAttention = accounts.some((a) => {
                      const s = getSenderStatus(a.status);
                      return s === "Warning" || s === "Error";
                    });

                    return (
                      <React.Fragment key={user.id}>
                        <tr className={`transition border-t border-[#2A2E37] hover:bg-[#1B1E24] ${selectedUsers.has(user.id) ? "bg-[#1B1E24]" : ""}`}>
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
                              <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-[#FF6A39]/20 text-[#FF6A39] text-xs md:text-sm font-semibold shrink-0">
                                {user.username?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] md:text-[11px] lg:text-[13.5px] font-medium text-[#E8E6E1] truncate">
                                  {user.username || "Unknown User"}
                                </p>
                                <p className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94] truncate">
                                  {user.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 md:px-2 lg:px-2.5 py-0.5 text-[8px] md:text-[9px] lg:text-[11px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                              <RoleIcon size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                              {user.role}
                            </span>
                          </td>

                          <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                            {accounts.length > 0 ? (
                              <button
                                onClick={() => toggleExpanded(user.id)}
                                className="inline-flex items-center gap-1 md:gap-1.5 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-1.5 md:px-2 lg:px-2.5 py-1 md:py-1.5 text-[8px] md:text-[9px] lg:text-[11px] text-[#C7C9CE] hover:border-[#3A3F4A] hover:text-[#E8E6E1] transition"
                              >
                                {connectedCount}/{accounts.length}
                                {needsAttention && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                                {isExpanded ? (
                                  <ChevronDown size={10} className="rotate-180" />
                                ) : (
                                  <ChevronRight size={10} />
                                )}
                              </button>
                            ) : (
                              <span className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94]">No accounts</span>
                            )}
                          </td>

                          <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE]">
                            —
                          </td>

                          <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] font-['JetBrains_Mono']">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                          </td>

                          <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                            <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition p-1">
                              <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && accounts.length > 0 && (
                          <tr className="border-t border-[#2A2E37] bg-[#12141A]">
                            <td colSpan={7} className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
                                {accounts.map((account) => (
                                  <SenderAccountCard key={account.id} account={account} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
              <span className="text-[8px] md:text-[9px] lg:text-xs text-[#8B8D94]">
                Showing {filteredUsers.length} of {users.length} users
              </span>
              <div className="flex items-center gap-1 md:gap-1.5">
                <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[8px] md:text-[9px] lg:text-xs hover:bg-[#1B1E24] transition">
                  Prev
                </button>
                <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[8px] md:text-[9px] lg:text-xs font-medium">
                  1
                </button>
                <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[8px] md:text-[9px] lg:text-xs hover:bg-[#1B1E24] transition">
                  2
                </button>
                <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[8px] md:text-[9px] lg:text-xs hover:bg-[#1B1E24] transition">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Sender Account Card Component
const SenderAccountCard = ({ account }: { account: SenderAccountItem }) => {
  const status = getSenderStatus(account.status);
  const style = senderStatusColors[status];

  return (
    <div className="rounded-lg border border-[#2A2E37] bg-[#0E1013] px-2.5 md:px-3 py-2 md:py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5 md:gap-2">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <Mail size={12} className="text-[#8B8D94] shrink-0" />
          <p className="truncate text-[10px] md:text-[11px] lg:text-[12.5px] font-medium text-[#E8E6E1]">
            {account.email}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] lg:text-[10px] font-medium ${style.bg} ${style.text}`}>
          <span className={`h-1 w-1 rounded-full ${style.dot}`} />
          {status}
        </span>
      </div>
    </div>
  );
};

export default AdminUsers;