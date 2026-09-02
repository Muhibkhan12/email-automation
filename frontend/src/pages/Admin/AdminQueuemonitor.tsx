// AdminQueueMonitor.tsx
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Activity,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pause,
  Play,
  Cpu,
  RefreshCw,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Server,
  Network,
  HardDrive,
  Gauge,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const queues: Queue[] = [
  { id: "q1", name: "email-sending", pending: 124, processing: 8, completed: 12480, failed: 3, status: "Running", priority: "High" },
  { id: "q2", name: "email-retry", pending: 18, processing: 2, completed: 3420, failed: 1, status: "Running", priority: "Medium" },
  { id: "q3", name: "high-priority", pending: 6, processing: 1, completed: 890, failed: 0, status: "Running", priority: "High" },
  { id: "q4", name: "webhook-delivery", pending: 42, processing: 3, completed: 5620, failed: 8, status: "Paused", priority: "Medium" },
  { id: "q5", name: "import-pipeline", pending: 0, processing: 0, completed: 1240, failed: 0, status: "Stopped", priority: "Low" },
];

const workers: Worker[] = [
  { id: "w1", name: "Worker-1", status: "Active", load: 72, jobsProcessed: 842, currentJob: "JOB-10241", uptime: "2h 34m" },
  { id: "w2", name: "Worker-2", status: "Busy", load: 45, jobsProcessed: 1684, currentJob: "JOB-10240", uptime: "4h 12m" },
  { id: "w3", name: "Worker-3", status: "Active", load: 88, jobsProcessed: 2526, currentJob: "JOB-10239", uptime: "6h 8m" },
  { id: "w4", name: "Worker-4", status: "Idle", load: 12, jobsProcessed: 3368, currentJob: undefined, uptime: "8h 45m" },
  { id: "w5", name: "Worker-5", status: "Offline", load: 0, jobsProcessed: 0, currentJob: undefined, uptime: "0h 0m" },
];

const jobs: Job[] = [
  {
    id: "JOB-10241",
    campaign: "Summer Promotion",
    recipient: "john@example.com",
    sender: "marketing@company.com",
    status: "Processing",
    queue: "email-sending",
    attempts: 1,
    time: "2 sec ago",
  },
  {
    id: "JOB-10240",
    campaign: "Product Launch",
    recipient: "sarah@example.com",
    sender: "sales@company.com",
    status: "Pending",
    queue: "email-sending",
    attempts: 0,
    time: "5 sec ago",
  },
  {
    id: "JOB-10239",
    campaign: "August Newsletter",
    recipient: "alex@example.com",
    sender: "hello@company.com",
    status: "Completed",
    queue: "email-sending",
    attempts: 1,
    time: "12 sec ago",
  },
  {
    id: "JOB-10238",
    campaign: "Summer Promotion",
    recipient: "mike@example.com",
    sender: "marketing@company.com",
    status: "Failed",
    queue: "email-retry",
    attempts: 3,
    time: "18 sec ago",
  },
  {
    id: "JOB-10237",
    campaign: "Cart Abandonment",
    recipient: "emma@example.com",
    sender: "sales@company.com",
    status: "Pending",
    queue: "high-priority",
    attempts: 0,
    time: "25 sec ago",
  },
  {
    id: "JOB-10236",
    campaign: "Webhook Test",
    recipient: "webhook@example.com",
    sender: "system@company.com",
    status: "Processing",
    queue: "webhook-delivery",
    attempts: 2,
    time: "32 sec ago",
  },
];

const stats = [
  { title: "Pending Jobs", value: "190", change: "-12.4%", trend: "down", icon: Clock },
  { title: "Processing", value: "14", change: "+8.2%", trend: "up", icon: Loader2 },
  { title: "Completed (24h)", value: "24,842", change: "+18.6%", trend: "up", icon: CheckCircle2 },
  { title: "Failed Jobs", value: "12", change: "-4.1%", trend: "down", icon: XCircle },
];

const statusColors: Record<Queue["status"], { bg: string; text: string; dot: string }> = {
  Running: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  Paused: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  Stopped: { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
};

const workerStatusColors: Record<Worker["status"], { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  Busy: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  Idle: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  Offline: { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
};

const jobStatusColors: Record<Job["status"], { bg: string; text: string; icon: React.ElementType; spin?: boolean }> = {
  Processing: { bg: "bg-blue-500/15", text: "text-blue-400", icon: Loader2, spin: true },
  Pending: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Clock },
  Completed: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2 },
  Failed: { bg: "bg-rose-500/15", text: "text-rose-400", icon: XCircle },
};

const priorityColors: Record<Queue["priority"], { bg: string; text: string }> = {
  High: { bg: "bg-rose-500/15", text: "text-rose-400" },
  Medium: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Low: { bg: "bg-blue-500/15", text: "text-blue-400" },
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminQueueMonitor = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getPriorityBadge = (priority: Queue["priority"]) => {
    const colors = priorityColors[priority];
    return (
      <span className={`inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] font-medium ${colors.bg} ${colors.text}`}>
        {priority}
      </span>
    );
  };

  const getStatusDot = (status: Queue["status"]) => {
    const colors = statusColors[status];
    return <span className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${colors.dot}`} />;
  };

  const getWorkerStatusBadge = (status: Worker["status"]) => {
    const colors = workerStatusColors[status];
    return (
      <span className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] font-medium ${colors.bg} ${colors.text}`}>
        <span className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${colors.dot}`} />
        <span className="hidden xs:inline">{status}</span>
        <span className="xs:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  const getJobStatusBadge = (status: Job["status"]) => {
    const colors = jobStatusColors[status];
    const Icon = colors.icon;
    return (
      <span className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] font-medium ${colors.bg} ${colors.text}`}>
        <Icon size={9} className={`md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px] ${colors.spin ? "animate-spin" : ""}`} />
        <span className="hidden xs:inline">{status}</span>
        <span className="xs:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0E1013;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
        .stat-card {
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .worker-card {
          transition: all 0.2s ease;
        }
        .worker-card:hover {
          border-color: #3A3F4A;
        }
        .queue-row:hover {
          background-color: #1B1E24;
        }
        .job-row:hover {
          background-color: #1B1E24;
        }
        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 480px) {
          .worker-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 360px) {
          .worker-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#0E1013] h-screen w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                  Queue Monitor
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-emerald-500/15 text-emerald-400 flex items-center gap-1 md:gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="hidden xs:inline">System Healthy</span>
                  <span className="xs:hidden">✓</span>
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Monitor queues, workers, and background jobs in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition w-full sm:w-auto justify-center"
          >
            <RefreshCw size={12} className={`md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="stat-card rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10">
                    <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FF6A39]" />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[9px] md:text-[10px] lg:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" /> : <ArrowDownRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />}
                    {stat.change}
                  </span>
                </div>
                <h2 className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Workers */}
        <div className="mb-6 rounded-xl bg-[#171A21] border border-[#2A2E37] p-3 md:p-4 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
            <div>
              <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
                Workers
              </h2>
              <p className="text-[9px] md:text-xs text-[#8B8D94]">
                {workers.filter((w) => w.status !== "Offline").length} of {workers.length} online
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-[8px] md:text-xs text-[#8B8D94]">
              <span className="flex items-center gap-1 md:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="hidden xs:inline">Active</span>
                <span className="xs:hidden">A</span>
              </span>
              <span className="flex items-center gap-1 md:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="hidden xs:inline">Busy</span>
                <span className="xs:hidden">B</span>
              </span>
              <span className="flex items-center gap-1 md:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="hidden xs:inline">Idle</span>
                <span className="xs:hidden">I</span>
              </span>
              <span className="flex items-center gap-1 md:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span className="hidden xs:inline">Offline</span>
                <span className="xs:hidden">O</span>
              </span>
            </div>
          </div>

          <div className="worker-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="worker-card rounded-lg border border-[#2A2E37] bg-[#0E1013] p-3 md:p-4 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-[#2A2E37] shrink-0">
                      <Cpu size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#8B8D94]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs lg:text-sm font-medium text-[#E8E6E1] truncate">{worker.name}</p>
                      <p className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Uptime: {worker.uptime}</p>
                    </div>
                  </div>
                  {getWorkerStatusBadge(worker.status)}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex items-center justify-between text-[9px] md:text-xs mb-1">
                    <span className="text-[#8B8D94]">Load</span>
                    <span className="font-medium text-[#E8E6E1]">{worker.load}%</span>
                  </div>
                  <div className="h-1 md:h-1.5 w-full overflow-hidden rounded-full bg-[#2A2E37]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        worker.load > 80
                          ? "bg-rose-500"
                          : worker.load > 50
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${worker.load}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 md:mt-3 flex items-center justify-between text-[9px] md:text-xs">
                  <span className="text-[#8B8D94]">Jobs Processed</span>
                  <span className="font-medium text-[#E8E6E1] font-['JetBrains_Mono'] text-[9px] md:text-xs">
                    {worker.jobsProcessed.toLocaleString()}
                  </span>
                </div>

                {worker.currentJob && (
                  <div className="mt-2 rounded-md bg-[#1B1E24] px-1.5 md:px-2 py-1">
                    <p className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Current Job</p>
                    <p className="text-[9px] md:text-[10px] lg:text-[11px] font-mono text-[#FF6A39] truncate">{worker.currentJob}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Queues */}
        <div className="mb-6 rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="p-3 md:p-4 lg:p-5 border-b border-[#2A2E37]">
            <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">Queues</h2>
            <p className="text-[9px] md:text-xs text-[#8B8D94]">Current status of all processing queues</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] md:min-w-[700px] lg:min-w-[800px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37] bg-[#0E1013]">
                <tr>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium">Queue</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Priority</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Pending</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Processing</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Completed</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Failed</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Status</th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue) => (
                  <tr
                    key={queue.id}
                    className="queue-row transition border-t border-[#2A2E37]"
                  >
                    <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                      <span className="font-mono text-[9px] md:text-[10px] lg:text-[12px] text-[#C7C9CE]">
                        {queue.name}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      {getPriorityBadge(queue.priority)}
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[9px] md:text-[10px] lg:text-[13px] text-[#E8E6E1] font-['JetBrains_Mono']">
                        {queue.pending.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[9px] md:text-[10px] lg:text-[13px] text-blue-400 font-['JetBrains_Mono']">
                        {queue.processing.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[9px] md:text-[10px] lg:text-[13px] text-emerald-400 font-['JetBrains_Mono']">
                        {queue.completed.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[9px] md:text-[10px] lg:text-[13px] text-rose-400 font-['JetBrains_Mono']">
                        {queue.failed.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] lg:text-[10px] font-medium ${statusColors[queue.status].bg} ${statusColors[queue.status].text}`}>
                        {getStatusDot(queue.status)}
                        <span className="hidden xs:inline">{queue.status}</span>
                        <span className="xs:hidden">{queue.status.charAt(0)}</span>
                      </span>
                    </td>
                    <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        {queue.status === "Running" ? (
                          <button className="flex items-center gap-0.5 md:gap-1 rounded-lg border border-[#2A2E37] px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-[10px] font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                            <Pause size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                            <span className="hidden xs:inline">Pause</span>
                          </button>
                        ) : queue.status === "Paused" ? (
                          <button className="flex items-center gap-0.5 md:gap-1 rounded-lg border border-[#2A2E37] px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-[10px] font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                            <Play size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                            <span className="hidden xs:inline">Resume</span>
                          </button>
                        ) : (
                          <button className="flex items-center gap-0.5 md:gap-1 rounded-lg border border-[#2A2E37] px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-[10px] font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition">
                            <Play size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                            <span className="hidden xs:inline">Start</span>
                          </button>
                        )}
                        <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                          <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-b border-[#2A2E37]">
            <div>
              <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">Recent Jobs</h2>
              <p className="text-[9px] md:text-xs text-[#8B8D94]">Latest jobs processed by workers</p>
            </div>
            <button className="text-[9px] md:text-[10px] lg:text-xs font-medium text-[#FF6A39] hover:text-[#FF7F52] transition">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px] md:min-w-[750px] lg:min-w-[900px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37] bg-[#0E1013]">
                <tr>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium">Job ID</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Campaign</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Recipient</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sender</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Queue</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Status</th>
                  <th className="px-1.5 md:px-2 lg:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Attempts</th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="job-row transition border-t border-[#2A2E37]"
                  >
                    <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                      <span className="font-mono text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94]">
                        {job.id}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE]">
                        {job.campaign}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94]">
                        {job.recipient}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94]">
                        {job.sender}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] font-mono">
                        {job.queue}
                      </span>
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      {getJobStatusBadge(job.status)}
                    </td>
                    <td className="px-1.5 md:px-2 lg:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[8px] md:text-[9px] lg:text-[12px] text-[#8B8D94] font-['JetBrains_Mono']">
                        {job.attempts}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                      <span className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
                        {job.time}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
            <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">
              Showing 1-6 of 6 jobs
            </span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[9px] md:text-xs font-medium">
                1
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
                <ChevronRight size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminQueueMonitor;