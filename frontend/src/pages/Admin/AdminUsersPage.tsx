import React, { useContext, useEffect, useMemo, useState } from "react";
import UsersContext from "../../contexts/UsersContext";
import type { UserWithSenderAccounts } from "../../types/UserTypes";


type SenderAccountItem = UserWithSenderAccounts["senderAccount"][number];

const ROLES = ["All", "ADMIN", "EMPLOYEE"];

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-500/10", text: "text-purple-400" },
  EMPLOYEE: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const senderStatusColors: Record<string, { bg: string; text: string; bar: string }> = {
  Connected: { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-400" },
  Warning: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-400" },
  Error: { bg: "bg-red-500/10", text: "text-red-400", bar: "bg-red-400" },
  Disconnected: { bg: "bg-gray-500/10", text: "text-gray-400", bar: "bg-gray-400" },
};

const getSenderStatus = (status?: string): keyof typeof senderStatusColors =>
  status === "Connected" || status === "Warning" || status === "Error" || status === "Disconnected"
    ? status
    : "Disconnected";

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

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

const SenderAccountCard = ({ account }: { account: SenderAccountItem }) => {
  const status = getSenderStatus(account.status);
  const style = senderStatusColors[status];
  // const usagePct = dailyLimit > 0 ? Math.min(100, Math.round((sentToday / dailyLimit) * 100)) : 0;

  return (
    <div className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="truncate text-[12.5px] font-medium text-[#E8E6E1]">{account.email}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("AdminUsers must be rendered inside a <UserProvider>");
  }
  const { usersWithSenderAccounts, loading, fetchUserWithSenderAccounts } = context;

  useEffect(() => {
    fetchUserWithSenderAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const users = usersWithSenderAccounts;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof UserWithSenderAccounts>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1013] p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <p className="text-sm text-[#8B8D94]">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1013] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1]">Users</h1>
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
              Admin View
            </span>
          </div>
          <p className="mt-1 text-sm text-[#8B8D94]">Manage users and the sender accounts they send campaigns from.</p>
        </div>
        <button className="rounded-lg bg-[#FF6A39] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e85a2c] transition">
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-sm outline-none text-[#C7C9CE] focus:border-[#FF6A39] transition w-[200px] placeholder:text-[#8B8D94]"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
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

      {/* Table */}
      <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[780px]">
            <thead className="text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
              <tr>
                <th className="px-5 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleAllUsers}
                    className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                  />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition" onClick={() => toggleSort("username")}>
                  User {sortField === "username" ? (sortDirection === "asc" ? "(asc)" : "(desc)") : ""}
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition" onClick={() => toggleSort("role")}>
                  Role {sortField === "role" ? (sortDirection === "asc" ? "(asc)" : "(desc)") : ""}
                </th>
                <th className="px-3 py-3 font-medium">Sender Accounts</th>
                <th className="px-3 py-3 font-medium">Campaigns</th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                  onClick={() => toggleSort("created_at")}
                >
                  Created {sortField === "created_at" ? (sortDirection === "asc" ? "(asc)" : "(desc)") : ""}
                </th>
                <th className="px-5 py-3 font-medium w-10" />
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const roleStyle = roleColors[user.role] ?? roleColors.EMPLOYEE;
                const accounts = user.senderAccount ?? [];
                const isExpanded = expandedUsers.has(user.id);
                const connectedCount = accounts.filter((a) => getSenderStatus(a.status) === "Connected").length;
                const needsAttention = accounts.some((a) => {
                  const s = getSenderStatus(a.status);
                  return s === "Warning" || s === "Error";
                });

                return (
                  <React.Fragment key={user.id}>
                    <tr className={`group transition border-t border-[#2A2E37] hover:bg-[#1B1E24] ${selectedUsers.has(user.id) ? "bg-[#1B1E24]" : ""}`}>
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-[#2A2E37] bg-[#0E1013] accent-[#FF6A39]"
                        />
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6A39]/20 text-[#FF6A39] text-sm font-semibold shrink-0">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-[#E8E6E1] truncate">{user.username}</p>
                            <p className="text-[11px] text-[#8B8D94] truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        {accounts.length > 0 ? (
                          <button
                            onClick={() => toggleExpanded(user.id)}
                            aria-expanded={isExpanded}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2E37] bg-[#0E1013] px-2.5 py-1.5 text-xs text-[#C7C9CE] hover:border-[#3A3F4A] hover:text-[#E8E6E1] transition"
                          >
                            {connectedCount}/{accounts.length}
                            {needsAttention && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                            {isExpanded ? "Hide" : "Show"}
                          </button>
                        ) : (
                          <span className="text-xs text-[#5C5F68]">No accounts</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-[13px] text-[#C7C9CE]">—</td>

                      <td className="px-3 py-3.5">
                        <span className="text-xs text-[#8B8D94]">{new Date(user.created_at).toLocaleDateString()}</span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">Edit</button>
                          <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">Reset</button>
                          <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">More</button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && accounts.length > 0 && (
                      <tr className="border-t border-[#2A2E37] bg-[#12141A]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#8B8D94]">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-5 border-t border-[#2A2E37]">
          <span className="text-xs text-[#8B8D94]">
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <div className="flex items-center gap-1.5">
            <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">Prev</button>
            <button className="px-3 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">2</button>
            <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">3</button>
            <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;