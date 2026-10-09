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
  CheckCircle2, MoreHorizontal, Search, ExternalLink, Menu,
  ChevronRight, TrendingUp, Mail, FileStack, AtSign,
  RefreshCw, Inbox, Crown,
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
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  violet: "#A78BFA",
  violetSoft: "rgba(167,139,250,0.10)",
  violetRing: "rgba(167,139,250,0.22)",
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

/* ─────────────────────────── Status maps ─────────────────────────── */

type HealthStatus = "Operational" | "Degraded" | "Down";

const HEALTH_META: Record<HealthStatus, { bg: string; fg: string; ring: string; icon: React.ElementType }> = {
  Operational: { bg: C.successSoft, fg: C.success, ring: C.successRing, icon: ShieldCheck },
  Degraded:    { bg: C.warningSoft, fg: C.warning, ring: C.warningRing, icon: ShieldAlert },
  Down:        { bg: C.dangerSoft,  fg: C.danger,  ring: C.dangerRing,  icon: ShieldX },
};

const CAMPAIGN_STATUS_STYLE: Record<string, { bg: string; fg: string; ring: string; label: string }> = {
  Draft:     { bg: C.neutralSoft, fg: C.neutral, ring: C.neutralRing, label: "Draft" },
  Ready:     { bg: C.blueSoft,    fg: C.blue,    ring: C.blueRing,    label: "Ready" },
  Running:   { bg: C.successSoft, fg: C.success, ring: C.successRing, label: "Running" },
  Paused:    { bg: C.warningSoft, fg: C.warning, ring: C.warningRing, label: "Paused" },
  Completed: { bg: C.violetSoft,  fg: C.violet,  ring: C.violetRing,  label: "Completed" },
  Cancelled: { bg: C.dangerSoft,  fg: C.danger,  ring: C.dangerRing,  label: "Cancelled" },
};

const SENDER_STATUS_META = {
  Active:   { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: ShieldCheck },
  Warning:  { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: ShieldAlert },
  Disabled: { fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing, icon: ShieldX },
};

const ROLE_META: Record<string, { fg: string; bg: string; ring: string; icon: React.ElementType }> = {
  ADMIN:    { fg: C.primary, bg: C.primarySoft, ring: C.primaryRing, icon: Crown },
  EMPLOYEE: { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    icon: Users },
};

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
        <h2 style={{ fontFamily: FONT.display }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
          <span style={{ color: C.dark }}>{title}</span>
        </h2>
        {hint && <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{hint}</p>}
      </div>
    </div>
    {right}
  </div>
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

const RolePill: React.FC<{ role: string }> = ({ role }) => {
  const meta = ROLE_META[role] ?? ROLE_META.EMPLOYEE;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={10} />
      {role}
    </span>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

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

  /* ── fetch + refresh ── */
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

  /* ── top-line stats ── */
  const stats = useMemo(() => {
    const sent = emaillogs.filter((l: any) => l.status === "Sent").length;
    const failed = emaillogs.filter((l: any) => l.status === "Failed").length;

    const deliveryRate = emaillogs.length
      ? Math.round((sent / emaillogs.length) * 1000) / 10
      : 0;

    const activeUsers = new Set(
      allCampaigns
        .filter((c: any) => c.status === "Running")
        .map((c: any) => c.user_id)
    ).size;

    const workspaceCount = new Set(allCampaigns.map((c: any) => c.user_id)).size;

    return { sent, failed, deliveryRate, activeUsers, workspaceCount };
  }, [emaillogs, allCampaigns]);

  /* ── stat cards ── */
  const statCards = [
    {
      title: "Total workspaces",
      value: formatNumber(stats.workspaceCount),
      delta: `${formatNumber(allCampaigns.length)} campaigns`,
      trend: "up" as const,
      icon: Building2,
      accent: C.primary,
      accentSoft: C.primarySoft,
      accentRing: C.primaryRing,
    },
    {
      title: "Active users (30d)",
      value: formatNumber(stats.activeUsers),
      delta: `${formatNumber(users.length)} total`,
      trend: "up" as const,
      icon: Users,
      accent: C.warning,
      accentSoft: C.warningSoft,
      accentRing: C.warningRing,
    },
    {
      title: "Emails sent",
      value: formatNumber(stats.sent),
      delta: `${formatNumber(stats.failed)} failed`,
      trend: stats.failed === 0 ? ("up" as const) : ("down" as const),
      icon: Send,
      accent: C.danger,
      accentSoft: C.dangerSoft,
      accentRing: C.dangerRing,
    },
    {
      title: "Delivery rate",
      value: `${stats.deliveryRate}%`,
      delta: stats.deliveryRate >= 95 ? "healthy" : "needs review",
      trend: stats.deliveryRate >= 95 ? ("up" as const) : ("down" as const),
      icon: CheckCircle2,
      accent: C.success,
      accentSoft: C.successSoft,
      accentRing: C.successRing,
    },
  ];

  /* ── 14-day email volume ── */
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

  /* ── campaign status mix ── */
  const campaignMix = useMemo(() => {
    const counts: Record<string, number> = {
      Draft: 0, Ready: 0, Running: 0, Paused: 0, Completed: 0, Cancelled: 0,
    };
    allCampaigns.forEach((c: any) => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return [
      { name: "Running",   value: counts.Running,   color: C.success },
      { name: "Ready",     value: counts.Ready,     color: C.blue },
      { name: "Paused",    value: counts.Paused,    color: C.warning },
      { name: "Draft",     value: counts.Draft,     color: C.neutral },
      { name: "Completed", value: counts.Completed, color: C.violet },
      { name: "Cancelled", value: counts.Cancelled, color: C.danger },
    ].filter((x) => x.value > 0);
  }, [allCampaigns]);

  const campaignTotal = allCampaigns.length || 1;
  const runningPct = Math.round(
    (allCampaigns.filter((c: any) => c.status === "Running").length / campaignTotal) * 100
  );

  /* ── system components — real health signals ── */
  const systemComponents = useMemo<{ name: string; status: HealthStatus; latency: string }[]>(() => {
    // Derive health from real signals we have.
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

  /* ── alerts / incidents ── */
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

  const INCIDENT_META = {
    Critical: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: AlertTriangle },
    Warning:  { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: AlertTriangle },
    Resolved: { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: CheckCircle2 },
  };

  /* ── top workspaces (grouped by user_id) ── */
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

    return Array.from(map.values())
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 5);
  }, [allCampaigns, emaillogs]);

  /* ── recent signups (latest users) ── */
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 5);
  }, [users]);

  const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days"] as const;
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);

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
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {stats.deliveryRate >= 95 ? "All systems operational" : "Attention required"}
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · admin · {formatNumber(users.length)} users
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    <span style={{ color: C.dark }}>Admin dashboard</span>
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Platform-wide oversight across users, campaigns, senders, and delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate("/admin/campaigns")}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] transition-all hover:-translate-y-0.5"
                  style={{ background: C.primary, color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
                >
                  <Mail size={16} />
                  All campaigns
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </header>

            {error && (
              <div className="mb-5 rounded-2xl px-4 py-3 text-[12.5px]"
                style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}>
                {error}
              </div>
            )}

            {/* ── Stats ── */}
            <div className="ad-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {statCards.map((s) => {
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

            {/* ── Platform volume + campaign mix ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="lg:col-span-2 p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<Activity size={14} style={{ color: C.primary }} />}
                  title="Platform email volume"
                  hint="Last 14 days · events per day"
                  right={
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}`, fontFamily: FONT.mono }}>
                      <TrendingUp size={11} /> {formatNumber(trendToday)} today
                    </span>
                  }
                />
                <div style={{ height: 200 }}>
                  {loading && deliveryTrend.every((d) => d.sent === 0) ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : deliveryTrend.some((d) => d.sent > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={C.border} vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                          axisLine={false}
                          tickLine={false}
                          interval={1}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT.mono }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ stroke: C.borderHover, strokeDasharray: "3 3" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: "#141821",
                            fontFamily: FONT.mono,
                            fontSize: 11,
                            color: C.dark,
                            boxShadow: "0 12px 30px -12px rgba(0,0,0,0.7)",
                          }}
                        />
                        <Area type="monotone" dataKey="sent" stroke={C.primary} strokeWidth={2} fill="url(#fillSent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Activity size={22} className="mb-2" style={{ color: "#3A404F" }} />
                      <p className="text-[12px]" style={{ color: C.textMuted }}>No email activity yet</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<TrendingUp size={14} style={{ color: C.primary }} />}
                  title="Campaign mix"
                  hint={`${formatNumber(campaignTotal)} total`}
                />
                {campaignMix.length === 0 ? (
                  <div className="py-10 text-center">
                    <Inbox size={20} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                    <p className="text-[12px]" style={{ color: C.textMuted }}>No campaigns yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={campaignMix} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={2}>
                            {campaignMix.map((p) => (
                              <Cell key={p.name} fill={p.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span style={{ fontFamily: FONT.mono, color: C.dark }} className="text-[22px] font-bold leading-none">
                          {runningPct}%
                        </span>
                        <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                          Running
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2.5">
                      {campaignMix.map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2" style={{ color: C.textBody }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                            {p.name}
                          </span>
                          <span className="font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>
                            {p.value} <span style={{ color: C.textMuted }}>· {Math.round((p.value / campaignTotal) * 100)}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ── System health + Incidents ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6 md:mb-8">
              <Card className="p-4 md:p-5 lg:p-6">
                <SectionTitle
                  icon={<Activity size={14} style={{ color: C.primary }} />}
                  title="System health"
                  hint="Component status derived from live data"
                />
                <div className="space-y-2">
                  {systemComponents.map((c) => {
                    const meta = HEALTH_META[c.status];
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
                          <span className="text-[11px] hidden sm:inline" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
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
                  hint="Derived from live platform signals"
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

            {/* ── Top workspaces ── */}
            <Card className="overflow-hidden mb-6 md:mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                    Top workspaces
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Ranked by send volume</p>
                </div>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors"
                  style={{ color: C.primary }}
                >
                  All users <ExternalLink size={12} />
                </button>
              </div>

              {topWorkspaces.length === 0 ? (
                <div className="py-14 text-center">
                  <Inbox size={22} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                  <p className="text-[12px]" style={{ color: C.textMuted }}>No workspace activity yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
                        <th className="px-4 md:px-6 py-3 font-medium">Workspace</th>
                        <th className="px-3 py-3 font-medium">Role</th>
                        <th className="px-3 py-3 font-medium text-right">Campaigns</th>
                        <th className="px-3 py-3 font-medium text-right">Recipients</th>
                        <th className="px-3 py-3 font-medium text-right">Sent</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkspaces.map((w) => (
                        <tr key={w.user_id} className="border-t transition-colors hover:bg-[#11151E]" style={{ borderColor: C.border }}>
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={w.name} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>{w.name}</p>
                                {w.email && (
                                  <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                    {w.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <RolePill role={w.role} />
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                            {formatNumber(w.campaigns)}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                            {formatNumber(w.recipients)}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px] font-medium" style={{ color: C.dark, fontFamily: FONT.mono }}>
                            {formatNumber(w.sent)}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <button
                              onClick={() => navigate("/admin/users")}
                              aria-label="View user"
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                              style={{ color: C.textMuted }}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Recent signups ── */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: C.dark }} className="text-[14px] md:text-[15px] font-semibold tracking-tight">
                    Recent signups
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Newest users on the platform</p>
                </div>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors"
                  style={{ color: C.primary }}
                >
                  View all <ExternalLink size={12} />
                </button>
              </div>

              {recentUsers.length === 0 ? (
                <div className="py-14 text-center">
                  <Users size={22} className="mx-auto mb-2" style={{ color: "#3A404F" }} />
                  <p className="text-[12px]" style={{ color: C.textMuted }}>No users yet</p>
                </div>
              ) : (
                <ul>
                  {recentUsers.map((u: any, i: number) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 px-4 md:px-6 py-3.5 transition-colors hover:bg-[#11151E]"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}
                    >
                      <Avatar name={u.username || u.email || "?"} />

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>
                          {u.username || "—"}
                        </p>
                        <p className="text-[11.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                          {u.email || "—"}
                        </p>
                      </div>

                      <span className="hidden sm:block"><RolePill role={u.role} /></span>
                      <span className="text-[11px] shrink-0 ml-1" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                        {formatRelative(u.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;