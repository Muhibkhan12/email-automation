// AdminUsers.tsx
import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Menu, Search, ChevronDown, ChevronLeft, ChevronRight,
  User as UserIcon, Shield, UserCheck, Loader2, AlertTriangle,
  Mail, Calendar, Sparkles, Pencil, Trash2, X, Save,
  Filter, RefreshCw, Users as UsersIcon,
} from "lucide-react";

/* ─────────────────────────── Types & Config ─────────────────────────── */

interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  created_at?: string;
}

const API_URL = "http://localhost:8000/auth/users";
const PAGE_SIZE = 12;
const ROLES = ["All", "ADMIN", "EMPLOYEE"] as const;

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  purple: "#A78BFA",
  purpleSoft: "rgba(167,139,250,0.10)",
  purpleRing: "rgba(167,139,250,0.22)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

const ROLE_META: Record<
  ApiUser["role"],
  { fg: string; bg: string; ring: string; icon: React.ElementType; label: string }
> = {
  ADMIN:    { fg: C.purple, bg: C.purpleSoft, ring: C.purpleRing, icon: Shield,    label: "Admin" },
  EMPLOYEE: { fg: C.blue,   bg: C.blueSoft,   ring: C.blueRing,   icon: UserCheck, label: "Employee" },
};

/* ─────────────────────────── Helpers ─────────────────────────── */

const AVATAR_HUES = ["#FF6A39", "#A78BFA", "#60A5FA", "#34D399", "#FBBF24", "#F472B6"];
const hueFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/* ─────────────────────────── Shared ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const Avatar: React.FC<{ seed: string; name: string; size?: number }> = ({ seed, name, size = 44 }) => {
  const hue = hueFor(seed);
  const initial = (name || "U").trim()[0]?.toUpperCase() ?? "U";
  return (
    <div
      className="shrink-0 rounded-2xl flex items-center justify-center font-semibold text-white"
      style={{
        width: size, height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${hue}, ${hue}88)`,
        boxShadow: `0 8px 20px -8px ${hue}80, inset 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {initial}
    </div>
  );
};

const StatTile: React.FC<{
  label: string;
  value: string;
  accent: string;
  accentSoft: string;
  accentRing: string;
  icon: React.ElementType;
}> = ({ label, value, accent, accentSoft, accentRing, icon: Icon }) => (
  <Card className="p-4 md:p-5">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accentRing}` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: accent }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{label}</p>
  </Card>
);

/* ─────────────────────────── User card ─────────────────────────── */

const UserCard: React.FC<{
  user: ApiUser;
  onEdit: (u: ApiUser) => void;
  onDelete: (u: ApiUser) => void;
}> = ({ user, onEdit, onDelete }) => {
  const meta = ROLE_META[user.role] ?? ROLE_META.EMPLOYEE;
  const RoleIcon = meta.icon;

  return (
    <Card className="p-4 md:p-5 transition-all hover:-translate-y-0.5">
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <Avatar seed={user.username || String(user.id)} name={user.username} size={48} />

        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
          style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
        >
          <RoleIcon size={11} />
          {meta.label}
        </span>
      </div>

      {/* identity */}
      <div className="mt-3.5 min-w-0">
        <h3 className="truncate text-[14px] font-semibold" style={{ color: C.dark }}>
          {user.username || "Unknown user"}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 min-w-0">
          <Mail size={12} className="shrink-0" style={{ color: C.textMuted }} />
          <span className="truncate text-[11.5px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
            {user.email || "No email"}
          </span>
        </div>
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
          <Calendar size={11} />
          {formatDate(user.created_at)}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            aria-label="Edit user"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.primarySoft;
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.textMuted;
            }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(user)}
            aria-label="Delete user"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.dangerSoft;
              e.currentTarget.style.color = C.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.textMuted;
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
};

/* ─────────────────────────── Edit modal ─────────────────────────── */

