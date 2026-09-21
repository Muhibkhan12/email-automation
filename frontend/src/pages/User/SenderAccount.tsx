import { useContext, useEffect, useState } from "react";
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
  Menu,
  Loader2,
} from "lucide-react";

// ⚠️ adjust these paths to wherever your files actually live
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import type {
  SenderAccount,
  CreateSenderAccountInput,
} from "../../types/SenderAccount";
import { getSenderAccount } from "../../services/SenderService";
import { id } from "zod/locales";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type AccountStatus = "Active" | "Warning" | "Disconnected";
type Provider = "Gmail" | "Outlook" | "Custom SMTP";

const providerColors: Record<Provider, string> = {
  Gmail: "bg-rose-500",
  Outlook: "bg-blue-500",
  "Custom SMTP": "bg-slate-700",
};

const pct = (used: number, limit: number) =>
  limit > 0 ? Math.round((used / limit) * 100) : 0;

// Backend might send "active" / "ACTIVE" / "Active" — normalize it
const normalizeStatus = (s?: string): AccountStatus => {
  const v = (s ?? "").toLowerCase();
  if (v === "active") return "Active";
  if (v === "disconnected") return "Disconnected";
  return "Warning";
};

const normalizeProvider = (p?: string): Provider => {
  const v = (p ?? "").toLowerCase();
  if (v === "gmail") return "Gmail";
  if (v === "outlook") return "Outlook";
  return "Custom SMTP";
};

const SenderAccountsPage = () => {
  const ctx = useContext(SenderAccContext);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!ctx) {
    throw new Error(
      "SenderAccountsPage must be used inside a <SenderAccountsContext> provider."
    );
  }
  const { senderAcc: rawAccounts, loading, deleteSenderAccount } = ctx;

  // Safety net: never let a non-array crash the page
  const senderAcc: SenderAccount[] = Array.isArray(rawAccounts) ? rawAccounts : [];

  const query = search.toLowerCase();
  const filteredAccounts = senderAcc.filter(
    (a) =>
      (a.email ?? "").toLowerCase().includes(query) ||
      (a.display_name ?? "").toLowerCase().includes(query)
  );

  const activeCount = senderAcc.filter(
    (a) => normalizeStatus(a.status) === "Active"
  ).length;
  const emailsToday = senderAcc.reduce((sum, a) => sum + (a.emails_sent_today ?? 0), 0);
  const dailyCapacity = senderAcc.reduce((sum, a) => sum + (a.daily_limit ?? 0), 0);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this sender account?")) return;
    try {
      await deleteSenderAccount(id);
    } catch (err) {
      console.error("Failed to delete sender account:", err);
      window.alert("Could not delete the account. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

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

        @keyframes mf-spin-kf {
          to { transform: rotate(360deg); }
        }
        .mf-spin {
          animation: mf-spin-kf 0.8s linear infinite;
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
      <div
        className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main
        className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8"
        style={{ background: "#12151B", height: "100vh", width: "100%" }}
      >
        {/* Header */}
        <div className="mf-header mb-5 md:mb-7 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p
                className="text-[10px] md:text-[11px] lg:text-xs font-medium uppercase tracking-wide"
                style={{ color: "#6B727C" }}
              >
                Email Infrastructure
              </p>
              <h1
                className="mt-1 text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight"
                style={{ color: "#E8E6E1", fontFamily: FONT.display }}
              >
                Sender Accounts
              </h1>
              <p className="mt-0.5 md:mt-1 text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                Manage the accounts used to send your campaigns.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddAccount(true)}
            className="mf-add-btn flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs lg:text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] w-full sm:w-auto"
            style={{
              background: "#FF6A39",
              boxShadow: "0 4px 12px rgba(255,106,57,0.25)",
            }}
          >
            <Plus size={14} />
            <span>Add Sender Account</span>
          </button>
        </div>

        {/* Overview - Responsive Stats */}
        <div className="mf-stats-grid mb-4 md:mb-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
          <StatCard
            title="Total Accounts"
            value={String(senderAcc.length)}
            description="Connected sender accounts"
            icon={Layers}
            accent="text-[#9BA0A8] bg-[#1B1E24]"
            isEmber={true}
          />
          <StatCard
            title="Active"
            value={String(activeCount)}
            description="Ready to send"
            icon={CheckCircle2}
            accent="text-emerald-400 bg-emerald-500/10"
            isEmber={false}
          />
          <StatCard
            title="Emails Today"
            value={emailsToday.toLocaleString()}
            description="Across all senders"
            icon={Mail}
            accent="text-blue-400 bg-blue-500/10"
            isEmber={false}
          />
          <StatCard
            title="Daily Capacity"
            value={dailyCapacity.toLocaleString()}
            description="Configured sending limit"
            icon={Gauge}
            accent="text-violet-400 bg-violet-500/10"
            isEmber={false}
          />
        </div>

        {/* Account List */}
        <div
          className="overflow-hidden rounded-xl border shadow-sm"
          style={{ borderColor: "#2A2E37", background: "#12151B" }}
        >
          <div
            className="flex flex-col gap-3 md:gap-4 border-b px-3 md:px-4 lg:px-6 py-3 md:py-4 lg:py-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "#2A2E37" }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#E8E6E1" }}>
                Your Sender Accounts
              </h2>
              <p className="mt-0.5 md:mt-1 text-[11px] lg:text-xs" style={{ color: "#6B727C" }}>
                Monitor account health and sending capacity.
              </p>
            </div>

            <div className="relative w-full sm:w-56 lg:w-64">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#6B727C" }}
              />
              <input
                type="text"
                placeholder="Search accounts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border py-1.5 lg:py-2 pl-8 pr-3 text-xs lg:text-sm outline-none transition"
                style={{
                  borderColor: "#2A2E37",
                  background: "#0B0E12",
                  color: "#E8E6E1",
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
            {/* Initial loading */}
            {loading && senderAcc.length === 0 && (
              <div
                className="flex items-center justify-center gap-2 p-8 md:p-10 text-xs lg:text-sm"
                style={{ color: "#6B727C" }}
              >
                <Loader2 size={14} className="mf-spin" />
                Loading sender accounts…
              </div>
            )}

            {/* Accounts: shown whenever data exists, even during a refetch */}
            {filteredAccounts.map((account) => (
              <SenderAccountCard
                key={account.id}
                account={account}
                onDelete={() => handleDelete(account.id)}
              />
            ))}

            {/* Empty state */}
            {!loading && senderAcc.length === 0 && (
              <div
                className="p-6 md:p-8 lg:p-10 text-center text-xs lg:text-sm"
                style={{ color: "#6B727C" }}
              >
                No sender accounts yet. Add one to start sending campaigns.
              </div>
            )}

            {/* No search matches */}
            {senderAcc.length > 0 && filteredAccounts.length === 0 && (
              <div
                className="p-6 md:p-8 lg:p-10 text-center text-xs lg:text-sm"
                style={{ color: "#6B727C" }}
              >
                No accounts match "{search}".
              </div>
            )}
          </div>
        </div>

        {/* Sending Rules */}
        <div
          className="mf-settings-grid mt-4 md:mt-5 lg:mt-6 grid grid-cols-1 rounded-xl border p-3 md:p-4 lg:p-6 shadow-sm"
          style={{ borderColor: "#2A2E37", background: "#12151B" }}
        >
          <div className="mb-3 md:mb-4 lg:mb-6">
            <h2 className="text-sm font-semibold" style={{ color: "#E8E6E1" }}>
              Sending Configuration
            </h2>
            <p className="mt-0.5 md:mt-1 text-[11px] lg:text-xs" style={{ color: "#6B727C" }}>
              Configure how your accounts are used during campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:gap-3 lg:gap-5 md:grid-cols-3">
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
  isEmber: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, accent, isEmber }: StatCardProps) => {
  return (
    <div
      className="mf-stat-card rounded-xl border p-3 lg:p-5 shadow-sm transition hover:shadow-md"
      style={{ borderColor: "#2A2E37", background: "#12151B" }}
    >
      <div className="flex items-start justify-between">
        <p className="mf-stat-label text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
          {title}
        </p>
        <span
          className={`flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg ${
            !isEmber ? accent : ""
          }`}
          style={{ background: isEmber ? "rgba(255,106,57,0.12)" : undefined }}
        >
          <Icon size={13} className={isEmber ? "text-[#FF6A39]" : ""} />
        </span>
      </div>
      <h2
        className="mf-stat-value mt-2 lg:mt-3 text-xl lg:text-2xl font-semibold tracking-tight"
        style={{ color: "#E8E6E1", fontFamily: FONT.display }}
      >
        {value}
      </h2>
      <p className="mt-1 text-[11px] lg:text-xs" style={{ color: "#6B727C" }}>
        {description}
      </p>
    </div>
  );
};

/* ========================================================= */
/* Sender Account Card */
/* ========================================================= */

// `campaigns` isn't in your SenderAccount type yet, so we read it safely
type AccountWithCampaigns = SenderAccount & { campaigns?: number };

const SenderAccountCard = ({
  account,
  onDelete,
}: {
  account: AccountWithCampaigns;
  onDelete: () => void;
}) => {
  const provider = normalizeProvider(account.provider);
  const status = normalizeStatus(account.status);

  const sentToday = account.emails_sent_today ?? 0;
  const dailyLimit = account.daily_limit ?? 0;
  const sentThisHour = account.emails_sent_hour ?? 0;
  const hourlyLimit = account.hourly_limit ?? 0;

  const dailyPercentage = pct(sentToday, dailyLimit);
  const hourlyPercentage = pct(sentThisHour, hourlyLimit);
  const disconnected = status === "Disconnected";
  const campaigns = account.campaigns ?? 0;

  return (
    <div
      className={`mf-account-card p-3 md:p-4 lg:p-6 transition hover:bg-[#1B1E24] ${
        disconnected ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-3 md:gap-4 lg:gap-6 xl:flex-row xl:items-center xl:justify-between">
        {/* Account Info */}
        <div className="mf-account-header flex items-center gap-3 lg:gap-4 xl:flex-1 min-w-0">
          <div
            className={`flex h-9 w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-xl text-xs lg:text-sm font-bold text-white ${providerColors[provider]}`}
          >
            {provider === "Custom SMTP" ? "SM" : provider.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 lg:gap-2.5">
              <h3
                className="mf-email-text text-xs lg:text-sm font-semibold truncate"
                style={{ color: "#E8E6E1" }}
              >
                {account.email}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="mf-provider-badge mt-1 text-[11px] lg:text-xs" style={{ color: "#9BA0A8" }}>
              {account.display_name} · {account.provider}
            </p>
            <p className="mt-1 lg:mt-2 text-[11px]" style={{ color: "#6B727C" }}>
              {campaigns} campaign{campaigns !== 1 && "s"} using this account
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="mf-account-limits grid grid-cols-1 gap-3 lg:gap-5 sm:grid-cols-2 xl:w-[380px]">
          <UsageBar
            label="Daily usage"
            current={sentToday}
            limit={dailyLimit}
            percentage={dailyPercentage}
          />
          <UsageBar
            label="Hourly usage"
            current={sentThisHour}
            limit={hourlyLimit}
            percentage={hourlyPercentage}
          />
        </div>

        {/* Actions */}
        <div className="mf-account-actions flex flex-wrap items-center gap-1.5 lg:gap-2 shrink-0">
          {disconnected ? (
            <button
              className="flex items-center gap-1 rounded-lg px-3 lg:px-3.5 py-1.5 lg:py-2 text-[11px] lg:text-xs font-medium text-white hover:opacity-90"
              style={{ background: "#FF6A39" }}
            >
              <Wifi size={11} />
              <span>Reconnect</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-1 rounded-lg border px-3 lg:px-3.5 py-1.5 lg:py-2 text-[11px] lg:text-xs font-medium transition-colors"
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
              <Zap size={11} />
              <span>Test</span>
            </button>
          )}
          <button
            className="flex items-center gap-1 rounded-lg border px-3 lg:px-3.5 py-1.5 lg:py-2 text-[11px] lg:text-xs font-medium transition-colors"
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
            <Settings2 size={11} />
            <span>Manage</span>
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete account"
            className="flex items-center gap-1 rounded-lg border px-3 lg:px-3.5 py-1.5 lg:py-2 text-[11px] lg:text-xs font-medium transition-colors"
            style={{
              borderColor: "rgba(248,113,113,0.3)",
              color: "#F87171",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248,113,113,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Trash2 size={11} />
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
      <div className="mb-1 lg:mb-2 flex items-center justify-between text-[11px] lg:text-xs">
        <span className="mf-usage-label" style={{ color: "#6B727C" }}>
          {label}
        </span>
        <span className="mf-usage-value font-medium" style={{ color: "#C7C9CE" }}>
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
      <p className="mf-usage-percent mt-1 text-right text-[10px] lg:text-[11px]" style={{ color: "#6B727C" }}>
        {percentage}% used
      </p>
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
  const config = statusConfig[status] ?? statusConfig.Warning;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 lg:px-2.5 py-0.5 text-[10px] lg:text-xs font-medium ${config.className}`}
    >
      <Icon size={10} />
      <span>{status}</span>
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
    <div
      className="mf-setting-card rounded-xl border p-3 lg:p-5 transition hover:border-[#3A3E47]"
      style={{ borderColor: "#2A2E37", background: "#0B0E12" }}
    >
      <div className="flex items-start justify-between gap-3 lg:gap-4">
        <div className="flex gap-2 lg:gap-3">
          <span
            className="flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "#1B1E24", color: "#9BA0A8" }}
          >
            <Icon size={13} />
          </span>
          <div>
            <h3 className="text-xs lg:text-sm font-semibold" style={{ color: "#E8E6E1" }}>
              {title}
            </h3>
            <p className="mt-1 lg:mt-1.5 text-[11px] lg:text-xs leading-5" style={{ color: "#6B727C" }}>
              {description}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActive(!active)}
          role="switch"
          aria-checked={active}
          aria-label={title}
          className={`relative h-5 w-9 lg:h-6 lg:w-11 shrink-0 rounded-full transition ${
            active ? "bg-[#FF6A39]" : "bg-[#2A2E37]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 lg:h-5 lg:w-5 rounded-full bg-white shadow transition-all ${
              active ? "left-4 lg:left-[22px]" : "left-0.5"
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
  const ctx = useContext(SenderAccContext);
  const [provider, setProvider] = useState<Provider>("Gmail");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState("500");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!ctx) return;

    // user_id is set by the backend from the logged-in user's token
    const payload: CreateSenderAccountInput = {
      display_name: name.trim(),
      email: email.trim(),
      provider,
      daily_limit: Number(dailyLimit) || 0,
      hourly_limit: Number(hourlyLimit) || 0,
    };

    try {
      setSaving(true);
      setError(null);
      await ctx.addSenderAccount(payload);
      onClose();
    } catch (err) {
      console.error("Failed to add sender account:", err);
      setError("Could not connect this account. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm outline-none transition";
  const focusOn = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "#FF6A39";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
  };
  const focusOff = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "#2A2E37";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E12]/80 p-3 md:p-4 backdrop-blur-sm">
      <div
        className="mf-modal w-full max-w-lg rounded-2xl shadow-2xl"
        style={{ background: "#12151B", border: "1px solid #2A2E37" }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-4 lg:px-6 py-4 lg:py-6"
          style={{ borderColor: "#2A2E37" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
              style={{ background: "#1B1E24", color: "#9BA0A8" }}
            >
              <Mail size={14} />
            </span>
            <div>
              <h2 className="text-sm md:text-base font-semibold" style={{ color: "#E8E6E1" }}>
                Add Sender Account
              </h2>
              <p className="text-[11px] md:text-xs" style={{ color: "#6B727C" }}>
                Connect an account for sending campaigns.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
            style={{ color: "#6B727C" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="mf-modal-body space-y-4 lg:space-y-5 p-4 lg:p-6">
          <div>
            <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="marketing@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={{ borderColor: "#2A2E37", background: "#0B0E12", color: "#E8E6E1" }}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </div>

          <div>
            <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
              Display Name
            </label>
            <input
              type="text"
              placeholder="Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              style={{ borderColor: "#2A2E37", background: "#0B0E12", color: "#E8E6E1" }}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </div>

          <div>
            <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className={inputClass}
              style={{ borderColor: "#2A2E37", background: "#0B0E12", color: "#E8E6E1" }}
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

          <div
            className="mf-limit-fields grid grid-cols-2 gap-3 lg:gap-4 rounded-lg p-3 lg:p-4"
            style={{ background: "#0B0E12" }}
          >
            <div>
              <label className="mb-1 lg:mb-2 block text-[11px] lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
                Daily Limit
              </label>
              <input
                type="number"
                min={0}
                placeholder="500"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#2A2E37", background: "#12151B", color: "#E8E6E1" }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>
            <div>
              <label className="mb-1 lg:mb-2 block text-[11px] lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
                Hourly Limit
              </label>
              <input
                type="number"
                min={0}
                placeholder="50"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#2A2E37", background: "#12151B", color: "#E8E6E1" }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#F87171" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="mf-modal-footer flex flex-col sm:flex-row justify-end gap-2 lg:gap-3 border-t px-4 lg:px-6 py-4 lg:py-6"
          style={{ borderColor: "#2A2E37" }}
        >
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 md:py-2.5 text-xs lg:text-sm font-medium transition-colors"
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
            onClick={handleSubmit}
            disabled={saving || !email || !name}
            className="rounded-lg px-5 py-2 md:py-2.5 text-xs lg:text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: "#FF6A39",
              boxShadow: "0 4px 12px rgba(255,106,57,0.25)",
            }}
          >
            {saving ? "Connecting…" : "Connect Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderAccountsPage;