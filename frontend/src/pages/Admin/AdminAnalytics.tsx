// AdminAnalytics.tsx
import React, { useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Users, Send, Eye, MousePointer, Activity, Clock, Download,
  ChevronRight, ArrowUpRight, ArrowDownRight, TrendingUp, Zap,
  Menu, Calendar, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
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
  purple: "#A78BFA",
  purpleSoft: "rgba(167,139,250,0.10)",
  purpleRing: "rgba(167,139,250,0.22)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
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

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  accentRing: string;
}

/* ─────────────────────────── Data ─────────────────────────── */

const metrics: MetricCard[] = [
  { title: "Total emails sent",   value: "2,847,293", change: "+12.8%", trend: "up",   icon: Send,          accent: C.primary,  accentSoft: C.primarySoft,  accentRing: C.primaryRing },
  { title: "Average open rate",   value: "46.8%",     change: "+2.1%",  trend: "up",   icon: Eye,           accent: C.success,  accentSoft: C.successSoft,  accentRing: C.successRing },
  { title: "Average click rate",  value: "8.9%",      change: "-0.8%",  trend: "down", icon: MousePointer,  accent: C.warning,  accentSoft: C.warningSoft,  accentRing: C.warningRing },
  { title: "Total recipients",    value: "1,842,500", change: "+18.4%", trend: "up",   icon: Users,         accent: C.purple,   accentSoft: C.purpleSoft,   accentRing: C.purpleRing },
  { title: "Bounce rate",         value: "2.4%",      change: "-0.6%",  trend: "down", icon: Activity,      accent: C.danger,   accentSoft: C.dangerSoft,   accentRing: C.dangerRing },
  { title: "Avg. delivery time",  value: "1.8s",      change: "-0.3s",  trend: "up",   icon: Clock,         accent: C.blue,     accentSoft: C.blueSoft,     accentRing: C.blueRing },
];

const weeklyData = [
  { day: "Mon", sent: 32000, opened: 15000, clicked: 2800 },
  { day: "Tue", sent: 45000, opened: 21000, clicked: 3900 },
  { day: "Wed", sent: 38000, opened: 17800, clicked: 3200 },
  { day: "Thu", sent: 52000, opened: 24400, clicked: 4600 },
  { day: "Fri", sent: 48000, opened: 22500, clicked: 4100 },
  { day: "Sat", sent: 28000, opened: 13100, clicked: 2300 },
  { day: "Sun", sent: 25000, opened: 11700, clicked: 2000 },
];

const monthlyData = [
  { month: "Jan", sent: 180000, opened: 84000 },
  { month: "Feb", sent: 195000, opened: 91000 },
  { month: "Mar", sent: 210000, opened: 98000 },
  { month: "Apr", sent: 225000, opened: 105000 },
  { month: "May", sent: 240000, opened: 112000 },
  { month: "Jun", sent: 260000, opened: 122000 },
  { month: "Jul", sent: 280000, opened: 131000 },
  { month: "Aug", sent: 310000, opened: 145000 },
];

const engagementData = [
  { name: "Opened",   value: 46.8, color: C.primary },
  { name: "Clicked",  value: 8.9,  color: C.warning },
  { name: "Bounced",  value: 2.4,  color: C.danger },
  { name: "Unopened", value: 41.9, color: C.borderHover },
];

const deviceData = [
  { name: "Desktop", value: 58, color: C.primary },
  { name: "Mobile",  value: 32, color: C.warning },
  { name: "Tablet",  value: 10, color: C.success },
];

const topWorkspaces = [
  { name: "Nimbus Retail",  sent: 482000, openRate: 52.4 },
  { name: "Meridian Corp",  sent: 388000, openRate: 48.1 },
  { name: "VentureHub Co",  sent: 214000, openRate: 44.3 },
  { name: "BrightPath Org", sent: 198500, openRate: 39.8 },
  { name: "Driftlabs Dev",  sent: 96200,  openRate: 41.2 },
];

const RANGES = ["7d", "30d", "90d", "1y"] as const;

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
        {title}
      </h2>
      {hint && <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: C.textMuted }}>
    <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    {label}
  </span>
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

const chartTooltipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: C.surface,
  fontFamily: FONT.mono,
  fontSize: 11,
  color: C.dark,
  boxShadow: "0 12px 30px -12px rgba(0,0,0,0.7)",
};

/* ─────────────────────────── Page ─────────────────────────── */

