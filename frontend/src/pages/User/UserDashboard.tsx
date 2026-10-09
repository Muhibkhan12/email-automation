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

/* ─────────────── tokens ─────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
}

const COLOR = {
  primary: '#FF6A39',
  primarySoft: 'rgba(255,106,57,0.12)',
  primaryRing: 'rgba(255,106,57,0.22)',
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
  blue: '#60A5FA',
  blueSoft: 'rgba(96,165,250,0.10)',
  blueRing: 'rgba(96,165,250,0.22)',
  violet: '#A78BFA',
  violetSoft: 'rgba(167,139,250,0.10)',
  violetRing: 'rgba(167,139,250,0.22)',
  dark: '#F2F0EB',
  bg: '#0B0E13',
  surface: '#141821',
  surfaceHover: '#11151E',
  inner: '#0F131C',
  border: '#1A1F2B',
  borderHover: '#232938',
  textMuted: '#7A8092',
  textBody: '#C7C9CE',
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

const CAMPAIGN_STATUS_STYLE: Record<
  string,
  { bg: string; fg: string; ring: string; label: string }
> = {
  Draft:     { bg: COLOR.neutralSoft, fg: COLOR.neutral, ring: COLOR.neutralRing, label: 'Draft' },
  Ready:     { bg: COLOR.blueSoft,    fg: COLOR.blue,    ring: COLOR.blueRing,    label: 'Ready' },
  Running:   { bg: COLOR.successSoft, fg: COLOR.success, ring: COLOR.successRing, label: 'Running' },
  Paused:    { bg: COLOR.warningSoft, fg: COLOR.warning, ring: COLOR.warningRing, label: 'Paused' },
  Completed: { bg: COLOR.violetSoft,  fg: COLOR.violet,  ring: COLOR.violetRing,  label: 'Completed' },
  Cancelled: { bg: COLOR.dangerSoft,  fg: COLOR.danger,  ring: COLOR.dangerRing,  label: 'Cancelled' },
}

const LOG_STATUS_META: Record<
  string,
  { bg: string; fg: string; ring: string }
> = {
  Sent:      { bg: COLOR.successSoft, fg: COLOR.success, ring: COLOR.successRing },
  Delivered: { bg: COLOR.successSoft, fg: COLOR.success, ring: COLOR.successRing },
  Pending:   { bg: COLOR.warningSoft, fg: COLOR.warning, ring: COLOR.warningRing },
  Queued:    { bg: COLOR.blueSoft,    fg: COLOR.blue,    ring: COLOR.blueRing },
  Sending:   { bg: COLOR.warningSoft, fg: COLOR.warning, ring: COLOR.warningRing },
  Failed:    { bg: COLOR.dangerSoft,  fg: COLOR.danger,  ring: COLOR.dangerRing },
  Bounced:   { bg: COLOR.dangerSoft,  fg: COLOR.danger,  ring: COLOR.dangerRing },
}

const accountStatusMeta = {
  Active:   { icon: ShieldCheck, fg: COLOR.success, bg: COLOR.successSoft, ring: COLOR.successRing },
  Warning:  { icon: ShieldAlert, fg: COLOR.warning, bg: COLOR.warningSoft, ring: COLOR.warningRing },
  Disabled: { icon: ShieldX,     fg: COLOR.neutral, bg: COLOR.neutralSoft, ring: COLOR.neutralRing },
}

const pulseDotColor = {
  success: COLOR.success,
  pending: COLOR.warning,
  failed:  COLOR.danger,
}

/* ─────────────── shared shells ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: 'linear-gradient(180deg, #141821 0%, #10141D 100%)' }}
  >
    {children}
  </div>
)

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4">
    <div>
      <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
        {title}
      </h2>
      {hint && <p className="text-[11.5px] mt-0.5" style={{ color: COLOR.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
)

/* ─────────────── component ─────────────── */

const UserDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  /* ───── data: this user's campaigns ───── */
  const {
    myCampaigns = [],
    myLoading: campaignsLoading,
    myError: campaignsError,
    fetchMine,
  } = useCampaigns()

  /* ───── data: email logs ───── */
  const emailLogsCtx = React.useContext(EmailLogsContext)
  const emaillogs = emailLogsCtx?.emaillogs ?? []
  const logsLoading = emailLogsCtx?.loading ?? false
  const logsError = emailLogsCtx?.error ?? null
  const refetchLogs = emailLogsCtx?.refetch

  /* ───── data: sender accounts ───── */
  const senderCtx = React.useContext(SenderAccContext)
  const senderAcc = senderCtx?.senderAcc ?? []
  const fetchAllSenderAccounts = senderCtx?.fetchAllSenderAccounts

  /* ───── initial fetch + refresh ───── */
  useEffect(() => {
    fetchMine?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([
        fetchMine?.(),
        refetchLogs?.(),
        fetchAllSenderAccounts?.(),
      ])
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const loading = campaignsLoading || logsLoading
  const error = campaignsError || logsError

  /* ───── restrict data to this user's campaigns ─────
     If your backend already returns only the user's logs (because
     fetchMine fetches campaigns and the logs endpoint is user-scoped),
     these filters are no-ops. If logs are global, the filters below
     narrow them to the user's own campaigns. */
  const myCampaignIds = useMemo(
    () => new Set(myCampaigns.map((c: any) => c.id)),
    [myCampaigns]
  )

  const myLogs = useMemo(() => {
    if (myCampaignIds.size === 0) return emaillogs
    return emaillogs.filter((l: any) => {
      // Log may carry campaign_id, or come through campaign shape
      const cid = l.campaign_id ?? l.campaign?.id
      return cid === undefined || myCampaignIds.has(cid)
    })
  }, [emaillogs, myCampaignIds])

  /* ───── derived stats ───── */
  const stats = useMemo(() => {
    const sent = myLogs.filter((l: any) => l.status === 'Sent').length
    const failed = myLogs.filter((l: any) => l.status === 'Failed').length
    const pending = myLogs.filter((l: any) => l.status === 'Pending').length

    const totalRecipients = myCampaigns.reduce(
      (sum: number, c: any) => sum + (c.recipients?.length ?? 0),
      0
    )

    const deliveryRate = myLogs.length
      ? Math.round((sent / myLogs.length) * 1000) / 10
      : 0

    return { sent, failed, pending, totalRecipients, deliveryRate, total: myLogs.length }
  }, [myLogs, myCampaigns])

  /* ───── 14-day trend from this user's logs ───── */
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

  /* ───── engagement pie — status split ───── */
  const engagement = useMemo(() => {
    const sent = stats.sent
    const pending = stats.pending
    const failed = stats.failed
    const total = sent + pending + failed || 1
    return [
      { name: 'Sent',    value: sent,    color: COLOR.success },
      { name: 'Pending', value: pending, color: COLOR.warning },
      { name: 'Failed',  value: failed,  color: COLOR.danger },
    ].map((e) => ({ ...e, pct: Math.round((e.value / total) * 100) }))
  }, [stats])

  const engagementTotal = useMemo(
    () => engagement.reduce((s, e) => s + e.value, 0) || 1,
    [engagement]
  )
  const deliveredPct = Math.round((stats.sent / (stats.total || 1)) * 100)

  /* ───── recent campaigns (5 newest of this user's) ───── */
  const recentCampaigns = useMemo(() => {
    return [...myCampaigns]
      .sort((a: any, b: any) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 5)
  }, [myCampaigns])

  /* ───── per-campaign sent / opened counts (from logs) ───── */
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

  /* ───── queue activity — computed from statuses ───── */
  const queueActivity = useMemo(() => {
    const processed = stats.sent
    const inQueue = stats.pending
    const errors = stats.failed
    return [
      { label: 'Processed', value: formatNumber(processed), icon: CheckCircle2, tone: COLOR.success },
      { label: 'In queue',  value: formatNumber(inQueue),   icon: Clock,        tone: COLOR.warning },
      { label: 'Errors',    value: formatNumber(errors),    icon: AlertCircle,  tone: COLOR.danger },
    ]
  }, [stats])

  const queueLoadPct = stats.total
    ? Math.min(100, Math.round((stats.pending / stats.total) * 100))
    : 0

  /* ───── mail pulse — latest 6 of the user's log events ───── */
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
          l.status === 'Sent' ? 'success' :
          l.status === 'Failed' ? 'failed' : 'pending'
        return {
          tone,
          text: `${who} — ${l.status ?? 'Pending'}${l.sent_at ? ` · ${formatRelative(l.sent_at)}` : ''}`,
        }
      })
  }, [myLogs])

  /* ───── sender account health — today's volume per sender ───── */
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
        a.is_active === false ? 'Disabled'
        : load >= 80 ? 'Warning'
        : 'Active'

      return {
        id: a.id,
        name: a.email || a.display_name || `account #${a.id}`,
        load,
        status,
      }
    })
  }, [senderAcc, myLogs])

  /* ───── top-line stat cards ───── */
  const statCards = [
    {
      label: 'Emails sent',
      value: formatNumber(stats.sent),
      delta: `${formatNumber(stats.total)} total events`,
      trend: 'up' as const,
      icon: Send,
      accent: COLOR.primary,
      accentSoft: COLOR.primarySoft,
    },
    {
      label: 'Delivery rate',
      value: `${stats.deliveryRate}%`,
      delta: stats.deliveryRate >= 95 ? 'healthy' : 'check failed',
      trend: stats.deliveryRate >= 95 ? ('up' as const) : ('down' as const),
      icon: CheckCircle2,
      accent: COLOR.success,
      accentSoft: COLOR.successSoft,
    },
    {
      label: 'Recipients reached',
      value: formatNumber(stats.totalRecipients),
      delta: `${myCampaigns.length} campaigns`,
      trend: 'up' as const,
      icon: Users,
      accent: COLOR.warning,
      accentSoft: COLOR.warningSoft,
    },
    {
      label: 'Bounced / failed',
      value: formatNumber(stats.failed),
      delta: `${formatNumber(stats.pending)} pending`,
      trend: stats.failed === 0 ? ('up' as const) : ('down' as const),
      icon: XCircle,
      accent: COLOR.danger,
      accentSoft: COLOR.dangerSoft,
    },
  ]

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: COLOR.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pulseFade { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .pulse-dot { animation: pulseFade 1.8s ease-in-out infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .db-main::-webkit-scrollbar { width: 10px; }
        .db-main::-webkit-scrollbar-track { background: transparent; }
        .db-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .db-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
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

      <main className="db-main flex-1 overflow-y-auto" style={{ background: COLOR.bg }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: '#141821' }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: COLOR.successSoft, color: COLOR.success, boxShadow: `inset 0 0 0 1px ${COLOR.successRing}` }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {myCampaigns.filter((c: any) => c.status === 'Running').length} running
                    </span>
                    <span className="text-[11px]" style={{ color: '#5A6172', fontFamily: FONT.mono }}>
                      · {formatNumber(myCampaigns.length)} campaigns
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: '-0.025em', color: COLOR.dark }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    Dashboard
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: COLOR.textMuted }}>
                    Delivery health, engagement, and queue status — at a glance.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: COLOR.surface, color: COLOR.textBody }}
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/user/campaign')}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] transition-all hover:-translate-y-0.5"
                  style={{ background: COLOR.primary, color: '#fff', boxShadow: '0 12px 30px -12px rgba(255,106,57,0.65)' }}
                >
                  <Mail size={16} />
                  New campaign
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </header>

            {error && (
              <div className="mb-5 rounded-2xl px-4 py-3 text-[12.5px]"
                style={{ background: COLOR.dangerSoft, color: COLOR.danger, boxShadow: `inset 0 0 0 1px ${COLOR.dangerRing}` }}>
                {error}
              </div>
            )}

            {/* ── Stat cards ── */}
            <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {statCards.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
                <Card key={label} className="p-4 md:p-5 float-in">
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
                        fontFamily: FONT.mono,
                      }}
                    >
                      {trend === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {delta}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[26px] font-bold tracking-tight leading-none">
                    {value}
                  </p>
                  <p className="text-[12px] mt-2" style={{ color: COLOR.textMuted }}>{label}</p>
                </Card>
              ))}
            </div>

            {/* ── Trend + engagement ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Delivery trend"
                  hint="Last 14 days · daily events"
                  right={
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`, fontFamily: FONT.mono }}>
                      <TrendingUp size={11} /> {formatNumber(trendTotalToday)} today
                    </span>
                  }
                />
                <div className="px-3 md:px-4 pb-4 md:pb-5" style={{ height: 220 }}>
                  {loading && deliveryTrend.every((d) => d.sent === 0) ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : deliveryTrend.some((d) => d.sent > 0) ? (
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
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ stroke: COLOR.borderHover, strokeDasharray: '3 3' }}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${COLOR.border}`,
                            background: '#141821',
                            fontFamily: FONT.mono,
                            fontSize: 11,
                            color: COLOR.dark,
                            boxShadow: '0 12px 30px -12px rgba(0,0,0,0.7)',
                          }}
                        />
                        <Area type="monotone" dataKey="sent" stroke={COLOR.primary} strokeWidth={2} fill="url(#fillSent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Activity size={22} className="mb-2" style={{ color: '#3A404F' }} />
                      <p className="text-[12px]" style={{ color: COLOR.textMuted }}>No email activity yet</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Log status" hint="Share of send outcomes" />
                <div className="px-4 md:px-5 pb-4 md:pb-5">
                  {stats.total === 0 ? (
                    <div className="py-10 text-center">
                      <Activity size={20} className="mx-auto mb-2" style={{ color: '#3A404F' }} />
                      <p className="text-[12px]" style={{ color: COLOR.textMuted }}>No logs yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={engagement} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                              {engagement.map((e) => (
                                <Cell key={e.name} fill={e.color} stroke="none" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[22px] font-bold leading-none">
                            {deliveredPct}%
                          </span>
                          <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: COLOR.textMuted }}>
                            Delivered
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2.5">
                        {engagement.map((e) => (
                          <div key={e.name} className="flex items-center justify-between text-[12px]">
                            <span className="flex items-center gap-2" style={{ color: COLOR.textBody }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: e.color, boxShadow: `0 0 6px ${e.color}` }} />
                              {e.name}
                            </span>
                            <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="font-medium">
                              {formatNumber(e.value)} <span style={{ color: COLOR.textMuted }}>· {Math.round((e.value / engagementTotal) * 100)}%</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ── Recent campaigns + queue ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                  <div>
                    <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                      Recent campaigns
                    </h2>
                    <p className="text-[11.5px] mt-0.5" style={{ color: COLOR.textMuted }}>
                      Your latest {recentCampaigns.length}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/user/campaign')}
                    className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors"
                    style={{ color: COLOR.primary }}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                </div>

                {campaignsLoading && recentCampaigns.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="w-6 h-6 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] mt-2" style={{ color: COLOR.textMuted }}>Loading…</p>
                  </div>
                ) : recentCampaigns.length === 0 ? (
                  <div className="py-14 text-center">
                    <Inbox size={22} className="mx-auto mb-2" style={{ color: '#3A404F' }} />
                    <p className="text-[12px]" style={{ color: COLOR.textMuted }}>No campaigns yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 620 }}>
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest" style={{ color: COLOR.textMuted }}>
                          <th className="px-4 md:px-6 py-3 font-medium">Campaign</th>
                          <th className="px-3 py-3 font-medium">Status</th>
                          <th className="px-3 py-3 font-medium text-right">Recipients</th>
                          <th className="px-3 py-3 font-medium text-right">Sent</th>
                          <th className="px-4 md:px-6 py-3 font-medium text-right">Created</th>
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
                              className="cursor-pointer transition-colors"
                              style={{ borderTop: `1px solid ${COLOR.border}` }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = COLOR.surfaceHover)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              onClick={() => navigate('/user/campaign')}
                            >
                              <td className="px-4 md:px-6 py-3.5">
                                <p className="text-[13px] font-medium truncate max-w-[220px]" style={{ color: COLOR.dark }}>
                                  {c.campaign_name}
                                </p>
                                <p className="text-[11px] truncate max-w-[220px]" style={{ color: COLOR.textMuted }}>
                                  {c.subject || '—'}
                                </p>
                              </td>
                              <td className="px-3 py-3.5">
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                  style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
                                  {s.label}
                                </span>
                              </td>
                              <td className="px-3 py-3.5 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                                {formatNumber(rCount)}
                              </td>
                              <td className="px-3 py-3.5 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                                {formatNumber(cStat.sent)}
                              </td>
                              <td className="px-4 md:px-6 py-3.5 text-right text-[11.5px] whitespace-nowrap" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
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
                <div className="px-4 md:px-5 pb-4 md:pb-5">
                  <div className="space-y-2">
                    {queueActivity.map(({ label, value, icon: Icon, tone }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
                        style={{ background: COLOR.inner, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
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
                      <span>Pending share</span>
                      <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="font-medium">{queueLoadPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: COLOR.inner }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${queueLoadPct}%`, background: `linear-gradient(90deg, ${COLOR.primary}, #FF8A5C)`, boxShadow: '0 0 10px rgba(255,106,57,0.5)' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Mail pulse + sender health ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Mail pulse"
                  hint="Latest events from your campaigns"
                  right={
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`, fontFamily: FONT.mono }}
                    >
                      <Activity size={11} /> live
                    </span>
                  }
                />
                <div className="px-4 md:px-5 pb-5 relative">
                  {pulseEvents.length === 0 ? (
                    <div className="py-8 text-center">
                      <Activity size={20} className="mx-auto mb-2" style={{ color: '#3A404F' }} />
                      <p className="text-[12px]" style={{ color: COLOR.textMuted }}>No events yet</p>
                    </div>
                  ) : (
                    <>
                      <span className="absolute left-[26px] md:left-[30px] top-2 bottom-6 w-px" style={{ background: COLOR.border }} />
                      <div className="space-y-3.5 relative">
                        {pulseEvents.map((e, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span
                              className="mt-1.5 w-2.5 h-2.5 rounded-full pulse-dot shrink-0"
                              style={{
                                background: pulseDotColor[e.tone],
                                boxShadow: `0 0 10px ${pulseDotColor[e.tone]}, 0 0 0 4px ${pulseDotColor[e.tone]}1A`,
                              }}
                            />
                            <span style={{ fontFamily: FONT.mono, color: COLOR.textBody }} className="text-[11.5px] md:text-[12.5px] leading-relaxed">
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
                <div className="px-4 md:px-5 pb-5 space-y-3">
                  {senderHealth.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShieldCheck size={20} className="mx-auto mb-2" style={{ color: '#3A404F' }} />
                      <p className="text-[12px]" style={{ color: COLOR.textMuted }}>No sender accounts</p>
                    </div>
                  ) : (
                    senderHealth.map((a) => {
                      const meta = accountStatusMeta[a.status]
                      const Icon = meta.icon
                      const barColor = a.load >= 80 ? COLOR.danger : a.load >= 60 ? COLOR.warning : COLOR.success
                      return (
                        <div key={a.id} className="space-y-1.5">
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
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard