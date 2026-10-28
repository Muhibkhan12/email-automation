// AdminQueueMonitor.tsx
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Clock, Loader2, CheckCircle2, XCircle,
  Pause, Play, Cpu, RefreshCw, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ChevronLeft, ChevronRight, Menu,
} from "lucide-react";

/* ─────────────── types ─────────────── */

interface Queue {
  id: string;
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  status: "Running" | "Paused" | "Stopped";
  priority: "High" | "Medium" | "Low";
}

interface Worker {
  id: string;
  name: string;
  status: "Active" | "Busy" | "Idle" | "Offline";
  load: number;
  jobsProcessed: number;
  currentJob?: string;
  uptime: string;
}

interface Job {
  id: string;
  campaign: string;
  recipient: string;
  sender: string;
  status: "Processing" | "Pending" | "Completed" | "Failed";
  queue: string;
  attempts: number;
  time: string;
}

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

/* ─────────────── data ─────────────── */

const queues: Queue[] = [
  { id: "q1", name: "email-sending",   pending: 124, processing: 8, completed: 12480, failed: 3, status: "Running", priority: "High" },
  { id: "q2", name: "email-retry",     pending: 18,  processing: 2, completed: 3420,  failed: 1, status: "Running", priority: "Medium" },
  { id: "q3", name: "high-priority",   pending: 6,   processing: 1, completed: 890,   failed: 0, status: "Running", priority: "High" },
  { id: "q4", name: "webhook-delivery",pending: 42,  processing: 3, completed: 5620,  failed: 8, status: "Paused",  priority: "Medium" },
  { id: "q5", name: "import-pipeline", pending: 0,   processing: 0, completed: 1240,  failed: 0, status: "Stopped", priority: "Low" },
];

const workers: Worker[] = [
  { id: "w1", name: "Worker-1", status: "Active",  load: 72, jobsProcessed: 842,  currentJob: "JOB-10241", uptime: "2h 34m" },
  { id: "w2", name: "Worker-2", status: "Busy",    load: 45, jobsProcessed: 1684, currentJob: "JOB-10240", uptime: "4h 12m" },
  { id: "w3", name: "Worker-3", status: "Active",  load: 88, jobsProcessed: 2526, currentJob: "JOB-10239", uptime: "6h 8m"  },
  { id: "w4", name: "Worker-4", status: "Idle",    load: 12, jobsProcessed: 3368, uptime: "8h 45m" },
  { id: "w5", name: "Worker-5", status: "Offline", load: 0,  jobsProcessed: 0,    uptime: "0h 0m"  },
];

const jobs: Job[] = [
  { id: "JOB-10241", campaign: "Summer Promotion",  recipient: "john@example.com",   sender: "marketing@company.com", status: "Processing", queue: "email-sending",    attempts: 1, time: "2 sec ago" },
  { id: "JOB-10240", campaign: "Product Launch",    recipient: "sarah@example.com",  sender: "sales@company.com",     status: "Pending",    queue: "email-sending",    attempts: 0, time: "5 sec ago" },
  { id: "JOB-10239", campaign: "August Newsletter", recipient: "alex@example.com",   sender: "hello@company.com",     status: "Completed",  queue: "email-sending",    attempts: 1, time: "12 sec ago" },
  { id: "JOB-10238", campaign: "Summer Promotion",  recipient: "mike@example.com",   sender: "marketing@company.com", status: "Failed",     queue: "email-retry",      attempts: 3, time: "18 sec ago" },
  { id: "JOB-10237", campaign: "Cart Abandonment",  recipient: "emma@example.com",   sender: "sales@company.com",     status: "Pending",    queue: "high-priority",    attempts: 0, time: "25 sec ago" },
  { id: "JOB-10236", campaign: "Webhook Test",      recipient: "webhook@example.com",sender: "system@company.com",    status: "Processing", queue: "webhook-delivery", attempts: 2, time: "32 sec ago" },
];

const stats = [
  { label: "Pending jobs",    value: "190",    delta: "-12.4%", trend: "down", icon: Clock,        accent: T.warn,    accentSoft: T.warnSoft },
  { label: "Processing",      value: "14",     delta: "+8.2%",  trend: "up",   icon: Loader2,      accent: T.info,    accentSoft: T.infoSoft },
  { label: "Completed (24h)", value: "24,842", delta: "+18.6%", trend: "up",   icon: CheckCircle2, accent: T.success, accentSoft: T.successSoft },
  { label: "Failed jobs",     value: "12",     delta: "-4.1%",  trend: "down", icon: XCircle,      accent: T.danger,  accentSoft: T.dangerSoft },
];

const QUEUE_STATUS_META: Record<Queue["status"], { fg: string; bg: string; ring: string }> = {
  Running: { fg: T.success, bg: T.successSoft, ring: T.successBorder },
  Paused:  { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder },
  Stopped: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder },
};

const WORKER_STATUS_META: Record<Worker["status"], { fg: string; bg: string; ring: string }> = {
  Active:  { fg: T.success, bg: T.successSoft, ring: T.successBorder },
  Busy:    { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder },
  Idle:    { fg: T.info,    bg: T.infoSoft,    ring: T.infoBorder },
  Offline: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder },
};

const JOB_STATUS_META: Record<Job["status"], { fg: string; bg: string; ring: string; icon: React.ElementType; spin?: boolean }> = {
  Processing: { fg: T.info,    bg: T.infoSoft,    ring: T.infoBorder,    icon: Loader2,      spin: true },
  Pending:    { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: Clock },
  Completed:  { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: CheckCircle2 },
  Failed:     { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: XCircle },
};

const PRIORITY_META: Record<Queue["priority"], { fg: string; bg: string; ring: string }> = {
  High:   { fg: T.danger, bg: T.dangerSoft, ring: T.dangerBorder },
  Medium: { fg: T.warn,   bg: T.warnSoft,   ring: T.warnBorder },
  Low:    { fg: T.info,   bg: T.infoSoft,   ring: T.infoBorder },
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

const StatCard: React.FC<{
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  spinIcon?: boolean;
}> = ({ label, value, delta, trend, icon: Icon, accent, accentSoft, spinIcon }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} className={spinIcon ? "animate-spin" : ""} />
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
);

const SegmentedBar: React.FC<{ value: number; segments?: number }> = ({ value, segments = 14 }) => {
  const active = Math.round((value / 100) * segments);
  const tone = value > 80 ? T.danger : value > 50 ? T.warn : T.success;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-1 flex-1 rounded-sm transition-colors"
          style={{ background: i < active ? tone : T.surfaceHi }}
        />
      ))}
    </div>
  );
};

const StatusPill: React.FC<{
  meta: { fg: string; bg: string; ring: string };
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  spin?: boolean;
  dotOnly?: boolean;
}> = ({ meta, label, icon: Icon, spin, dotOnly }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
    style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
  >
    {Icon ? (
      <Icon size={10} className={spin ? "animate-spin" : ""} />
    ) : dotOnly ? (
      <span className="w-1 h-1 rounded-full" style={{ background: meta.fg }} />
    ) : null}
    {label}
  </span>
);

/* ─────────────── page ─────────────── */

const AdminQueueMonitor = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const onlineWorkers = workers.filter((w) => w.status !== "Offline").length;

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{
        fontFamily: FONT.body,
        background: T.bg,
        height: "100dvh", // ← locks the shell to the viewport (fixes double scrollbar)
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Kill the body/html scroll entirely so only <main> scrolls */
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .aqm-main::-webkit-scrollbar { width: 8px; }
        .aqm-main::-webkit-scrollbar-track { background: transparent; }
        .aqm-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .aqm-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .aqm-row:hover { background: rgba(255,255,255,0.02); }
        .aqm-row .aqm-actions { opacity: 0; transition: opacity 0.15s ease; }
        .aqm-row:hover .aqm-actions, .aqm-row:focus-within .aqm-actions { opacity: 1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper — h-full so it never exceeds shell height */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Single scroll container */}
      <main
        className="aqm-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden"
        style={{ background: T.bg }}
      >
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
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    System healthy
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {onlineWorkers}/{workers.length} workers
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Queue monitor
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Monitor queues, workers, and background jobs in real time.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60 self-start md:self-auto"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </header>

          {/* Stats */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                delta={s.delta}
                trend={s.trend as "up" | "down"}
                icon={s.icon}
                accent={s.accent}
                accentSoft={s.accentSoft}
                spinIcon={s.label === "Processing"}
              />
            ))}
          </div>

          {/* Workers */}
          <Card className="mb-6">
            <CardHeader
              title="Workers"
              hint={`${onlineWorkers} of ${workers.length} online · live load`}
              right={
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["Active", "Busy", "Idle", "Offline"] as Worker["status"][]).map((status) => {
                    const meta = WORKER_STATUS_META[status];
                    return (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: meta.fg }} />
                        {status}
                      </span>
                    );
                  })}
                </div>
              }
            />

            <div className="px-4 md:px-5 pb-4 space-y-2">
              {workers.map((worker) => {
                const meta = WORKER_STATUS_META[worker.status];
                const tone = worker.load > 80 ? T.danger : worker.load > 50 ? T.warn : T.success;
                const offline = worker.status === "Offline";

                return (
                  <div
                    key={worker.id}
                    className="relative rounded-lg transition-colors"
                    style={{
                      background: T.surface2,
                      boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
                      opacity: offline ? 0.65 : 1,
                    }}
                  >
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full"
                      style={{ background: meta.fg, opacity: offline ? 0.4 : 0.9 }}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 pl-4 pr-3.5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0 lg:w-50 shrink-0">
                        <div
                          className="relative w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: T.surfaceHi, color: offline ? T.textFaint : meta.fg }}
                        >
                          <Cpu size={13} />
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                            style={{ background: meta.fg, borderColor: T.surface2 }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>
                            {worker.name}
                          </p>
                          <p className="text-[10.5px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                            up {worker.uptime}
                          </p>
                        </div>
                        <div className="ml-auto lg:hidden">
                          <StatusPill meta={meta} label={worker.status} dotOnly />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 min-w-0">
                            <SegmentedBar value={worker.load} />
                          </div>
                          <span
                            className="shrink-0 text-[11px] font-semibold tabular-nums"
                            style={{
                              fontFamily: FONT.mono,
                              color: offline ? T.textFaint : tone,
                              minWidth: 32,
                              textAlign: "right",
                            }}
                          >
                            {worker.load}%
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]" style={{ color: T.textFaint }}>
                          <span>Load</span>
                          <span>
                            {worker.load > 80 ? "critical" : worker.load > 50 ? "elevated" : "healthy"}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-4 shrink-0 lg:pl-4 lg:border-l"
                        style={{ borderColor: T.borderSoft }}
                      >
                        <div>
                          <p className="text-[9.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>Jobs</p>
                          <p className="text-[12px] font-semibold tabular-nums mt-0.5"
                            style={{ fontFamily: FONT.mono, color: T.text }}>
                            {worker.jobsProcessed.toLocaleString()}
                          </p>
                        </div>

                        <div className="hidden sm:block">
                          <p className="text-[9.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>Current</p>
                          <p
                            className="text-[11px] font-medium mt-0.5 truncate"
                            style={{
                              fontFamily: FONT.mono,
                              color: worker.currentJob ? T.brand : T.textFaint,
                              maxWidth: 140,
                            }}
                          >
                            {worker.currentJob ?? "—"}
                          </p>
                        </div>

                        <div className="hidden lg:block">
                          <StatusPill meta={meta} label={worker.status} dotOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Queues */}
          <Card className="overflow-hidden mb-6">
            <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 py-3.5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Queues</h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                  Current status of all processing queues
                </p>
              </div>
              <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                {queues.length} queues
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 780 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest"
                    style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Queue</th>
                    <th className="px-3 py-2.5 font-medium">Priority</th>
                    <th className="px-3 py-2.5 font-medium text-right">Pending</th>
                    <th className="px-3 py-2.5 font-medium text-right">Processing</th>
                    <th className="px-3 py-2.5 font-medium text-right">Completed</th>
                    <th className="px-3 py-2.5 font-medium text-right">Failed</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((queue) => {
                    const statusMeta = QUEUE_STATUS_META[queue.status];
                    const priorityMeta = PRIORITY_META[queue.priority];
                    return (
                      <tr key={queue.id} className="aqm-row transition-colors"
                        style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <td className="px-4 md:px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px]"
                            style={{ background: T.surface2, color: T.textMuted, fontFamily: FONT.mono }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ background: statusMeta.fg }} />
                            {queue.name}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: priorityMeta.bg, color: priorityMeta.fg, boxShadow: `inset 0 0 0 1px ${priorityMeta.ring}` }}
                          >
                            {queue.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {queue.pending.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.info }}>
                          {queue.processing.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.success }}>
                          {queue.completed.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: queue.failed ? T.danger : T.textFaint }}>
                          {queue.failed.toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill meta={statusMeta} label={queue.status} dotOnly />
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <div className="aqm-actions flex items-center justify-end gap-1">
                            {queue.status === "Running" ? (
                              <button
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5"
                                style={{ background: T.warnSoft, color: T.warn, boxShadow: `inset 0 0 0 1px ${T.warnBorder}` }}
                              >
                                <Pause size={10} /> Pause
                              </button>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5"
                                style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                              >
                                <Play size={10} /> {queue.status === "Paused" ? "Resume" : "Start"}
                              </button>
                            )}
                            <button
                              aria-label="More options"
                              className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                              style={{ color: T.textFaint }}
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent jobs */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 py-3.5"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Recent jobs</h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                  Latest jobs processed by workers
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:text-white"
                style={{ color: T.brand }}
              >
                View all <ChevronRight size={11} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest"
                    style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Job ID</th>
                    <th className="px-3 py-2.5 font-medium">Campaign</th>
                    <th className="px-3 py-2.5 font-medium">Recipient</th>
                    <th className="px-3 py-2.5 font-medium">Sender</th>
                    <th className="px-3 py-2.5 font-medium">Queue</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium text-right">Attempts</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const meta = JOB_STATUS_META[job.status];
                    return (
                      <tr key={job.id} className="aqm-row transition-colors"
                        style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <td className="px-4 md:px-5 py-3">
                          <span style={{ fontFamily: FONT.mono, color: T.textMuted, fontSize: 11 }}>
                            {job.id}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[12px] font-medium" style={{ color: T.text }}>
                            {job.campaign}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px] truncate block max-w-50"
                            style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {job.recipient}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px] truncate block max-w-55"
                            style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {job.sender}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px]"
                            style={{ background: T.surface2, color: T.textMuted, fontFamily: FONT.mono }}
                          >
                            {job.queue}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill meta={meta} label={job.status} icon={meta.icon} spin={meta.spin} />
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {job.attempts}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right text-[11px] whitespace-nowrap"
                          style={{ fontFamily: FONT.mono, color: T.textFaint }}>
                          {job.time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3 border-t"
              style={{ borderColor: T.borderSoft }}>
              <span className="text-[11px]" style={{ color: T.textFaint }}>
                Showing <span style={{ color: T.text, fontFamily: FONT.mono }}>1–{jobs.length}</span> of{" "}
                <span style={{ color: T.text, fontFamily: FONT.mono }}>{jobs.length}</span> jobs
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                >
                  <ChevronLeft size={12} />
                </button>
                <span
                  className="min-w-7.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-center"
                  style={{ background: T.brand, color: "#fff", fontFamily: FONT.mono }}
                >
                  1
                </span>
                <button
                  disabled
                  aria-label="Next page"
                  className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminQueueMonitor;