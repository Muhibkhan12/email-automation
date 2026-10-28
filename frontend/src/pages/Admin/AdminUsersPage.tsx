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
  SlidersHorizontal,
} from "lucide-react";

/* ─────────────── types & config ─────────────── */

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
  comfortable: { row: "h-[58px]", cell: "py-3" },
  compact:     { row: "h-[50px]", cell: "py-2.5" },
  dense:       { row: "h-[42px]", cell: "py-2" },
};

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
  purple:       "#A78BFA",
  purpleSoft:   "rgba(167,139,250,0.12)",
  purpleBorder: "rgba(167,139,250,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

const ROLE_META: Record<
  ApiUser["role"],
  { fg: string; bg: string; ring: string; icon: React.ElementType; label: string }
> = {
  ADMIN:    { fg: T.purple, bg: T.purpleSoft, ring: T.purpleBorder, icon: Shield,    label: "Admin" },
  EMPLOYEE: { fg: T.info,   bg: T.infoSoft,   ring: T.infoBorder,   icon: UserCheck, label: "Employee" },
};

/* ─────────────── helpers ─────────────── */

const AVATAR_HUES = ["#6366F1", "#A78BFA", "#38BDF8", "#22C55E", "#F59E0B", "#F472B6"];
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

/* ─────────────── hooks ─────────────── */

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

/* ─────────────── primitives ─────────────── */

const Avatar: React.FC<{ seed: string; name: string; size?: number }> = ({ seed, name, size = 32 }) => {
  const hue = hueFor(seed);
  const initial = (name || "U").trim()[0]?.toUpperCase() ?? "U";
  return (
    <div
      className="shrink-0 rounded-md flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size, height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${hue}, ${hue}88)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
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
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={10} />
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
  accentBorder: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, accent, accentSoft, accentBorder, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group text-left rounded-lg p-4 transition-colors hover:bg-white/2"
    style={{
      background: T.surface,
      boxShadow: active ? `inset 0 0 0 1.5px ${accentBorder}` : `inset 0 0 0 1px ${T.border}`,
    }}
    aria-pressed={active}
  >
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} />
      </div>
    </div>
    <p className="text-[24px] font-semibold tracking-tight leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: active ? accent : T.textMuted }}>{label}</p>
  </button>
);

/* ─────────────── page ─────────────── */

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

  const [openUserId, setOpenUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);

  /* ── fetch ── */
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

  /* ── filter + sort ── */
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

  /* ── selection ── */
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

  /* ── update / delete ── */
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

  /* ── keyboard ── */
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
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Kill outer body scroll so only <main> scrolls */
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes drawerIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .drawer-in { animation: drawerIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes barUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .bar-up { animation: barUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .au-main::-webkit-scrollbar { width: 8px; }
        .au-main::-webkit-scrollbar-track { background: transparent; }
        .au-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .au-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .au-row:hover { background: rgba(255,255,255,0.02); }
        .au-row .au-actions { opacity: 0; transition: opacity 0.15s ease; }
        .au-row:hover .au-actions, .au-row:focus-within .au-actions { opacity: 1; }
        select option { background: ${T.surface2}; color: ${T.text}; }
        .kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 4px;
          border-radius: 4px; font-size: 10px; font-family: ${FONT.mono};
          color: ${T.textMuted}; background: ${T.surface2}; box-shadow: inset 0 0 0 1px ${T.border};
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="au-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                  >
                    <Sparkles size={10} /> Admin view
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {users.length} total
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Users
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Every account in the system, with role and join date.
                </p>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60 self-start md:self-auto"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </header>

          {/* Stat pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
            <StatPill
              icon={UsersIcon}
              label="Total users"
              value={users.length}
              accent={T.brand}
              accentSoft={T.brandSoft}
              accentBorder={T.brandBorder}
              active={roleFilter === "All"}
              onClick={() => setRoleFilter("All")}
            />
            <StatPill
              icon={Shield}
              label="Admins"
              value={adminCount}
              accent={T.purple}
              accentSoft={T.purpleSoft}
              accentBorder={T.purpleBorder}
              active={roleFilter === "ADMIN"}
              onClick={() => setRoleFilter((prev) => (prev === "ADMIN" ? "All" : "ADMIN"))}
            />
            <StatPill
              icon={UserCheck}
              label="Employees"
              value={employeeCount}
              accent={T.info}
              accentSoft={T.infoSoft}
              accentBorder={T.infoBorder}
              active={roleFilter === "EMPLOYEE"}
              onClick={() => setRoleFilter((prev) => (prev === "EMPLOYEE" ? "All" : "EMPLOYEE"))}
            />
          </div>

          {/* Command bar */}
          <div
            className="rounded-xl p-3 mb-5 sticky top-3 z-20"
            style={{ background: T.surface, boxShadow: RING }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  ref={searchRef}
                  placeholder="Search by username or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[13px] outline-none"
                  style={{ color: T.text }}
                  aria-label="Search users"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: T.textMuted }}
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
                  <SlidersHorizontal size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as Role)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    aria-label="Filter by role"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All roles" : r}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <ChevronDown size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={`${String(sortField)}-${sortDirection}`}
                    onChange={(e) => {
                      const [f, d] = e.target.value.split("-");
                      setSortField(f as keyof ApiUser);
                      setSortDirection(d as "asc" | "desc");
                    }}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
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
                  className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
                  style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  role="group"
                  aria-label="Density"
                >
                  {(["comfortable", "compact", "dense"] as Density[]).map((d) => {
                    const active = density === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDensity(d)}
                        className="rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors"
                        style={{
                          background: active ? T.surfaceHi : "transparent",
                          color: active ? T.text : T.textMuted,
                        }}
                        title={d}
                      >
                        <span className="inline-flex flex-col gap-0.75">
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
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors"
                    style={{ background: T.surface2, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px]" style={{ color: T.textFaint }}>
              <span>
                Showing{" "}
                <span style={{ color: T.text, fontFamily: FONT.mono }}>
                  {filteredUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)}
                </span>{" "}
                of <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredUsers.length}</span>
              </span>
              <span className="hidden sm:inline" style={{ fontFamily: FONT.mono }}>
                Page {page} / {totalPages}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                    <th className="w-11.5 px-4 md:px-5 py-2.5" scope="col">
                      <button
                        onClick={toggleAllVisible}
                        aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                        style={{ color: T.textFaint }}
                        className="transition-colors hover:text-[#E9EBF0]"
                      >
                        {allVisibleSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                      </button>
                    </th>
                    <SortHeader field="username"   label="User"   sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortHeader field="email"      label="Email"  sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                    <th className="px-3 py-2.5 font-medium w-32.5" scope="col">Role</th>
                    <SortHeader field="created_at" label="Joined" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} align="right" />
                    <th className="w-22.5 px-4 md:px-5 py-2.5" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loading */}
                  {loading && users.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="py-20 flex flex-col items-center justify-center">
                          <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
                          <p className="mt-3 text-[12.5px]" style={{ color: T.textMuted }}>Loading users…</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Error */}
                  {!loading && error && users.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                          <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                            style={{ background: T.dangerSoft, color: T.danger }}>
                            <AlertTriangle size={22} />
                          </div>
                          <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                            Couldn't load users
                          </h3>
                          <p className="mt-2 text-[12.5px] max-w-md" style={{ color: T.textMuted }}>{error}</p>
                          <button
                            onClick={fetchUsers}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110"
                            style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
                          >
                            <RefreshCw size={12} /> Try again
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
                          <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                            style={{ background: T.surface2, color: T.brand }}>
                            <UserIcon size={22} />
                          </div>
                          <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                            {users.length === 0 ? "No users yet" : "No users match"}
                          </h3>
                          <p className="mt-2 text-[12.5px] max-w-md" style={{ color: T.textMuted }}>
                            {users.length === 0
                              ? "There are no users in the system yet."
                              : "Try a different search or clear the filters."}
                          </p>
                          {users.length > 0 && (
                            <button
                              onClick={() => { setSearch(""); setRoleFilter("All"); }}
                              className="mt-4 text-[12px] font-medium transition-colors"
                              style={{ color: T.brand }}
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
                          borderTop: `1px solid ${T.borderSoft}`,
                          background: isSelected ? "rgba(99,102,241,0.06)" : isOpen ? "rgba(255,255,255,0.02)" : "transparent",
                        }}
                        onClick={() => setOpenUserId(u.id)}
                        aria-selected={isSelected}
                      >
                        <td className={`px-4 md:px-5 ${d.cell}`} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleOne(u.id)}
                            aria-label={isSelected ? "Deselect user" : "Select user"}
                            style={{ color: T.textFaint }}
                            className="transition-colors hover:text-[#E9EBF0]"
                          >
                            {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                          </button>
                        </td>

                        <td className={`px-3 ${d.cell}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar seed={u.username || String(u.id)} name={u.username} size={density === "dense" ? 26 : 30} />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                {u.username || "Unknown user"}
                              </p>
                              <p className="text-[10.5px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                #{u.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className={`px-3 ${d.cell}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail size={11} className="shrink-0" style={{ color: T.textFaint }} />
                            <span className="text-[11.5px] truncate max-w-60" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                              {u.email || "—"}
                            </span>
                          </div>
                        </td>

                        <td className={`px-3 ${d.cell}`}><RolePill role={u.role} /></td>

                        <td className={`px-3 ${d.cell} text-right`}>
                          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                            <Calendar size={10} /> {formatDate(u.created_at)}
                          </span>
                        </td>

                        <td className={`px-4 md:px-5 ${d.cell}`} onClick={(e) => e.stopPropagation()}>
                          <div className="au-actions flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setActionError(null); setEditingUser(u); }}
                              aria-label={`Edit ${u.username || "user"}`}
                              className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                              style={{ color: T.textMuted }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => { setActionError(null); setDeletingUser(u); }}
                              aria-label={`Delete ${u.username || "user"}`}
                              className="p-1.5 rounded-md transition-colors"
                              style={{ color: T.danger }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = T.dangerSoft)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Trash2 size={12} />
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
              <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t" style={{ borderColor: T.borderSoft }}>
                <span className="text-[11px]" style={{ color: T.textFaint }}>
                  Page <span style={{ color: T.text, fontFamily: FONT.mono }}>{page}</span> of{" "}
                  <span style={{ color: T.text, fontFamily: FONT.mono }}>{totalPages}</span>
                </span>

                <div className="flex items-center gap-1">
                  <PageBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={11} /> Prev
                  </PageBtn>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <PageNum key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageNum>
                  ))}

                  {totalPages > 5 && (
                    <>
                      <span className="text-[11px] px-1" style={{ color: T.textFaint }}>…</span>
                      <PageNum active={page === totalPages} onClick={() => setPage(totalPages)}>{totalPages}</PageNum>
                    </>
                  )}

                  <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next <ChevronRight size={11} />
                  </PageBtn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div
            className="bar-up fixed left-1/2 bottom-5 z-40 flex items-center gap-2.5 rounded-xl px-3 py-2"
            style={{
              background: T.surface,
              boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 48px -16px rgba(0,0,0,0.7)`,
            }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="text-[12px] pl-1" style={{ color: T.textMuted }}>
              <span style={{ fontFamily: FONT.mono, color: T.brand }}>{selected.size}</span> selected
            </span>
            <span className="w-px h-4" style={{ background: T.border }} />
            <button
              onClick={() => {
                const emails = users.filter((u) => selected.has(u.id)).map((u) => u.email).filter(Boolean);
                navigator.clipboard?.writeText(emails.join(", "));
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
              style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <Mail size={11} /> Copy emails
            </button>
            <button
              onClick={() => { setActionError(null); setBulkDeleting(true); }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <Trash2 size={11} /> Delete
            </button>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/5"
              style={{ color: T.textFaint }}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </main>

      {/* Detail drawer */}
      {openUser && (
        <UserDrawer
          user={openUser}
          onClose={() => setOpenUserId(null)}
          onEdit={() => { setOpenUserId(null); setActionError(null); setEditingUser(openUser); }}
          onDelete={() => { setOpenUserId(null); setActionError(null); setDeletingUser(openUser); }}
        />
      )}

      {/* Modals */}
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

/* ─────────────── sortable header ─────────────── */

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
      className={`px-3 py-2.5 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      scope="col"
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 transition-colors ${align === "right" ? "flex-row-reverse" : ""}`}
        style={{ color: active ? T.text : T.textFaint }}
      >
        {label}
        <ChevronDown
          size={10}
          className={`transition-transform ${active && sortDirection === "asc" ? "rotate-180" : ""} ${active ? "" : "opacity-0"}`}
        />
      </button>
    </th>
  );
};

/* ─────────────── user drawer ─────────────── */

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
        className="fixed inset-0 z-55 bg-black/60 lg:bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="drawer-in fixed z-56 inset-x-2 bottom-2 top-auto max-h-[85vh] rounded-2xl overflow-hidden
                   lg:inset-y-4 lg:right-4 lg:left-auto lg:bottom-4 lg:top-4 lg:w-100 lg:max-h-none"
        style={{
          background: T.surface,
          boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${user.username || "user"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 p-4 border-b" style={{ borderColor: T.borderSoft }}>
            <div className="flex items-start gap-3 min-w-0">
              <Avatar seed={user.username || String(user.id)} name={user.username} size={44} />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold truncate" style={{ color: T.text }}>
                  {user.username || "Unknown user"}
                </h3>
                <p className="text-[11.5px] mt-0.5 truncate" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  {user.email || "No email"}
                </p>
                <div className="mt-2"><RolePill role={user.role} /></div>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close details"
              className="shrink-0 p-2 rounded-md transition-colors hover:bg-white/5"
              style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <DrawerField icon={Mail} label="Email" value={user.email || "—"} mono />
            <DrawerField icon={Shield} label="Role" value={ROLE_META[user.role]?.label ?? "—"} />
            <DrawerField icon={Calendar} label="Joined" value={formatDate(user.created_at)} mono />
            <DrawerField icon={UserIcon} label="User ID" value={`#${user.id}`} mono />

            <div className="rounded-lg p-3.5 mt-2" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
              <p className="text-[10.5px] uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Quick actions</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                  style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                >
                  <Pencil size={11} /> Edit user
                </button>
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                  style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t" style={{ borderColor: T.borderSoft }}>
            <button
              onClick={onClose}
              className="w-full rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
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
  <div className="flex items-start gap-2.5">
    <div
      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
    >
      <Icon size={12} style={{ color: T.textMuted }} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>{label}</p>
      <p
        className="text-[12.5px] mt-0.5 truncate"
        style={{ color: T.textMuted, fontFamily: mono ? FONT.mono : undefined }}
      >
        {value}
      </p>
    </div>
  </div>
);

/* ─────────────── edit modal ─────────────── */

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

  const inputStyle: React.CSSProperties = {
    background: T.surface2,
    color: T.text,
    boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
  };
  const onFocusIn = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`);
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`);

  useEscape(!loading, onClose);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden modal-pop"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
        role="dialog"
        aria-modal="true"
        aria-label="Edit user"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand }}
            >
              <Pencil size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold truncate" style={{ color: T.text }}>
                Edit user
              </h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                Update profile details and role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          {displayedError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <AlertTriangle size={13} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color: T.danger }}>{displayedError}</p>
            </div>
          )}

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Username</label>
            <input
              ref={firstRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all disabled:opacity-50"
              style={inputStyle}
              onFocus={onFocusIn}
              onBlur={onFocusOut}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all disabled:opacity-50"
              style={inputStyle}
              onFocus={onFocusIn}
              onBlur={onFocusOut}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Role</label>
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
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-50"
                    style={{
                      background: active ? meta.bg : T.surface2,
                      color: active ? meta.fg : T.textMuted,
                      boxShadow: `inset 0 0 0 1px ${active ? meta.ring : T.borderSoft}`,
                    }}
                    aria-pressed={active}
                  >
                    <Icon size={12} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t" style={{ borderColor: T.borderSoft }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isDirty}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── delete modal ─────────────── */

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
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden modal-pop"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
        role="dialog"
        aria-modal="true"
        aria-label="Delete user"
      >
        <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: T.dangerSoft, color: T.danger }}
            >
              <Trash2 size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                Delete user?
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex items-center gap-2.5 rounded-lg p-2.5"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <Avatar seed={user.username || String(user.id)} name={user.username} size={32} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{user.username || "Unknown user"}</p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                {user.email || "No email"}
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <AlertTriangle size={13} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: T.danger, boxShadow: "0 6px 18px -8px rgba(239,68,68,0.65)" }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {loading ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── bulk delete modal ─────────────── */

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
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden modal-pop"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
        role="dialog"
        aria-modal="true"
        aria-label="Delete users"
      >
        <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: T.dangerSoft, color: T.danger }}
            >
              <Trash2 size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                Delete {count} user{count === 1 ? "" : "s"}?
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <AlertTriangle size={13} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: T.danger, boxShadow: "0 6px 18px -8px rgba(239,68,68,0.65)" }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {loading ? "Deleting…" : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── small helpers ─────────────── */

const PageBtn: React.FC<{ children: React.ReactNode; disabled?: boolean; onClick: () => void }> = ({
  children, disabled, onClick,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
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
    className="min-w-7.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
    style={{
      background: active ? T.brand : "transparent",
      color: active ? "#fff" : T.textMuted,
      boxShadow: active ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
      fontFamily: FONT.mono,
    }}
  >
    {children}
  </button>
);

export default AdminUsers;