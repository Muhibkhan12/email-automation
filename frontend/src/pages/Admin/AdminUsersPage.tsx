// AdminUsers.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Menu, Search, ChevronDown, ChevronLeft, ChevronRight,
  User as UserIcon, Shield, UserCheck, Loader2, AlertTriangle,
  Mail, Calendar, Sparkles, Pencil, Trash2, X, Save,
  RefreshCw, Users as UsersIcon, CheckSquare, Square,
  SlidersHorizontal, Check, Command,
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
type Role = (typeof ROLES)[number];

type Density = "comfortable" | "compact" | "dense";
const DENSITY: Record<Density, { row: string; cell: string }> = {
  comfortable: { row: "h-[60px]", cell: "py-3.5" },
  compact:     { row: "h-[52px]", cell: "py-2.5" },
  dense:       { row: "h-[44px]", cell: "py-2" },
};

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
  surfaceTop: "#10141D",
  inner: "#0F131C",
  rowHover: "#11151E",
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

/* ─────────────────────────── Hooks ─────────────────────────── */

const useEscape = (active: boolean, handler: () => void) => {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, handler]);
};

const useFocusOnMount = <T extends HTMLElement>(active: boolean) => {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (active) setTimeout(() => ref.current?.focus(), 30);
  }, [active]);
  return ref;
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Avatar: React.FC<{ seed: string; name: string; size?: number }> = ({ seed, name, size = 36 }) => {
  const hue = hueFor(seed);
  const initial = (name || "U").trim()[0]?.toUpperCase() ?? "U";
  return (
    <div
      className="shrink-0 rounded-xl flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size, height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${hue}, ${hue}88)`,
        boxShadow: `0 8px 20px -10px ${hue}80, inset 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
};

const RolePill: React.FC<{ role: ApiUser["role"] }> = ({ role }) => {
  const meta = ROLE_META[role] ?? ROLE_META.EMPLOYEE;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
};

const StatPill: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
  accentSoft: string;
  accentRing: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, accent, accentSoft, accentRing, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all hover:-translate-y-0.5"
    style={{
      background: active ? accentSoft : C.inner,
      boxShadow: `inset 0 0 0 1px ${active ? accentRing : C.border}`,
    }}
    aria-pressed={active}
  >
    <div
      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accentRing}` }}
    >
      <Icon size={15} style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-[18px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: C.dark }}>
        {value}
      </p>
      <p className="text-[10.5px] mt-1 truncate" style={{ color: active ? accent : C.textMuted }}>{label}</p>
    </div>
  </button>
);