const EditUserModal: React.FC<{
  user: ApiUser;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<ApiUser>) => void;
}> = ({ user, loading, error, onClose, onSave }) => {
  const [username, setUsername] = useState(user.username ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">(user.role);
  const [localError, setLocalError] = useState<string | null>(null);

  const isDirty = username !== user.username || email !== user.email || role !== user.role;

  const handleSubmit = () => {
    setLocalError(null);
    if (!username.trim()) return setLocalError("Username is required.");
    if (!email.trim()) return setLocalError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setLocalError("Please enter a valid email address.");

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

  const inputBase =
    "w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all disabled:opacity-50";
  const inputStyle: React.CSSProperties = {
    background: C.inner,
    color: C.textBody,
    boxShadow: `inset 0 0 0 1px ${C.border}`,
  };
  const onFocusIn = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)`);
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
            >
              <Pencil size={16} style={{ color: C.primary }} />
            </div>
            <div className="min-w-0">
              <h2 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-[15px] md:text-[17px] font-bold text-white truncate">
                Edit user
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                Update profile details and role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="shrink-0 p-2 rounded-2xl transition-colors disabled:opacity-50"
            style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="p-5 md:p-6 space-y-4">
          {displayedError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5"
              style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <AlertTriangle size={15} style={{ color: C.danger }} className="shrink-0 mt-0.5" />
              <p className="text-[12.5px]" style={{ color: C.danger }}>{displayedError}</p>
            </div>
          )}

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: C.textBody }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className={inputBase}
              style={inputStyle}
              onFocus={onFocusIn}
              onBlur={onFocusOut}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: C.textBody }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={inputBase}
              style={inputStyle}
              onFocus={onFocusIn}
              onBlur={onFocusOut}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: C.textBody }}>Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(["EMPLOYEE", "ADMIN"] as const).map((r) => {
                const active = role === r;
                const meta = ROLE_META[r];
                const Icon = meta.icon;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium transition-all disabled:opacity-50"
                    style={{
                      background: active ? meta.bg : C.inner,
                      color: active ? meta.fg : C.textBody,
                      boxShadow: `inset 0 0 0 1px ${active ? meta.ring : C.border}`,
                    }}
                  >
                    <Icon size={13} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: C.border }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
            style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isDirty}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
            style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Delete modal ─────────────────────────── */

const DeleteUserModal: React.FC<{
  user: ApiUser;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ user, loading, error, onClose, onConfirm }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
      style={{ background: C.surface }}
    >
      <div className="p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
        <div className="flex items-start gap-3.5">
          <div
            className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
          >
            <Trash2 size={18} style={{ color: C.danger }} />
          </div>
          <div className="min-w-0">
            <h3 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-[15px] md:text-[17px] font-bold text-white">
              Delete user?
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* context card */}
        <div
          className="mt-4 flex items-center gap-3 rounded-2xl p-3"
          style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
        >
          <Avatar seed={user.username || String(user.id)} name={user.username} size={38} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: C.dark }}>{user.username || "Unknown user"}</p>
            <p className="text-[11.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
              {user.email || "No email"}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5"
            style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
          >
            <AlertTriangle size={15} style={{ color: C.danger }} className="shrink-0 mt-0.5" />
            <p className="text-[12.5px]" style={{ color: C.danger }}>{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 p-4 md:p-5">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
          style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold transition-all disabled:opacity-50"
          style={{
            background: C.danger,
            color: "#0B0E13",
            boxShadow: "0 12px 30px -12px rgba(248,113,113,0.55)",
          }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {loading ? "Deleting…" : "Delete user"}
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────── Page ─────────────────────────── */

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<keyof ApiUser>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
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

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => (u.username ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "All") result = result.filter((u) => u.role === roleFilter);
    result.sort((a, b) => {
      const cmp = String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  }, [users, search, roleFilter, sortField, sortDirection]);

  useEffect(() => { setPage(1); }, [search, roleFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: keyof ApiUser) => {
    if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const employeeCount = users.filter((u) => u.role === "EMPLOYEE").length;

  const handleUpdate = async (id: number, data: Partial<ApiUser>) => {
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await fetch(`http://localhost:8000/auth/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Update failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`);
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
      setEditingUser(null);
    } catch (err: any) {
      console.error("Failed to update user:", err);
      setActionError(err?.message ?? "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await fetch(`http://localhost:8000/auth/users/${deletingUser.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`);
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

  const hasActiveFilters = !!search || roleFilter !== "All";

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .au-main::-webkit-scrollbar { width: 10px; }
        .au-main::-webkit-scrollbar-track { background: transparent; }
        .au-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .au-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="au-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                    >
                      <Sparkles size={11} /> Admin view
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {users.length} total
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Users
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Every account in the system, with role and join date.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60 self-start md:self-auto"
                style={{ background: C.surface, color: C.textBody }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </header>

            {/* ── Stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatTile label="Total users" value={String(users.length)} accent={C.primary} accentSoft={C.primarySoft} accentRing={C.primaryRing} icon={UsersIcon} />
              <StatTile label="Admins"      value={String(adminCount)}    accent={C.purple}  accentSoft={C.purpleSoft}  accentRing={C.purpleRing}  icon={Shield} />
              <StatTile label="Employees"   value={String(employeeCount)} accent={C.blue}    accentSoft={C.blueSoft}    accentRing={C.blueRing}    icon={UserCheck} />
            </div>

            {/* ── Toolbar ────────────────────────── */}
            <div className="rounded-3xl p-3 md:p-4 mb-5 md:mb-6 soft-ring" style={{ background: C.surface }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0 transition-all"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
                  onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                >
                  <Search size={14} style={{ color: C.textMuted }} className="shrink-0" />
                  <input
                    placeholder="Search by username or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-[13.5px] outline-none"
                    style={{ color: C.textBody }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-[#1B2130]"
                      style={{ color: C.textMuted }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <SortButton label="Name"   active={sortField === "username"}   direction={sortDirection} onClick={() => toggleSort("username")} />
                  <SortButton label="Joined" active={sortField === "created_at"} direction={sortDirection} onClick={() => toggleSort("created_at")} />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
                  <span style={{ color: C.textMuted }}>Filtered:</span>
                  {search && (
                    <Chip onClear={() => setSearch("")}>"{search}"</Chip>
                  )}
                  {roleFilter !== "All" && (
                    <Chip onClear={() => setRoleFilter("All")}>{roleFilter}</Chip>
                  )}
                  <button
                    onClick={() => { setSearch(""); setRoleFilter("All"); }}
                    className="ml-auto text-[11.5px] font-medium transition-colors"
                    style={{ color: C.primary }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* ── Content ────────────────────────── */}
            {loading && users.length === 0 ? (
              <div className="rounded-3xl p-14 flex flex-col items-center justify-center soft-ring" style={{ background: C.surface }}>
                <Loader2 size={26} className="animate-spin" style={{ color: C.primary }} />
                <p className="mt-3 text-[13px]" style={{ color: C.textMuted }}>Loading users…</p>
              </div>
            ) : error && users.length === 0 ? (
              <div className="rounded-3xl p-12 flex flex-col items-center justify-center text-center soft-ring" style={{ background: C.surface }}>
                <div
                  className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                >
                  <AlertTriangle size={26} style={{ color: C.danger }} />
                </div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[16px] md:text-[18px] font-semibold text-[#F2F0EB]">
                  Couldn't load users
                </h3>
                <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>{error}</p>
                <button
                  onClick={fetchUsers}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  <RefreshCw size={13} /> Try again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-3xl p-12 flex flex-col items-center justify-center text-center soft-ring" style={{ background: C.surface }}>
                <div
                  className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                >
                  <UserIcon size={26} style={{ color: C.primary }} />
                </div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[16px] md:text-[18px] font-semibold text-[#F2F0EB]">
                  No users found
                </h3>
                <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>
                  {users.length === 0
                    ? "There are no users in the system yet."
                    : "No users match your search or filter."}
                </p>
                {users.length > 0 && (
                  <button
                    onClick={() => { setSearch(""); setRoleFilter("All"); }}
                    className="mt-5 text-[12.5px] font-medium transition-colors"
                    style={{ color: C.primary }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-[11.5px] mb-3" style={{ color: C.textMuted }}>
                  <span>
                    Showing{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)}
                    </span>{" "}
                    of <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredUsers.length}</span> users
                  </span>
                  <span className="hidden sm:inline" style={{ fontFamily: FONT.mono }}>
                    Page {page} of {totalPages}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {paginatedUsers.map((user, i) => (
                    <div key={user.id} className="float-in" style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                      <UserCard
                        user={user}
                        onEdit={(u) => { setActionError(null); setEditingUser(u); }}
                        onDelete={(u) => { setActionError(null); setDeletingUser(u); }}
                      />
                    </div>
                  ))}
                </div>

                {/* ── Pagination ─────────────────── */}
                <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                    Page <span style={{ color: C.dark, fontFamily: FONT.mono }}>{page}</span> of{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>{totalPages}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <PageBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={12} /> Prev
                    </PageBtn>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                      <PageNum key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageNum>
                    ))}

                    {totalPages > 5 && (
                      <>
                        <span className="text-[11.5px] px-1" style={{ color: C.textMuted }}>…</span>
                        <PageNum active={page === totalPages} onClick={() => setPage(totalPages)}>{totalPages}</PageNum>
                      </>
                    )}

                    <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Next <ChevronRight size={12} />
                    </PageBtn>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Modals ─────────────────────────────── */}
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

/* ─────────────────────────── Small helpers ─────────────────────────── */

const Chip: React.FC<{ children: React.ReactNode; onClear: () => void }> = ({ children, onClear }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]"
    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
  >
    {children}
    <button onClick={onClear} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Remove filter">
      <X size={10} />
    </button>
  </span>
);

const SortButton: React.FC<{
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}> = ({ label, active, direction, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12.5px] transition-all"
    style={{
      background: active ? "#1B2130" : C.inner,
      color: active ? C.dark : C.textBody,
      boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.06)" : `inset 0 0 0 1px ${C.border}`,
    }}
  >
    {label}
    <ChevronDown
      size={12}
      className={`transition-transform ${active && direction === "asc" ? "rotate-180" : ""}`}
    />
  </button>
);

const PageBtn: React.FC<{ children: React.ReactNode; disabled?: boolean; onClick: () => void }> = ({
  children, disabled, onClick,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
    style={{ background: C.surface, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
  >
    {children}
  </button>
);

const PageNum: React.FC<{ children: React.ReactNode; active?: boolean; onClick: () => void }> = ({
  children, active, onClick,
}) => (
  <button
    onClick={onClick}
    className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium transition-all hover:-translate-y-0.5"
    style={{
      background: active ? C.primary : C.surface,
      color: active ? "#fff" : C.textBody,
      boxShadow: active
        ? "0 10px 24px -10px rgba(255,106,57,0.6)"
        : `inset 0 0 0 1px ${C.border}`,
    }}
  >
    {children}
  </button>
);

export default AdminUsers;