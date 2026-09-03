import { useMemo, useState } from 'react'
import Sidebar, { MobileMenuButton, MobileSidebar } from './Sidebar'
import {
  Mail,
  Send,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDot,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Menu,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ---- Fonts / tokens ----------------------------------------------------
const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
}

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  success: '#7FD98A',
  successSoft: 'rgba(127,217,138,0.12)',
  warning: '#FFC24B',
  warningSoft: 'rgba(255,194,75,0.12)',
  danger: '#FF5C6C',
  dangerSoft: 'rgba(255,92,108,0.12)',
  neutral: '#8B8D94',
  neutralSoft: '#1B1E24',
  dark: '#E8E6E1',
  bg: '#0E1013',
  surface: '#171A21',
  surfaceHover: '#1B1E24',
  border: '#2A2E37',
  borderHover: '#3A3F4A',
  textMuted: '#8B8D94',
  textBody: '#C7C9CE',
}

// ---- Mock data -----------------------------------------------------
const stats = [
  { label: 'Emails Sent Today', value: '12,480', delta: '+8.2%', trend: 'up', icon: Send, accent: COLOR.primary, accentSoft: COLOR.primarySoft },
  { label: 'Delivery Rate', value: '98.4%', delta: '+0.6%', trend: 'up', icon: CheckCircle2, accent: COLOR.success, accentSoft: COLOR.successSoft },
  { label: 'Active Recipients', value: '34,920', delta: '+412', trend: 'up', icon: Users, accent: COLOR.warning, accentSoft: COLOR.warningSoft },
  { label: 'Bounced / Failed', value: '186', delta: '-3.1%', trend: 'down', icon: XCircle, accent: COLOR.danger, accentSoft: COLOR.dangerSoft },
]

const recentCampaigns = [
  { name: 'August Product Update', status: 'Sent', recipients: '8,240', opened: '61%', sentAt: 'Today, 9:02 AM' },
  { name: 'Weekly Digest #34', status: 'Sent', recipients: '12,900', opened: '48%', sentAt: 'Yesterday, 6:00 PM' },
  { name: 'Onboarding — Day 3', status: 'Queued', recipients: '1,120', opened: '—', sentAt: 'Scheduled 4:00 PM' },
  { name: 'Cart Abandonment Reminder', status: 'Sent', recipients: '3,450', opened: '39%', sentAt: 'Aug 9, 11:20 AM' },
  { name: 'Beta Access Invite', status: 'Failed', recipients: '600', opened: '—', sentAt: 'Aug 8, 3:45 PM' },
]

const statusStyle: Record<string, { bg: string; fg: string }> = {
  Sent: { bg: COLOR.successSoft, fg: COLOR.success },
  Queued: { bg: COLOR.warningSoft, fg: COLOR.warning },
  Failed: { bg: COLOR.dangerSoft, fg: COLOR.danger },
}

const queueActivity = [
  { label: 'Processed', value: '9,340', icon: CheckCircle2, tone: COLOR.success },
  { label: 'In queue', value: '212', icon: Clock, tone: COLOR.warning },
  { label: 'Errors', value: '14', icon: AlertCircle, tone: COLOR.danger },
]

const deliveryTrend = [
  { day: 'Jul 30', sent: 8400 }, { day: 'Jul 31', sent: 9100 }, { day: 'Aug 1', sent: 7800 },
  { day: 'Aug 2', sent: 10200 }, { day: 'Aug 3', sent: 11400 }, { day: 'Aug 4', sent: 9600 },
  { day: 'Aug 5', sent: 12800 }, { day: 'Aug 6', sent: 11100 }, { day: 'Aug 7', sent: 13400 },
  { day: 'Aug 8', sent: 10800 }, { day: 'Aug 9', sent: 12200 }, { day: 'Aug 10', sent: 14100 },
  { day: 'Aug 11', sent: 12480 },
]

const engagement = [
  { name: 'Opened', value: 48, color: COLOR.primary },
  { name: 'Clicked', value: 19, color: COLOR.warning },
  { name: 'Bounced', value: 4, color: COLOR.danger },
  { name: 'Unopened', value: 29, color: COLOR.borderHover },
]

const pulseEvents = [
  { status: 'success' as const, text: "'August Product Update' — 4,120 delivered" },
  { status: 'pending' as const, text: "'Weekly Digest #34' — sending, 6,300 of 12,900" },
  { status: 'success' as const, text: 'Sender account relay-03 passed DKIM check' },
  { status: 'failed' as const, text: "'Beta Access Invite' — 22 bounced, retry scheduled" },
  { status: 'pending' as const, text: "Import job 'leads_aug.csv' — 1,204 rows parsing" },
]

