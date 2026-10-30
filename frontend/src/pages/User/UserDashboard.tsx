// src/pages/User/UserDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

import { useCampaigns } from '../../contexts/CampaignContext'
import { EmailLogsContext } from '../../contexts/EmaillogsContext'
import { SenderAccContext } from '../../contexts/SenderAccountsContext'

import {
  Mail, Send, Users, AlertCircle, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, XCircle, ShieldCheck, ShieldAlert,
  ShieldX, Menu, ChevronRight, Activity, TrendingUp, ArrowRight,
  RefreshCw, Inbox,
} from 'lucide-react'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

/* ─────────────── design tokens ─────────────── */

const T = {
  // Canvas — deeper, navy-tinted so foreground colors pop
  bg:          '#0B0D14',

  // Surfaces — layered above the canvas for visible depth
  surface:     '#131722',
  surface2:    '#1A1F2E',
  surfaceHi:   '#222838',

  // Borders — visible but restrained
  border:      '#2E364A',
  borderSoft:  '#232A3C',

  // Text — the whole point: brighter, but not harsh white
  text:        '#F2F4F8',   // primary — near-white
  textMuted:   '#B6BECE',   // secondary — clearly readable
  textFaint:   '#8B93A7',   // tertiary — still legible, no longer ghost

  // Brand — brighter indigo
  brand:       '#7C7FF2',
  brandSoft:   'rgba(124,127,242,0.14)',
  brandBorder: 'rgba(124,127,242,0.42)',

  // Status — brighter, more legible on dark navy
  success:      '#34D399',
  successSoft:  'rgba(52,211,153,0.14)',
  successBorder:'rgba(52,211,153,0.42)',

  warn:         '#FBBF24',
  warnSoft:     'rgba(251,191,36,0.14)',
  warnBorder:   'rgba(251,191,36,0.42)',

  danger:       '#F87171',
  dangerSoft:   'rgba(248,113,113,0.14)',
  dangerBorder: 'rgba(248,113,113,0.42)',

  purple:       '#C4B5FD',
  purpleSoft:   'rgba(196,181,253,0.14)',
  purpleBorder: 'rgba(196,181,253,0.42)',

  info:         '#38BDF8',
  infoSoft:     'rgba(56,189,248,0.14)',
  infoBorder:   'rgba(56,189,248,0.42)',
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── helpers ─────────────── */

const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? '0' : Number(n).toLocaleString()

const formatRelative = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso).getTime()
  if (isNaN(d)) return '—'
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const dayKey = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

/* ─────────────── status maps ─────────────── */

const CAMPAIGN_STATUS_STYLE: Record<string, { bg: string; fg: string; ring: string; label: string }> = {
  Draft:     { bg: 'rgba(139,147,167,0.14)', fg: T.textMuted, ring: 'rgba(139,147,167,0.32)', label: 'Draft' },
  Ready:     { bg: T.brandSoft,   fg: T.brand,   ring: T.brandBorder,   label: 'Ready' },
  Running:   { bg: T.successSoft, fg: T.success, ring: T.successBorder, label: 'Running' },
  Paused:    { bg: T.warnSoft,    fg: T.warn,    ring: T.warnBorder,    label: 'Paused' },
  Completed: { bg: T.purpleSoft,  fg: T.purple,  ring: T.purpleBorder,  label: 'Completed' },
  Cancelled: { bg: T.dangerSoft,  fg: T.danger,  ring: T.dangerBorder,  label: 'Cancelled' },
}

const accountStatusMeta = {
  Active:   { icon: ShieldCheck, fg: T.success,  bg: T.successSoft,               ring: T.successBorder },
  Warning:  { icon: ShieldAlert, fg: T.warn,     bg: T.warnSoft,                  ring: T.warnBorder },
  Disabled: { icon: ShieldX,     fg: T.textMuted,bg: 'rgba(139,147,167,0.14)',    ring: 'rgba(139,147,167,0.32)' },
}

