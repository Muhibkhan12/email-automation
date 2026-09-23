import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  ArrowUpRight, ArrowDownRight, MousePointerClick, Send as SendIcon,
  CheckCircle2, MailOpen, Clock3, Menu, ChevronRight, Users,
  TrendingUp, XCircle, Award, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ─────────────── Design tokens ─────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.12)",
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
  dark: "#E8E6E1",
  bg: "#0D1015",
  surface: "#141821",
  surfaceHover: "#161B25",
  inner: "#0F131A",
  border: "#232833",
  borderHover: "#333A48",
  textMuted: "#6B727C",
  textBody: "#C7C9CE",
};

/* ─────────────── Types ─────────────── */

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

/* ─────────────── Data ─────────────── */

const stats: StatCard[] = [
  { title: "Emails sent",   value: "48,250", change: "+12.5%", trend: "up",   description: "Compared to previous period", icon: SendIcon,           accent: COLOR.primary, accentSoft: COLOR.primarySoft },
  { title: "Delivery rate", value: "98.4%",  change: "+1.2%",  trend: "up",   description: "Successfully delivered",     icon: CheckCircle2,       accent: COLOR.success, accentSoft: COLOR.successSoft },
  { title: "Open rate",     value: "42.7%",  change: "+4.6%",  trend: "up",   description: "Recipients who opened",      icon: MailOpen,           accent: COLOR.warning, accentSoft: COLOR.warningSoft },
  { title: "Click rate",    value: "8.9%",   change: "-0.8%",  trend: "down", description: "Recipients who clicked",     icon: MousePointerClick,  accent: COLOR.danger,  accentSoft: COLOR.dangerSoft },
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

/* ─────────────── Small primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl transition-colors ${className}`}
    style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 mb-4 md:mb-5">
    <div>
      <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-base font-semibold tracking-tight">
        {title}
      </h2>
      {hint && <p className="text-[11px] md:text-xs mt-0.5" style={{ color: COLOR.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

const Metric: React.FC<{ label: string; value: string; width: string; color: string }> = ({ label, value, width, color }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[12px] md:text-[13px]" style={{ color: COLOR.textBody }}>{label}</span>
      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[12px] md:text-[13px] font-semibold">
        {value}
      </span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLOR.inner }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width, background: color, boxShadow: `0 0 12px ${color}66` }}
      />
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: Sender["status"] }> = ({ status }) => {
  const map: Record<Sender["status"], { bg: string; fg: string; ring: string }> = {
    Excellent: { bg: COLOR.successSoft, fg: COLOR.success, ring: COLOR.successRing },
    Good:      { bg: COLOR.primarySoft, fg: COLOR.primary, ring: COLOR.primaryRing },
    Average:   { bg: COLOR.warningSoft, fg: COLOR.warning, ring: COLOR.warningRing },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
      {status}
    </span>
  );
};

/* ─────────────── Page ─────────────── */

const Analytics = () => {
  const [range, setRange] = useState(RANGES[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .an-main::-webkit-scrollbar { width: 8px; }
        .an-main::-webkit-scrollbar-track { background: transparent; }
        .an-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .an-main::-webkit-scrollbar-thumb:hover { background: #333A48; }

        .mf-flow-track { position: relative; height: 2px; background: ${COLOR.border}; }
        .mf-flow-dot {
          position: absolute; top: -3px;
          width: 8px; height: 8px; border-radius: 9999px;
          background: ${COLOR.primary};
          box-shadow: 0 0 8px 1px rgba(255,106,57,0.5);
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

        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        select option { background: #141821; color: #E8E6E1; }
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

      <main className="an-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%" }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ─────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-xl text-[#C7C9CE] transition-colors"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.textMuted }}>Insights</span>
                  <ChevronRight size={10} style={{ color: "#3A3F4A" }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.primary }}>Analytics</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em", color: COLOR.dark }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold leading-tight"
                >
                  Analytics
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm" style={{ color: COLOR.textMuted }}>
                  Deliverability and engagement across every send.
                </p>
              </div>
            </div>

            {/* Range picker */}
            <div
              className="inline-flex items-center gap-0.5 rounded-xl p-1 self-start md:self-auto"
              style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.15)' }}
            >
              {RANGES.map((r) => {
                const active = r === range;
                return (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="rounded-lg px-3 py-1.5 text-[11.5px] md:text-xs font-medium transition-all whitespace-nowrap"
                    style={{
                      fontFamily: FONT.mono,
                      background: active ? COLOR.primary : "transparent",
                      color: active ? "#fff" : COLOR.textBody,
                      boxShadow: active ? '0 6px 20px -8px rgba(255,106,57,0.6)' : 'none',
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </header>

          {/* ── Stats ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const up = stat.trend === "up";
              return (
                <Card key={stat.title} className="p-4 md:p-5 fade-in-up">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: stat.accentSoft, boxShadow: `inset 0 0 0 1px ${stat.accent}33` }}
                    >
                      <Icon size={15} style={{ color: stat.accent }} />
                    </div>
                    <span
                      className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        fontFamily: FONT.mono,
                        background: up ? COLOR.successSoft : COLOR.dangerSoft,
                        color: up ? COLOR.success : COLOR.danger,
                        boxShadow: `inset 0 0 0 1px ${up ? COLOR.successRing : COLOR.dangerRing}`,
                      }}
                    >
                      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {stat.change}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-[26px] font-bold leading-none tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[12.5px]" style={{ color: COLOR.textBody }}>{stat.title}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: COLOR.textMuted }}>{stat.description}</p>
                </Card>
              );
            })}
          </div>

          {/* ── Delivery pipeline ──────────────────── */}
          <Card className="p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4 md:mb-6">
              <div>
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-base font-semibold tracking-tight">
                  Delivery pipeline
                </h2>
                <p className="text-[11px] md:text-xs mt-0.5" style={{ color: COLOR.textMuted }}>
                  Where this period's sends are right now, stage by stage.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
                style={{ fontFamily: FONT.mono, color: COLOR.primary, background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
              >
                <Clock3 size={11} />
                live
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
                        className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${COLOR.primary}22, ${COLOR.primary}08)`,
                          boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
                        }}
                      >
                        <Icon size={16} className="md:w-[18px] md:h-[18px]" style={{ color: COLOR.primary }} />
                      </div>
                      <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="mt-2.5 md:mt-3 text-[15px] md:text-lg font-bold">
                        {stage.value.toLocaleString()}
                      </p>
                      <p className="text-[11px] md:text-xs mt-0.5" style={{ color: COLOR.textBody }}>{stage.label}</p>
                      <span
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          fontFamily: FONT.mono,
                          background: dropFromPrev ? COLOR.dangerSoft : COLOR.neutralSoft,
                          color: dropFromPrev ? COLOR.danger : COLOR.textMuted,
                          boxShadow: `inset 0 0 0 1px ${dropFromPrev ? COLOR.dangerRing : COLOR.neutralRing}`,
                        }}
                      >
                        {dropFromPrev === null ? `${pctOfSent}% of sent` : `−${dropFromPrev}% drop-off`}
                      </span>
                    </div>

                    {i < pipeline.length - 1 && (
                      <div className="mf-flow-track flex-1 min-w-[20px] mt-6 md:mt-7">
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

          {/* ── Activity + engagement ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
            <Card className="lg:col-span-2 p-4 md:p-6">
              <SectionTitle
                title="Email activity"
                hint="Emails sent and opened over time."
                right={
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    style={{ fontFamily: FONT.mono, background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
                  >
                    <TrendingUp size={11} /> {range}
                  </span>
                }
              />
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSentA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR.dark} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={COLOR.dark} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillOpenedA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLOR.border} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: COLOR.borderHover, strokeDasharray: '3 3' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${COLOR.border}`,
                        background: COLOR.surface,
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: COLOR.dark,
                        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={24}
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(v) => (
                        <span style={{ fontFamily: FONT.body, fontSize: 11, color: COLOR.textBody }}>{v}</span>
                      )}
                    />
                    <Area type="monotone" dataKey="sent"   name="Sent"   stroke={COLOR.dark}    strokeWidth={2} fill="url(#fillSentA)" />
                    <Area type="monotone" dataKey="opened" name="Opened" stroke={COLOR.primary} strokeWidth={2} fill="url(#fillOpenedA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <SectionTitle title="Engagement" hint="Overall recipient engagement." />
              <div className="space-y-4 md:space-y-5">
                <Metric label="Open rate"        value="42.7%" width="43%" color={COLOR.primary} />
                <Metric label="Click rate"       value="8.9%"  width="9%"  color={COLOR.success} />
                <Metric label="Bounce rate"      value="1.6%"  width="2%"  color={COLOR.warning} />
                <Metric label="Unsubscribe rate" value="0.4%"  width="1%"  color={COLOR.danger} />
              </div>
            </Card>
          </div>

          {/* ── Bottom: campaigns + senders ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-base font-semibold tracking-tight">
                    Top campaigns
                  </h2>
                  <p className="text-[11px] md:text-xs mt-0.5" style={{ color: COLOR.textMuted }}>
                    Campaigns with the highest engagement.
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  style={{ fontFamily: FONT.mono, background: COLOR.primarySoft, color: COLOR.primary, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
                >
                  <Award size={11} /> Top 3
                </span>
              </div>
              <div>
                {campaigns.map((campaign, i) => {
                  const initial = campaign.name.trim()[0]?.toUpperCase() ?? "?";
                  return (
                    <div
                      key={campaign.name}
                      className="flex items-center gap-3 p-4 md:px-6 md:py-5 transition-colors"
                      style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                    >
                      <div
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${COLOR.primary}44, ${COLOR.primary}11)`,
                          boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
                        }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-medium truncate" style={{ color: COLOR.dark }}>{campaign.name}</p>
                        <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[11.5px] mt-0.5">
                          {campaign.recipients.toLocaleString()} recipients
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-semibold"
                        style={{
                          fontFamily: FONT.mono,
                          color: COLOR.primary,
                          background: COLOR.primarySoft,
                          boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}`,
                        }}
                      >
                        {campaign.openRate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[14px] md:text-base font-semibold tracking-tight">
                    Sender performance
                  </h2>
                  <p className="text-[11px] md:text-xs mt-0.5" style={{ color: COLOR.textMuted }}>
                    Reputation and volume per sender.
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  style={{ fontFamily: FONT.mono, background: COLOR.neutralSoft, color: COLOR.textMuted, boxShadow: `inset 0 0 0 1px ${COLOR.neutralRing}` }}
                >
                  <BarChart3 size={11} /> {senders.length} accounts
                </span>
              </div>
              <div>
                {senders.map((sender, i) => (
                  <div
                    key={sender.email}
                    className="flex items-center gap-3 p-4 md:px-6 md:py-5 transition-colors"
                    style={{ borderBottom: i < senders.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
                    >
                      <SendIcon size={14} style={{ color: COLOR.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: COLOR.dark }}>{sender.email}</p>
                      <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[11.5px] mt-0.5">
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