import React, { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Mail, CheckCircle2, AlertTriangle, XCircle, Gauge, Layers,
  Plus, Search, Zap, Settings2, Trash2, Wifi, Menu, Loader2, Inbox,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import type { SenderAccount } from "../../types/SenderAccount";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  surface:     "#111319",
  surface2:    "#161922",
  surfaceHi:   "#1B1F2A",
  border:      "#232838",
  borderSoft:  "#1B1F2A",
  text:        "#E9EBF0",
  textMuted:   "#9CA3B4",
  textFaint:   "#6B7280",
  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
  purple:      "#A78BFA",
  purpleSoft:  "rgba(167,139,250,0.12)",
  purpleBorder:"rgba(167,139,250,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── helpers ─────────────── */

type AccountStatus = "Active" | "Warning" | "Disconnected";
type Provider = "Gmail" | "Outlook" | "Custom SMTP";

const providerMeta: Record<Provider, { short: string; grad: string; ring: string; fg: string }> = {
  Gmail:         { short: "G",  grad: "linear-gradient(135deg, #EA4335, #B32C20)", ring: "rgba(234,67,53,0.35)",  fg: "#EA4335" },
  Outlook:       { short: "O",  grad: "linear-gradient(135deg, #0A66C2, #053C74)", ring: "rgba(10,102,194,0.35)", fg: "#0A66C2" },
  "Custom SMTP": { short: "SM", grad: "linear-gradient(135deg, #4B5563, #1F2937)", ring: "rgba(107,114,128,0.35)", fg: "#9BA0A8" },
};

const statusMeta: Record<AccountStatus, { fg: string; bg: string; ring: string; icon: React.ComponentType<{ size?: number }> }> = {
  Active:       { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: CheckCircle2 },
  Warning:      { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: AlertTriangle },
  Disconnected: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: XCircle },
};

const pct = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

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

/* ─────────────── page ─────────────── */

const SenderAccountsPage = () => {
  const ctx = useContext(SenderAccContext);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!ctx) {
    throw new Error("SenderAccountsPage must be used inside a <SenderAccountsContext> provider.");
  }
  const { senderAcc: rawAccounts, loading, deleteSenderAccount } = ctx;
  const senderAcc: SenderAccount[] = Array.isArray(rawAccounts) ? rawAccounts : [];

  const query = search.toLowerCase();
  const filteredAccounts = senderAcc.filter(
    (a) =>
      (a.email ?? "").toLowerCase().includes(query) ||
      (a.display_name ?? "").toLowerCase().includes(query)
  );

  const activeCount = senderAcc.filter((a) => normalizeStatus(a.status) === "Active").length;
  const emailsToday = senderAcc.reduce((sum, a) => sum + (a.emails_sent_today ?? 0), 0);
  const dailyCapacity = senderAcc.reduce((sum, a) => sum + (a.daily_limit ?? 0), 0);

  const handleAddAccount = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You must be logged in.");
      return;
    }
    window.location.href = `/api/oauth/outlook/connect?token=${encodeURIComponent(token)}`;
  };

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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .sa-main::-webkit-scrollbar { width: 8px; }
        .sa-main::-webkit-scrollbar-track { background: transparent; }
        .sa-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .sa-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        @media (prefers-reduced-motion: reduce) { .spin { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="sa-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1160 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {activeCount} active sender{activeCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {senderAcc.length} total
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Sender accounts
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage the accounts used to send your campaigns.
                </p>
              </div>
            </div>

            <button
              onClick={handleAddAccount}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium self-start md:self-auto transition-all hover:brightness-110"
              style={{ background: T.brand, color: "#fff", boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
            >
              <Plus size={14} />
              Add sender account
            </button>
          </header>

          {/* Summary strip */}
          <div
            className="mb-5 md:mb-6 rounded-xl overflow-hidden"
            style={{ background: T.surface, boxShadow: RING }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
              <SummaryTile icon={Layers}       label="Total accounts"  value={String(senderAcc.length)}       tone={T.textMuted} />
              <SummaryTile icon={CheckCircle2} label="Active"          value={String(activeCount)}            tone={T.success} />
              <SummaryTile icon={Mail}         label="Emails today"    value={emailsToday.toLocaleString()}   tone={T.info} />
              <SummaryTile icon={Gauge}        label="Daily capacity"  value={dailyCapacity.toLocaleString()} tone={T.purple} />
            </div>
          </div>

          {/* Accounts panel */}
          <section className="rounded-xl overflow-hidden mb-6" style={{ background: T.surface, boxShadow: RING }}>
            <header
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-5 py-3"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div>
                <h2 className="text-[13px] font-semibold flex items-center gap-2" style={{ color: T.text }}>
                  <Inbox size={14} style={{ color: T.brand }} />
                  Your accounts
                </h2>
                <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                  Monitor health and sending capacity.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: T.textFaint }}
                />
                <input
                  type="text"
                  placeholder="Search accounts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md py-2 pl-8 pr-16 text-[12.5px] outline-none transition-shadow"
                  style={{ background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
                  onBlur={(e)  => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10.5px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: T.textFaint }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </header>

            {loading && senderAcc.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16">
                <Loader2 size={15} className="spin" style={{ color: T.brand }} />
                <span className="text-[12.5px]" style={{ color: T.textMuted }}>Loading sender accounts…</span>
              </div>
            )}

            {filteredAccounts.length > 0 && (
              <ul>
                {filteredAccounts.map((account, i) => (
                  <SenderAccountRow
                    key={account.id}
                    account={account as any}
                    first={i === 0}
                    onDelete={() => handleDelete(account.id)}
                    onReconnect={handleAddAccount}
                  />
                ))}
              </ul>
            )}

            {!loading && senderAcc.length === 0 && (
              <div className="text-center py-16 px-6">
                <div
                  className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                  style={{ background: T.surface2 }}
                >
                  <Mail className="w-5 h-5" style={{ color: T.textFaint }} />
                </div>
                <p className="text-[14px] font-medium" style={{ color: T.text }}>No sender accounts yet</p>
                <p className="text-[12px] mt-1.5 mb-5" style={{ color: T.textMuted }}>
                  Connect a Microsoft account to start sending campaigns.
                </p>
                <button
                  onClick={handleAddAccount}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all hover:brightness-110"
                  style={{ background: T.brand, color: "#fff" }}
                >
                  <Plus size={13} />
                  Add sender account
                </button>
              </div>
            )}

            {senderAcc.length > 0 && filteredAccounts.length === 0 && (
              <div className="text-center py-14 px-6">
                <div
                  className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                  style={{ background: T.surface2 }}
                >
                  <Search className="w-4 h-4" style={{ color: T.textFaint }} />
                </div>
                <p className="text-[12.5px]" style={{ color: T.textMuted }}>
                  No accounts match "{search}"
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2.5 text-[11.5px] font-medium"
                  style={{ color: T.brand }}
                >
                  Clear search
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

/* ─────────────── summary tile ─────────────── */

const SummaryTile: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: string;
}> = ({ icon: Icon, label, value, tone }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: `${tone}14`, color: tone }}
      >
        <Icon size={13} />
      </div>
      <span className="text-[10.5px] uppercase tracking-wider font-medium" style={{ color: T.textFaint }}>
        {label}
      </span>
    </div>
    <p className="text-[24px] font-semibold leading-none tracking-tight"
      style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

/* ─────────────── usage bar (replaces ring) ─────────────── */

const UsageBar: React.FC<{
  label: string;
  current: number;
  limit: number;
  pct: number;
}> = ({ label, current, limit, pct }) => {
  const tone = pct >= 90 ? T.danger : pct >= 70 ? T.warn : T.brand;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[10.5px] uppercase tracking-wider" style={{ color: T.textFaint }}>
          {label}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
          {current.toLocaleString()} <span style={{ color: T.textFaint }}>/ {limit.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
      <p className="text-[10px] mt-1 tabular-nums" style={{ color: tone, fontFamily: FONT.mono }}>
        {pct}% used
      </p>
    </div>
  );
};

/* ─────────────── account row ─────────────── */

type AccountWithCampaigns = SenderAccount & { campaigns?: number };

const SenderAccountRow: React.FC<{
  account: AccountWithCampaigns;
  first?: boolean;
  onDelete: () => void;
  onReconnect: () => void;
}> = ({ account, first, onDelete, onReconnect }) => {
  const provider = normalizeProvider(account.provider);
  const status = normalizeStatus(account.status);
  const p = providerMeta[provider];
  const s = statusMeta[status];

  const sentToday = account.emails_sent_today ?? 0;
  const dailyLimit = account.daily_limit ?? 0;
  const sentThisHour = account.emails_sent_hour ?? 0;
  const hourlyLimit = account.hourly_limit ?? 0;
  const dailyPct = pct(sentToday, dailyLimit);
  const hourlyPct = pct(sentThisHour, hourlyLimit);
  const disconnected = status === "Disconnected";
  const campaigns = account.campaigns ?? 0;
  const StatusIcon = s.icon;

  return (
    <li
      className={`px-4 md:px-5 py-4 transition-colors hover:bg-white/[0.02] ${disconnected ? "opacity-75" : ""}`}
      style={{ borderTop: first ? "none" : `1px solid ${T.borderSoft}` }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

        {/* Identity */}
        <div className="lg:col-span-5 flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-bold text-white"
            style={{ background: p.grad, boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${p.ring}` }}
          >
            {p.short}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[13px] font-semibold truncate" style={{ color: T.text }}>
                {account.email}
              </h3>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
                style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
              >
                <StatusIcon size={9} />
                {status}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint }}>
              {account.display_name} <span style={{ color: T.border }}>·</span>{" "}
              <span style={{ fontFamily: FONT.mono }}>{account.provider}</span>
            </p>
            <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint }}>
              {campaigns} campaign{campaigns !== 1 && "s"}
            </p>
          </div>
        </div>

        {/* Usage bars */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <UsageBar label="Daily"  current={sentToday}    limit={dailyLimit}  pct={dailyPct} />
          <UsageBar label="Hourly" current={sentThisHour} limit={hourlyLimit} pct={hourlyPct} />
        </div>

        {/* Actions */}
        <div className="lg:col-span-3 flex items-center lg:justify-end gap-1.5 flex-wrap">
          {disconnected ? (
            <button
              onClick={onReconnect}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:brightness-110"
              style={{ background: T.brand }}
            >
              <Wifi size={12} /> Reconnect
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <Zap size={12} /> Test
            </button>
          )}

          <button
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <Settings2 size={12} /> Manage
          </button>

          <button
            onClick={onDelete}
            aria-label="Delete account"
            className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
            style={{ color: T.danger, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            title="Delete account"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </li>
  );
};

export default SenderAccountsPage;