const AdminAnalytics = () => {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const engagementTotal = useMemo(() => engagementData.reduce((s, e) => s + e.value, 0), []);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .aa-main::-webkit-scrollbar { width: 10px; }
        .aa-main::-webkit-scrollbar-track { background: transparent; }
        .aa-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .aa-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        @media (max-width: 480px) { .aa-metrics { grid-template-columns: 1fr; } }
        @media (min-width: 481px) and (max-width: 767px) { .aa-metrics { grid-template-columns: 1fr 1fr; } }
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

      <main className="aa-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
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
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                    >
                      <BarChart3 size={11} /> Admin view
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · platform wide
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    <span style={{ color: C.dark }}>Analytics</span>
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Platform-wide performance across every workspace and campaign.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <div
                  className="inline-flex items-center gap-1 p-1 rounded-2xl soft-ring"
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
                          fontFamily: FONT.mono,
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </header>

            {/* ── Metrics ────────────────────────── */}
            <div className="aa-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
              {metrics.map((m) => {
                const Icon = m.icon;
                const up = m.trend === "up";
                return (
                  <Card key={m.title} className="p-4 float-in">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: m.accentSoft, boxShadow: `inset 0 0 0 1px ${m.accentRing}` }}
                      >
                        <Icon size={14} style={{ color: m.accent }} />
                      </div>
                      <span
                        className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                        style={{
                          background: up ? C.successSoft : C.dangerSoft,
                          color: up ? C.success : C.danger,
                          boxShadow: `inset 0 0 0 1px ${up ? C.successRing : C.dangerRing}`,
                          fontFamily: FONT.mono,
                        }}
                      >
                        {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {m.change}
                      </span>
                    </div>
                    <p className="text-[20px] md:text-[22px] font-bold leading-none tracking-tight"
                      style={{ fontFamily: FONT.mono, color: C.dark }}>
                      {m.value}
                    </p>
                    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{m.title}</p>
                  </Card>
                );
              })}
            </div>

            {/* ── Weekly + Engagement ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 p-4 md:p-5 lg:p-6">
                <SectionTitle
                  title="Weekly activity"
                  hint="Sent · opened · clicked"
                  right={
                    <div className="flex items-center gap-3">
                      <LegendDot color={C.primary} label="Sent" />
                      <LegendDot color={C.success} label="Opened" />
                      <LegendDot color={C.warning} label="Clicked" />
                    </div>
                  }
                />
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.success} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={C.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.border} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ stroke: C.borderHover, strokeDasharray: "3 3" }}
                        contentStyle={chartTooltipStyle}
                      />
                      <Area type="monotone" dataKey="sent"    stroke={C.primary} strokeWidth={2} fill="url(#sentGrad)" />
                      <Area type="monotone" dataKey="opened"  stroke={C.success} strokeWidth={2} fill="url(#openedGrad)" />
                      <Area type="monotone" dataKey="clicked" stroke={C.warning} strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle title="Engagement" hint="Share of opens, clicks, bounces" />
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={engagementData} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                          {engagementData.map((e) => (
                            <Cell key={e.name} fill={e.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[22px] font-bold leading-none"
                        style={{ fontFamily: FONT.mono, color: C.dark }}>
                        {engagementData[0].value}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                        Opened
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {engagementData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2" style={{ color: C.textBody }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                          {item.name}
                        </span>
                        <span className="font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Monthly + Device ────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 p-4 md:p-5 lg:p-6">
                <SectionTitle
                  title="Monthly trend"
                  hint="Total volume by month"
                  right={
                    <div className="flex items-center gap-3">
                      <LegendDot color={C.primary} label="Sent" />
                      <LegendDot color={C.success} label="Opened" />
                    </div>
                  }
                />
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={chartTooltipStyle} />
                      <Bar dataKey="sent"   fill={C.primary} radius={[6, 6, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="opened" fill={C.success} radius={[6, 6, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle title="Device distribution" hint="Where your emails are read" />
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deviceData} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                          {deviceData.map((e) => (
                            <Cell key={e.name} fill={e.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[22px] font-bold leading-none"
                        style={{ fontFamily: FONT.mono, color: C.dark }}>
                        {deviceData[0].value}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                        Desktop
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {deviceData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2" style={{ color: C.textBody }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                          {item.name}
                        </span>
                        <span className="font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: C.warningSoft, boxShadow: `inset 0 0 0 1px ${C.warningRing}` }}
                    >
                      <Zap size={14} style={{ color: C.warning }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: C.textMuted }}>Best time to send</p>
                      <p className="text-[15px] font-semibold mt-0.5" style={{ color: C.dark, fontFamily: FONT.display }}>
                        2:00 PM – 4:00 PM
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>Peak engagement window</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Top workspaces ─────────────────── */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                    Top performing workspaces
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    Ranked by send volume and open rate
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors" style={{ color: C.primary }}>
                  View all <ChevronRight size={12} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
                      <th className="px-4 md:px-6 py-3 font-medium">Workspace</th>
                      <th className="px-3 py-3 font-medium text-right">Emails sent</th>
                      <th className="px-3 py-3 font-medium">Open rate</th>
                      <th className="px-3 py-3 font-medium">Engagement</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWorkspaces.map((w) => (
                      <tr key={w.name} className="border-t transition-colors hover:bg-[#11151E]" style={{ borderColor: C.border }}>
                        <td className="px-4 md:px-6 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={w.name} />
                            <span className="text-[13px] font-medium truncate" style={{ color: C.dark }}>{w.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                          {w.sent.toLocaleString()}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[12px] w-[42px] text-right" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                              {w.openRate.toFixed(1)}%
                            </span>
                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: C.inner }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${w.openRate}%`,
                                  background: C.success,
                                  boxShadow: `0 0 8px ${C.success}66`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                            style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}
                          >
                            <TrendingUp size={10} />
                            High
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-right">
                          <button
                            className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                            style={{ color: C.textMuted }}
                            aria-label="Row details"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;