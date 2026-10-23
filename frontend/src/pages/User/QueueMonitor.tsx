import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  RefreshCw, Inbox, Loader2, CheckCircle2, XCircle, Clock,
  Pause, Play, Cpu, Copy, Menu, Sparkles, ArrowUpRight,
  Layers, ListChecks,
} from "lucide-react";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#090B10",
  surface:     "#101319",
  surface2:    "#151922",
  surfaceHi:   "#1B202B",
  border:      "#232A38",
  borderSoft:  "#1A1F2A",
  text:        "#E8EBF0",
  textMuted:   "#94A0B4",
  textFaint:   "#667085",
  // monitoring-page accent: cyan (primary) + violet (secondary)
  cyan:        "#22D3EE",
  cyanSoft:    "rgba(34,211,238,0.12)",
  cyanBorder:  "rgba(34,211,238,0.35)",
  violet:      "#A78BFA",
  violetSoft:  "rgba(167,139,250,0.12)",
  violetBorder:"rgba(167,139,250,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── types ─────────────── */

interface Queue {
  name: string;
  pending: number;
  processing: number;
  failed: number;
  status: "Running" | "Paused";
}

interface Worker {
  name: string;
  load: number;
  jobsProcessed: number;
  online: boolean;
}

interface Job {
  id: string;
  campaign: string;
  recipient: string;
  sender: string;
  status: "Processing" | "Pending" | "Failed" | "Completed";
  time: string;
}

/* ─────────────── data ─────────────── */

const initialQueues: Queue[] = [
  { name: "email-sending", pending: 124, processing: 8, failed: 3, status: "Running" },
  { name: "email-retry",   pending: 18,  processing: 2, failed: 1, status: "Running" },
  { name: "high-priority", pending: 6,   processing: 1, failed: 0, status: "Running" },
];

const workers: Worker[] = [
  { name: "Worker-1", load: 72, jobsProcessed: 842,  online: true },
  { name: "Worker-2", load: 45, jobsProcessed: 1684, online: true },
  { name: "Worker-3", load: 88, jobsProcessed: 2526, online: true },
  { name: "Worker-4", load: 12, jobsProcessed: 3368, online: true },
];

const jobs: Job[] = [
  { id: "JOB-10241", campaign: "Summer Promotion",  recipient: "john@example.com",  sender: "marketing@company.com", status: "Processing", time: "2 sec ago" },
  { id: "JOB-10240", campaign: "Product Launch",    recipient: "sarah@example.com", sender: "sales@company.com",     status: "Pending",    time: "5 sec ago" },
  { id: "JOB-10239", campaign: "August Newsletter", recipient: "alex@example.com",  sender: "hello@company.com",     status: "Completed",  time: "12 sec ago" },
  { id: "JOB-10238", campaign: "Summer Promotion",  recipient: "mike@example.com",  sender: "marketing@company.com", status: "Failed",     time: "18 sec ago" },
];

type Tab = "overview" | "workers" | "queues" | "jobs";

/* ─────────────── page ─────────────── */

const QueueMonitor = () => {
  const [queues, setQueues] = useState<Queue[]>(initialQueues);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const toggleQueue = (name: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.name === name ? { ...q, status: q.status === "Running" ? "Paused" : "Running" } : q
      )
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const totalPending    = queues.reduce((s, q) => s + q.pending, 0);
  const totalProcessing = queues.reduce((s, q) => s + q.processing, 0);
  const totalFailed     = queues.reduce((s, q) => s + q.failed, 0);
  const onlineWorkers   = workers.filter((w) => w.online).length;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }>; count?: number }[] = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "workers",  label: "Workers",  icon: Cpu,        count: workers.length },
    { id: "queues",   label: "Queues",   icon: Layers,     count: queues.length },
    { id: "jobs",     label: "Jobs",     icon: ListChecks, count: jobs.length },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.5); }
          70%      { box-shadow: 0 0 0 5px rgba(34,211,238,0); }
        }
        .pulse-cyan { animation: pulseDot 1.8s ease-out infinite; }

        .qm-main::-webkit-scrollbar { width: 8px; }
        .qm-main::-webkit-scrollbar-track { background: transparent; }
        .qm-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .qm-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @media (prefers-reduced-motion: reduce) {
          .spin, .pulse-cyan { animation: none !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="qm-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1160 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
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
                    style={{ background: T.cyanSoft, color: T.cyan, boxShadow: `inset 0 0 0 1px ${T.cyanBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full pulse-cyan" style={{ background: T.cyan }} />
                    All systems healthy
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · updated {refreshing ? "now" : "12s ago"}
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Queue monitor
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Live view of your sending pipeline — queues, workers, and jobs in one place.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              <RefreshCw size={13} className={refreshing ? "spin" : ""} />
              Refresh
            </button>
          </header>

          {/* Summary strip */}
          <div className="mb-5 md:mb-6 rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
              <SummaryTile icon={Inbox}        label="Pending"    value={totalPending.toLocaleString()}    tone={T.textMuted} />
              <SummaryTile icon={Loader2}      label="Processing" value={totalProcessing.toLocaleString()} tone={T.cyan}   spin />
              <SummaryTile icon={CheckCircle2} label="Completed"  value="12,842"                            tone={T.success} />
              <SummaryTile icon={XCircle}      label="Failed"     value={totalFailed.toLocaleString()}      tone={T.danger} />
            </div>
          </div>

          {/* Tabs */}
          <div
            className="mb-5 md:mb-6 inline-flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}`, maxWidth: "100%", overflowX: "auto" }}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: active ? T.cyanSoft : "transparent",
                    color: active ? T.cyan : T.textMuted,
                    boxShadow: active ? `inset 0 0 0 1px ${T.cyanBorder}` : "none",
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? "rgba(34,211,238,0.2)" : T.surface2,
                        color: active ? T.cyan : T.textFaint,
                        fontFamily: FONT.mono,
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GlanceCard
                title="Worker rack"
                subtitle={`${onlineWorkers} of ${workers.length} online`}
                icon={Cpu}
                onOpen={() => setTab("workers")}
              >
                <ul className="space-y-3">
                  {workers.map((w) => {
                    const tone = w.load > 80 ? T.danger : w.load > 50 ? T.warn : T.success;
                    return (
                      <li key={w.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-2 text-[12px]" style={{ color: T.text }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                            {w.name}
                          </span>
                          <span className="text-[11px]" style={{ color: tone, fontFamily: FONT.mono }}>{w.load}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${w.load}%`, background: tone }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </GlanceCard>

              <GlanceCard
                title="Active queues"
                subtitle={`${queues.filter(q => q.status === "Running").length} running`}
                icon={Layers}
                onOpen={() => setTab("queues")}
              >
                <ul className="space-y-2">
                  {queues.map((q) => {
                    const running = q.status === "Running";
                    return (
                      <li
                        key={q.name}
                        className="rounded-md px-2.5 py-2 flex items-center justify-between gap-2"
                        style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: running ? T.cyan : T.textMuted }}
                          />
                          <span className="text-[12px] truncate" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {q.name}
                          </span>
                        </div>
                        <span className="text-[10.5px] shrink-0" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                          {q.pending}<span style={{ color: T.textFaint }}>·</span>{q.processing}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </GlanceCard>

              <GlanceCard
                title="Recent jobs"
                subtitle={`${jobs.length} in the last minute`}
                icon={ListChecks}
                onOpen={() => setTab("jobs")}
              >
                <ul className="space-y-2.5">
                  {jobs.slice(0, 4).map((j) => (
                    <li key={j.id} className="flex items-center gap-2.5">
                      <JobDot status={j.status} />
                      <span className="text-[12px] truncate flex-1" style={{ color: T.text }}>{j.campaign}</span>
                      <span className="text-[10.5px] shrink-0" style={{ color: T.textFaint }}>{j.time}</span>
                    </li>
                  ))}
                </ul>
              </GlanceCard>
            </div>
          )}

          {/* Workers */}
          {tab === "workers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {workers.map((w) => {
                const tone = w.load > 80 ? T.danger : w.load > 50 ? T.warn : T.success;
                return (
                  <div
                    key={w.name}
                    className="rounded-xl p-4 transition-colors hover:border-[color:var(--hover)]"
                    style={{ background: T.surface, boxShadow: RING }}
                  >
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-md flex items-center justify-center"
                          style={{ background: `${tone}14`, color: tone }}
                        >
                          <Cpu size={15} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: T.text }}>{w.name}</p>
                          <p className="text-[11px]" style={{ color: T.textMuted }}>Background worker</p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: T.success }} />
                        Online
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 text-[11px]">
                          <span style={{ color: T.textMuted }}>CPU load</span>
                          <span style={{ color: tone, fontFamily: FONT.mono, fontWeight: 600 }}>{w.load}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${w.load}%`, background: tone }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textFaint }}>Jobs processed</p>
                          <p className="text-[18px] font-semibold leading-none mt-1" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {w.jobsProcessed.toLocaleString()}
                          </p>
                        </div>
                        <ArrowUpRight size={16} style={{ color: T.textFaint }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Queues */}
          {tab === "queues" && (
            <div className="space-y-2.5">
              {queues.map((q) => {
                const running = q.status === "Running";
                const tone = running ? T.cyan : T.textMuted;
                return (
                  <div
                    key={q.name}
                    className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
                    style={{ background: T.surface, boxShadow: RING }}
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div
                        className="relative w-9 h-9 shrink-0 rounded-md flex items-center justify-center"
                        style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}35` }}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${running ? "pulse-cyan" : ""}`}
                          style={{ background: tone }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: T.text, fontFamily: FONT.mono }}>
                          {q.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: tone }}>{q.status}</p>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <MiniStat label="Pending"    value={q.pending}    tone={T.textMuted} />
                      <MiniStat label="Processing" value={q.processing} tone={T.cyan} />
                      <MiniStat label="Failed"     value={q.failed}     tone={T.danger} />
                    </div>

                    <button
                      onClick={() => toggleQueue(q.name)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:brightness-110"
                      style={{
                        background: running ? T.warnSoft : T.successSoft,
                        color: running ? T.warn : T.success,
                        boxShadow: `inset 0 0 0 1px ${running ? T.warnBorder : T.successBorder}`,
                      }}
                    >
                      {running ? <Pause size={12} /> : <Play size={12} />}
                      {running ? "Pause" : "Resume"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Jobs */}
          {tab === "jobs" && (
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
              <ul>
                {jobs.map((j, i) => {
                  const tone =
                    j.status === "Processing" ? T.cyan :
                    j.status === "Pending"    ? T.warn :
                    j.status === "Completed"  ? T.success : T.danger;
                  return (
                    <li
                      key={j.id}
                      className="flex items-center gap-3 md:gap-3.5 px-3.5 md:px-4 py-3 transition-colors hover:bg-white/[0.02]"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}` }}
                    >
                      <span className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: tone, opacity: 0.7 }} />

                      <div
                        className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center"
                        style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}35` }}
                      >
                        <JobDot status={j.status} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{j.campaign}</p>
                          <button
                            onClick={() => navigator.clipboard?.writeText(j.id)}
                            className="inline-flex items-center gap-1 text-[10px] shrink-0 transition-colors hover:text-white"
                            style={{ color: T.textFaint, fontFamily: FONT.mono }}
                          >
                            {j.id}
                            <Copy size={9} />
                          </button>
                        </div>
                        <p className="text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {j.recipient} <span style={{ color: T.border }}>←</span> {j.sender}
                        </p>
                      </div>

                      <span className="hidden md:inline shrink-0 text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {j.time}
                      </span>

                      <span className="shrink-0"><JobStatus status={j.status} /></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ─────────────── subcomponents ─────────────── */

const SummaryTile: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: string;
  spin?: boolean;
}> = ({ icon: Icon, label, value, tone, spin }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: `${tone}1A`, color: tone }}
      >
        <Icon size={13} className={spin ? "spin" : ""} />
      </div>
      <span className="text-[10.5px] uppercase tracking-wider font-medium" style={{ color: T.textFaint }}>
        {label}
      </span>
    </div>
    <p className="text-[24px] font-semibold leading-none tracking-tight" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

const GlanceCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number }>;
  onOpen: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, onOpen, children }) => (
  <div className="rounded-xl p-4" style={{ background: T.surface, boxShadow: RING }}>
    <div className="flex items-start justify-between mb-3.5">
      <div>
        <h3 className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: T.text }}>
          <Icon size={13} style={{ color: T.cyan }} />
          {title}
        </h3>
        <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{subtitle}</p>
      </div>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors"
        style={{ color: T.cyan }}
      >
        Open <ArrowUpRight size={11} />
      </button>
    </div>
    {children}
  </div>
);

const MiniStat: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-md px-2.5 py-2" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
    <p className="text-[9.5px] uppercase tracking-wider" style={{ color: T.textFaint }}>{label}</p>
    <p className="text-[14px] font-semibold leading-none mt-1.5" style={{ color: tone, fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

const JobDot: React.FC<{ status: Job["status"] }> = ({ status }) => {
  const map: Record<Job["status"], { color: string; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }> = {
    Processing: { color: T.cyan,    icon: Loader2,      spin: true },
    Pending:    { color: T.warn,    icon: Clock },
    Completed:  { color: T.success, icon: CheckCircle2 },
    Failed:     { color: T.danger,  icon: XCircle },
  };
  const { color, icon: Icon, spin } = map[status];
  return <Icon size={13} className={spin ? "spin" : ""} style={{ color }} />;
};

const jobStatusConfig: Record<Job["status"], { fg: string; bg: string; ring: string }> = {
  Processing: { fg: T.cyan,    bg: T.cyanSoft,    ring: T.cyanBorder },
  Pending:    { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder },
  Failed:     { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder },
  Completed:  { fg: T.success, bg: T.successSoft, ring: T.successBorder },
};

const JobStatus = ({ status }: { status: Job["status"] }) => {
  const { fg, bg, ring } = jobStatusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: bg, color: fg, boxShadow: `inset 0 0 0 1px ${ring}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: fg }} />
      {status}
    </span>
  );
};

export default QueueMonitor;