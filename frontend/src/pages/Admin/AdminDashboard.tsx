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
  Menu, RefreshCw, ArrowRight, ChevronRight, Inbox, Activity, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─────────────────────────────────────────────────────────────
   Direction
   Product    Admin console for an email campaign platform: users, campaigns, senders, delivery
   Character  exact, calm, instrument-like
   World      mail room, postmarks, ink on graphite
   Moment     the volume chart (this period against the previous one)
   Signature  live sync dot next to the page title
   ───────────────────────────────────────────────────────────── */

/* ─────────────── design tokens ─────────────── */

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

type Range = 7 | 14 | 30;

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

const lastNDayKeys = (n: number) => {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const dailyCounts = (
  items: any[],
  getDate: (x: any) => any,
  pred: (x: any) => boolean,
  keys: string[]
) => {
  const map = new Map<string, number>(keys.map((k) => [k, 0]));
  items.forEach((it) => {
    if (!pred(it)) return;
    const k = dayKey(getDate(it));
    if (k && map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  });
  return keys.map((k) => map.get(k) ?? 0);
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

const roleLabel = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Employee";

/* ─────────────── status maps ─────────────── */

type HealthStatus = "Operational" | "Degraded" | "Down";

const HEALTH_COLOR: Record<HealthStatus, string> = {
  Operational: T.success,
  Degraded: T.warn,
  Down: T.danger,
};

const INCIDENT_COLOR = {
  Critical: T.danger,
  Warning: T.warn,
  Resolved: T.success,
};

/* ─────────────── shells ─────────────── */

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

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p: any) => p.dataKey === "sent")?.value ?? 0;
  const prev = payload.find((p: any) => p.dataKey === "prev")?.value ?? 0;
  return (
    <div
      className="rounded-lg px-3 py-2 text-[12px]"
      style={{ background: T.surfaceHi, boxShadow: `inset 0 0 0 1px ${T.lineStrong}`, fontFamily: FONT.mono, color: T.text }}
    >
      <p style={{ color: T.textMuted }}>{label}</p>
      <p className="mt-1 tabular-nums">{formatNumber(cur)} <span style={{ color: T.textMuted }}>this period</span></p>
      <p className="tabular-nums">{formatNumber(prev)} <span style={{ color: T.textMuted }}>previous</span></p>
    </div>
  );
};

/* ─────────────── page ─────────────── */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>(14);
  const [syncedAt, setSyncedAt] = useState<number>(Date.now());
  const [, setTick] = useState(0);

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

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
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
      setSyncedAt(Date.now());
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const loading = campaignsLoading || logsLoading || usersLoading;
  const error = campaignsError || logsError;

  /* ═══════════════ derived data ═══════════════ */

  const period = useMemo(() => {
    const keys = lastNDayKeys(range * 2);
    const prevKeys = keys.slice(0, range);
    const curKeys = keys.slice(range);
    const logDate = (l: any) => l.sent_at ?? l.created_at;
    const isSent = (l: any) => l.status === "Sent";
    const isFailed = (l: any) => l.status === "Failed";
    const any = () => true;

    const sentCur = dailyCounts(emaillogs, logDate, isSent, curKeys);
    const sentPrev = dailyCounts(emaillogs, logDate, isSent, prevKeys);
    const failedCur = dailyCounts(emaillogs, logDate, isFailed, curKeys);
    const totalCur = dailyCounts(emaillogs, logDate, any, curKeys);

    const sent = sum(sentCur);
    const sentBefore = sum(sentPrev);
    const failed = sum(failedCur);
    const total = sum(totalCur);
    const rate = total ? Math.round((sent / total) * 1000) / 10 : 0;
    const deltaPct = sentBefore ? Math.round(((sent - sentBefore) / sentBefore) * 100) : null;

    const chart = curKeys.map((k, i) => ({
      day: new Date(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      sent: sentCur[i],
      prev: sentPrev[i],
    }));

    return { sent, sentBefore, failed, total, rate, deltaPct, chart, today: sentCur[sentCur.length - 1] ?? 0 };
  }, [emaillogs, range]);

  const accountStats = useMemo(() => {
    const activeUsers = new Set(
      allCampaigns.filter((c: any) => c.status === "Running").map((c: any) => c.user_id)
    ).size;
    const workspaceCount = new Set(allCampaigns.map((c: any) => c.user_id)).size;
    return { activeUsers, workspaceCount };
  }, [allCampaigns]);

  const deltaText =
    period.deltaPct === null
      ? `no data for previous ${range} days`
      : `${period.deltaPct > 0 ? "+" : ""}${period.deltaPct}% vs previous ${range} days`;
  const deltaColor =
    period.deltaPct === null || period.deltaPct === 0
      ? T.textMuted
      : period.deltaPct > 0 ? T.success : T.danger;

  const statCards: { label: string; value: string; note: string; noteColor: string }[] = [
    {
      label: "Workspaces",
      value: formatNumber(accountStats.workspaceCount),
      note: `${formatNumber(allCampaigns.length)} campaigns`,
      noteColor: T.textMuted,
    },
    {
      label: "Active users",
      value: formatNumber(accountStats.activeUsers),
      note: `of ${formatNumber(users.length)} users, running campaigns`,
      noteColor: T.textMuted,
    },
    {
      label: "Emails sent",
      value: formatNumber(period.sent),
      note: deltaText,
      noteColor: deltaColor,
    },
    {
      label: "Delivery rate",
      value: `${period.rate.toFixed(1)}%`,
      note: `${formatNumber(period.failed)} failed of ${formatNumber(period.total)}`,
      noteColor: period.failed > 0 && period.rate < 95 ? T.warn : T.textMuted,
    },
  ];

  const campaignMix = useMemo(() => {
    const counts: Record<string, number> = {
      Draft: 0, Ready: 0, Running: 0, Paused: 0, Completed: 0, Cancelled: 0,
    };
    allCampaigns.forEach((c: any) => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return [
      { name: "Running",   value: counts.Running,   color: T.accent },
      { name: "Ready",     value: counts.Ready,     color: T.neutral1 },
      { name: "Paused",    value: counts.Paused,    color: T.neutral2 },
      { name: "Draft",     value: counts.Draft,     color: T.neutral3 },
      { name: "Completed", value: counts.Completed, color: T.neutral4 },
      { name: "Cancelled", value: counts.Cancelled, color: T.neutral4 },
    ].filter((x) => x.value > 0);
  }, [allCampaigns]);

  const campaignTotal = allCampaigns.length || 1;

  const systemComponents = useMemo<{ name: string; status: HealthStatus; detail: string }[]>(() => {
    const failedRate = emaillogs.length
      ? emaillogs.filter((l: any) => l.status === "Failed").length / emaillogs.length
      : 0;
    const apiStatus: HealthStatus = campaignsError ? "Degraded" : "Operational";
    const queueStatus: HealthStatus = failedRate > 0.1 ? "Degraded" : "Operational";
    const senderStatus: HealthStatus = senderAcc.length === 0 ? "Down" : "Operational";
    const templateStatus: HealthStatus = templates.length === 0 ? "Degraded" : "Operational";
    const logsStatus: HealthStatus = logsError ? "Degraded" : "Operational";
    return [
      { name: "API",               status: apiStatus,      detail: "Core requests" },
      { name: "Campaigns service", status: apiStatus,      detail: `${formatNumber(allCampaigns.length)} campaigns` },
      { name: "Email delivery",    status: queueStatus,    detail: `${Math.round(failedRate * 100)}% failed` },
      { name: "Sender accounts",   status: senderStatus,   detail: `${formatNumber(senderAcc.length)} connected` },
      { name: "Template service",  status: templateStatus, detail: `${formatNumber(templates.length)} templates` },
      { name: "Log pipeline",      status: logsStatus,     detail: `${formatNumber(emaillogs.length)} events` },
    ];
  }, [campaignsError, logsError, emaillogs, senderAcc, templates, allCampaigns]);

  const healthyCount = systemComponents.filter((c) => c.status === "Operational").length;

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
        title: "No incidents in the last 24 hours",
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

  const maxSent = Math.max(1, ...topWorkspaces.map((w) => w.sent));

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 5);
  }, [users]);

  const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const syncOk = !error;
  const hasChartData = period.chart.some((d) => d.sent > 0 || d.prev > 0);
  const stagger = (i: number) => ({ "--i": i } as React.CSSProperties);

  return (
    <div className="ad-root h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        .ad-root { --ease: cubic-bezier(0.2, 0, 0, 1); }

        @keyframes enter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .enter { animation: enter 240ms var(--ease) both; animation-delay: calc(var(--i, 0) * 40ms); }

        .ad-root button, .ad-root a { transition-property: color, background-color, box-shadow, opacity; transition-duration: 120ms; transition-timing-function: var(--ease); }
        .ad-root button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .row-hover { transition: background-color 120ms var(--ease); }
        .row-hover:hover { background: rgba(236,237,239,0.03); }

        .btn-primary:hover { background: #FFFFFF; }
        .btn-quiet:hover { background: rgba(236,237,239,0.05); color: ${T.text}; }
        .btn-press:active { transform: scale(0.98); }

        .ad-main::-webkit-scrollbar { width: 8px; }
        .ad-main::-webkit-scrollbar-track { background: transparent; }
        .ad-main::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }

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

      <main className="ad-main flex-1 overflow-y-auto" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1440 }}>

          {/* Header */}
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
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>
                  Platform overview
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  <span>{monthLabel}</span>
                  <span style={{ color: T.textFaint }}>·</span>
                  <span className="inline-flex items-center gap-2">
                    <Dot color={syncOk ? T.success : T.warn} />
                    {syncOk ? `Synced ${formatRelative(new Date(syncedAt).toISOString())}` : "Sync issue"}
                  </span>
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
                {([7, 14, 30] as const).map((r) => (
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
                    {r}d
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
              <button
                onClick={() => navigate("/admin/campaigns")}
                className="btn-primary btn-press inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ background: T.text, color: T.bg }}
              >
                All campaigns
                <ArrowRight {...ICON} size={14} />
              </button>
            </div>
          </header>

          {error && (
            <div
              className="enter rounded-lg px-4 py-3 text-[12px] flex items-center gap-2"
              style={{ background: T.surface, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.danger}55`, ...stagger(1) }}
            >
              <AlertTriangle {...ICON} size={14} />
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={stagger(1)}>
            {statCards.map(({ label, value, note, noteColor }) => (
              <Card key={label} className="p-5">
                <p className="text-[12px]" style={{ color: T.textMuted }}>{label}</p>
                {loading && period.total === 0 && accountStats.workspaceCount === 0 ? (
                  <div className="mt-3 h-8 w-24 rounded-md" style={{ background: T.surface2 }} />
                ) : (
                  <p
                    className="mt-3 text-[32px] leading-8 font-medium tabular-nums"
                    style={{ color: T.text, fontFamily: FONT.mono }}
                  >
                    {value}
                  </p>
                )}
                <p className="mt-3 text-[12px] tabular-nums" style={{ color: noteColor, fontFamily: FONT.mono }}>
                  {note}
                </p>
              </Card>
            ))}
          </div>

          {/* Volume chart + campaigns by status */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(2)}>
            <Card className="lg:col-span-8">
              <CardHeader
                title="Email volume"
                hint={`Sent per day, last ${range} days against the ${range} before`}
                right={
                  <div className="flex items-center gap-4 text-[12px]" style={{ color: T.textMuted }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: T.accent }} />
                      This period
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-4 h-0 border-t border-dashed"
                        style={{ borderColor: T.neutral2 }}
                      />
                      Previous
                    </span>
                  </div>
                }
              />
              <div className="px-4 pb-5" style={{ height: 300 }}>
                {loading && !hasChartData ? (
                  <div className="h-full flex items-center justify-center">
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: T.neutral2, borderTopColor: "transparent" }}
                    />
                  </div>
                ) : hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={period.chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        interval={range === 30 ? 4 : range === 14 ? 1 : 0}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip cursor={{ stroke: T.lineStrong }} content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="prev"
                        stroke={T.neutral2}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="none"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="sent"
                        stroke={T.accent}
                        strokeWidth={2}
                        fill={T.accent}
                        fillOpacity={0.08}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Activity {...ICON} size={20} style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No email activity yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader title="Campaigns by status" hint={`${formatNumber(allCampaigns.length)} total`} />
              <div className="px-5 pb-5">
                {campaignMix.length === 0 ? (
                  <div className="py-12 text-center">
                    <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No campaigns yet</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {campaignMix.map((p) => {
                      const pct = Math.round((p.value / campaignTotal) * 100);
                      return (
                        <li key={p.name}>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="flex items-center gap-2" style={{ color: T.text }}>
                              <Dot color={p.color} />
                              {p.name}
                            </span>
                            <span className="tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                              <span style={{ color: T.text }}>{formatNumber(p.value)}</span> · {pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* System health + incidents */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(3)}>
            <Card className="lg:col-span-7">
              <CardHeader
                title="System health"
                hint="Status derived from live data"
                right={
                  <span className="text-[12px] tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                    {healthyCount} of {systemComponents.length} operational
                  </span>
                }
              />
              <ul>
                {systemComponents.map((c) => (
                  <li
                    key={c.name}
                    className="row-hover flex items-center justify-between gap-4 px-5 py-3"
                    style={{ borderTop: `1px solid ${T.line}` }}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] truncate" style={{ color: T.text }}>{c.name}</p>
                      <p className="text-[12px] mt-1 truncate tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-[12px] shrink-0" style={{ color: HEALTH_COLOR[c.status] }}>
                      <Dot color={HEALTH_COLOR[c.status]} />
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader title="Recent incidents" hint="Derived from live platform signals" />
              <ul>
                {incidents.map((inc, i) => (
                  <li
                    key={i}
                    className="row-hover flex items-start gap-3 px-5 py-3"
                    style={{ borderTop: `1px solid ${T.line}` }}
                  >
                    <span className="mt-1.5"><Dot color={INCIDENT_COLOR[inc.severity]} /></span>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5" style={{ color: T.text }}>{inc.title}</p>
                      <p className="text-[12px] mt-1" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                        {inc.severity} · {inc.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Top workspaces + recent signups */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(4)}>
            <Card className="lg:col-span-8 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
                <div>
                  <h2 className="text-[14px] font-medium" style={{ color: T.text }}>Top workspaces</h2>
                  <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>Ranked by emails sent</p>
                </div>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="btn-quiet inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md"
                  style={{ color: T.textMuted }}
                >
                  All users <ChevronRight {...ICON} size={14} />
                </button>
              </div>

              {topWorkspaces.length === 0 ? (
                <div className="py-12 text-center" style={{ borderTop: `1px solid ${T.line}` }}>
                  <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                  <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No workspace activity yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 640 }}>
                    <thead>
                      <tr className="text-[12px]" style={{ color: T.textFaint }}>
                        <th className="px-5 py-3 font-normal">Workspace</th>
                        <th className="px-3 py-3 font-normal">Role</th>
                        <th className="px-3 py-3 font-normal text-right">Campaigns</th>
                        <th className="px-3 py-3 font-normal text-right">Recipients</th>
                        <th className="px-5 py-3 font-normal" style={{ width: 200 }}>Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkspaces.map((w) => (
                        <tr
                          key={w.user_id}
                          className="row-hover cursor-pointer"
                          style={{ borderTop: `1px solid ${T.line}` }}
                          onClick={() => navigate("/admin/users")}
                        >
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
                          <td className="px-3 py-3 text-[12px]" style={{ color: T.textMuted }}>
                            {roleLabel(w.role)}
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {formatNumber(w.campaigns)}
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {formatNumber(w.recipients)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${(w.sent / maxSent) * 100}%`, background: T.neutral2 }}
                                />
                              </div>
                              <span
                                className="text-[12px] tabular-nums w-12 text-right"
                                style={{ fontFamily: FONT.mono, color: T.text }}
                              >
                                {formatNumber(w.sent)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-4 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
                <div>
                  <h2 className="text-[14px] font-medium" style={{ color: T.text }}>Recent signups</h2>
                  <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>Newest users</p>
                </div>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="btn-quiet inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md"
                  style={{ color: T.textMuted }}
                >
                  View all <ChevronRight {...ICON} size={14} />
                </button>
              </div>

              {recentUsers.length === 0 ? (
                <div className="py-12 text-center" style={{ borderTop: `1px solid ${T.line}` }}>
                  <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
                  <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>No users yet</p>
                </div>
              ) : (
                <ul>
                  {recentUsers.map((u: any) => (
                    <li
                      key={u.id}
                      className="row-hover flex items-center gap-3 px-5 py-3"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      <Avatar name={u.username || u.email || "?"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={{ color: T.text }}>{u.username || "—"}</p>
                        <p className="text-[12px] truncate mt-1" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                          {u.email || "—"}
                        </p>
                      </div>
                      <span className="text-[12px] shrink-0 tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
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