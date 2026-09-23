// AdminSidebar.tsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, Bell, Mail, FileText,
  Settings as SettingsIcon, Users, AtSign, ListOrdered,
  Megaphone, ChevronRight, ShieldCheck, Activity, X,
} from 'lucide-react'

/* ─────────────── tokens ─────────────── */

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  primaryRing: 'rgba(255,106,57,0.22)',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.12)',
  successRing: 'rgba(52,211,153,0.22)',
  dark: '#F2F0EB',
  bg: '#0B0E13',
  panel: '#0E131C',
  panelTop: '#10141D',
  surface: '#141821',
  border: '#1A1F2B',
  borderHover: '#232938',
  textMuted: '#7A8092',
  textBody: '#C7C9CE',
}

const FONT_MONO = "'JetBrains Mono', monospace"
const FONT_DISPLAY = "'Space Grotesk', sans-serif"

/* ─────────────── nav config ─────────────── */

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard',     path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Analytics',     path: '/admin/analytics', icon: BarChart3 },
      { name: 'System Health', path: '/admin/system',    icon: Activity },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Campaigns', path: '/admin/campaigns', icon: Megaphone, badge: 'Live' },
      { name: 'Users',     path: '/admin/users',     icon: Users },
      { name: 'Templates', path: '/admin/templates', icon: FileText },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'Email Logs',      path: '/admin/emaillogs',       icon: Mail },
      { name: 'Queue Monitor',   path: '/admin/queuemonitor',    icon: ListOrdered },
      { name: 'Sender Accounts', path: '/admin/senders-account', icon: AtSign },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Settings',      path: '/admin/settings',      icon: SettingsIcon },
    ],
  },
]

/* ─────────────── nav item ─────────────── */

interface NavItemProps {
  path: string
  name: string
  icon: React.ElementType
  badge?: string
  onClose?: () => void
}

const NavItem = ({ path, name, icon: Icon, badge, onClose }: NavItemProps) => (
  <NavLink
    to={path}
    end={path === '/admin'}
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

        {badge && (
          <span
            className="relative shrink-0 text-[10px] md:text-[10.5px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              background: COLOR.successSoft,
              color: COLOR.success,
              boxShadow: `inset 0 0 0 1px ${COLOR.successRing}`,
            }}
          >
            {badge}
          </span>
        )}

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

/* ─────────────── sidebar ─────────────── */

interface AdminSidebarProps {
  onClose?: () => void
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  return (
    <div
      className="w-64 md:w-64 h-screen flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${COLOR.panelTop} 0%, ${COLOR.panel} 100%)`,
        borderRight: `1px solid ${COLOR.border}`,
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.02)',
      }}
    >
      <style>{`
        .asb-nav::-webkit-scrollbar { width: 6px; }
        .asb-nav::-webkit-scrollbar-track { background: transparent; }
        .asb-nav::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; }
        .asb-nav::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }
      `}</style>

      {/* ── Brand row ────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 md:px-4 h-14 md:h-16 shrink-0 border-b" style={{ borderColor: COLOR.border }}>
        <div
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FF6A39, #FFC24B)',
            boxShadow: '0 8px 20px -8px rgba(255,106,57,0.6)',
          }}
        >
          <span className="text-[13px] md:text-sm font-bold" style={{ color: COLOR.bg }}>A</span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] md:text-[14.5px] font-semibold tracking-tight truncate"
            style={{ color: COLOR.dark, fontFamily: FONT_DISPLAY }}
          >
            MailForge Admin
          </p>
          <p
            className="text-[10px] md:text-[10.5px] truncate"
            style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}
          >
            console · v1.4
          </p>
        </div>

        <span
          className="shrink-0 text-[10px] md:text-[10.5px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: COLOR.primarySoft,
            color: COLOR.primary,
            boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
          }}
        >
          Admin
        </span>

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

      {/* ── Admin status card ───────────────── */}
      <div
        className="mx-3 md:mx-4 mt-3 md:mt-4 px-3 md:px-3.5 py-2.5 md:py-3 rounded-2xl shrink-0"
        style={{
          background: COLOR.primarySoft,
          boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,106,57,0.16)', boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
          >
            <ShieldCheck size={12} style={{ color: COLOR.primary }} />
          </div>
          <span
            className="text-[11px] md:text-xs font-semibold"
            style={{ color: COLOR.primary, fontFamily: FONT_DISPLAY }}
          >
            Super Admin
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-2.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] md:text-[10.5px]" style={{ color: COLOR.textBody, fontFamily: FONT_MONO }}>
              online
            </span>
          </span>
          <span className="text-[10px] md:text-[10.5px]" style={{ color: COLOR.border }}>·</span>
          <span className="text-[10px] md:text-[10.5px]" style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}>
            12.4k sent
          </span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────── */}
      <nav className="asb-nav flex-1 overflow-y-auto px-2 md:px-3 py-4 md:py-5 space-y-5 md:space-y-6">
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
                <NavItem
                  key={item.path}
                  {...item}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer account ───────────────────── */}
      <div className="px-2 md:px-3 py-3 md:py-4 shrink-0 border-t" style={{ borderColor: COLOR.border }}>
        <button
          type="button"
          className="group w-full flex items-center gap-2.5 md:gap-3 px-2 md:px-2.5 py-2 md:py-2.5 rounded-xl text-left transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLOR.surface
            e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${COLOR.borderHover}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
            style={{
              background: COLOR.primarySoft,
              boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
            }}
          >
            <span
              className="text-[10.5px] md:text-[11.5px] font-bold"
              style={{ color: COLOR.primary, fontFamily: FONT_MONO }}
            >
              SA
            </span>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: COLOR.success, borderColor: COLOR.panelTop, boxShadow: `0 0 8px ${COLOR.success}88` }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] md:text-[13px] font-semibold truncate"
              style={{ color: COLOR.dark, fontFamily: FONT_DISPLAY }}
            >
              Super Admin
            </p>
            <p
              className="text-[10px] md:text-[11px] truncate"
              style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}
            >
              admin@mailforge.io
            </p>
          </div>

          <ChevronRight
            size={14}
            className="shrink-0 transition-all group-hover:translate-x-0.5"
            style={{ color: COLOR.border }}
          />
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar