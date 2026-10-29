import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  ArrowUpRight, ArrowDownRight, MousePointerClick, Send as SendIcon,
  CheckCircle2, MailOpen, Clock3, Menu, ChevronRight,
  TrendingUp, Award, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─────────────── design tokens (aligned with UserDashboard) ─────────────── */

const T = {
  // Canvas — navy family matching dashboard
  bg:          "#0B0D14",

  // Surfaces — layered above canvas
  surface:     "#131722",
  surface2:    "#1A1F2E",
  surfaceHi:   "#222838",

  // Borders — visible but restrained
  border:      "#2E364A",
  borderSoft:  "#232A3C",

  // Text — brighter, matching dashboard
  text:        "#F2F4F8",
  textMuted:   "#B6BECE",
  textFaint:   "#8B93A7",

  // Brand — brighter indigo
  brand:       "#7C7FF2",
  brandSoft:   "rgba(124,127,242,0.14)",
  brandBorder: "rgba(124,127,242,0.42)",

  // Status — brighter, more legible
  success:      "#34D399",
  successSoft:  "rgba(52,211,153,0.14)",
  successBorder:"rgba(52,211,153,0.42)",

  warn:         "#FBBF24",
  warnSoft:     "rgba(251,191,36,0.14)",
  warnBorder:   "rgba(251,191,36,0.42)",

  danger:       "#F87171",
  dangerSoft:   "rgba(248,113,113,0.14)",
  dangerBorder: "rgba(248,113,113,0.42)",

  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.14)",
  infoBorder:   "rgba(56,189,248,0.42)",

  purple:       "#C4B5FD",
  purpleSoft:   "rgba(196,181,253,0.14)",
  purpleBorder: "rgba(196,181,253,0.42)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── types & data ─────────────── */

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}

interface Campaign { name: string; recipients: number; openRate: string; }
interface Sender   { email: string; sent: number; status: "Excellent" | "Good" | "Average"; }
interface ActivityPoint { day: string; sent: number; opened: number; }
interface PipelineStage { label: string; value: number; icon: React.ElementType; }

const stats: StatCard[] = [
  { title: "Emails sent",   value: "48,250", change: "+12.5%", trend: "up",   description: "Compared to previous period", icon: SendIcon,          accent: T.brand,   accentSoft: T.brandSoft },
  { title: "Delivery rate", value: "98.4%",  change: "+1.2%",  trend: "up",   description: "Successfully delivered",     icon: CheckCircle2,      accent: T.success, accentSoft: T.successSoft },
  { title: "Open rate",     value: "42.7%",  change: "+4.6%",  trend: "up",   description: "Recipients who opened",      icon: MailOpen,          accent: T.warn,    accentSoft: T.warnSoft },
  { title: "Click rate",    value: "8.9%",   change: "-0.8%",  trend: "down", description: "Recipients who clicked",     icon: MousePointerClick, accent: T.danger,  accentSoft: T.dangerSoft },
];

const pipeline: PipelineStage[] = [
  { label: "Sent",      value: 48250, icon: SendIcon },
  { label: "Delivered", value: 47490, icon: CheckCircle2 },
  { label: "Opened",    value: 20280, icon: MailOpen },
  { label: "Clicked",   value: 4234,  icon: MousePointerClick },
];

const campaigns: Campaign[] = [
  { name: "Summer Promotion",  recipients: 2450, openRate: "56.4%" },
  { name: "Product Launch",    recipients: 5200, openRate: "51.2%" },
  { name: "August Newsletter", recipients: 1800, openRate: "47.8%" },
];

const senders: Sender[] = [
  { email: "marketing@company.com", sent: 18420, status: "Excellent" },
  { email: "sales@company.com",     sent: 15830, status: "Good" },
  { email: "hello@company.com",     sent: 13920, status: "Average" },
];

const activity: ActivityPoint[] = [
  { day: "Mon", sent: 6200, opened: 2650 },
  { day: "Tue", sent: 7100, opened: 3050 },
  { day: "Wed", sent: 6800, opened: 3200 },
  { day: "Thu", sent: 8300, opened: 3900 },
  { day: "Fri", sent: 9400, opened: 4600 },
  { day: "Sat", sent: 5200, opened: 2100 },
  { day: "Sun", sent: 5250, opened: 2050 },
];

const RANGES = ["7 days", "30 days", "90 days", "This year"];

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 mb-3.5">
    <div>
      <h2 className="text-[13.5px] font-semibold tracking-tight" style={{ color: T.text }}>
        {title}
      </h2>
      {hint && <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

const Metric: React.FC<{ label: string; value: string; width: string; color: string }> = ({ label, value, width, color }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[12px]" style={{ color: T.textMuted }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: T.text, fontFamily: FONT.mono }}>
        {value}
      </span>
    </div>
    <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
      <div className="h-full rounded-full transition-all" style={{ width, background: color }} />
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: Sender["status"] }> = ({ status }) => {
  const map: Record<Sender["status"], { bg: string; fg: string; ring: string }> = {
    Excellent: { bg: T.successSoft, fg: T.success, ring: T.successBorder },
    Good:      { bg: T.brandSoft,   fg: T.brand,   ring: T.brandBorder },
    Average:   { bg: T.warnSoft,    fg: T.warn,    ring: T.warnBorder },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
      {status}
    </span>
  );
};

/* ─────────────── page ─────────────── */

const Analytics = () => {
  const [range, setRange] = useState(RANGES[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: T.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .an-main::-webkit-scrollbar { width: 8px; }
        .an-main::-webkit-scrollbar-track { background: transparent; }
        .an-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .an-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .mf-flow-track { position: relative; height: 1px; background: ${T.borderSoft}; }
        .mf-flow-dot {
          position: absolute; top: -2.5px;
          width: 6px; height: 6px; border-radius: 9999px;
          background: ${T.brand};
          animation: mfFlow 2.6s linear infinite;
        }
        @keyframes mfFlow {
          0%   { left: -2%; opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { left: 98%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-flow-dot { animation: none; left: 46%; opacity: 0.7; }
        }

        select option { background: ${T.surface}; color: ${T.text}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="an-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1320 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
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
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Insights</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.brand }}>Analytics</span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Analytics
                </h1>
                <p className="mt-1 text-[13.5px]" style={{ color: T.textMuted }}>
                  Deliverability and engagement across every send.
                </p>
              </div>
            </div>

            {/* Range picker */}
            <div
              className="inline-flex items-center gap-0.5 p-0.5 rounded-lg self-start md:self-auto"
              style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              {RANGES.map((r) => {
                const active = r === range;
                return (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors whitespace-nowrap"
                    style={{
                      background: active ? T.surfaceHi : "transparent",
                      color: active ? T.text : T.textMuted,
                      fontFamily: FONT.mono,
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const up = stat.trend === "up";
              return (
                <Card key={stat.title} className="p-3.5 md:p-4">
                  <div className="flex items-start justify-between mb-2.5">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ background: stat.accentSoft, color: stat.accent }}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-medium"
                      style={{
                        fontFamily: FONT.mono,
                        background: up ? T.successSoft : T.dangerSoft,
                        color: up ? T.success : T.danger,
                      }}
                    >
                      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-[24px] font-semibold leading-none tracking-tight" style={{ color: T.text, fontFamily: FONT.mono }}>
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[11.5px]" style={{ color: T.textMuted }}>{stat.title}</p>
                  <p className="mt-0.5 text-[10.5px]" style={{ color: T.textFaint }}>{stat.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Delivery pipeline */}
          <Card className="p-4 md:p-5 mb-5 md:mb-6">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-4 md:mb-5">
              <div>
                <h2 className="text-[13.5px] font-semibold tracking-tight" style={{ color: T.text }}>
                  Delivery pipeline
                </h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                  Where this period's sends are right now, stage by stage.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                style={{ fontFamily: FONT.mono, color: T.brand, background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
              >
                <Clock3 size={10} /> live
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-3 md:gap-4">
              {pipeline.map((stage, i) => {
                const Icon = stage.icon;
                const pctOfSent = i === 0 ? 100 : Math.round((stage.value / pipeline[0].value) * 100);
                const dropFromPrev = i === 0 ? null : Math.round(((pipeline[i - 1].value - stage.value) / pipeline[i - 1].value) * 100);

                return (
                  <React.Fragment key={stage.label}>
                    <div className="flex-1 min-w-[70px] md:min-w-[90px] flex flex-col items-center text-center">
                      <div
                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
                        style={{ background: T.brandSoft, color: T.brand }}
                      >
                        <Icon size={15} />
                      </div>
                      <p className="mt-2.5 text-[14px] md:text-[15px] font-semibold" style={{ color: T.text, fontFamily: FONT.mono }}>
                        {stage.value.toLocaleString()}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{stage.label}</p>
                      <span
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-medium"
                        style={{
                          fontFamily: FONT.mono,
                          background: dropFromPrev ? T.dangerSoft : "rgba(139,147,167,0.14)",
                          color: dropFromPrev ? T.danger : T.textMuted,
                        }}
                      >
                        {dropFromPrev === null ? `${pctOfSent}% of sent` : `−${dropFromPrev}% drop-off`}
                      </span>
                    </div>

                    {i < pipeline.length - 1 && (
                      <div className="mf-flow-track flex-1 min-w-[20px] mt-5 md:mt-5">
                        <span className="mf-flow-dot" style={{ animationDelay: "0s" }} />
                        <span className="mf-flow-dot" style={{ animationDelay: "0.9s" }} />
                        <span className="mf-flow-dot" style={{ animationDelay: "1.8s" }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>

          {/* Activity + engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-5 md:mb-6">
            <Card className="lg:col-span-2 p-4 md:p-5">
              <SectionTitle
                title="Email activity"
                hint="Emails sent and opened over time."
                right={
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ fontFamily: FONT.mono, background: T.brandSoft, color: T.brand }}
                  >
                    <TrendingUp size={10} /> {range}
                  </span>
                }
              />
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSentA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.textMuted} stopOpacity={0.20} />
                        <stop offset="100%" stopColor={T.textMuted} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillOpenedA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.brand} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={T.brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.borderSoft} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: T.border, strokeDasharray: '3 3' }}
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${T.border}`,
                        background: T.surface2,
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: T.text,
                        boxShadow: '0 12px 30px -12px rgba(0,0,0,0.7)',
                      }}
                    />
                    <Area type="monotone" dataKey="sent"   name="Sent"   stroke={T.textMuted} strokeWidth={2} fill="url(#fillSentA)" />
                    <Area type="monotone" dataKey="opened" name="Opened" stroke={T.brand}     strokeWidth={2} fill="url(#fillOpenedA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-end gap-4 mt-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5" style={{ color: T.textMuted }}>
                  <span className="w-2 h-0.5 rounded-full" style={{ background: T.textMuted }} />
                  Sent
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: T.textMuted }}>
                  <span className="w-2 h-0.5 rounded-full" style={{ background: T.brand }} />
                  Opened
                </span>
              </div>
            </Card>

            <Card className="p-4 md:p-5">
              <SectionTitle title="Engagement" hint="Overall recipient engagement." />
              <div className="space-y-4">
                <Metric label="Open rate"        value="42.7%" width="43%" color={T.brand} />
                <Metric label="Click rate"       value="8.9%"  width="9%"  color={T.success} />
                <Metric label="Bounce rate"      value="1.6%"  width="2%"  color={T.warn} />
                <Metric label="Unsubscribe rate" value="0.4%"  width="1%"  color={T.danger} />
              </div>
            </Card>
          </div>

          {/* Bottom: campaigns + senders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <Card className="overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div>
                  <h2 className="text-[13.5px] font-semibold tracking-tight" style={{ color: T.text }}>
                    Top campaigns
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                    Campaigns with the highest engagement.
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium"
                  style={{ fontFamily: FONT.mono, background: T.brandSoft, color: T.brand }}
                >
                  <Award size={10} /> Top 3
                </span>
              </div>
              <div>
                {campaigns.map((campaign, i) => {
                  const initial = campaign.name.trim()[0]?.toUpperCase() ?? "?";
                  return (
                    <div
                      key={campaign.name}
                      className="flex items-center gap-3 px-4 md:px-5 py-3"
                      style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                    >
                      <div
                        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-semibold"
                        style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{campaign.name}</p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {campaign.recipients.toLocaleString()} recipients
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded px-2 py-0.5 text-[11.5px] font-semibold"
                        style={{ fontFamily: FONT.mono, color: T.brand, background: T.brandSoft }}
                      >
                        {campaign.openRate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div>
                  <h2 className="text-[13.5px] font-semibold tracking-tight" style={{ color: T.text }}>
                    Sender performance
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                    Reputation and volume per sender.
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium"
                  style={{ fontFamily: FONT.mono, background: T.surface2, color: T.textMuted }}
                >
                  <BarChart3 size={10} /> {senders.length} accounts
                </span>
              </div>
              <div>
                {senders.map((sender, i) => (
                  <div
                    key={sender.email}
                    className="flex items-center gap-3 px-4 md:px-5 py-3"
                    style={{ borderBottom: i < senders.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div
                      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                    >
                      <SendIcon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{sender.email}</p>
                      <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {sender.sent.toLocaleString()} emails sent
                      </p>
                    </div>
                    <StatusBadge status={sender.status} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;