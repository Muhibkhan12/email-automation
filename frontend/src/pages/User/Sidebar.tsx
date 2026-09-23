import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, BarChart3, Bell, Mail, FileStack,
  Settings as SettingsIcon, User, AtSign, ListOrdered, Megaphone,
  UploadCloud, Users, ChevronRight, Menu, X, Sparkles,
} from 'lucide-react'

/* ─────────────── tokens ─────────────── */

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  primaryRing: 'rgba(255,106,57,0.22)',
  dark: '#F2F0EB',
  bg: '#0B0E13',
  panel: '#0E131C',
  panelTop: '#10141D',
  surface: '#141821',
  surfaceHover: '#151A24',
  border: '#1A1F2B',
  borderHover: '#232938',
  textMuted: '#7A8092',
  textBody: '#C7C9CE',
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
      { name: 'Profile',  path: '/user/profile',  icon: User },
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
        {/* Active rail */}
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 md:h-5 w-[3px] rounded-full transition-all duration-200"
          style={{
            background: COLOR.primary,
            opacity: isActive ? 1 : 0,
            boxShadow: isActive ? `0 0 10px ${COLOR.primary}88` : 'none',
          }}
        />

        {/* Background plate */}
        <span
          aria-hidden
          className={`absolute inset-0 rounded-xl transition-colors ${
            isActive
              ? 'bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/25'
              : 'ring-1 ring-transparent group-hover:bg-[#141821] group-hover:ring-[#232938]'
          }`}
        />

        {/* Icon plate */}
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

/* ─────────────── content ─────────────── */

const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
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
        <p className="text-[10px] md:text-[10.5px] truncate" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
          mailforge · v1.4
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden shrink-0 p-1.5 rounded-lg text-[#7A8092] hover:text-[#E8E6E1] hover:bg-[#141821] transition-colors"
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

    {/* ── Footer / account ──────────────────────── */}
    <div className="px-2 md:px-3 py-3 md:py-4 shrink-0 border-t border-[#1A1F2B]">
      <button className="group w-full flex items-center gap-2.5 md:gap-3 px-2 md:px-2.5 py-2 md:py-2.5 rounded-xl hover:bg-[#141821] ring-1 ring-transparent hover:ring-[#232938] transition-colors text-left">
        <div
          className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
          style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
        >
          <span className="text-[10.5px] md:text-[11.5px] font-bold" style={{ color: COLOR.primary }}>
            AK
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#34D399', borderColor: COLOR.panelTop, boxShadow: '0 0 8px #34D39988' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] md:text-[13px] font-semibold truncate" style={{ color: COLOR.dark }}>
            Admin
          </p>
          <p
            className="text-[10px] md:text-[11px] truncate"
            style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
          >
            admin@mailpanel.com
          </p>
        </div>

        <ChevronRight
          size={14}
          className="shrink-0 text-[#3A404F] group-hover:text-[#FF6A39] group-hover:translate-x-0.5 transition-all"
        />
      </button>
    </div>
  </>
)

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
      {/* Desktop */}
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
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