/* ─────────────────────────── Page ─────────────────────────── */

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>("All");
  const [sortField, setSortField] = useState<keyof ApiUser>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<Density>("comfortable");

  // Drawer / modals
  const [openUserId, setOpenUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Fetch ────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Filtering + sorting ──────────────────── */
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

  /* ── Selection stays scoped to filtered set ── */
  useEffect(() => {
    setSelected((prev) => {
      const allowed = new Set(filteredUsers.map((u) => u.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredUsers]);

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

  /* ── Selection helpers ────────────────────── */
  const allVisibleSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selected.has(u.id));

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) paginatedUsers.forEach((u) => next.delete(u.id));
      else paginatedUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  /* ── Update / delete ──────────────────────── */
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

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const ids = Array.from(selected);
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`http://localhost:8000/auth/users/${id}`, { method: "DELETE" }).then((r) => ({
            id,
            ok: r.ok,
          }))
        )
      );
      const failed = results.filter((r) => !r.ok).map((r) => r.id);
      const succeeded = new Set(results.filter((r) => r.ok).map((r) => r.id));
      setUsers((prev) => prev.filter((u) => !succeeded.has(u.id)));
      if (failed.length > 0) {
        setActionError(`Failed to delete ${failed.length} of ${ids.length} user(s).`);
        setSelected(new Set(failed));
      } else {
        setSelected(new Set());
        setBulkDeleting(false);
      }
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      setActionError(err?.message ?? "Failed to delete selected users.");
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters = !!search || roleFilter !== "All";
  const openUser = openUserId != null ? users.find((u) => u.id === openUserId) ?? null : null;

  /* ── Keyboard shortcuts ───────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearch("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes drawerIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .drawer-in { animation: drawerIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes barUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .bar-up { animation: barUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }

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
        .au-row:hover { background: ${C.rowHover}; }
        .au-row .au-actions { opacity: 0; transition: opacity 0.15s ease; }
        .au-row:hover .au-actions, .au-row:focus-within .au-actions { opacity: 1; }
        select option { background: #141821; color: #E8E6E1; }
        thead.au-thead th { position: sticky; top: 0; background: ${C.surfaceTop}; z-index: 1; }
        .kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 4px;
          border-radius: 4px; font-size: 10px; font-family: ${FONT.mono};
          color: ${C.textMuted}; background: ${C.inner}; box-shadow: inset 0 0 0 1px ${C.border};
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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
                  aria-label="Open menu"
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

            {/* ── Stat pills (clickable filters) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <StatPill
                icon={UsersIcon}
                label="Total users"
                value={users.length}
                accent={C.primary}
                accentSoft={C.primarySoft}
                accentRing={C.primaryRing}
                active={roleFilter === "All"}
                onClick={() => setRoleFilter("All")}
              />
              <StatPill
                icon={Shield}
                label="Admins"
                value={adminCount}
                accent={C.purple}
                accentSoft={C.purpleSoft}
                accentRing={C.purpleRing}
                active={roleFilter === "ADMIN"}
                onClick={() => setRoleFilter((prev) => (prev === "ADMIN" ? "All" : "ADMIN"))}
              />
              <StatPill
                icon={UserCheck}
                label="Employees"
                value={employeeCount}
                accent={C.blue}
                accentSoft={C.blueSoft}
                accentRing={C.blueRing}
                active={roleFilter === "EMPLOYEE"}
                onClick={() => setRoleFilter((prev) => (prev === "EMPLOYEE" ? "All" : "EMPLOYEE"))}
              />
            </div>

            {/* ── Command bar ────────────────────── */}
            <div
              className="rounded-3xl p-3 mb-5 soft-ring sticky top-3 z-20"
              style={{ background: "rgba(20,24,33,0.85)", backdropFilter: "blur(10px)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0 transition-all"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
                  onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                >
                  <Search size={14} style={{ color: C.textMuted }} className="shrink-0" />
                  <input
                    ref={searchRef}
                    placeholder="Search by username or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-[13.5px] outline-none"
                    style={{ color: C.textBody }}
                    aria-label="Search users"
                  />
                  {search ? (
                    <button
                      onClick={() => setSearch("")}
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-[#1B2130]"
                      style={{ color: C.textMuted }}
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1 shrink-0">
                      <span className="kbd">⌘</span>
                      <span className="kbd">K</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <SlidersHorizontal size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as Role)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      aria-label="Filter by role"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All roles" : r}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <ChevronDown size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={`${String(sortField)}-${sortDirection}`}
                      onChange={(e) => {
                        const [f, d] = e.target.value.split("-");
                        setSortField(f as keyof ApiUser);
                        setSortDirection(d as "asc" | "desc");
                      }}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      aria-label="Sort users"
                    >
                      <option value="username-asc">Name · A→Z</option>
                      <option value="username-desc">Name · Z→A</option>
                      <option value="email-asc">Email · A→Z</option>
                      <option value="email-desc">Email · Z→A</option>
                      <option value="created_at-desc">Joined · newest</option>
                      <option value="created_at-asc">Joined · oldest</option>
                    </select>
                  </div>

                  {/* Density */}
                  <div
                    className="inline-flex items-center gap-0.5 rounded-2xl p-1"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    role="group"
                    aria-label="Density"
                  >
                    {(["comfortable", "compact", "dense"] as Density[]).map((d) => {
                      const active = density === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setDensity(d)}
                          className="rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all"
                          style={{
                            background: active ? "#1B2130" : "transparent",
                            color: active ? C.dark : C.textMuted,
                            boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "none",
                          }}
                          title={d}
                        >
                          <span className="inline-flex flex-col gap-[3px]">
                            <span className="w-3 h-px" style={{ background: "currentColor" }} />
                            <span className="w-3 h-px" style={{ background: "currentColor" }} />
                            <span className="w-3 h-px" style={{ background: "currentColor" }} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={() => { setSearch(""); setRoleFilter("All"); }}
                      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                      style={{ background: C.inner, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11.5px]" style={{ color: C.textMuted }}>
                <span>
                  Showing{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                    {filteredUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)}
                  </span>{" "}
                  of <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredUsers.length}</span>
                </span>
                <span className="hidden sm:inline" style={{ fontFamily: FONT.mono }}>
                  Page {page} / {totalPages}
                </span>
              </div>
            </div>

            {/* ── Table ──────────────────────────── */}
            <div className="rounded-3xl overflow-hidden soft-ring" style={{ background: C.surface }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 720 }}>
                  <thead className="au-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="w-[46px] px-4 py-3" scope="col">
                        <button
                          onClick={toggleAllVisible}
                          aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                          className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                        >
                          {allVisibleSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                        </button>
                      </th>
                      <SortHeader field="username"   label="User"   sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                      <SortHeader field="email"      label="Email"  sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                      <th className="px-3 py-3 font-medium w-[130px]" scope="col">Role</th>
                      <SortHeader field="created_at" label="Joined" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} align="right" />
                      <th className="w-[90px] px-4 py-3" scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Loading */}
                    {loading && users.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 size={26} className="animate-spin" style={{ color: C.primary }} />
                            <p className="mt-3 text-[13px]" style={{ color: C.textMuted }}>Loading users…</p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Error */}
                    {!loading && error && users.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                              style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}>
                              <AlertTriangle size={26} style={{ color: C.danger }} />
                            </div>
                            <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold text-[#F2F0EB]">
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
                        </td>
                      </tr>
                    )}

                    {/* Empty */}
                    {!loading && !error && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                              style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}>
                              <UserIcon size={26} style={{ color: C.primary }} />
                            </div>
                            <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold text-[#F2F0EB]">
                              {users.length === 0 ? "No users yet" : "No users match"}
                            </h3>
                            <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>
                              {users.length === 0
                                ? "There are no users in the system yet."
                                : "Try a different search or clear the filters."}
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
                        </td>
                      </tr>
                    )}

                    {/* Rows */}
                    {!loading && !error && paginatedUsers.map((u) => {
                      const isSelected = selected.has(u.id);
                      const isOpen = openUserId === u.id;
                      const d = DENSITY[density];
                      return (
                        <tr
                          key={u.id}
                          className={`au-row float-in transition-colors cursor-pointer ${d.row}`}
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            background: isSelected ? "rgba(255,106,57,0.06)" : isOpen ? C.rowHover : "transparent",
                          }}
                          onClick={() => setOpenUserId(u.id)}
                          aria-selected={isSelected}
                        >
                          <td className={`px-4 ${d.cell}`} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleOne(u.id)}
                              aria-label={isSelected ? "Deselect user" : "Select user"}
                              className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                            >
                              {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                            </button>
                          </td>

                          <td className={`px-3 ${d.cell}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar seed={u.username || String(u.id)} name={u.username} size={density === "dense" ? 30 : 36} />
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-medium truncate" style={{ color: C.dark }}>
                                  {u.username || "Unknown user"}
                                </p>
                                <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  #{u.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className={`px-3 ${d.cell}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail size={12} className="shrink-0" style={{ color: C.textMuted }} />
                              <span className="text-[12.5px] truncate max-w-[240px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                                {u.email || "—"}
                              </span>
                            </div>
                          </td>

                          <td className={`px-3 ${d.cell}`}><RolePill role={u.role} /></td>

                          <td className={`px-3 ${d.cell} text-right`}>
                            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                              <Calendar size={11} /> {formatDate(u.created_at)}
                            </span>
                          </td>

                          <td className={`px-4 ${d.cell}`} onClick={(e) => e.stopPropagation()}>
                            <div className="au-actions flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setActionError(null); setEditingUser(u); }}
                                aria-label={`Edit ${u.username || "user"}`}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => { setActionError(null); setDeletingUser(u); }}
                                aria-label={`Delete ${u.username || "user"}`}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: C.danger }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = C.dangerSoft)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t" style={{ borderColor: C.border }}>
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
              )}
            </div>
          </div>
        </div>

        {/* ── Bulk selection bar ────────────── */}
        {selected.size > 0 && (
          <div
            className="bar-up fixed left-1/2 bottom-5 z-40 flex items-center gap-3 rounded-2xl px-3 py-2.5"
            style={{
              background: "#141821",
              boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.7)",
            }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="text-[12.5px] pl-1" style={{ color: C.textBody }}>
              <span style={{ fontFamily: FONT.mono, color: C.primary }}>{selected.size}</span> selected
            </span>
            <span className="w-px h-5" style={{ background: C.border }} />
            <button
              onClick={() => {
                const emails = users.filter((u) => selected.has(u.id)).map((u) => u.email).filter(Boolean);
                navigator.clipboard?.writeText(emails.join(", "));
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <Mail size={12} /> Copy emails
            </button>
            <button
              onClick={() => { setActionError(null); setBulkDeleting(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors"
              style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="inline-flex items-center justify-center rounded-xl p-2 transition-colors"
              style={{ color: C.textMuted }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>

      {/* ── Detail drawer ──────────────────── */}
      {openUser && (
        <UserDrawer
          user={openUser}
          onClose={() => setOpenUserId(null)}
          onEdit={() => { setOpenUserId(null); setActionError(null); setEditingUser(openUser); }}
          onDelete={() => { setOpenUserId(null); setActionError(null); setDeletingUser(openUser); }}
        />
      )}

      {/* ── Modals ─────────────────────────── */}
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

      {bulkDeleting && (
        <BulkDeleteModal
          count={selected.size}
          loading={actionLoading}
          error={actionError}
          onClose={() => {
            if (actionLoading) return;
            setBulkDeleting(false);
            setActionError(null);
          }}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
};

/* ─────────────────────────── Sortable header ─────────────────────────── */

const SortHeader: React.FC<{
  field: keyof ApiUser;
  label: string;
  sortField: keyof ApiUser;
  sortDirection: "asc" | "desc";
  onSort: (f: keyof ApiUser) => void;
  align?: "left" | "right";
}> = ({ field, label, sortField, sortDirection, onSort, align = "left" }) => {
  const active = sortField === field;
  return (
    <th
      className={`px-3 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      scope="col"
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 transition-colors ${align === "right" ? "flex-row-reverse" : ""}`}
        style={{ color: active ? C.dark : C.textMuted }}
      >
        {label}
        <ChevronDown
          size={11}
          className={`transition-transform ${active && sortDirection === "asc" ? "rotate-180" : ""} ${active ? "" : "opacity-0"}`}
        />
      </button>
    </th>
  );
};

/* ─────────────────────────── User drawer ─────────────────────────── */

const UserDrawer: React.FC<{
  user: ApiUser;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ user, onClose, onEdit, onDelete }) => {
  useEscape(true, onClose);
  const closeBtnRef = useFocusOnMount<HTMLButtonElement>(true);

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="drawer-in fixed z-[56] inset-x-2 bottom-2 top-auto max-h-[85vh] rounded-3xl overflow-hidden
                   lg:inset-y-4 lg:right-4 lg:left-auto lg:bottom-4 lg:top-4 lg:w-[420px] lg:max-h-none"
        style={{
          background: C.surface,
          boxShadow: "inset 0 0 0 1px #232938, 0 40px 80px -30px rgba(0,0,0,0.8)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${user.username || "user"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: C.border }}>
            <div className="flex items-start gap-3.5 min-w-0">
              <Avatar seed={user.username || String(user.id)} name={user.username} size={52} />
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold truncate" style={{ fontFamily: FONT.display, color: C.dark }}>
                  {user.username || "Unknown user"}
                </h3>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                  {user.email || "No email"}
                </p>
                <div className="mt-2"><RolePill role={user.role} /></div>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close details"
              className="shrink-0 p-2 rounded-2xl transition-colors"
              style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <DrawerField icon={Mail} label="Email" value={user.email || "—"} mono />
            <DrawerField icon={Shield} label="Role" value={ROLE_META[user.role]?.label ?? "—"} />
            <DrawerField icon={Calendar} label="Joined" value={formatDate(user.created_at)} mono />
            <DrawerField icon={UserIcon} label="User ID" value={`#${user.id}`} mono />

            <div className="rounded-2xl p-4 mt-2" style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Quick actions</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
                  style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                >
                  <Pencil size={12} /> Edit user
                </button>
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
                  style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t" style={{ borderColor: C.border }}>
            <button
              onClick={onClose}
              className="w-full rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const DrawerField: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}> = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3">
    <div
      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
    >
      <Icon size={14} style={{ color: C.textMuted }} />
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</p>
      <p
        className="text-[13px] mt-0.5 truncate"
        style={{ color: C.textBody, fontFamily: mono ? FONT.mono : undefined }}
      >
        {value}
      </p>
    </div>
  </div>
);

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
  const firstRef = useFocusOnMount<HTMLInputElement>(true);

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

  const inputBase = "w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all disabled:opacity-50";
  const inputStyle: React.CSSProperties = {
    background: C.inner,
    color: C.textBody,
    boxShadow: `inset 0 0 0 1px ${C.border}`,
  };
  const onFocusIn = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)`);
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`);

  useEscape(!loading, onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
        role="dialog"
        aria-modal="true"
        aria-label="Edit user"
      >
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
              ref={firstRef}
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
                    aria-pressed={active}
                  >
                    <Icon size={13} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
}> = ({ user, loading, error, onClose, onConfirm }) => {
  useEscape(!loading, onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
        role="dialog"
        aria-modal="true"
        aria-label="Delete user"
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
};

/* ─────────────────────────── Bulk delete modal ─────────────────────────── */

const BulkDeleteModal: React.FC<{
  count: number;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ count, loading, error, onClose, onConfirm }) => {
  useEscape(!loading, onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
        role="dialog"
        aria-modal="true"
        aria-label="Delete users"
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
                Delete {count} user{count === 1 ? "" : "s"}?
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5"
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
            {loading ? "Deleting…" : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Small helpers ─────────────────────────── */

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
    aria-current={active ? "page" : undefined}
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