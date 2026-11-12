// src/pages/User/UserDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

import { useCampaigns } from '../../contexts/CampaignContext'
import { EmailLogsContext } from '../../contexts/EmaillogsContext'
import { SenderAccContext } from '../../contexts/SenderAccountsContext'

import {
  Mail, Send, Users, AlertCircle,
  Clock, CheckCircle2, XCircle, ShieldCheck, ShieldAlert,
  ShieldX, Menu, ChevronRight, Activity, RefreshCw, Inbox,
} from 'lucide-react'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:         '#0B0C0E',
  surface:    '#111214',
  surface2:   '#16181B',
  surfaceHi:  '#1C1F23',
  border:     '#24282E',
  borderSoft: '#1B1E22',

  text:       '#E8EAED',
  textMuted:  '#9AA0A6',
  textFaint:  '#6B7075',

  accent:     '#6EE7A8',
  accentInk:  '#0B0C0E',
  accentLine: '#2E6B4D',

  ok:         '#6EE7A8',
  warn:       '#E0A64A',
  danger:     '#E06A6A',

  ring:       '1px solid #24282E',
}

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
}

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

const CAMPAIGN_STATUS_STYLE: Record<string, { fg: string; dot: string; label: string }> = {
  Draft:     { fg: T.textMuted, dot: T.textFaint, label: 'Draft' },
  Ready:     { fg: T.textMuted, dot: T.textFaint, label: 'Ready' },
  Running:   { fg: T.ok,        dot: T.ok,        label: 'Running' },
  Paused:    { fg: T.warn,      dot: T.warn,      label: 'Paused' },
  Completed: { fg: T.textMuted, dot: T.textFaint, label: 'Completed' },
  Cancelled: { fg: T.danger,    dot: T.danger,    label: 'Cancelled' },
}

const accountStatusMeta = {
  Active:   { icon: ShieldCheck, fg: T.ok },
  Warning:  { icon: ShieldAlert, fg: T.warn },
  Disabled: { icon: ShieldX,     fg: T.textFaint },
}

const pulseDotColor = {
  success: T.ok,
  pending: T.warn,
  failed:  T.danger,
}

/* ─────────────── shells ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className = '', style,
}) => (
  <div
    className={`rounded-xl ${className}`}
    style={{ background: T.surface, border: T.ring, ...style }}
  >
    {children}
  </div>
)

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-6 pt-5 pb-3">
    <div>
      <h2 className="text-[13.5px] font-medium" style={{ color: T.text }}>{title}</h2>
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

  // FIX: strict filter — sirf wahi logs jo user ki apni campaigns ke hain.
  // Pehle: campaigns na hone par saare logs return hote the, aur campaign id
  // undefined wale logs bhi pass ho jaate the (admin ka data leak).
  const myLogs = useMemo(() => {
    if (myCampaignIds.size === 0) return []
    return emaillogs.filter((l: any) => {
      const cid = l.campaign_id ?? l.campaign?.id
      return cid !== undefined && cid !== null && myCampaignIds.has(cid)
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
      { name: 'Sent',    value: stats.sent,    color: T.ok },
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
    { label: 'Processed', value: formatNumber(stats.sent),    icon: CheckCircle2, tone: T.ok },
    { label: 'In queue',  value: formatNumber(stats.pending), icon: Clock,        tone: T.warn },
    { label: 'Errors',    value: formatNumber(stats.failed),  icon: AlertCircle,  tone: T.danger },
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

  // FIX: sirf wahi sender accounts dikhao jo user ke apne logs mein use hue hain.
  // Pehle saare accounts (admin ke bhi) dikh rahe the.
  const mySenderAcc = useMemo(() => {
    const ids = new Set(
      myLogs
        .map((l: any) => l.sender_account_id ?? l.sender_account?.id)
        .filter((id: any) => id !== undefined && id !== null)
    )
    return senderAcc.filter((a: any) => ids.has(a.id))
  }, [senderAcc, myLogs])

  const senderHealth = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return mySenderAcc.slice(0, 4).map((a: any) => {
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
  }, [mySenderAcc, myLogs])

  const statCards = [
    { label: 'Emails sent',       value: formatNumber(stats.sent),                    meta: `of ${formatNumber(stats.total)} events`,  icon: Send },
    { label: 'Delivery rate',     value: `${stats.deliveryRate}%`,                    meta: stats.deliveryRate >= 95 ? 'healthy' : 'check failures', icon: CheckCircle2 },
    { label: 'Recipients reached', value: formatNumber(stats.totalRecipients),        meta: `${formatNumber(myCampaigns.length)} campaigns`,       icon: Users },
    { label: 'Bounced / failed',  value: formatNumber(stats.failed),                  meta: `${formatNumber(stats.pending)} pending`,             icon: XCircle },
  ]

  const runningCount = myCampaigns.filter((c: any) => c.status === 'Running').length

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .db-main::-webkit-scrollbar { width: 8px; }
        .db-main::-webkit-scrollbar-track { background: transparent; }
        .db-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .db-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 4px; }

        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(11,12,14,0.72)' }}
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
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1320 }}>

          {/* Context bar */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-120"
                style={{ background: T.surface, color: T.textMuted, border: T.ring }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: runningCount > 0 ? T.ok : T.textFaint, boxShadow: `0 0 0 2px ${runningCount > 0 ? T.accentLine + '33' : 'transparent'}` }}
                    />
                    {runningCount} running
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {formatNumber(myCampaigns.length)} campaigns
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Dashboard
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Delivery health, engagement and queue status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-120 disabled:opacity-60"
                style={{ color: T.textMuted, border: T.ring }}
              >
                <RefreshCw size={13} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/user/campaign')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] transition-colors duration-120"
                style={{ background: T.text, color: T.accentInk, border: '1px solid ' + T.text }}
              >
                <Mail size={14} />
                New campaign
              </button>
            </div>
          </header>

          {error && (
            <div
              className="mb-6 rounded-md px-3.5 py-3 text-[12.5px]"
              style={{ color: T.danger, border: `1px solid ${T.border}` }}
            >
              {error}
            </div>
          )}

          {/* Stat row */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, meta, icon: Icon }) => (
              <Card key={label} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={14} style={{ color: T.textFaint }} />
                  <span className="text-[12px]" style={{ color: T.textMuted }}>{label}</span>
                </div>
                <p
                  className="text-[26px] font-medium leading-none tabular-nums"
                  style={{ color: T.text, fontFamily: FONT.mono }}
                >
                  {value}
                </p>
                <p className="text-[11.5px] mt-2.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  {meta}
                </p>
              </Card>
            ))}
          </div>

          {/* Trend + log status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Delivery trend"
                hint="Last 14 days"
                right={
                  <span className="inline-flex items-center gap-2 text-[11.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                    {formatNumber(trendTotalToday)} today
                  </span>
                }
              />
              <div className="px-3 md:px-4 pb-4" style={{ height: 220 }}>
                {loading && deliveryTrend.every((d) => d.sent === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.border, borderTopColor: T.accent }} />
                  </div>
                ) : deliveryTrend.some((d) => d.sent > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={T.borderSoft} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ stroke: T.border, strokeDasharray: '2 4' }}
                        contentStyle={{
                          borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2,
                          fontFamily: FONT.mono, fontSize: 11, color: T.text,
                          boxShadow: '0 8px 24px -16px rgba(0,0,0,0.9)',
                        }}
                      />
                      <Area
                        type="monotone" dataKey="sent"
                        stroke={T.accent} strokeWidth={1.5}
                        fill={T.accentLine} fillOpacity={0.14}
                        activeDot={{ r: 3, fill: T.accent, stroke: T.bg, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity size={16} className="mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No email activity yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Log status" hint="Share of send outcomes" />
              <div className="px-5 md:px-6 pb-5">
                {stats.total === 0 ? (
                  <div className="py-10 text-center">
                    <Activity size={16} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No logs yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={engagement} dataKey="value"
                            innerRadius={46} outerRadius={56}
                            paddingAngle={0} stroke={T.bg} strokeWidth={2}
                          >
                            {engagement.map((e) => (
                              <Cell key={e.name} fill={e.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className="text-[20px] font-medium leading-none tabular-nums"
                          style={{ color: T.text, fontFamily: FONT.mono }}
                        >
                          {deliveredPct}%
                        </span>
                        <span className="text-[10px] mt-1.5" style={{ color: T.textFaint }}>
                          delivered
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
                          <span className="tabular-nums" style={{ fontFamily: FONT.mono, color: T.text }}>
                            {formatNumber(e.value)}
                            <span style={{ color: T.textFaint }}> · {Math.round((e.value / engagementTotal) * 100)}%</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2 overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-5 md:px-6 py-4"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div>
                  <h2 className="text-[13.5px] font-medium" style={{ color: T.text }}>Recent campaigns</h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>Your latest {recentCampaigns.length}</p>
                </div>
                <button
                  onClick={() => navigate('/user/campaign')}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors duration-120"
                  style={{ color: T.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>

              {campaignsLoading && recentCampaigns.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: T.border, borderTopColor: T.accent }} />
                  <p className="text-[11px] mt-2" style={{ color: T.textFaint }}>Loading</p>
                </div>
              ) : recentCampaigns.length === 0 ? (
                <div className="py-14 text-center">
                  <Inbox size={16} className="mx-auto mb-2" style={{ color: T.border }} />
                  <p className="text-[12px]" style={{ color: T.textFaint }}>No campaigns yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 620 }}>
                    <thead>
                      <tr className="text-[11px]" style={{ color: T.textFaint }}>
                        <th className="px-5 md:px-6 py-2.5 font-normal">Campaign</th>
                        <th className="px-3 py-2.5 font-normal">Status</th>
                        <th className="px-3 py-2.5 font-normal text-right">Recipients</th>
                        <th className="px-3 py-2.5 font-normal text-right">Sent</th>
                        <th className="px-5 md:px-6 py-2.5 font-normal text-right">Created</th>
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
                            className="cursor-pointer transition-colors duration-120"
                            style={{ borderTop: `1px solid ${T.borderSoft}` }}
                            onClick={() => navigate('/user/campaign')}
                            onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="px-5 md:px-6 py-3">
                              <p className="text-[12.5px] font-medium truncate max-w-56" style={{ color: T.text }}>
                                {c.campaign_name}
                              </p>
                              <p className="text-[11px] truncate max-w-56 mt-0.5" style={{ color: T.textFaint }}>
                                {c.subject || '—'}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-2 text-[11.5px]" style={{ color: s.fg }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                                {s.label}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                              {formatNumber(rCount)}
                            </td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                              {formatNumber(cStat.sent)}
                            </td>
                            <td className="px-5 md:px-6 py-3 text-right text-[11.5px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
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
              <div className="px-5 md:px-6 pb-5">
                <div className="space-y-1">
                  {queueActivity.map(({ label, value, icon: Icon, tone }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={13} style={{ color: tone }} />
                        <span className="text-[12px]" style={{ color: T.textMuted }}>{label}</span>
                      </div>
                      <span className="text-[12.5px] font-medium tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11.5px] mb-2">
                    <span style={{ color: T.textFaint }}>Pending share</span>
                    <span className="tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>{queueLoadPct}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div
                      className="h-full rounded-full transition-colors duration-200"
                      style={{ width: `${queueLoadPct}%`, background: T.accent }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Pulse + sender health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Mail pulse"
                hint="Latest events from your campaigns"
                right={
                  <span className="inline-flex items-center gap-2 text-[11.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                    live
                  </span>
                }
              />
              <div className="px-5 md:px-6 pb-5">
                {pulseEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity size={16} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No events yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pulseEvents.map((e, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: pulseDotColor[e.tone] }}
                        />
                        <span
                          className="text-[12px] leading-relaxed"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}
                        >
                          {e.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Sender account health" hint="Today's volume per sender" />
              <div className="px-5 md:px-6 pb-5 space-y-3.5">
                {senderHealth.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShieldCheck size={16} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No sender accounts</p>
                  </div>
                ) : (
                  senderHealth.map((a) => {
                    const meta = accountStatusMeta[a.status]
                    const Icon = meta.icon
                    return (
                      <div key={a.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon size={13} className="shrink-0" style={{ color: meta.fg }} />
                            <span className="text-[12px] truncate" style={{ color: T.textMuted }}>{a.name}</span>
                          </div>
                          <span className="text-[11.5px] font-medium shrink-0 tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {a.load}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                          <div
                            className="h-full rounded-full transition-colors duration-200"
                            style={{ width: `${a.load}%`, background: a.load >= 80 ? T.danger : a.load >= 60 ? T.warn : T.ok }}
                          />
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