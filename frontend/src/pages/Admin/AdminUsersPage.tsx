import React, { useState, useMemo } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Key,
  Ban,
  UserCheck,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type UserRole = "Super Admin" | "Admin" | "User" | "Viewer";
type UserStatus = "Active" | "Inactive" | "Suspended" | "Pending";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  workspaces: number;
  campaigns: number;
  lastActive: string;
  joined: string;
  avatar: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const users: User[] = [
  {
    id: "u1",
    name: "Sarah Johnson",
    email: "sarah.j@nimbusretail.com",
    role: "Super Admin",
    status: "Active",
    workspaces: 12,
    campaigns: 48,
    lastActive: "2 min ago",
    joined: "Jan 2025",
    avatar: "SJ",
  },
  {
    id: "u2",
    name: "Michael Chen",
    email: "michael.c@venturehub.co",
    role: "Admin",
    status: "Active",
    workspaces: 8,
    campaigns: 32,
    lastActive: "15 min ago",
    joined: "Mar 2025",
    avatar: "MC",
  },
  {
    id: "u3",
    name: "Emily Rodriguez",
    email: "emily.r@brightpath.org",
    role: "User",
    status: "Active",
    workspaces: 5,
    campaigns: 18,
    lastActive: "1 hour ago",
    joined: "Jun 2025",
    avatar: "ER",
  },
  {
    id: "u4",
    name: "James Wilson",
    email: "james.w@driftlabs.dev",
    role: "Admin",
    status: "Inactive",
    workspaces: 3,
    campaigns: 6,
    lastActive: "2 weeks ago",
    joined: "Nov 2024",
    avatar: "JW",
  },
  {
    id: "u5",
    name: "Priya Patel",
    email: "priya.p@meridiancorp.net",
    role: "User",
    status: "Active",
    workspaces: 7,
    campaigns: 24,
    lastActive: "3 hours ago",
    joined: "Feb 2025",
    avatar: "PP",
  },
  {
    id: "u6",
    name: "David Kim",
    email: "david.k@lumenstack.io",
    role: "Viewer",
    status: "Pending",
    workspaces: 2,
    campaigns: 0,
    lastActive: "Never",
    joined: "Aug 2025",
    avatar: "DK",
  },
  {
    id: "u7",
    name: "Lisa Thompson",
    email: "lisa.t@stackline.app",
    role: "User",
    status: "Suspended",
    workspaces: 4,
    campaigns: 11,
    lastActive: "5 days ago",
    joined: "Apr 2025",
    avatar: "LT",
  },
  {
    id: "u8",
    name: "Alex Morgan",
    email: "alex.m@forgeworks.com",
    role: "Admin",
    status: "Active",
    workspaces: 9,
    campaigns: 37,
    lastActive: "42 min ago",
    joined: "Dec 2024",
    avatar: "AM",
  },
];

const stats = [
  { title: "Total Users", value: "1,842", change: "+12.4%", trend: "up", icon: Users, accent: "#FF6A39" },
  { title: "Active Users", value: "1,560", change: "+8.2%", trend: "up", icon: UserCheck, accent: "#7FD98A" },
  { title: "New Users (30d)", value: "284", change: "+18.6%", trend: "up", icon: UserPlus, accent: "#FFC24B" },
  { title: "Suspended Users", value: "23", change: "-4.1%", trend: "down", icon: Ban, accent: "#FF5C6C" },
];

const roleColors: Record<UserRole, { bg: string; text: string; icon: React.ElementType }> = {
  "Super Admin": { bg: "bg-rose-500/15", text: "text-rose-400", icon: ShieldCheck },
  Admin: { bg: "bg-[#FF6A39]/15", text: "text-[#FF6A39]", icon: Shield },
  User: { bg: "bg-blue-500/15", text: "text-blue-400", icon: ShieldAlert },
  Viewer: { bg: "bg-slate-500/15", text: "text-slate-400", icon: ShieldX },
};

const statusColors: Record<UserStatus, { bg: string; text: string; icon: React.ElementType; dot: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2, dot: "bg-emerald-400" },
  Inactive: { bg: "bg-slate-500/15", text: "text-slate-400", icon: Clock, dot: "bg-slate-400" },
  Suspended: { bg: "bg-rose-500/15", text: "text-rose-400", icon: XCircle, dot: "bg-rose-400" },
  Pending: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Clock, dot: "bg-amber-400" },
};

const FILTERS = ["All", "Active", "Inactive", "Suspended", "Pending"];
const ROLES = ["All", "Super Admin", "Admin", "User", "Viewer"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof User>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    let result = users;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== "All") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [search, statusFilter, roleFilter, sortField, sortDirection]);

  const toggleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
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
        .mf-row:hover {
          background-color: #1B1E24;
        }
        .stat-card {
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Sidebar */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                Users
              </h1>
              <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                Admin View
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-[#8B8D94]">
              Manage all users across workspaces.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#FF6A39]/20 hover:bg-[#e85a2c] transition">
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="stat-card rounded-xl bg-[#171A21] p-4 md:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                    style={{ background: `${stat.accent}15` }}
                  >
                    <Icon size={14} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] md:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2">
              <Search size={14} className="text-[#8B8D94]" />
              <input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-[150px] md:w-[200px] placeholder:text-[#8B8D94]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {FILTERS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>

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
                <Trash2 size={12} className="inline mr-1" />
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                <tr>
                  <th className="px-4 md:px-5 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAllUsers}
                      className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                    />
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      User <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("role")}
                  >
                    <span className="flex items-center gap-1">
                      Role <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("workspaces")}
                  >
                    <span className="flex items-center gap-1">
                      Workspaces <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("campaigns")}
                  >
                    <span className="flex items-center gap-1">
                      Campaigns <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("lastActive")}
                  >
                    <span className="flex items-center gap-1">
                      Last Active <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-4 md:px-5 py-3 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleStyle = roleColors[user.role];
                  const statusStyle = statusColors[user.status];
                  const StatusIcon = statusStyle.icon;
                  const RoleIcon = roleStyle.icon;
                  const isHovered = hoveredRowId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="mf-row transition border-t border-[#2A2E37]"
                      onMouseEnter={() => setHoveredRowId(user.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td className="px-4 md:px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#FF6A39]/20 text-[#FF6A39] text-xs font-semibold">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-[12px] md:text-[13.5px] font-medium text-[#E8E6E1]">
                              {user.name}
                            </p>
                            <p className="text-[10px] md:text-[11px] text-[#8B8D94]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${roleStyle.bg} ${roleStyle.text}`}
                        >
                          <RoleIcon size={11} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[11px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {user.workspaces}
                      </td>
                      <td className="px-3 py-3.5 text-[11px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {user.campaigns}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] md:text-[12px] text-[#8B8D94]">
                            {user.lastActive}
                          </span>
                          {user.lastActive !== "Never" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 rounded hover:bg-[#1B1E24] text-[#8B8D94] hover:text-[#E8E6E1] transition">
                            <Edit size={14} />
                          </button>
                          <button className="p-1 rounded hover:bg-[#1B1E24] text-[#8B8D94] hover:text-[#E8E6E1] transition">
                            <Key size={14} />
                          </button>
                          <button className="p-1 rounded hover:bg-[#1B1E24] text-[#8B8D94] hover:text-[#E8E6E1] transition">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#8B8D94]">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-t border-[#2A2E37]">
            <span className="text-[10px] md:text-xs text-[#8B8D94]">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={14} />
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-medium">
                1
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                2
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                3
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;