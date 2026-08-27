import React, { useContext, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";

import {
  Users,
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit,
  Key,
  Ban,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

import UsersContext from "../../contexts/UsersContext";
import type { User } from "../../types/UserTypes";

/* ---------------------------------------------------------------------- */
/* Constants                                                               */
/* ---------------------------------------------------------------------- */

const FILTERS = ["All", "Active", "Suspended"];
const ROLES = ["All", "ADMIN", "EMPLOYEE"];

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

type SenderStatus =
  | "Connected"
  | "Warning"
  | "Error"
  | "Disconnected";

type Provider = "gmail" | "outlook" | "smtp";

/* ---------------------------------------------------------------------- */
/* Styles                                                                  */
/* ---------------------------------------------------------------------- */

const roleColors: Record<
  string,
  {
    bg: string;
    text: string;
    icon: React.ElementType;
  }
> = {
  ADMIN: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    icon: ShieldCheck,
  },

  EMPLOYEE: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    icon: Shield,
  },
};

const statusColors: Record<
  string,
  {
    bg: string;
    text: string;
    dot: string;
  }
> = {
  Active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },

  Suspended: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },

  Inactive: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

const senderStatusColors: Record<
  SenderStatus,
  {
    bg: string;
    text: string;
    bar: string;
    icon: React.ElementType;
  }
> = {
  Connected: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    icon: CheckCircle2,
  },

  Warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    bar: "bg-amber-400",
    icon: AlertTriangle,
  },

  Error: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    bar: "bg-red-400",
    icon: XCircle,
  },

  Disconnected: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    bar: "bg-gray-400",
    icon: XCircle,
  },
};

/* ---------------------------------------------------------------------- */
/* Helper functions                                                        */
/* ---------------------------------------------------------------------- */

const getSenderStatus = (status?: string): SenderStatus => {
  if (
    status === "Connected" ||
    status === "Warning" ||
    status === "Error" ||
    status === "Disconnected"
  ) {
    return status;
  }

  return "Disconnected";
};

const getProviderIcon = (provider?: string) => {
  if (provider === "gmail") {
    return Send;
  }

  if (provider === "outlook") {
    return Send;
  }

  return MailIcon;
};

const MailIcon = Send;

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

const AdminUsers = () => {
  /*
   * Users come from UsersContext.
   *
   * The AdminUsers page does NOT call axios directly.
   */
  const context = useContext(UsersContext);

  const users = context?.users ?? [];
  const loading = context?.loading ?? false;
  const error = context?.error ?? null;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [sortField, setSortField] =
    useState<keyof User>("username");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  const [selectedUsers, setSelectedUsers] =
    useState<Set<number>>(new Set());

  const [expandedUsers, setExpandedUsers] =
    useState<Set<number>>(new Set());

  /* -------------------------------------------------------------------- */
  /* Statistics                                                           */
  /* -------------------------------------------------------------------- */

  const totalSenderAccounts = useMemo(() => {
    return users.reduce(
      (sum, user) => sum + (user.sender_accounts?.length ?? 0),
      0
    );
  }, [users]);

  const connectedSenderAccounts = useMemo(() => {
    return users.reduce((sum, user) => {
      const accounts = user.sender_accounts ?? [];

      return (
        sum +
        accounts.filter(
          (account) =>
            getSenderStatus(account.status) === "Connected"
        ).length
      );
    }, 0);
  }, [users]);

  const activeUsers = useMemo(() => {
    return users.length;
  }, [users]);

  /* -------------------------------------------------------------------- */
  /* Filter + Sort                                                        */
  /* -------------------------------------------------------------------- */

  const filteredUsers = useMemo(() => {
    let result = [...users];

    /* Search */

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter((user) => {
        const username =
          user.username?.toLowerCase() ?? "";

        const email =
          user.email?.toLowerCase() ?? "";

        const senderMatches =
          user.sender_accounts?.some((account) =>
            account.email
              ?.toLowerCase()
              .includes(q)
          ) ?? false;

        return (
          username.includes(q) ||
          email.includes(q) ||
          senderMatches
        );
      });
    }

    /* Role filter */

    if (roleFilter !== "All") {
      result = result.filter(
        (user) => user.role === roleFilter
      );
    }

    /* Sort */

    result.sort((a, b) => {
      const aValue = String(a[sortField] ?? "");
      const bValue = String(b[sortField] ?? "");

      const comparison = aValue.localeCompare(
        bValue
      );

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    users,
    search,
    roleFilter,
    sortField,
    sortDirection,
  ]);

  /* -------------------------------------------------------------------- */
  /* Sorting                                                              */
  /* -------------------------------------------------------------------- */

  const toggleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /* -------------------------------------------------------------------- */
  /* Selection                                                            */
  /* -------------------------------------------------------------------- */

  const toggleUserSelection = (id: number) => {
    setSelectedUsers((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleAllUsers = () => {
    if (
      selectedUsers.size ===
      filteredUsers.length
    ) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(
        new Set(
          filteredUsers.map((user) => user.id)
        )
      );
    }
  };

  /* -------------------------------------------------------------------- */
  /* Expand                                                               */
  /* -------------------------------------------------------------------- */

  const toggleExpanded = (id: number) => {
    setExpandedUsers((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  /* -------------------------------------------------------------------- */
  /* Loading                                                              */
  /* -------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0E1013]">
        <div className="sticky top-0 h-screen flex-shrink-0">
          <AdminSidebar />
        </div>

        <main className="flex flex-1 items-center justify-center">
          <div className="text-sm text-[#8B8D94]">
            Loading users...
          </div>
        </main>
      </div>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Error                                                                */
  /* -------------------------------------------------------------------- */

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#0E1013]">
        <div className="sticky top-0 h-screen flex-shrink-0">
          <AdminSidebar />
        </div>

        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-red-500/20 bg-[#171A21] px-6 py-5">
            <p className="text-sm text-red-400">
              Failed to load users.
            </p>

            <p className="mt-1 text-xs text-[#8B8D94]">
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Stats                                                                */
  /* -------------------------------------------------------------------- */

  const stats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      change: "+12.4%",
      trend: "up",
      icon: Users,
      accent: "#FF6A39",
    },

    {
      title: "Active Users",
      value: activeUsers.toString(),
      change: "+8.2%",
      trend: "up",
      icon: UserCheck,
      accent: "#7FD98A",
    },

    {
      title: "Sender Accounts",
      value: `${connectedSenderAccounts}/${totalSenderAccounts}`,
      change: "connected",
      trend: "up",
      icon: Send,
      accent: "#4FA3FF",
      isRatio: true,
    },

    {
      title: "Suspended Users",
      value: "0",
      change: "-4.1%",
      trend: "down",
      icon: Ban,
      accent: "#FF5C6C",
    },
  ];

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

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

        .mf-row.is-selected {
          background-color: #1B1E24;
        }

        .stat-card {
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .expand-chevron {
          transition: transform 0.18s ease;
        }

        .expand-chevron.is-open {
          transform: rotate(180deg);
        }

        @keyframes mf-expand {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mf-expand-panel {
          animation: mf-expand 0.16s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .stat-card,
          .expand-chevron,
          .mf-expand-panel {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Sidebar */}

      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main */}

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
              Manage users and the sender accounts they send campaigns from.
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
                className="stat-card rounded-xl bg-[#171A21] p-4 md:p-5 border border-[#2A2E37] hover:border-[#3A3F4A]"
              >

                <div className="flex items-start justify-between">

                  <div
                    className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                    style={{
                      background: `${stat.accent}15`,
                    }}
                  >
                    <Icon
                      size={14}
                      style={{
                        color: stat.accent,
                      }}
                    />
                  </div>

                  {stat.isRatio ? (

                    <span className="text-[10px] md:text-[11.5px] font-medium text-[#8B8D94]">
                      {stat.change}
                    </span>

                  ) : (

                    <span
                      className={`flex items-center gap-0.5 text-[10px] md:text-[11.5px] font-medium ${
                        stat.trend === "up"
                          ? "text-[#7FD98A]"
                          : "text-[#FF5C6C]"
                      }`}
                    >

                      {stat.trend === "up" ? (
                        <ArrowUpRight size={12} />
                      ) : (
                        <ArrowDownRight size={12} />
                      )}

                      {stat.change}

                    </span>

                  )}

                </div>

                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>

                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">
                  {stat.title}
                </p>

              </div>
            );
          })}

        </div>

        {/* Filters */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}

            <div className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 focus-within:border-[#FF6A39] transition">

              <Search
                size={14}
                className="text-[#8B8D94]"
              />

              <input
                placeholder="Search users or sender emails..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-[170px] md:w-[240px] placeholder:text-[#8B8D94]"
              />

            </div>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {FILTERS.map((filter) => (
                <option key={filter}>
                  {filter}
                </option>
              ))}
            </select>

            {/* Role */}

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {ROLES.map((role) => (
                <option key={role}>
                  {role}
                </option>
              ))}
            </select>

          </div>

          {/* Selected */}

          {selectedUsers.size > 0 && (

            <div className="flex items-center gap-2">

              <span className="text-xs text-[#8B8D94]">
                {selectedUsers.size} selected
              </span>

              <button className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition">

                <Trash2
                  size={12}
                  className="inline mr-1"
                />

                Remove

              </button>

            </div>

          )}

        </div>

        {/* Users Table */}

        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left min-w-[960px]">

              {/* Header */}

              <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">

                <tr>

                  <th className="px-4 md:px-5 py-3 font-medium w-10">

                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.size ===
                          filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={toggleAllUsers}
                      className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                    />

                  </th>

                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() =>
                      toggleSort("username")
                    }
                  >

                    <span className="flex items-center gap-1">
                      User
                      <ArrowUpDown size={11} />
                    </span>

                  </th>

                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() =>
                      toggleSort("role")
                    }
                  >

                    <span className="flex items-center gap-1">
                      Role
                      <ArrowUpDown size={11} />
                    </span>

                  </th>

                  <th className="px-3 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Sender Accounts
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Campaigns
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Created
                  </th>

                  <th className="px-4 md:px-5 py-3 font-medium w-10" />

                </tr>

              </thead>

              {/* Body */}

              <tbody>

                {filteredUsers.map((user) => {

                  const roleStyle =
                    roleColors[user.role] ??
                    roleColors.EMPLOYEE;

                  const status = "Active";

                  const statusStyle =
                    statusColors[status];

                  const RoleIcon =
                    roleStyle.icon;

                  const accounts =
                    user.sender_accounts ?? [];

                  const isExpanded =
                    expandedUsers.has(user.id);

                  const hasAccounts =
                    accounts.length > 0;

                  const connectedCount =
                    accounts.filter(
                      (account) =>
                        getSenderStatus(
                          account.status
                        ) === "Connected"
                    ).length;

                  const needsAttention =
                    accounts.some((account) => {
                      const currentStatus =
                        getSenderStatus(
                          account.status
                        );

                      return (
                        currentStatus ===
                          "Warning" ||
                        currentStatus === "Error"
                      );
                    });

                  return (
                    <React.Fragment key={user.id}>

                      {/* User Row */}

                      <tr
                        className={`group mf-row transition border-t border-[#2A2E37] ${
                          selectedUsers.has(user.id)
                            ? "is-selected"
                            : ""
                        }`}
                      >

                        {/* Checkbox */}

                        <td className="px-4 md:px-5 py-3.5">

                          <input
                            type="checkbox"
                            checked={selectedUsers.has(
                              user.id
                            )}
                            onChange={() =>
                              toggleUserSelection(
                                user.id
                              )
                            }
                            className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                          />

                        </td>

                        {/* User */}

                        <td className="px-3 py-3.5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#FF6A39]/20 text-[#FF6A39] text-xs font-semibold">

                              {user.username
                                ?.charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <p className="text-[12px] md:text-[13.5px] font-medium text-[#E8E6E1]">
                                {user.username}
                              </p>

                              <p className="text-[10px] md:text-[11px] text-[#8B8D94]">
                                {user.email}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* Role */}

                        <td className="px-3 py-3.5">

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${roleStyle.bg} ${roleStyle.text}`}
                          >

                            <RoleIcon size={11} />

                            {user.role}

                          </span>

                        </td>

                        {/* Status */}

                        <td className="px-3 py-3.5">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                            />

                            {status}

                          </span>

                        </td>

                        {/* Sender Accounts */}

                        <td className="px-3 py-3.5">

                          {hasAccounts ? (

                            <button
                              onClick={() =>
                                toggleExpanded(
                                  user.id
                                )
                              }
                              aria-expanded={
                                isExpanded
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-2.5 py-1.5 text-[11px] md:text-[12px] text-[#C7C9CE] hover:border-[#3A3F4A] hover:text-[#E8E6E1] transition"
                            >

                              <Send
                                size={12}
                                className="text-[#4FA3FF]"
                              />

                              <span className="font-['JetBrains_Mono']">
                                {connectedCount}/
                                {accounts.length}
                              </span>

                              {needsAttention && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              )}

                              <ChevronDown
                                size={13}
                                className={`expand-chevron text-[#8B8D94] ${
                                  isExpanded
                                    ? "is-open"
                                    : ""
                                }`}
                              />

                            </button>

                          ) : (

                            <span className="text-[11px] md:text-[12px] text-[#5C5F68]">
                              No accounts
                            </span>

                          )}

                        </td>

                        {/* Campaigns */}

                        <td className="px-3 py-3.5 text-[11px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                          —
                        </td>

                        {/* Created */}

                        <td className="px-3 py-3.5">

                          <span className="text-[10px] md:text-[12px] text-[#8B8D94]">
                            {new Date(
                              user.created_at
                            ).toLocaleDateString()}
                          </span>

                        </td>

                        {/* Actions */}

                        <td className="px-4 md:px-5 py-3.5 text-right">

                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                            <button className="p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition">

                              <Edit size={14} />

                            </button>

                            <button className="p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition">

                              <Key size={14} />

                            </button>

                            <button className="p-1 rounded hover:bg-[#0E1013] text-[#8B8D94] hover:text-[#E8E6E1] transition">

                              <MoreHorizontal size={14} />

                            </button>

                          </div>

                        </td>

                      </tr>

                      {/* Expanded Sender Accounts */}

                      {isExpanded &&
                        hasAccounts && (

                          <tr className="border-t border-[#2A2E37] bg-[#12141A]">

                            <td
                              colSpan={8}
                              className="px-4 md:px-6 py-4"
                            >

                              <div className="mf-expand-panel grid grid-cols-1 md:grid-cols-2 gap-2.5">

                                {accounts.map(
                                  (account) => {

                                    const currentStatus =
                                      getSenderStatus(
                                        account.status
                                      );

                                    const sStyle =
                                      senderStatusColors[
                                        currentStatus
                                      ];

                                    const SIcon =
                                      sStyle.icon;

                                    const PIcon =
                                      getProviderIcon(
                                        account.provider
                                      );

                                    const sentToday =
                                      account.sentToday ??
                                      0;

                                    const dailyLimit =
                                      account.dailyLimit ??
                                      100;

                                    const usagePct =
                                      dailyLimit > 0
                                        ? Math.min(
                                            100,
                                            Math.round(
                                              (sentToday /
                                                dailyLimit) *
                                                100
                                            )
                                          )
                                        : 0;

                                    return (

                                      <div
                                        key={account.id}
                                        className="flex items-center gap-3 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3.5 py-3"
                                      >

                                        {/* Provider */}

                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0E1013] border border-[#2A2E37]">

                                          <PIcon
                                            size={13}
                                            className="text-[#8B8D94]"
                                          />

                                        </div>

                                        {/* Account */}

                                        <div className="min-w-0 flex-1">

                                          <div className="flex items-center gap-2">

                                            <p className="truncate text-[12px] md:text-[12.5px] font-medium text-[#E8E6E1]">

                                              {
                                                account.email
                                              }

                                            </p>

                                            <span
                                              className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium ${sStyle.bg} ${sStyle.text}`}
                                            >

                                              <SIcon
                                                size={9}
                                              />

                                              {
                                                currentStatus
                                              }

                                            </span>

                                          </div>

                                          {/* Usage */}

                                          <div className="mt-1.5 flex items-center gap-2">

                                            <div className="h-1 flex-1 rounded-full bg-[#0E1013] overflow-hidden">

                                              <div
                                                className={`h-full rounded-full ${sStyle.bar}`}
                                                style={{
                                                  width: `${usagePct}%`,
                                                }}
                                              />

                                            </div>

                                            <span className="flex-shrink-0 text-[9px] md:text-[10px] text-[#8B8D94] font-['JetBrains_Mono']">

                                              {sentToday}/
                                              {dailyLimit}

                                            </span>

                                          </div>

                                          {/* Warmup */}

                                          {account.warmupProgress !==
                                            undefined && (

                                            <p className="mt-1 text-[9px] md:text-[10px] text-[#4FA3FF]">

                                              Warming up ·{" "}
                                              {
                                                account.warmupProgress
                                              }
                                              %

                                            </p>

                                          )}

                                        </div>

                                      </div>

                                    );
                                  }
                                )}

                              </div>

                            </td>

                          </tr>

                        )}

                    </React.Fragment>
                  );
                })}

                {/* Empty */}

                {filteredUsers.length ===
                  0 && (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-[#8B8D94]"
                    >

                      No users found matching
                      your filters.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* Pagination */}

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-t border-[#2A2E37]">

            <span className="text-[10px] md:text-xs text-[#8B8D94]">

              Showing {filteredUsers.length} of{" "}
              {users.length} users

            </span>

            <div className="flex items-center gap-1.5">

              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">

                <ChevronLeft
                  size={14}
                />

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

                <ChevronRight
                  size={14}
                />

              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default AdminUsers;