const pulseDotColor = {
  success: T.success,
  pending: T.warn,
  failed:  T.danger,
}

/* ─────────────── shells ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className = '', style,
}) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING, ...style }}>
    {children}
  </div>
)

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 pt-4 pb-3">
    <div>
      <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>{title}</h2>
      {hint && <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
)

/* ─────────────── component ─────────────── */

const UserDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const {
    myCampaigns = [],
    myLoading: campaignsLoading,
    myError: campaignsError,
    fetchMine,
  } = useCampaigns()

  const emailLogsCtx = React.useContext(EmailLogsContext)
  const emaillogs = emailLogsCtx?.emaillogs ?? []
  const logsLoading = emailLogsCtx?.loading ?? false
  const logsError = emailLogsCtx?.error ?? null
  const refetchLogs = emailLogsCtx?.refetch

  const senderCtx = React.useContext(SenderAccContext)
  const senderAcc = senderCtx?.senderAcc ?? []
  const fetchAllSenderAccounts = senderCtx?.fetchAllSenderAccounts

  useEffect(() => { fetchMine?.(); /* eslint-disable-next-line */ }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([fetchMine?.(), refetchLogs?.(), fetchAllSenderAccounts?.()])
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const loading = campaignsLoading || logsLoading
  const error = campaignsError || logsError

  const myCampaignIds = useMemo(() => new Set(myCampaigns.map((c: any) => c.id)), [myCampaigns])

  const myLogs = useMemo(() => {
    if (myCampaignIds.size === 0) return emaillogs
    return emaillogs.filter((l: any) => {
      const cid = l.campaign_id ?? l.campaign?.id
      return cid === undefined || myCampaignIds.has(cid)
    })
  }, [emaillogs, myCampaignIds])

  const stats = useMemo(() => {
    const sent = myLogs.filter((l: any) => l.status === 'Sent').length
    const failed = myLogs.filter((l: any) => l.status === 'Failed').length
    const pending = myLogs.filter((l: any) => l.status === 'Pending').length
    const totalRecipients = myCampaigns.reduce((sum: number, c: any) => sum + (c.recipients?.length ?? 0), 0)
    const deliveryRate = myLogs.length ? Math.round((sent / myLogs.length) * 1000) / 10 : 0
    return { sent, failed, pending, totalRecipients, deliveryRate, total: myLogs.length }
  }, [myLogs, myCampaigns])

  const deliveryTrend = useMemo(() => {
    const days = 14
    const buckets = new Map<string, number>()
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      buckets.set(d.toISOString().slice(0, 10), 0)
    }
    myLogs.forEach((l: any) => {
      const k = dayKey(l.sent_at ?? l.created_at)
      if (k && buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1)
    })
    return Array.from(buckets.entries()).map(([k, v]) => ({
      day: new Date(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sent: v,
    }))
  }, [myLogs])

  const trendTotalToday = deliveryTrend[deliveryTrend.length - 1]?.sent ?? 0

  const engagement = useMemo(() => {
    const total = stats.sent + stats.pending + stats.failed || 1
    return [
      { name: 'Sent',    value: stats.sent,    color: T.success },
      { name: 'Pending', value: stats.pending, color: T.warn },
      { name: 'Failed',  value: stats.failed,  color: T.danger },
    ].map((e) => ({ ...e, pct: Math.round((e.value / total) * 100) }))
  }, [stats])

  const engagementTotal = useMemo(
    () => engagement.reduce((s, e) => s + e.value, 0) || 1,
    [engagement]
  )
  const deliveredPct = Math.round((stats.sent / (stats.total || 1)) * 100)

  const recentCampaigns = useMemo(() => {
    return [...myCampaigns]
      .sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 5)
  }, [myCampaigns])

  const campaignStatsById = useMemo(() => {
    const map = new Map<number, { sent: number; failed: number }>()
    myLogs.forEach((l: any) => {
      const cid = l.campaign_id ?? l.campaign?.id
      if (!cid) return
      const entry = map.get(cid) ?? { sent: 0, failed: 0 }
      if (l.status === 'Sent') entry.sent++
      else if (l.status === 'Failed') entry.failed++
      map.set(cid, entry)
    })
    return map
  }, [myLogs])

  const queueActivity = useMemo(() => ([
    { label: 'Processed', value: formatNumber(stats.sent),  icon: CheckCircle2, tone: T.success, soft: T.successSoft },
    { label: 'In queue',  value: formatNumber(stats.pending), icon: Clock,       tone: T.warn,    soft: T.warnSoft },
    { label: 'Errors',    value: formatNumber(stats.failed),  icon: AlertCircle, tone: T.danger,  soft: T.dangerSoft },
  ]), [stats])

  const queueLoadPct = stats.total ? Math.min(100, Math.round((stats.pending / stats.total) * 100)) : 0

  const pulseEvents = useMemo(() => {
    return [...myLogs]
      .sort((a: any, b: any) => {
        const at = new Date(a.sent_at ?? a.created_at ?? 0).getTime()
        const bt = new Date(b.sent_at ?? b.created_at ?? 0).getTime()
        return bt - at
      })
      .slice(0, 6)
      .map((l: any) => {
        const who =
          l.recipient?.email ||
          l.recipient_email ||
          l.email ||
          `recipient #${l.recipient_id ?? '—'}`
        const tone: 'success' | 'pending' | 'failed' =
          l.status === 'Sent' ? 'success' : l.status === 'Failed' ? 'failed' : 'pending'
        return {
          tone,
          text: `${who} — ${l.status ?? 'Pending'}${l.sent_at ? ` · ${formatRelative(l.sent_at)}` : ''}`,
        }
      })
  }, [myLogs])

  const senderHealth = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return senderAcc.slice(0, 4).map((a: any) => {
      const used = myLogs.filter((l: any) => {
        const t = new Date(l.sent_at ?? l.created_at ?? 0).getTime()
        return t >= todayStart.getTime() && l.sender_account_id === a.id
      }).length
      const cap = a.daily_quota ?? a.quota ?? 500
      const load = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0
      const status: 'Active' | 'Warning' | 'Disabled' =
        a.is_active === false ? 'Disabled' : load >= 80 ? 'Warning' : 'Active'
      return { id: a.id, name: a.email || a.display_name || `account #${a.id}`, load, status }
    })
  }, [senderAcc, myLogs])

  const statCards = [
    { label: 'Emails sent',        value: formatNumber(stats.sent),           delta: `${formatNumber(stats.total)} total events`, trend: 'up' as const,   icon: Send,         accent: T.brand,   accentSoft: T.brandSoft },
    { label: 'Delivery rate',      value: `${stats.deliveryRate}%`,           delta: stats.deliveryRate >= 95 ? 'healthy' : 'check failed', trend: stats.deliveryRate >= 95 ? ('up' as const) : ('down' as const), icon: CheckCircle2, accent: T.success, accentSoft: T.successSoft },
    { label: 'Recipients reached', value: formatNumber(stats.totalRecipients), delta: `${myCampaigns.length} campaigns`,        trend: 'up' as const, icon: Users, accent: T.info, accentSoft: T.infoSoft },
    { label: 'Bounced / failed',   value: formatNumber(stats.failed),         delta: `${formatNumber(stats.pending)} pending`,   trend: stats.failed === 0 ? ('up' as const) : ('down' as const), icon: XCircle, accent: T.danger, accentSoft: T.dangerSoft },
  ]

  const runningCount = myCampaigns.filter((c: any) => c.status === 'Running').length

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        @keyframes pulseFade { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .pulse-dot { animation: pulseFade 1.8s ease-in-out infinite; }

        .db-main::-webkit-scrollbar { width: 8px; }
        .db-main::-webkit-scrollbar-track { background: transparent; }
        .db-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .db-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        /* subtle inner glow on the four big stat numbers so they read brighter */
        .stat-value {
          color: ${T.text};
          text-shadow: 0 0 1px rgba(255,255,255,0.35);
        }

        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .pulse-dot { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="db-main flex-1 overflow-y-auto" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {runningCount} running
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {formatNumber(myCampaigns.length)} campaigns
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Dashboard
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Delivery health, engagement, and queue status — at a glance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
             <button
  onClick={() => navigate('/user/start-campaign')}
  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-[12.5px] transition-all hover:brightness-110"
  style={{ background: T.brand, color: '#fff', boxShadow: '0 6px 18px -8px rgba(124,127,242,0.7)' }}
>
  <Mail size={14} />
  New campaign
  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
</button>
            </div>
          </header>

          {error && (
            <div className="mb-5 rounded-lg px-3.5 py-3 text-[12.5px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
              <Card key={label} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: accentSoft, color: accent }}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-medium"
                    style={{
                      background: trend === 'up' ? T.successSoft : T.dangerSoft,
                      color: trend === 'up' ? T.success : T.danger,
                      fontFamily: FONT.mono,
                    }}
                  >
                    {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {delta}
                  </span>
                </div>
                <p className="stat-value text-[24px] font-semibold tracking-tight leading-none" style={{ fontFamily: FONT.mono }}>
                  {value}
                </p>
                <p className="text-[11.5px] mt-2" style={{ color: T.textMuted }}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Trend + engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Delivery trend"
                hint="Last 14 days · daily events"
                right={
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, fontFamily: FONT.mono }}
                  >
                    <TrendingUp size={10} /> {formatNumber(trendTotalToday)} today
                  </span>
                }
              />
              <div className="px-3 md:px-4 pb-4" style={{ height: 220 }}>
                {loading && deliveryTrend.every((d) => d.sent === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.brand, borderTopColor: 'transparent' }} />
                  </div>
                ) : deliveryTrend.some((d) => d.sent > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.brand} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={T.brand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={T.borderSoft} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ stroke: T.border, strokeDasharray: '3 3' }}
                        contentStyle={{
                          borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2,
                          fontFamily: FONT.mono, fontSize: 11, color: T.text,
                          boxShadow: '0 12px 30px -12px rgba(0,0,0,0.7)',
                        }}
                      />
                      <Area type="monotone" dataKey="sent" stroke={T.brand} strokeWidth={2} fill="url(#fillSent)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity size={20} className="mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No email activity yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Log status" hint="Share of send outcomes" />
              <div className="px-4 md:px-5 pb-4">
                {stats.total === 0 ? (
                  <div className="py-10 text-center">
                    <Activity size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No logs yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={engagement} dataKey="value" innerRadius={40} outerRadius={56} paddingAngle={2}>
                            {engagement.map((e) => (
                              <Cell key={e.name} fill={e.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[20px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {deliveredPct}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: T.textFaint }}>
                          Delivered
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {engagement.map((e) => (
                        <div key={e.name} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2" style={{ color: T.textMuted }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                            {e.name}
                          </span>
                          <span style={{ fontFamily: FONT.mono, color: T.text }} className="font-medium">
                            {formatNumber(e.value)} <span style={{ color: T.textFaint }}>· {Math.round((e.value / engagementTotal) * 100)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent campaigns + queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Recent campaigns</h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>Your latest {recentCampaigns.length}</p>
                </div>
                <button
                  onClick={() => navigate('/user/campaign')}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:text-white"
                  style={{ color: T.brand }}
                >
                  View all <ChevronRight size={11} />
                </button>
              </div>

              {campaignsLoading && recentCampaigns.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: T.brand, borderTopColor: 'transparent' }} />
                  <p className="text-[11px] mt-2" style={{ color: T.textFaint }}>Loading…</p>
                </div>
              ) : recentCampaigns.length === 0 ? (
                <div className="py-14 text-center">
                  <Inbox size={20} className="mx-auto mb-2" style={{ color: T.border }} />
                  <p className="text-[12px]" style={{ color: T.textFaint }}>No campaigns yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 620 }}>
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>
                        <th className="px-4 md:px-5 py-2.5 font-medium">Campaign</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium text-right">Recipients</th>
                        <th className="px-3 py-2.5 font-medium text-right">Sent</th>
                        <th className="px-4 md:px-5 py-2.5 font-medium text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCampaigns.map((c: any) => {
                        const s = CAMPAIGN_STATUS_STYLE[c.status] ?? CAMPAIGN_STATUS_STYLE.Draft
                        const rCount = c.recipients?.length ?? 0
                        const cStat = campaignStatsById.get(c.id) ?? { sent: 0, failed: 0 }
                        return (
                          <tr
                            key={c.id}
                            className="cursor-pointer transition-colors hover:bg-white/3"
                            style={{ borderTop: `1px solid ${T.borderSoft}` }}
                            onClick={() => navigate('/user/campaign')}
                          >
                            <td className="px-4 md:px-5 py-3">
                              <p className="text-[12.5px] font-medium truncate max-w-55" style={{ color: T.text }}>
                                {c.campaign_name}
                              </p>
                              <p className="text-[11px] truncate max-w-55 mt-0.5" style={{ color: T.textFaint }}>
                                {c.subject || '—'}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                                style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                              >
                                <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
                                {s.label}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right text-[11.5px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                              {formatNumber(rCount)}
                            </td>
                            <td className="px-3 py-3 text-right text-[11.5px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                              {formatNumber(cStat.sent)}
                            </td>
                            <td className="px-4 md:px-5 py-3 text-right text-[11px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {formatRelative(c.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Queue monitor" hint="Your send throughput" />
              <div className="px-4 md:px-5 pb-4">
                <div className="space-y-1.5">
                  {queueActivity.map(({ label, value, icon: Icon, tone, soft }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ background: soft, color: tone }}
                        >
                          <Icon size={12} />
                        </div>
                        <span className="text-[12px]" style={{ color: T.textMuted }}>{label}</span>
                      </div>
                      <span className="text-[12.5px] font-semibold" style={{ color: T.text, fontFamily: FONT.mono }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: T.textFaint }}>
                    <span>Pending share</span>
                    <span className="font-medium" style={{ color: T.textMuted, fontFamily: FONT.mono }}>{queueLoadPct}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${queueLoadPct}%`, background: T.brand }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Pulse + sender health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Mail pulse"
                hint="Latest events from your campaigns"
                right={
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, fontFamily: FONT.mono }}
                  >
                    <Activity size={10} /> live
                  </span>
                }
              />
              <div className="px-4 md:px-5 pb-4 relative">
                {pulseEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No events yet</p>
                  </div>
                ) : (
                  <>
                    <span className="absolute left-6 md:left-7 top-2 bottom-6 w-px" style={{ background: T.borderSoft }} />
                    <div className="space-y-3 relative">
                      {pulseEvents.map((e, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span
                            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                            style={{ background: pulseDotColor[e.tone], boxShadow: `0 0 0 3px ${pulseDotColor[e.tone]}25` }}
                          />
                          <span className="text-[11.5px] md:text-[12px] leading-relaxed" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {e.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Sender account health" hint="Today's volume per sender" />
              <div className="px-4 md:px-5 pb-4 space-y-3">
                {senderHealth.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShieldCheck size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No sender accounts</p>
                  </div>
                ) : (
                  senderHealth.map((a) => {
                    const meta = accountStatusMeta[a.status]
                    const Icon = meta.icon
                    const barColor = a.load >= 80 ? T.danger : a.load >= 60 ? T.warn : T.success
                    return (
                      <div key={a.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                              style={{ background: meta.bg, color: meta.fg }}
                            >
                              <Icon size={12} />
                            </div>
                            <span className="text-[12px] truncate" style={{ color: T.textMuted }}>{a.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold shrink-0" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {a.load}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${a.load}%`, background: barColor }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard