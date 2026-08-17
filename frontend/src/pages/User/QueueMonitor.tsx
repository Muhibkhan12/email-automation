import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  RefreshCw,
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  Cpu,
  Copy,
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
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-6 md:p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[#E8E6E1]">
                Queue Monitor
              </h1>
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                System Healthy
              </span>
            </div>
            <p className="mt-1 text-sm text-[#9BA0A8]">
              Monitor email queues, workers and background jobs in real time.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors"
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
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Jobs"
            value="148"
            description="Waiting to be processed"
            icon={Inbox}
            accent="text-[#9BA0A8] bg-[#1B1E24]"
          />
          <StatCard
            title="Processing"
            value="11"
            description="Currently being processed"
            icon={Loader2}
            accent="text-blue-400 bg-blue-500/10"
            spin
          />
          <StatCard
            title="Completed"
            value="12,842"
            description="Successfully processed"
            icon={CheckCircle2}
            accent="text-emerald-400 bg-emerald-500/10"
          />
          <StatCard
            title="Failed Jobs"
            value="4"
            description="Require attention"
            icon={XCircle}
            accent="text-rose-400 bg-rose-500/10"
          />
        </div>

        {/* Workers */}
        <div className="mb-6 rounded-xl border p-6 shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#E8E6E1]">Workers</h2>
              <p className="text-xs text-[#6B727C]">
                Background workers processing your queues.
              </p>
            </div>
            <span className="text-xs text-[#6B727C]">
              {workers.filter((w) => w.online).length} of {workers.length} online
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workers.map((worker) => (
              <div
                key={worker.name}
                className="rounded-lg border p-4 transition hover:border-[#3A3E47]"
                style={{ borderColor: "#2A2E37", background: "#0B0E12" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md shadow-sm" style={{ background: "#1B1E24" }}>
                      <Cpu size={13} className="text-[#9BA0A8]" />
                    </span>
                    <p className="text-sm font-medium text-[#E8E6E1]">{worker.name}</p>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-[#6B727C]">Load</span>
                    <span className="font-medium text-[#E8E6E1]">{worker.load}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#2A2E37" }}>
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

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#6B727C]">Jobs processed</span>
                  <span className="font-medium text-[#E8E6E1]">
                    {worker.jobsProcessed.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queues */}
        <div className="mb-6 overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="border-b p-6" style={{ borderColor: "#2A2E37" }}>
            <h2 className="text-sm font-semibold text-[#E8E6E1]">Queues</h2>
            <p className="mt-1 text-xs text-[#6B727C]">
              Current status of your email processing queues.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: "#2A2E37", color: "#6B727C", background: "#0B0E12" }}>
                  <th className="px-6 py-3.5 font-medium">Queue</th>
                  <th className="px-6 py-3.5 font-medium">Pending</th>
                  <th className="px-6 py-3.5 font-medium">Processing</th>
                  <th className="px-6 py-3.5 font-medium">Failed</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
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
                    <td className="px-6 py-4">
                      <span className="rounded-md px-2 py-1 font-mono text-xs" style={{ background: "#1B1E24", color: "#C7C9CE" }}>
                        {queue.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#E8E6E1]">
                      {queue.pending}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-400">
                      {queue.processing}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-rose-400">
                      {queue.failed}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          queue.status === "Running"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            queue.status === "Running" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {queue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleQueue(queue.name)}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
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
                              <Pause size={12} /> Pause
                            </>
                          ) : (
                            <>
                              <Play size={12} /> Resume
                            </>
                          )}
                        </button>
                        <button className="text-xs font-medium text-[#6B727C] hover:text-[#E8E6E1]">
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
        <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="flex items-center justify-between border-b p-6" style={{ borderColor: "#2A2E37" }}>
            <div>
              <h2 className="text-sm font-semibold text-[#E8E6E1]">Recent Jobs</h2>
              <p className="mt-1 text-xs text-[#6B727C]">
                Latest email jobs processed by your workers.
              </p>
            </div>
            <button className="text-xs font-medium text-[#6B727C] hover:text-[#E8E6E1]">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: "#2A2E37", color: "#6B727C", background: "#0B0E12" }}>
                  <th className="px-6 py-3.5 font-medium">Job</th>
                  <th className="px-6 py-3.5 font-medium">Campaign</th>
                  <th className="px-6 py-3.5 font-medium">Recipient</th>
                  <th className="px-6 py-3.5 font-medium">Sender</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Time</th>
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
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigator.clipboard?.writeText(job.id)}
                        className="flex items-center gap-1 font-mono text-xs text-[#6B727C] hover:text-[#E8E6E1]"
                      >
                        {job.id}
                        <Copy size={10} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#E8E6E1]">
                      {job.campaign}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9BA0A8]">{job.recipient}</td>
                    <td className="px-6 py-4 text-sm text-[#9BA0A8]">{job.sender}</td>
                    <td className="px-6 py-4">
                      <JobStatus status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B727C]">{job.time}</td>
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
}

const StatCard = ({ title, value, description, icon: Icon, accent, spin }: StatCardProps) => {
  const isEmber = title === "Pending Jobs";
  return (
    <div className="rounded-xl border p-5 shadow-sm transition hover:shadow-md" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#9BA0A8]">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          isEmber ? "bg-ember-soft" : ""
        } ${!isEmber ? accent : ""}`}
        style={{ background: isEmber ? "rgba(255,106,57,0.12)" : undefined }}
        >
          <Icon size={16} className={isEmber ? "text-[#FF6A39]" : ""} style={{ color: isEmber ? "#FF6A39" : undefined }} />
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#E8E6E1]">{value}</h2>
      <p className="mt-1.5 text-xs text-[#6B727C]">{description}</p>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={12} className={spin ? "spin" : ""} />
      {status}
    </span>
  );
};

export default QueueMonitor;