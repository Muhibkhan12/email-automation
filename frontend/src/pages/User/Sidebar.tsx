import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  BarChart3,
  Bell,
  Mail,
  FileStack,
  Settings as SettingsIcon,
  User,
  AtSign,
  ListOrdered,
  Megaphone,
  UploadCloud,
  Users,
  ChevronRight,
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
      { name: 'Dashboard', path: '/user/dashboard', icon: LayoutGrid },
      { name: 'Analytics', path: 'user/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { name: 'Campaign', path: 'user/campaign', icon: Megaphone },
      { name: 'Templates', path: 'user/templates', icon: FileStack },
      { name: 'Recipients', path: 'user/recipients', icon: Users },
      { name: 'Upload', path: 'user/upload', icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email Logs', path: 'user/emaillogs', icon: Mail },
      { name: 'Queue Monitor', path: 'user/queuemonitor', icon: ListOrdered },
      { name: 'Sender Account', path: 'user/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Notifications', path: 'user/notifications', icon: Bell },
      { name: 'Profile', path: 'user/profile', icon: User },
      { name: 'Settings', path: 'user/settings', icon: SettingsIcon },
    ],
  },
]

const NavItem = ({ path, name, icon: Icon }: { path: string; name: string; icon: React.ElementType }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <NavLink
      to={path}
      end={path === '/'}
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
          {isActive && <ChevronRight size={14} className="relative shrink-0" style={{ color: COLOR.primary }} />}
        </>
      )}
    </NavLink>
  )
}

const Sidebar = () => {
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
          <span className="text-sm font-bold" style={{ color: COLOR.bg }}>M</span>
        </div>
        <span className="font-semibold text-[15px] tracking-tight" style={{ color: COLOR.dark }}>
          Outwerk Solutions
        </span>
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
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / account */}
      <div className="px-3 py-4 shrink-0" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <div className="mf-footer flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: COLOR.primarySoft }}>
            <span className="text-xs font-semibold" style={{ color: COLOR.primary }}>AK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: COLOR.dark }}>Admin</p>
            <p className="text-[11.5px] truncate" style={{ color: COLOR.textMuted }}>admin@mailpanel.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar