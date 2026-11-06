// AdminAnalytics.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

import { useCampaigns } from "../../contexts/CampaignContext";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import { UsersContext } from "../../contexts/UsersContext";
import {
  Users, Send, XCircle, Activity, Clock, RefreshCw,
  ChevronRight, ArrowUpRight, ArrowDownRight, TrendingUp, Zap,
  Menu, BarChart3, CheckCircle2, Inbox, AtSign, ArrowRight, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

/* ─────────────── design tokens (matches AdminDashboard) ─────────────── */

const T = {
  bg:          "#0E0F11",
  surface:     "#151618",
  surface2:    "#1B1C1F",
  surfaceHi:   "#232427",
  line:        "rgba(236,237,239,0.08)",
  lineStrong:  "rgba(236,237,239,0.14)",
  text:        "#ECEDEF",
  textMuted:   "#A1A4AB",
  textFaint:   "#6C7078",
  accent:      "#F0884D",
  accentSoft:  "rgba(240,136,77,0.12)",
  success:     "#5FB07A",
  warn:        "#D4A24C",
  danger:      "#D8665D",
  neutral1:    "#C9CBD0",
  neutral2:    "#8E9199",
  neutral3:    "#5E6169",
  neutral4:    "#44464C",
};

const FONT = {
  body: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.line}`;
const ICON = { size: 16, strokeWidth: 1.5 };

/* ─────────────── helpers (unchanged) ─────────────── */

const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? "0" : Number(n).toLocaleString();

const dayKey = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const monthKey = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const initialsOf = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
};

const formatRelative = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "—";
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/* ─────────────── shells (dashboard style) ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className = "", style,
}) => (
  <section className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING, ...style }}>
    {children}
  </section>
);

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4">
    <div>
      <h2 className="text-[14px] font-medium" style={{ color: T.text }}>{title}</h2>
      {hint && <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
    {label}
  </span>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium"
    style={{ background: T.surface2, color: T.textMuted, boxShadow: RING, fontFamily: FONT.mono }}
  >
    {initialsOf(name)}
  </div>
);

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
);

const chartTooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${T.lineStrong}`,
  background: T.surfaceHi,
  fontFamily: FONT.mono,
  fontSize: 12,
  color: T.text,
};

/* ─────────────── page ─────────────── */

const RANGES = ["7d", "30d", "90d", "1y"] as const;
type Range = (typeof RANGES)[number];

const RANGE_DAYS: Record<Range, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("30d");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number>(Date.now());

  /* ── data (unchanged) ── */
  const {
    allCampaigns = [],
    allLoading: campaignsLoading,
    allError: campaignsError,
    fetchAll: fetchCampaigns,
  } = useCampaigns();

  const logsCtx = React.useContext(EmailLogsContext);
  const emaillogs = logsCtx?.emaillogs ?? [];
  const logsLoading = logsCtx?.loading ?? false;
  const refetchLogs = logsCtx?.refetch;

  const senderCtx = React.useContext(SenderAccContext);
  const senderAcc = senderCtx?.senderAcc ?? [];
  const fetchAllSenderAccounts = senderCtx?.fetchAllSenderAccounts;

  const usersCtx = React.useContext(UsersContext);
  const users = usersCtx?.user ?? [];

  useEffect(() => {
    fetchCampaigns?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchCampaigns?.(),
        refetchLogs?.(),
        fetchAllSenderAccounts?.(),
      ]);
    } finally {
      setSyncedAt(Date.now());
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const loading = campaignsLoading || logsLoading;

  /* ── time window (unchanged) ── */
  const windowStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RANGE_DAYS[range]);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [range]);

  const windowedLogs = useMemo(() => {
    return emaillogs.filter((l: any) => {
      const t = new Date(l.sent_at ?? l.created_at ?? 0).getTime();
      return t >= windowStart;
    });
  }, [emaillogs, windowStart]);

  /* ── metrics (unchanged) ── */
  const metrics = useMemo(() => {
    const sent = windowedLogs.filter((l: any) => l.status === "Sent").length;
    const failed = windowedLogs.filter((l: any) => l.status === "Failed").length;
    const pending = windowedLogs.filter((l: any) => l.status === "Pending").length;
    const deliveryRate = windowedLogs.length
      ? Math.round((sent / windowedLogs.length) * 1000) / 10
      : 0;
    const failureRate = windowedLogs.length
      ? Math.round((failed / windowedLogs.length) * 1000) / 10
      : 0;
    const totalRecipients = allCampaigns.reduce(
      (sum: number, c: any) => sum + (c.recipients?.length ?? 0),
      0
    );
    return { sent, failed, pending, deliveryRate, failureRate, totalRecipients };
  }, [windowedLogs, allCampaigns]);

  const metricCards = [
    {
      label: "Emails sent",
      value: formatNumber(metrics.sent),
      delta: `${formatNumber(windowedLogs.length)} events`,
      trend: "up" as const,
      icon: Send,
      accent: T.accent,
      accentSoft: T.accentSoft,
    },
    {
      label: "Delivery rate",
      value: `${metrics.deliveryRate}%`,
      delta: metrics.deliveryRate >= 95 ? "healthy" : "review",
      trend: metrics.deliveryRate >= 95 ? ("up" as const) : ("down" as const),
      icon: CheckCircle2,
      accent: T.success,
      accentSoft: "rgba(95,176,122,0.12)",
    },
    {
      label: "Pending sends",
      value: formatNumber(metrics.pending),
      delta: `${Math.round((metrics.pending / (windowedLogs.length || 1)) * 100)}%`,
      trend: "up" as const,
      icon: Clock,
      accent: T.warn,
      accentSoft: "rgba(212,162,76,0.12)",
    },
    {
      label: "Recipients",
      value: formatNumber(metrics.totalRecipients),
      delta: `${formatNumber(allCampaigns.length)} campaigns`,
      trend: "up" as const,
      icon: Users,
      accent: T.neutral1,
      accentSoft: "rgba(201,203,208,0.10)",
    },
    {
      label: "Failure rate",
      value: `${metrics.failureRate}%`,
      delta: `${formatNumber(metrics.failed)} failed`,
      trend: metrics.failureRate === 0 ? ("up" as const) : ("down" as const),
      icon: XCircle,
      accent: T.danger,
      accentSoft: "rgba(216,102,93,0.12)",
    },
    {
      label: "Active users",
      value: formatNumber(users.length),
      delta: `${senderAcc.length} senders`,
      trend: "up" as const,
      icon: Activity,
      accent: T.neutral2,
      accentSoft: "rgba(142,145,153,0.10)",
    },
  ];

  /* ── weekly activity (unchanged) ── */
  const weeklyData = useMemo(() => {
    const buckets = new Map<string, { sent: number; failed: number; pending: number }>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), { sent: 0, failed: 0, pending: 0 });
    }
    emaillogs.forEach((l: any) => {
      const k = dayKey(l.sent_at ?? l.created_at);
      if (!k || !buckets.has(k)) return;
      const b = buckets.get(k)!;
      if (l.status === "Sent") b.sent++;
      else if (l.status === "Failed") b.failed++;
      else b.pending++;
    });
    return Array.from(buckets.entries()).map(([k, v]) => ({
      day: new Date(k).toLocaleDateString(undefined, { weekday: "short" }),
      sent: v.sent,
      failed: v.failed,
      pending: v.pending,
    }));
  }, [emaillogs]);

  /* ── monthly trend (unchanged) ── */
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, { sent: number; failed: number }>();
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(k, { sent: 0, failed: 0 });
    }
    emaillogs.forEach((l: any) => {
      const k = monthKey(l.sent_at ?? l.created_at);
      if (!k || !buckets.has(k)) return;
      const b = buckets.get(k)!;
      if (l.status === "Sent") b.sent++;
      else if (l.status === "Failed") b.failed++;
    });
    return Array.from(buckets.entries()).map(([k, v]) => {
      const [y, m] = k.split("-");
      return {
        month: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short" }),
        sent: v.sent,
        failed: v.failed,
      };
    });
  }, [emaillogs]);

  /* ── engagement pie (unchanged) ── */
  const engagementData = useMemo(() => {
    const sent = windowedLogs.filter((l: any) => l.status === "Sent").length;
    const pending = windowedLogs.filter((l: any) => l.status === "Pending").length;
    const failed = windowedLogs.filter((l: any) => l.status === "Failed").length;
    const total = sent + pending + failed || 1;
    return [
      { name: "Sent",    value: Math.round((sent / total) * 1000) / 10,    raw: sent,    color: T.success },
      { name: "Pending", value: Math.round((pending / total) * 1000) / 10, raw: pending, color: T.warn },
      { name: "Failed",  value: Math.round((failed / total) * 1000) / 10,  raw: failed,  color: T.danger },
    ];
  }, [windowedLogs]);

  const engagementTop = engagementData[0];
  const engagementTotal = engagementData.reduce((s, e) => s + e.value, 0) || 1;

  /* ── sender distribution (unchanged) ── */
  const senderData = useMemo(() => {
    const counts = senderAcc.map((a: any) => {
      const used = windowedLogs.filter((l: any) => l.sender_account_id === a.id).length;
      return { name: a.email || a.display_name || `account #${a.id}`, value: used };
    });
    counts.sort((a, b) => b.value - a.value);
    const top = counts.slice(0, 4);
    const rest = counts.slice(4).reduce((s, c) => s + c.value, 0);
    if (rest > 0) top.push({ name: "Other", value: rest });
    const total = top.reduce((s, c) => s + c.value, 0) || 1;
    const colors = [T.accent, T.neutral1, T.success, T.neutral2, T.neutral3];
    return top.map((c, i) => ({
      name: c.name,
      value: Math.round((c.value / total) * 1000) / 10,
      raw: c.value,
      color: colors[i % colors.length],
    }));
  }, [senderAcc, windowedLogs]);

  /* ── top workspaces (unchanged) ── */
  const topWorkspaces = useMemo(() => {
    type Agg = { name: string; email: string; sent: number; failed: number; campaigns: number; recipients: number };
    const map = new Map<number, Agg>();
    allCampaigns.forEach((c: any) => {
      const uid = c.user_id;
      if (!uid) return;
      const e = map.get(uid) ?? {
        name: c.user?.username || c.user?.email || `user #${uid}`,
        email: c.user?.email || "",
        sent: 0, failed: 0, campaigns: 0, recipients: 0,
      };
      e.campaigns++;
      e.recipients += c.recipients?.length ?? 0;
      map.set(uid, e);
    });
    windowedLogs.forEach((l: any) => {
      const uid = l.user_id ?? l.campaign?.user_id;
      if (!uid || !map.has(uid)) return;
      const e = map.get(uid)!;
      if (l.status === "Sent") e.sent++;
      else if (l.status === "Failed") e.failed++;
    });
    const arr = Array.from(map.values()).sort((a, b) => b.sent - a.sent).slice(0, 5);
    const maxSent = arr[0]?.sent || 1;
    return arr.map((w) => ({
      ...w,
      deliveryRate: w.sent + w.failed ? Math.round((w.sent / (w.sent + w.failed)) * 1000) / 10 : 0,
      share: Math.round((w.sent / maxSent) * 100),
    }));
  }, [allCampaigns, windowedLogs]);

  /* ── peak send window (unchanged) ── */
  const peakHour = useMemo(() => {
    const hours = new Array(24).fill(0);
    windowedLogs.forEach((l: any) => {
      const iso = l.sent_at ?? l.created_at;
      if (!iso) return;
      const h = new Date(iso).getHours();
      if (!isNaN(h)) hours[h]++;
    });
    const maxIdx = hours.indexOf(Math.max(...hours));
    if (maxIdx < 0 || hours[maxIdx] === 0) return null;
    const fmt = (h: number) => {
      const ampm = h < 12 ? "AM" : "PM";
      const hh = h % 12 === 0 ? 12 : h % 12;
      return `${hh}:00 ${ampm}`;
    };
    return { start: fmt(maxIdx), end: fmt((maxIdx + 2) % 24), count: hours[maxIdx] };
  }, [windowedLogs]);

  const stagger = (i: number) => ({ "--i": i } as React.CSSProperties);
  const syncOk = !campaignsError;

  /* ─────────────── render ─────────────── */
  return (
    <div className="aa-root h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        .aa-root { --ease: cubic-bezier(0.2, 0, 0, 1); }

        @keyframes enter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .enter { animation: enter 240ms var(--ease) both; animation-delay: calc(var(--i, 0) * 40ms); }

        .aa-root button, .aa-root a { transition-property: color, background-color, box-shadow, opacity; transition-duration: 120ms; transition-timing-function: var(--ease); }
        .aa-root button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .row-hover { transition: background-color 120ms var(--ease); }
        .row-hover:hover { background: rgba(236,237,239,0.03); }

        .btn-quiet:hover { background: rgba(236,237,239,0.05); color: ${T.text}; }
        .btn-press:active { transform: scale(0.98); }

        .aa-main::-webkit-scrollbar { width: 8px; }
        .aa-main::-webkit-scrollbar-track { background: transparent; }
        .aa-main::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }

        @media (max-width: 640px) { .aa-metrics { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .aa-metrics { grid-template-columns: 1fr; } }

        @media (prefers-reduced-motion: reduce) {
          .enter { animation: none !important; }
          .btn-press:active { transform: none; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="aa-main flex-1 overflow-y-auto" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1440 }}>

          {/* Header — dashboard style */}
          <header className="enter flex flex-col md:flex-row md:items-end justify-between gap-4" style={stagger(0)}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg btn-quiet"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu {...ICON} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: T.accentSoft, color: T.accent, fontFamily: FONT.mono }}
                  >
                    <BarChart3 size={11} strokeWidth={1.5} />
                    Admin view
                  </span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · platform wide
                  </span>
                </div>
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>
                  Analytics
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  <span className="inline-flex items-center gap-2">
                    <Dot color={syncOk ? T.success : T.warn} />
                    {syncOk ? `Synced ${formatRelative(new Date(syncedAt).toISOString())}` : "Sync issue"}
                  </span>
                  <span style={{ color: T.textFaint }}>·</span>
                  <span>last {RANGE_DAYS[range]} days</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Time range"
                className="inline-flex rounded-lg p-1"
                style={{ background: T.surface, boxShadow: RING }}
              >
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className="px-3 py-1 rounded-md text-[12px] font-medium"
                    style={{
                      background: range === r ? T.surfaceHi : "transparent",
                      color: range === r ? T.text : T.textMuted,
                      boxShadow: range === r ? `inset 0 0 0 1px ${T.lineStrong}` : "none",
                      fontFamily: FONT.mono,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-quiet btn-press inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium disabled:opacity-60"
                style={{ color: T.textMuted, background: T.surface, boxShadow: RING }}
              >
                <RefreshCw {...ICON} size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </header>

          {campaignsError && (
            <div
              className="enter rounded-lg px-4 py-3 text-[12px] flex items-center gap-2"
              style={{ background: T.surface, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.danger}55`, ...stagger(1) }}
            >
              <AlertTriangle {...ICON} size={14} />
              {campaignsError}
            </div>
          )}

          {/* Metrics — same 6 cards, dashboard styling */}
          <div className="enter aa-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" style={stagger(1)}>
            {metricCards.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
              <Card key={label} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: accentSoft, color: accent }}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                  </div>
                  <span
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      background: trend === "up" ? "rgba(95,176,122,0.10)" : "rgba(216,102,93,0.10)",
                      color: trend === "up" ? T.success : T.danger,
                      fontFamily: FONT.mono,
                    }}
                  >
                    {trend === "up" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {delta}
                  </span>
                </div>
                <p className="text-[24px] font-medium tracking-tight leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                  {value}
                </p>
                <p className="text-[12px] mt-2" style={{ color: T.textMuted }}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Weekly activity + send outcomes */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(2)}>
            <Card className="lg:col-span-8">
              <CardHeader
                title="Weekly activity"
                hint="Last 7 days · sent vs pending vs failed"
                right={
                  <div className="flex items-center gap-4">
                    <LegendDot color={T.success} label="Sent" />
                    <LegendDot color={T.warn}    label="Pending" />
                    <LegendDot color={T.danger}  label="Failed" />
                  </div>
                }
              />
              <div className="px-4 pb-5" style={{ height: 280 }}>
                {loading && weeklyData.every((d) => d.sent === 0 && d.failed === 0 && d.pending === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.neutral2, borderTopColor: "transparent" }} />
                  </div>
                ) : weeklyData.some((d) => d.sent > 0 || d.failed > 0 || d.pending > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.success} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={T.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.warn} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={T.warn} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ stroke: T.lineStrong, strokeDasharray: "3 3" }}
                        contentStyle={chartTooltipStyle}
                      />
                      <Area type="monotone" dataKey="sent"    stroke={T.success} strokeWidth={2} fill="url(#sentGrad)"    isAnimationActive={false} />
                      <Area type="monotone" dataKey="pending" stroke={T.warn}    strokeWidth={2} fill="url(#pendingGrad)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="failed"  stroke={T.danger}  strokeWidth={2} fill="none"              isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity {...ICON} size={20} style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No activity in this window</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader title="Send outcomes" hint="Share by log status" />
              <div className="px-5 pb-5">
                {windowedLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No logs in this window</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={engagementData} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={2} isAnimationActive={false}>
                              {engagementData.map((e) => (
                                <Cell key={e.name} fill={e.color} stroke="none" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[20px] font-medium leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {engagementTop.value}%
                          </span>
                          <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: T.textFaint }}>
                            Sent
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        {engagementData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-[12px]">
                            <span className="flex items-center gap-2" style={{ color: T.textMuted }}>
                              <Dot color={item.color} />
                              {item.name}
                            </span>
                            <span style={{ fontFamily: FONT.mono, color: T.text }} className="tabular-nums">
                              {formatNumber(item.raw)}
                              <span style={{ color: T.textFaint }}> · {Math.round((item.value / engagementTotal) * 100)}%</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Monthly trend + sender distribution */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(3)}>
            <Card className="lg:col-span-8">
              <CardHeader
                title="Monthly trend"
                hint="Last 8 months · sent vs failed"
                right={
                  <div className="flex items-center gap-4">
                    <LegendDot color={T.success} label="Sent" />
                    <LegendDot color={T.danger}  label="Failed" />
                  </div>
                }
              />
              <div className="px-4 pb-5" style={{ height: 280 }}>
                {monthlyData.some((d) => d.sent > 0 || d.failed > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip cursor={{ fill: "rgba(236,237,239,0.03)" }} contentStyle={chartTooltipStyle} />
                      <Bar dataKey="sent"   fill={T.success} radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                      <Bar dataKey="failed" fill={T.danger}  radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BarChart3 {...ICON} size={20} style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No monthly data yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader title="Sender volume" hint="Share of sends per sender account" />
              <div className="px-5 pb-5">
                {senderData.length === 0 ? (
                  <div className="py-12 text-center">
                    <AtSign {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No sender activity</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={senderData} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={2} isAnimationActive={false}>
                            {senderData.map((e) => (
                              <Cell key={e.name} fill={e.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[18px] font-medium leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {senderData[0].value}%
                        </span>
                        <span className="text-[10px] uppercase tracking-widest mt-1 truncate px-1 max-w-[90px]"
                          style={{ color: T.textFaint }}>
                          Top sender
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {senderData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[12px] gap-2">
                          <span className="flex items-center gap-2 min-w-0" style={{ color: T.textMuted }}>
                            <Dot color={item.color} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="shrink-0 tabular-nums" style={{ fontFamily: FONT.mono, color: T.text }}>
                            {formatNumber(item.raw)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.line}` }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: T.accentSoft, color: T.accent }}
                    >
                      <Zap size={14} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        Peak send window
                      </p>
                      <p className="text-[14px] font-medium mt-1 tabular-nums" style={{ color: T.text }}>
                        {peakHour ? `${peakHour.start} – ${peakHour.end}` : "—"}
                      </p>
                      <p className="text-[12px] mt-1 tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                        {peakHour ? `${formatNumber(peakHour.count)} sends in peak hour` : "Not enough data yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Top workspaces — same table, dashboard styling */}
          <Card className="enter overflow-hidden" style={stagger(4)}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
              <div>
                <h2 className="text-[14px] font-medium" style={{ color: T.text }}>
                  Top performing workspaces
                </h2>
                <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
                  Ranked by send volume in the selected window
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="btn-quiet inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md"
                style={{ color: T.textMuted }}
              >
                View all <ChevronRight {...ICON} size={14} />
              </button>
            </div>

            {topWorkspaces.length === 0 ? (
              <div className="py-12 text-center" style={{ borderTop: `1px solid ${T.line}` }}>
                <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No workspace activity in this window</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="text-[12px]" style={{ color: T.textFaint }}>
                      <th className="px-5 py-3 font-normal">Workspace</th>
                      <th className="px-3 py-3 font-normal text-right">Sent</th>
                      <th className="px-3 py-3 font-normal" style={{ width: 200 }}>Delivery rate</th>
                      <th className="px-3 py-3 font-normal text-right">Campaigns</th>
                      <th className="px-5 py-3 font-normal text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWorkspaces.map((w) => {
                      const trendMeta =
                        w.deliveryRate >= 95
                          ? { fg: T.success, label: "High" }
                          : w.deliveryRate >= 80
                          ? { fg: T.warn,    label: "Medium" }
                          : { fg: T.danger,  label: "Low" };
                      return (
                        <tr key={w.name} className="row-hover cursor-pointer"
                          style={{ borderTop: `1px solid ${T.line}` }}
                          onClick={() => navigate("/admin/campaigns")}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={w.name} />
                              <div className="min-w-0">
                                <p className="text-[13px] truncate" style={{ color: T.text }}>{w.name}</p>
                                {w.email && (
                                  <p className="text-[12px] truncate mt-1" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                    {w.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums"
                            style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                            {formatNumber(w.sent)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] w-12 text-right tabular-nums"
                                style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                {w.deliveryRate}%
                              </span>
                              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${w.deliveryRate}%`, background: trendMeta.fg }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums"
                            style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                            {formatNumber(w.campaigns)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap mr-2"
                              style={{ color: trendMeta.fg }}>
                              <TrendingUp size={12} strokeWidth={1.5} />
                              {trendMeta.label}
                            </span>
                            <ChevronRight {...ICON} size={14} className="inline-block align-middle"
                              style={{ color: T.textFaint }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;