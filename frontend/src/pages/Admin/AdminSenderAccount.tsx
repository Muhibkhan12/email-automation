// AdminSenderAccounts.tsx
import React, { useState, useMemo, useContext } from "react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import AdminSidebar from "./AdminSidebar";

import {
  AtSign,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Save,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Send,
  Mail,
  Menu as MenuIcon,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Types — match what the API actually returns                            */
/* ---------------------------------------------------------------------- */

type SenderStatus = "Active" | "Warning" | "Disconnected";
type SenderProvider = "Gmail" | "Outlook" | "Custom SMTP";

interface SenderAccount {
  id: number;
  email: string;
  name: string;
  provider: SenderProvider;
  status: SenderStatus;
  dailyLimit: number;
  hourlyLimit: number;
  sentToday: number;
  sentThisHour: number;
}

/* ---------------------------------------------------------------------- */
/* Config                                                                 */
/* ---------------------------------------------------------------------- */

const FILTERS = ["All", "Active", "Warning", "Disconnected"];
const PROVIDER_FILTERS = ["All", "Gmail", "Outlook", "Custom SMTP"];

const statusConfig: Record<
  SenderStatus,
  { bg: string; text: string; icon: React.ElementType }
> = {
  Active: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    icon: ShieldCheck,
  },
  Warning: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    icon: ShieldAlert,
  },
  Disconnected: {
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    icon: ShieldX,
  },
};

const providerColors: Record<
  SenderProvider,
  { bg: string; text: string; icon: string }
> = {
  Gmail: { bg: "bg-rose-500/15", text: "text-rose-400", icon: "G" },
  Outlook: { bg: "bg-blue-500/15", text: "text-blue-400", icon: "O" },
  "Custom SMTP": {
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    icon: "SM",
  },
};

/* ---------------------------------------------------------------------- */
/* Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminSenderAccounts = () => {
const context = useContext(SenderAccContext);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SenderAccount | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<SenderAccount>>({
    email: "",
    name: "",
    provider: "Gmail",
    status: "Active",
    dailyLimit: 500,
    hourlyLimit: 100,
  });

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E1013] text-[#E8E6E1]">
        <p>SenderAccountsContext is missing. Wrap this page in the provider.</p>
      </div>
    );
  }

  // ✅ Correct names from your context
  const {
    senderAcc,
    loading,
    addSenderAccount,
    updateSenderAccount,
    deleteSenderAccount,
    fetchAllSenderAccounts,
  } = context;

  // Safe array no matter what the context holds
  const accounts: SenderAccount[] = Array.isArray(senderAcc) ? senderAcc : [];

  /* ---------------------------- Filtering ---------------------------- */

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.email ?? "").toLowerCase().includes(q) ||
          (a.name ?? "").toLowerCase().includes(q) ||
          (a.provider ?? "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (providerFilter !== "All") {
      result = result.filter((a) => a.provider === providerFilter);
    }

    return result;
  }, [accounts, search, statusFilter, providerFilter]);

  /* ---------------------------- Stats ---------------------------- */

  const activeCount = accounts.filter((a) => a.status === "Active").length;
  const emailsToday = accounts.reduce((sum, a) => sum + (a.sentToday ?? 0), 0);
  const dailyCapacity = accounts.reduce((sum, a) => sum + (a.dailyLimit ?? 0), 0);

  /* ---------------------------- Handlers ---------------------------- */

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({
      email: "",
      name: "",
      provider: "Gmail",
      status: "Active",
      dailyLimit: 500,
      hourlyLimit: 100,
    });
    setShowModal(true);
  };

  const handleEditAccount = (account: SenderAccount) => {
    setEditingAccount(account);
    setFormData({ ...account });
    setShowModal(true);
  };

  const handleDeleteAccount = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sender account?"
    );
    if (!confirmed) return;

    try {
      await deleteSenderAccount(id);
    } catch (error) {
      console.error("Failed to delete sender account:", error);
      alert("Failed to delete sender account.");
    }
  };

  const handleSaveAccount = async () => {
    if (!formData.email || !formData.name) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      if (editingAccount) {
        await updateSenderAccount(editingAccount.id, {
          name: formData.name,
          provider: formData.provider,
          status: formData.status,
          dailyLimit: formData.dailyLimit,
          hourlyLimit: formData.hourlyLimit,
        } as any);
      } else {
        await addSenderAccount({
          email: formData.email,
          name: formData.name,
          provider: formData.provider,
        } as any);
      }

      setShowModal(false);
      setEditingAccount(null);
    } catch (error) {
      console.error("Failed to save sender account:", error);
      alert("Failed to save sender account.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------- Helpers ---------------------------- */

  const getStatusBadge = (status: SenderStatus) => {
    const config = statusConfig[status] ?? statusConfig.Disconnected;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={11} />
        {status}
      </span>
    );
  };

  const getProviderBadge = (provider: SenderProvider) => {
    const config = providerColors[provider] ?? providerColors["Custom SMTP"];
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.icon}
      </span>
    );
  };

  const getUsageWidth = (sent: number, limit: number) => {
    if (!limit || limit <= 0) return 0;
    return Math.min((sent / limit) * 100, 100);
  };

  const usageBarColor = (percent: number) => {
    if (percent >= 90) return "bg-rose-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  /* ---------------------------- Render ---------------------------- */

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: #0E1013; }
        .main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }

        .account-row:hover { background-color: #1B1E24; }
        .modal-overlay { background: rgba(14, 16, 19, 0.8); backdrop-filter: blur(4px); }
        .sidebar-overlay { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-slide { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          sidebar-slide
        `}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#0E1013] h-screen w-full">
        {/* ============ Header ============ */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                  Sender Accounts
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Manage sender accounts across all workspaces.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddAccount}
            className="flex items-center gap-1.5 md:gap-2 rounded-lg bg-[#FF6A39] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white shadow-lg shadow-[#FF6A39]/20 hover:bg-[#e85a2c] transition w-full sm:w-auto justify-center"
          >
            <Plus size={14} />
            <span className="hidden xs:inline">Add Sender Account</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>

        {/* ============ Stats ============ */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          <StatCard
            title="Total Accounts"
            value={String(accounts.length)}
            icon={AtSign}
          />
          <StatCard
            title="Active"
            value={String(activeCount)}
            icon={CheckCircle2}
          />
          <StatCard
            title="Emails Today"
            value={emailsToday.toLocaleString()}
            icon={Send}
          />
          <StatCard
            title="Daily Capacity"
            value={dailyCapacity.toLocaleString()}
            icon={Mail}
          />
        </div>

        {/* ============ Filters ============ */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 flex-1 lg:flex-none">
              <Search size={14} className="text-[#8B8D94] shrink-0" />
              <input
                placeholder="Search sender accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#C7C9CE] w-[120px] md:w-[180px] placeholder:text-[#8B8D94]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {FILTERS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {PROVIDER_FILTERS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchAllSenderAccounts()}
            disabled={loading}
            className="flex items-center gap-1 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2 md:px-3 py-1.5 md:py-2 text-[9px] md:text-xs font-medium text-[#C7C9CE] hover:border-[#3A3F4A] transition disabled:opacity-50"
          >
            <RefreshCw
              size={12}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden xs:inline">
              {loading ? "Loading..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* ============ Table ============ */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="text-[10px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37] bg-[#0E1013]">
                <tr>
                  <th className="px-3 lg:px-5 py-3 font-medium">Account</th>
                  <th className="px-3 py-3 font-medium">Provider</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Daily</th>
                  <th className="px-3 py-3 font-medium">Hourly</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && accounts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-[#8B8D94]"
                    >
                      Loading sender accounts...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredAccounts.map((account) => {
                    const dailyPercent = getUsageWidth(
                      account.sentToday,
                      account.dailyLimit
                    );
                    const hourlyPercent = getUsageWidth(
                      account.sentThisHour,
                      account.hourlyLimit
                    );

                    return (
                      <tr
                        key={account.id}
                        className="account-row transition border-t border-[#2A2E37]"
                      >
                        {/* Account */}
                        <td className="px-3 lg:px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10 text-[#FF6A39] text-sm font-semibold shrink-0">
                              {account.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#E8E6E1] truncate">
                                {account.name || "Unnamed"}
                              </p>
                              <p className="text-[11px] text-[#8B8D94] truncate">
                                {account.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Provider */}
                        <td className="px-3 py-3">
                          {getProviderBadge(account.provider)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          {getStatusBadge(account.status)}
                        </td>

                        {/* Daily */}
                        <td className="px-3 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-[#8B8D94]">
                                {account.sentToday}
                              </span>
                              <span className="text-[#C7C9CE] font-medium">
                                / {account.dailyLimit}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2E37]">
                              <div
                                className={`h-full rounded-full transition-all ${usageBarColor(
                                  dailyPercent
                                )}`}
                                style={{ width: `${dailyPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Hourly */}
                        <td className="px-3 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-[#8B8D94]">
                                {account.sentThisHour}
                              </span>
                              <span className="text-[#C7C9CE] font-medium">
                                / {account.hourlyLimit}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2E37]">
                              <div
                                className={`h-full rounded-full transition-all ${usageBarColor(
                                  hourlyPercent
                                )}`}
                                style={{ width: `${hourlyPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 lg:px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="p-1.5 rounded text-[#8B8D94] hover:text-[#E8E6E1] hover:bg-[#2A2E37] transition"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1.5 rounded text-[#8B8D94] hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2E37] mb-3">
                          <AtSign size={20} className="text-[#8B8D94]" />
                        </div>
                        <p className="text-sm text-[#8B8D94]">
                          No sender accounts found
                        </p>
                        <p className="text-xs text-[#6B727C] mt-1">
                          {accounts.length === 0
                            ? "Add your first sender account to get started."
                            : "Try adjusting your filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 lg:p-5 border-t border-[#2A2E37]">
            <span className="text-xs text-[#8B8D94]">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-2 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                <ChevronLeft size={14} />
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-medium">
                1
              </button>
              <button className="px-2 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ============ Add / Edit Modal ============ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-[#171A21] border border-[#2A2E37] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#2A2E37] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6A39]/10">
                    <AtSign size={18} className="text-[#FF6A39]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#E8E6E1]">
                      {editingAccount ? "Edit Sender Account" : "Add Sender Account"}
                    </h2>
                    <p className="text-sm text-[#8B8D94]">
                      {editingAccount
                        ? "Update the sender account configuration"
                        : "Add a new sender account to the platform"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-[#8B8D94] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="sender@company.com"
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Display Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Marketing"
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Provider
                    </label>
                    <select
                      value={formData.provider || "Gmail"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          provider: e.target.value as SenderProvider,
                        })
                      }
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    >
                      <option value="Gmail">Gmail</option>
                      <option value="Outlook">Outlook</option>
                      <option value="Custom SMTP">Custom SMTP</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Status
                    </label>
                    <select
                      value={formData.status || "Active"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as SenderStatus,
                        })
                      }
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Warning">Warning</option>
                      <option value="Disconnected">Disconnected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={formData.dailyLimit ?? 500}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dailyLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
                      Hourly Limit
                    </label>
                    <input
                      type="number"
                      value={formData.hourlyLimit ?? 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourlyLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-[#2A2E37] bg-[#0E1013] px-4 py-2.5 text-sm text-[#E8E6E1] outline-none focus:border-[#FF6A39] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#2A2E37] p-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#2A2E37] px-4 py-2.5 text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccount}
                  disabled={saving || loading}
                  className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#e85a2c] transition disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving
                    ? "Saving…"
                    : editingAccount
                    ? "Update Account"
                    : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/* Stat Card                                                              */
/* ---------------------------------------------------------------------- */

const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) => (
  <div className="rounded-xl bg-[#171A21] p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all">
    <div className="flex items-start justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10">
        <Icon size={16} className="text-[#FF6A39]" />
      </div>
    </div>
    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
      {value}
    </h2>
    <p className="mt-1 text-sm text-[#C7C9CE]">{title}</p>
  </div>
);

export default AdminSenderAccounts;