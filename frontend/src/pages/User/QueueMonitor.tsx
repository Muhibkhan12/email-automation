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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Queue Monitor
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                System Healthy
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Monitor email queues, workers and background jobs in real time.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
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
            accent="text-slate-900 bg-slate-100"
          />
          <StatCard
            title="Processing"
            value="11"
            description="Currently being processed"
            icon={Loader2}
            accent="text-blue-600 bg-blue-50"
            spin
          />
          <StatCard
            title="Completed"
            value="12,842"
            description="Successfully processed"
            icon={CheckCircle2}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Failed Jobs"
            value="4"
            description="Require attention"
            icon={XCircle}
            accent="text-rose-600 bg-rose-50"
          />
        </div>

        {/* Workers */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Workers</h2>
              <p className="text-xs text-slate-500">
                Background workers processing your queues.
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {workers.filter((w) => w.online).length} of {workers.length} online
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workers.map((worker) => (
              <div
                key={worker.name}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm">
                      <Cpu size={13} className="text-slate-500" />
                    </span>
                    <p className="text-sm font-medium text-slate-900">{worker.name}</p>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Load</span>
                    <span className="font-medium text-slate-700">{worker.load}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
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
                  <span className="text-slate-500">Jobs processed</span>
                  <span className="font-medium text-slate-900">
                    {worker.jobsProcessed.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queues */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-900">Queues</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current status of your email processing queues.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5 font-medium">Queue</th>
                  <th className="px-6 py-3.5 font-medium">Pending</th>
                  <th className="px-6 py-3.5 font-medium">Processing</th>
                  <th className="px-6 py-3.5 font-medium">Failed</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {queues.map((queue) => (
                  <tr key={queue.name} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {queue.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {queue.pending}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {queue.processing}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-rose-600">
                      {queue.failed}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          queue.status === "Running"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
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
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
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
                        <button className="text-xs font-medium text-slate-500 hover:text-slate-900">
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Jobs</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest email jobs processed by your workers.
              </p>
            </div>
            <button className="text-xs font-medium text-slate-500 hover:text-slate-900">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5 font-medium">Job</th>
                  <th className="px-6 py-3.5 font-medium">Campaign</th>
                  <th className="px-6 py-3.5 font-medium">Recipient</th>
                  <th className="px-6 py-3.5 font-medium">Sender</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigator.clipboard?.writeText(job.id)}
                        className="flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-800"
                      >
                        {job.id}
                        <Copy size={10} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {job.campaign}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{job.recipient}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{job.sender}</td>
                    <td className="px-6 py-4">
                      <JobStatus status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{job.time}</td>
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} className={spin ? "animate-spin" : ""} />
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</h2>
      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
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
  Processing: { className: "bg-blue-50 text-blue-700", icon: Loader2, spin: true },
  Pending: { className: "bg-amber-50 text-amber-700", icon: Clock },
  Failed: { className: "bg-rose-50 text-rose-700", icon: XCircle },
  Completed: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
};

const JobStatus = ({ status }: { status: JobStatusType }) => {
  const { className, icon: Icon, spin } = jobStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={12} className={spin ? "animate-spin" : ""} />
      {status}
    </span>
  );
};

export default QueueMonitor;