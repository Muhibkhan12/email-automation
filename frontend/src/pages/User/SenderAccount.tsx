import React, { useContext, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Mail, CheckCircle2, AlertTriangle, XCircle, Gauge, Layers,
  Plus, Search, Zap, Settings2, Trash2, Wifi, Menu, Loader2, Inbox,
  X, ShieldAlert,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import type { SenderAccount } from "../../types/SenderAccount";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:         "#0B0C0E",
  surface:    "#111214",
  surface2:   "#16181B",
  surfaceHi:  "#1C1F23",
  border:     "#24282E",
  borderSoft: "#1B1E22",

  text:       "#E8EAED",
  textMuted:  "#9AA0A6",
  textFaint:  "#6B7075",

  accent:     "#6EE7A8",
  accentInk:  "#0B0C0E",
  accentLine: "#2E6B4D",

  ok:         "#6EE7A8",
  warn:       "#E0A64A",
  danger:     "#E06A6A",
  info:       "#6EC1E7",
  purple:     "#B39DE0",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* ─────────────── helpers ─────────────── */

type AccountStatus = "Active" | "Warning" | "Disconnected";
type Provider = "Gmail" | "Outlook" | "Custom SMTP";

const providerMeta: Record<Provider, { short: string; grad: string; ring: string; fg: string }> = {
  Gmail:         { short: "G",  grad: "linear-gradient(135deg, #EA4335, #B32C20)", ring: "rgba(234,67,53,0.35)",  fg: "#EA4335" },
  Outlook:       { short: "O",  grad: "linear-gradient(135deg, #0A66C2, #053C74)", ring: "rgba(10,102,194,0.35)", fg: "#0A66C2" },
  "Custom SMTP": { short: "SM", grad: "linear-gradient(135deg, #4B5563, #1F2937)", ring: "rgba(107,114,128,0.35)", fg: "#9BA0A8" },
};

const statusMeta: Record<AccountStatus, { fg: string; bg: string; ring: string; icon: React.ComponentType<{ size?: number }> }> = {
  Active:       { fg: T.ok,     bg: "rgba(110,231,168,0.10)", ring: "rgba(110,231,168,0.28)", icon: CheckCircle2 },
  Warning:      { fg: T.warn,   bg: "rgba(224,166,74,0.10)",  ring: "rgba(224,166,74,0.28)",  icon: AlertTriangle },
  Disconnected: { fg: T.danger, bg: "rgba(224,106,106,0.10)", ring: "rgba(224,106,106,0.28)", icon: XCircle },
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
  const [accountToDelete, setAccountToDelete] = useState<SenderAccount | null>(null);

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

  const confirmDelete = async (id: number) => {
    await deleteSenderAccount(id);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .sa-main::-webkit-scrollbar { width: 8px; }
        .sa-main::-webkit-scrollbar-track { background: transparent; }
        .sa-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .sa-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        .sa-input::placeholder { color: ${T.textFaint}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { .spin { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
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
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: activeCount > 0 ? T.accent : T.textFaint }}
                    />
                    {activeCount} active
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {senderAcc.length} total
                  </span>
                </div>

                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Sender accounts
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage the accounts used to send your campaigns.
                </p>
              </div>
            </div>

            <button
              onClick={handleAddAccount}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium self-start md:self-auto transition-all hover:brightness-110"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <Plus size={13} />
              Add sender account
            </button>
          </header>

          {/* Summary strip */}
          <div className="mb-6 rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
              <SummaryTile icon={Layers}       label="Total accounts"  value={String(senderAcc.length)}       tone={T.textMuted} />
              <SummaryTile icon={CheckCircle2} label="Active"          value={String(activeCount)}            tone={T.ok} />
              <SummaryTile icon={Mail}         label="Emails today"    value={emailsToday.toLocaleString()}   tone={T.info} />
              <SummaryTile icon={Gauge}        label="Daily capacity"  value={dailyCapacity.toLocaleString()} tone={T.purple} />
            </div>
          </div>

          {/* Accounts panel */}
          <section className="rounded-xl overflow-hidden mb-6" style={{ background: T.surface, border: HAIRLINE }}>
            <header
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-5 py-3"
              style={{ borderBottom: HAIRLINE_SOFT }}
            >
              <div>
                <h2 className="text-[12.5px] font-medium flex items-center gap-2" style={{ color: T.text }}>
                  <Inbox size={13} style={{ color: T.accent }} />
                  Your accounts
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
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
                  className="sa-input w-full rounded-md py-2 pl-8 pr-16 text-[12.5px] outline-none transition-colors duration-[120ms]"
                  style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = T.borderSoft)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10.5px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
                    style={{ color: T.textFaint }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </header>

            {loading && senderAcc.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16">
                <Loader2 size={15} className="spin" style={{ color: T.accent }} />
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
                    onDelete={() => setAccountToDelete(account)}
                    onReconnect={handleAddAccount}
                  />
                ))}
              </ul>
            )}

            {!loading && senderAcc.length === 0 && (
              <div className="text-center py-16 px-6">
                <div
                  className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                  style={{ background: T.surfaceHi, border: HAIRLINE }}
                >
                  <Mail className="w-5 h-5" style={{ color: T.textFaint }} />
                </div>
                <p className="text-[14px] font-medium" style={{ color: T.text }}>No sender accounts yet</p>
                <p className="text-[12px] mt-1.5 mb-5" style={{ color: T.textMuted }}>
                  Connect a Microsoft account to start sending campaigns.
                </p>
                <button
                  onClick={handleAddAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all hover:brightness-110"
                  style={{ background: T.accent, color: T.accentInk }}
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
                  style={{ background: T.surfaceHi, border: HAIRLINE }}
                >
                  <Search className="w-4 h-4" style={{ color: T.textFaint }} />
                </div>
                <p className="text-[12.5px]" style={{ color: T.textMuted }}>
                  No accounts match "{search}"
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2.5 text-[11.5px] font-medium"
                  style={{ color: T.accent }}
                >
                  Clear search
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {accountToDelete && (
        <ConfirmDisconnectModal
          account={accountToDelete}
          onClose={() => setAccountToDelete(null)}
          onConfirm={async () => {
            await confirmDelete(accountToDelete.id);
            setAccountToDelete(null);
          }}
        />
      )}
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
    <p className="text-[22px] font-medium leading-none tracking-tight"
      style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

/* ─────────────── usage bar ─────────────── */

const UsageBar: React.FC<{
  label: string;
  current: number;
  limit: number;
  pct: number;
}> = ({ label, current, limit, pct }) => {
  const tone = pct >= 90 ? T.danger : pct >= 70 ? T.warn : T.accent;
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
      className={`px-4 md:px-5 py-4 transition-colors duration-[120ms] ${disconnected ? "opacity-75" : ""}`}
      style={{ borderTop: first ? "none" : HAIRLINE_SOFT }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

        {/* Identity */}
        <div className="lg:col-span-5 flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-medium text-white"
            style={{ background: p.grad, boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${p.ring}` }}
          >
            {p.short}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[13px] font-medium truncate" style={{ color: T.text }}>
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
          {disconnected && (
            <button
              onClick={onReconnect}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all hover:brightness-110"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <Wifi size={12} /> Reconnect
            </button>
          )}

          <button
            onClick={onDelete}
            aria-label="Delete account"
            className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors duration-[120ms]"
            style={{ color: T.danger, border: HAIRLINE_SOFT }}
            title="Delete account"
            onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHi }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </li>
  );
};

/* ─────────────── confirm disconnect modal ─────────────── */

const ConfirmDisconnectModal: React.FC<{
  account: SenderAccount;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}> = ({ account, onClose, onConfirm }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = normalizeProvider(account.provider);
  const p = providerMeta[provider];
  const status = normalizeStatus(account.status);
  const s = statusMeta[status];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e: any) {
      setError(e?.message || "Could not disconnect this account. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(11,12,14,0.72)" }}
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disconnect-title"
    >
      <style>{`
        @keyframes dc-rise { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: none } }
        .dc-shell { animation: dc-rise 0.15s ease-out }
        @media (prefers-reduced-motion: reduce) { .dc-shell { animation: none !important } }
      `}</style>

      <div
        className="dc-shell relative w-full max-w-md rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          border: HAIRLINE,
          boxShadow: "0 24px 64px -16px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* top danger accent */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${T.danger}, transparent)`, opacity: 0.5 }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(224,106,106,0.10)", color: T.danger, border: "1px solid rgba(224,106,106,0.28)" }}
            >
              <ShieldAlert size={16} />
            </div>
            <div className="min-w-0">
              <h2
                id="disconnect-title"
                className="text-[15px] font-semibold leading-tight"
                style={{ color: T.text }}
              >
                Disconnect this sender account?
              </h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                Sending from this account will stop immediately.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-md transition-colors duration-[120ms] disabled:opacity-40"
            style={{ color: T.textMuted, background: T.surface2, border: HAIRLINE_SOFT }}
            onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi; } }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = T.surface2; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Account preview card */}
        <div className="px-5 pt-2 pb-3">
          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{ background: T.surface2, border: HAIRLINE_SOFT }}
          >
            <div
              className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-semibold text-white"
              style={{ background: p.grad, boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${p.ring}` }}
            >
              {p.short}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                  {account.email}
                </p>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
                  style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                >
                  {status}
                </span>
              </div>
              <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                {account.provider} · <span style={{ color: T.textMuted }}>{account.display_name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Body copy */}
        <div className="px-5 pb-4">
          <ul className="space-y-1.5 text-[11.5px]" style={{ color: T.textMuted }}>
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ background: T.danger }}
              />
              Any campaigns queued on this account will pause immediately.
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ background: T.danger }}
              />
              Historical logs and reports are kept.
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ background: T.textFaint }}
              />
              You can reconnect it later from this page.
            </li>
          </ul>

          {error && (
            <div
              className="mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-[11.5px]"
              style={{ background: "rgba(224,106,106,0.08)", color: T.danger, border: "1px solid rgba(224,106,106,0.28)" }}
              role="alert"
            >
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5"
          style={{ borderTop: HAIRLINE_SOFT }}
        >
          <button
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-120 disabled:opacity-40"
            style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
            onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi; } }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100"
            style={{ background: T.danger, color: "#0B0C0E", border: `1px solid ${T.danger}` }}
          >
            {busy ? (
              <>
                <Loader2 size={12} className="spin" />
                Disconnecting…
              </>
            ) : (
              <>
                <Trash2 size={12} />
                Disconnect account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderAccountsPage;