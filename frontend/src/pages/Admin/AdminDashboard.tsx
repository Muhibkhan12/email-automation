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
  { title: "Total workspaces", value: "1,842", delta: "+64 this month", trend: "up", icon: Building2, accent: "#FF6A39", accentSoft: "rgba(255,106,57,0.12)" },
  { title: "Active users (30d)", value: "9,204", delta: "+412", trend: "up", icon: Users, accent: "#FFC24B", accentSoft: "rgba(255,194,75,0.12)" },
  { title: "Platform emails sent (24h)", value: "2.4M", delta: "-3.1%", trend: "down", icon: Send, accent: "#FF5C6C", accentSoft: "rgba(255,92,108,0.12)" },
  { title: "System health", value: "98.4%", delta: "+0.6%", trend: "up", icon: CheckCircle2, accent: "#7FD98A", accentSoft: "rgba(127,217,138,0.12)" },
];

const planDistribution = [
  { name: "Free", value: 1120, color: "#2A2E37" },
  { name: "Pro", value: 480, color: "#FF6A39" },
  { name: "Business", value: 196, color: "#FFC24B" },
  { name: "Enterprise", value: 46, color: "#7FD98A" },
];

const systemComponents: SystemComponent[] = [
  { name: "API", status: "Operational", latency: "142ms" },
  { name: "Sending queue", status: "Operational", latency: "890ms" },
  { name: "Webhook delivery", status: "Degraded", latency: "3.1s" },
  { name: "Template renderer", status: "Operational", latency: "58ms" },
  { name: "Import pipeline", status: "Operational", latency: "1.4s" },
];

const STATUS_META: Record<SystemStatus, { bg: string; fg: string; icon: React.ElementType }> = {
  Operational: { bg: "bg-emerald-500/15", fg: "text-emerald-400", icon: ShieldCheck },
  Degraded: { bg: "bg-amber-500/15", fg: "text-amber-400", icon: ShieldAlert },
  Down: { bg: "bg-rose-500/15", fg: "text-rose-400", icon: ShieldX },
};

const topWorkspaces: Workspace[] = [
  { id: "w1", name: "Nimbus Retail", plan: "Enterprise", emailsSent: 482000, seats: 24, mrr: "$1,840", joined: "Jan 2025" },
  { id: "w2", name: "VentureHub Co", plan: "Business", emailsSent: 214000, seats: 12, mrr: "$620", joined: "Mar 2025" },
  { id: "w3", name: "BrightPath Org", plan: "Business", emailsSent: 198500, seats: 9, mrr: "$620", joined: "Nov 2024" },
  { id: "w4", name: "Driftlabs Dev", plan: "Pro", emailsSent: 96200, seats: 4, mrr: "$149", joined: "May 2025" },
  { id: "w5", name: "Meridian Corp", plan: "Enterprise", emailsSent: 388000, seats: 31, mrr: "$1,840", joined: "Aug 2024" },
];

const PLAN_STYLE: Record<WorkspacePlan, { bg: string; fg: string }> = {
  Free: { bg: "bg-slate-700/30", fg: "text-slate-400" },
  Pro: { bg: "bg-[#FF6A39]/15", fg: "text-[#FF6A39]" },
  Business: { bg: "bg-[#FFC24B]/15", fg: "text-[#FFC24B]" },
  Enterprise: { bg: "bg-[#7FD98A]/15", fg: "text-[#7FD98A]" },
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
  Critical: { bg: "bg-rose-500/15", fg: "text-rose-400", icon: AlertTriangle },
  Warning: { bg: "bg-amber-500/15", fg: "text-amber-400", icon: AlertTriangle },
  Resolved: { bg: "bg-emerald-500/15", fg: "text-emerald-400", icon: CheckCircle2 },
};

