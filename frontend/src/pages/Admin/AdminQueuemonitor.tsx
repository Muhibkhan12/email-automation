// AdminQueueMonitor.tsx
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Activity, Clock, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Pause, Play, Cpu, RefreshCw, Inbox, ArrowUpRight, ArrowDownRight,
  Zap, MoreHorizontal, ChevronLeft, ChevronRight, Menu, X,
  SlidersHorizontal, Radio,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

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
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  rowHover: "#11151E",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

/* ─────────────────────────── Data ─────────────────────────── */

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
  { id: "JOB-10241", campaign: "Summer Promotion",  recipient: "john@example.com",  sender: "marketing@company.com", status: "Processing", queue: "email-sending",    attempts: 1, time: "2 sec ago" },
  { id: "JOB-10240", campaign: "Product Launch",    recipient: "sarah@example.com", sender: "sales@company.com",     status: "Pending",    queue: "email-sending",    attempts: 0, time: "5 sec ago" },
  { id: "JOB-10239", campaign: "August Newsletter", recipient: "alex@example.com",  sender: "hello@company.com",     status: "Completed",  queue: "email-sending",    attempts: 1, time: "12 sec ago" },
  { id: "JOB-10238", campaign: "Summer Promotion",  recipient: "mike@example.com",  sender: "marketing@company.com", status: "Failed",     queue: "email-retry",      attempts: 3, time: "18 sec ago" },
  { id: "JOB-10237", campaign: "Cart Abandonment",  recipient: "emma@example.com",  sender: "sales@company.com",     status: "Pending",    queue: "high-priority",    attempts: 0, time: "25 sec ago" },
  { id: "JOB-10236", campaign: "Webhook Test",      recipient: "webhook@example.com",sender: "system@company.com",   status: "Processing", queue: "webhook-delivery", attempts: 2, time: "32 sec ago" },
];

const stats = [
  { title: "Pending jobs",     value: "190",    change: "-12.4%", trend: "down", icon: Clock,        accent: C.warning },
  { title: "Processing",       value: "14",     change: "+8.2%",  trend: "up",   icon: Loader2,      accent: C.blue },
  { title: "Completed (24h)",  value: "24,842", change: "+18.6%", trend: "up",   icon: CheckCircle2, accent: C.success },
  { title: "Failed jobs",      value: "12",     change: "-4.1%",  trend: "down", icon: XCircle,      accent: C.danger },
];

const QUEUE_STATUS_META: Record<Queue["status"], { fg: string; bg: string; ring: string }> = {
  Running: { fg: C.success, bg: C.successSoft, ring: C.successRing },
  Paused:  { fg: C.warning, bg: C.warningSoft, ring: C.warningRing },
  Stopped: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing },
};

const WORKER_STATUS_META: Record<Worker["status"], { fg: string; bg: string; ring: string }> = {
  Active:  { fg: C.success, bg: C.successSoft, ring: C.successRing },
  Busy:    { fg: C.warning, bg: C.warningSoft, ring: C.warningRing },
  Idle:    { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing },
  Offline: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing },
};

const JOB_STATUS_META: Record<Job["status"], { fg: string; bg: string; ring: string; icon: React.ElementType; spin?: boolean }> = {
  Processing: { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    icon: Loader2,      spin: true },
  Pending:    { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: Clock },
  Completed:  { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: CheckCircle2 },
  Failed:     { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: XCircle },
};

const PRIORITY_META: Record<Queue["priority"], { fg: string; bg: string; ring: string }> = {
  High:   { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing },
  Medium: { fg: C.warning, bg: C.warningSoft, ring: C.warningRing },
  Low:    { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing },
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

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
}> = ({ title, value, change, trend, icon: Icon, accent }) => (
  <Card className="p-4 md:p-5 float-in">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
      >
        <Icon size={15} className={title === "Processing" ? "animate-spin" : ""} style={{ color: accent }} />
      </div>
      <span
        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
        style={{
          background: trend === "up" ? C.successSoft : C.dangerSoft,
          color: trend === "up" ? C.success : C.danger,
          boxShadow: `inset 0 0 0 1px ${trend === "up" ? C.successRing : C.dangerRing}`,
          fontFamily: FONT.mono,
        }}
      >
        {trend === "up" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
        {change}
      </span>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: C.dark }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{title}</p>
  </Card>
);

const SegmentedBar: React.FC<{ value: number; segments?: number }> = ({ value, segments = 14 }) => {
  const active = Math.round((value / 100) * segments);
  const tone = value > 80 ? C.danger : value > 50 ? C.warning : C.success;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-sm transition-colors"
          style={{
            background: i < active ? tone : C.border,
            boxShadow: i < active ? `0 0 6px ${tone}66` : "none",
          }}
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
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
    style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
  >
    {Icon ? (
      <Icon size={11} className={spin ? "animate-spin" : ""} />
    ) : dotOnly ? (
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
    ) : null}
    {label}
  </span>
);

/* ─────────────────────────── Page ─────────────────────────── */

const AdminQueueMonitor = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const onlineWorkers = workers.filter((w) => w.status !== "Offline").length;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .aqm-main::-webkit-scrollbar { width: 10px; }
        .aqm-main::-webkit-scrollbar-track { background: transparent; }
        .aqm-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .aqm-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        .aqm-row:hover { background: ${C.rowHover}; }
        .aqm-row .aqm-actions { opacity: 0; transition: opacity 0.15s ease; }
        .aqm-row:hover .aqm-actions, .aqm-row:focus-within .aqm-actions { opacity: 1; }
        select option { background: #141821; color: #E8E6E1; }
        thead.aqm-thead th { position: sticky; top: 0; background: ${C.inner}; z-index: 1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="aqm-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      System healthy
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {onlineWorkers}/{workers.length} workers
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Queue monitor
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Monitor queues, workers, and background jobs in real time.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60 self-start md:self-auto"
                style={{ background: C.surface, color: C.textBody }}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </header>

            {/* ── Stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {stats.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </div>

            {/* ── Workers ────────────────────────── */}
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <div>
                  <h2
                    style={{ fontFamily: FONT.display }}
                    className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F2F0EB] flex items-center gap-2"
                  >
                    <Cpu size={15} style={{ color: C.primary }} /> Workers
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    {onlineWorkers} of {workers.length} online · live load
                  </p>
                </div>

                {/* compact legend */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["Active", "Busy", "Idle", "Offline"] as Worker["status"][]).map((status) => {
                    const meta = WORKER_STATUS_META[status];
                    return (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                        style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }}
                        />
                        {status}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ── Rack rows ────────────────────────── */}
              <div className="space-y-2.5">
                {workers.map((worker) => {
                  const meta = WORKER_STATUS_META[worker.status];
                  const tone = worker.load > 80 ? C.danger : worker.load > 50 ? C.warning : C.success;
                  const offline = worker.status === "Offline";

                  return (
                    <div
                      key={worker.id}
                      className="relative rounded-2xl soft-ring transition-all hover:-translate-y-0.5 overflow-hidden"
                      style={{
                        background: C.inner,
                        opacity: offline ? 0.65 : 1,
                      }}
                    >
                      {/* left status rail */}
                      <span
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all"
                        style={{
                          background: meta.fg,
                          opacity: offline ? 0.35 : 0.85,
                          boxShadow: offline ? "none" : `0 0 12px ${meta.fg}66`,
                        }}
                      />

                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 pl-5 pr-4 py-3.5">
                        {/* identity */}
                        <div className="flex items-center gap-3 min-w-0 lg:w-[220px] shrink-0">
                          <div
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "#1F242E", boxShadow: "inset 0 0 0 1px #2A2E37" }}
                          >
                            <Cpu size={16} style={{ color: offline ? C.textMuted : meta.fg }} />
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                              style={{
                                background: meta.fg,
                                borderColor: C.inner,
                                boxShadow: offline ? "none" : `0 0 8px ${meta.fg}`,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: C.dark }}>
                              {worker.name}
                            </p>
                            <p className="text-[10.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                              up {worker.uptime}
                            </p>
                          </div>
                          <div className="ml-auto lg:hidden">
                            <StatusPill meta={meta} label={worker.status} dotOnly />
                          </div>
                        </div>

                        {/* load bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <SegmentedBar value={worker.load} />
                            </div>
                            <span
                              className="shrink-0 text-[11.5px] font-semibold tabular-nums"
                              style={{ fontFamily: FONT.mono, color: offline ? C.textMuted : tone, minWidth: 36, textAlign: "right" }}
                            >
                              {worker.load}%
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10.5px]" style={{ color: C.textMuted }}>
                            <span>Load</span>
                            <span>Threshold {worker.load > 80 ? "critical" : worker.load > 50 ? "elevated" : "healthy"}</span>
                          </div>
                        </div>

                        {/* metrics cluster */}
                        <div className="flex items-center gap-4 lg:gap-6 shrink-0 lg:pl-4 lg:border-l"
                          style={{ borderColor: C.border }}
                        >
                          <div>
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textMuted }}>Jobs</p>
                            <p className="text-[13px] font-semibold tabular-nums mt-0.5" style={{ fontFamily: FONT.mono, color: C.dark }}>
                              {worker.jobsProcessed.toLocaleString()}
                            </p>
                          </div>

                          <div className="hidden sm:block">
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textMuted }}>Current</p>
                            <p
                              className="text-[12px] font-medium mt-0.5 truncate"
                              style={{
                                fontFamily: FONT.mono,
                                color: worker.currentJob ? C.primary : C.textMuted,
                                maxWidth: 160,
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

            {/* ── Queues ─────────────────────────── */}
            <Card className="overflow-hidden mb-6 md:mb-8">
              <div className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2
                    style={{ fontFamily: FONT.display }}
                    className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F2F0EB] flex items-center gap-2"
                  >
                    <Zap size={15} style={{ color: C.primary }} /> Queues
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    Current status of all processing queues
                  </p>
                </div>
                <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                  {queues.length} queues
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 780 }}>
                  <thead className="aqm-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="px-4 md:px-6 py-3 font-medium">Queue</th>
                      <th className="px-3 py-3 font-medium">Priority</th>
                      <th className="px-3 py-3 font-medium text-right">Pending</th>
                      <th className="px-3 py-3 font-medium text-right">Processing</th>
                      <th className="px-3 py-3 font-medium text-right">Completed</th>
                      <th className="px-3 py-3 font-medium text-right">Failed</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.map((queue) => {
                      const statusMeta = QUEUE_STATUS_META[queue.status];
                      const priorityMeta = PRIORITY_META[queue.priority];
                      return (
                        <tr key={queue.id} className="aqm-row transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td className="px-4 md:px-6 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[12px]"
                              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}`, fontFamily: FONT.mono }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: statusMeta.fg, boxShadow: `0 0 6px ${statusMeta.fg}` }}
                              />
                              {queue.name}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                              style={{ background: priorityMeta.bg, color: priorityMeta.fg, boxShadow: `inset 0 0 0 1px ${priorityMeta.ring}` }}
                            >
                              {queue.priority}
                            </span>
                          </td>

                          <td className="px-3 py-3.5 text-right text-[12.5px]" style={{ fontFamily: FONT.mono, color: C.textBody }}>
                            {queue.pending.toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12.5px]" style={{ fontFamily: FONT.mono, color: C.blue }}>
                            {queue.processing.toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12.5px]" style={{ fontFamily: FONT.mono, color: C.success }}>
                            {queue.completed.toLocaleString()}
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12.5px]" style={{ fontFamily: FONT.mono, color: C.danger }}>
                            {queue.failed.toLocaleString()}
                          </td>

                          <td className="px-3 py-3.5">
                            <StatusPill meta={statusMeta} label={queue.status} dotOnly />
                          </td>

                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <div className="aqm-actions flex items-center justify-end gap-1.5">
                              {queue.status === "Running" ? (
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                                  style={{ background: C.warningSoft, color: C.warning, boxShadow: `inset 0 0 0 1px ${C.warningRing}` }}
                                >
                                  <Pause size={11} /> Pause
                                </button>
                              ) : (
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                                  style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}
                                >
                                  <Play size={11} /> {queue.status === "Paused" ? "Resume" : "Start"}
                                </button>
                              )}
                              <button
                                aria-label="More options"
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                              >
                                <MoreHorizontal size={14} />
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

            {/* ── Recent jobs ────────────────────── */}
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2
                    style={{ fontFamily: FONT.display }}
                    className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F2F0EB] flex items-center gap-2"
                  >
                    <Activity size={15} style={{ color: C.primary }} /> Recent jobs
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    Latest jobs processed by workers
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-[11.5px] md:text-xs font-medium transition-colors"
                  style={{ color: C.primary }}
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 900 }}>
                  <thead className="aqm-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="px-4 md:px-6 py-3 font-medium">Job ID</th>
                      <th className="px-3 py-3 font-medium">Campaign</th>
                      <th className="px-3 py-3 font-medium">Recipient</th>
                      <th className="px-3 py-3 font-medium">Sender</th>
                      <th className="px-3 py-3 font-medium">Queue</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right">Attempts</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => {
                      const meta = JOB_STATUS_META[job.status];
                      return (
                        <tr key={job.id} className="aqm-row transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td className="px-4 md:px-6 py-3.5">
                            <span style={{ fontFamily: FONT.mono, color: C.textMuted, fontSize: 11.5 }}>
                              {job.id}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12.5px] font-medium" style={{ color: C.dark }}>
                              {job.campaign}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] truncate block max-w-[200px]" style={{ fontFamily: FONT.mono, color: C.textMuted }}>
                              {job.recipient}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] truncate block max-w-[220px]" style={{ fontFamily: FONT.mono, color: C.textMuted }}>
                              {job.sender}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px]"
                              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}`, fontFamily: FONT.mono }}
                            >
                              {job.queue}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill meta={meta} label={job.status} icon={meta.icon} spin={meta.spin} />
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12px]" style={{ fontFamily: FONT.mono, color: C.textMuted }}>
                            {job.attempts}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right text-[11.5px] whitespace-nowrap" style={{ fontFamily: FONT.mono, color: C.textMuted }}>
                            {job.time}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t" style={{ borderColor: C.border }}>
                <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                  Showing <span style={{ color: C.dark, fontFamily: FONT.mono }}>1–{jobs.length}</span> of{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{jobs.length}</span> jobs
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled
                    aria-label="Previous page"
                    className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span
                    className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium text-center"
                    style={{ background: C.primary, color: "#fff", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                  >
                    1
                  </span>
                  <button
                    disabled
                    aria-label="Next page"
                    className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminQueueMonitor;