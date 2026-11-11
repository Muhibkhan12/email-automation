import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Mail, FileStack,
  Settings as SettingsIcon, User as UserIcon, AtSign,
  Megaphone, UploadCloud, Users, ChevronRight, Menu, X,
  LogOut, Shield, UserCog, Send, HelpCircle,
} from 'lucide-react'
import { getProfile, logoutUser } from '../../services/AuthServices'
import type { User } from '../../types/UserTypes'

/* ─────────────── tokens ───────────────
   One graphite ramp. One phosphor accent. Amber/red reserved for warn/danger.
*/
const T = {
  bg:         '#0B0C0E',
  panel:      '#0E0F12',
  panelTop:   '#111214',
  surface:    '#16181B',
  surfaceHi:  '#1C1F23',
  border:     '#24282E',
  borderSoft: '#1B1E22',

  text:       '#E8EAED',
  textMuted:  '#9AA0A6',
  textFaint:  '#6B7075',

  accent:     '#6EE7A8',
  accentInk:  '#0B0C0E',
  accentLine: '#2E6B4D',

  ok:         '#6EE7A8',
  warn:       '#E0A64A',
  danger:     '#E06A6A',
}

const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace"

const HAIRLINE = `1px solid ${T.border}`
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`

/* ─────────────── helpers ─────────────── */
const initialsOf = (name?: string) => {
  if (!name) return '··'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '··'
}

/* ─────────────── nav config ─────────────── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/user/dashboard', icon: LayoutGrid },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { name: 'Start campaign', path: '/user/start-campaign', icon: Send },
      { name: 'Campaigns',      path: '/user/campaign',       icon: Megaphone },
      { name: 'Templates',      path: '/user/templates',      icon: FileStack },
      { name: 'Recipients',     path: '/user/recipients',     icon: Users },
      { name: 'Upload',         path: '/user/upload',         icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email logs',     path: '/user/emaillogs',      icon: Mail },
      { name: 'Sender account', path: '/user/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile',  path: '/user/profile',  icon: UserIcon },
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
    className="relative flex items-center gap-2.5 pl-3 pr-2.5 h-9 rounded-md text-[13px] font-medium transition-colors duration-[120ms]"
    style={({ isActive }) => ({
      background: isActive ? T.surfaceHi : 'transparent',
      color: isActive ? T.text : T.textMuted,
    })}
    onMouseEnter={(e) => {
      if (!e.currentTarget.getAttribute('aria-current')) {
        e.currentTarget.style.background = T.surface
      }
    }}
    onMouseLeave={(e) => {
      if (!e.currentTarget.getAttribute('aria-current')) {
        e.currentTarget.style.background = 'transparent'
      }
    }}
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full transition-opacity duration-[120ms]"
          style={{ background: T.accent, opacity: isActive ? 1 : 0 }}
        />
        <span
          className="relative shrink-0 w-6 h-6 rounded-[6px] flex items-center justify-center"
          style={{ color: isActive ? T.accent : T.textFaint }}
        >
          <Icon size={14} strokeWidth={1.5} />
        </span>
        <span className="relative flex-1 truncate" style={{ color: isActive ? T.text : undefined }}>
          {name}
        </span>
        {isActive && (
          <ChevronRight size={12} strokeWidth={1.5} style={{ color: T.textFaint }} className="shrink-0" />
        )}
      </>
    )}
  </NavLink>
)

/* ─────────────── hooks ─────────────── */
const useEscape = (active: boolean, handler: () => void) => {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, handler])
}

const useClickOutside = <E extends HTMLElement>(active: boolean, handler: () => void) => {
  const ref = useRef<E>(null)
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
      className="absolute left-2 right-2 bottom-full mb-2 rounded-[10px] overflow-hidden"
      style={{
        background: T.surface,
        border: HAIRLINE,
        boxShadow: '0 12px 32px -16px rgba(0,0,0,0.9)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="p-3" style={{ borderBottom: HAIRLINE_SOFT }}>
        <div className="flex items-center gap-2.5">
          <div
            className="relative shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: T.surfaceHi, border: HAIRLINE }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: T.text, fontFamily: FONT_MONO }}
            >
              {loadingUser ? '··' : initials}
            </span>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: T.accent, border: `2px solid ${T.surface}` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>
              {loadingUser ? 'Loading' : displayName}
            </p>
            <p
              className="text-[11px] truncate mt-0.5"
              style={{ color: T.textFaint, fontFamily: FONT_MONO }}
            >
              {loadingUser ? '—' : displayEmail}
            </p>
          </div>
        </div>

        {user?.role && (
          <span
            className="mt-2.5 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10.5px]"
            style={{ border: HAIRLINE, color: T.textMuted, fontFamily: FONT_MONO }}
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
            className="w-full flex items-center gap-2.5 rounded-md px-2 h-9 text-left text-[12.5px] transition-colors duration-[120ms]"
            style={{ color: T.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHi; e.currentTarget.style.color = T.text }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted }}
          >
            <Icon size={13} strokeWidth={1.5} style={{ color: T.textFaint }} />
            <span className="flex-1 truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="p-1.5 pt-0" style={{ borderTop: HAIRLINE_SOFT, marginTop: 4 }}>
        <button
          role="menuitem"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-md px-2 h-9 text-left text-[12.5px] font-medium transition-colors duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            color: T.danger,
            background: confirmingLogout ? T.surfaceHi : 'transparent',
            border: confirmingLogout ? HAIRLINE : '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = T.surfaceHi
          }}
          onMouseLeave={(e) => {
            if (!confirmingLogout) e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={13} strokeWidth={1.5} style={{ color: T.danger }} />
          <span className="flex-1 truncate">
            {loggingOut ? 'Signing out' : confirmingLogout ? 'Confirm log out' : 'Log out'}
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
      <div
        className="flex items-center gap-2.5 px-4 h-14 shrink-0"
        style={{ borderBottom: HAIRLINE_SOFT }}
      >
        <div
          className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
          style={{ background: T.surfaceHi, border: HAIRLINE }}
        >
          <span
            className="text-[12px] font-medium"
            style={{ color: T.accent, fontFamily: FONT_MONO }}
          >
            M
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>
            Outwerk Solutions
          </p>
          <p
            className="text-[10.5px] truncate mt-0.5"
            style={{ color: T.textFaint, fontFamily: FONT_MONO }}
          >
            mailforge · v1.4
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden shrink-0 p-1.5 rounded-md transition-colors duration-[120ms]"
            style={{ color: T.textMuted }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav — flat, divider-separated groups (no uppercase labels) */}
      <nav className="sb-nav flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && (
              <div className="my-2 mx-2" style={{ borderTop: HAIRLINE_SOFT }} />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — help + profile, one row area */}
      <div
        ref={containerRef}
        className="relative px-2 pt-2 pb-3 shrink-0"
        style={{ borderTop: HAIRLINE_SOFT }}
      >
        {profileOpen && (
          <ProfileMenu
            user={user}
            loadingUser={loadingUser}
            onClose={() => setProfileOpen(false)}
          />
        )}

        <a
          href="https://docs.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 pl-3 pr-2.5 h-8 rounded-md text-[12px] transition-colors duration-[120ms]"
          style={{ color: T.textFaint }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textMuted }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textFaint }}
        >
          <HelpCircle size={13} strokeWidth={1.5} />
          <span className="flex-1 truncate">Help and docs</span>
        </a>

        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="w-full flex items-center gap-2.5 px-2 h-11 mt-1 rounded-md transition-colors duration-[120ms] text-left"
          style={{
            background: profileOpen ? T.surfaceHi : 'transparent',
            border: profileOpen ? HAIRLINE : '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!profileOpen) e.currentTarget.style.background = T.surface
          }}
          onMouseLeave={(e) => {
            if (!profileOpen) e.currentTarget.style.background = 'transparent'
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: T.surfaceHi, border: HAIRLINE }}
          >
            {loadingUser ? (
              <span className="text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT_MONO }}>··</span>
            ) : (
              <span
                className="text-[10.5px] font-medium"
                style={{ color: T.text, fontFamily: FONT_MONO }}
              >
                {initials}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: T.accent, border: `2px solid ${T.panel}` }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser ? (
              <>
                <div className="h-2.5 w-24 rounded" style={{ background: T.surfaceHi }} />
                <div className="h-2 w-32 rounded mt-1.5" style={{ background: T.surfaceHi }} />
              </>
            ) : (
              <>
                <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
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
            strokeWidth={1.5}
            className="shrink-0"
            style={{
              color: T.textFaint,
              transform: profileOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform .12s ease-out',
            }}
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
        background: T.panel,
        borderRight: HAIRLINE_SOFT,
      }}
    >
      <style>{`
        .sb-nav::-webkit-scrollbar { width: 5px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .sb-nav::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        }
      `}</style>

      <SidebarContent onClose={onClose} />
    </div>
  )
}

/* ─────────────── mobile helpers ─────────────── */
export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-md transition-colors duration-[120ms]"
    style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
    aria-label="Toggle menu"
  >
    <Menu size={16} />
  </button>
)

export const MobileOverlay = ({ onClick }: { onClick: () => void }) => (
  <div
    className="lg:hidden fixed inset-0 z-40"
    style={{ background: 'rgba(11,12,14,0.72)' }}
    onClick={onClick}
  />
)

export const MobileSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <>
      <MobileOverlay onClick={onClose} />
      <div
        className="fixed top-0 left-0 z-50 h-screen lg:hidden"
        style={{ animation: 'sb-slide-in 0.2s ease-out' }}
      >
        <Sidebar onClose={onClose} />
      </div>
      <style>{`
        @keyframes sb-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; }
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
        style={{ background: T.panelTop, borderBottom: HAIRLINE_SOFT }}
      >
        <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
            style={{ background: T.surfaceHi, border: HAIRLINE }}
          >
            <span
              className="text-[10px] font-medium"
              style={{ color: T.accent, fontFamily: FONT_MONO }}
            >
              M
            </span>
          </div>
          <span className="text-[13px] font-medium truncate" style={{ color: T.text }}>
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