const senderAccounts = [
  { name: 'relay-01@mailforge.io', status: 'Active' as const, load: '38%' },
  { name: 'relay-02@mailforge.io', status: 'Active' as const, load: '61%' },
  { name: 'relay-03@mailforge.io', status: 'Warning' as const, load: '89%' },
  { name: 'campaigns@mailforge.io', status: 'Disabled' as const, load: '0%' },
]

const accountStatusMeta = {
  Active: { icon: ShieldCheck, fg: COLOR.success, bg: COLOR.successSoft },
  Warning: { icon: ShieldAlert, fg: COLOR.warning, bg: COLOR.warningSoft },
  Disabled: { icon: ShieldX, fg: COLOR.textMuted, bg: COLOR.neutralSoft },
}

const pulseDotColor = { success: COLOR.success, pending: COLOR.warning, failed: COLOR.danger }

// ---- Component -----------------------------------------------------
const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const engagementTotal = useMemo(() => engagement.reduce((s, e) => s + e.value, 0), [])

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: COLOR.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-card { transition: border-color 0.15s ease; }
        .mf-card:hover { border-color: ${COLOR.borderHover}; }
        .mf-row:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-link:hover { color: #FF7F52; }
        .pulse-dot { animation: pulse-fade 1.8s ease-in-out infinite; }
        
        @keyframes pulse-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        
        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto" style={{ background: COLOR.bg }}>
        <div className="px-3 md:px-5 lg:px-8 py-4 md:py-6 lg:py-7 max-w-[1320px] mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-5 md:mb-7">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: '-0.01em', color: COLOR.dark }}
                  className="text-xl md:text-2xl font-semibold"
                >
                  Dashboard
                </h1>
                <p className="text-[10px] md:text-sm mt-0.5" style={{ color: COLOR.textMuted }}>Overview of your campaigns and delivery health</p>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-medium px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg transition-colors hover:opacity-90 w-full sm:w-auto justify-center"
              style={{ background: COLOR.primary, color: COLOR.bg }}
            >
              <Mail size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" />
              New Campaign
            </button>
          </div>

          {/* Stat cards - Responsive Grid */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5">
            {stats.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
              <div
                key={label}
                className="mf-card rounded-xl p-3 md:p-4 lg:p-5"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center" style={{ background: accentSoft }}>
                    <Icon size={14} className="md:w-[15px] md:h-[15px] lg:w-[17px] lg:h-[17px]" style={{ color: accent }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 text-[10px] md:text-[11px] lg:text-[12px] font-medium"
                    style={{ color: trend === 'up' ? COLOR.success : COLOR.danger }}
                  >
                    {trend === 'up' ? <ArrowUpRight size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" /> : <ArrowDownRight size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" />}
                    {delta}
                  </span>
                </div>
                <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-lg md:text-xl lg:text-2xl font-semibold tracking-tight">
                  {value}
                </p>
                <p className="text-[11px] md:text-[12px] lg:text-[13px] mt-0.5 md:mt-1" style={{ color: COLOR.textMuted }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Delivery trend + engagement breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-4 md:mb-5">
            <div className="lg:col-span-2 mf-card rounded-xl p-3 md:p-4 lg:p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold">
                  Delivery trend — last 13 days
                </h2>
                <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[9px] md:text-[10px] lg:text-[11px]">daily volume</span>
              </div>
              <div style={{ height: 160 }} className="md:h-[180px] lg:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLOR.border} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: COLOR.textMuted, fontFamily: FONT.mono }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 9, fill: COLOR.textMuted, fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLOR.border}`, background: COLOR.surface, fontFamily: FONT.mono, fontSize: 11, color: COLOR.dark }} />
                    <Area type="monotone" dataKey="sent" stroke={COLOR.primary} strokeWidth={2} fill="url(#fillSent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mf-card rounded-xl p-3 md:p-4 lg:p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold mb-3 md:mb-4">
                Engagement breakdown
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                <div style={{ width: 90, height: 90 }} className="md:w-[100px] md:h-[100px] lg:w-[110px] lg:h-[110px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={engagement} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2}>
                        {engagement.map((e) => (
                          <Cell key={e.name} fill={e.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-1.5 md:space-y-2">
                  {engagement.map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-[11px] md:text-[12px] lg:text-[12.5px]">
                      <span className="flex items-center gap-1.5" style={{ color: COLOR.textBody }}>
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ background: e.color }} />
                        {e.name}
                      </span>
                      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="font-medium">
                        {Math.round((e.value / engagementTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent campaigns + Queue monitor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-4 md:mb-5">
            <div className="lg:col-span-2 mf-card rounded-xl overflow-hidden" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 lg:px-5 py-3 md:py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold">
                  Recent Campaigns
                </h2>
                <button className="mf-link text-[10px] md:text-[11px] lg:text-[12.5px] font-medium transition-colors" style={{ color: COLOR.primary }}>
                  View all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px] md:min-w-[600px]">
                  <thead>
                    <tr className="text-[9px] md:text-[10px] lg:text-[11px] uppercase tracking-wider" style={{ color: COLOR.textMuted }}>
                      <th className="px-3 md:px-4 lg:px-5 py-2 md:py-2.5 font-medium">Campaign</th>
                      <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Status</th>
                      <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Recipients</th>
                      <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Opened</th>
                      <th className="px-3 md:px-4 lg:px-5 py-2 md:py-2.5 font-medium text-right">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.map((c) => (
                      <tr key={c.name} className="mf-row transition-colors" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                        <td className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 text-[11px] md:text-[12px] lg:text-[13.5px] font-medium" style={{ color: COLOR.dark }}>{c.name}</td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3">
                          <span
                            className="text-[9px] md:text-[10px] lg:text-[11.5px] font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-md"
                            style={{ background: statusStyle[c.status].bg, color: statusStyle[c.status].fg }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="px-2 md:px-3 py-2.5 md:py-3 text-[10px] md:text-[11px] lg:text-[13px]">{c.recipients}</td>
                        <td style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="px-2 md:px-3 py-2.5 md:py-3 text-[10px] md:text-[11px] lg:text-[13px]">{c.opened}</td>
                        <td className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] lg:text-[12.5px] text-right whitespace-nowrap" style={{ color: COLOR.textMuted }}>
                          {c.sentAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mf-card rounded-xl p-3 md:p-4 lg:p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold mb-3 md:mb-4">
                Queue Monitor
              </h2>
              <div className="space-y-2 md:space-y-3">
                {queueActivity.map(({ label, value, icon: Icon, tone }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-2.5 md:px-3.5 py-2 md:py-3 rounded-lg"
                    style={{ background: COLOR.bg }}
                  >
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <Icon size={13} className="md:w-[14px] md:h-[14px] lg:w-[16px] lg:h-[16px]" style={{ color: tone }} />
                      <span className="text-[11px] md:text-[12px] lg:text-[13px]" style={{ color: COLOR.textBody }}>{label}</span>
                    </div>
                    <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[11px] md:text-[12px] lg:text-[13.5px] font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 md:mt-4 lg:mt-5 pt-3 md:pt-4" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                <div className="flex items-center justify-between text-[10px] md:text-[11px] lg:text-[12.5px] mb-1 md:mb-1.5" style={{ color: COLOR.textMuted }}>
                  <span>Queue load</span>
                  <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="font-medium">72%</span>
                </div>
                <div className="h-1 md:h-1.5 w-full rounded-full overflow-hidden" style={{ background: COLOR.bg }}>
                  <div className="h-full w-[72%] rounded-full" style={{ background: COLOR.primary }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mail pulse + Sender account health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
            <div className="lg:col-span-2 mf-card rounded-xl p-3 md:p-4 lg:p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                <CircleDot size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: COLOR.primary }} />
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold">Mail pulse</h2>
                <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[9px] md:text-[10px] lg:text-[11px]">live</span>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                {pulseEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-3">
                    <span
                      className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full pulse-dot shrink-0"
                      style={{ background: pulseDotColor[e.status] }}
                    />
                    <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="text-[10px] md:text-[11px] lg:text-[12px]">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mf-card rounded-xl p-3 md:p-4 lg:p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold mb-3 md:mb-4">
                Sender account health
              </h2>
              <div className="space-y-2 md:space-y-2.5">
                {senderAccounts.map((a) => {
                  const meta = accountStatusMeta[a.status]
                  const Icon = meta.icon
                  return (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                          <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: meta.fg }} />
                        </div>
                        <span className="text-[10px] md:text-[11px] lg:text-[12.5px] truncate" style={{ color: COLOR.textBody }}>{a.name}</span>
                      </div>
                      <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[9px] md:text-[10px] lg:text-[11.5px] shrink-0 ml-1 md:ml-2">
                        {a.load}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard