import { useState } from "react";
import Sidebar from "./Sidebar";

type EmailStatus = "Sent" | "Delivered" | "Failed" | "Bounced";

interface EmailLog {
  id: string;
  recipient: string;
  sender: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
}

const emailLogs: EmailLog[] = [
  {
    id: "LOG-10241",
    recipient: "john@example.com",
    sender: "marketing@company.com",
    campaign: "Summer Promotion",
    subject: "Summer Sale — 30% Off",
    status: "Delivered",
    sentAt: "Today, 04:32 PM",
  },
  {
    id: "LOG-10240",
    recipient: "sarah@example.com",
    sender: "sales@company.com",
    campaign: "Product Launch",
    subject: "Introducing Our New Product",
    status: "Sent",
    sentAt: "Today, 04:29 PM",
  },
  {
    id: "LOG-10239",
    recipient: "alex@example.com",
    sender: "hello@company.com",
    campaign: "August Newsletter",
    subject: "What's New This Month?",
    status: "Delivered",
    sentAt: "Today, 04:21 PM",
  },
  {
    id: "LOG-10238",
    recipient: "mike@example.com",
    sender: "marketing@company.com",
    campaign: "Summer Promotion",
    subject: "Summer Sale — 30% Off",
    status: "Failed",
    sentAt: "Today, 04:18 PM",
  },
  {
    id: "LOG-10237",
    recipient: "emma@example.com",
    sender: "sales@company.com",
    campaign: "Product Launch",
    subject: "Introducing Our New Product",
    status: "Bounced",
    sentAt: "Today, 04:15 PM",
  },
];

const EmailLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      log.recipient.toLowerCase().includes(search.toLowerCase()) ||
      log.sender.toLowerCase().includes(search.toLowerCase()) ||
      log.campaign.toLowerCase().includes(search.toLowerCase()) ||
      log.subject.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track every email sent through your campaigns.
            </p>
          </div>

          <button className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
            Export Logs
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Emails"
            value="48,250"
            description="All email attempts"
          />

          <StatCard
            title="Delivered"
            value="47,480"
            description="98.4% delivery rate"
            valueClass="text-green-600"
          />

          <StatCard
            title="Failed"
            value="520"
            description="1.1% failure rate"
            valueClass="text-red-600"
          />

          <StatCard
            title="Bounced"
            value="250"
            description="0.5% bounce rate"
            valueClass="text-orange-500"
          />

        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row">

            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search recipient, sender, campaign..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Sent">Sent</option>
              <option value="Delivered">Delivered</option>
              <option value="Failed">Failed</option>
              <option value="Bounced">Bounced</option>
            </select>

            {/* Date */}
            <select className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none">
              <option>All time</option>
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>

          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

            <div>
              <h2 className="font-semibold text-gray-900">
                Email Activity
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {filteredLogs.length} logs displayed
              </p>
            </div>

            <button className="text-sm font-medium text-gray-600 hover:text-black">
              Refresh
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-wide text-gray-500">

                  <th className="px-6 py-4 font-medium">
                    Recipient
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Campaign
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Subject
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Sender
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Sent At
                  </th>

                  <th className="px-6 py-4">
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition hover:bg-gray-50"
                  >

                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.recipient}
                        </p>

                        <p className="mt-1 font-mono text-[10px] text-gray-400">
                          {log.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-700">
                        {log.campaign}
                      </span>
                    </td>

                    <td className="max-w-xs px-6 py-5">
                      <p className="truncate text-sm text-gray-600">
                        {log.subject}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-600">
                        {log.sender}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {log.sentAt}
                    </td>

                    <td className="px-6 py-5">
                      <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
                        View
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <div className="px-6 py-16 text-center">
              <h3 className="font-medium text-gray-900">
                No emails found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">

            <p className="text-sm text-gray-500">
              Showing 1–5 of 48,250
            </p>

            <div className="flex gap-2">

              <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
                Previous
              </button>

              <button className="rounded-lg border border-gray-200 bg-gray-900 px-3 py-2 text-sm text-white">
                1
              </button>

              <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                2
              </button>

              <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Next
              </button>

            </div>

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
  valueClass?: string;
}

const StatCard = ({
  title,
  value,
  description,
  valueClass = "text-gray-900",
}: StatCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className={`mt-2 text-3xl font-bold ${valueClass}`}>
        {value}
      </h2>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
};


/* ========================= */
/* Status Badge */
/* ========================= */

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const styles: Record<EmailStatus, string> = {
    Sent: "bg-blue-100 text-blue-700",
    Delivered: "bg-green-100 text-green-700",
    Failed: "bg-red-100 text-red-700",
    Bounced: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default EmailLogs;