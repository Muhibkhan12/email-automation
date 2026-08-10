import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Send, List, PlusCircle, TrendingUp, Users, History,
  UploadCloud, FileCode, Mail, ScrollText, Activity, Loader, AlertTriangle,
  BarChart3, PieChart, FileBarChart, Bell, User, Settings, ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const C = {
  sidebar: '#11141B', sidebarHover: '#1B2030', sidebarActive: '#20263A',
  primary: '#2F6FED', mono: "'JetBrains Mono', monospace",
  display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif",
} as const;

interface NavChild { id: string; label: string; icon: LucideIcon; to?: string; }
interface NavItem { id: string; label: string; icon: LucideIcon; to?: string; children?: NavChild[]; }
interface NavRowProps {
  item: NavItem | NavChild;
  depth: 0 | 1;
  isActive: boolean;
  expanded: boolean;
  onToggle: (id: string) => void;
}

// Only routes that actually exist in AppRouter get a `to`.
// Everything else just expands/collapses until its page is built.
const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { id: 'campaigns', label: 'Campaigns', icon: Send, children: [
      { id: 'all-campaigns', label: 'All Campaigns', icon: List },
      { id: 'create-campaign', label: 'Create Campaign', icon: PlusCircle },
      { id: 'campaign-analytics', label: 'Campaign Analytics', icon: TrendingUp },
  ]},
  { id: 'recipients', label: 'Recipients', icon: Users, children: [
      { id: 'all-recipients', label: 'All Recipients', icon: Users },
      { id: 'import-history', label: 'Import History', icon: History },
  ]},
  { id: 'uploads', label: 'Uploads', icon: UploadCloud, children: [
      { id: 'upload-file', label: 'Upload File', icon: UploadCloud },
      { id: 'upload-history', label: 'Upload History', icon: History },
  ]},
  { id: 'templates', label: 'HTML Templates', icon: FileCode, children: [
      { id: 'all-templates', label: 'All Templates', icon: List },
      { id: 'create-template', label: 'Create Template', icon: PlusCircle },
  ]},
  { id: 'sender-accounts', label: 'Sender Accounts', icon: Mail, children: [
      { id: 'all-accounts', label: 'All Accounts', icon: List },
      { id: 'add-account', label: 'Add Account', icon: PlusCircle },
  ]},
  { id: 'email-logs', label: 'Email Logs', icon: ScrollText, to: '/emaillogs' },
  { id: 'queue-monitor', label: 'Queue Monitor', icon: Activity, children: [
      { id: 'active-tasks', label: 'Active Tasks', icon: Loader },
      { id: 'failed-tasks', label: 'Failed Tasks', icon: AlertTriangle },
  ]},
  { id: 'analytics', label: 'Analytics', icon: BarChart3, children: [
      { id: 'email-statistics', label: 'Email Statistics', icon: PieChart },
      { id: 'delivery-reports', label: 'Delivery Reports', icon: FileBarChart },
  ]},
  { id: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications' },
  { id: 'profile', label: 'Profile', icon: User, to: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function NavRow({ item, depth, isActive, expanded, onToggle }: NavRowProps) {
  const Icon = item.icon;
  const hasChildren = 'children' in item && !!item.children;

  const style: React.CSSProperties = {
    padding: depth === 0 ? '9px 12px' : '7px 12px 7px 34px',
    background: isActive ? C.sidebarActive : 'transparent',
    color: isActive ? '#FFFFFF' : depth === 0 ? '#C7CBD6' : '#9AA0AF',
    fontSize: depth === 0 ? 13.5 : 13,
    fontWeight: depth === 0 ? 500 : 400,
    fontFamily: C.body,
    textDecoration: 'none',
  };
  const hoverProps = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { if (!isActive) e.currentTarget.style.background = 'transparent'; },
  };

  const content = (
    <>
      <Icon size={depth === 0 ? 16 : 14} strokeWidth={2} />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
    </>
  );

  if (item.to) {
    return (
      <Link to={item.to} className="w-full flex items-center gap-2.5 rounded-lg transition-colors" style={style} {...hoverProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => hasChildren && onToggle(item.id)}
      className="w-full flex items-center gap-2.5 rounded-lg transition-colors"
      style={style}
      {...hoverProps}
    >
      {content}
    </button>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ campaigns: true });

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="h-full flex flex-col shrink-0" style={{ width: 258, background: C.sidebar, borderRight: `1px solid #1E2330` }}>
      <div className="flex items-center gap-2.5 px-5" style={{ height: 60, borderBottom: '1px solid #1E2330' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.primary }}>
          <Send size={15} color="#fff" />
        </div>
        <div className="leading-tight">
          <p style={{ fontFamily: C.display, color: '#fff', fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>MailForge</p>
          <p style={{ color: '#6E7383', fontSize: 10.5, fontFamily: C.mono }}>Email Automation</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const isActive = item.to ? location.pathname === item.to : false;
          return (
            <div key={item.id}>
              <NavRow item={item} depth={0} isActive={isActive} expanded={!!expanded[item.id]} onToggle={toggleSection} />
              {item.children && expanded[item.id] && (
                <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                  {item.children.map((child) => {
                    const childActive = child.to ? location.pathname === child.to : false;
                    return (
                      <NavRow key={child.id} item={child} depth={1} isActive={childActive} expanded={false} onToggle={() => {}} />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4" style={{ borderTop: '1px solid #1E2330' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: C.primary, color: '#fff', fontFamily: C.display }}>AR</div>
          <div className="leading-tight min-w-0">
            <p className="truncate" style={{ color: '#fff', fontSize: 12.5, fontWeight: 500 }}>Ayesha Raza</p>
            <p className="truncate" style={{ color: '#6E7383', fontSize: 11 }}>Workspace Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}