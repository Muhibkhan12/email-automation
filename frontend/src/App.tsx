import React, { useState } from 'react';
import {
  LayoutDashboard, Send, List, PlusCircle, TrendingUp, Users, History,
  UploadCloud, FileCode, Mail, ScrollText, Activity, Loader, AlertTriangle,
  BarChart3, PieChart, FileBarChart, Bell, User, Settings, ChevronDown,
  ChevronRight, Search, MailOpen, MousePointerClick, ArrowUpRight,
  ArrowDownRight, CircleDot, Menu, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ---- Design tokens ---------------------------------------------------
const C = {
  bg: '#F4F5F8',
  surface: '#FFFFFF',
  sidebar: '#11141B',
  sidebarHover: '#1B2030',
  sidebarActive: '#20263A',
  primary: '#2F6FED',
  primarySoft: '#EAF0FE',
  success: '#1FA971',
  successSoft: '#E7F7F0',
  warning: '#E8A23D',
  warningSoft: '#FCF1DF',
  danger: '#E5484D',
  dangerSoft: '#FCE8E9',
  text: '#12151C',
  textSoft: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E7E9EE',
  mono: "'JetBrains Mono', monospace",
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

// ---- Nav structure -----------------------------------------------------
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'campaigns', label: 'Campaigns', icon: Send,
    children: [
      { id: 'all-campaigns', label: 'All Campaigns', icon: List },
      { id: 'create-campaign', label: 'Create Campaign', icon: PlusCircle },
      { id: 'campaign-analytics', label: 'Campaign Analytics', icon: TrendingUp },
    ],
  },
  {
    id: 'recipients', label: 'Recipients', icon: Users,
    children: [
      { id: 'all-recipients', label: 'All Recipients', icon: Users },
      { id: 'import-history', label: 'Import History', icon: History },
    ],
  },
  {
    id: 'uploads', label: 'Uploads', icon: UploadCloud,
    children: [
      { id: 'upload-file', label: 'Upload File', icon: UploadCloud },
      { id: 'upload-history', label: 'Upload History', icon: History },
    ],
  },
  {
    id: 'templates', label: 'HTML Templates', icon: FileCode,
    children: [
      { id: 'all-templates', label: 'All Templates', icon: List },
      { id: 'create-template', label: 'Create Template', icon: PlusCircle },
    ],
  },
  {
    id: 'sender-accounts', label: 'Sender Accounts', icon: Mail,
    children: [
      { id: 'all-accounts', label: 'All Accounts', icon: List },
      { id: 'add-account', label: 'Add Account', icon: PlusCircle },
    ],
  },
  { id: 'email-logs', label: 'Email Logs', icon: ScrollText },
  {
    id: 'queue-monitor', label: 'Queue Monitor', icon: Activity,
    children: [
      { id: 'active-tasks', label: 'Active Tasks', icon: Loader },
      { id: 'failed-tasks', label: 'Failed Tasks', icon: AlertTriangle },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', icon: BarChart3,
    children: [
      { id: 'email-statistics', label: 'Email Statistics', icon: PieChart },
      { id: 'delivery-reports', label: 'Delivery Reports', icon: FileBarChart },
    ],
  },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function findLabel(id) {
  for (const item of NAV) {
    if (item.id === id) return { label: item.label, parent: null };
    if (item.children) {
      const hit = item.children.find((c) => c.id === id);
      if (hit) return { label: hit.label, parent: item.label };
    }
  }
  return { label: 'Dashboard', parent: null };
}

// ---- Mock data -----------------------------------------------------
const deliveryData = [
  { day: 'Jul 24', sent: 3200 }, { day: 'Jul 25', sent: 4100 },
  { day: 'Jul 26', sent: 3800 }, { day: 'Jul 27', sent: 5200 },
  { day: 'Jul 28', sent: 4700 }, { day: 'Jul 29', sent: 6100 },
  { day: 'Jul 30', sent: 5800 }, { day: 'Jul 31', sent: 7200 },
  { day: 'Aug 1', sent: 6900 }, { day: 'Aug 2', sent: 8100 },
  { day: 'Aug 3', sent: 7600 }, { day: 'Aug 4', sent: 8800 },
  { day: 'Aug 5', sent: 9400 }, { day: 'Aug 6', sent: 6300 },
];

const pulseEvents = [
  { status: 'success', text: "'Q3 Product Launch' — 1,204 delivered" },
  { status: 'pending', text: "'Weekly Digest #38' — sending, 640 of 2,100" },
  { status: 'success', text: "SMTP account relay-02 verified" },
  { status: 'failed', text: "'Winback Sequence' — 12 bounced, retrying" },
  { status: 'pending', text: "Import job 'contacts_aug.csv' — parsing" },
];

const campaigns = [
  { name: 'Q3 Product Launch', status: 'Delivered', recipients: 12480, open: '48.2%', date: 'Aug 5, 2026' },
  { name: 'Weekly Digest #38', status: 'Sending', recipients: 2100, open: '—', date: 'Aug 6, 2026' },
  { name: 'Winback Sequence', status: 'Failed', recipients: 3020, open: '11.4%', date: 'Aug 4, 2026' },
  { name: 'Onboarding Day 3', status: 'Delivered', recipients: 890, open: '61.7%', date: 'Aug 3, 2026' },
  { name: 'Beta Feedback Ask', status: 'Scheduled', recipients: 540, open: '—', date: 'Aug 7, 2026' },
];

const statusStyle = (status) => {
  switch (status) {
    case 'Delivered': return { bg: C.successSoft, fg: C.success };
    case 'Sending': return { bg: C.primarySoft, fg: C.primary };
    case 'Failed': return { bg: C.dangerSoft, fg: C.danger };
    case 'Scheduled': return { bg: C.warningSoft, fg: '#B4740E' };
    default: return { bg: '#F0F0F2', fg: C.textSoft };
  }
};

const dotColor = (status) => (
  status === 'success' ? C.success : status === 'failed' ? C.danger : C.warning
);

// ---- Small UI pieces -----------------------------------------------------
function StatCard({ icon: Icon, label, value, delta, positive, accent }) {
  return (
    <div
      className="flex-1 min-w-[160px] rounded-xl p-4 sm:p-5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: accent + '1A' }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        <span
          className="flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{
            color: positive ? C.success : C.danger,
            background: positive ? C.successSoft : C.dangerSoft,
          }}
        >
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </span>
      </div>
      <p style={{ fontFamily: C.mono, color: C.text }} className="text-xl sm:text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p style={{ color: C.textSoft }} className="text-sm mt-1">{label}</p>
    </div>
  );
}

function NavRow({ item, depth, active, expanded, onToggle, onSelect }) {
  const Icon = item.icon;
  const hasChildren = !!item.children;
  const isActive = active === item.id;

  return (
    <button
      onClick={() => (hasChildren ? onToggle(item.id) : onSelect(item.id))}
      className="w-full flex items-center gap-2.5 rounded-lg transition-colors"
      style={{
        padding: depth === 0 ? '9px 12px' : '7px 12px 7px 34px',
        background: isActive ? C.sidebarActive : 'transparent',
        color: isActive ? '#FFFFFF' : depth === 0 ? '#C7CBD6' : '#9AA0AF',
        fontSize: depth === 0 ? 13.5 : 13,
        fontWeight: depth === 0 ? 500 : 400,
        fontFamily: C.body,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={depth === 0 ? 16 : 14} strokeWidth={2} />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {hasChildren && (
        expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
      )}
    </button>
  );
}

// ---- Main app -----------------------------------------------------
export default function App() {
  const [active, setActive] = useState('dashboard');
  const [expanded, setExpanded] = useState({ campaigns: true });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    const item = NAV.find((n) => n.id === id);
    if (!item.children) {
      setActive(id);
      setMobileNavOpen(false);
    }
  };

  const selectItem = (id) => {
    setActive(id);
    setMobileNavOpen(false);
  };

  const { label: pageLabel, parent: pageParent } = findLabel(active);

  const SidebarContent = (
    <>
      <div
        className="flex items-center justify-between gap-2.5 px-5 shrink-0"
        style={{ height: 60, borderBottom: '1px solid #1E2330' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: C.primary }}
          >
            <Send size={15} color="#fff" />
          </div>
          <div className="leading-tight min-w-0">
            <p style={{ fontFamily: C.display, color: '#fff', fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
              MailForge
            </p>
            <p style={{ color: '#6E7383', fontSize: 10.5, fontFamily: C.mono }}>Email Automation</p>
          </div>
        </div>
        <button
          className="lg:hidden shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ color: '#9AA0AF' }}
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {NAV.map((item) => (
          <div key={item.id}>
            <NavRow
              item={item}
              depth={0}
              active={active}
              expanded={!!expanded[item.id]}
              onToggle={toggleSection}
              onSelect={selectItem}
            />
            {item.children && expanded[item.id] && (
              <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                {item.children.map((child) => (
                  <NavRow
                    key={child.id}
                    item={child}
                    depth={1}
                    active={active}
                    expanded={false}
                    onToggle={() => {}}
                    onSelect={selectItem}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid #1E2330' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: C.primary, color: '#fff', fontFamily: C.display }}
          >
            AR
          </div>
          <div className="leading-tight min-w-0">
            <p className="truncate" style={{ color: '#fff', fontSize: 12.5, fontWeight: 500 }}>Ayesha Khan</p>
            <p className="truncate" style={{ color: '#6E7383', fontSize: 11 }}>Workspace Admin</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="h-screen w-full flex overflow-hidden relative"
      style={{ background: C.bg, fontFamily: C.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D8DBE2; border-radius: 8px; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      `}</style>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(10,12,18,0.5)' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar — static column on lg+, slide-in drawer below lg */}
      <aside
        className="h-full flex flex-col shrink-0 fixed lg:static top-0 left-0 z-40 transition-transform duration-200 ease-out"
        style={{
          width: 258,
          background: C.sidebar,
          borderRight: '1px solid #1E2330',
          transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {SidebarContent}
      </aside>
      {/* Reserve space on large screens without duplicating the fixed transform logic */}
      <style>{`
        @media (min-width: 1024px) {
          aside { transform: none !important; position: static !important; }
        }
      `}</style>

      {/* Main */}
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3"
          style={{ height: 60, background: C.bg + 'F2', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={16} color={C.textSoft} />
            </button>
            <div className="leading-tight min-w-0">
              <p style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11 }} className="truncate">
                {pageParent ? `${pageParent} /` : 'Menu /'}
              </p>
              <p style={{ fontFamily: C.display, color: C.text, fontSize: 15.5, fontWeight: 600 }} className="truncate">
                {pageLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className="hidden md:flex items-center gap-2 px-3 rounded-lg"
              style={{ background: C.surface, border: `1px solid ${C.border}`, height: 36, width: 240 }}
            >
              <Search size={14} color={C.textFaint} />
              <input
                placeholder="Search campaigns, contacts…"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: C.text }}
              />
            </div>
            <button
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Toggle search"
            >
              <Search size={16} color={C.textSoft} />
            </button>
            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <Bell size={16} color={C.textSoft} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: C.danger, border: `1.5px solid ${C.surface}` }}
              />
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        {searchOpen && (
          <div className="md:hidden px-4 sm:px-6 pt-3">
            <div
              className="flex items-center gap-2 px-3 rounded-lg"
              style={{ background: C.surface, border: `1px solid ${C.border}`, height: 36 }}
            >
              <Search size={14} color={C.textFaint} />
              <input
                placeholder="Search campaigns, contacts…"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: C.text }}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Content */}
        {active === 'dashboard' ? (
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-5 sm:gap-6 max-w-[1180px]">
            <div>
              <h1 style={{ fontFamily: C.display, color: C.text, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }} className="sm:text-[24px]">
                Good afternoon, Ayesha
              </h1>
              <p style={{ color: C.textSoft, fontSize: 13.5 }} className="mt-1">
                Here's what's moving across your sends today.
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 sm:gap-4">
              <StatCard icon={Send} label="Emails sent (30d)" value="128,402" delta="12.4%" positive accent={C.primary} />
              <StatCard icon={MailOpen} label="Open rate" value="42.6%" delta="3.1%" positive accent={C.success} />
              <StatCard icon={MousePointerClick} label="Click rate" value="8.9%" delta="1.2%" positive={false} accent={C.warning} />
              <StatCard icon={Activity} label="Active queue" value="312" delta="18 stuck" positive={false} accent={C.danger} />
            </div>

            {/* Mail pulse — signature strip */}
            <div className="rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <CircleDot size={14} style={{ color: C.primary }} />
                <p style={{ fontFamily: C.display, color: C.text, fontSize: 13.5, fontWeight: 600 }}>Mail pulse</p>
                <span style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11 }}>live</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {pulseEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full pulse-dot shrink-0" style={{ background: dotColor(e.status) }} />
                    <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textSoft }} className="truncate">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-xl p-4 sm:p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-4 gap-2">
                <p style={{ fontFamily: C.display, color: C.text, fontSize: 13.5, fontWeight: 600 }}>
                  Emails delivered — last 14 days
                </p>
                <span style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11 }} className="hidden sm:inline shrink-0">daily volume</span>
              </div>
              <div style={{ height: 200 }} className="sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.primary} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.border} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: C.textFaint, fontFamily: C.mono }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10.5, fill: C.textFaint, fontFamily: C.mono }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="sent" stroke={C.primary} strokeWidth={2} fill="url(#fillSent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent campaigns */}
            <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontFamily: C.display, color: C.text, fontSize: 13.5, fontWeight: 600 }}>Recent campaigns</p>
                <button style={{ color: C.primary, fontSize: 12.5, fontWeight: 500 }}>View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ fontSize: 13, minWidth: 560 }}>
                  <thead>
                    <tr style={{ color: C.textFaint, fontSize: 11 }}>
                      <th className="font-medium px-4 sm:px-5 py-2.5 whitespace-nowrap">Campaign</th>
                      <th className="font-medium px-4 sm:px-5 py-2.5 whitespace-nowrap">Status</th>
                      <th className="font-medium px-4 sm:px-5 py-2.5 whitespace-nowrap">Recipients</th>
                      <th className="font-medium px-4 sm:px-5 py-2.5 whitespace-nowrap">Open rate</th>
                      <th className="font-medium px-4 sm:px-5 py-2.5 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const s = statusStyle(c.status);
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap" style={{ color: C.text, fontWeight: 500 }}>{c.name}</td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: s.bg, color: s.fg }}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap" style={{ fontFamily: C.mono, color: C.textSoft }}>
                            {c.recipients.toLocaleString()}
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap" style={{ fontFamily: C.mono, color: C.textSoft }}>{c.open}</td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap" style={{ color: C.textFaint }}>{c.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: C.primarySoft }}
            >
              <LayoutDashboard size={22} color={C.primary} />
            </div>
            <p style={{ fontFamily: C.display, color: C.text, fontSize: 18, fontWeight: 600 }}>
              {pageLabel}
            </p>
            <p style={{ color: C.textSoft, fontSize: 13.5, maxWidth: 360 }} className="mt-1.5">
              This page is wired up in the sidebar and ready for its content — hook it up to your data source when you're ready.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}