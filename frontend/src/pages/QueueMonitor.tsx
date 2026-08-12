import React from "react";
import Sidebar from "./Sidebar";

interface Queue {
  name: string;
  pending: number;
  processing: number;
  failed: number;
  status: "Running" | "Paused";
}

interface Job {
  id: string;
  campaign: string;
  recipient: string;
  sender: string;
  status: "Processing" | "Pending" | "Failed" | "Completed";
  time: string;
}

const queues: Queue[] = [
  {
    name: "email-sending",
    pending: 124,
    processing: 8,
    failed: 3,
    status: "Running",
  },
  {
    name: "email-retry",
    pending: 18,
    processing: 2,
    failed: 1,
    status: "Running",
  },
  {
    name: "high-priority",
    pending: 6,
    processing: 1,
    failed: 0,
    status: "Running",
  },
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
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Queue Monitor
              </h1>

              <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                System Healthy
              </span>
            </div>

            <p className="mt-1 text-gray-500">
              Monitor email queues, workers and background jobs.
            </p>
          </div>

          <button className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
            Refresh
          </button>
        </div>

        {/* Overview */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Jobs
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              148
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Waiting to be processed
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Processing
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              11
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Currently being processed
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Completed
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              12,842
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Successfully processed
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Failed Jobs
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              4
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Require attention
            </p>
          </div>

        </div>

        {/* Workers */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Workers
              </h2>

              <p className="text-sm text-gray-500">
                Background workers processing your queues.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              4 workers online
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map((worker) => (
              <div
                key={worker}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    Worker-{worker}
                  </p>

                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Processing emails
                </p>

                <div className="mt-4 flex justify-between text-xs">
                  <span className="text-gray-500">
                    Jobs processed
                  </span>

                  <span className="font-medium">
                    {worker * 842}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Queues */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Queues
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current status of your email processing queues.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Queue
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Pending
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Processing
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Failed
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {queues.map((queue) => (
                  <tr
                    key={queue.name}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm text-gray-900">
                        {queue.name}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-medium">
                      {queue.pending}
                    </td>

                    <td className="px-6 py-5 text-blue-600">
                      {queue.processing}
                    </td>

                    <td className="px-6 py-5 text-red-600">
                      {queue.failed}
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        {queue.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <button className="text-sm font-medium text-gray-700 hover:text-black">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-200 p-6">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Jobs
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest email jobs processed by your workers.
              </p>
            </div>

            <button className="text-sm font-medium text-gray-600 hover:text-black">
              View all
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Job ID
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Campaign
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Recipient
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Sender
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5 font-mono text-xs text-gray-500">
                      {job.id}
                    </td>

                    <td className="px-6 py-5 font-medium text-gray-900">
                      {job.campaign}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {job.recipient}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {job.sender}
                    </td>

                    <td className="px-6 py-5">
                      <JobStatus status={job.status} />
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-400">
                      {job.time}
                    </td>
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

type JobStatusType = Job["status"];

const JobStatus = ({ status }: { status: JobStatusType }) => {
  const styles: Record<JobStatusType, string> = {
    Processing: "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Failed: "bg-red-100 text-red-700",
    Completed: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default QueueMonitor;