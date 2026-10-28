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
  Menu, BarChart3, CheckCircle2, Inbox, AtSign,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
  purple:       "#A78BFA",
  purpleSoft:   "rgba(167,139,250,0.12)",
  purpleBorder: "rgba(167,139,250,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

/* ─────────────── helpers ─────────────── */

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

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className = "", style,
}) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING, ...style }}>
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 pt-4 pb-3">
    <div>
      <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>{title}</h2>
      {hint && <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textMuted }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
    {label}
  </span>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold"
    style={{
      background: T.brandSoft,
      color: T.brand,
      boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
      fontFamily: FONT.mono,
    }}
  >
    {initialsOf(name)}
  </div>
);

const chartTooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: T.surface2,
  fontFamily: FONT.mono,
  fontSize: 11,
  color: T.text,
  boxShadow: "0 12px 30px -12px rgba(0,0,0,0.7)",
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

  /* ── data ── */
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
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const loading = campaignsLoading || logsLoading;

  /* ── time window ── */
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

  /* ── metrics ── */
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
      accent: T.brand,
      accentSoft: T.brandSoft,
    },
    {
      label: "Delivery rate",
      value: `${metrics.deliveryRate}%`,
      delta: metrics.deliveryRate >= 95 ? "healthy" : "review",
      trend: metrics.deliveryRate >= 95 ? ("up" as const) : ("down" as const),
      icon: CheckCircle2,
      accent: T.success,
      accentSoft: T.successSoft,
    },
    {
      label: "Pending sends",
      value: formatNumber(metrics.pending),
      delta: `${Math.round((metrics.pending / (windowedLogs.length || 1)) * 100)}%`,
      trend: "up" as const,
      icon: Clock,
      accent: T.warn,
      accentSoft: T.warnSoft,
    },
    {
      label: "Recipients",
      value: formatNumber(metrics.totalRecipients),
      delta: `${formatNumber(allCampaigns.length)} campaigns`,
      trend: "up" as const,
      icon: Users,
      accent: T.info,
      accentSoft: T.infoSoft,
    },
    {
      label: "Failure rate",
      value: `${metrics.failureRate}%`,
      delta: `${formatNumber(metrics.failed)} failed`,
      trend: metrics.failureRate === 0 ? ("up" as const) : ("down" as const),
      icon: XCircle,
      accent: T.danger,
      accentSoft: T.dangerSoft,
    },
    {
      label: "Active users",
      value: formatNumber(users.length),
      delta: `${senderAcc.length} senders`,
      trend: "up" as const,
      icon: Activity,
      accent: T.purple,
      accentSoft: T.purpleSoft,
    },
  ];

  /* ── weekly activity ── */
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

  /* ── monthly trend ── */
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

  /* ── engagement pie ── */
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

  /* ── sender distribution ── */
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
    const colors = [T.brand, T.warn, T.success, T.purple, T.textMuted];
    return top.map((c, i) => ({
      name: c.name,
      value: Math.round((c.value / total) * 1000) / 10,
      raw: c.value,
      color: colors[i % colors.length],
    }));
  }, [senderAcc, windowedLogs]);

  /* ── top workspaces ── */
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

  /* ── peak send window ── */
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

  /* ─────────────── render ─────────────── */
  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .aa-main::-webkit-scrollbar { width: 8px; }
        .aa-main::-webkit-scrollbar-track { background: transparent; }
        .aa-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .aa-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @media (max-width: 640px) { .aa-metrics { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .aa-metrics { grid-template-columns: 1fr; } }
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
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
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
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                  >
                    <BarChart3 size={10} />
                    Admin view
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · platform wide
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Analytics
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Platform-wide performance across every workspace and campaign.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <div
                className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                {RANGES.map((r) => {
                  const active = r === range;
                  return (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className="rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all whitespace-nowrap"
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
            </div>
          </header>

          {campaignsError && (
            <div className="mb-5 rounded-lg px-3.5 py-3 text-[12.5px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              {campaignsError}
            </div>
          )}

          {/* Metrics */}
          <div className="aa-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
            {metricCards.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
              <Card key={label} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: accentSoft, color: accent }}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-medium"
                    style={{
                      background: trend === "up" ? T.successSoft : T.dangerSoft,
                      color: trend === "up" ? T.success : T.danger,
                      fontFamily: FONT.mono,
                    }}
                  >
                    {trend === "up" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {delta}
                  </span>
                </div>
                <p className="text-[24px] font-semibold tracking-tight leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                  {value}
                </p>
                <p className="text-[11.5px] mt-2" style={{ color: T.textMuted }}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Weekly activity + send outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Weekly activity"
                hint="Last 7 days · sent vs pending vs failed"
                right={
                  <div className="flex items-center gap-3">
                    <LegendDot color={T.success} label="Sent" />
                    <LegendDot color={T.warn} label="Pending" />
                    <LegendDot color={T.danger} label="Failed" />
                  </div>
                }
              />
              <div className="px-3 md:px-4 pb-4" style={{ height: 220 }}>
                {loading && weeklyData.every((d) => d.sent === 0 && d.failed === 0 && d.pending === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.brand, borderTopColor: "transparent" }} />
                  </div>
                ) : weeklyData.some((d) => d.sent > 0 || d.failed > 0 || d.pending > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.success} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={T.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.warn} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={T.warn} stopOpacity={0} />
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
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ stroke: T.border, strokeDasharray: "3 3" }}
                        contentStyle={chartTooltipStyle}
                      />
                      <Area type="monotone" dataKey="sent"    stroke={T.success} strokeWidth={2} fill="url(#sentGrad)" />
                      <Area type="monotone" dataKey="pending" stroke={T.warn}    strokeWidth={2} fill="url(#pendingGrad)" />
                      <Area type="monotone" dataKey="failed"  stroke={T.danger}  strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity size={20} className="mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No activity in this window</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Send outcomes" hint="Share by log status" />
              <div className="px-4 md:px-5 pb-4">
                {windowedLogs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Inbox size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No logs in this window</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={engagementData} dataKey="value" innerRadius={40} outerRadius={56} paddingAngle={2}>
                            {engagementData.map((e) => (
                              <Cell key={e.name} fill={e.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[20px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {engagementTop.value}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: T.textFaint }}>
                          Sent
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {engagementData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2" style={{ color: T.textMuted }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                            {item.name}
                          </span>
                          <span style={{ fontFamily: FONT.mono, color: T.text }} className="font-medium">
                            {formatNumber(item.raw)}
                            <span style={{ color: T.textFaint }}> · {Math.round((item.value / engagementTotal) * 100)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Monthly + sender distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Monthly trend"
                hint="Last 8 months · sent vs failed"
                right={
                  <div className="flex items-center gap-3">
                    <LegendDot color={T.success} label="Sent" />
                    <LegendDot color={T.danger}  label="Failed" />
                  </div>
                }
              />
              <div className="px-3 md:px-4 pb-4" style={{ height: 220 }}>
                {monthlyData.some((d) => d.sent > 0 || d.failed > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={T.borderSoft} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={chartTooltipStyle} />
                      <Bar dataKey="sent"   fill={T.success} radius={[4, 4, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="failed" fill={T.danger}  radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BarChart3 size={20} className="mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No monthly data yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Sender volume" hint="Share of sends per sender account" />
              <div className="px-4 md:px-5 pb-4">
                {senderData.length === 0 ? (
                  <div className="py-10 text-center">
                    <AtSign size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No sender activity</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={senderData} dataKey="value" innerRadius={40} outerRadius={56} paddingAngle={2}>
                            {senderData.map((e) => (
                              <Cell key={e.name} fill={e.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[18px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {senderData[0].value}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1 truncate px-1 max-w-22.5"
                          style={{ color: T.textFaint }}>
                          Top sender
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {senderData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[11.5px] gap-2">
                          <span className="flex items-center gap-2 min-w-0" style={{ color: T.textMuted }}>
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="shrink-0 font-medium" style={{ fontFamily: FONT.mono, color: T.text }}>
                            {formatNumber(item.raw)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-start gap-2.5">
                    <div
                      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ background: T.warnSoft, color: T.warn }}
                    >
                      <Zap size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>Peak send window</p>
                      <p className="text-[14px] font-semibold mt-0.5" style={{ color: T.text }}>
                        {peakHour ? `${peakHour.start} – ${peakHour.end}` : "—"}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                        {peakHour ? `${formatNumber(peakHour.count)} sends in peak hour` : "Not enough data yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Top workspaces */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>
                  Top performing workspaces
                </h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                  Ranked by send volume in the selected window
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:text-white"
                style={{ color: T.brand }}
              >
                View all <ChevronRight size={11} />
              </button>
            </div>

            {topWorkspaces.length === 0 ? (
              <div className="py-14 text-center">
                <Inbox size={20} className="mx-auto mb-2" style={{ color: T.border }} />
                <p className="text-[12px]" style={{ color: T.textFaint }}>No workspace activity in this window</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Workspace</th>
                      <th className="px-3 py-2.5 font-medium text-right">Sent</th>
                      <th className="px-3 py-2.5 font-medium">Delivery rate</th>
                      <th className="px-3 py-2.5 font-medium text-right">Campaigns</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWorkspaces.map((w) => {
                      const trendMeta =
                        w.deliveryRate >= 95
                          ? { fg: T.success, bg: T.successSoft, ring: T.successBorder, label: "High" }
                          : w.deliveryRate >= 80
                          ? { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    label: "Medium" }
                          : { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  label: "Low" };
                      return (
                        <tr key={w.name} className="transition-colors hover:bg-white/2"
                          style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <td className="px-4 md:px-5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={w.name} />
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{w.name}</p>
                                {w.email && (
                                  <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                    {w.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                            style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                            {formatNumber(w.sent)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11.5px] w-12 text-right tabular-nums"
                                style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                {w.deliveryRate}%
                              </span>
                              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${w.deliveryRate}%`, background: trendMeta.fg }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                            style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                            {formatNumber(w.campaigns)}
                          </td>
                          <td className="px-4 md:px-5 py-3 text-right">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap mr-1.5"
                              style={{ background: trendMeta.bg, color: trendMeta.fg, boxShadow: `inset 0 0 0 1px ${trendMeta.ring}` }}
                            >
                              <TrendingUp size={9} />
                              {trendMeta.label}
                            </span>
                            <button
                              onClick={() => navigate("/admin/campaigns")}
                              className="p-1.5 rounded-md transition-colors hover:bg-white/5 align-middle"
                              style={{ color: T.textFaint }}
                              aria-label="View workspace"
                            >
                              <ChevronRight size={13} />
                            </button>
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