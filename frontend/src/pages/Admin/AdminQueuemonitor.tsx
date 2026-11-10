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

/* ─────────────── design tokens (indigo + mint theme) ─────────────── */

const T = {
  bg:           "#0B0C0E",
  surface:      "#111214",
  surface2:     "#16181B",
  surfaceHi:    "#1C1F23",
  border:       "#24282E",
  borderSoft:   "#1B1E22",
  text:         "#E8EAED",
  textMuted:    "#9AA0A6",
  textFaint:    "#6B7075",
  
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  brandInk:     "#ffffff",

  accent:       "#6EE7A8",
  accentInk:    "#0B0C0E",
  accentLine:   "#2E6B4D",

  success:      "#6EE7A8",
  successSoft:  "rgba(110,231,168,0.10)",
  successBorder:"rgba(110,231,168,0.28)",
  
  warn:         "#E0A64A",
  warnSoft:     "rgba(224,166,74,0.10)",
  warnBorder:   "rgba(224,166,74,0.28)",
  
  danger:       "#E06A6A",
  dangerSoft:   "rgba(224,106,106,0.10)",
  dangerBorder: "rgba(224,106,106,0.28)",
  
  info:         "#6EC1E7",
  infoSoft:     "rgba(110,193,231,0.10)",
  infoBorder:   "rgba(110,193,231,0.28)",
  
  purple:       "#B39DE0",
  purpleSoft:   "rgba(179,157,224,0.10)",
  purpleBorder: "rgba(179,157,224,0.28)",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

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
  { label: "Completed (24h)", value: "24,842", delta: "+18.6%", trend: "up",   icon: CheckCircle2, accent: T.accent,  accentSoft: T.successSoft },
  { label: "Failed jobs",     value: "12",     delta: "-4.1%",  trend: "down", icon: XCircle,      accent: T.danger,  accentSoft: T.dangerSoft },
];

const QUEUE_STATUS_META: Record<Queue["status"], { fg: string; bg: string; ring: string }> = {
  Running: { fg: T.accent, bg: T.successSoft, ring: T.successBorder },
  Paused:  { fg: T.warn,   bg: T.warnSoft,    ring: T.warnBorder },
  Stopped: { fg: T.danger, bg: T.dangerSoft,  ring: T.dangerBorder },
};

const WORKER_STATUS_META: Record<Worker["status"], { fg: string; bg: string; ring: string }> = {
  Active:  { fg: T.accent, bg: T.successSoft, ring: T.successBorder },
  Busy:    { fg: T.warn,   bg: T.warnSoft,    ring: T.warnBorder },
  Idle:    { fg: T.info,   bg: T.infoSoft,    ring: T.infoBorder },
  Offline: { fg: T.danger, bg: T.dangerSoft,  ring: T.dangerBorder },
};

const JOB_STATUS_META: Record<Job["status"], { fg: string; bg: string; ring: string; icon: React.ElementType; spin?: boolean }> = {
  Processing: { fg: T.info,   bg: T.infoSoft,    ring: T.infoBorder,    icon: Loader2,      spin: true },
  Pending:    { fg: T.warn,   bg: T.warnSoft,    ring: T.warnBorder,    icon: Clock },
  Completed:  { fg: T.accent, bg: T.successSoft, ring: T.successBorder, icon: CheckCircle2 },
  Failed:     { fg: T.danger, bg: T.dangerSoft,  ring: T.dangerBorder,  icon: XCircle },
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
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, border: HAIRLINE, ...style }}>
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; hint?: string; right?: React.ReactNode }> = ({ title, hint, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 px-4 md:px-5 pt-4 pb-3">
    <div>
      <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>{title}</h2>
      {hint && <p className="text-[11.5px] mt-0.5 font-medium" style={{ color: T.textMuted }}>{hint}</p>}
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
  <Card className="p-4 relative overflow-hidden">
    <span
      aria-hidden
      className="absolute left-0 top-0 bottom-0 w-[2px]"
      style={{ background: accent, opacity: 0.6 }}
    />
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
          color: trend === "up" ? T.accent : T.danger,
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
    <p className="text-[11.5px] mt-2 font-medium" style={{ color: T.textMuted }}>{label}</p>
  </Card>
);

const SegmentedBar: React.FC<{ value: number; segments?: number }> = ({ value, segments = 14 }) => {
  const active = Math.round((value / 100) * segments);
  // Single color tone (mint) for a cleaner look
  const tone = T.accent;
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
    style={{ background: meta.bg, color: meta.fg, border: `1px solid ${meta.ring}` }}
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
        fontFamily: FONT.ui,
        background: T.bg,
        height: "100dvh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .aqm-main::-webkit-scrollbar { width: 8px; }
        .aqm-main::-webkit-scrollbar-track { background: transparent; }
        .aqm-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .aqm-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .aqm-row:hover { background: ${T.surface2}; }
        .aqm-row .aqm-actions { opacity: 0; transition: opacity 0.15s ease; }
        .aqm-row:hover .aqm-actions, .aqm-row:focus-within .aqm-actions { opacity: 1; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 4px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

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
                className="lg:hidden mt-1 p-2 rounded-md transition-colors"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.accent, border: `1px solid ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                    System healthy
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {onlineWorkers}/{workers.length} workers
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Queue monitor
                </h1>
                <p className="mt-1 text-[13px] max-w-lg font-medium" style={{ color: T.textMuted }}>
                  Monitor queues, workers, and background jobs in real time.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors disabled:opacity-60 self-start md:self-auto"
              style={{ color: T.textMuted, border: HAIRLINE }}
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
                        style={{ background: meta.bg, color: meta.fg, border: `1px solid ${meta.ring}` }}
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
                const offline = worker.status === "Offline";

                return (
                  <div
                    key={worker.id}
                    className="relative rounded-lg transition-colors"
                    style={{
                      background: T.surface2,
                      border: HAIRLINE_SOFT,
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
                              color: offline ? T.textFaint : T.accent,
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
                          <p className="text-[9.5px] uppercase tracking-wide font-medium" style={{ color: T.textFaint }}>Jobs</p>
                          <p className="text-[12px] font-semibold tabular-nums mt-0.5"
                            style={{ fontFamily: FONT.mono, color: T.text }}>
                            {worker.jobsProcessed.toLocaleString()}
                          </p>
                        </div>

                        <div className="hidden sm:block">
                          <p className="text-[9.5px] uppercase tracking-wide font-medium" style={{ color: T.textFaint }}>Current</p>
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
              style={{ borderBottom: HAIRLINE_SOFT }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Queues</h2>
                <p className="text-[11.5px] mt-0.5 font-medium" style={{ color: T.textMuted }}>
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
                  <tr className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                    <th className="px-4 md:px-5 py-3 font-semibold">Queue</th>
                    <th className="px-3 py-3 font-semibold">Priority</th>
                    <th className="px-3 py-3 font-semibold text-right">Pending</th>
                    <th className="px-3 py-3 font-semibold text-right">Processing</th>
                    <th className="px-3 py-3 font-semibold text-right">Completed</th>
                    <th className="px-3 py-3 font-semibold text-right">Failed</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-4 md:px-5 py-3 font-semibold text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((queue) => {
                    const statusMeta = QUEUE_STATUS_META[queue.status];
                    const priorityMeta = PRIORITY_META[queue.priority];
                    return (
                      <tr key={queue.id} className="aqm-row transition-colors"
                        style={{ borderTop: HAIRLINE_SOFT }}>
                        <td className="px-4 md:px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px]"
                            style={{ background: T.surface2, color: T.textMuted, fontFamily: FONT.mono, border: HAIRLINE_SOFT }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ background: statusMeta.fg }} />
                            {queue.name}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: priorityMeta.bg, color: priorityMeta.fg, border: `1px solid ${priorityMeta.ring}` }}
                          >
                            {queue.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {queue.pending.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
                          style={{ fontFamily: FONT.mono, color: T.info }}>
                          {queue.processing.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
                          style={{ fontFamily: FONT.mono, color: T.accent }}>
                          {queue.completed.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
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
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors"
                                style={{ background: T.warnSoft, color: T.warn, border: `1px solid ${T.warnBorder}` }}
                              >
                                <Pause size={10} /> Pause
                              </button>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors"
                                style={{ background: T.successSoft, color: T.accent, border: `1px solid ${T.successBorder}` }}
                              >
                                <Play size={10} /> {queue.status === "Paused" ? "Resume" : "Start"}
                              </button>
                            )}
                            <button
                              aria-label="More options"
                              className="p-1.5 rounded-md transition-colors"
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
              style={{ borderBottom: HAIRLINE_SOFT }}>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>Recent jobs</h2>
                <p className="text-[11.5px] mt-0.5 font-medium" style={{ color: T.textMuted }}>
                  Latest jobs processed by workers
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold transition-colors hover:opacity-70"
                style={{ color: T.brand }}
              >
                View all <ChevronRight size={11} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                    <th className="px-4 md:px-5 py-3 font-semibold">Job ID</th>
                    <th className="px-3 py-3 font-semibold">Campaign</th>
                    <th className="px-3 py-3 font-semibold">Recipient</th>
                    <th className="px-3 py-3 font-semibold">Sender</th>
                    <th className="px-3 py-3 font-semibold">Queue</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold text-right">Attempts</th>
                    <th className="px-4 md:px-5 py-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const meta = JOB_STATUS_META[job.status];
                    return (
                      <tr key={job.id} className="aqm-row transition-colors"
                        style={{ borderTop: HAIRLINE_SOFT }}>
                        <td className="px-4 md:px-5 py-3">
                          <span style={{ fontFamily: FONT.mono, color: T.textMuted, fontSize: 11 }}>
                            {job.id}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[12.5px] font-medium" style={{ color: T.text }}>
                            {job.campaign}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px] truncate block max-w-50 font-medium"
                            style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {job.recipient}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px] truncate block max-w-55 font-medium"
                            style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                            {job.sender}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
                            style={{ background: T.surface2, color: T.textMuted, fontFamily: FONT.mono, border: HAIRLINE_SOFT }}
                          >
                            {job.queue}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill meta={meta} label={job.status} icon={meta.icon} spin={meta.spin} />
                        </td>
                        <td className="px-3 py-3 text-right text-[11.5px] tabular-nums font-medium"
                          style={{ fontFamily: FONT.mono, color: T.textMuted }}>
                          {job.attempts}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right text-[11px] whitespace-nowrap font-medium"
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
              <span className="text-[11px] font-medium" style={{ color: T.textFaint }}>
                Showing <span style={{ color: T.text, fontFamily: FONT.mono }}>1–{jobs.length}</span> of{" "}
                <span style={{ color: T.text, fontFamily: FONT.mono }}>{jobs.length}</span> jobs
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: T.textMuted, border: HAIRLINE }}
                >
                  <ChevronLeft size={12} />
                </button>
                <span
                  className="min-w-7.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold text-center"
                  style={{ background: T.accent, color: T.accentInk, fontFamily: FONT.mono }}
                >
                  1
                </span>
                <button
                  disabled
                  aria-label="Next page"
                  className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: T.textMuted, border: HAIRLINE }}
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