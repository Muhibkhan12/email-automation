// AdminSenderAccounts.tsx
import React, { useState, useMemo, useContext } from "react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import AdminSidebar from "./AdminSidebar";
import {
  AtSign, Plus, Search, Edit, Trash2, RefreshCw, CheckCircle2,
  Save, ShieldCheck, ShieldAlert, ShieldX, ChevronLeft, ChevronRight,
  X, Menu, Send, Mail, SlidersHorizontal, AlertTriangle, Loader2,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

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

/* ─────────────────────────── Tokens ─────────────────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  violet: "#A78BFA",
  violetSoft: "rgba(167,139,250,0.10)",
  violetRing: "rgba(167,139,250,0.22)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  rowHover: "#11151E",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

const FILTERS = ["All", "Active", "Warning", "Disconnected"] as const;
const PROVIDER_FILTERS = ["All", "Gmail", "Outlook", "Custom SMTP"] as const;

const STATUS_META: Record<SenderStatus, { fg: string; bg: string; ring: string; icon: React.ElementType; label: string }> = {
  Active:       { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: ShieldCheck, label: "Active" },
  Warning:      { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: ShieldAlert, label: "Warning" },
  Disconnected: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: ShieldX,     label: "Disconnected" },
};

const PROVIDER_META: Record<SenderProvider, { fg: string; bg: string; ring: string; short: string }> = {
  Gmail:         { fg: C.danger, bg: C.dangerSoft, ring: C.dangerRing, short: "G" },
  Outlook:       { fg: C.blue,   bg: C.blueSoft,   ring: C.blueRing,   short: "O" },
  "Custom SMTP": { fg: C.violet, bg: C.violetSoft, ring: C.violetRing, short: "SM" },
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const Avatar: React.FC<{ name?: string; size?: number }> = ({ name, size = 36 }) => {
  const initial = (name || "?").trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="shrink-0 rounded-xl flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size, height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${C.primary}, ${C.primary}88)`,
        boxShadow: `0 8px 20px -10px ${C.primary}80, inset 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  accentRing: string;
}> = ({ title, value, icon: Icon, accent, accentSoft, accentRing }) => (
  <Card className="p-4 md:p-5">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accentRing}` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: C.dark }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{title}</p>
  </Card>
);

const StatusPill: React.FC<{ status: SenderStatus }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.Disconnected;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
};

const ProviderBadge: React.FC<{ provider: SenderProvider }> = ({ provider }) => {
  const meta = PROVIDER_META[provider] ?? PROVIDER_META["Custom SMTP"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}`, fontFamily: FONT.mono }}
    >
      <span
        className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold"
        style={{ background: meta.fg, color: "#0B0E13" }}
      >
        {meta.short}
      </span>
      {provider}
    </span>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

const AdminSenderAccounts = () => {
  const context = useContext(SenderAccContext);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SenderAccount | null>(null);
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: C.bg, color: C.dark, fontFamily: FONT.body }}>
        <p>SenderAccountsContext is missing. Wrap this page in the provider.</p>
      </div>
    );
  }

  const {
    senderAcc,
    loading,
    addSenderAccount,
    updateSenderAccount,
    deleteSenderAccount,
    fetchAllSenderAccounts,
  } = context;

  const accounts: SenderAccount[] = Array.isArray(senderAcc) ? senderAcc : [];

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
    if (statusFilter !== "All") result = result.filter((a) => a.status === statusFilter);
    if (providerFilter !== "All") result = result.filter((a) => a.provider === providerFilter);

    return result;
  }, [accounts, search, statusFilter, providerFilter]);

  const activeCount = accounts.filter((a) => a.status === "Active").length;
  const emailsToday = accounts.reduce((sum, a) => sum + (a.sentToday ?? 0), 0);
  const dailyCapacity = accounts.reduce((sum, a) => sum + (a.dailyLimit ?? 0), 0);

  const hasActiveFilters = !!search || statusFilter !== "All" || providerFilter !== "All";

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
    const confirmed = window.confirm("Are you sure you want to delete this sender account?");
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

  const getUsagePercent = (sent: number, limit: number) => {
    if (!limit || limit <= 0) return 0;
    return Math.min((sent / limit) * 100, 100);
  };

  const usageTone = (percent: number) =>
    percent >= 90 ? { fg: C.danger, track: C.dangerSoft } :
    percent >= 70 ? { fg: C.warning, track: C.warningSoft } :
    { fg: C.success, track: C.successSoft };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .asa-main::-webkit-scrollbar { width: 10px; }
        .asa-main::-webkit-scrollbar-track { background: transparent; }
        .asa-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .asa-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        .asa-row:hover { background: ${C.rowHover}; }
        .asa-row .asa-actions { opacity: 0; transition: opacity 0.15s ease; }
        .asa-row:hover .asa-actions, .asa-row:focus-within .asa-actions { opacity: 1; }
        select option { background: #141821; color: #E8E6E1; }
        thead.asa-thead th { position: sticky; top: 0; background: ${C.inner}; z-index: 1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="asa-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                    >
                      Admin
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {accounts.length} account{accounts.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Sender accounts
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Manage sender accounts across all workspaces.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddAccount}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 self-start md:self-auto"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                <Plus size={15} /> Add sender account
              </button>
            </header>

            {/* ── Stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard title="Total accounts"  value={String(accounts.length)}          icon={AtSign}        accent={C.primary} accentSoft={C.primarySoft} accentRing={C.primaryRing} />
              <StatCard title="Active"          value={String(activeCount)}              icon={CheckCircle2}  accent={C.success} accentSoft={C.successSoft} accentRing={C.successRing} />
              <StatCard title="Emails today"    value={emailsToday.toLocaleString()}     icon={Send}          accent={C.blue}    accentSoft={C.blueSoft}    accentRing={C.blueRing} />
              <StatCard title="Daily capacity"  value={dailyCapacity.toLocaleString()}   icon={Mail}          accent={C.violet}  accentSoft={C.violetSoft}  accentRing={C.violetRing} />
            </div>

            {/* ── Command bar ────────────────────── */}
            <div className="rounded-3xl p-3 mb-5 soft-ring sticky top-3 z-20"
              style={{ background: "rgba(20,24,33,0.85)", backdropFilter: "blur(10px)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0 transition-all"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
                  onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
                >
                  <Search size={14} style={{ color: C.textMuted }} className="shrink-0" />
                  <input
                    placeholder="Search by name, email, or provider…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-[13.5px] outline-none"
                    style={{ color: C.textBody }}
                    aria-label="Search sender accounts"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-[#1B2130]"
                      style={{ color: C.textMuted }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <SlidersHorizontal size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      aria-label="Filter by status"
                    >
                      {FILTERS.map((f) => <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <AtSign size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <select
                      value={providerFilter}
                      onChange={(e) => setProviderFilter(e.target.value)}
                      className="pl-8 pr-3 py-2.5 rounded-2xl text-[12.5px] cursor-pointer outline-none"
                      style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      aria-label="Filter by provider"
                    >
                      {PROVIDER_FILTERS.map((p) => <option key={p} value={p}>{p === "All" ? "All providers" : p}</option>)}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                      style={{ background: C.inner, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}

                  <button
                    onClick={() => fetchAllSenderAccounts()}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12.5px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background: C.surface, color: C.textBody }}
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11.5px]" style={{ color: C.textMuted }}>
                <span>
                  Showing{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredAccounts.length}</span>{" "}
                  of <span style={{ color: C.dark, fontFamily: FONT.mono }}>{accounts.length}</span>
                </span>
              </div>
            </div>

            {/* ── Table ──────────────────────────── */}
            <div className="rounded-3xl overflow-hidden soft-ring" style={{ background: C.surface }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 880 }}>
                  <thead className="asa-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="px-4 md:px-6 py-3 font-medium" scope="col">Account</th>
                      <th className="px-3 py-3 font-medium" scope="col">Provider</th>
                      <th className="px-3 py-3 font-medium" scope="col">Status</th>
                      <th className="px-3 py-3 font-medium w-[160px]" scope="col">Daily</th>
                      <th className="px-3 py-3 font-medium w-[160px]" scope="col">Hourly</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right" scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Loading */}
                    {loading && accounts.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 size={26} className="animate-spin" style={{ color: C.primary }} />
                            <p className="mt-3 text-[13px]" style={{ color: C.textMuted }}>Loading sender accounts…</p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Rows */}
                    {!loading && filteredAccounts.map((account) => {
                      const dailyPercent = getUsagePercent(account.sentToday, account.dailyLimit);
                      const hourlyPercent = getUsagePercent(account.sentThisHour, account.hourlyLimit);
                      const dailyTone = usageTone(dailyPercent);
                      const hourlyTone = usageTone(hourlyPercent);

                      return (
                        <tr key={account.id} className="asa-row float-in transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                          {/* Account */}
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={account.name} size={36} />
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-medium truncate" style={{ color: C.dark }}>
                                  {account.name || "Unnamed"}
                                </p>
                                <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Provider */}
                          <td className="px-3 py-3.5"><ProviderBadge provider={account.provider} /></td>

                          {/* Status */}
                          <td className="px-3 py-3.5"><StatusPill status={account.status} /></td>

                          {/* Daily */}
                          <td className="px-3 py-3.5">
                            <div className="w-[140px]">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.sentToday?.toLocaleString?.() ?? account.sentToday}
                                </span>
                                <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                                  / {account.dailyLimit?.toLocaleString?.() ?? account.dailyLimit}
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.inner }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${dailyPercent}%`, background: dailyTone.fg, boxShadow: `0 0 10px ${dailyTone.fg}66` }}
                                />
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: dailyTone.fg, fontFamily: FONT.mono }}>
                                {Math.round(dailyPercent)}%
                              </p>
                            </div>
                          </td>

                          {/* Hourly */}
                          <td className="px-3 py-3.5">
                            <div className="w-[140px]">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.sentThisHour?.toLocaleString?.() ?? account.sentThisHour}
                                </span>
                                <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                                  / {account.hourlyLimit?.toLocaleString?.() ?? account.hourlyLimit}
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.inner }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${hourlyPercent}%`, background: hourlyTone.fg, boxShadow: `0 0 10px ${hourlyTone.fg}66` }}
                                />
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: hourlyTone.fg, fontFamily: FONT.mono }}>
                                {Math.round(hourlyPercent)}%
                              </p>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <div className="asa-actions flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditAccount(account)}
                                aria-label={`Edit ${account.name || account.email}`}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.id)}
                                aria-label={`Delete ${account.name || account.email}`}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: C.danger }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = C.dangerSoft)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty */}
                    {!loading && filteredAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                            <div
                              className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                              style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                            >
                              <AtSign size={26} style={{ color: C.primary }} />
                            </div>
                            <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold text-[#F2F0EB]">
                              {accounts.length === 0 ? "No sender accounts yet" : "No accounts match"}
                            </h3>
                            <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>
                              {accounts.length === 0
                                ? "Add your first sender account to get started."
                                : "Try adjusting your search or filters."}
                            </p>
                            {accounts.length === 0 ? (
                              <button
                                onClick={handleAddAccount}
                                className="mt-5 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                              >
                                <Plus size={13} /> Add sender account
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                                className="mt-5 text-[12.5px] font-medium"
                                style={{ color: C.primary }}
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination strip (kept minimal — the current data is fully client-side) */}
              <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t" style={{ borderColor: C.border }}>
                <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                  Showing <span style={{ color: C.dark, fontFamily: FONT.mono }}>{filteredAccounts.length}</span> of{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{accounts.length}</span> accounts
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Previous page"
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span
                    className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium text-center"
                    style={{ background: C.primary, color: "#fff", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                  >
                    1
                  </span>
                  <button
                    aria-label="Next page"
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Add / Edit modal ───────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={editingAccount ? "Edit sender account" : "Add sender account"}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl overflow-hidden soft-ring modal-pop"
            style={{ background: C.surface }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                >
                  <AtSign size={18} style={{ color: C.primary }} />
                </div>
                <div className="min-w-0">
                  <h2 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-[16px] md:text-[18px] font-bold text-white truncate">
                    {editingAccount ? "Edit sender account" : "Add sender account"}
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                    {editingAccount
                      ? "Update the sender account configuration."
                      : "Add a new sender account to the platform."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="shrink-0 p-2 rounded-2xl transition-colors"
                style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email address" required>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sender@company.com"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <Field label="Display name" required>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Marketing"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Provider">
                  <select
                    value={formData.provider || "Gmail"}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as SenderProvider })}
                    className={inputCls}
                    style={inputStyle}
                  >
                    <option value="Gmail">Gmail</option>
                    <option value="Outlook">Outlook</option>
                    <option value="Custom SMTP">Custom SMTP</option>
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    value={formData.status || "Active"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SenderStatus })}
                    className={inputCls}
                    style={inputStyle}
                  >
                    <option value="Active">Active</option>
                    <option value="Warning">Warning</option>
                    <option value="Disconnected">Disconnected</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Daily limit">
                  <input
                    type="number"
                    value={formData.dailyLimit ?? 500}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    style={{ ...inputStyle, fontFamily: FONT.mono }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <Field label="Hourly limit">
                  <input
                    type="number"
                    value={formData.hourlyLimit ?? 100}
                    onChange={(e) => setFormData({ ...formData, hourlyLimit: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    style={{ ...inputStyle, fontFamily: FONT.mono }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: C.border }}>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : editingAccount ? "Update account" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── Field ─────────────────────────── */

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: C.textBody }}>
      {label}
      {required && <span className="ml-1" style={{ color: C.danger }}>*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all";
const inputStyle: React.CSSProperties = {
  background: C.inner,
  color: C.textBody,
  boxShadow: `inset 0 0 0 1px ${C.border}`,
};
const onFocusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)`);
const onFocusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`);

export default AdminSenderAccounts;