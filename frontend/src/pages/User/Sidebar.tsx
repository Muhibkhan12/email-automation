import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, BarChart3, Bell, Mail, FileStack,
  Settings as SettingsIcon, User as UserIcon, AtSign, ListOrdered,
  Megaphone, UploadCloud, Users, ChevronRight, Menu, X, Sparkles,
  LogOut, Shield, UserCog, Loader2,
} from 'lucide-react'
import { getProfile, logoutUser } from '../../services/AuthServices'
import type { User } from '../../types/UserTypes'

/* ─────────────── tokens ─────────────── */

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  primaryRing: 'rgba(255,106,57,0.22)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.10)',
  dangerRing: 'rgba(248,113,113,0.22)',
  success: '#34D399',
  dark: '#F2F0EB',
  bg: '#0B0E13',
  panel: '#0E131C',
  panelTop: '#10141D',
  surface: '#141821',
  surfaceHover: '#151A24',
  inner: '#0F131C',
  border: '#1A1F2B',
  borderHover: '#232938',
  textMuted: '#7A8092',
  textBody: '#C7C9CE',
}

const FONT_MONO = "'JetBrains Mono', monospace"
const FONT_DISPLAY = "'Space Grotesk', sans-serif"

/* ─────────────── helpers ─────────────── */

const initialsOf = (name?: string) => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '??'
}

