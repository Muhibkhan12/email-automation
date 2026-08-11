import React from "react";
import Sidebar from "./Sidebar";

interface StatCard {
  title: string;
  value: string;
  change: string;
  description: string;
}

interface Campaign {
  name: string;
  recipients: number;
  openRate: string;
}

interface Sender {
  email: string;
  sent: number;
  status: "Excellent" | "Good" | "Average";
}

const stats: StatCard[] = [
  {
    title: "Emails Sent",
    value: "48,250",
    change: "+12.5%",
    description: "Compared to previous period",
  },
  {
    title: "Delivery Rate",
    value: "98.4%",
    change: "+1.2%",
    description: "Successfully delivered",
  },
  {
    title: "Open Rate",
    value: "42.7%",
    change: "+4.6%",
    description: "Recipients who opened emails",
  },
  {
    title: "Click Rate",
    value: "8.9%",
    change: "+2.1%",
    description: "Recipients who clicked a link",
  },
];

const campaigns: Campaign[] = [
  {
    name: "Summer Promotion",
    recipients: 2450,
    openRate: "56.4%",
  },
  {
    name: "Product Launch",
    recipients: 5200,
    openRate: "51.2%",
  },
  {
    name: "August Newsletter",
    recipients: 1800,
    openRate: "47.8%",
  },
];

const senders: Sender[] = [
  {
    email: "marketing@company.com",
    sent: 18420,
    status: "Excellent",
  },
  {
    email: "sales@company.com",
    sent: 15830,
    status: "Good",
  },
  {
    email: "hello@company.com",
    sent: 13920,
    status: "Average",
  },
];

const Analytics = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics
            </h1>

            <p className="mt-1 text-gray-500">
              Track your email performance and campaign engagement.
            </p>
          </div>

          <select className="rounded-lg border border-gray-300 bg-white px-4 py-2.5">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {stat.title}
              </p>

              <div className="mt-3 flex items-end justify-between">
                <h2 className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </h2>

                <span className="text-sm font-medium text-green-600">
                  {stat.change}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Main Analytics */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Activity */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Email Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Emails sent and opened over time.
            </p>

            {/* Chart placeholder */}
            <div className="mt-8 flex h-64 items-end gap-4 border-b border-gray-200">
              {[35, 48, 65, 52, 78, 90, 72].map((height, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t-lg bg-gray-900"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
              <span>● Sent</span>
              <span>● Opened</span>
            </div>
          </div>

          {/* Engagement */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Engagement
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Overall recipient engagement.
            </p>

            <div className="mt-8 space-y-6">

              <Metric
                label="Open Rate"
                value="42.7%"
                width="43%"
              />

              <Metric
                label="Click Rate"
                value="8.9%"
                width="9%"
              />

              <Metric
                label="Bounce Rate"
                value="1.6%"
                width="2%"
              />

              <Metric
                label="Unsubscribe Rate"
                value="0.4%"
                width="1%"
              />

            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Campaigns */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">
                Top Campaigns
              </h2>

              <p className="text-sm text-gray-500">
                Campaigns with the highest engagement.
              </p>
            </div>

            <div>
              {campaigns.map((campaign) => (
                <div
                  key={campaign.name}
                  className="flex items-center justify-between border-b p-5 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {campaign.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {campaign.recipients.toLocaleString()} recipients
                    </p>
                  </div>

                  <span className="font-semibold">
                    {campaign.openRate}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Senders */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">
                Sender Performance
              </h2>

              <p className="text-sm text-gray-500">
                Performance of your sender accounts.
              </p>
            </div>

            <div>
              {senders.map((sender) => (
                <div
                  key={sender.email}
                  className="flex items-center justify-between border-b p-5 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {sender.email}
                    </p>

                    <p className="text-sm text-gray-500">
                      {sender.sent.toLocaleString()} emails sent
                    </p>
                  </div>

                  <StatusBadge status={sender.status} />
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  width: string;
}

const Metric = ({ label, value, width }: MetricProps) => {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <span className="text-sm text-gray-600">
          {label}
        </span>

        <span className="text-sm font-medium">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-gray-900"
          style={{ width }}
        />
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: Sender["status"];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<Sender["status"], string> = {
    Excellent: "bg-green-100 text-green-700",
    Good: "bg-blue-100 text-blue-700",
    Average: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default Analytics;