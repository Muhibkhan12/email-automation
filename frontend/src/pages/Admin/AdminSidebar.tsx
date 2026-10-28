// AdminSidebar.tsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Bell, Mail, FileText,
  Settings as SettingsIcon, Users, AtSign, ListOrdered,
  Megaphone, ChevronRight, Activity, X,
  LogOut, Shield, UserCog, User as UserIcon, Loader2,
} from "lucide-react";
import { getProfile, logoutUser } from "../../services/AuthServices";
import type { User } from "../../types/UserTypes";

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


/* ─────────────── helpers ─────────────── */

const initialsOf = (name?: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
};

/* ─────────────── nav config ─────────────── */

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard",     path: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Analytics",     path: "/admin/analytics", icon: BarChart3 },
      { name: "System Health", path: "/admin/system",    icon: Activity },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Campaigns", path: "/admin/campaigns", icon: Megaphone, badge: "Live" },
      { name: "Users",     path: "/admin/users",     icon: Users },
      { name: "Templates", path: "/admin/templates", icon: FileText },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { name: "Email Logs",      path: "/admin/emaillogs",       icon: Mail },
      { name: "Queue Monitor",   path: "/admin/queuemonitor",    icon: ListOrdered },
      { name: "Sender Accounts", path: "/admin/senders-account", icon: AtSign },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Notifications", path: "/admin/notifications", icon: Bell },
      { name: "Settings",      path: "/admin/settings",      icon: SettingsIcon },
    ],
  },
];

/* ─────────────── nav item ─────────────── */

interface NavItemProps {
  path: string;
  name: string;
  icon: React.ElementType;
  badge?: string;
  onClose?: () => void;
}

const NavItem = ({ path, name, icon: Icon, badge, onClose }: NavItemProps) => (
  <NavLink
    to={path}
    end={path === "/admin"}
    onClick={onClose}
    className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium transition-colors"
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          aria-hidden
          className="absolute inset-0 rounded-md transition-colors"
          style={{
            background: isActive ? T.brandSoft : "transparent",
            boxShadow: isActive ? `inset 0 0 0 1px ${T.brandBorder}` : "inset 0 0 0 1px transparent",
          }}
        />

        <span
          className="relative shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: isActive ? "rgba(99,102,241,0.18)" : T.surface2,
            boxShadow: `inset 0 0 0 1px ${isActive ? T.brandBorder : T.borderSoft}`,
          }}
        >
          <Icon
            size={13}
            strokeWidth={2}
            style={{ color: isActive ? T.brand : T.textMuted }}
          />
        </span>

        <span
          className="relative flex-1 truncate transition-colors"
          style={{ color: isActive ? T.text : T.textMuted }}
        >
          {name}
        </span>

        {badge && (
          <span
            className="relative shrink-0 text-[10.5px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              background: T.successSoft,
              color: T.success,
              boxShadow: `inset 0 0 0 1px ${T.successBorder}`,
            }}
          >
            {badge}
          </span>
        )}

        {isActive && (
          <ChevronRight
            size={13}
            className="relative shrink-0"
            style={{ color: T.brand }}
          />
        )}
      </>
    )}
  </NavLink>
);

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

const useClickOutside = <T extends HTMLElement>(active: boolean, handler: () => void) => {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [active, handler]);
  return ref;
};

/* ─────────────── profile menu ─────────────── */

interface ProfileMenuProps {
  onClose: () => void;
  user: User | null;
  loadingUser: boolean;
}

const ProfileMenu = ({ onClose, user, loadingUser }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEscape(true, onClose);

  const handleLogout = async () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      setTimeout(() => setConfirmingLogout(false), 4000);
      return;
    }
    try {
      setLoggingOut(true);
      await logoutUser();
    } catch (err) {
      console.warn("Logout request failed, clearing local session anyway:", err);
    } finally {
      setLoggingOut(false);
      onClose();
      navigate("/");
    }
  };

  const displayName = user?.username || "Signed in";
  const displayEmail = user?.email || "—";
  const initials = initialsOf(user?.username);

  const menuItems: { label: string; icon: React.ElementType; onClick: () => void }[] = [
    { label: "View profile",     icon: UserIcon, onClick: () => { onClose(); navigate("/admin/profile"); } },
    { label: "Account settings", icon: UserCog,  onClick: () => { onClose(); navigate("/admin/settings"); } },
  ];

  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className="absolute left-2 right-2 bottom-full mb-2 rounded-xl overflow-hidden"
      style={{
        background: T.surface,
        boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 48px -16px rgba(0,0,0,0.8)`,
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: T.borderSoft }}>
        <div className="flex items-center gap-2.5">
          <div
            className="relative shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: T.brand }} />
            ) : (
              <span className="text-[11.5px] font-bold" style={{ color: T.brand, fontFamily: FONT.mono }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: T.success, borderColor: T.surface }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>
              {loadingUser ? "Loading…" : displayName}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
              {loadingUser ? "—" : displayEmail}
            </p>
          </div>
        </div>

        {user?.role && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
            style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            <Shield size={10} />
            {user.role}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="p-1.5">
        {menuItems.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            role="menuitem"
            onClick={onClick}
            className="group w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[12.5px] transition-colors hover:bg-white/3"
            style={{ color: T.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
          >
            <span
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <Icon size={12} style={{ color: T.textMuted }} />
            </span>
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight
              size={12}
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: T.textFaint }}
            />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="p-1.5 pt-0">
        <button
          role="menuitem"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[12.5px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: confirmingLogout ? T.dangerSoft : "transparent",
            color: T.danger,
            boxShadow: confirmingLogout ? `inset 0 0 0 1px ${T.dangerBorder}` : "none",
          }}
          onMouseEnter={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = T.dangerSoft;
          }}
          onMouseLeave={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
          >
            {loggingOut ? (
              <Loader2 size={12} className="animate-spin" style={{ color: T.danger }} />
            ) : (
              <LogOut size={12} style={{ color: T.danger }} />
            )}
          </span>
          <span className="flex-1 truncate">
            {loggingOut ? "Signing out…" : confirmingLogout ? "Click again to confirm" : "Log out"}
          </span>
        </button>
      </div>
    </div>
  );
};

/* ─────────────── sidebar ─────────────── */

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(profileOpen, () => setProfileOpen(false));

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (!cancelled) setUser(data);
      } catch (err) {
        console.warn("Failed to load admin profile for sidebar:", err);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.username ?? "";
  const displayEmail = user?.email ?? "";
  const initials = initialsOf(user?.username);

  return (
    <div
      className="w-64 h-screen flex flex-col"
      style={{
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
      }}
    >
      <style>{`
        .asb-nav::-webkit-scrollbar { width: 6px; }
        .asb-nav::-webkit-scrollbar-track { background: transparent; }
        .asb-nav::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .asb-nav::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
      `}</style>

      {/* ── Brand row ── */}
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b" style={{ borderColor: T.border }}>
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${T.brand}, #818CF8)`,
            boxShadow: "0 6px 18px -8px rgba(99,102,241,0.6)",
          }}
        >
          <span className="text-[13px] font-bold text-white">A</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold tracking-tight truncate" style={{ color: T.text }}>
            MailForge Admin
          </p>
          <p className="text-[10.5px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
            console · v1.4
          </p>
        </div>

        <span
          className="shrink-0 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: T.brandSoft,
            color: T.brand,
            boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
          }}
        >
          Admin
        </span>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: T.textMuted }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="asb-nav flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-2.5 mb-2">
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: T.textFaint }}
              >
                {group.label}
              </p>
              <span className="flex-1 h-px" style={{ background: T.borderSoft }} />
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer account ── */}
      <div
        ref={containerRef}
        className="relative px-2 py-3 shrink-0 border-t"
        style={{ borderColor: T.border }}
      >
        {profileOpen && (
          <ProfileMenu
            user={user}
            loadingUser={loadingUser}
            onClose={() => setProfileOpen(false)}
          />
        )}

        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="group w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors"
          style={{
            background: profileOpen ? T.surface2 : "transparent",
            boxShadow: profileOpen ? `inset 0 0 0 1px ${T.border}` : "inset 0 0 0 1px transparent",
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: T.brandSoft,
              boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
            }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: T.brand }} />
            ) : (
              <span className="text-[11px] font-bold" style={{ color: T.brand, fontFamily: FONT.mono }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: T.success, borderColor: T.surface }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser ? (
              <>
                <div className="h-2.5 w-24 rounded animate-pulse" style={{ background: T.surfaceHi }} />
                <div className="h-2.25 w-32 rounded animate-pulse mt-1.5" style={{ background: T.surfaceHi }} />
              </>
            ) : (
              <>
                <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>
                  {displayName || "Signed in"}
                </p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  {displayEmail || "—"}
                </p>
              </>
            )}
          </div>

          <ChevronRight
            size={14}
            className={`shrink-0 transition-all ${profileOpen ? "rotate-90" : "group-hover:translate-x-0.5"}`}
            style={{ color: profileOpen ? T.brand : T.textFaint }}
          />
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;