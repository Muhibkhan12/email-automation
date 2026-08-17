import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick,
  Send as SendIcon,
  CheckCircle2,
  MailOpen,
  Clock3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (iron / ember)                       */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.12)",
  success: "#7FD98A",
  successSoft: "rgba(127,217,138,0.12)",
  warning: "#FFC24B",
  warningSoft: "rgba(255,194,75,0.12)",
  danger: "#FF5C6C",
  dangerSoft: "rgba(255,92,108,0.12)",
  dark: "#E8E6E1",
  bg: "#0E1013",
  surface: "#171A21",
  border: "#2A2E37",
  borderHover: "#3A3F4A",
  textMuted: "#8B8D94",
  textBody: "#C7C9CE",
};

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

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

interface Campaign {
  name: string;
  recipients: number;
  openRate: string;
}

interface Sender {
  email: string;
  sent: number;
  status: "Excellent" | "Good" | "Average";
}

interface ActivityPoint {
  day: string;
  sent: number;
  opened: number;
}

interface PipelineStage {
  label: string;
  value: number;
  icon: React.ElementType;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const stats: StatCard[] = [
  {
    title: "Emails sent",
    value: "48,250",
    change: "+12.5%",
    trend: "up",
    description: "Compared to previous period",
    icon: SendIcon,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoft,
  },
  {
    title: "Delivery rate",
    value: "98.4%",
    change: "+1.2%",
    trend: "up",
    description: "Successfully delivered",
    icon: CheckCircle2,
    accent: COLOR.success,
    accentSoft: COLOR.successSoft,
  },
  {
    title: "Open rate",
    value: "42.7%",
    change: "+4.6%",
    trend: "up",
    description: "Recipients who opened emails",
    icon: MailOpen,
    accent: COLOR.warning,
    accentSoft: COLOR.warningSoft,
  },
  {
    title: "Click rate",
    value: "8.9%",
    change: "-0.8%",
    trend: "down",
    description: "Recipients who clicked a link",
    icon: MousePointerClick,
    accent: COLOR.danger,
    accentSoft: COLOR.dangerSoft,
  },
];

const pipeline: PipelineStage[] = [
  { label: "Sent", value: 48250, icon: SendIcon },
  { label: "Delivered", value: 47490, icon: CheckCircle2 },
  { label: "Opened", value: 20280, icon: MailOpen },
  { label: "Clicked", value: 4234, icon: MousePointerClick },
];

const campaigns: Campaign[] = [
  { name: "Summer Promotion", recipients: 2450, openRate: "56.4%" },
  { name: "Product Launch", recipients: 5200, openRate: "51.2%" },
  { name: "August Newsletter", recipients: 1800, openRate: "47.8%" },
];

const senders: Sender[] = [
  { email: "marketing@company.com", sent: 18420, status: "Excellent" },
  { email: "sales@company.com", sent: 15830, status: "Good" },
  { email: "hello@company.com", sent: 13920, status: "Average" },
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

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Analytics = () => {
  const [range, setRange] = useState(RANGES[0]);

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-range-btn:focus-visible,
        .mf-select:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }

        .mf-card { transition: border-color 0.15s ease; }
        .mf-card:hover { border-color: ${COLOR.borderHover}; }

        .mf-flow-track { position: relative; height: 2px; background: ${COLOR.border}; }
        .mf-flow-dot {
          position: absolute;
          top: -3px;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: ${COLOR.primary};
          box-shadow: 0 0 8px 1px rgba(255,106,57,0.5);
          animation: mfFlow 2.6s linear infinite;
        }
        @keyframes mfFlow {
          0% { left: -2%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { left: 98%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-flow-dot { animation: none; left: 46%; opacity: 0.7; }
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
              className="text-3xl font-bold"
            >
              Analytics
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Track deliverability and engagement across every send.
            </p>
          </div>

          <div
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
          >
            {RANGES.map((r) => {
              const active = r === range;
              return (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="mf-range-btn rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    fontFamily: FONT.body,
                    background: active ? COLOR.primary : "transparent",
                    color: active ? COLOR.bg : COLOR.textBody,
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="mf-card rounded-xl p-5"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={16} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      fontFamily: FONT.mono,
                      color: stat.trend === "up" ? COLOR.success : COLOR.danger,
                      background: stat.trend === "up" ? COLOR.successSoft : COLOR.dangerSoft,
                    }}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                </div>

                <h2
                  style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                  className="mt-4 text-2xl font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mt-1 text-sm" style={{ color: COLOR.textBody }}>
                  {stat.title}
                </p>
                <p className="mt-2 text-xs" style={{ color: COLOR.textMuted }}>
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Signature: delivery pipeline */}
        <div className="mf-card mb-8 rounded-xl p-6" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
                Delivery pipeline
              </h2>
              <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                Where this period's sends are right now, stage by stage.
              </p>
            </div>
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ fontFamily: FONT.mono, color: COLOR.primary, background: COLOR.primarySoft }}
            >
              <Clock3 size={12} />
              live
            </span>
          </div>

          <div className="flex items-start">
            {pipeline.map((stage, i) => {
              const Icon = stage.icon;
              const pctOfSent = i === 0 ? 100 : Math.round((stage.value / pipeline[0].value) * 100);
              const dropFromPrev =
                i === 0 ? null : Math.round(((pipeline[i - 1].value - stage.value) / pipeline[i - 1].value) * 100);

              return (
                <React.Fragment key={stage.label}>
                  <div className="flex w-28 shrink-0 flex-col items-center text-center sm:w-36">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: COLOR.primarySoft, border: `1px solid ${COLOR.primary}30` }}
                    >
                      <Icon size={18} style={{ color: COLOR.primary }} />
                    </div>
                    <p
                      style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                      className="mt-3 text-lg font-semibold"
                    >
                      {stage.value.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: COLOR.textBody }}>
                      {stage.label}
                    </p>
                    <p
                      style={{ fontFamily: FONT.mono, color: dropFromPrev ? COLOR.danger : COLOR.textMuted }}
                      className="mt-1 text-[11px]"
                    >
                      {dropFromPrev === null ? `${pctOfSent}% of sent` : `-${dropFromPrev}% drop-off`}
                    </p>
                  </div>

                  {i < pipeline.length - 1 && (
                    <div className="mf-flow-track mt-6 flex-1">
                      <span className="mf-flow-dot" style={{ animationDelay: "0s" }} />
                      <span className="mf-flow-dot" style={{ animationDelay: "0.9s" }} />
                      <span className="mf-flow-dot" style={{ animationDelay: "1.8s" }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main analytics */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Activity */}
          <div className="mf-card rounded-xl p-6 lg:col-span-2" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
              Email activity
            </h2>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Emails sent and opened over time.
            </p>

            <div style={{ height: 260 }} className="mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillSentA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR.dark} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={COLOR.dark} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillOpenedA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLOR.border} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: COLOR.textMuted, fontFamily: FONT.mono }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${COLOR.border}`,
                      background: COLOR.surface,
                      fontFamily: FONT.mono,
                      fontSize: 12,
                      color: COLOR.dark,
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={30}
                    formatter={(v) => (
                      <span style={{ fontFamily: FONT.body, fontSize: 12.5, color: COLOR.textBody }}>{v}</span>
                    )}
                  />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke={COLOR.dark} strokeWidth={2} fill="url(#fillSentA)" />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    name="Opened"
                    stroke={COLOR.primary}
                    strokeWidth={2}
                    fill="url(#fillOpenedA)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement */}
          <div className="mf-card rounded-xl p-6" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
              Engagement
            </h2>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Overall recipient engagement.
            </p>

            <div className="mt-8 space-y-6">
              <Metric label="Open rate" value="42.7%" width="43%" color={COLOR.primary} />
              <Metric label="Click rate" value="8.9%" width="9%" color={COLOR.success} />
              <Metric label="Bounce rate" value="1.6%" width="2%" color={COLOR.warning} />
              <Metric label="Unsubscribe rate" value="0.4%" width="1%" color={COLOR.danger} />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Campaigns */}
          <section className="mf-card rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
                Top campaigns
              </h2>
              <p className="text-sm" style={{ color: COLOR.textMuted }}>
                Campaigns with the highest engagement.
              </p>
            </div>

            <div>
              {campaigns.map((campaign, i) => (
                <div
                  key={campaign.name}
                  className="flex items-center justify-between p-5"
                  style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                >
                  <div>
                    <p className="font-medium" style={{ color: COLOR.dark }}>
                      {campaign.name}
                    </p>
                    <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-sm">
                      {campaign.recipients.toLocaleString()} recipients
                    </p>
                  </div>
                  <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="font-semibold">
                    {campaign.openRate}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Senders */}
          <section className="mf-card rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
                Sender performance
              </h2>
              <p className="text-sm" style={{ color: COLOR.textMuted }}>
                Performance of your sender accounts.
              </p>
            </div>

            <div>
              {senders.map((sender, i) => (
                <div
                  key={sender.email}
                  className="flex items-center justify-between p-5"
                  style={{ borderBottom: i < senders.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                >
                  <div>
                    <p className="font-medium" style={{ color: COLOR.dark }}>
                      {sender.email}
                    </p>
                    <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-sm">
                      {sender.sent.toLocaleString()} emails sent
                    </p>
                  </div>
                  <StatusBadge status={sender.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Small pieces                                                           */
/* ---------------------------------------------------------------------- */

interface MetricProps {
  label: string;
  value: string;
  width: string;
  color: string;
}

const Metric = ({ label, value, width, color }: MetricProps) => (
  <div>
    <div className="mb-2 flex justify-between">
      <span className="text-sm" style={{ color: COLOR.textBody }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-sm font-medium">
        {value}
      </span>
    </div>
    <div className="h-2 rounded-full" style={{ background: COLOR.bg }}>
      <div className="h-2 rounded-full" style={{ width, background: color }} />
    </div>
  </div>
);

interface StatusBadgeProps {
  status: Sender["status"];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<Sender["status"], { bg: string; text: string }> = {
    Excellent: { bg: COLOR.successSoft, text: COLOR.success },
    Good: { bg: COLOR.primarySoft, text: COLOR.primary },
    Average: { bg: COLOR.warningSoft, text: COLOR.warning },
  };
  const s = styles[status];

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
};

export default Analytics;