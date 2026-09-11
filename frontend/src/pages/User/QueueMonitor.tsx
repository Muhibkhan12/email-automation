import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  RefreshCw,
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Cpu,
  Copy,
  Menu,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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

const initialQueues: Queue[] = [
  { name: "email-sending", pending: 124, processing: 8, failed: 3, status: "Running" },
  { name: "email-retry", pending: 18, processing: 2, failed: 1, status: "Running" },
  { name: "high-priority", pending: 6, processing: 1, failed: 0, status: "Running" },
];

const workers: Worker[] = [
  { name: "Worker-1", load: 72, jobsProcessed: 842, online: true },
  { name: "Worker-2", load: 45, jobsProcessed: 1684, online: true },
  { name: "Worker-3", load: 88, jobsProcessed: 2526, online: true },
  { name: "Worker-4", load: 12, jobsProcessed: 3368, online: true },
];

const jobs: Job[] = [
  {
    id: "JOB-10241",
    campaign: "Summer Promotion",
    recipient: "john@example.com",
    sender: "marketing@company.com",
    status: "Processing",
    time: "2 sec ago",
  },
  {
    id: "JOB-10240",
    campaign: "Product Launch",
    recipient: "sarah@example.com",
    sender: "sales@company.com",
    status: "Pending",
    time: "5 sec ago",
  },
  {
    id: "JOB-10239",
    campaign: "August Newsletter",
    recipient: "alex@example.com",
    sender: "hello@company.com",
    status: "Completed",
    time: "12 sec ago",
  },
  {
    id: "JOB-10238",
    campaign: "Summer Promotion",
    recipient: "mike@example.com",
    sender: "marketing@company.com",
    status: "Failed",
    time: "18 sec ago",
  },
];

