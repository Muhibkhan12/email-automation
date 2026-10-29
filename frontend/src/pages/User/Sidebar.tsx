import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, BarChart3, Mail, FileStack,
  Settings as SettingsIcon, User as UserIcon, AtSign, ListOrdered,
  Megaphone, UploadCloud, Users, ChevronRight, Menu, X,
  LogOut, Shield, UserCog, Loader2,
  Send, HelpCircle,
} from 'lucide-react'
import { getProfile, logoutUser } from '../../services/AuthServices'
import type { User } from '../../types/UserTypes'

/* ─────────────── design tokens (aligned with app) ─────────────── */
const T = {
  bg:          '#0A0B10',
  panel:       '#0D0F15',
  panelTop:    '#101219',
  surface:     '#161922',
  surfaceHi:   '#1B1F2A',
  border:      '#232838',
  borderSoft:  '#1B1F2A',
  text:        '#E9EBF0',
  textMuted:   '#9CA3B4',
  textFaint:   '#6B7280',
  brand:       '#6366F1',
  brandSoft:   'rgba(99,102,241,0.12)',
  brandBorder: 'rgba(99,102,241,0.35)',
  success:     '#22C55E',
  danger:      '#EF4444',
  dangerSoft:  'rgba(239,68,68,0.12)',
  dangerBorder:'rgba(239,68,68,0.32)',
}

const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace"

/* ─────────────── helpers ─────────────── */
const initialsOf = (name?: string) => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '??'
}

/* ─────────────── nav config ─────────────── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/user/dashboard', icon: LayoutGrid },
      { name: 'Analytics', path: '/user/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { name: 'Start Campaign', path: '/user/start-campaign', icon: Send },
      { name: 'Campaign',       path: '/user/campaign',       icon: Megaphone },
      { name: 'Templates',      path: '/user/templates',      icon: FileStack },
      { name: 'Recipients',     path: '/user/recipients',     icon: Users },
      { name: 'Upload',         path: '/user/upload',         icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email Logs',     path: '/user/emaillogs',      icon: Mail },
      { name: 'Sender Account', path: '/user/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile',  path: '/user/profile',  icon: UserIcon },
      { name: 'Settings', path: '/user/settings', icon: SettingsIcon },
    ],
  },
]

/* ─────────────── nav item ─────────────── */
interface NavItemProps {
  path: string
  name: string
  icon: React.ElementType
  onClose?: () => void
}

const NavItem = ({ path, name, icon: Icon, onClose }: NavItemProps) => (
  <NavLink
    to={path}
    end
    onClick={onClose}
    className="group relative flex items-center gap-2.5 pl-2.5 pr-2 py-1.75 rounded-md text-[13px] font-medium transition-colors"
    style={({ isActive }) => ({
      background: isActive ? T.brandSoft : 'transparent',
      color: isActive ? T.text : T.textMuted,
    })}
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full transition-opacity"
          style={{ background: T.brand, opacity: isActive ? 1 : 0 }}
        />
        <span
          className="relative shrink-0 w-6.5 h-6.5 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: isActive ? 'rgba(99,102,241,0.18)' : T.surface,
            boxShadow: `inset 0 0 0 1px ${isActive ? T.brandBorder : T.borderSoft}`,
            color: isActive ? T.brand : T.textMuted,
          }}
        >
          <Icon size={13} strokeWidth={2} />
        </span>
        <span
          className="relative flex-1 truncate transition-colors"
          style={{ color: isActive ? T.text : undefined }}
        >
          {name}
        </span>
        {isActive && (
          <ChevronRight size={12} style={{ color: T.brand }} className="shrink-0" />
        )}
      </>
    )}
  </NavLink>
)

/* ─────────────── hooks ─────────────── */
const useEscape = (active: boolean, handler: () => void) => {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, handler])
}

const useClickOutside = <T extends HTMLElement>(active: boolean, handler: () => void) => {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active, handler])
  return ref
}

/* ─────────────── profile menu ─────────────── */
interface ProfileMenuProps {
  onClose: () => void
  user: User | null
  loadingUser: boolean
}

const ProfileMenu = ({ onClose, user, loadingUser }: ProfileMenuProps) => {
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEscape(true, onClose)

  const handleLogout = async () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true)
      setTimeout(() => setConfirmingLogout(false), 4000)
      return
    }
    try {
      setLoggingOut(true)
      await logoutUser()
    } catch (err) {
      console.warn('Logout request failed, clearing local session anyway:', err)
    } finally {
      setLoggingOut(false)
      onClose()
      navigate('/')
    }
  }

  const displayName = user?.username || 'Signed in'
  const displayEmail = user?.email || '—'
  const initials = initialsOf(user?.username)

  const menuItems: { label: string; icon: React.ElementType; onClick: () => void }[] = [
    { label: 'View profile',     icon: UserIcon, onClick: () => { onClose(); navigate('/user/profile') } },
    { label: 'Account settings', icon: UserCog,  onClick: () => { onClose(); navigate('/user/settings') } },
  ]

  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className="absolute left-2 right-2 bottom-full mb-2 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        background: T.surface,
        boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 48px -16px rgba(0,0,0,0.7)`,
        zIndex: 50,
        transformOrigin: 'bottom center',
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: T.borderSoft }}>
        <div className="flex items-center gap-2.5">
          <div
            className="relative shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: T.brand }} />
            ) : (
              <span className="text-[11.5px] font-semibold" style={{ color: T.brand, fontFamily: FONT_MONO }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: T.success, borderColor: T.surface }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>
              {loadingUser ? 'Loading…' : displayName}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT_MONO }}>
              {loadingUser ? '—' : displayEmail}
            </p>
          </div>
        </div>

        {user?.role && (
          <span
            className="mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
            style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            <Shield size={9} />
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
            className="group w-full flex items-center gap-2.5 rounded-md px-2 py-1.75 text-left text-[12.5px] transition-colors hover:bg-white/5"
            style={{ color: T.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted }}
          >
            <span
              className="shrink-0 w-6.5 h-6.5 rounded-md flex items-center justify-center"
              style={{ background: T.surfaceHi, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <Icon size={12} style={{ color: T.textFaint }} />
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
          className="w-full flex items-center gap-2.5 rounded-md px-2 py-1.75 text-left text-[12.5px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: confirmingLogout ? T.dangerSoft : 'transparent',
            color: T.danger,
            boxShadow: confirmingLogout ? `inset 0 0 0 1px ${T.dangerBorder}` : 'none',
          }}
          onMouseEnter={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = T.dangerSoft
          }}
          onMouseLeave={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = 'transparent'
          }}
        >
          <span
            className="shrink-0 w-6.5 h-6.5 rounded-md flex items-center justify-center"
            style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
          >
            {loggingOut ? (
              <Loader2 size={12} className="animate-spin" style={{ color: T.danger }} />
            ) : (
              <LogOut size={12} style={{ color: T.danger }} />
            )}
          </span>
          <span className="flex-1 truncate">
            {loggingOut ? 'Signing out…' : confirmingLogout ? 'Click again to confirm' : 'Log out'}
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─────────────── sidebar content ─────────────── */
const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const containerRef = useClickOutside<HTMLDivElement>(profileOpen, () => setProfileOpen(false))

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getProfile()
        if (!cancelled) setUser(data)
      } catch (err) {
        console.warn('Failed to load profile for sidebar:', err)
      } finally {
        if (!cancelled) setLoadingUser(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const displayName = user?.username ?? ''
  const displayEmail = user?.email ?? ''
  const initials = initialsOf(user?.username)

  return (
    <>
      {/* Brand row */}
      <div className="flex items-center gap-2.5 px-3.5 h-14 shrink-0 border-b" style={{ borderColor: T.borderSoft }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${T.brand}, #8B5CF6)`,
            boxShadow: '0 4px 12px -4px rgba(99,102,241,0.6)',
          }}
        >
          <span className="text-[13px] font-bold text-white">M</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight truncate" style={{ color: T.text }}>
            Outwerk Solutions
          </p>
          <p className="text-[10.5px] truncate" style={{ color: T.textFaint, fontFamily: FONT_MONO }}>
            mailforge · v1.4
          </p>
        </div>

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

      {/* Nav */}
      <nav className="sb-nav flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-2.5 mb-1.5">
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ color: T.textFaint, letterSpacing: '0.1em' }}
              >
                {group.label}
              </p>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Help link */}
      <div className="px-2 pb-1">
        <a
          href="https://docs.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 pl-2.5 pr-2 py-1.75 rounded-md text-[12.5px] font-medium transition-colors hover:bg-white/5"
          style={{ color: T.textMuted }}
        >
          <span
            className="shrink-0 w-6.5 h-6.5 rounded-md flex items-center justify-center"
            style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <HelpCircle size={13} style={{ color: T.textMuted }} />
          </span>
          <span className="flex-1 truncate">Help &amp; docs</span>
        </a>
      </div>

      {/* Footer / profile */}
      <div ref={containerRef} className="relative px-2 py-2.5 shrink-0 border-t" style={{ borderColor: T.borderSoft }}>
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
          className="group w-full flex items-center gap-2.5 px-2 py-1.75 rounded-md transition-colors text-left"
          style={{
            background: profileOpen ? T.surface : 'transparent',
            boxShadow: profileOpen ? `inset 0 0 0 1px ${T.border}` : 'inset 0 0 0 1px transparent',
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            {loadingUser ? (
              <Loader2 size={13} className="animate-spin" style={{ color: T.brand }} />
            ) : (
              <span className="text-[10.5px] font-semibold" style={{ color: T.brand, fontFamily: FONT_MONO }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: T.success, borderColor: T.panelTop }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser ? (
              <>
                <div className="h-2.5 w-24 rounded animate-pulse" style={{ background: T.surfaceHi }} />
                <div className="h-2 w-32 rounded animate-pulse mt-1.5" style={{ background: T.surfaceHi }} />
              </>
            ) : (
              <>
                <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>
                  {displayName || 'Signed in'}
                </p>
                <p
                  className="text-[10.5px] truncate mt-0.5"
                  style={{ color: T.textFaint, fontFamily: FONT_MONO }}
                >
                  {displayEmail || '—'}
                </p>
              </>
            )}
          </div>

          <ChevronRight
            size={13}
            className={`shrink-0 transition-transform ${profileOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
            style={{ color: profileOpen ? T.brand : T.textFaint }}
          />
        </button>
      </div>
    </>
  )
}

/* ─────────────── desktop sidebar ─────────────── */
interface SidebarProps {
  onClose?: () => void
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const isMobile = !!onClose

  return (
    <div
      className={`h-screen flex flex-col ${isMobile ? 'w-72' : 'w-64'}`}
      style={{
        background: `linear-gradient(180deg, ${T.panelTop} 0%, ${T.panel} 100%)`,
        borderRight: `1px solid ${T.borderSoft}`,
      }}
    >
      <style>{`
        .sb-nav::-webkit-scrollbar { width: 5px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .sb-nav::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.96); } to { transform: scale(1); } }
        .animate-in { animation-fill-mode: both; }
        .fade-in { animation: fadeIn 0.15s ease; }
        .zoom-in-95 { animation: zoomIn 0.15s ease; }
        @media (prefers-reduced-motion: reduce) { .fade-in, .zoom-in-95 { animation: none !important; } }
      `}</style>

      <SidebarContent onClose={onClose} />
    </div>
  )
}

/* ─────────────── mobile helpers ─────────────── */
export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-md transition-colors hover:bg-white/5"
    style={{ background: T.surface, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
    aria-label="Toggle menu"
  >
    <Menu size={18} />
  </button>
)

export const MobileOverlay = ({ onClick }: { onClick: () => void }) => (
  <div
    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
    onClick={onClick}
    style={{ animation: 'fadeIn 0.15s ease' }}
  />
)

export const MobileSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <>
      <MobileOverlay onClick={onClose} />
      <div
        className="fixed top-0 left-0 z-50 h-screen lg:hidden"
        style={{ animation: 'slideIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <Sidebar onClose={onClose} />
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .fade-in, .zoom-in-95 { animation: none !important; }
        }
      `}</style>
    </>
  )
}

/* ─────────────── wrapper ─────────────── */
const SidebarWithMobile = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        <Sidebar />
      </div>

      <div
        className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-3 py-2.5"
        style={{
          background: 'rgba(13,15,21,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${T.brand}, #8B5CF6)` }}
          >
            <span className="text-[10px] font-bold text-white">M</span>
          </div>
          <span className="text-[14px] font-semibold truncate" style={{ color: T.text }}>
            Outwerk Solutions
          </span>
        </div>
      </div>

      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  )
}

export default Sidebar
export { SidebarWithMobile }