/* ─────────────── nav config (unchanged) ─────────────── */

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
      { name: 'Campaign',   path: '/user/campaign',   icon: Megaphone },
      { name: 'Templates',  path: '/user/templates',  icon: FileStack },
      { name: 'Recipients', path: '/user/recipients', icon: Users },
      { name: 'Upload',     path: '/user/upload',     icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email Logs',     path: '/user/emaillogs',      icon: Mail },
      { name: 'Queue Monitor',  path: '/user/queuemonitor',   icon: ListOrdered },
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
    className="group relative flex items-center gap-2.5 md:gap-3 pl-3 md:pl-3.5 pr-2.5 py-2 md:py-2.5 rounded-xl text-[12.5px] md:text-[13.5px] font-medium transition-all duration-150 hover:translate-x-0.5"
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 md:h-5 w-[3px] rounded-full transition-all duration-200"
          style={{
            background: COLOR.primary,
            opacity: isActive ? 1 : 0,
            boxShadow: isActive ? `0 0 10px ${COLOR.primary}88` : 'none',
          }}
        />
        <span
          aria-hidden
          className={`absolute inset-0 rounded-xl transition-colors ${
            isActive
              ? 'bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/25'
              : 'ring-1 ring-transparent group-hover:bg-[#141821] group-hover:ring-[#232938]'
          }`}
        />
        <span
          className={`relative shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isActive
              ? 'bg-[#FF6A39]/15 ring-1 ring-[#FF6A39]/25'
              : 'bg-[#141821] ring-1 ring-[#1A1F2B] group-hover:ring-[#232938]'
          }`}
        >
          <Icon
            size={14}
            className="md:w-[15px] md:h-[15px]"
            strokeWidth={2}
            style={{ color: isActive ? COLOR.primary : COLOR.textMuted }}
          />
        </span>
        <span
          className={`relative flex-1 truncate transition-colors ${
            isActive ? 'text-[#F2F0EB]' : 'text-[#C7C9CE] group-hover:text-[#F2F0EB]'
          }`}
        >
          {name}
        </span>
        {isActive && (
          <ChevronRight
            size={13}
            className="relative shrink-0 md:w-[14px] md:h-[14px]"
            style={{ color: COLOR.primary }}
          />
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
  compact?: boolean
}

const ProfileMenu = ({ onClose, user, loadingUser, compact }: ProfileMenuProps) => {
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

  const wrapperCls = compact
    ? 'absolute left-2 right-2 bottom-full mb-2'
    : 'absolute left-2 right-2 bottom-full mb-2 md:left-2 md:right-2'

  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className={`${wrapperCls} rounded-2xl overflow-hidden float-in`}
      style={{
        background: '#141821',
        boxShadow: 'inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.8)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: COLOR.border }}>
        <div className="flex items-center gap-3">
          <div
            className="relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
          >
            {loadingUser ? (
              <Loader2 size={16} className="animate-spin" style={{ color: COLOR.primary }} />
            ) : (
              <span className="text-[12px] font-bold" style={{ color: COLOR.primary, fontFamily: FONT_MONO }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: COLOR.success, borderColor: '#141821', boxShadow: `0 0 8px ${COLOR.success}88` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: COLOR.dark, fontFamily: FONT_DISPLAY }}>
              {loadingUser ? 'Loading…' : displayName}
            </p>
            <p className="text-[11px] truncate" style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}>
              {loadingUser ? '—' : displayEmail}
            </p>
          </div>
        </div>

        {user?.role && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
            style={{ background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
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
            className="group w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition-colors"
            style={{ color: COLOR.textBody }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLOR.surface
              e.currentTarget.style.color = COLOR.dark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = COLOR.textBody
            }}
          >
            <span
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: COLOR.inner, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
            >
              <Icon size={13} style={{ color: COLOR.textMuted }} />
            </span>
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight
              size={13}
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: COLOR.border }}
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
          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: confirmingLogout ? COLOR.dangerSoft : 'transparent',
            color: COLOR.danger,
            boxShadow: confirmingLogout ? `inset 0 0 0 1px ${COLOR.dangerRing}` : 'none',
          }}
          onMouseEnter={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = COLOR.dangerSoft
          }}
          onMouseLeave={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = 'transparent'
          }}
        >
          <span
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: COLOR.dangerSoft, boxShadow: `inset 0 0 0 1px ${COLOR.dangerRing}` }}
          >
            {loggingOut ? (
              <Loader2 size={13} className="animate-spin" style={{ color: COLOR.danger }} />
            ) : (
              <LogOut size={13} style={{ color: COLOR.danger }} />
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
  const isMobile = !!onClose
  const [profileOpen, setProfileOpen] = useState(false)
  const containerRef = useClickOutside<HTMLDivElement>(profileOpen, () => setProfileOpen(false))

  /* ── Load the real user once, at the sidebar level ── */
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
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = user?.username ?? ''
  const displayEmail = user?.email ?? ''
  const initials = initialsOf(user?.username)

  return (
    <>
      {/* ── Brand row ─────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 md:px-4 h-14 md:h-16 shrink-0 border-b border-[#1A1F2B]">
        <div
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FF6A39, #FFC24B)',
            boxShadow: '0 8px 20px -8px rgba(255,106,57,0.6)',
          }}
        >
          <span className="text-[13px] md:text-sm font-bold" style={{ color: COLOR.bg }}>M</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] md:text-[14.5px] font-semibold tracking-tight truncate" style={{ color: COLOR.dark }}>
            Outwerk Solutions
          </p>
          <p className="text-[10px] md:text-[10.5px] truncate" style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}>
            mailforge · v1.4
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden shrink-0 p-1.5 rounded-lg transition-colors"
            style={{ color: COLOR.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = COLOR.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────── */}
      <nav className="sb-nav flex-1 overflow-y-auto px-2 md:px-3 py-4 md:py-5 space-y-5 md:space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-3 mb-2">
              <p
                className="text-[9.5px] md:text-[10px] font-semibold uppercase"
                style={{ color: COLOR.textMuted, letterSpacing: '0.12em' }}
              >
                {group.label}
              </p>
              <span className="flex-1 h-px" style={{ background: COLOR.border }} />
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer / profile ──────────────────────── */}
      <div ref={containerRef} className="relative px-2 md:px-3 py-3 md:py-4 shrink-0 border-t border-[#1A1F2B]">
        {profileOpen && (
          <ProfileMenu
            user={user}
            loadingUser={loadingUser}
            compact={isMobile}
            onClose={() => setProfileOpen(false)}
          />
        )}

        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="group w-full flex items-center gap-2.5 md:gap-3 px-2 md:px-2.5 py-2 md:py-2.5 rounded-xl transition-colors text-left"
          style={{
            background: profileOpen ? COLOR.surface : 'transparent',
            boxShadow: profileOpen
              ? `inset 0 0 0 1px ${COLOR.borderHover}`
              : 'inset 0 0 0 1px transparent',
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
            style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
          >
            {loadingUser ? (
              <Loader2 size={14} className="animate-spin" style={{ color: COLOR.primary }} />
            ) : (
              <span className="text-[10.5px] md:text-[11.5px] font-bold" style={{ color: COLOR.primary, fontFamily: FONT_MONO }}>
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: COLOR.success, borderColor: COLOR.panelTop, boxShadow: `0 0 8px ${COLOR.success}88` }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser ? (
              <>
                <div className="h-[10px] w-24 rounded bg-[#1A1F2B] animate-pulse" />
                <div className="h-[9px] w-32 rounded bg-[#1A1F2B] animate-pulse mt-1.5" />
              </>
            ) : (
              <>
                <p className="text-[12px] md:text-[13px] font-semibold truncate" style={{ color: COLOR.dark }}>
                  {displayName || 'Signed in'}
                </p>
                <p
                  className="text-[10px] md:text-[11px] truncate"
                  style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}
                >
                  {displayEmail || '—'}
                </p>
              </>
            )}
          </div>

          <ChevronRight
            size={14}
            className={`shrink-0 transition-all ${profileOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
            style={{ color: profileOpen ? COLOR.primary : COLOR.border }}
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
      className={`h-screen flex flex-col ${isMobile ? 'w-72' : 'w-64 md:w-64'}`}
      style={{
        background: `linear-gradient(180deg, ${COLOR.panelTop} 0%, ${COLOR.panel} 100%)`,
        borderRight: `1px solid ${COLOR.border}`,
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.02)',
      }}
    >
      <style>{`
        .sb-nav::-webkit-scrollbar { width: 6px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; }
        .sb-nav::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>

      <SidebarContent onClose={onClose} />
    </div>
  )
}

/* ─────────────── mobile helpers (unchanged API) ─────────────── */

export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-xl bg-[#141821] text-[#C7C9CE] hover:text-[#E8E6E1] transition-colors"
    style={{ boxShadow: 'inset 0 0 0 1px #1A1F2B' }}
    aria-label="Toggle menu"
  >
    <Menu size={18} />
  </button>
)

export const MobileOverlay = ({ onClick }: { onClick: () => void }) => (
  <div
    className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
    onClick={onClick}
    style={{ animation: 'fadeIn 0.2s ease-in-out' }}
  />
)

export const MobileSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <>
      <MobileOverlay onClick={onClose} />
      <div
        className="fixed top-0 left-0 z-50 h-screen lg:hidden"
        style={{ animation: 'slideIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <Sidebar onClose={onClose} />
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn, .animate-slideIn { animation: none !important; }
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
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>

      <div
        className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-3 py-2.5"
        style={{
          background: 'rgba(14,19,28,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${COLOR.border}`,
        }}
      >
        <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF6A39, #FFC24B)' }}
          >
            <span className="text-[10px] font-bold" style={{ color: COLOR.bg }}>M</span>
          </div>
          <span className="text-[14px] font-semibold truncate" style={{ color: COLOR.dark }}>
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