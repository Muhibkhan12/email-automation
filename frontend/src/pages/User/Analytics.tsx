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

        /* Custom scrollbar for the main content */
        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: ${COLOR.bg};
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: ${COLOR.border};
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: ${COLOR.borderHover};
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .mf-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .mf-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-pipeline-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .mf-pipeline-item {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .mf-pipeline-connector {
            display: none !important;
          }
          .mf-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mf-range-selector {
            width: 100% !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .mf-range-btn {
            font-size: 0.75rem !important;
            padding: 0.5rem 0.75rem !important;
          }
          .mf-bottom-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-activity-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-pipeline-stage {
            width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .mf-range-selector {
            gap: 0.25rem !important;
          }
          .mf-range-btn {
            padding: 0.4rem 0.6rem !important;
            font-size: 0.7rem !important;
          }
        }
      `}</style>

      {/* Sidebar - sticky on all screen sizes */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" style={{ height: "100vh" }}>
        {/* Header */}
        <div className="mf-header mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
              className="text-2xl md:text-3xl font-bold"
            >
              Analytics
            </h1>
            <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
              Track deliverability and engagement across every send.
            </p>
          </div>

          <div
            className="mf-range-selector flex flex-wrap items-center gap-1 rounded-xl p-1"
            style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
          >
            {RANGES.map((r) => {
              const active = r === range;
              return (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="mf-range-btn rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap"
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
        <div className="mf-stats-grid mb-6 grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="mf-card rounded-xl p-4 md:p-5"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={14} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-semibold"
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
                  className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textBody }}>
                  {stat.title}
                </p>
                <p className="mt-1.5 md:mt-2 text-[10px] md:text-xs" style={{ color: COLOR.textMuted }}>
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Signature: delivery pipeline */}
        <div className="mf-card mb-6 md:mb-8 rounded-xl p-4 md:p-6" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-base md:text-lg font-semibold">
                Delivery pipeline
              </h2>
              <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
                Where this period's sends are right now, stage by stage.
              </p>
            </div>
            <span
              className="flex items-center gap-1.5 rounded-full px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium whitespace-nowrap"
              style={{ fontFamily: FONT.mono, color: COLOR.primary, background: COLOR.primarySoft }}
            >
              <Clock3 size={12} />
              live
            </span>
          </div>

          <div className="mf-pipeline-container flex flex-wrap items-start gap-4 md:gap-2">
            {pipeline.map((stage, i) => {
              const Icon = stage.icon;
              const pctOfSent = i === 0 ? 100 : Math.round((stage.value / pipeline[0].value) * 100);
              const dropFromPrev =
                i === 0 ? null : Math.round(((pipeline[i - 1].value - stage.value) / pipeline[i - 1].value) * 100);

              return (
                <React.Fragment key={stage.label}>
                  <div className="mf-pipeline-stage flex-1 min-w-[80px] md:min-w-[100px] flex flex-col items-center text-center">
                    <div
                      className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full"
                      style={{ background: COLOR.primarySoft, border: `1px solid ${COLOR.primary}30` }}
                    >
                      <Icon size={16} style={{ color: COLOR.primary }} />
                    </div>
                    <p
                      style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                      className="mt-2 md:mt-3 text-base md:text-lg font-semibold"
                    >
                      {stage.value.toLocaleString()}
                    </p>
                    <p className="text-[10px] md:text-xs" style={{ color: COLOR.textBody }}>
                      {stage.label}
                    </p>
                    <p
                      style={{ fontFamily: FONT.mono, color: dropFromPrev ? COLOR.danger : COLOR.textMuted }}
                      className="mt-0.5 md:mt-1 text-[9px] md:text-[11px]"
                    >
                      {dropFromPrev === null ? `${pctOfSent}% of sent` : `-${dropFromPrev}% drop-off`}
                    </p>
                  </div>

                  {i < pipeline.length - 1 && (
                    <div className="mf-pipeline-connector mf-flow-track flex-1 min-w-[20px] mt-6 md:mt-8">
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
        <div className="mf-activity-grid mb-6 md:mb-8 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          {/* Activity */}
          <div className="mf-card rounded-xl p-4 md:p-6 lg:col-span-2" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-base md:text-lg font-semibold">
              Email activity
            </h2>
            <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
              Emails sent and opened over time.
            </p>

            <div style={{ height: 220 }} className="mt-4 md:mt-6">
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
                    height={25}
                    formatter={(v) => (
                      <span style={{ fontFamily: FONT.body, fontSize: 11, color: COLOR.textBody }}>{v}</span>
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
          <div className="mf-card rounded-xl p-4 md:p-6" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-base md:text-lg font-semibold">
              Engagement
            </h2>
            <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
              Overall recipient engagement.
            </p>

            <div className="mt-6 md:mt-8 space-y-4 md:space-y-6">
              <Metric label="Open rate" value="42.7%" width="43%" color={COLOR.primary} />
              <Metric label="Click rate" value="8.9%" width="9%" color={COLOR.success} />
              <Metric label="Bounce rate" value="1.6%" width="2%" color={COLOR.warning} />
              <Metric label="Unsubscribe rate" value="0.4%" width="1%" color={COLOR.danger} />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mf-bottom-grid grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {/* Campaigns */}
          <section className="mf-card rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-4 md:p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-base md:text-lg font-semibold">
                Top campaigns
              </h2>
              <p className="text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
                Campaigns with the highest engagement.
              </p>
            </div>

            <div>
              {campaigns.map((campaign, i) => (
                <div
                  key={campaign.name}
                  className="flex items-center justify-between p-4 md:p-5"
                  style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm md:text-base font-medium truncate" style={{ color: COLOR.dark }}>
                      {campaign.name}
                    </p>
                    <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs md:text-sm">
                      {campaign.recipients.toLocaleString()} recipients
                    </p>
                  </div>
                  <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="font-semibold text-sm md:text-base whitespace-nowrap">
                    {campaign.openRate}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Senders */}
          <section className="mf-card rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-4 md:p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-base md:text-lg font-semibold">
                Sender performance
              </h2>
              <p className="text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
                Performance of your sender accounts.
              </p>
            </div>

            <div>
              {senders.map((sender, i) => (
                <div
                  key={sender.email}
                  className="flex items-center justify-between p-4 md:p-5"
                  style={{ borderBottom: i < senders.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm md:text-base font-medium truncate" style={{ color: COLOR.dark }}>
                      {sender.email}
                    </p>
                    <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs md:text-sm">
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
    <div className="mb-1.5 md:mb-2 flex justify-between">
      <span className="text-xs md:text-sm" style={{ color: COLOR.textBody }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="text-xs md:text-sm font-medium">
        {value}
      </span>
    </div>
    <div className="h-1.5 md:h-2 rounded-full" style={{ background: COLOR.bg }}>
      <div className="h-1.5 md:h-2 rounded-full transition-all" style={{ width, background: color }} />
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
      className="rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
};

export default Analytics;