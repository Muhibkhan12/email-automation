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
} from 'lucide-react'

const stats = [
  {
    label: 'Emails Sent Today',
    value: '12,480',
    delta: '+8.2%',
    trend: 'up',
    icon: Send,
  },
  {
    label: 'Delivery Rate',
    value: '98.4%',
    delta: '+0.6%',
    trend: 'up',
    icon: CheckCircle2,
  },
  {
    label: 'Active Recipients',
    value: '34,920',
    delta: '+412',
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Bounced / Failed',
    value: '186',
    delta: '-3.1%',
    trend: 'down',
    icon: XCircle,
  },
]

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

const Dashboard = () => {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="px-8 py-7 max-w-[1200px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Overview of your campaigns and delivery health</p>
            </div>
            <button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-sky-200">
              <Mail size={16} />
              New Campaign
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-7">
            {stats.map(({ label, value, delta, trend, icon: Icon }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Icon size={17} className="text-sky-600" />
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
                <p className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</p>
                <p className="text-[13px] text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Recent campaigns table */}
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-[14px] font-semibold text-slate-800">Recent Campaigns</h2>
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
                      <td className="px-3 py-3 text-[13px] text-slate-600">{c.recipients}</td>
                      <td className="px-3 py-3 text-[13px] text-slate-600">{c.opened}</td>
                      <td className="px-5 py-3 text-[12.5px] text-slate-400 text-right whitespace-nowrap">
                        {c.sentAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Queue monitor snapshot */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-[14px] font-semibold text-slate-800 mb-4">Queue Monitor</h2>
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
                    <span className="text-[13.5px] font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-[12.5px] text-slate-500 mb-1.5">
                  <span>Queue load</span>
                  <span className="font-medium text-slate-700">72%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-sky-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard