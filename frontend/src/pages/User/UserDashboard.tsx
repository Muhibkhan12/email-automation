import { useMemo, useState } from 'react'
import Sidebar from './Sidebar'
import {
  Mail, Send, Users, AlertCircle, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, XCircle, CircleDot, ShieldCheck, ShieldAlert,
  ShieldX, Menu, ChevronRight, Activity, TrendingUp, ArrowRight,
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
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.10)',
  successRing: 'rgba(52,211,153,0.22)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.10)',
  warningRing: 'rgba(251,191,36,0.22)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.10)',
  dangerRing: 'rgba(248,113,113,0.22)',
  neutral: '#9BA0A8',
  neutralSoft: 'rgba(155,160,168,0.10)',
  neutralRing: 'rgba(155,160,168,0.22)',
  dark: '#E8E6E1',
  bg: '#0D1015',
  surface: '#141821',
  surfaceHover: '#161B25',
  inner: '#0F131A',
  border: '#232833',
  borderHover: '#333A48',
  textMuted: '#6B727C',
  textBody: '#C7C9CE',
}

// ---- Mock data -----------------------------------------------------
const stats = [
  { label: 'Emails sent today', value: '12,480', delta: '+8.2%', trend: 'up', icon: Send,         accent: COLOR.primary, accentSoft: COLOR.primarySoft },
  { label: 'Delivery rate',     value: '98.4%',  delta: '+0.6%', trend: 'up', icon: CheckCircle2, accent: COLOR.success, accentSoft: COLOR.successSoft },
  { label: 'Active recipients', value: '34,920', delta: '+412',  trend: 'up', icon: Users,        accent: COLOR.warning, accentSoft: COLOR.warningSoft },
  { label: 'Bounced / failed',  value: '186',    delta: '-3.1%', trend: 'down', icon: XCircle,    accent: COLOR.danger,  accentSoft: COLOR.dangerSoft },
]

const recentCampaigns = [
  { name: 'August Product Update',     status: 'Sent',    recipients: '8,240',  opened: '61%', sentAt: 'Today, 9:02 AM' },
  { name: 'Weekly Digest #34',         status: 'Sent',    recipients: '12,900', opened: '48%', sentAt: 'Yesterday, 6:00 PM' },
  { name: 'Onboarding — Day 3',        status: 'Queued',  recipients: '1,120',  opened: '—',   sentAt: 'Scheduled 4:00 PM' },
  { name: 'Cart Abandonment Reminder', status: 'Sent',    recipients: '3,450',  opened: '39%', sentAt: 'Aug 9, 11:20 AM' },
  { name: 'Beta Access Invite',        status: 'Failed',  recipients: '600',    opened: '—',   sentAt: 'Aug 8, 3:45 PM' },
]

const statusStyle: Record<string, { bg: string; fg: string; ring: string }> = {
  Sent:   { bg: COLOR.successSoft, fg: COLOR.success, ring: COLOR.successRing },
  Queued: { bg: COLOR.warningSoft, fg: COLOR.warning, ring: COLOR.warningRing },
  Failed: { bg: COLOR.dangerSoft,  fg: COLOR.danger,  ring: COLOR.dangerRing },
}

const queueActivity = [
  { label: 'Processed', value: '9,340', icon: CheckCircle2, tone: COLOR.success },
  { label: 'In queue',  value: '212',   icon: Clock,        tone: COLOR.warning },
  { label: 'Errors',    value: '14',    icon: AlertCircle,  tone: COLOR.danger },
]

const deliveryTrend = [
  { day: 'Jul 30', sent: 8400 }, { day: 'Jul 31', sent: 9100 }, { day: 'Aug 1', sent: 7800 },
  { day: 'Aug 2', sent: 10200 }, { day: 'Aug 3', sent: 11400 }, { day: 'Aug 4', sent: 9600 },
  { day: 'Aug 5', sent: 12800 }, { day: 'Aug 6', sent: 11100 }, { day: 'Aug 7', sent: 13400 },
  { day: 'Aug 8', sent: 10800 }, { day: 'Aug 9', sent: 12200 }, { day: 'Aug 10', sent: 14100 },
  { day: 'Aug 11', sent: 12480 },
]

const engagement = [
  { name: 'Opened',   value: 48, color: COLOR.primary },
  { name: 'Clicked',  value: 19, color: COLOR.warning },
  { name: 'Bounced',  value: 4,  color: COLOR.danger },
  { name: 'Unopened', value: 29, color: COLOR.borderHover },
]

const pulseEvents = [
  { status: 'success' as const, text: "'August Product Update' — 4,120 delivered" },
  { status: 'pending' as const, text: "'Weekly Digest #34' — sending, 6,300 of 12,900" },
  { status: 'success' as const, text: 'Sender account relay-03 passed DKIM check' },
  { status: 'failed'  as const, text: "'Beta Access Invite' — 22 bounced, retry scheduled" },
  { status: 'pending' as const, text: "Import job 'leads_aug.csv' — 1,204 rows parsing" },
]

const senderAccounts = [
  { name: 'relay-01@mailforge.io',    status: 'Active'   as const, load: 38 },
  { name: 'relay-02@mailforge.io',    status: 'Active'   as const, load: 61 },
  { name: 'relay-03@mailforge.io',    status: 'Warning'  as const, load: 89 },
  { name: 'campaigns@mailforge.io',   status: 'Disabled' as const, load: 0  },
]

const accountStatusMeta = {
  Active:   { icon: ShieldCheck, fg: COLOR.success, bg: COLOR.successSoft, ring: COLOR.successRing },
  Warning:  { icon: ShieldAlert, fg: COLOR.warning, bg: COLOR.warningSoft, ring: COLOR.warningRing },
  Disabled: { icon: ShieldX,     fg: COLOR.neutral, bg: COLOR.neutralSoft, ring: COLOR.neutralRing },
}

const pulseDotColor = { success: COLOR.success, pending: COLOR.warning, failed: COLOR.danger }

// ---- Shared shells -----------------------------------------------------
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl transition-colors ${className}`}
    style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
  >
    {children}
  </div>
)

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4">
    <div>
      <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[13px] md:text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {hint && <p className="text-[11px] mt-0.5" style={{ color: COLOR.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
)

// ---- Component -----------------------------------------------------
const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const engagementTotal = useMemo(() => engagement.reduce((s, e) => s + e.value, 0), [])
  const deliveredPct = engagement.find(e => e.name === 'Opened')?.value ?? 0

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: COLOR.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-main::-webkit-scrollbar { width: 8px; }
        .mf-main::-webkit-scrollbar-track { background: transparent; }
        .mf-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .mf-main::-webkit-scrollbar-thumb:hover { background: #333A48; }
        .pulse-dot { animation: pulse-fade 1.8s ease-in-out infinite; }
        @keyframes pulse-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="mf-main flex-1 overflow-y-auto" style={{ background: COLOR.bg }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ─────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-xl text-[#C7C9CE] transition-colors"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.textMuted }}>Workspace</span>
                  <ChevronRight size={10} style={{ color: '#3A3F4A' }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.primary }}>Overview</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: '-0.02em', color: COLOR.dark }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold leading-tight"
                >
                  Dashboard
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm" style={{ color: COLOR.textMuted }}>
                  Delivery health, engagement, and queue status — at a glance.
                </p>
              </div>
            </div>

            <button
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: COLOR.primary,
                color: '#fff',
                boxShadow: '0 10px 30px -10px rgba(255,106,57,0.6)',
              }}
            >
              <Mail size={16} />
              New campaign
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </header>

          {/* ── Stat cards ─────────────────────────── */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {stats.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
              <Card key={label} className="p-4 md:p-5 fade-in-up">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accent}33` }}
                  >
                    <Icon size={15} style={{ color: accent }} />
                  </div>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      background: trend === 'up' ? COLOR.successSoft : COLOR.dangerSoft,
                      color: trend === 'up' ? COLOR.success : COLOR.danger,
                      boxShadow: `inset 0 0 0 1px ${trend === 'up' ? COLOR.successRing : COLOR.dangerRing}`,
                    }}
                  >
                    {trend === 'up'
                      ? <ArrowUpRight size={11} />
                      : <ArrowDownRight size={11} />}
                    {delta}
                  </span>
                </div>
                <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[26px] font-bold tracking-tight leading-none">
                  {value}
                </p>
                <p className="text-[11px] md:text-xs mt-2" style={{ color: COLOR.textMuted }}>{label}</p>
              </Card>
            ))}
          </div>

          {/* ── Delivery trend + engagement ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-6 md:mb-8">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Delivery trend"
                hint="Last 13 days · daily volume"
                right={
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primary}33` }}>
                    <TrendingUp size={11} /> 12,480 today
                  </span>
                }
              />
              <div className="px-3 md:px-4 pb-4 md:pb-5" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLOR.border} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: COLOR.borderHover, strokeDasharray: '3 3' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${COLOR.border}`,
                        background: COLOR.surface,
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: COLOR.dark,
                        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)',
                      }}
                    />
                    <Area type="monotone" dataKey="sent" stroke={COLOR.primary} strokeWidth={2} fill="url(#fillSent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Engagement breakdown" hint="Share of opens, clicks, and bounces" />
              <div className="px-4 md:px-5 pb-4 md:pb-5">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={engagement} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={2}>
                          {engagement.map((e) => (
                            <Cell key={e.name} fill={e.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-xl font-bold leading-none">
                        {deliveredPct}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: COLOR.textMuted }}>
                        Opened
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {engagement.map((e) => (
                      <div key={e.name} className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2" style={{ color: COLOR.textBody }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: e.color, boxShadow: `0 0 6px ${e.color}` }} />
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
            </Card>
          </div>

          {/* ── Recent campaigns + queue ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-6 md:mb-8">
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[13px] md:text-sm font-semibold tracking-tight">
                    Recent campaigns
                  </h2>
                  <p className="text-[11px] mt-0.5" style={{ color: COLOR.textMuted }}>Latest 5 across your workspace</p>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-[11px] md:text-xs font-medium transition-colors"
                  style={{ color: COLOR.primary }}
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 620 }}>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: COLOR.textMuted }}>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Campaign</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium text-right">Recipients</th>
                      <th className="px-3 py-2.5 font-medium text-right">Opened</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium text-right">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.map((c) => {
                      const s = statusStyle[c.status]
                      const initial = c.name.trim()[0]?.toUpperCase() ?? '?'
                      return (
                        <tr
                          key={c.name}
                          className="transition-colors"
                          style={{ borderTop: `1px solid ${COLOR.border}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = COLOR.surfaceHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 md:px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold text-white"
                                style={{ background: `linear-gradient(135deg, ${COLOR.primary}44, ${COLOR.primary}11)`, boxShadow: `inset 0 0 0 1px ${COLOR.primary}33` }}
                              >
                                {initial}
                              </div>
                              <span className="text-[13px] font-medium truncate" style={{ color: COLOR.dark }}>{c.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                              style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
                              {c.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="px-3 py-3 text-right text-[12px]">{c.recipients}</td>
                          <td style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="px-3 py-3 text-right text-[12px]">{c.opened}</td>
                          <td className="px-4 md:px-5 py-3 text-right text-[11.5px] whitespace-nowrap" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
                            {c.sentAt}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Queue monitor" hint="Live worker throughput" />
              <div className="px-4 md:px-5 pb-4 md:pb-5">
                <div className="space-y-2">
                  {queueActivity.map(({ label, value, icon: Icon, tone }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: COLOR.inner, border: `1px solid ${COLOR.border}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${tone}1A`, boxShadow: `inset 0 0 0 1px ${tone}33` }}
                        >
                          <Icon size={13} style={{ color: tone }} />
                        </div>
                        <span className="text-[12px] md:text-[13px]" style={{ color: COLOR.textBody }}>{label}</span>
                      </div>
                      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[13px] font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                  <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: COLOR.textMuted }}>
                    <span>Queue load</span>
                    <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="font-medium">72%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: COLOR.inner }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: '72%', background: `linear-gradient(90deg, ${COLOR.primary}, #FF8A5C)` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Mail pulse + sender health ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Mail pulse"
                hint="Live events from the mail pipeline"
                right={
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primary}33` }}
                  >
                    <Activity size={11} /> live
                  </span>
                }
              />
              <div className="px-4 md:px-5 pb-5 relative">
                <span
                  className="absolute left-[26px] md:left-[30px] top-2 bottom-6 w-px"
                  style={{ background: COLOR.border }}
                />
                <div className="space-y-3.5 relative">
                  {pulseEvents.map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 w-2.5 h-2.5 rounded-full pulse-dot shrink-0 ring-4"
                        style={{
                          background: pulseDotColor[e.status],
                          boxShadow: `0 0 10px ${pulseDotColor[e.status]}`,
                          // @ts-ignore
                          '--tw-ring-color': `${pulseDotColor[e.status]}22`,
                        }}
                      />
                      <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="text-[11.5px] md:text-[12.5px] leading-relaxed">
                        {e.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Sender account health" hint="Reputation and current load" />
              <div className="px-4 md:px-5 pb-5 space-y-3">
                {senderAccounts.map((a) => {
                  const meta = accountStatusMeta[a.status]
                  const Icon = meta.icon
                  const barColor = a.load >= 80 ? COLOR.danger : a.load >= 60 ? COLOR.warning : COLOR.success
                  return (
                    <div key={a.name} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: meta.bg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                          >
                            <Icon size={13} style={{ color: meta.fg }} />
                          </div>
                          <span className="text-[11.5px] md:text-[12.5px] truncate" style={{ color: COLOR.textBody }}>{a.name}</span>
                        </div>
                        <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[11px] font-semibold shrink-0">
                          {a.load}%
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: COLOR.inner }}>
                        <div className="h-full rounded-full" style={{ width: `${a.load}%`, background: barColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard