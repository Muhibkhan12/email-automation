// AdminUsers.tsx
import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Menu,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Shield,
  UserCheck,
  Loader2,
  AlertTriangle,
  Mail,
  Calendar,
  Sparkles,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                 */
/* ---------------------------------------------------------------------- */

interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  created_at?: string;
}

/* ---------------------------------------------------------------------- */
/*  Config                                                                */
/* ---------------------------------------------------------------------- */

const API_URL = "http://localhost:8000/auth/users";
const PAGE_SIZE = 12;
const ROLES = ["All", "ADMIN", "EMPLOYEE"];

const roleColors: Record<
  string,
  { bg: string; text: string; ring: string; icon: React.ElementType }
> = {
  ADMIN: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    ring: "ring-purple-500/20",
    icon: Shield,
  },
  EMPLOYEE: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    ring: "ring-blue-500/20",
    icon: UserCheck,
  },
};

/* ---------------------------------------------------------------------- */
/*  Helpers                                                               */
/* ---------------------------------------------------------------------- */

const avatarGradient = (seed: string) => {
  const palettes = [
    "from-[#FF6A39] to-[#FF9F7A]",
    "from-[#A78BFA] to-[#7C5CE0]",
    "from-[#60A5FA] to-[#3B82F6]",
    "from-[#34D399] to-[#10B981]",
    "from-[#FBBF24] to-[#F59E0B]",
    "from-[#F472B6] to-[#EC4899]",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* ---------------------------------------------------------------------- */
/*  Stat Tile                                                             */
/* ---------------------------------------------------------------------- */

const StatTile = ({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ElementType;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[#2A2E37] bg-[#171A21] p-4 md:p-5 transition-colors hover:border-[#3A3F4A]">
    <div className="flex items-start justify-between">
      <span className="text-[11px] md:text-xs font-medium uppercase tracking-wider text-[#8B8D94]">
        {label}
      </span>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: `${accent}1A`, color: accent }}
      >
        <Icon size={15} />
      </span>
    </div>
    <p
      className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight font-['JetBrains_Mono']"
      style={{ color: accent }}
    >
      {value}
    </p>
  </div>
);

/* ---------------------------------------------------------------------- */
/*  User Card — now with Edit + Delete                                    */
/* ---------------------------------------------------------------------- */

const UserCard = ({
  user,
  onEdit,
  onDelete,
}: {
  user: ApiUser;
  onEdit: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
}) => {
  const roleStyle = roleColors[user.role] ?? roleColors.EMPLOYEE;
  const RoleIcon = roleStyle.icon;
  const initial = user.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#2A2E37] bg-[#171A21] p-4 md:p-5 transition-all hover:border-[#3A3F4A] hover:bg-[#1B1E24]">
      {/* Top row: avatar + role */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient(
            user.username ?? String(user.id)
          )} text-white text-base md:text-lg font-semibold shadow-lg shadow-black/20 shrink-0`}
        >
          {initial}
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] md:text-[11px] font-medium ring-1 ${roleStyle.bg} ${roleStyle.text} ${roleStyle.ring}`}
        >
          <RoleIcon size={11} />
          {user.role}
        </span>
      </div>

      {/* Identity */}
      <div className="mt-3 md:mt-4 min-w-0">
        <h3 className="truncate text-sm md:text-[15px] font-semibold text-[#E8E6E1]">
          {user.username || "Unknown User"}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] md:text-xs text-[#8B8D94] min-w-0">
          <Mail size={12} className="shrink-0" />
          <span className="truncate">{user.email || "No email"}</span>
        </div>
      </div>

      {/* Footer meta + actions */}
      <div className="mt-4 flex items-center justify-between border-t border-[#2A2E37] pt-3">
        <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
          <Calendar size={11} />
          {formatDate(user.created_at)}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            title="Edit user"
            className="rounded-lg p-1.5 text-[#8B8D94] hover:bg-[#FF6A39]/10 hover:text-[#FF6A39] transition"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(user)}
            title="Delete user"
            className="rounded-lg p-1.5 text-[#8B8D94] hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Edit User Modal                                                       */
/* ---------------------------------------------------------------------- */

const EditUserModal = ({
  user,
  loading,
  error,
  onClose,
  onSave,
}: {
  user: ApiUser;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<ApiUser>) => void;
}) => {
  const [username, setUsername] = useState(user.username ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">(user.role);
  const [localError, setLocalError] = useState<string | null>(null);

  const isDirty =
    username !== user.username || email !== user.email || role !== user.role;

  const handleSubmit = () => {
    setLocalError(null);
    if (!username.trim()) return setLocalError("Username is required.");
    if (!email.trim()) return setLocalError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setLocalError("Please enter a valid email address.");

    const payload: Partial<ApiUser> = {};
    if (username !== user.username) payload.username = username.trim();
    if (email !== user.email) payload.email = email.trim();
    if (role !== user.role) payload.role = role;

    if (Object.keys(payload).length === 0) {
      setLocalError("Nothing changed.");
      return;
    }
    onSave(user.id, payload);
  };

  const displayedError = localError ?? error;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(14,16,19,0.7)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "#171A21", border: "1px solid #2A2E37" }}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#2A2E37]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6A39]/15 text-[#FF6A39]">
              <Pencil size={15} />
            </span>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-[#E8E6E1]">
                Edit User
              </h2>
              <p className="text-[10px] md:text-xs text-[#8B8D94]">
                Update profile details and role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-[#8B8D94] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 md:space-y-4 p-4 md:p-5">
          {displayedError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{displayedError}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#C7C9CE]">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-sm text-[#C7C9CE] outline-none transition focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/15 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#C7C9CE]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-sm text-[#C7C9CE] outline-none transition focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/15 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#C7C9CE]">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["EMPLOYEE", "ADMIN"] as const).map((r) => {
                const active = role === r;
                const Icon = r === "ADMIN" ? Shield : UserCheck;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    disabled={loading}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-[#FF6A39] bg-[#FF6A39]/10 text-[#FF6A39]"
                        : "border-[#2A2E37] bg-[#0E1013] text-[#C7C9CE] hover:border-[#3A3F4A]"
                    }`}
                  >
                    <Icon size={13} />
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 md:p-5 border-t border-[#2A2E37]">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[#2A2E37] bg-transparent px-3.5 py-2 text-xs font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-[#FF6A39] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#e85a2c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Delete User Modal                                                     */
/* ---------------------------------------------------------------------- */

const DeleteUserModal = ({
  user,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  user: ApiUser;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
    style={{ background: "rgba(14,16,19,0.7)" }}
  >
    <div
      className="w-full max-w-md rounded-2xl shadow-2xl"
      style={{ background: "#171A21", border: "1px solid #2A2E37" }}
    >
      <div className="p-4 md:p-6 border-b border-[#2A2E37]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <Trash2 size={18} />
          </span>
          <div>
            <h3 className="text-sm md:text-base font-semibold text-[#E8E6E1]">
              Delete User?
            </h3>
            <p className="text-[10px] md:text-xs text-[#8B8D94]">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3">
          <p className="text-xs font-medium text-[#E8E6E1] truncate">
            {user.username || "Unknown User"}
          </p>
          <p className="text-[11px] text-[#8B8D94] truncate">
            {user.email || "No email"}
          </p>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 p-4 md:p-5">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-[#2A2E37] bg-transparent px-3.5 py-2 text-xs font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
          {loading ? "Deleting…" : "Delete User"}
        </button>
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------------------- */
/*  Main page                                                             */
/* ---------------------------------------------------------------------- */

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof ApiUser>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Modal state
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* ------------------------------ Fetch ------------------------------ */

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }

      const raw = await res.json();

      const list: ApiUser[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.users)
        ? raw.users
        : [];

      setUsers(list);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err?.message ?? "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ---------------------------- Filtering ---------------------------- */

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.username ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "All") {
      result = result.filter((u) => u.role === roleFilter);
    }

    result.sort((a, b) => {
      const cmp = String(a[sortField] ?? "").localeCompare(
        String(b[sortField] ?? "")
      );
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, search, roleFilter, sortField, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const toggleSort = (field: keyof ApiUser) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const employeeCount = users.filter((u) => u.role === "EMPLOYEE").length;

  /* ------------------------------ Update ----------------------------- */

  const handleUpdate = async (id: number, data: Partial<ApiUser>) => {
    try {
      setActionLoading(true);
      setActionError(null);

      // ⚠️ adjust the URL if your backend route is different
      const res = await fetch(`http://localhost:8000/auth/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Update failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`
        );
      }

      // Optimistic update on success
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data } : u))
      );
      setEditingUser(null);
    } catch (err: any) {
      console.error("Failed to update user:", err);
      setActionError(err?.message ?? "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------ Delete ----------------------------- */

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      setActionLoading(true);
      setActionError(null);

      // ⚠️ adjust the URL if your backend route is different
      const res = await fetch(
        `http://localhost:8000/auth/users/${deletingUser.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Delete failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`
        );
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      setActionError(err?.message ?? "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------ Render ----------------------------- */

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: #0E1013; }
        .main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        .sidebar-overlay { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-slide { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .user-card-enter { animation: cardIn 0.25s ease-out both; }
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

      <main className="main-content flex-1 overflow-y-auto bg-[#0E1013] h-screen w-full">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(255,106,57,0.08) 0%, rgba(255,106,57,0) 70%)",
          }}
        />

        <div className="relative p-3 md:p-5 lg:p-7 xl:p-9">
          {/* ================= Header ================= */}
          <div className="mb-6 md:mb-8 flex flex-wrap items-start justify-between gap-3 md:gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                  <h1 className="text-2xl md:text-3xl lg:text-[34px] font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk'] leading-tight">
                    Users
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39] ring-1 ring-[#FF6A39]/20">
                    <Sparkles size={10} />
                    Admin View
                  </span>
                </div>
                <p className="mt-1 text-xs md:text-sm text-[#8B8D94] max-w-xl">
                  Every account registered in the system, with role and join date.
                </p>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2A2E37] bg-[#171A21] px-3.5 py-2.5 text-xs md:text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] hover:border-[#3A3F4A] transition disabled:opacity-50"
            >
              <Loader2 size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* ================= Stats ================= */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <StatTile
              label="Total Users"
              value={String(users.length)}
              accent="#FF6A39"
              icon={UserIcon}
            />
            <StatTile
              label="Admins"
              value={String(adminCount)}
              accent="#A78BFA"
              icon={Shield}
            />
            <StatTile
              label="Employees"
              value={String(employeeCount)}
              accent="#60A5FA"
              icon={UserCheck}
            />
          </div>

          {/* ================= Toolbar ================= */}
          <div className="mb-5 md:mb-6 rounded-2xl border border-[#2A2E37] bg-[#171A21] p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#2A2E37] bg-[#0E1013] px-3 py-2 flex-1 min-w-[220px] focus-within:border-[#FF6A39] transition-colors">
                <Search size={15} className="text-[#8B8D94] shrink-0" />
                <input
                  placeholder="Search by username or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-full placeholder:text-[#8B8D94]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39] transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>

              <button
                onClick={() => toggleSort("username")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] hover:border-[#3A3F4A] transition-colors"
              >
                Name
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    sortField === "username" && sortDirection === "asc"
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              <button
                onClick={() => toggleSort("created_at")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A2E37] bg-[#0E1013] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] hover:border-[#3A3F4A] transition-colors"
              >
                Joined
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    sortField === "created_at" && sortDirection === "asc"
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </div>

            {(search || roleFilter !== "All") && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-[#8B8D94]">
                <span>Filtered:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0E1013] border border-[#2A2E37] px-2 py-0.5 text-[#C7C9CE]">
                    "{search}"
                    <button
                      onClick={() => setSearch("")}
                      className="hover:text-[#E8E6E1]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {roleFilter !== "All" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0E1013] border border-[#2A2E37] px-2 py-0.5 text-[#C7C9CE]">
                    {roleFilter}
                    <button
                      onClick={() => setRoleFilter("All")}
                      className="hover:text-[#E8E6E1]"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("All");
                  }}
                  className="ml-auto text-[#FF6A39] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* ================= Content ================= */}
          {loading && users.length === 0 ? (
            <div className="rounded-2xl border border-[#2A2E37] bg-[#171A21] p-14 flex flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[#FF6A39]" />
              <p className="mt-3 text-sm text-[#8B8D94]">Loading users…</p>
            </div>
          ) : error && users.length === 0 ? (
            <div className="rounded-2xl border border-[#2A2E37] bg-[#171A21] p-12 flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <AlertTriangle size={26} className="text-rose-400" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#E8E6E1]">
                Couldn't load users
              </h3>
              <p className="mt-2 text-sm text-[#8B8D94] max-w-md">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-5 rounded-xl bg-[#FF6A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a2c] transition"
              >
                Try again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-[#2A2E37] bg-[#171A21] p-12 flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A39]/10">
                <UserIcon size={26} className="text-[#FF6A39]" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#E8E6E1]">
                No users found
              </h3>
              <p className="mt-2 text-sm text-[#8B8D94] max-w-md">
                {users.length === 0
                  ? "There are no users in the system yet."
                  : "No users match your search or filter. Try clearing them."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between text-[11px] md:text-xs text-[#8B8D94]">
                <span>
                  Showing{" "}
                  <span className="text-[#C7C9CE] font-medium">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredUsers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="text-[#C7C9CE] font-medium">
                    {filteredUsers.length}
                  </span>{" "}
                  users
                </span>
                <span className="hidden sm:inline">
                  Page {page} of {totalPages}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {paginatedUsers.map((user, i) => (
                  <div
                    key={user.id}
                    className="user-card-enter"
                    style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
                  >
                    <UserCard
                      user={user}
                      onEdit={(u) => {
                        setActionError(null);
                        setEditingUser(u);
                      }}
                      onDelete={(u) => {
                        setActionError(null);
                        setDeletingUser(u);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] md:text-xs text-[#8B8D94]">
                  Page <span className="text-[#C7C9CE]">{page}</span> of{" "}
                  <span className="text-[#C7C9CE]">{totalPages}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-xl border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs text-[#C7C9CE] hover:bg-[#1B1E24] hover:border-[#3A3F4A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={12} />
                    Prev
                  </button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] rounded-xl px-3 py-2 text-xs font-medium transition ${
                        p === page
                          ? "bg-[#FF6A39] text-white shadow-lg shadow-[#FF6A39]/20"
                          : "border border-[#2A2E37] bg-[#171A21] text-[#C7C9CE] hover:bg-[#1B1E24] hover:border-[#3A3F4A]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  {totalPages > 5 && (
                    <>
                      <span className="text-xs text-[#8B8D94] px-1">…</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`min-w-[36px] rounded-xl px-3 py-2 text-xs font-medium transition ${
                          page === totalPages
                            ? "bg-[#FF6A39] text-white shadow-lg shadow-[#FF6A39]/20"
                            : "border border-[#2A2E37] bg-[#171A21] text-[#C7C9CE] hover:bg-[#1B1E24] hover:border-[#3A3F4A]"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-xl border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs text-[#C7C9CE] hover:bg-[#1B1E24] hover:border-[#3A3F4A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ================= Modals ================= */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          loading={actionLoading}
          error={actionError}
          onClose={() => {
            if (actionLoading) return;
            setEditingUser(null);
            setActionError(null);
          }}
          onSave={handleUpdate}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          loading={actionLoading}
          error={actionError}
          onClose={() => {
            if (actionLoading) return;
            setDeletingUser(null);
            setActionError(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default AdminUsers;