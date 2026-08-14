import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gauge,
  Layers,
  Plus,
  X,
  Search,
  Zap,
  Settings2,
  Trash2,
  Shuffle,
  Timer,
  RotateCcw,
  Wifi,
} from "lucide-react";

type AccountStatus = "Active" | "Warning" | "Disconnected";
type Provider = "Gmail" | "Outlook" | "Custom SMTP";

interface SenderAccount {
  id: number;
  email: string;
  name: string;
  provider: Provider;
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

const providerColors: Record<Provider, string> = {
  Gmail: "bg-rose-500",
  Outlook: "bg-blue-500",
  "Custom SMTP": "bg-slate-700",
};

const SenderAccountsPage = () => {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAccounts = senderAccounts.filter(
    (a) =>
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = senderAccounts.filter((a) => a.status === "Active").length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email Infrastructure
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Sender Accounts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the accounts used to send your campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={15} />
            Add Sender Account
          </button>
        </div>

        {/* Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value={String(senderAccounts.length)}
            description="Connected sender accounts"
            icon={Layers}
            accent="text-slate-900 bg-slate-100"
          />
          <StatCard
            title="Active"
            value={String(activeCount)}
            description="Ready to send"
            icon={CheckCircle2}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Emails Today"
            value="902"
            description="Across all senders"
            icon={Mail}
            accent="text-blue-600 bg-blue-50"
          />
          <StatCard
            title="Daily Capacity"
            value="1,800"
            description="Configured sending limit"
            icon={Gauge}
            accent="text-violet-600 bg-violet-50"
          />
        </div>

        {/* Account List */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Your Sender Accounts</h2>
              <p className="mt-1 text-xs text-slate-500">
                Monitor account health and sending capacity.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search accounts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredAccounts.map((account) => (
              <SenderAccountCard key={account.id} account={account} />
            ))}

            {filteredAccounts.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">
                No accounts match "{search}".
              </div>
            )}
          </div>
        </div>

        {/* Sending Rules */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900">Sending Configuration</h2>
            <p className="mt-1 text-xs text-slate-500">
              Configure how your accounts are used during campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SettingCard
              icon={Shuffle}
              title="Account Rotation"
              description="Automatically rotate between active sender accounts."
              enabled
            />
            <SettingCard
              icon={Timer}
              title="Rate Limiting"
              description="Respect hourly and daily limits for each account."
              enabled
            />
            <SettingCard
              icon={RotateCcw}
              title="Automatic Retry"
              description="Retry failed email jobs using another sender."
              enabled
            />
          </div>
        </div>

        {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} />}
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

const StatCard = ({ title, value, description, icon: Icon, accent }: StatCardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</h2>
      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
    </div>
  );
};

/* ========================================================= */
/* Sender Account Card */
/* ========================================================= */

const SenderAccountCard = ({ account }: { account: SenderAccount }) => {
  const dailyPercentage = Math.round((account.sentToday / account.dailyLimit) * 100);
  const hourlyPercentage = Math.round((account.sentThisHour / account.hourlyLimit) * 100);
  const disconnected = account.status === "Disconnected";

  return (
    <div className={`p-6 transition hover:bg-slate-50/80 ${disconnected ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        {/* Account Info */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${providerColors[account.provider]}`}
          >
            {account.provider === "Custom SMTP" ? "SM" : account.provider.charAt(0)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold text-slate-900">{account.email}</h3>
              <StatusBadge status={account.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {account.name} · {account.provider}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              {account.campaigns} campaign{account.campaigns !== 1 && "s"} using this account
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:w-[420px]">
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
        <div className="flex items-center gap-2 shrink-0">
          {disconnected ? (
            <button className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800">
              <Wifi size={12} /> Reconnect
            </button>
          ) : (
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
              <Zap size={12} /> Test
            </button>
          )}
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
            <Settings2 size={12} /> Manage
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
            <Trash2 size={12} />
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

const UsageBar = ({ label, current, limit, percentage }: UsageBarProps) => {
  const barWidth = Math.min(percentage, 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">
          {current} / {limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 90 ? "bg-rose-500" : percentage >= 70 ? "bg-amber-500" : "bg-slate-900"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[11px] text-slate-400">{percentage}% used</p>
    </div>
  );
};

/* ========================================================= */
/* Status Badge */
/* ========================================================= */

const statusConfig: Record<
  AccountStatus,
  { className: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Active: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  Warning: { className: "bg-amber-50 text-amber-700", icon: AlertTriangle },
  Disconnected: { className: "bg-rose-50 text-rose-700", icon: XCircle },
};

const StatusBadge = ({ status }: { status: AccountStatus }) => {
  const { className, icon: Icon } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon size={11} />
      {status}
    </span>
  );
};

/* ========================================================= */
/* Setting Card */
/* ========================================================= */

interface SettingCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  enabled: boolean;
}

const SettingCard = ({ icon: Icon, title, description, enabled }: SettingCardProps) => {
  const [active, setActive] = useState(enabled);

  return (
    <div className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={15} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>
          </div>
        </div>

        <button
          onClick={() => setActive(!active)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            active ? "bg-slate-900" : "bg-slate-300"
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

const AddAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [provider, setProvider] = useState<Provider>("Gmail");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Mail size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Add Sender Account</h2>
              <p className="text-xs text-slate-500">Connect an account for sending campaigns.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="marketing@company.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Display Name</label>
            <input
              type="text"
              placeholder="Marketing"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option>Gmail</option>
              <option>Outlook</option>
              <option>Custom SMTP</option>
            </select>
          </div>

          {provider === "Custom SMTP" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.company.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            Connect Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderAccountsPage;