import { useState } from "react";
import Sidebar from "./Sidebar";

type AccountStatus = "Active" | "Warning" | "Disconnected";

interface SenderAccount {
  id: number;
  email: string;
  name: string;
  provider: string;
  status: AccountStatus;
  dailyLimit: number;
  sentToday: number;
  hourlyLimit: number;
  sentThisHour: number;
  campaigns: number;
}

const senderAccounts: SenderAccount[] = [
  {
    id: 1,
    email: "marketing@company.com",
    name: "Marketing",
    provider: "Gmail",
    status: "Active",
    dailyLimit: 500,
    sentToday: 342,
    hourlyLimit: 100,
    sentThisHour: 64,
    campaigns: 12,
  },
  {
    id: 2,
    email: "sales@company.com",
    name: "Sales",
    provider: "Outlook",
    status: "Active",
    dailyLimit: 500,
    sentToday: 286,
    hourlyLimit: 100,
    sentThisHour: 72,
    campaigns: 8,
  },
  {
    id: 3,
    email: "hello@company.com",
    name: "General",
    provider: "Custom SMTP",
    status: "Warning",
    dailyLimit: 300,
    sentToday: 274,
    hourlyLimit: 60,
    sentThisHour: 57,
    campaigns: 5,
  },
  {
    id: 4,
    email: "support@company.com",
    name: "Support",
    provider: "Gmail",
    status: "Disconnected",
    dailyLimit: 500,
    sentToday: 0,
    hourlyLimit: 100,
    sentThisHour: 0,
    campaigns: 0,
  },
];

const SenderAccount = () => {
  const [showAddAccount, setShowAddAccount] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-medium text-gray-500">
              Email Infrastructure
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Sender Accounts
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the accounts used to send your campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowAddAccount(true)}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Add Sender Account
          </button>

        </div>


        {/* Overview */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Accounts"
            value="4"
            description="Connected sender accounts"
          />

          <StatCard
            title="Active"
            value="2"
            description="Ready to send"
            valueClass="text-green-600"
          />

          <StatCard
            title="Emails Today"
            value="902"
            description="Across all senders"
          />

          <StatCard
            title="Daily Capacity"
            value="1,800"
            description="Configured sending limit"
          />

        </div>


        {/* Account List */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Sender Accounts
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Monitor account health and sending capacity.
              </p>
            </div>

            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
              Refresh
            </button>

          </div>


          <div className="divide-y divide-gray-100">

            {senderAccounts.map((account) => (
              <SenderAccountCard
                key={account.id}
                account={account}
              />
            ))}

          </div>

        </div>


        {/* Sending Rules */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Sending Configuration
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure how your accounts are used during campaigns.
            </p>
          </div>


          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            <SettingCard
              title="Account Rotation"
              description="Automatically rotate between active sender accounts."
              enabled
            />

            <SettingCard
              title="Rate Limiting"
              description="Respect hourly and daily limits for each account."
              enabled
            />

            <SettingCard
              title="Automatic Retry"
              description="Retry failed email jobs using another sender."
              enabled
            />

          </div>

        </div>


        {/* Add Account Modal */}
        {showAddAccount && (
          <AddAccountModal
            onClose={() => setShowAddAccount(false)}
          />
        )}

      </main>
    </div>
  );
};


/* ========================================================= */
/* Stat Card */
/* ========================================================= */

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


/* ========================================================= */
/* Sender Account Card */
/* ========================================================= */

const SenderAccountCard = ({
  account,
}: {
  account: SenderAccount;
}) => {
  const dailyPercentage =
    Math.round((account.sentToday / account.dailyLimit) * 100);

  const hourlyPercentage =
    Math.round((account.sentThisHour / account.hourlyLimit) * 100);

  return (
    <div className="p-6 transition hover:bg-gray-50">

      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

        {/* Account Info */}
        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
            {account.provider.charAt(0)}
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="font-semibold text-gray-900">
                {account.email}
              </h3>

              <StatusBadge status={account.status} />

            </div>

            <p className="mt-1 text-sm text-gray-500">
              {account.name} · {account.provider}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              {account.campaigns} campaigns using this account
            </p>

          </div>

        </div>


        {/* Limits */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:w-[430px]">

          <UsageBar
            label="Daily usage"
            current={account.sentToday}
            limit={account.dailyLimit}
            percentage={dailyPercentage}
          />

          <UsageBar
            label="Hourly usage"
            current={account.sentThisHour}
            limit={account.hourlyLimit}
            percentage={hourlyPercentage}
          />

        </div>


        {/* Actions */}
        <div className="flex items-center gap-2">

          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
            Test
          </button>

          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
            Manage
          </button>

          <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
            Remove
          </button>

        </div>

      </div>

    </div>
  );
};


/* ========================================================= */
/* Usage Bar */
/* ========================================================= */

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
  percentage: number;
}

const UsageBar = ({
  label,
  current,
  limit,
  percentage,
}: UsageBarProps) => {

  const barWidth = Math.min(percentage, 100);

  return (
    <div>

      <div className="mb-2 flex items-center justify-between text-xs">

        <span className="text-gray-500">
          {label}
        </span>

        <span className="font-medium text-gray-700">
          {current} / {limit}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className={`h-full rounded-full transition ${
            percentage >= 90
              ? "bg-red-500"
              : percentage >= 70
              ? "bg-yellow-500"
              : "bg-gray-900"
          }`}
          style={{ width: `${barWidth}%` }}
        />

      </div>

      <p className="mt-1 text-right text-[11px] text-gray-400">
        {percentage}% used
      </p>

    </div>
  );
};


/* ========================================================= */
/* Status Badge */
/* ========================================================= */

const StatusBadge = ({
  status,
}: {
  status: AccountStatus;
}) => {

  const styles: Record<AccountStatus, string> = {
    Active: "bg-green-100 text-green-700",
    Warning: "bg-yellow-100 text-yellow-700",
    Disconnected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};


/* ========================================================= */
/* Setting Card */
/* ========================================================= */

interface SettingCardProps {
  title: string;
  description: string;
  enabled: boolean;
}

const SettingCard = ({
  title,
  description,
  enabled,
}: SettingCardProps) => {

  const [active, setActive] = useState(enabled);

  return (
    <div className="rounded-xl border border-gray-200 p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="text-sm font-semibold text-gray-900">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            {description}
          </p>

        </div>

        <button
          onClick={() => setActive(!active)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            active ? "bg-gray-900" : "bg-gray-300"
          }`}
        >

          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
              active ? "left-6" : "left-1"
            }`}
          />

        </button>

      </div>

    </div>
  );
};


/* ========================================================= */
/* Add Account Modal */
/* ========================================================= */

const AddAccountModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add Sender Account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Connect an account for sending campaigns.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>

        </div>


        {/* Form */}
        <div className="space-y-5 p-6">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              placeholder="marketing@company.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Display Name
            </label>

            <input
              type="text"
              placeholder="Marketing"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Provider
            </label>

            <select className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900">
              <option>Gmail</option>
              <option>Outlook</option>
              <option>Custom SMTP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                SMTP Host
              </label>

              <input
                type="text"
                placeholder="smtp.gmail.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                SMTP Port
              </label>

              <input
                type="number"
                placeholder="587"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

          </div>

        </div>


        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 p-6">

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
            Connect Account
          </button>

        </div>

      </div>

    </div>
  );
};

export default SenderAccount;