const QueueMonitor = () => {
  const [queues, setQueues] = useState<Queue[]>(initialQueues);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }

        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        {/* Header */}
        <div className="mf-header mb-5 md:mb-7 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight" style={{ color: "#E8E6E1" }}>
                  Queue Monitor
                </h1>
                <span className="mf-health-badge flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-xs font-medium whitespace-nowrap" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                  <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="hidden xs:inline">System Healthy</span>
                  <span className="xs:hidden">✓</span>
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                Monitor email queues, workers and background jobs in real time.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="mf-refresh-btn flex items-center justify-center gap-1.5 md:gap-2 rounded-lg border px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
            style={{ 
              borderColor: "#2A2E37", 
              background: "#12151B", 
              color: "#C7C9CE" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1B1E24";
              e.currentTarget.style.color = "#E8E6E1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#12151B";
              e.currentTarget.style.color = "#C7C9CE";
            }}
          >
            <RefreshCw size={12} className={`md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] ${refreshing ? "spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Overview - Responsive Stats */}
        <div className="mf-stats-grid mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
          <StatCard
            title="Pending Jobs"
            value="148"
            description="Waiting to be processed"
            icon={Inbox}
            accent="text-[#9BA0A8] bg-[#1B1E24]"
            isEmber={true}
          />
          <StatCard
            title="Processing"
            value="11"
            description="Currently being processed"
            icon={Loader2}
            accent="text-blue-400 bg-blue-500/10"
            spin
            isEmber={false}
          />
          <StatCard
            title="Completed"
            value="12,842"
            description="Successfully processed"
            icon={CheckCircle2}
            accent="text-emerald-400 bg-emerald-500/10"
            isEmber={false}
          />
          <StatCard
            title="Failed Jobs"
            value="4"
            description="Require attention"
            icon={XCircle}
            accent="text-rose-400 bg-rose-500/10"
            isEmber={false}
          />
        </div>

        {/* Workers */}
        <div className="mf-section-padding mb-4 md:mb-6 rounded-xl border p-3 md:p-4 lg:p-6 shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="mb-3 md:mb-4 lg:mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[10px] md:text-xs lg:text-sm font-semibold" style={{ color: "#E8E6E1" }}>Workers</h2>
              <p className="text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
                Background workers processing your queues.
              </p>
            </div>
            <span className="text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
              {workers.filter((w) => w.online).length} of {workers.length} online
            </span>
          </div>

          <div className="mf-workers-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
            {workers.map((worker) => (
              <div
                key={worker.name}
                className="rounded-lg border p-2.5 md:p-3 lg:p-4 transition hover:border-[#3A3E47]"
                style={{ borderColor: "#2A2E37", background: "#0B0E12" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="flex h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 items-center justify-center rounded-md shadow-sm" style={{ background: "#1B1E24" }}>
                      <Cpu size={10} className="md:w-[11px] md:h-[11px] lg:w-[11px] lg:h-[11px] text-[#9BA0A8]" />
                    </span>
                    <p className="mf-worker-name text-[9px] md:text-[10px] lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>{worker.name}</p>
                  </div>
                  <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2 lg:h-2.5 lg:w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 md:h-2 md:w-2 lg:h-2.5 lg:w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>

                <div className="mt-2.5 md:mt-3 lg:mt-4">
                  <div className="mb-1 flex items-center justify-between text-[8px] md:text-[9px] lg:text-xs">
                    <span className="mf-worker-load" style={{ color: "#6B727C" }}>Load</span>
                    <span className="font-medium" style={{ color: "#E8E6E1" }}>{worker.load}%</span>
                  </div>
                  <div className="h-1 md:h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#2A2E37" }}>
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

                <div className="mt-1.5 md:mt-2 lg:mt-3 flex items-center justify-between text-[8px] md:text-[9px] lg:text-xs">
                  <span style={{ color: "#6B727C" }}>Jobs processed</span>
                  <span className="font-medium" style={{ color: "#E8E6E1" }}>
                    {worker.jobsProcessed.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queues */}
        <div className="mf-section-padding mb-4 md:mb-6 overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="border-b p-3 md:p-4 lg:p-6" style={{ borderColor: "#2A2E37" }}>
            <h2 className="text-[10px] md:text-xs lg:text-sm font-semibold" style={{ color: "#E8E6E1" }}>Queues</h2>
            <p className="mt-0.5 md:mt-1 text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
              Current status of your email processing queues.
            </p>
          </div>

          <div className="mf-table-wrapper overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: "500px" }}>
              <thead>
                <tr className="border-b text-[8px] md:text-[9px] lg:text-xs uppercase tracking-wide" style={{ borderColor: "#2A2E37", color: "#6B727C", background: "#0B0E12" }}>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Queue</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Pending</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Processing</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Failed</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Status</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#2A2E37" }}>
                {queues.map((queue) => (
                  <tr 
                    key={queue.name} 
                    className="transition hover:bg-[#1B1E24]"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1B1E24";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4">
                      <span className="mf-queue-name rounded-md px-1 md:px-1.5 lg:px-2 py-0.5 md:py-0.5 lg:py-1 font-mono text-[7px] md:text-[8px] lg:text-xs" style={{ background: "#1B1E24", color: "#C7C9CE" }}>
                        {queue.name}
                      </span>
                    </td>
                    <td className="mf-queue-value px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[9px] md:text-[10px] lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>
                      {queue.pending}
                    </td>
                    <td className="mf-queue-value px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[9px] md:text-[10px] lg:text-sm font-medium" style={{ color: "#60A5FA" }}>
                      {queue.processing}
                    </td>
                    <td className="mf-queue-value px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[9px] md:text-[10px] lg:text-sm font-medium" style={{ color: "#F87171" }}>
                      {queue.failed}
                    </td>
                    <td className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4">
                      <span
                        className={`inline-flex items-center gap-0.5 md:gap-1 lg:gap-1.5 rounded-full px-1 md:px-1.5 lg:px-2.5 py-0.5 md:py-0.5 lg:py-1 text-[7px] md:text-[8px] lg:text-xs font-medium ${
                          queue.status === "Running"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        <span
                          className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${
                            queue.status === "Running" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span className="hidden xs:inline">{queue.status}</span>
                        <span className="xs:hidden">{queue.status.charAt(0)}</span>
                      </span>
                    </td>
                    <td className="mf-queue-actions px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1 md:gap-1.5 lg:gap-2">
                        <button
                          onClick={() => toggleQueue(queue.name)}
                          className="flex items-center justify-center gap-0.5 md:gap-1 lg:gap-1.5 rounded-lg border px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 lg:py-1.5 text-[7px] md:text-[8px] lg:text-xs font-medium transition-colors"
                          style={{ 
                            borderColor: "#2A2E37", 
                            color: "#C7C9CE",
                            background: "transparent"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1B1E24";
                            e.currentTarget.style.color = "#E8E6E1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#C7C9CE";
                          }}
                        >
                          {queue.status === "Running" ? (
                            <>
                              <Pause size={9} className="md:w-[10px] md:h-[10px] lg:w-[10px] lg:h-[10px]" /> 
                              <span className="hidden xs:inline">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play size={9} className="md:w-[10px] md:h-[10px] lg:w-[10px] lg:h-[10px]" /> 
                              <span className="hidden xs:inline">Resume</span>
                            </>
                          )}
                        </button>
                        <button className="text-[7px] md:text-[8px] lg:text-xs font-medium hover:text-[#E8E6E1] hidden sm:inline" style={{ color: "#6B727C" }}>
                          Manage
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
        <div className="mf-section-padding overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="flex flex-wrap items-center justify-between border-b p-3 md:p-4 lg:p-6 gap-2" style={{ borderColor: "#2A2E37" }}>
            <div>
              <h2 className="text-[10px] md:text-xs lg:text-sm font-semibold" style={{ color: "#E8E6E1" }}>Recent Jobs</h2>
              <p className="mt-0.5 md:mt-1 text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
                Latest email jobs processed by your workers.
              </p>
            </div>
            <button className="text-[8px] md:text-[9px] lg:text-xs font-medium hover:text-[#E8E6E1]" style={{ color: "#6B727C" }}>
              <span className="hidden xs:inline">View all</span>
              <span className="xs:hidden">All</span>
            </button>
          </div>

          <div className="mf-table-wrapper overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: "550px" }}>
              <thead>
                <tr className="border-b text-[8px] md:text-[9px] lg:text-xs uppercase tracking-wide" style={{ borderColor: "#2A2E37", color: "#6B727C", background: "#0B0E12" }}>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Job</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Campaign</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Recipient</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Sender</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Status</th>
                  <th className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-3.5 font-medium">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#2A2E37" }}>
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="transition hover:bg-[#1B1E24]"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1B1E24";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4">
                      <button
                        onClick={() => navigator.clipboard?.writeText(job.id)}
                        className="mf-job-id flex items-center gap-0.5 md:gap-1 font-mono text-[7px] md:text-[8px] lg:text-xs hover:text-[#E8E6E1]" 
                        style={{ color: "#6B727C" }}
                      >
                        <span className="hidden xs:inline">{job.id}</span>
                        <span className="xs:hidden">{job.id.substring(0, 8)}</span>
                        <Copy size={7} className="md:w-[8px] md:h-[8px] lg:w-[8px] lg:h-[8px]" />
                      </button>
                    </td>
                    <td className="mf-job-campaign px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[8px] md:text-[9px] lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>
                      {job.campaign}
                    </td>
                    <td className="mf-job-recipient px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[8px] md:text-[9px] lg:text-sm" style={{ color: "#9BA0A8" }}>
                      <span className="hidden xs:inline">{job.recipient}</span>
                      <span className="xs:hidden">{job.recipient.substring(0, 12)}...</span>
                    </td>
                    <td className="mf-job-sender px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[8px] md:text-[9px] lg:text-sm" style={{ color: "#9BA0A8" }}>
                      <span className="hidden xs:inline">{job.sender}</span>
                      <span className="xs:hidden">{job.sender.substring(0, 12)}...</span>
                    </td>
                    <td className="mf-table-cell px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4">
                      <JobStatus status={job.status} />
                    </td>
                    <td className="mf-job-time px-2 md:px-3 lg:px-6 py-1.5 md:py-2 lg:py-4 text-[7px] md:text-[8px] lg:text-sm" style={{ color: "#6B727C" }}>{job.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ========================= */
/* Stat Card */
/* ========================= */

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  spin?: boolean;
  isEmber: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, accent, isEmber }: StatCardProps) => {
  return (
    <div className="mf-stat-card rounded-xl border p-2.5 md:p-3 lg:p-5 shadow-sm transition hover:shadow-md" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
      <div className="flex items-start justify-between">
        <p className="mf-stat-label text-[8px] md:text-[9px] lg:text-sm" style={{ color: "#9BA0A8" }}>{title}</p>
        <span className={`flex h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg ${
          isEmber ? "bg-ember-soft" : ""
        } ${!isEmber ? accent : ""}`}
        style={{ background: isEmber ? "rgba(255,106,57,0.12)" : undefined }}
        >
          <Icon size={11} className={`md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] ${isEmber ? "text-[#FF6A39]" : ""}`} />
        </span>
      </div>
      <h2 className="mf-stat-value mt-1.5 md:mt-2 lg:mt-3 text-base md:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: "#E8E6E1" }}>{value}</h2>
      <p className="mt-0.5 md:mt-1 text-[7px] md:text-[8px] lg:text-xs" style={{ color: "#6B727C" }}>{description}</p>
    </div>
  );
};

/* ========================= */
/* Job Status */
/* ========================= */

type JobStatusType = Job["status"];

const jobStatusConfig: Record<
  JobStatusType,
  { className: string; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }
> = {
  Processing: { className: "bg-blue-500/10 text-blue-400", icon: Loader2, spin: true },
  Pending: { className: "bg-amber-500/10 text-amber-400", icon: Clock },
  Failed: { className: "bg-rose-500/10 text-rose-400", icon: XCircle },
  Completed: { className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
};

const JobStatus = ({ status }: { status: JobStatusType }) => {
  const { className, icon: Icon, spin } = jobStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-0.5 md:gap-1 lg:gap-1.5 rounded-full px-1 md:px-1.5 lg:px-2.5 py-0.5 md:py-0.5 lg:py-1 text-[7px] md:text-[8px] lg:text-xs font-medium ${className}`}
    >
      <Icon size={8} className={`md:w-[9px] md:h-[9px] lg:w-[10px] lg:h-[10px] ${spin ? "spin" : ""}`} />
      <span className="hidden xs:inline">{status}</span>
      <span className="xs:hidden">{status.charAt(0)}</span>
    </span>
  );
};

export default QueueMonitor;