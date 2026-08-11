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

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutGrid },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { name: 'Campaign', path: '/campaign', icon: Megaphone },
      { name: 'Templates', path: '/templates', icon: FileStack },
      { name: 'Recipients', path: '/recipients', icon: Users },
      { name: 'Upload', path: '/upload', icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email Logs', path: '/emaillogs', icon: Mail },
      { name: 'Queue Monitor', path: '/queuemonitor', icon: ListOrdered },
      { name: 'Sender Account', path: '/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
]

const NavItem = ({ path, name, icon: Icon }: { path: string; name: string; icon: React.ElementType }) => (
  <NavLink
    to={path}
    end={path === '/'}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
        isActive
          ? 'bg-sky-50 text-sky-700'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-sky-600 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <Icon
          size={17}
          strokeWidth={2}
          className={isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'}
        />
        <span className="flex-1 truncate">{name}</span>
        {isActive && <ChevronRight size={14} className="text-sky-500 shrink-0" />}
      </>
    )}
  </NavLink>
)

const Sidebar = () => {
  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm shadow-sky-200">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <span className="text-slate-900 font-semibold text-[15px] tracking-tight">
          Outwerk Solutions
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
      <div className="px-3 py-4 shrink-0 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <span className="text-sky-700 text-xs font-semibold">AK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-800 truncate">Admin</p>
            <p className="text-[11.5px] text-slate-400 truncate">admin@mailpanel.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar