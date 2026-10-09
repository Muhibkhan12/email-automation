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

/* ─────────────────────────── Helpers ─────────────────────────── */

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

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-semibold text-white font-mono"
    style={{
      background: `linear-gradient(135deg, ${C.primary}44, ${C.primary}11)`,
      boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
    }}
  >
    {initialsOf(name)}
  </div>
);

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

  /* ── fetch / refresh ── */
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

  /* ── logs in current window ── */
  const windowedLogs = useMemo(() => {
    return emaillogs.filter((l: any) => {
      const t = new Date(l.sent_at ?? l.created_at ?? 0).getTime();
      return t >= windowStart;
    });
  }, [emaillogs, windowStart]);

  /* ── top-line metrics ── */
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
      title: "Total emails sent",
      value: formatNumber(metrics.sent),
      change: `${formatNumber(windowedLogs.length)} events`,
      trend: "up" as const,
      icon: Send,
      accent: C.primary,
      accentSoft: C.primarySoft,
      accentRing: C.primaryRing,
    },
    {
      title: "Delivery rate",
      value: `${metrics.deliveryRate}%`,
      change: metrics.deliveryRate >= 95 ? "healthy" : "review",
      trend: metrics.deliveryRate >= 95 ? ("up" as const) : ("down" as const),
      icon: CheckCircle2,
      accent: C.success,
      accentSoft: C.successSoft,
      accentRing: C.successRing,
    },
    {
      title: "Pending sends",
      value: formatNumber(metrics.pending),
      change: `${Math.round((metrics.pending / (windowedLogs.length || 1)) * 100)}%`,
      trend: "up" as const,
      icon: Clock,
      accent: C.warning,
      accentSoft: C.warningSoft,
      accentRing: C.warningRing,
    },
    {
      title: "Total recipients",
      value: formatNumber(metrics.totalRecipients),
      change: `${formatNumber(allCampaigns.length)} campaigns`,
      trend: "up" as const,
      icon: Users,
      accent: C.purple,
      accentSoft: C.purpleSoft,
      accentRing: C.purpleRing,
    },
    {
      title: "Failure rate",
      value: `${metrics.failureRate}%`,
      change: `${formatNumber(metrics.failed)} failed`,
      trend: metrics.failureRate === 0 ? ("up" as const) : ("down" as const),
      icon: XCircle,
      accent: C.danger,
      accentSoft: C.dangerSoft,
      accentRing: C.dangerRing,
    },
    {
      title: "Active users",
      value: formatNumber(users.length),
      change: `${senderAcc.length} senders`,
      trend: "up" as const,
      icon: Activity,
      accent: C.blue,
      accentSoft: C.blueSoft,
      accentRing: C.blueRing,
    },
  ];

  /* ── weekly activity (last 7 days) ── */
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

  /* ── monthly trend (last 8 months) ── */
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

  /* ── engagement pie (send outcomes) ── */
  const engagementData = useMemo(() => {
    const sent = windowedLogs.filter((l: any) => l.status === "Sent").length;
    const pending = windowedLogs.filter((l: any) => l.status === "Pending").length;
    const failed = windowedLogs.filter((l: any) => l.status === "Failed").length;
    const total = sent + pending + failed || 1;
    return [
      { name: "Sent",    value: Math.round((sent / total) * 1000) / 10,    raw: sent,    color: C.success },
      { name: "Pending", value: Math.round((pending / total) * 1000) / 10, raw: pending, color: C.warning },
      { name: "Failed",  value: Math.round((failed / total) * 1000) / 10,  raw: failed,  color: C.danger },
    ];
  }, [windowedLogs]);

  const engagementTop = engagementData[0];
  const engagementTotal = engagementData.reduce((s, e) => s + e.value, 0) || 1;

  /* ── sender distribution (top 3 by usage, rest = other) ── */
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
    const colors = [C.primary, C.warning, C.success, C.purple, C.neutral];
    return top.map((c, i) => ({
      name: c.name,
      value: Math.round((c.value / total) * 1000) / 10,
      raw: c.value,
      color: colors[i % colors.length],
    }));
  }, [senderAcc, windowedLogs]);

  /* ── top workspaces (grouped by user) ── */
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

  /* ── "Peak send window" (real: hour with most sends) ── */
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
        fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="aa-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-330 mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ── */}
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
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

            {campaignsError && (
              <div className="mb-5 rounded-2xl px-4 py-3 text-[12.5px]"
                style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}>
                {campaignsError}
              </div>
            )}

            {/* ── Metrics ── */}
            <div className="aa-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
              {metricCards.map((m) => {
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

            {/* ── Weekly activity + engagement ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 p-4 md:p-5 lg:p-6">
                <SectionTitle
                  title="Weekly activity"
                  hint="Last 7 days · sent vs pending vs failed"
                  right={
                    <div className="flex items-center gap-3">
                      <LegendDot color={C.success} label="Sent" />
                      <LegendDot color={C.warning} label="Pending" />
                      <LegendDot color={C.danger}  label="Failed" />
                    </div>
                  }
                />
                <div style={{ height: 260 }}>
                  {loading && weeklyData.every((d) => d.sent === 0 && d.failed === 0 && d.pending === 0) ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : weeklyData.some((d) => d.sent > 0 || d.failed > 0 || d.pending > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.success} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={C.success} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.warning} stopOpacity={0.32} />
                            <stop offset="100%" stopColor={C.warning} stopOpacity={0} />
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
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ stroke: C.borderHover, strokeDasharray: "3 3" }}
                          contentStyle={chartTooltipStyle}
                        />
                        <Area type="monotone" dataKey="sent"    stroke={C.success} strokeWidth={2} fill="url(#sentGrad)" />
                        <Area type="monotone" dataKey="pending" stroke={C.warning} strokeWidth={2} fill="url(#pendingGrad)" />
                        <Area type="monotone" dataKey="failed"  stroke={C.danger}  strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Activity size={22} className="mb-2" style={{ color: "#3A404F" }} />
                      <p className="text-[12px]" style={{ color: C.textMuted }}>No activity in this window</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle title="Send outcomes" hint="Share by log status" />
                {windowedLogs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Inbox size={20} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                    <p className="text-[12px]" style={{ color: C.textMuted }}>No logs in this window</p>
                  </div>
                ) : (
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
                          {engagementTop.value}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                          Sent
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
                            {formatNumber(item.raw)}
                            <span style={{ color: C.textMuted }}> · {Math.round((item.value / engagementTotal) * 100)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Monthly + sender distribution ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 p-4 md:p-5 lg:p-6">
                <SectionTitle
                  title="Monthly trend"
                  hint="Last 8 months · sent vs failed"
                  right={
                    <div className="flex items-center gap-3">
                      <LegendDot color={C.success} label="Sent" />
                      <LegendDot color={C.danger}  label="Failed" />
                    </div>
                  }
                />
                <div style={{ height: 220 }}>
                  {monthlyData.some((d) => d.sent > 0 || d.failed > 0) ? (
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
                          allowDecimals={false}
                        />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={chartTooltipStyle} />
                        <Bar dataKey="sent"   fill={C.success} radius={[6, 6, 0, 0]} maxBarSize={26} />
                        <Bar dataKey="failed" fill={C.danger}  radius={[6, 6, 0, 0]} maxBarSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <BarChart3 size={22} className="mb-2" style={{ color: "#3A404F" }} />
                      <p className="text-[12px]" style={{ color: C.textMuted }}>No monthly data yet</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle title="Sender volume" hint="Share of sends per sender account" />
                {senderData.length === 0 ? (
                  <div className="py-10 text-center">
                    <AtSign size={20} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                    <p className="text-[12px]" style={{ color: C.textMuted }}>No sender activity</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={senderData} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                            {senderData.map((e) => (
                              <Cell key={e.name} fill={e.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[20px] font-bold leading-none"
                          style={{ fontFamily: FONT.mono, color: C.dark }}>
                          {senderData[0].value}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1 truncate px-1 max-w-22.5"
                          style={{ color: C.textMuted }}>
                          Top sender
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {senderData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[11.5px] gap-2">
                          <span className="flex items-center gap-2 min-w-0" style={{ color: C.textBody }}>
                            <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="shrink-0 font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>
                            {formatNumber(item.raw)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: C.warningSoft, boxShadow: `inset 0 0 0 1px ${C.warningRing}` }}
                    >
                      <Zap size={14} style={{ color: C.warning }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: C.textMuted }}>Peak send window</p>
                      <p className="text-[15px] font-semibold mt-0.5" style={{ color: C.dark, fontFamily: FONT.display }}>
                        {peakHour ? `${peakHour.start} – ${peakHour.end}` : "—"}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                        {peakHour ? `${formatNumber(peakHour.count)} sends in peak hour` : "Not enough data yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Top workspaces ── */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                    Top performing workspaces
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    Ranked by send volume in the selected window
                  </p>
                </div>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors"
                  style={{ color: C.primary }}
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>

              {topWorkspaces.length === 0 ? (
                <div className="py-14 text-center">
                  <Inbox size={22} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                  <p className="text-[12px]" style={{ color: C.textMuted }}>No workspace activity in this window</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 640 }}>
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
                        <th className="px-4 md:px-6 py-3 font-medium">Workspace</th>
                        <th className="px-3 py-3 font-medium text-right">Sent</th>
                        <th className="px-3 py-3 font-medium">Delivery rate</th>
                        <th className="px-3 py-3 font-medium text-right">Campaigns</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkspaces.map((w) => {
                        const trendMeta =
                          w.deliveryRate >= 95
                            ? { fg: C.success, bg: C.successSoft, ring: C.successRing, label: "High" }
                            : w.deliveryRate >= 80
                            ? { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, label: "Medium" }
                            : { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  label: "Low" };
                        return (
                          <tr key={w.name} className="border-t transition-colors hover:bg-[#11151E]" style={{ borderColor: C.border }}>
                            <td className="px-4 md:px-6 py-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={w.name} />
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>{w.name}</p>
                                  {w.email && (
                                    <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>{w.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                              {formatNumber(w.sent)}
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[12px] w-13 text-right" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                                  {w.deliveryRate}%
                                </span>
                                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: C.inner }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${w.deliveryRate}%`,
                                      background: trendMeta.fg,
                                      boxShadow: `0 0 8px ${trendMeta.fg}66`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                              {formatNumber(w.campaigns)}
                            </td>
                            <td className="px-4 md:px-6 py-3.5 text-right">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap mr-2"
                                style={{ background: trendMeta.bg, color: trendMeta.fg, boxShadow: `inset 0 0 0 1px ${trendMeta.ring}` }}
                              >
                                <TrendingUp size={10} />
                                {trendMeta.label}
                              </span>
                              <button
                                onClick={() => navigate("/admin/campaigns")}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130] align-middle"
                                style={{ color: C.textMuted }}
                                aria-label="View workspace"
                              >
                                <ChevronRight size={14} />
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
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;