// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

import api from "../../libs/Axios";

import { useCampaigns } from "../../contexts/CampaignContext";
import { EmailLogsContext } from "../../contexts/EmaillogsContext";
import { useSenderAccounts } from "../../contexts/SenderAccountsContext";
import { UsersContext } from "../../contexts/UsersContext";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import { useRecipients } from "../../contexts/RecipientsContext";
import { useUpload } from "../../contexts/UploadContext";
import { AuthContext } from "../../contexts/AuthContext";

import {
  Menu, RefreshCw, ArrowRight, ChevronRight, Inbox, Activity, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─────────────── design tokens ─────────────── */
const T = {
  bg: "#0E0F11", surface: "#151618", surface2: "#1B1C1F", surfaceHi: "#232427",
  line: "rgba(236,237,239,0.08)", lineStrong: "rgba(236,237,239,0.14)",
  text: "#ECEDEF", textMuted: "#A1A4AB", textFaint: "#6C7078",
  accent: "#F0884D", accentSoft: "rgba(240,136,77,0.12)",
  success: "#5FB07A", warn: "#D4A24C", danger: "#D8665D",
  neutral1: "#C9CBD0", neutral2: "#8E9199", neutral3: "#5E6169", neutral4: "#44464C",
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

/**
 * Robust date parser.
 * - Naive ISO timestamps (no Z / offset), e.g. "2026-11-23T10:00:00" or "2026-11-23 10:00:00",
 *   are treated as UTC (typical for FastAPI / SQL backends) instead of local time.
 * - Numbers are treated as unix seconds or milliseconds.
 */
const parseDate = (v: any): Date | null => {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const d = new Date(v < 1e12 ? v * 1000 : v);
    return isNaN(d.getTime()) ? null : d;
  }
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatRelative = (iso?: string | null) => {
  const dt = parseDate(iso);
  if (!dt) return "—";
  const d = dt.getTime();
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** Local-calendar day key (YYYY-MM-DD) — used consistently for both buckets and logs */
const toLocalKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const dayKey = (iso?: any) => {
  const d = parseDate(iso);
  return d ? toLocalKey(d) : null;
};

const keyToLabel = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push(toLocalKey(d));
  }
  return out;
};

const dailyCounts = (
  items: any[], getDate: (x: any) => any, pred: (x: any) => boolean, keys: string[],
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
const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] !== null && o?.[k] !== undefined && o?.[k] !== "") return o[k];
  return undefined;
};
const roleLabel = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Employee";

/* status groups used for the volume chart */
const SENT_STATUSES = new Set(["sent", "delivered", "success", "successful", "completed", "processed"]);
const FAILED_STATUSES = new Set(["failed", "bounced", "error", "rejected"]);
const statusOf = (l: any) => String(l?.status ?? "").trim().toLowerCase();
const isSentLog = (l: any) => SENT_STATUSES.has(statusOf(l));
const isFailedLog = (l: any) => FAILED_STATUSES.has(statusOf(l));

const logDateOf = (l: any) =>
  l?.sent_at ?? l?.sentAt ?? l?.created_at ?? l?.createdAt ?? l?.timestamp ??
  l?.date ?? l?.updated_at ?? l?.updatedAt ?? null;
const toArray = (v: any): any[] =>
  Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : Array.isArray(v?.logs) ? v.logs : Array.isArray(v?.items) ? v.items : [];
const newest = (a: any, b: any) =>
  (parseDate(b.updated_at ?? b.created_at)?.getTime() ?? 0) - (parseDate(a.updated_at ?? a.created_at)?.getTime() ?? 0);


const STATUS_COLOR: Record<string, string> = {
  sent: T.success, delivered: T.success, completed: T.success, active: T.success, processed: T.success,
  running: T.accent,
  ready: T.neutral1,
  pending: T.warn, queued: T.warn, sending: T.warn, warning: T.warn, processing: T.warn,
  paused: T.neutral2,
  failed: T.danger, disconnected: T.danger, bounced: T.danger, error: T.danger,
  draft: T.neutral3, cancelled: T.neutral3,
};
const statusColor = (s?: string) => STATUS_COLOR[String(s ?? "").toLowerCase()] ?? T.neutral2;

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

const LinkButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick}
    className="btn-quiet inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md"
    style={{ color: T.textMuted }}>
    {label} <ChevronRight {...ICON} size={14} />
  </button>
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

const Pill: React.FC<{ label?: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-2 text-[12px] whitespace-nowrap" style={{ color: statusColor(label) }}>
    <Dot color={statusColor(label)} /> {label || "Unknown"}
  </span>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-10 text-center" style={{ borderTop: `1px solid ${T.line}` }}>
    <Inbox {...ICON} size={20} className="mx-auto" style={{ color: T.textFaint }} />
    <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>{text}</p>
  </div>
);

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
  </div>
);

const Breakdown: React.FC<{ items: { name: string; value: number; color: string }[]; total: number; empty: string }> = ({
  items, total, empty,
}) => {
  if (items.length === 0) return <Empty text={empty} />;
  const t = total || 1;
  return (
    <ul className="flex flex-col gap-4 px-5 pb-5">
      {items.map((p) => {
        const pct = Math.round((p.value / t) * 100);
        return (
          <li key={p.name}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2" style={{ color: T.text }}><Dot color={p.color} /> {p.name}</span>
              <span className="tabular-nums" style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                <span style={{ color: T.text }}>{formatNumber(p.value)}</span> · {pct}%
              </span>
            </div>
            <div className="mt-2"><Bar pct={pct} color={p.color} /></div>
          </li>
        );
      })}
    </ul>
  );
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p: any) => p.dataKey === "sent")?.value ?? 0;
  const prev = payload.find((p: any) => p.dataKey === "prev")?.value ?? 0;
  return (
    <div className="rounded-lg px-3 py-2 text-[12px]"
      style={{ background: T.surfaceHi, boxShadow: `inset 0 0 0 1px ${T.lineStrong}`, fontFamily: FONT.mono, color: T.text }}>
      <p style={{ color: T.textMuted }}>{label}</p>
      <p className="mt-1 tabular-nums">{formatNumber(cur)} <span style={{ color: T.textMuted }}>this period</span></p>
      <p className="tabular-nums">{formatNumber(prev)} <span style={{ color: T.textMuted }}>previous</span></p>
    </div>
  );
};

const th = "px-3 py-3 font-normal";
const monoCell: React.CSSProperties = { fontFamily: FONT.mono, color: T.textMuted };

/* ─────────────── page ─────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>(14);
  const [syncedAt, setSyncedAt] = useState<number>(Date.now());
  const [, setTick] = useState(0);

  /* ── contexts ── */
  const authCtx = React.useContext(AuthContext);
  const adminName = authCtx?.user?.username || authCtx?.user?.email || "";

  const {
    allCampaigns = [], allLoading: campaignsLoading, allError: campaignsError, fetchAll: fetchCampaigns,
  } = useCampaigns();

  const logsCtx = React.useContext(EmailLogsContext);
  const emaillogs = toArray(logsCtx?.emaillogs);
  const logsLoading = logsCtx?.loading ?? false;
  const logsError = logsCtx?.error ?? null;
  const refetchLogs = logsCtx?.refetch;

  const {
    accounts: senderAcc, loading: sendersLoading, error: sendersError, refresh: fetchAllSenderAccounts,
  } = useSenderAccounts();

  const usersCtx = React.useContext(UsersContext) as any;
  const users: any[] = (usersCtx?.user?.length ? usersCtx.user : usersCtx?.usersWithSenderAccounts) ?? [];
  const usersLoading = usersCtx?.loading ?? false;

  const {
    templates = [], loading: templatesLoading, error: templatesError, refetch: refetchTemplates,
  } = useHtmlTemplates();

  const {
    summary, statusCounts, loading: recLoading, error: recError, getAllRecipients, total: recTotal,
  } = useRecipients();

  const {
    files = [], loading: filesLoading, error: filesError, fetchAllFiles,
  } = useUpload();

  /* ── admin-wide recipient summary (all users) ── */
  const [adminRecSummary, setAdminRecSummary] = useState<{
    total: number; sent: number; failed: number; pending: number;
    status_counts?: Record<string, number>;
  } | null>(null);
  const [adminRecLoading, setAdminRecLoading] = useState(false);
  const [adminRecError, setAdminRecError] = useState<string | null>(null);

  const fetchAdminRecipientSummary = React.useCallback(async (silent = false) => {
    if (!silent) setAdminRecLoading(true);
    setAdminRecError(null);
    try {
      const res = await api.get("/recipient/admin/summary");
      const body = res?.data ?? {};
      setAdminRecSummary({
        total: Number(body.total ?? 0),
        sent: Number(body.sent ?? 0),
        failed: Number(body.failed ?? 0),
        pending: Number(body.pending ?? 0),
        status_counts: body.status_counts ?? {},
      });
    } catch (err: any) {
      setAdminRecError(err?.response?.data?.detail ?? err?.message ?? "Failed to load recipient summary");
    } finally {
      if (!silent) setAdminRecLoading(false);
    }
  }, []);

  /* ── initial load ── */
  useEffect(() => {
    fetchCampaigns?.();
    refetchLogs?.(); // FIX: make sure email logs are loaded for the volume chart
    getAllRecipients(1, 20);
    fetchAllFiles?.();
    usersCtx?.fetchUsers?.();
    usersCtx?.fetchUserWithSenderAccounts?.();
    fetchAdminRecipientSummary();
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
        getAllRecipients(1, 20),
        fetchAllFiles?.(true),
        usersCtx?.fetchUsers?.(),
        usersCtx?.fetchUserWithSenderAccounts?.(),
        Promise.resolve(refetchTemplates?.()),
        fetchAdminRecipientSummary(true),
      ]);
    } finally {
      setSyncedAt(Date.now());
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const loading = campaignsLoading || logsLoading || usersLoading || recLoading
    || sendersLoading || templatesLoading || filesLoading || adminRecLoading;
  const errors = [campaignsError, logsError, recError, sendersError, templatesError, filesError, adminRecError].filter(Boolean);

  /* ═══════════════ derived data ═══════════════ */

  const period = useMemo(() => {
    const keys = lastNDayKeys(range * 2);
    const prevKeys = keys.slice(0, range);
    const curKeys = keys.slice(range);

    const sentCur = dailyCounts(emaillogs, logDateOf, isSentLog, curKeys);
    const sentPrev = dailyCounts(emaillogs, logDateOf, isSentLog, prevKeys);
    const failedCur = dailyCounts(emaillogs, logDateOf, isFailedLog, curKeys);
    const totalCur = dailyCounts(emaillogs, logDateOf, () => true, curKeys);
    const totalPrev = dailyCounts(emaillogs, logDateOf, () => true, prevKeys);

    const sent = sum(sentCur);
    const sentBefore = sum(sentPrev);
    const failed = sum(failedCur);
    const total = sum(totalCur);
    const inRange = total + sum(totalPrev);
    const deltaPct = sentBefore ? Math.round(((sent - sentBefore) / sentBefore) * 100) : null;

    const chart = curKeys.map((k, i) => ({
      day: keyToLabel(k),
      sent: sentCur[i],
      prev: sentPrev[i],
    }));
    return { sent, failed, total, inRange, deltaPct, chart };
  }, [emaillogs, range]);

  const userById = useMemo(() => {
    const m = new Map<number, { name: string; email: string; role: string }>();
    users.forEach((u: any) => {
      if (u?.id == null) return;
      m.set(Number(u.id), {
        name: u.username || u.email || `user #${u.id}`,
        email: u.email || "",
        role: u.role || "EMPLOYEE",
      });
    });
    return m;
  }, [users]);

  const ownerName = (c: any) =>
    c.user?.username || c.user?.email || userById.get(Number(c.user_id))?.name || (c.user_id ? `user #${c.user_id}` : "—");

  const accountStats = useMemo(() => {
    const activeUsers = new Set(allCampaigns.filter((c: any) => c.status === "Running").map((c: any) => c.user_id)).size;
    const workspaceCount = new Set(allCampaigns.map((c: any) => c.user_id)).size;
    return { activeUsers, workspaceCount };
  }, [allCampaigns]);

  /* recipients: prefer admin-wide summary, fall back to context then logs */
  const serverTotal   = adminRecSummary?.total   ?? summary?.total   ?? (typeof recTotal === "number" ? recTotal : undefined) ?? period.total;
  const serverSent    = adminRecSummary?.sent    ?? summary?.sent    ?? period.sent;
  const serverFailed  = adminRecSummary?.failed  ?? summary?.failed  ?? (statusCounts?.Failed ?? statusCounts?.failed) ?? period.failed;
  const serverPending = adminRecSummary?.pending ?? summary?.pending ?? (statusCounts?.Pending ?? statusCounts?.pending) ?? 0;
  const serverRate = serverTotal > 0 ? Math.round((serverSent / serverTotal) * 1000) / 10 : null;

  /* sender accounts */
  const senderStats = useMemo(() => {
    const active = senderAcc.filter((a: any) => a.status === "Active").length;
    const attention = senderAcc.length - active;
    const sentToday = sum(senderAcc.map((a: any) => a.emails_sent_today ?? 0));
    const capacity = sum(senderAcc.map((a: any) => a.daily_limit ?? 0));
    const disconnected = senderAcc.filter((a: any) => a.status === "Disconnected").length;
    return { active, attention, sentToday, capacity, disconnected };
  }, [senderAcc]);

  const sendersFor = (u: any) => {
    const nested = u?.sender_accounts ?? u?.senderAccounts;
    if (Array.isArray(nested)) return nested.length;
    return senderAcc.filter((a: any) => a.user_id === u?.id).length;
  };

  const statCards: { label: string; value: string; note: string; noteColor: string }[] = [
    { label: "Workspaces", value: formatNumber(accountStats.workspaceCount),
      note: `${formatNumber(allCampaigns.length)} campaigns`, noteColor: T.textMuted },
    { label: "Active users", value: formatNumber(accountStats.activeUsers),
      note: `of ${formatNumber(users.length)} users, running campaigns`, noteColor: T.textMuted },
    { label: "Emails sent", value: formatNumber(serverSent),
      note: serverTotal > 0 ? `${formatNumber(serverPending)} pending · ${formatNumber(serverFailed)} failed` : "No recipients yet",
      noteColor: serverFailed > 0 ? T.warn : T.textMuted },
    { label: "Delivery rate", value: serverRate === null ? "—" : `${serverRate.toFixed(1)}%`,
      note: serverRate === null ? "No recipient activity yet" : `${formatNumber(serverFailed)} failed of ${formatNumber(serverTotal)}`,
      noteColor: serverRate !== null && serverFailed > 0 && serverRate < 95 ? T.warn : T.textMuted },
    { label: "Recipients", value: formatNumber(serverTotal),
      note: `${formatNumber(files.length)} uploaded files`, noteColor: T.textMuted },
    { label: "Sender accounts", value: formatNumber(senderAcc.length),
      note: `${formatNumber(senderStats.active)} active · ${formatNumber(senderStats.attention)} need attention`,
      noteColor: senderStats.attention > 0 ? T.warn : T.textMuted },
    { label: "Sender usage today", value: formatNumber(senderStats.sentToday),
      note: `of ${formatNumber(senderStats.capacity)} daily capacity`, noteColor: T.textMuted },
    { label: "HTML templates", value: formatNumber(templates.length),
      note: templates.length ? "Available to all users" : "No templates yet", noteColor: T.textMuted },
  ];

  /* breakdowns */
  const campaignMix = useMemo(() => {
    const counts: Record<string, number> = { Draft: 0, Ready: 0, Running: 0, Paused: 0, Completed: 0, Cancelled: 0 };
    allCampaigns.forEach((c: any) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return [
      { name: "Running", value: counts.Running, color: T.accent },
      { name: "Ready", value: counts.Ready, color: T.neutral1 },
      { name: "Paused", value: counts.Paused, color: T.neutral2 },
      { name: "Draft", value: counts.Draft, color: T.neutral3 },
      { name: "Completed", value: counts.Completed, color: T.success },
      { name: "Cancelled", value: counts.Cancelled, color: T.neutral4 },
    ].filter((x) => x.value > 0);
  }, [allCampaigns]);

  const recipientMix = useMemo(() => {
    // prefer the admin-wide status_counts if present
    const adminCounts = adminRecSummary?.status_counts;
    const source = adminCounts && Object.keys(adminCounts).length > 0 ? adminCounts : (statusCounts ?? {});
    const entries = Object.entries(source).filter(([k]) => k.toLowerCase() !== "all");
    if (entries.length) {
      return entries
        .map(([name, value]) => ({ name, value: Number(value), color: statusColor(name) }))
        .filter((x) => x.value > 0);
    }
    return [
      { name: "Sent", value: serverSent, color: T.success },
      { name: "Pending", value: serverPending, color: T.warn },
      { name: "Failed", value: serverFailed, color: T.danger },
    ].filter((x) => x.value > 0);
  }, [adminRecSummary, statusCounts, serverSent, serverPending, serverFailed]);

  const logMix = useMemo(() => {
    const m = new Map<string, number>();
    emaillogs.forEach((l: any) => {
      const s = String(l?.status ?? "Unknown");
      m.set(s, (m.get(s) ?? 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value, color: statusColor(name) })).sort((a, b) => b.value - a.value);
  }, [emaillogs]);

  const roleMix = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u: any) => {
      const r = roleLabel(u.role);
      m.set(r, (m.get(r) ?? 0) + 1);
    });
    const palette = [T.accent, T.neutral1, T.neutral2, T.neutral3];
    return Array.from(m, ([name, value], i) => ({ name, value, color: palette[i % palette.length] }));
  }, [users]);

  /* health */

  /* tables */
  const topWorkspaces = useMemo(() => {
    type Agg = { user_id: number; name: string; email: string; campaigns: number; recipients: number; sent: number; role: string; senders: number };
    const map = new Map<number, Agg>();
    allCampaigns.forEach((c: any) => {
      const uid = c.user_id;
      if (!uid) return;
      const fromUser = userById.get(Number(uid));
      const entry = map.get(uid) ?? {
        user_id: uid,
        name: c.user?.username || c.user?.email || fromUser?.name || `user #${uid}`,
        email: c.user?.email || fromUser?.email || "",
        campaigns: 0, recipients: 0, sent: 0,
        role: c.user?.role || fromUser?.role || "EMPLOYEE",
        senders: sendersFor(users.find((u: any) => u.id === uid) ?? { id: uid }),
      };
      entry.campaigns++;
      entry.recipients += c.recipients?.length ?? 0;
      map.set(uid, entry);
    });
    emaillogs.forEach((l: any) => {
      const uid = l.user_id ?? l.campaign?.user_id;
      if (!uid || !map.has(uid)) return;
      if (isSentLog(l)) map.get(uid)!.sent++;
    });
    return Array.from(map.values()).sort((a, b) => b.sent - a.sent).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCampaigns, emaillogs, userById, users, senderAcc]);
  const maxSent = Math.max(1, ...topWorkspaces.map((w) => w.sent));

  const recentUsers = useMemo(() => {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago
    return [...users]
      .filter((u: any) => {
        const t = parseDate(u?.created_at ?? u?.createdAt)?.getTime();
        return t !== undefined && t >= cutoff;
      })
      .sort(newest)
      .slice(0, 5);
  }, [users]);
  const recentCampaigns = useMemo(() => [...allCampaigns].sort(newest).slice(0, 6), [allCampaigns]);
  const recentFiles = useMemo(() => [...files].sort(newest).slice(0, 5), [files]);
  const recentTemplates = useMemo(() => [...templates].sort(newest).slice(0, 5), [templates]);

  const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const syncOk = errors.length === 0;
  const hasChartData = period.chart.some((d) => d.sent > 0 || d.prev > 0);
  const stagger = (i: number) => ({ "--i": i } as React.CSSProperties);
  const delta = period.deltaPct;

  return (
    <div className="ad-root h-screen w-full flex overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        .ad-root { --ease: cubic-bezier(0.2, 0, 0, 1); }
        @keyframes enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
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
        @media (prefers-reduced-motion: reduce) { .enter { animation: none !important; } .btn-press:active { transform: none; } }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ad-main flex-1 min-w-0 overflow-y-auto" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1440 }}>

          {/* Header */}
          <header className="enter flex flex-col md:flex-row md:items-end justify-between gap-4" style={stagger(0)}>
            <div className="flex items-start gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2 rounded-lg btn-quiet"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }} aria-label="Open menu">
                <Menu {...ICON} />
              </button>
              <div>
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>Platform overview</h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  <span>{monthLabel}</span>
                  {adminName && (<><span style={{ color: T.textFaint }}>·</span><span>{adminName}</span></>)}
                  <span style={{ color: T.textFaint }}>·</span>
                  <span className="inline-flex items-center gap-2">
                    <Dot color={syncOk ? T.success : T.warn} />
                    {syncOk ? `Synced ${formatRelative(new Date(syncedAt).toISOString())}` : "Sync issue"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Time range" className="inline-flex rounded-lg p-1" style={{ background: T.surface, boxShadow: RING }}>
                {([7, 14, 30] as const).map((r) => (
                  <button key={r} onClick={() => setRange(r)} aria-pressed={range === r}
                    className="px-3 py-1 rounded-md text-[12px] font-medium"
                    style={{
                      background: range === r ? T.surfaceHi : "transparent",
                      color: range === r ? T.text : T.textMuted,
                      boxShadow: range === r ? `inset 0 0 0 1px ${T.lineStrong}` : "none",
                      fontFamily: FONT.mono,
                    }}>{r}d</button>
                ))}
              </div>
              <button onClick={handleRefresh} disabled={refreshing}
                className="btn-quiet btn-press inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium disabled:opacity-60"
                style={{ color: T.textMuted, background: T.surface, boxShadow: RING }}>
                <RefreshCw {...ICON} size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button onClick={() => navigate("/admin/campaigns")}
                className="btn-primary btn-press inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ background: T.text, color: T.bg }}>
                All campaigns <ArrowRight {...ICON} size={14} />
              </button>
            </div>
          </header>

          {errors.length > 0 && (
            <div className="enter rounded-lg px-4 py-3 text-[12px] flex flex-col gap-1"
              style={{ background: T.surface, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.danger}55`, ...stagger(1) }}>
              {errors.map((e, i) => (
                <span key={i} className="flex items-center gap-2"><AlertTriangle {...ICON} size={14} /> {String(e)}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={stagger(1)}>
            {statCards.map(({ label, value, note, noteColor }) => (
              <Card key={label} className="p-5">
                <p className="text-[12px]" style={{ color: T.textMuted }}>{label}</p>
                {loading && value === "0" ? (
                  <div className="mt-3 h-8 w-24 rounded-md" style={{ background: T.surface2 }} />
                ) : (
                  <p className="mt-3 text-[32px] leading-8 font-medium tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>{value}</p>
                )}
                <p className="mt-3 text-[12px] tabular-nums" style={{ color: noteColor, fontFamily: FONT.mono }}>{note}</p>
              </Card>
            ))}
          </div>

          {/* Volume chart + campaigns by status */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(2)}>
            <Card className="lg:col-span-8 min-w-0">
              <CardHeader title="Email volume"
                hint={`Sent per day, last ${range} days against the ${range} before${delta !== null ? ` · ${delta >= 0 ? "+" : ""}${delta}%` : ""}`}
                right={
                  <div className="flex items-center gap-4 text-[12px]" style={{ color: T.textMuted }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: T.accent }} /> This period
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-0 border-t border-dashed" style={{ borderColor: T.neutral2 }} /> Previous
                    </span>
                  </div>
                } />

              {/* FIX: explicit fixed-height wrapper + relative so chart always has real size */}
              <div className="px-4 min-w-0 relative" style={{ height: 290, width: "100%" }}>
                {loading && !hasChartData ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: T.neutral2, borderTopColor: "transparent" }} />
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={period.chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid stroke={T.line} vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                          axisLine={false} tickLine={false} interval={range === 30 ? 4 : range === 14 ? 1 : 0} />
                        <YAxis tick={{ fontSize: 11, fill: T.textFaint, fontFamily: FONT.mono }}
                          axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(5, max)]} />
                        <Tooltip cursor={{ stroke: T.lineStrong }} content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="prev" stroke={T.neutral2} strokeWidth={1.5}
                          strokeDasharray="4 4" fill="none" dot={false} isAnimationActive={false} />
                        <Area type="monotone" dataKey="sent" stroke={T.accent} strokeWidth={2}
                          fill={T.accent} fillOpacity={0.08} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>

                    {!hasChartData && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Activity {...ICON} size={20} style={{ color: T.textFaint }} />
                        <p className="mt-2 text-[12px]" style={{ color: T.textMuted }}>
                          No email activity in the last {range * 2} days
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* quick diagnostics so you can see what the chart is built from */}
              <p className="px-5 pt-1 pb-4 text-[11px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                {formatNumber(emaillogs.length)} log events loaded · {formatNumber(period.inRange)} in range · {formatNumber(period.sent)} sent
              </p>
            </Card>

            <Card className="lg:col-span-4 min-w-0">
              <CardHeader title="Campaigns by status" hint={`${formatNumber(allCampaigns.length)} total`} />
              <Breakdown items={campaignMix} total={allCampaigns.length} empty="No campaigns yet" />
            </Card>
          </div>

          {/* Recipients / logs / roles breakdowns */}
          <div className="enter grid grid-cols-1 lg:grid-cols-3 gap-4" style={stagger(3)}>
            <Card>
              <CardHeader title="Recipients by status" hint={`${formatNumber(serverTotal)} across all uploads`} />
              <Breakdown items={recipientMix} total={serverTotal} empty="No recipients yet" />
            </Card>
            <Card>
              <CardHeader title="Email log events" hint={`${formatNumber(emaillogs.length)} total events`} />
              <Breakdown items={logMix} total={emaillogs.length} empty="No email events yet" />
            </Card>
            <Card>
              <CardHeader title="Users by role" hint={`${formatNumber(users.length)} total`} />
              <Breakdown items={roleMix} total={users.length} empty="No users loaded" />
            </Card>
          </div>

          {/* Sender accounts + uploads */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(4)}>
            <Card className="lg:col-span-7 overflow-hidden">
              <CardHeader title="Sender accounts" hint={`${formatNumber(senderStats.sentToday)} sent today of ${formatNumber(senderStats.capacity)} capacity`}
                right={<LinkButton label="Manage" onClick={() => navigate("/admin/sender-accounts")} />} />
              {senderAcc.length === 0 ? <Empty text="No sender accounts connected" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="text-[12px]" style={{ color: T.textFaint }}>
                        <th className="px-5 py-3 font-normal">Account</th>
                        <th className={th}>Status</th>
                        <th className={`${th} text-right`}>Hour</th>
                        <th className="px-5 py-3 font-normal" style={{ width: 180 }}>Today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...senderAcc].sort((a: any, b: any) => (b.emails_sent_today ?? 0) - (a.emails_sent_today ?? 0)).slice(0, 6).map((a: any) => {
                        const pct = a.daily_limit > 0 ? ((a.emails_sent_today ?? 0) / a.daily_limit) * 100 : 0;
                        return (
                          <tr key={a.id} className="row-hover" style={{ borderTop: `1px solid ${T.line}` }}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={a.display_name || a.email} />
                                <div className="min-w-0">
                                  <p className="text-[13px] truncate" style={{ color: T.text }}>{a.display_name || "Unnamed"}</p>
                                  <p className="text-[12px] truncate mt-1" style={monoCell}>{a.email} · {a.provider}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3"><Pill label={a.status} /></td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={monoCell}>
                              {formatNumber(a.emails_sent_hour)}/{formatNumber(a.hourly_limit)}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1"><Bar pct={pct} color={pct >= 80 ? T.warn : T.neutral2} /></div>
                                <span className="text-[12px] tabular-nums w-16 text-right" style={{ ...monoCell, color: T.text }}>
                                  {formatNumber(a.emails_sent_today)}/{formatNumber(a.daily_limit)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-5 overflow-hidden">
              <CardHeader title="Recent uploads" hint={`${formatNumber(files.length)} files`}
                right={<LinkButton label="All files" onClick={() => navigate("/admin/uploads")} />} />
              {recentFiles.length === 0 ? <Empty text="No files uploaded yet" /> : (
                <ul>
                  {recentFiles.map((f: any) => {
                    const rows = pick(f, "total_rows", "row_count", "rows", "recipients_count");
                    return (
                      <li key={f.id} className="row-hover flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
                        <Avatar name={pick(f, "original_filename", "filename", "name") ?? "File"} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] truncate" style={{ color: T.text }}>{pick(f, "original_filename", "filename", "name") ?? `File #${f.id}`}</p>
                          <p className="text-[12px] truncate mt-1" style={monoCell}>
                            {rows !== undefined ? `${formatNumber(rows)} rows` : "—"}{f.status ? ` · ${f.status}` : ""}
                          </p>
                        </div>
                        <span className="text-[12px] shrink-0 tabular-nums" style={{ ...monoCell, color: T.textFaint }}>
                          {formatRelative(pick(f, "created_at", "uploaded_at"))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Recent campaigns + templates */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(5)}>
            <Card className="lg:col-span-8 overflow-hidden">
              <CardHeader title="Recent campaigns" hint="Latest activity across all workspaces"
                right={<LinkButton label="View all" onClick={() => navigate("/admin/campaigns")} />} />
              {recentCampaigns.length === 0 ? <Empty text="No campaigns yet" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 640 }}>
                    <thead>
                      <tr className="text-[12px]" style={{ color: T.textFaint }}>
                        <th className="px-5 py-3 font-normal">Campaign</th>
                        <th className={th}>Owner</th>
                        <th className={th}>Status</th>
                        <th className={`${th} text-right`}>Recipients</th>
                        <th className="px-5 py-3 font-normal text-right">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCampaigns.map((c: any) => (
                        <tr key={c.id} className="row-hover" style={{ borderTop: `1px solid ${T.line}` }}>
                          <td className="px-5 py-3 text-[13px] truncate max-w-55" style={{ color: T.text }}>
                            {pick(c, "name", "title", "campaign_name") ?? `Campaign #${c.id}`}
                          </td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: T.textMuted }}>{ownerName(c)}</td>
                          <td className="px-3 py-3"><Pill label={c.status} /></td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={monoCell}>
                            {formatNumber(c.recipients?.length ?? c.recipient_count ?? 0)}
                          </td>
                          <td className="px-5 py-3 text-right text-[12px] tabular-nums" style={{ ...monoCell, color: T.textFaint }}>
                            {formatRelative(c.updated_at ?? c.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-4 overflow-hidden">
              <CardHeader title="HTML templates" hint={`${formatNumber(templates.length)} total`}
                right={<LinkButton label="Manage" onClick={() => navigate("/admin/templates")} />} />
              {recentTemplates.length === 0 ? <Empty text="No templates yet" /> : (
                <ul>
                  {recentTemplates.map((t: any, i: number) => (
                    <li key={t.id ?? i} className="row-hover flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
                      <Avatar name={pick(t, "name", "title", "template_name") ?? "T"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={{ color: T.text }}>{pick(t, "name", "title", "template_name") ?? `Template #${t.id}`}</p>
                        <p className="text-[12px] truncate mt-1" style={monoCell}>{pick(t, "subject", "description") ?? "HTML template"}</p>
                      </div>
                      <span className="text-[12px] shrink-0 tabular-nums" style={{ ...monoCell, color: T.textFaint }}>
                        {formatRelative(t.updated_at ?? t.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Top workspaces + recent signups */}
          <div className="enter grid grid-cols-1 lg:grid-cols-12 gap-4" style={stagger(7)}>
            <Card className="lg:col-span-8 overflow-hidden">
              <CardHeader title="Top workspaces" hint="Ranked by emails sent"
                right={<LinkButton label="All users" onClick={() => navigate("/admin/users")} />} />
              {topWorkspaces.length === 0 ? <Empty text="No workspace activity yet" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 720 }}>
                    <thead>
                      <tr className="text-[12px]" style={{ color: T.textFaint }}>
                        <th className="px-5 py-3 font-normal">Workspace</th>
                        <th className={th}>Role</th>
                        <th className={`${th} text-right`}>Campaigns</th>
                        <th className={`${th} text-right`}>Recipients</th>
                        <th className={`${th} text-right`}>Senders</th>
                        <th className="px-5 py-3 font-normal" style={{ width: 200 }}>Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkspaces.map((w) => (
                        <tr key={w.user_id} className="row-hover cursor-pointer" style={{ borderTop: `1px solid ${T.line}` }}
                          onClick={() => navigate("/admin/users")}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={w.name} />
                              <div className="min-w-0">
                                <p className="text-[13px] truncate" style={{ color: T.text }}>{w.name}</p>
                                {w.email && <p className="text-[12px] truncate mt-1" style={monoCell}>{w.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: T.textMuted }}>{roleLabel(w.role)}</td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={monoCell}>{formatNumber(w.campaigns)}</td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={monoCell}>{formatNumber(w.recipients)}</td>
                          <td className="px-3 py-3 text-right text-[12px] tabular-nums" style={monoCell}>{formatNumber(w.senders)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1"><Bar pct={(w.sent / maxSent) * 100} color={T.neutral2} /></div>
                              <span className="text-[12px] tabular-nums w-12 text-right" style={{ ...monoCell, color: T.text }}>{formatNumber(w.sent)}</span>
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
              <CardHeader title="Recent signups" hint="Newest users"
                right={<LinkButton label="View all" onClick={() => navigate("/admin/users")} />} />
              {recentUsers.length === 0 ? <Empty text="No users yet" /> : (
                <ul>
                  {recentUsers.map((u: any) => (
                    <li key={u.id} className="row-hover flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
                      <Avatar name={u.username || u.email || "?"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={{ color: T.text }}>{u.username || "—"}</p>
                        <p className="text-[12px] truncate mt-1" style={monoCell}>{u.email || "—"}</p>
                      </div>
                      <span className="text-[12px] shrink-0 tabular-nums" style={{ ...monoCell, color: T.textFaint }}>
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