const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminDashboard = () => {
  const [range, setRange] = useState(RANGES[1]);
  const planTotal = planDistribution.reduce((s, p) => s + p.value, 0);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0E1013;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
        .mf-card:hover {
          border-color: #3A3F4A;
        }
        .mf-row:hover {
          background-color: #1B1E24;
        }
        .pulse-dot {
          animation: pulse-fade 1.8s ease-in-out infinite;
        }
        @keyframes pulse-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                Admin Dashboard
              </h1>
              <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                Super Admin
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-[#8B8D94]">
              Platform-wide oversight across all workspaces and system health.
            </p>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-[#C7C9CE] outline-none w-full sm:w-auto focus:border-[#FF6A39]"
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
                className="rounded-xl bg-[#171A21] p-4 md:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
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
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.delta}
                  </span>
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* System health + Incidents */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-[#171A21] p-4 md:p-6 border border-[#2A2E37]">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Activity size={14} className="text-[#FF6A39]" />
              <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
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
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 md:px-3.5 py-2.5 md:py-3 bg-[#0E1013]"
                  >
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className={`flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md ${meta.bg}`}>
                        <Icon size={12} className={meta.fg} />
                      </div>
                      <span className="text-[11px] md:text-[13px] text-[#C7C9CE]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-[10px] md:text-[11.5px] text-[#8B8D94] font-['JetBrains_Mono']">
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

          <div className="rounded-xl bg-[#171A21] p-4 md:p-6 border border-[#2A2E37]">
            <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk'] mb-3 md:mb-4">
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
                      <p className="text-[11px] md:text-[12.5px] leading-snug text-[#C7C9CE]">{inc.title}</p>
                      <p className="text-[10px] md:text-[11px] mt-0.5 text-[#8B8D94] font-['JetBrains_Mono']">
                        {inc.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Plan distribution + Top workspaces */}
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
          <div className="rounded-xl bg-[#171A21] p-4 md:p-6 border border-[#2A2E37]">
            <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk'] mb-3 md:mb-4">
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
                    <span className="flex items-center gap-1.5 text-[#C7C9CE]">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-medium text-[#E8E6E1] font-['JetBrains_Mono']">
                      {Math.round((p.value / planTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b border-[#2A2E37]">
              <h2 className="text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
                Top workspaces by volume
              </h2>
              <div className="flex items-center gap-2 rounded-lg px-2 md:px-3 py-1 md:py-1.5 border border-[#2A2E37] bg-[#0E1013]">
                <Search size={12} className="text-[#8B8D94]" />
                <input
                  placeholder="Search workspaces"
                  className="bg-transparent text-xs outline-none text-[#C7C9CE] w-[100px] md:w-[120px] placeholder:text-[#8B8D94]"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-[#8B8D94]">
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
                      <tr key={w.id} className="mf-row transition" style={{ borderTop: i === 0 ? "none" : "1px solid #2A2E37" }}>
                        <td className="px-3 md:px-5 py-2.5 md:py-3">
                          <p className="text-[12px] md:text-[13.5px] font-medium text-[#E8E6E1]">{w.name}</p>
                          <p className="text-[10px] md:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
                            {w.seats} seats · joined {w.joined}
                          </p>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3">
                          <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${plan.bg} ${plan.fg}`}>
                            {w.plan}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 text-[11px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                          {w.emailsSent.toLocaleString()}
                        </td>
                        <td className="px-2 md:px-3 py-2.5 md:py-3 text-[11px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                          {w.mrr}
                        </td>
                        <td className="px-3 md:px-5 py-2.5 md:py-3 text-right">
                          <button className="text-[#8B8D94] hover:text-[#E8E6E1]">
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
        </div>

        {/* Recent signups */}
        <div className="mt-4 md:mt-5 rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 md:p-5 border-b border-[#2A2E37]">
            <h2 className="text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
              Recent signups
            </h2>
            <button className="flex items-center gap-1 text-[10px] md:text-[11.5px] font-medium text-[#FF6A39] hover:text-[#FF7F52]">
              View all
              <ExternalLink size={10} />
            </button>
          </div>
          <div className="divide-y divide-[#2A2E37]">
            {recentSignups.map((s) => {
              const plan = PLAN_STYLE[s.plan];
              return (
                <div key={s.email} className="flex items-center justify-between gap-2 px-4 md:px-5 py-3 md:py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] md:text-[13px] font-medium truncate text-[#E8E6E1]">{s.name}</p>
                    <p className="text-[10px] md:text-[11.5px] truncate text-[#8B8D94]">{s.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 md:gap-1 shrink-0 ml-2">
                    <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10.5px] font-medium ${plan.bg} ${plan.fg}`}>
                      {s.plan}
                    </span>
                    <span className="text-[9px] md:text-[10.5px] text-[#8B8D94] font-['JetBrains_Mono']">
                      {s.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;