// AdminDashboard.tsx
import React, { useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Building2, Users, Send, ArrowUpRight, ArrowDownRight,
  ShieldCheck, ShieldAlert, ShieldX, Activity, AlertTriangle,
  CheckCircle2, MoreHorizontal, Search, ExternalLink, Menu,
  ChevronRight, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ─────────────────────────── Tokens ─────────────────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

/* ─────────────────────────── Types ─────────────────────────── */

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
  accentRing: string;
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

/* ─────────────────────────── Data ─────────────────────────── */

const stats: StatCard[] = [
  { title: "Total workspaces",       value: "1,842", delta: "+64 this month", trend: "up",   icon: Building2,    accent: C.primary, accentSoft: C.primarySoft, accentRing: C.primaryRing },
  { title: "Active users (30d)",     value: "9,204", delta: "+412",           trend: "up",   icon: Users,        accent: C.warning, accentSoft: C.warningSoft, accentRing: C.warningRing },
  { title: "Emails sent (24h)",      value: "2.4M",  delta: "-3.1%",          trend: "down", icon: Send,         accent: C.danger,  accentSoft: C.dangerSoft,  accentRing: C.dangerRing },
  { title: "System health",          value: "98.4%", delta: "+0.6%",          trend: "up",   icon: CheckCircle2, accent: C.success, accentSoft: C.successSoft, accentRing: C.successRing },
];

const planDistribution = [
  { name: "Free",       value: 1120, color: C.borderHover },
  { name: "Pro",        value: 480,  color: C.primary },
  { name: "Business",   value: 196,  color: C.warning },
  { name: "Enterprise", value: 46,   color: C.success },
];

const systemComponents: SystemComponent[] = [
  { name: "API",                status: "Operational", latency: "142ms" },
  { name: "Sending queue",      status: "Operational", latency: "890ms" },
  { name: "Webhook delivery",   status: "Degraded",    latency: "3.1s" },
  { name: "Template renderer",  status: "Operational", latency: "58ms" },
  { name: "Import pipeline",    status: "Operational", latency: "1.4s" },
];

const STATUS_META: Record<SystemStatus, { bg: string; fg: string; ring: string; icon: React.ElementType }> = {
  Operational: { bg: C.successSoft, fg: C.success, ring: C.successRing, icon: ShieldCheck },
  Degraded:    { bg: C.warningSoft, fg: C.warning, ring: C.warningRing, icon: ShieldAlert },
  Down:        { bg: C.dangerSoft,  fg: C.danger,  ring: C.dangerRing,  icon: ShieldX },
};

const topWorkspaces: Workspace[] = [
  { id: "w1", name: "Nimbus Retail",  plan: "Enterprise", emailsSent: 482000, seats: 24, mrr: "$1,840", joined: "Jan 2025" },
  { id: "w2", name: "VentureHub Co",  plan: "Business",   emailsSent: 214000, seats: 12, mrr: "$620",   joined: "Mar 2025" },
  { id: "w3", name: "BrightPath Org", plan: "Business",   emailsSent: 198500, seats: 9,  mrr: "$620",   joined: "Nov 2024" },
  { id: "w4", name: "Driftlabs Dev",  plan: "Pro",        emailsSent: 96200,  seats: 4,  mrr: "$149",   joined: "May 2025" },
  { id: "w5", name: "Meridian Corp",  plan: "Enterprise", emailsSent: 388000, seats: 31, mrr: "$1,840", joined: "Aug 2024" },
];

const PLAN_META: Record<WorkspacePlan, { fg: string; bg: string; ring: string }> = {
  Free:       { fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing },
  Pro:        { fg: C.primary, bg: C.primarySoft, ring: C.primaryRing },
  Business:   { fg: C.warning, bg: C.warningSoft, ring: C.warningRing },
  Enterprise: { fg: C.success, bg: C.successSoft, ring: C.successRing },
};

const recentSignups: Signup[] = [
  { name: "Lumenstack Inc", email: "priya.nair@lumenstack.io", plan: "Pro",      time: "12 min ago" },
  { name: "Stackline App",  email: "devon@stackline.app",      plan: "Free",     time: "48 min ago" },
  { name: "Forgeworks",     email: "liam.oconnor@forgeworks.com", plan: "Business", time: "2 hr ago" },
  { name: "Solstice Media", email: "hello@solsticemedia.com",  plan: "Free",     time: "5 hr ago" },
];

const incidents: Incident[] = [
  { title: "Webhook delivery latency elevated",           severity: "Warning",  time: "18 min ago" },
  { title: "EU sending region queue backlog cleared",     severity: "Resolved", time: "3 hr ago" },
  { title: "Elevated bounce rate on shared IP pool 3",    severity: "Warning",  time: "6 hr ago" },
];

const INCIDENT_META: Record<Incident["severity"], { fg: string; bg: string; ring: string; icon: React.ElementType }> = {
  Critical: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: AlertTriangle },
  Warning:  { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: AlertTriangle },
  Resolved: { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: CheckCircle2 },
};

const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days"] as const;

/* ─────────────────────────── Small pieces ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; hint?: string; right?: React.ReactNode }> = ({
  icon, title, hint, right,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div className="flex items-start gap-3">
      {icon && (
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ fontFamily: FONT.display }} className="text-[14px] md:text-[15px] font-semibold tracking-tight" >
          <span style={{ color: C.dark }}>{title}</span>
        </h2>
        {hint && <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{hint}</p>}
      </div>
    </div>
    {right}
  </div>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${C.primary}44, ${C.primary}11)`,
        boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
      }}
    >
      {initial}
    </div>
  );
};

const PlanPill: React.FC<{ plan: WorkspacePlan }> = ({ plan }) => {
  const meta = PLAN_META[plan];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
      {plan}
    </span>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

const AdminDashboard = () => {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const planTotal = useMemo(
    () => planDistribution.reduce((s, p) => s + p.value, 0),
    []
  );
  const enterprisePct = Math.round(
    (planDistribution.find((p) => p.name === "Enterprise")!.value / planTotal) * 100
  );

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .ad-main::-webkit-scrollbar { width: 10px; }
        .ad-main::-webkit-scrollbar-track { background: transparent; }
        .ad-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .ad-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }
        @media (max-width: 640px) { .ad-stats { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 460px) { .ad-stats { grid-template-columns: 1fr; } }
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
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ad-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      All systems operational
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · super admin
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    <span style={{ color: C.dark }}>Admin dashboard</span>
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Platform-wide oversight across workspaces, usage, and system health.
                  </p>
                </div>
              </div>

              {/* Range picker */}
              <div
                className="inline-flex items-center gap-1 p-1 rounded-2xl soft-ring self-start md:self-auto"
                style={{ background: C.inner }}
              >
                {RANGES.map((r) => {
                  const active = r === range;
                  return (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className="rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap"
                      style={{
                        background: active ? "#1B2130" : "transparent",
                        color: active ? C.dark : C.textMuted,
                        boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 14px -6px rgba(0,0,0,0.6)" : "none",
                      }}
                    >
                      {r.replace("Last ", "")}
                    </button>
                  );
                })}
              </div>
            </header>

            {/* ── Stats ──────────────────────────── */}
            <div className="ad-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {stats.map((s) => {
                const Icon = s.icon;
                const up = s.trend === "up";
                return (
                  <Card key={s.title} className="p-4 md:p-5 float-in">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: s.accentSoft, boxShadow: `inset 0 0 0 1px ${s.accentRing}` }}
                      >
                        <Icon size={15} style={{ color: s.accent }} />
                      </div>
                      <span
                        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        style={{
                          background: up ? C.successSoft : C.dangerSoft,
                          color: up ? C.success : C.danger,
                          boxShadow: `inset 0 0 0 1px ${up ? C.successRing : C.dangerRing}`,
                          fontFamily: FONT.mono,
                        }}
                      >
                        {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {s.delta}
                      </span>
                    </div>
                    <p style={{ fontFamily: FONT.mono, color: C.dark }} className="text-[26px] font-bold tracking-tight leading-none">
                      {s.value}
                    </p>
                    <p className="text-[12px] mt-2" style={{ color: C.textMuted }}>{s.title}</p>
                  </Card>
                );
              })}
            </div>

            {/* ── System health + Incidents ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<Activity size={14} style={{ color: C.primary }} />}
                  title="System health"
                  hint="Component status and latency"
                />

                <div className="space-y-2">
                  {systemComponents.map((c) => {
                    const meta = STATUS_META[c.status];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={c.name}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl"
                        style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: meta.bg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                          >
                            <Icon size={13} style={{ color: meta.fg }} />
                          </div>
                          <span className="text-[12.5px] truncate" style={{ color: C.textBody }}>{c.name}</span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                            {c.latency}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                            style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
                            {c.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<AlertTriangle size={14} style={{ color: C.primary }} />}
                  title="Recent incidents"
                  hint="Latest platform events"
                />

                <div className="relative">
                  <span className="absolute left-[15px] top-2 bottom-4 w-px" style={{ background: C.border }} />
                  <div className="space-y-4 relative">
                    {incidents.map((inc, i) => {
                      const meta = INCIDENT_META[inc.severity];
                      const Icon = meta.icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className="relative z-10 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: meta.bg, boxShadow: `inset 0 0 0 1px ${meta.ring}, 0 0 0 4px ${C.bg}` }}
                          >
                            <Icon size={13} style={{ color: meta.fg }} />
                          </div>
                          <div className="min-w-0 pt-1">
                            <p className="text-[12.5px] leading-snug" style={{ color: C.textBody }}>{inc.title}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                              {inc.severity} · {inc.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Plan + Top workspaces ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<TrendingUp size={14} style={{ color: C.primary }} />}
                  title="Plan distribution"
                  hint={`${planTotal.toLocaleString()} workspaces`}
                />
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={planDistribution} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                          {planDistribution.map((p) => (
                            <Cell key={p.name} fill={p.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span style={{ fontFamily: FONT.mono, color: C.dark }} className="text-[22px] font-bold leading-none">
                        {enterprisePct}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                        Enterprise
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {planDistribution.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2" style={{ color: C.textBody }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                          {p.name}
                        </span>
                        <span className="font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>
                          {Math.round((p.value / planTotal) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-2 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                  <div>
                    <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                      Top workspaces
                    </h2>
                    <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Ranked by send volume</p>
                  </div>

                  <div
                    className="flex items-center gap-2 rounded-2xl px-3 py-2 w-full sm:w-auto transition-all"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.primaryRing.replace("0.22", "0.55")}, 0 0 0 4px ${C.primarySoft}`)}
                    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                  >
                    <Search size={13} style={{ color: C.textMuted }} className="shrink-0" />
                    <input
                      placeholder="Search workspaces…"
                      className="w-full sm:w-[180px] bg-transparent text-[12.5px] outline-none"
                      style={{ color: C.textBody }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
                        <th className="px-4 md:px-6 py-3 font-medium">Workspace</th>
                        <th className="px-3 py-3 font-medium">Plan</th>
                        <th className="px-3 py-3 font-medium text-right">Emails sent</th>
                        <th className="px-3 py-3 font-medium text-right">MRR</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkspaces.map((w) => (
                        <tr key={w.id} className="border-t transition-colors hover:bg-[#11151E]" style={{ borderColor: C.border }}>
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={w.name} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>{w.name}</p>
                                <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {w.seats} seats · joined {w.joined}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <PlanPill plan={w.plan} />
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                            {w.emailsSent.toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px] font-medium" style={{ color: C.dark, fontFamily: FONT.mono }}>
                            {w.mrr}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <button
                              aria-label="More options"
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                              style={{ color: C.textMuted }}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* ── Recent signups ────────────────── */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                    Recent signups
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Newest workspaces joining the platform</p>
                </div>
                <button className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors" style={{ color: C.primary }}>
                  View all <ExternalLink size={12} />
                </button>
              </div>

              <ul>
                {recentSignups.map((s, i) => (
                  <li
                    key={s.email}
                    className="flex items-center gap-3 px-4 md:px-6 py-3.5 transition-colors hover:bg-[#11151E]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}
                  >
                    <Avatar name={s.name} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>{s.name}</p>
                      <p className="text-[11.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>{s.email}</p>
                    </div>

                    <span className="hidden sm:block"><PlanPill plan={s.plan} /></span>
                    <span className="text-[11px] shrink-0 ml-1" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                      {s.time}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;