import React, { useState } from "react";
import Sidebar from "../User/Sidebar";
import {
  Building2, Users, DollarSign, Send, ArrowUpRight, ArrowDownRight,
  ShieldCheck, ShieldAlert, ShieldX, Activity, AlertTriangle, CheckCircle2,
  MoreHorizontal, Search, ExternalLink,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type SystemStatus = "Operational" | "Degraded" | "Down";
type WorkspacePlan = "Free" | "Pro" | "Business" | "Enterprise";

interface StatCard {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}

interface SystemComponent {
  name: string;
  status: SystemStatus;
  latency: string;
}

interface Workspace {
  id: string;
  name: string;
  plan: WorkspacePlan;
  emailsSent: number;
  seats: number;
  mrr: string;
  joined: string;
}

interface Signup {
  name: string;
  email: string;
  plan: WorkspacePlan;
  time: string;
}

interface Incident {
  title: string;
  severity: "Critical" | "Warning" | "Resolved";
  time: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const stats: StatCard[] = [
  { title: "Total workspaces", value: "1,842", delta: "+64 this month", trend: "up", icon: Building2, accent: "#2F6FED", accentSoft: "#EAF0FE" },
  { title: "Monthly recurring revenue", value: "$128,940", delta: "+9.4%", trend: "up", icon: DollarSign, accent: "#1FA971", accentSoft: "#E6F7EF" },
  { title: "Active users (30d)", value: "9,204", delta: "+412", trend: "up", icon: Users, accent: "#7C3AED", accentSoft: "#F1EAFE" },
  { title: "Platform emails sent (24h)", value: "2.4M", delta: "-3.1%", trend: "down", icon: Send, accent: "#E8A23D", accentSoft: "#FDF3E4" },
];

const mrrTrend = [
  { month: "Feb", mrr: 96200 }, { month: "Mar", mrr: 101400 }, { month: "Apr", mrr: 104800 },
  { month: "May", mrr: 109600 }, { month: "Jun", mrr: 114200 }, { month: "Jul", mrr: 121800 },
  { month: "Aug", mrr: 128940 },
];

const planDistribution = [
  { name: "Free", value: 1120, color: "#CBD5E1" },
  { name: "Pro", value: 480, color: "#2F6FED" },
  { name: "Business", value: 196, color: "#7C3AED" },
  { name: "Enterprise", value: 46, color: "#1FA971" },
];

const systemComponents: SystemComponent[] = [
  { name: "API", status: "Operational", latency: "142ms" },
  { name: "Sending queue", status: "Operational", latency: "890ms" },
  { name: "Webhook delivery", status: "Degraded", latency: "3.1s" },
  { name: "Template renderer", status: "Operational", latency: "58ms" },
  { name: "Import pipeline", status: "Operational", latency: "1.4s" },
];

const STATUS_META: Record<SystemStatus, { bg: string; fg: string; icon: React.ElementType }> = {
  Operational: { bg: "bg-emerald-50", fg: "text-emerald-600", icon: ShieldCheck },
  Degraded: { bg: "bg-amber-50", fg: "text-amber-600", icon: ShieldAlert },
  Down: { bg: "bg-rose-50", fg: "text-rose-600", icon: ShieldX },
};

const topWorkspaces: Workspace[] = [
  { id: "w1", name: "Nimbus Retail", plan: "Enterprise", emailsSent: 482000, seats: 24, mrr: "$1,840", joined: "Jan 2025" },
  { id: "w2", name: "VentureHub Co", plan: "Business", emailsSent: 214000, seats: 12, mrr: "$620", joined: "Mar 2025" },
  { id: "w3", name: "BrightPath Org", plan: "Business", emailsSent: 198500, seats: 9, mrr: "$620", joined: "Nov 2024" },
  { id: "w4", name: "Driftlabs Dev", plan: "Pro", emailsSent: 96200, seats: 4, mrr: "$149", joined: "May 2025" },
  { id: "w5", name: "Meridian Corp", plan: "Enterprise", emailsSent: 388000, seats: 31, mrr: "$1,840", joined: "Aug 2024" },
];

const PLAN_STYLE: Record<WorkspacePlan, { bg: string; fg: string }> = {
  Free: { bg: "bg-slate-100", fg: "text-slate-600" },
  Pro: { bg: "bg-blue-50", fg: "text-blue-700" },
  Business: { bg: "bg-violet-50", fg: "text-violet-700" },
  Enterprise: { bg: "bg-emerald-50", fg: "text-emerald-700" },
};

const recentSignups: Signup[] = [
  { name: "Lumenstack Inc", email: "priya.nair@lumenstack.io", plan: "Pro", time: "12 min ago" },
  { name: "Stackline App", email: "devon@stackline.app", plan: "Free", time: "48 min ago" },
  { name: "Forgeworks", email: "liam.oconnor@forgeworks.com", plan: "Business", time: "2 hr ago" },
  { name: "Solstice Media", email: "hello@solsticemedia.com", plan: "Free", time: "5 hr ago" },
];

const incidents: Incident[] = [
  { title: "Webhook delivery latency elevated", severity: "Warning", time: "18 min ago" },
  { title: "EU sending region queue backlog cleared", severity: "Resolved", time: "3 hr ago" },
  { title: "Elevated bounce rate on shared IP pool 3", severity: "Warning", time: "6 hr ago" },
];

const INCIDENT_STYLE: Record<Incident["severity"], { bg: string; fg: string; icon: React.ElementType }> = {
  Critical: { bg: "bg-rose-50", fg: "text-rose-600", icon: AlertTriangle },
  Warning: { bg: "bg-amber-50", fg: "text-amber-600", icon: AlertTriangle },
  Resolved: { bg: "bg-emerald-50", fg: "text-emerald-600", icon: CheckCircle2 },
};

const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminDashboard = () => {
  const [range, setRange] = useState(RANGES[1]);
  const planTotal = planDistribution.reduce((s, p) => s + p.value, 0);

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50">
      <style>{`
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Admin Dashboard
              </h1>
              <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-violet-50 text-violet-700">
                Super Admin
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Platform-wide oversight across all workspaces and system health.
            </p>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-slate-600 outline-none w-full sm:w-auto"
          >
            {RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-white p-4 md:p-5 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={14} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] md:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.delta}
                  </span>
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-slate-900 font-mono">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-600">
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* MRR trend + Plan distribution */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white p-4 md:p-6 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                Revenue growth
              </h2>
              <span className="text-[10px] md:text-[11px] text-slate-500 font-mono">
                MRR, last 7 months
              </span>
            </div>
            <div className="h-[180px] md:h-[220px] mt-3 md:mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1FA971" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1FA971" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E7E8EC" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8F9C", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8A8F9C", fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#1FA971" strokeWidth={2} fill="url(#fillMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 md:p-6 border border-slate-200">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
              Plan distribution
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <div className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planDistribution} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2}>
                      {planDistribution.map((p) => (
                        <Cell key={p.name} fill={p.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5 md:space-y-2">
                {planDistribution.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-[11px] md:text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-medium text-slate-900 font-mono">
                      {Math.round((p.value / planTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System health + Incidents */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white p-4 md:p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Activity size={14} className="text-blue-600" />
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                System health
              </h2>
            </div>
            <div className="space-y-2 md:space-y-2.5">
              {systemComponents.map((c) => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <div
                    key={c.name}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 md:px-3.5 py-2.5 md:py-3 bg-slate-50"
                  >
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className={`flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md ${meta.bg}`}>
                        <Icon size={12} className={meta.fg} />
                      </div>
                      <span className="text-[11px] md:text-[13px] text-slate-600">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-[10px] md:text-[11.5px] text-slate-500 font-mono">
                        {c.latency}
                      </span>
                      <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${meta.bg} ${meta.fg}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 md:p-6 border border-slate-200">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
              Recent incidents
            </h2>
            <div className="space-y-2.5 md:space-y-3">
              {incidents.map((inc, i) => {
                const meta = INCIDENT_STYLE[inc.severity];
                const Icon = meta.icon;
                return (
                  <div key={i} className="flex items-start gap-2 md:gap-2.5">
                    <div className={`flex h-5 w-5 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-md mt-0.5 ${meta.bg}`}>
                      <Icon size={11} className={meta.fg} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] md:text-[12.5px] leading-snug text-slate-600">{inc.title}</p>
                      <p className="text-[10px] md:text-[11px] mt-0.5 text-slate-500 font-mono">
                        {inc.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top workspaces + Recent signups */}
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Top workspaces by volume
              </h2>
              <div className="flex items-center gap-2 rounded-lg px-2 md:px-3 py-1 md:py-1.5 border border-slate-200 bg-slate-50">
                <Search size={12} className="text-slate-500" />
                <input
                  placeholder="Search workspaces"
                  className="bg-transparent text-xs outline-none text-slate-600 w-[100px] md:w-[120px]"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 md:px-5 py-2 md:py-2.5 font-medium">Workspace</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Plan</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">Emails sent</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 font-medium">MRR</th>
                    <th className="px-3 md:px-5 py-2 md:py-2.5 font-medium w-10" />
                  </tr>
                </thead>
                <tbody>
                  {topWorkspaces.map((w, i) => {
                    const plan = PLAN_STYLE[w.plan];
                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition" style={{ borderTop: i === 0 ? "none" : "1px solid #E7E8EC" }}>
                        <td className="px-3 md:px-5 py-2.5 md:py-3">
                          <p className="text-[12px] md:text-[13.5px] font-medium text-slate-900">{w.name}</p>
                          <p className="text-[10px] md:text-[11px] text-slate-500 font-mono">
                            {w.seats} seats · joined {w.joined}
                          </p>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3">
                          <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${plan.bg} ${plan.fg}`}>
                            {w.plan}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 text-[11px] md:text-[13px] text-slate-600 font-mono">
                          {w.emailsSent.toLocaleString()}
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 text-[11px] md:text-[13px] text-slate-600 font-mono">
                          {w.mrr}
                        </td>
                        <td className="px-3 md:px-5 py-2.5 md:py-3 text-right">
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 md:p-5 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent signups
              </h2>
              <button className="flex items-center gap-1 text-[10px] md:text-[11.5px] font-medium text-blue-600 hover:text-blue-700">
                View all
                <ExternalLink size={10} />
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {recentSignups.map((s) => {
                const plan = PLAN_STYLE[s.plan];
                return (
                  <div key={s.email} className="flex items-center justify-between gap-2 px-4 md:px-5 py-3 md:py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] md:text-[13px] font-medium truncate text-slate-900">{s.name}</p>
                      <p className="text-[10px] md:text-[11.5px] truncate text-slate-500">{s.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 md:gap-1 shrink-0 ml-2">
                      <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10.5px] font-medium ${plan.bg} ${plan.fg}`}>
                        {s.plan}
                      </span>
                      <span className="text-[9px] md:text-[10.5px] text-slate-500 font-mono">
                        {s.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;