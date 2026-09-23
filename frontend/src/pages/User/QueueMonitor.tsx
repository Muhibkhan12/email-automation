import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  RefreshCw, Inbox, Loader2, CheckCircle2, XCircle, Clock,
  Pause, Play, Cpu, Copy, Menu, Users, Sparkles, ArrowUpRight,
  Layers, Activity, ListChecks, Zap,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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
    { id: "workers",  label: "Workers",  icon: Cpu,       count: workers.length },
    { id: "queues",   label: "Queues",   icon: Layers,    count: queues.length },
    { id: "jobs",     label: "Jobs",     icon: ListChecks, count: jobs.length },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .qm-main::-webkit-scrollbar { width: 10px; }
        .qm-main::-webkit-scrollbar-track { background: transparent; }
        .qm-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .qm-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring {
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.04),
            0 1px 0 rgba(255,255,255,0.02);
        }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="qm-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: "#0B0E13" }}>
        <div className="glow-top">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141823" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      All systems healthy
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · updated {refreshing ? "now" : "12s ago"}
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    Queue monitor
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Live view of your sending pipeline — queues, workers, and jobs in one place.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-medium self-start md:self-auto transition-all soft-ring hover:bg-[#171C28] disabled:opacity-60"
                style={{ background: "#141823", color: "#E8E6E1" }}
              >
                <RefreshCw size={14} className={`transition-transform group-hover:rotate-45 ${refreshing ? "spin" : ""}`} />
                Refresh
              </button>
            </header>

            {/* ── Floating summary bar ───────────────── */}
            <div
              className="float-in relative mb-6 md:mb-8 rounded-3xl overflow-hidden soft-ring"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1A1F2B]">
                <SummaryTile icon={Inbox}        label="Pending"    value={totalPending.toLocaleString()}    tone="#9BA0A8" />
                <SummaryTile icon={Loader2}      label="Processing" value={totalProcessing.toLocaleString()} tone="#60A5FA" spin />
                <SummaryTile icon={CheckCircle2} label="Completed"  value="12,842"                            tone="#34D399" />
                <SummaryTile icon={XCircle}      label="Failed"     value={totalFailed.toLocaleString()}      tone="#F87171" />
              </div>
            </div>

            {/* ── Tab switcher ───────────────────────── */}
            <div className="mb-6 md:mb-7 flex items-center gap-1 p-1 rounded-2xl overflow-x-auto soft-ring"
              style={{ background: "#10141D", width: "fit-content", maxWidth: "100%" }}>
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all"
                    style={{
                      background: active ? "#1B2130" : "transparent",
                      color: active ? "#F2F0EB" : "#7A8092",
                      boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 14px -6px rgba(0,0,0,0.6)" : "none",
                    }}
                  >
                    <Icon size={14} />
                    {t.label}
                    {t.count !== undefined && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                        style={{
                          background: active ? "rgba(255,106,57,0.14)" : "#171C28",
                          color: active ? "#FF6A39" : "#6A7080",
                        }}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ────────────────────────── */}

            {tab === "overview" && (
              <div className="float-in grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Workers glance */}
                <GlanceCard
                  title="Worker rack"
                  subtitle={`${onlineWorkers} of ${workers.length} online`}
                  icon={Cpu}
                  onOpen={() => setTab("workers")}
                >
                  <ul className="space-y-3">
                    {workers.map((w) => {
                      const tone = w.load > 80 ? "#F87171" : w.load > 50 ? "#FBBF24" : "#34D399";
                      return (
                        <li key={w.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="flex items-center gap-2 text-[12.5px]" style={{ color: "#DADEE7" }}>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              </span>
                              {w.name}
                            </span>
                            <span className="text-[11px] font-mono" style={{ color: tone }}>{w.load}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0B0E13" }}>
                            <div className="h-full rounded-full" style={{ width: `${w.load}%`, background: tone, boxShadow: `0 0 10px ${tone}55` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </GlanceCard>

                {/* Queues glance */}
                <GlanceCard
                  title="Active queues"
                  subtitle={`${queues.filter(q => q.status === "Running").length} running`}
                  icon={Layers}
                  onOpen={() => setTab("queues")}
                >
                  <ul className="space-y-2.5">
                    {queues.map((q) => {
                      const running = q.status === "Running";
                      return (
                        <li key={q.name} className="rounded-2xl px-3 py-2.5 flex items-center justify-between gap-3"
                          style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: running ? "#34D399" : "#9BA0A8", boxShadow: running ? "0 0 8px #34D39988" : "none" }} />
                            <span className="text-[12.5px] truncate" style={{ color: "#DADEE7", fontFamily: FONT.mono }}>{q.name}</span>
                          </div>
                          <span className="text-[11px] font-mono shrink-0" style={{ color: "#7A8092" }}>
                            {q.pending}<span style={{ color: "#3A404F" }}>·</span>{q.processing}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </GlanceCard>

                {/* Jobs glance */}
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
                        <span className="text-[12.5px] truncate flex-1" style={{ color: "#DADEE7" }}>{j.campaign}</span>
                        <span className="text-[11px] shrink-0" style={{ color: "#6A7080" }}>{j.time}</span>
                      </li>
                    ))}
                  </ul>
                </GlanceCard>
              </div>
            )}

            {tab === "workers" && (
              <div className="float-in grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers.map((w) => {
                  const tone = w.load > 80 ? "#F87171" : w.load > 50 ? "#FBBF24" : "#34D399";
                  return (
                    <div
                      key={w.name}
                      className="group rounded-3xl p-5 transition-all soft-ring hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                            style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
                            <Cpu size={18} style={{ color: tone }} />
                          </div>
                          <div>
                            <p className="text-[14.5px] font-semibold" style={{ color: "#F2F0EB" }}>{w.name}</p>
                            <p className="text-[11.5px]" style={{ color: "#7A8092" }}>Background worker</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Online
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-[11.5px]">
                            <span style={{ color: "#7A8092" }}>CPU load</span>
                            <span className="font-mono font-semibold" style={{ color: tone }}>{w.load}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#0B0E13" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${w.load}%`, background: tone, boxShadow: `0 0 12px ${tone}66` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider" style={{ color: "#5A6172" }}>Jobs processed</p>
                            <p className="text-[20px] font-bold font-mono leading-none mt-1" style={{ color: "#F2F0EB" }}>
                              {w.jobsProcessed.toLocaleString()}
                            </p>
                          </div>
                          <ArrowUpRight size={18} style={{ color: "#3A404F" }} className="group-hover:text-[#FF6A39] transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "queues" && (
              <div className="float-in space-y-3">
                {queues.map((q) => {
                  const running = q.status === "Running";
                  const tone = running ? "#34D399" : "#9BA0A8";
                  return (
                    <div
                      key={q.name}
                      className="rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 soft-ring transition-all hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
                    >
                      {/* left: status + name */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="relative w-12 h-12 shrink-0">
                          <div className="absolute inset-0 rounded-2xl" style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}33` }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="relative flex h-2.5 w-2.5">
                              {running && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />}
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate" style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>{q.name}</p>
                          <p className="text-[11.5px] mt-0.5" style={{ color: tone }}>{q.status}</p>
                        </div>
                      </div>

                      {/* middle: mini stats */}
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <MiniStat label="Pending"    value={q.pending}    tone="#9BA0A8" />
                        <MiniStat label="Processing" value={q.processing} tone="#60A5FA" />
                        <MiniStat label="Failed"     value={q.failed}     tone="#F87171" />
                      </div>

                      {/* right: action */}
                      <button
                        onClick={() => toggleQueue(q.name)}
                        className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-all"
                        style={{
                          background: running ? "rgba(251,191,36,0.10)" : "rgba(52,211,153,0.10)",
                          color:      running ? "#FBBF24"                : "#34D399",
                          boxShadow: `inset 0 0 0 1px ${running ? "rgba(251,191,36,0.22)" : "rgba(52,211,153,0.22)"}`,
                        }}
                      >
                        {running ? <Pause size={13} /> : <Play size={13} />}
                        {running ? "Pause" : "Resume"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "jobs" && (
              <div className="float-in rounded-3xl overflow-hidden soft-ring" style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
                <ul>
                  {jobs.map((j, i) => {
                    const tone =
                      j.status === "Processing" ? "#60A5FA" :
                      j.status === "Pending"    ? "#FBBF24" :
                      j.status === "Completed"  ? "#34D399" : "#F87171";
                    return (
                      <li
                        key={j.id}
                        className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 hover:bg-[#141823]/60 transition-colors"
                        style={{ borderTop: i === 0 ? "none" : "1px solid #1A1F2B" }}
                      >
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: tone, opacity: 0.75 }} />

                        <div className="w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center"
                          style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
                          <JobDot status={j.status} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[13.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{j.campaign}</p>
                            <button
                              onClick={() => navigator.clipboard?.writeText(j.id)}
                              className="inline-flex items-center gap-1 text-[10.5px] shrink-0 transition-colors hover:text-[#E8E6E1]"
                              style={{ color: "#6A7080", fontFamily: FONT.mono }}
                            >
                              {j.id}
                              <Copy size={10} />
                            </button>
                          </div>
                          <p className="text-[11.5px] truncate" style={{ color: "#7A8092", fontFamily: FONT.mono }}>
                            {j.recipient} <span style={{ color: "#3A404F" }}>←</span> {j.sender}
                          </p>
                        </div>

                        <span className="hidden md:inline shrink-0 text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>{j.time}</span>

                        <span className="shrink-0"><JobStatus status={j.status} /></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
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
  <div className="p-5 md:p-6">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}2E` }}>
        <Icon size={14} className={spin ? "spin" : ""} style={{ color: tone }} />
      </div>
      <span className="text-[11.5px] uppercase tracking-wider font-medium" style={{ color: "#6A7080" }}>{label}</span>
    </div>
    <p className="text-[28px] md:text-[32px] font-bold font-mono leading-none tracking-tight" style={{ color: "#F2F0EB" }}>
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
  <div className="rounded-3xl p-5 soft-ring transition-all hover:-translate-y-0.5"
    style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color: "#F2F0EB" }}>
          <Icon size={14} />
          {title}
        </h3>
        <p className="text-[11.5px] mt-0.5" style={{ color: "#7A8092" }}>{subtitle}</p>
      </div>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors hover:opacity-80"
        style={{ color: "#FF6A39" }}
      >
        Open <ArrowUpRight size={12} />
      </button>
    </div>
    {children}
  </div>
);

const MiniStat: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-2xl px-3 py-2.5" style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}>
    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A6172" }}>{label}</p>
    <p className="text-[16px] font-bold font-mono leading-none mt-1.5" style={{ color: tone }}>{value}</p>
  </div>
);

const JobDot: React.FC<{ status: Job["status"] }> = ({ status }) => {
  const map: Record<Job["status"], { color: string; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }> = {
    Processing: { color: "#60A5FA", icon: Loader2,       spin: true },
    Pending:    { color: "#FBBF24", icon: Clock },
    Completed:  { color: "#34D399", icon: CheckCircle2 },
    Failed:     { color: "#F87171", icon: XCircle },
  };
  const { color, icon: Icon, spin } = map[status];
  return <Icon size={14} className={spin ? "spin" : ""} style={{ color }} />;
};

const jobStatusConfig: Record<Job["status"], { fg: string; bg: string; ring: string }> = {
  Processing: { fg: "#60A5FA", bg: "rgba(59,130,246,0.10)",  ring: "rgba(59,130,246,0.22)" },
  Pending:    { fg: "#FBBF24", bg: "rgba(234,179,8,0.10)",   ring: "rgba(234,179,8,0.22)" },
  Failed:     { fg: "#F87171", bg: "rgba(239,68,68,0.10)",   ring: "rgba(239,68,68,0.22)" },
  Completed:  { fg: "#34D399", bg: "rgba(52,211,153,0.10)",  ring: "rgba(52,211,153,0.22)" },
};

const JobStatus = ({ status }: { status: Job["status"] }) => {
  const { fg, bg, ring } = jobStatusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
      style={{ background: bg, color: fg, boxShadow: `inset 0 0 0 1px ${ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg, boxShadow: `0 0 6px ${fg}` }} />
      {status}
    </span>
  );
};

export default QueueMonitor;