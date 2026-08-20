import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Mail,
  FileText,
  Settings as SettingsIcon,
  Users,
  AtSign,
  ListOrdered,
  Megaphone,
  Building2,
  ChevronRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Server,
} from 'lucide-react'

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  dark: '#E8E6E1',
  bg: '#0E1013',
  panel: '#12151B',
  surfaceHover: '#1B1E24',
  border: '#2A2E37',
  textMuted: '#8B8D94',
  textBody: '#C7C9CE',
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'System Health', path: '/admin/system', icon: Activity },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
      { name: 'Workspaces', path: '/admin/workspaces', icon: Building2 },
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Templates', path: '/admin/templates', icon: FileText },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'Email Logs', path: '/admin/emaillogs', icon: Mail },
      { name: 'Queue Monitor', path: '/admin/queuemonitor', icon: ListOrdered },
      { name: 'Sender Accounts', path: '/admin/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
    ],
  },
]

const NavItem = ({ path, name, icon: Icon, badge }: { path: string; name: string; icon: React.ElementType; badge?: string }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <NavLink
      to={path}
      end={path === '/admin'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150"
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full transition-opacity"
            style={{ background: COLOR.primary, opacity: isActive ? 1 : 0 }}
          />
          <span
            className="absolute inset-0 rounded-lg transition-colors"
            style={{ background: isActive ? COLOR.primarySoft : hovered ? COLOR.surfaceHover : 'transparent' }}
          />
          <Icon
            size={17}
            strokeWidth={2}
            className="relative"
            style={{ color: isActive ? COLOR.primary : hovered ? COLOR.textBody : COLOR.textMuted }}
          />
          <span
            className="relative flex-1 truncate"
            style={{ color: isActive ? COLOR.primary : hovered ? COLOR.dark : COLOR.textBody }}
          >
            {name}
          </span>
          {badge && (
            <span className="relative shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,217,138,0.15)', color: '#7FD98A' }}>
              {badge}
            </span>
          )}
          {isActive && <ChevronRight size={14} className="relative shrink-0" style={{ color: COLOR.primary }} />}
        </>
      )}
    </NavLink>
  )
}

const AdminSidebar = () => {
  return (
    <div className="w-64 h-screen flex flex-col" style={{ background: COLOR.panel, borderRight: `1px solid ${COLOR.border}` }}>
      <style>{`
        .mf-footer:hover { background: ${COLOR.surfaceHover}; }
      `}</style>

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${COLOR.primary}, #FFC24B)` }}
        >
          <span className="text-sm font-bold" style={{ color: COLOR.bg }}>A</span>
        </div>
        <span className="font-semibold text-[15px] tracking-tight" style={{ color: COLOR.dark }}>
          MailForge Admin
        </span>
        <span
          className="ml-auto text-[9px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: COLOR.primarySoft, color: COLOR.primary }}
        >
          Admin
        </span>
      </div>

      {/* Admin Status */}
      <div className="mx-4 mt-4 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,106,57,0.05)', border: `1px solid ${COLOR.primarySoft}` }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: COLOR.primary }} />
          <span className="text-xs font-medium" style={{ color: COLOR.primary }}>Super Admin</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px]" style={{ color: COLOR.textMuted }}>System Online</span>
          </div>
          <span className="text-[10px]" style={{ color: COLOR.textMuted }}>•</span>
          <span className="text-[10px]" style={{ color: COLOR.textMuted }}>12.4k sent</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLOR.textMuted }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem 
                  key={item.path} 
                  {...item} 
                  badge={item.name === 'Campaigns' ? 'Live' : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / account */}
      <div className="px-3 py-4 shrink-0" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <div className="mf-footer flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: COLOR.primarySoft }}>
            <span className="text-xs font-semibold" style={{ color: COLOR.primary }}>SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: COLOR.dark }}>Super Admin</p>
            <p className="text-[11.5px] truncate" style={{ color: COLOR.textMuted }}>admin@mailforge.io</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar