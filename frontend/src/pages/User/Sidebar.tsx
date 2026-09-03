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
  Menu,
  X,
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

// NOTE: all paths are ABSOLUTE (start with '/') so they resolve the same
// way no matter where <Sidebar /> is mounted in the route tree.
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
      { name: 'Campaign', path: '/user/campaign', icon: Megaphone },
      { name: 'Templates', path: '/user/templates', icon: FileStack },
      { name: 'Recipients', path: '/user/recipients', icon: Users },
      { name: 'Upload', path: '/user/upload', icon: UploadCloud },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Email Logs', path: '/user/emaillogs', icon: Mail },
      { name: 'Queue Monitor', path: '/user/queuemonitor', icon: ListOrdered },
      { name: 'Sender Account', path: '/user/sender-account', icon: AtSign },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Notifications', path: '/user/notifications', icon: Bell },
      { name: 'Profile', path: '/user/profile', icon: User },
      { name: 'Settings', path: '/user/settings', icon: SettingsIcon },
    ],
  },
]

interface SidebarProps {
  onClose?: () => void;
}

const NavItem = ({ path, name, icon: Icon, onClose }: { 
  path: string; 
  name: string; 
  icon: React.ElementType;
  onClose?: () => void;
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <NavLink
      to={path}
      end
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClose}
      className="relative flex items-center gap-2 md:gap-3 pl-2 md:pl-3 pr-2 md:pr-2.5 py-2 md:py-2.5 rounded-lg text-[12px] md:text-[13.5px] font-medium transition-all duration-150"
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 md:h-5 w-[2px] md:w-[3px] rounded-full transition-opacity"
            style={{ background: COLOR.primary, opacity: isActive ? 1 : 0 }}
          />
          <span
            className="absolute inset-0 rounded-lg transition-colors"
            style={{ background: isActive ? COLOR.primarySoft : hovered ? COLOR.surfaceHover : 'transparent' }}
          />
          <Icon
            size={15}
            className="md:w-[17px] md:h-[17px] relative shrink-0"
            strokeWidth={2}
            style={{ color: isActive ? COLOR.primary : hovered ? COLOR.textBody : COLOR.textMuted }}
          />
          <span
            className="relative flex-1 truncate"
            style={{ color: isActive ? COLOR.primary : hovered ? COLOR.dark : COLOR.textBody }}
          >
            {name}
          </span>
          {isActive && <ChevronRight size={12} className="md:w-[14px] md:h-[14px] relative shrink-0" style={{ color: COLOR.primary }} />}
        </>
      )}
    </NavLink>
  )
}

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2 md:gap-2.5 px-3 md:px-5 h-14 md:h-16 shrink-0 border-b border-[#2A2E37]">
        <div
          className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${COLOR.primary}, #FFC24B)` }}
        >
          <span className="text-xs md:text-sm font-bold" style={{ color: COLOR.bg }}>M</span>
        </div>
        <span className="font-semibold text-[13px] md:text-[15px] tracking-tight truncate" style={{ color: COLOR.dark }}>
          Outwerk Solutions
        </span>
        
        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-[#1B1E24] transition-colors text-[#C7C9CE]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-3 md:py-5 space-y-4 md:space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 md:px-3 mb-1.5 md:mb-2 text-[9px] md:text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLOR.textMuted }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / account */}
      <div className="px-2 md:px-3 py-3 md:py-4 shrink-0 border-t border-[#2A2E37]">
        <div className="mf-footer flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg cursor-pointer transition-colors">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: COLOR.primarySoft }}>
            <span className="text-[10px] md:text-xs font-semibold" style={{ color: COLOR.primary }}>AK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] md:text-[13px] font-medium truncate" style={{ color: COLOR.dark }}>Admin</p>
            <p className="text-[9px] md:text-[11.5px] truncate" style={{ color: COLOR.textMuted }}>admin@mailpanel.com</p>
          </div>
        </div>
      </div>
    </>
  )
}

const Sidebar = ({ onClose }: SidebarProps) => {
  // If onClose is provided, this is being used as a mobile slide-out
  // Otherwise, it's the desktop sidebar
  const isMobile = !!onClose;

  return (
    <div 
      className={`
        w-64 md:w-64 h-screen flex flex-col bg-[#12151B] border-r border-[#2A2E37]
        ${isMobile ? 'w-72' : 'w-64'}
      `}
    >
      <style>{`
        .mf-footer:hover { background: ${COLOR.surfaceHover}; }
        .mf-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .mf-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .mf-sidebar-scroll::-webkit-scrollbar-thumb { background: ${COLOR.border}; border-radius: 3px; }
        .mf-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: ${COLOR.border || '#3A3F4A'}; }
      `}</style>

      <SidebarContent onClose={onClose} />
    </div>
  )
}

// Mobile Hamburger Button Component
export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
    aria-label="Toggle menu"
  >
    <Menu size={20} />
  </button>
)

// Mobile Overlay Component
export const MobileOverlay = ({ onClick }: { onClick: () => void }) => (
  <div
    className="lg:hidden fixed inset-0 z-40 bg-black/70 animate-fadeIn"
    onClick={onClick}
    style={{
      animation: 'fadeIn 0.2s ease-in-out'
    }}
  />
)

// Mobile Sidebar Wrapper with Slide Animation
export const MobileSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <>
      <MobileOverlay onClick={onClose} />
      <div
        className="fixed top-0 left-0 z-50 h-screen animate-slideIn lg:hidden"
        style={{
          animation: 'slideIn 0.25s ease-out'
        }}
      >
        <Sidebar onClose={onClose} />
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn, .animate-slideIn {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}

// Main Sidebar export with mobile support
const SidebarWithMobile = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - always visible on large screens */}
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Menu Button - visible on small screens */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#12151B] border-b border-[#2A2E37] p-3 flex items-center gap-3">
        <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
        <span className="font-semibold text-[15px] text-[#E8E6E1]">Outwerk Solutions</span>
      </div>

      {/* Mobile Sidebar - slide in */}
      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  )
}

// For backward compatibility, export the Sidebar component
// Users can either use <Sidebar /> or <SidebarWithMobile />
export default Sidebar
export { SidebarWithMobile }