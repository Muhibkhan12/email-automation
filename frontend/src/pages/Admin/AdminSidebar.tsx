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

/* ─────────────── design tokens (matches AdminDashboard) ─────────────── */

const T = {
  bg:          "#0E0F11",
  surface:     "#151618",
  surface2:    "#1B1C1F",
  surfaceHi:   "#232427",
  line:        "rgba(236,237,239,0.08)",
  lineStrong:  "rgba(236,237,239,0.14)",
  text:        "#ECEDEF",
  textMuted:   "#A1A4AB",
  textFaint:   "#6C7078",
  accent:      "#F0884D",
  accentSoft:  "rgba(240,136,77,0.12)",
  accentBorder:"rgba(240,136,77,0.35)",
  success:     "#5FB07A",
  successSoft: "rgba(95,176,122,0.12)",
  successBorder:"rgba(95,176,122,0.30)",
  danger:      "#D8665D",
  dangerSoft:  "rgba(216,102,93,0.12)",
  dangerBorder:"rgba(216,102,93,0.30)",
  neutral1:    "#C9CBD0",
  neutral2:    "#8E9199",
};

const FONT = {
  body: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.line}`;
const ICON = { size: 16, strokeWidth: 1.5 };

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
    className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors"
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          aria-hidden
          className="absolute inset-0 rounded-md transition-colors"
          style={{
            background: isActive ? T.accentSoft : "transparent",
            boxShadow: isActive ? `inset 0 0 0 1px ${T.accentBorder}` : `inset 0 0 0 1px transparent`,
          }}
        />

        <span
          className="relative shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: isActive ? "rgba(240,136,77,0.18)" : T.surface2,
            boxShadow: `inset 0 0 0 1px ${isActive ? T.accentBorder : T.line}`,
          }}
        >
          <Icon
            size={13}
            strokeWidth={1.5}
            style={{ color: isActive ? T.accent : T.textMuted }}
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
            className="relative shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
            style={{
              background: T.successSoft,
              color: T.success,
              boxShadow: `inset 0 0 0 1px ${T.successBorder}`,
              fontFamily: FONT.mono,
            }}
          >
            {badge}
          </span>
        )}

        {isActive && (
          <ChevronRight
            size={13}
            strokeWidth={1.5}
            className="relative shrink-0"
            style={{ color: T.accent }}
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
        boxShadow: `inset 0 0 0 1px ${T.line}, 0 24px 48px -16px rgba(0,0,0,0.8)`,
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: T.line }}>
        <div className="flex items-center gap-2.5">
          <div
            className="relative shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: T.accentSoft, boxShadow: `inset 0 0 0 1px ${T.accentBorder}` }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: T.accent }} />
            ) : (
              <span className="text-[11px] font-medium" style={{ color: T.accent, fontFamily: FONT.mono }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: T.success, borderColor: T.surface }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
              {loadingUser ? "Loading…" : displayName}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
              {loadingUser ? "—" : displayEmail}
            </p>
          </div>
        </div>

        {user?.role && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: T.accentSoft, color: T.accent, boxShadow: `inset 0 0 0 1px ${T.accentBorder}`, fontFamily: FONT.mono }}
          >
            <Shield size={10} strokeWidth={1.5} />
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
            className="group w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[12px] transition-colors hover:bg-white/3"
            style={{ color: T.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
          >
            <span
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.line}` }}
            >
              <Icon size={12} strokeWidth={1.5} style={{ color: T.textMuted }} />
            </span>
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
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
          className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[12px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              <LogOut size={12} strokeWidth={1.5} style={{ color: T.danger }} />
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
        borderRight: `1px solid ${T.line}`,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        .asb-nav::-webkit-scrollbar { width: 6px; }
        .asb-nav::-webkit-scrollbar-track { background: transparent; }
        .asb-nav::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }
      `}</style>

      {/* ── Brand row ── */}
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b" style={{ borderColor: T.line }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${T.accent}, #F5A574)`,
            boxShadow: "0 6px 18px -8px rgba(240,136,77,0.6)",
          }}
        >
          <span className="text-[13px] font-medium text-white">A</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium tracking-tight truncate" style={{ color: T.text }}>
            MailForge Admin
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
            console · v1.4
          </p>
        </div>

        <span
          className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
          style={{
            background: T.accentSoft,
            color: T.accent,
            boxShadow: `inset 0 0 0 1px ${T.accentBorder}`,
            fontFamily: FONT.mono,
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
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="asb-nav flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-2.5 mb-2">
              <p
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: T.textFaint, fontFamily: FONT.mono }}
              >
                {group.label}
              </p>
              <span className="flex-1 h-px" style={{ background: T.line }} />
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
        style={{ borderColor: T.line }}
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
            boxShadow: profileOpen ? `inset 0 0 0 1px ${T.line}` : "inset 0 0 0 1px transparent",
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: T.accentSoft,
              boxShadow: `inset 0 0 0 1px ${T.accentBorder}`,
            }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: T.accent }} />
            ) : (
              <span className="text-[11px] font-medium" style={{ color: T.accent, fontFamily: FONT.mono }}>
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
                <div className="h-2.5 w-32 rounded animate-pulse mt-1.5" style={{ background: T.surfaceHi }} />
              </>
            ) : (
              <>
                <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
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
            strokeWidth={1.5}
            className={`shrink-0 transition-all ${profileOpen ? "rotate-90" : "group-hover:translate-x-0.5"}`}
            style={{ color: profileOpen ? T.accent : T.textFaint }}
          />
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;