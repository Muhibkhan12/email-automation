// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

import { useCampaigns } from "../../contexts/CampaignContext";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import { UsersContext } from "../../contexts/UsersContext";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";

import {
  Building2, Users, Send, ArrowUpRight, ArrowDownRight,
  ShieldCheck, ShieldAlert, ShieldX, Activity, AlertTriangle,
  CheckCircle2, Menu,
  ChevronRight, TrendingUp, Mail,
  RefreshCw, Inbox, Crown, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  surface:     "#111319",
  surface2:    "#161922",
  surfaceHi:   "#1B1F2A",
  border:      "#232838",
  borderSoft:  "#1B1F2A",
  text:        "#E9EBF0",
  textMuted:   "#9CA3B4",
  textFaint:   "#6B7280",
  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  purple:      "#A78BFA",
  purpleSoft:  "rgba(167,139,250,0.12)",
  purpleBorder:"rgba(167,139,250,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
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

const dayKey = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const initialsOf = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
};

/* ─────────────── status maps ─────────────── */

type HealthStatus = "Operational" | "Degraded" | "Down";

const HEALTH_META: Record<HealthStatus, { bg: string; fg: string; ring: string; icon: React.ElementType }> = {
  Operational: { bg: T.successSoft, fg: T.success, ring: T.successBorder, icon: ShieldCheck },
  Degraded:    { bg: T.warnSoft,    fg: T.warn,    ring: T.warnBorder,    icon: ShieldAlert },
  Down:        { bg: T.dangerSoft,  fg: T.danger,  ring: T.dangerBorder,  icon: ShieldX },
};

const ROLE_META: Record<string, { fg: string; bg: string; ring: string; icon: React.ElementType }> = {
  ADMIN:    { fg: T.brand, bg: T.brandSoft, ring: T.brandBorder, icon: Crown },
  EMPLOYEE: { fg: T.info,  bg: T.infoSoft,  ring: T.infoBorder,  icon: Users },
};

const INCIDENT_META = {
  Critical: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: AlertTriangle },
  Warning:  { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: AlertTriangle },
  Resolved: { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: CheckCircle2 },
};

/* ─────────────── shells ─────────────── */

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

const RolePill: React.FC<{ role: string }> = ({ role }) => {
  const meta = ROLE_META[role] ?? ROLE_META.EMPLOYEE;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={9} />
      {role}
    </span>
  );
};

/* ─────────────── page ─────────────── */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ── data sources ── */
  const {
    allCampaigns = [],
    allLoading: campaignsLoading,
    allError: campaignsError,
    fetchAll: fetchCampaigns,
  } = useCampaigns();

  const logsCtx = React.useContext(EmailLogsContext);
  const emaillogs = logsCtx?.emaillogs ?? [];
  const logsLoading = logsCtx?.loading ?? false;
  const logsError = logsCtx?.error ?? null;
  const refetchLogs = logsCtx?.refetch;

  const senderCtx = React.useContext(SenderAccContext);
  const senderAcc = senderCtx?.senderAcc ?? [];
  const fetchAllSenderAccounts = senderCtx?.fetchAllSenderAccounts;

  const usersCtx = React.useContext(UsersContext);
  const users = usersCtx?.user ?? [];
  const usersLoading = usersCtx?.loading ?? false;

  const { templates = [], refetch: refetchTemplates } = useHtmlTemplates();

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
        Promise.resolve(refetchTemplates?.()),
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const loading = campaignsLoading || logsLoading || usersLoading;
  const error = campaignsError || logsError;

  /* ═══════════════ derived data ═══════════════ */

  const stats = useMemo(() => {
    const sent = emaillogs.filter((l: any) => l.status === "Sent").length;
    const failed = emaillogs.filter((l: any) => l.status === "Failed").length;
    const deliveryRate = emaillogs.length
      ? Math.round((sent / emaillogs.length) * 1000) / 10
      : 0;
    const activeUsers = new Set(
      allCampaigns.filter((c: any) => c.status === "Running").map((c: any) => c.user_id)
    ).size;
    const workspaceCount = new Set(allCampaigns.map((c: any) => c.user_id)).size;
    return { sent, failed, deliveryRate, activeUsers, workspaceCount, total: emaillogs.length };
  }, [emaillogs, allCampaigns]);

  const statCards = [
    {
      label: "Workspaces",
      value: formatNumber(stats.workspaceCount),
      delta: `${formatNumber(allCampaigns.length)} campaigns`,
      trend: "up" as const,
      icon: Building2,
      accent: T.brand,
      accentSoft: T.brandSoft,
    },
    {
      label: "Active users (30d)",
      value: formatNumber(stats.activeUsers),
      delta: `${formatNumber(users.length)} total`,
      trend: "up" as const,
      icon: Users,
      accent: T.info,
      accentSoft: T.infoSoft,
    },
    {
      label: "Emails sent",
      value: formatNumber(stats.sent),
      delta: `${formatNumber(stats.failed)} failed`,
      trend: stats.failed === 0 ? ("up" as const) : ("down" as const),
      icon: Send,
      accent: T.warn,
      accentSoft: T.warnSoft,
    },
    {
      label: "Delivery rate",
      value: `${stats.deliveryRate}%`,
      delta: stats.deliveryRate >= 95 ? "healthy" : "check failed",
      trend: stats.deliveryRate >= 95 ? ("up" as const) : ("down" as const),
      icon: CheckCircle2,
      accent: T.success,
      accentSoft: T.successSoft,
    },
  ];

  const deliveryTrend = useMemo(() => {
    const days = 14;
    const buckets = new Map<string, number>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    emaillogs.forEach((l: any) => {
      const k = dayKey(l.sent_at ?? l.created_at);
      if (k && buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([k, v]) => ({
      day: new Date(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      sent: v,
    }));
  }, [emaillogs]);

  const trendToday = deliveryTrend[deliveryTrend.length - 1]?.sent ?? 0;

  const campaignMix = useMemo(() => {
    const counts: Record<string, number> = {
      Draft: 0, Ready: 0, Running: 0, Paused: 0, Completed: 0, Cancelled: 0,
    };
    allCampaigns.forEach((c: any) => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return [
      { name: "Running",   value: counts.Running,   color: T.success },
      { name: "Ready",     value: counts.Ready,     color: T.brand },
      { name: "Paused",    value: counts.Paused,    color: T.warn },
      { name: "Draft",     value: counts.Draft,     color: T.textMuted },
      { name: "Completed", value: counts.Completed, color: T.purple },
      { name: "Cancelled", value: counts.Cancelled, color: T.danger },
    ].filter((x) => x.value > 0);
  }, [allCampaigns]);

  const campaignTotal = allCampaigns.length || 1;
  const runningPct = Math.round(
    (allCampaigns.filter((c: any) => c.status === "Running").length / campaignTotal) * 100
  );

  const systemComponents = useMemo<{ name: string; status: HealthStatus; latency: string }[]>(() => {
    const failedRate = emaillogs.length
      ? emaillogs.filter((l: any) => l.status === "Failed").length / emaillogs.length
      : 0;
    const apiStatus: HealthStatus = campaignsError ? "Degraded" : "Operational";
    const queueStatus: HealthStatus = failedRate > 0.1 ? "Degraded" : "Operational";
    const senderStatus: HealthStatus = senderAcc.length === 0 ? "Down" : "Operational";
    const templateStatus: HealthStatus = templates.length === 0 ? "Degraded" : "Operational";
    const logsStatus: HealthStatus = logsError ? "Degraded" : "Operational";
    return [
      { name: "API",               status: apiStatus,      latency: "—" },
      { name: "Campaigns service", status: apiStatus,      latency: "—" },
      { name: "Email delivery",    status: queueStatus,    latency: `${Math.round(failedRate * 100)}% failed` },
      { name: "Sender accounts",   status: senderStatus,   latency: `${formatNumber(senderAcc.length)} active` },
      { name: "Template service",  status: templateStatus, latency: `${formatNumber(templates.length)} templates` },
      { name: "Log pipeline",      status: logsStatus,     latency: `${formatNumber(emaillogs.length)} events` },
    ];
  }, [campaignsError, logsError, emaillogs, senderAcc, templates]);

  const incidents = useMemo(() => {
    const items: { title: string; severity: "Critical" | "Warning" | "Resolved"; time: string }[] = [];
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentFailures = emaillogs.filter((l: any) => {
      const t = new Date(l.sent_at ?? l.created_at ?? 0).getTime();
      return t >= dayAgo && l.status === "Failed";
    }).length;
    if (recentFailures > 0) {
      items.push({
        title: `${recentFailures} failed sends in the last 24h`,
        severity: recentFailures > 20 ? "Critical" : "Warning",
        time: "24h",
      });
    }
    const stalled = allCampaigns.filter((c: any) => {
      if (c.status !== "Running") return false;
      const u = new Date(c.updated_at ?? c.created_at ?? 0).getTime();
      return Date.now() - u > 7 * 24 * 60 * 60 * 1000;
    });
    if (stalled.length > 0) {
      items.push({
        title: `${stalled.length} campaign${stalled.length > 1 ? "s" : ""} running for over 7 days`,
        severity: "Warning",
        time: ">7d",
      });
    }
    const overloadedSenders = senderAcc.filter((a: any) => {
      const used = emaillogs.filter((l: any) => {
        const t = new Date(l.sent_at ?? l.created_at ?? 0).getTime();
        return t >= dayAgo && l.sender_account_id === a.id;
      }).length;
      const cap = a.daily_quota ?? a.quota ?? 500;
      return cap > 0 && used / cap >= 0.8;
    });
    if (overloadedSenders.length > 0) {
      items.push({
        title: `${overloadedSenders.length} sender account${overloadedSenders.length > 1 ? "s" : ""} over 80% capacity`,
        severity: "Warning",
        time: "today",
      });
    }
    if (recentFailures === 0 && stalled.length === 0 && overloadedSenders.length === 0) {
      items.push({
        title: "All clear — no incidents in the last 24 hours",
        severity: "Resolved",
        time: "24h",
      });
    }
    return items.slice(0, 4);
  }, [emaillogs, allCampaigns, senderAcc]);

  const topWorkspaces = useMemo(() => {
    type Agg = {
      user_id: number;
      name: string;
      email: string;
      campaigns: number;
      recipients: number;
      sent: number;
      role: string;
    };
    const map = new Map<number, Agg>();
    allCampaigns.forEach((c: any) => {
      const uid = c.user_id;
      if (!uid) return;
      const entry = map.get(uid) ?? {
        user_id: uid,
        name: c.user?.username || c.user?.email || `user #${uid}`,
        email: c.user?.email || "",
        campaigns: 0,
        recipients: 0,
        sent: 0,
        role: c.user?.role || "EMPLOYEE",
      };
      entry.campaigns++;
      entry.recipients += c.recipients?.length ?? 0;
      map.set(uid, entry);
    });
    emaillogs.forEach((l: any) => {
      const uid = l.user_id ?? l.campaign?.user_id;
      if (!uid || !map.has(uid)) return;
      const entry = map.get(uid)!;
      if (l.status === "Sent") entry.sent++;
    });
    return Array.from(map.values()).sort((a, b) => b.sent - a.sent).slice(0, 5);
  }, [allCampaigns, emaillogs]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 5);
  }, [users]);

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes pulseFade { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pulse-dot { animation: pulseFade 1.8s ease-in-out infinite; }

        .ad-main::-webkit-scrollbar { width: 8px; }
        .ad-main::-webkit-scrollbar-track { background: transparent; }
        .ad-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .ad-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .pulse-dot { animation: none !important; } }
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

      <main className="ad-main flex-1 overflow-y-auto" style={{ background: T.bg }}>
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
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {stats.deliveryRate >= 95 ? "All systems operational" : "Attention required"}
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · admin · {formatNumber(users.length)} users
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Admin dashboard
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Platform-wide oversight across users, campaigns, senders, and delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/admin/campaigns")}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-[12.5px] transition-all hover:brightness-110"
                style={{ background: T.brand, color: "#fff", boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                <Mail size={14} />
                All campaigns
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-5 rounded-lg px-3.5 py-3 text-[12.5px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map(({ label, value, delta, trend, icon: Icon, accent, accentSoft }) => (
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

          {/* Trend + campaign mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Platform email volume"
                hint="Last 14 days · daily events"
                right={
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, fontFamily: FONT.mono }}
                  >
                    <TrendingUp size={10} /> {formatNumber(trendToday)} today
                  </span>
                }
              />
              <div className="px-3 md:px-4 pb-4" style={{ height: 220 }}>
                {loading && deliveryTrend.every((d) => d.sent === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.brand, borderTopColor: "transparent" }} />
                  </div>
                ) : deliveryTrend.some((d) => d.sent > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.brand} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={T.brand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={T.borderSoft} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fontSize: 10, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ stroke: T.border, strokeDasharray: "3 3" }}
                        contentStyle={{
                          borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2,
                          fontFamily: FONT.mono, fontSize: 11, color: T.text,
                          boxShadow: "0 12px 30px -12px rgba(0,0,0,0.7)",
                        }}
                      />
                      <Area type="monotone" dataKey="sent" stroke={T.brand} strokeWidth={2} fill="url(#fillSent)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity size={20} className="mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No email activity yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Campaign mix" hint={`${formatNumber(campaignTotal)} total`} />
              <div className="px-4 md:px-5 pb-4">
                {campaignMix.length === 0 ? (
                  <div className="py-10 text-center">
                    <Inbox size={18} className="mx-auto mb-2" style={{ color: T.border }} />
                    <p className="text-[12px]" style={{ color: T.textFaint }}>No campaigns yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={campaignMix} dataKey="value" innerRadius={40} outerRadius={56} paddingAngle={2}>
                            {campaignMix.map((p) => (
                              <Cell key={p.name} fill={p.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[20px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {runningPct}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: T.textFaint }}>
                          Running
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {campaignMix.map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2" style={{ color: T.textMuted }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                            {p.name}
                          </span>
                          <span style={{ fontFamily: FONT.mono, color: T.text }} className="font-medium">
                            {p.value} <span style={{ color: T.textFaint }}>· {Math.round((p.value / campaignTotal) * 100)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* System health + incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader title="System health" hint="Component status derived from live data" />
              <div className="px-4 md:px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {systemComponents.map((c) => {
                  const meta = HEALTH_META[c.status];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg"
                      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: meta.bg, color: meta.fg }}
                        >
                          <Icon size={12} />
                        </div>
                        <span className="text-[12px] truncate" style={{ color: T.textMuted }}>{c.name}</span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap shrink-0"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: meta.fg }} />
                        {c.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Recent incidents" hint="Derived from live platform signals" />
              <div className="px-4 md:px-5 pb-4 relative">
                <span className="absolute left-6 md:left-7 top-2 bottom-6 w-px" style={{ background: T.borderSoft }} />
                <div className="space-y-3 relative">
                  {incidents.map((inc, i) => {
                    const meta = INCIDENT_META[inc.severity];
                    const Icon = meta.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="relative z-10 shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ background: meta.bg, color: meta.fg, boxShadow: `0 0 0 3px ${T.bg}` }}
                        >
                          <Icon size={12} />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[12px] leading-snug" style={{ color: T.textMuted }}>{inc.title}</p>
                          <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
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

          {/* Top workspaces */}
          <Card className="overflow-hidden mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Top workspaces</h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>Ranked by send volume</p>
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:text-white"
                style={{ color: T.brand }}
              >
                All users <ChevronRight size={11} />
              </button>
            </div>

            {topWorkspaces.length === 0 ? (
              <div className="py-14 text-center">
                <Inbox size={20} className="mx-auto mb-2" style={{ color: T.border }} />
                <p className="text-[12px]" style={{ color: T.textFaint }}>No workspace activity yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 620 }}>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Workspace</th>
                      <th className="px-3 py-2.5 font-medium">Role</th>
                      <th className="px-3 py-2.5 font-medium text-right">Campaigns</th>
                      <th className="px-3 py-2.5 font-medium text-right">Recipients</th>
                      <th className="px-3 py-2.5 font-medium text-right">Sent</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWorkspaces.map((w) => (
                      <tr key={w.user_id} className="transition-colors hover:bg-white/2"
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
                        <td className="px-3 py-3">
                          <RolePill role={w.role} />
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {formatNumber(w.campaigns)}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {formatNumber(w.recipients)}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
                          style={{ fontFamily: FONT.mono, color: T.text }}>
                          {formatNumber(w.sent)}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <button
                            onClick={() => navigate("/admin/users")}
                            aria-label="View user"
                            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                            style={{ color: T.textFaint }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent signups */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3.5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Recent signups</h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>Newest users on the platform</p>
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:text-white"
                style={{ color: T.brand }}
              >
                View all <ChevronRight size={11} />
              </button>
            </div>

            {recentUsers.length === 0 ? (
              <div className="py-14 text-center">
                <Users size={20} className="mx-auto mb-2" style={{ color: T.border }} />
                <p className="text-[12px]" style={{ color: T.textFaint }}>No users yet</p>
              </div>
            ) : (
              <ul>
                {recentUsers.map((u: any, i: number) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 px-4 md:px-5 py-3 transition-colors hover:bg-white/2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}` }}
                  >
                    <Avatar name={u.username || u.email || "?"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                        {u.username || "—"}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {u.email || "—"}
                      </p>
                    </div>
                    <span className="hidden sm:block"><RolePill role={u.role} /></span>
                    <span className="text-[11px] shrink-0 ml-1" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                      {formatRelative(u.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;