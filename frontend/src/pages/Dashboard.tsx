import { useMemo } from 'react'
import Sidebar from './Sidebar'
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

// ---- Mock data -----------------------------------------------------
const stats = [
  { label: 'Emails Sent Today', value: '12,480', delta: '+8.2%', trend: 'up', icon: Send, tint: 'sky' },
  { label: 'Delivery Rate', value: '98.4%', delta: '+0.6%', trend: 'up', icon: CheckCircle2, tint: 'emerald' },
  { label: 'Active Recipients', value: '34,920', delta: '+412', trend: 'up', icon: Users, tint: 'violet' },
  { label: 'Bounced / Failed', value: '186', delta: '-3.1%', trend: 'down', icon: XCircle, tint: 'red' },
]

const tintClasses: Record<string, { bg: string; fg: string }> = {
  sky: { bg: 'bg-sky-50', fg: 'text-sky-600' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', fg: 'text-violet-600' },
  red: { bg: 'bg-red-50', fg: 'text-red-600' },
}

const recentCampaigns = [
  { name: 'August Product Update', status: 'Sent', recipients: '8,240', opened: '61%', sentAt: 'Today, 9:02 AM' },
  { name: 'Weekly Digest #34', status: 'Sent', recipients: '12,900', opened: '48%', sentAt: 'Yesterday, 6:00 PM' },
  { name: 'Onboarding — Day 3', status: 'Queued', recipients: '1,120', opened: '—', sentAt: 'Scheduled 4:00 PM' },
  { name: 'Cart Abandonment Reminder', status: 'Sent', recipients: '3,450', opened: '39%', sentAt: 'Aug 9, 11:20 AM' },
  { name: 'Beta Access Invite', status: 'Failed', recipients: '600', opened: '—', sentAt: 'Aug 8, 3:45 PM' },
]

const statusStyle: Record<string, string> = {
  Sent: 'bg-emerald-50 text-emerald-700',
  Queued: 'bg-amber-50 text-amber-700',
  Failed: 'bg-red-50 text-red-700',
}

const queueActivity = [
  { label: 'Processed', value: '9,340', icon: CheckCircle2, tone: 'text-emerald-600' },
  { label: 'In queue', value: '212', icon: Clock, tone: 'text-amber-600' },
  { label: 'Errors', value: '14', icon: AlertCircle, tone: 'text-red-600' },
]

const deliveryTrend = [
  { day: 'Jul 30', sent: 8400 }, { day: 'Jul 31', sent: 9100 }, { day: 'Aug 1', sent: 7800 },
  { day: 'Aug 2', sent: 10200 }, { day: 'Aug 3', sent: 11400 }, { day: 'Aug 4', sent: 9600 },
  { day: 'Aug 5', sent: 12800 }, { day: 'Aug 6', sent: 11100 }, { day: 'Aug 7', sent: 13400 },
  { day: 'Aug 8', sent: 10800 }, { day: 'Aug 9', sent: 12200 }, { day: 'Aug 10', sent: 14100 },
  { day: 'Aug 11', sent: 12480 },
]

const engagement = [
  { name: 'Opened', value: 48, color: '#0284c7' },
  { name: 'Clicked', value: 19, color: '#7c3aed' },
  { name: 'Bounced', value: 4, color: '#dc2626' },
  { name: 'Unopened', value: 29, color: '#e2e8f0' },
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
  Active: { icon: ShieldCheck, fg: 'text-emerald-600', bg: 'bg-emerald-50' },
  Warning: { icon: ShieldAlert, fg: 'text-amber-600', bg: 'bg-amber-50' },
  Disabled: { icon: ShieldX, fg: 'text-slate-400', bg: 'bg-slate-100' },
}

const pulseDotColor = { success: '#059669', pending: '#d97706', failed: '#dc2626' }

// ---- Component -----------------------------------------------------
const Dashboard = () => {
  const engagementTotal = useMemo(() => engagement.reduce((s, e) => s + e.value, 0), [])

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="px-8 py-7 max-w-[1320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1
                style={{ fontFamily: FONT.display, letterSpacing: '-0.01em' }}
                className="text-[24px] font-semibold text-slate-900"
              >
                Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Overview of your campaigns and delivery health</p>
            </div>
            <button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-sky-200">
              <Mail size={16} />
              New Campaign
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {stats.map(({ label, value, delta, trend, icon: Icon, tint }) => {
              const t = tintClasses[tint]
              return (
                <div
                  key={label}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center`}>
                      <Icon size={17} className={t.fg} />
                    </div>
                    <span
                      className={`flex items-center gap-0.5 text-[12px] font-medium ${
                        trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {delta}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONT.mono }} className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {value}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-1">{label}</p>
                </div>
              )
            })}
          </div>

          {/* Delivery trend + engagement breakdown */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800">
                  Delivery trend — last 13 days
                </h2>
                <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-slate-400">daily volume</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eef1f5" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: '#94a3b8', fontFamily: FONT.mono }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 10.5, fill: '#94a3b8', fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #eef1f5', fontFamily: FONT.mono, fontSize: 12 }} />
                    <Area type="monotone" dataKey="sent" stroke="#0284c7" strokeWidth={2} fill="url(#fillSent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800 mb-4">
                Engagement breakdown
              </h2>
              <div className="flex items-center gap-4">
                <div style={{ width: 110, height: 110 }} className="shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={engagement} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={2}>
                        {engagement.map((e) => (
                          <Cell key={e.name} fill={e.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {engagement.map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-[12.5px]">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                        {e.name}
                      </span>
                      <span style={{ fontFamily: FONT.mono }} className="font-medium text-slate-800">
                        {Math.round((e.value / engagementTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent campaigns + Queue monitor */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800">
                  Recent Campaigns
                </h2>
                <button className="text-[12.5px] font-medium text-sky-600 hover:text-sky-700">
                  View all
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5 font-medium">Campaign</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Recipients</th>
                    <th className="px-3 py-2.5 font-medium">Opened</th>
                    <th className="px-5 py-2.5 font-medium text-right">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((c) => (
                    <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 text-[13.5px] font-medium text-slate-800">{c.name}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[11.5px] font-medium px-2 py-1 rounded-md ${statusStyle[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-slate-600">{c.recipients}</td>
                      <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-slate-600">{c.opened}</td>
                      <td className="px-5 py-3 text-[12.5px] text-slate-400 text-right whitespace-nowrap">
                        {c.sentAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800 mb-4">
                Queue Monitor
              </h2>
              <div className="space-y-3">
                {queueActivity.map(({ label, value, icon: Icon, tone }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3.5 py-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={tone} />
                      <span className="text-[13px] text-slate-600">{label}</span>
                    </div>
                    <span style={{ fontFamily: FONT.mono }} className="text-[13.5px] font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-[12.5px] text-slate-500 mb-1.5">
                  <span>Queue load</span>
                  <span style={{ fontFamily: FONT.mono }} className="font-medium text-slate-700">72%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-sky-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Mail pulse + Sender account health */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CircleDot size={14} className="text-sky-600" />
                <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800">Mail pulse</h2>
                <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-slate-400">live</span>
              </div>
              <div className="space-y-2.5">
                {pulseEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full pulse-dot shrink-0"
                      style={{ background: pulseDotColor[e.status] }}
                    />
                    <span style={{ fontFamily: FONT.mono }} className="text-[12px] text-slate-600">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold text-slate-800 mb-4">
                Sender account health
              </h2>
              <div className="space-y-2.5">
                {senderAccounts.map((a) => {
                  const meta = accountStatusMeta[a.status]
                  const Icon = meta.icon
                  return (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-md ${meta.bg} flex items-center justify-center shrink-0`}>
                          <Icon size={13} className={meta.fg} />
                        </div>
                        <span className="text-[12.5px] text-slate-700 truncate">{a.name}</span>
                      </div>
                      <span style={{ fontFamily: FONT.mono }} className="text-[11.5px] text-slate-400 shrink-0 ml-2">
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