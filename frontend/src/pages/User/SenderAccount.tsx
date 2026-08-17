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

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar />

      <main className="flex-1 p-6 md:p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B727C]">
              Email Infrastructure
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#E8E6E1]">
              Sender Accounts
            </h1>
            <p className="mt-1 text-sm text-[#9BA0A8]">
              Manage the accounts used to send your campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ 
              background: "#FF6A39",
              boxShadow: "0 4px 12px rgba(255,106,57,0.25)"
            }}
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
            accent="text-[#9BA0A8] bg-[#1B1E24]"
          />
          <StatCard
            title="Active"
            value={String(activeCount)}
            description="Ready to send"
            icon={CheckCircle2}
            accent="text-emerald-400 bg-emerald-500/10"
          />
          <StatCard
            title="Emails Today"
            value="902"
            description="Across all senders"
            icon={Mail}
            accent="text-blue-400 bg-blue-500/10"
          />
          <StatCard
            title="Daily Capacity"
            value="1,800"
            description="Configured sending limit"
            icon={Gauge}
            accent="text-violet-400 bg-violet-500/10"
          />
        </div>

        {/* Account List */}
        <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#2A2E37" }}>
            <div>
              <h2 className="text-sm font-semibold text-[#E8E6E1]">Your Sender Accounts</h2>
              <p className="mt-1 text-xs text-[#6B727C]">
                Monitor account health and sending capacity.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B727C]"
              />
              <input
                type="text"
                placeholder="Search accounts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none transition"
                style={{ 
                  borderColor: "#2A2E37", 
                  background: "#0B0E12", 
                  color: "#E8E6E1"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FF6A39";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2A2E37";
                }}
              />
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "#2A2E37" }}>
            {filteredAccounts.map((account) => (
              <SenderAccountCard key={account.id} account={account} />
            ))}

            {filteredAccounts.length === 0 && (
              <div className="p-10 text-center text-sm text-[#6B727C]">
                No accounts match "{search}".
              </div>
            )}
          </div>
        </div>

        {/* Sending Rules */}
        <div className="mt-6 rounded-xl border p-6 shadow-sm" style={{ borderColor: "#2A2E37", background: "#12151B" }}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#E8E6E1]">Sending Configuration</h2>
            <p className="mt-1 text-xs text-[#6B727C]">
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
  const isEmber = title === "Total Accounts";
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

/* ========================================================= */
/* Sender Account Card */
/* ========================================================= */

const SenderAccountCard = ({ account }: { account: SenderAccount }) => {
  const dailyPercentage = Math.round((account.sentToday / account.dailyLimit) * 100);
  const hourlyPercentage = Math.round((account.sentThisHour / account.hourlyLimit) * 100);
  const disconnected = account.status === "Disconnected";

  return (
    <div className={`p-6 transition hover:bg-[#1B1E24] ${disconnected ? "opacity-70" : ""}`}>
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
              <h3 className="text-sm font-semibold text-[#E8E6E1]">{account.email}</h3>
              <StatusBadge status={account.status} />
            </div>
            <p className="mt-1 text-xs text-[#9BA0A8]">
              {account.name} · {account.provider}
            </p>
            <p className="mt-2 text-[11px] text-[#6B727C]">
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
            <button className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white hover:opacity-90" style={{ background: "#FF6A39" }}>
              <Wifi size={12} /> Reconnect
            </button>
          ) : (
            <button 
              className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors"
              style={{ borderColor: "#2A2E37", color: "#C7C9CE", background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1B1E24";
                e.currentTarget.style.color = "#E8E6E1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#C7C9CE";
              }}
            >
              <Zap size={12} /> Test
            </button>
          )}
          <button 
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors"
            style={{ borderColor: "#2A2E37", color: "#C7C9CE", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1B1E24";
              e.currentTarget.style.color = "#E8E6E1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#C7C9CE";
            }}
          >
            <Settings2 size={12} /> Manage
          </button>
          <button 
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors"
            style={{ borderColor: "rgba(248,113,113,0.3)", color: "#F87171", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248,113,113,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
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
        <span className="text-[#6B727C]">{label}</span>
        <span className="font-medium text-[#C7C9CE]">
          {current} / {limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "#2A2E37" }}>
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 90 ? "bg-rose-500" : percentage >= 70 ? "bg-amber-500" : "bg-[#FF6A39]"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[11px] text-[#6B727C]">{percentage}% used</p>
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
  Active: { className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  Warning: { className: "bg-amber-500/10 text-amber-400", icon: AlertTriangle },
  Disconnected: { className: "bg-rose-500/10 text-rose-400", icon: XCircle },
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
    <div className="rounded-xl border p-5 transition hover:border-[#3A3E47]" style={{ borderColor: "#2A2E37", background: "#0B0E12" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#1B1E24", color: "#9BA0A8" }}>
            <Icon size={15} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E6E1]">{title}</h3>
            <p className="mt-1.5 text-xs leading-5 text-[#6B727C]">{description}</p>
          </div>
        </div>

        <button
          onClick={() => setActive(!active)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            active ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E12]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: "#12151B", border: "1px solid #2A2E37" }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-6" style={{ borderColor: "#2A2E37" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "#1B1E24", color: "#9BA0A8" }}>
              <Mail size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#E8E6E1]">Add Sender Account</h2>
              <p className="text-xs text-[#6B727C]">Connect an account for sending campaigns.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#6B727C] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Email Address</label>
            <input
              type="email"
              placeholder="marketing@company.com"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition"
              style={{ 
                borderColor: "#2A2E37", 
                background: "#0B0E12", 
                color: "#E8E6E1"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FF6A39";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2A2E37";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Display Name</label>
            <input
              type="text"
              placeholder="Marketing"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition"
              style={{ 
                borderColor: "#2A2E37", 
                background: "#0B0E12", 
                color: "#E8E6E1"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FF6A39";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2A2E37";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition"
              style={{ 
                borderColor: "#2A2E37", 
                background: "#0B0E12", 
                color: "#E8E6E1"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FF6A39";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2A2E37";
              }}
            >
              <option>Gmail</option>
              <option>Outlook</option>
              <option>Custom SMTP</option>
            </select>
          </div>

          {provider === "Custom SMTP" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg p-4" style={{ background: "#0B0E12" }}>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.company.com"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition"
                  style={{ 
                    borderColor: "#2A2E37", 
                    background: "#12151B", 
                    color: "#E8E6E1"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FF6A39";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#2A2E37";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition"
                  style={{ 
                    borderColor: "#2A2E37", 
                    background: "#12151B", 
                    color: "#E8E6E1"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FF6A39";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#2A2E37";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-6" style={{ borderColor: "#2A2E37" }}>
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: "#2A2E37", color: "#C7C9CE", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1B1E24";
              e.currentTarget.style.color = "#E8E6E1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#C7C9CE";
            }}
          >
            Cancel
          </button>
          <button 
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ 
              background: "#FF6A39",
              boxShadow: "0 4px 12px rgba(255,106,57,0.25)"
            }}
          >
            Connect Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderAccountsPage;