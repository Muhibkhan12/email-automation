import { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Mail, CheckCircle2, AlertTriangle, XCircle, Gauge, Layers,
  Plus, X, Search, Zap, Settings2, Trash2, Shuffle, Timer,
  RotateCcw, Wifi, Menu, Loader2, ArrowUpRight, Inbox,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import type {
  SenderAccount,
  CreateSenderAccountInput,
} from "../../types/SenderAccount";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ─────────────── helpers ─────────────── */

type AccountStatus = "Active" | "Warning" | "Disconnected";
type Provider = "Gmail" | "Outlook" | "Custom SMTP";

const providerMeta: Record<Provider, { short: string; grad: string; ring: string; fg: string }> = {
  Gmail:         { short: "G",  grad: "linear-gradient(135deg, #EA4335, #B32C20)", ring: "rgba(234,67,53,0.35)",  fg: "#EA4335" },
  Outlook:       { short: "O",  grad: "linear-gradient(135deg, #0A66C2, #053C74)", ring: "rgba(10,102,194,0.35)", fg: "#0A66C2" },
  "Custom SMTP": { short: "SM", grad: "linear-gradient(135deg, #4B5563, #1F2937)", ring: "rgba(107,114,128,0.35)", fg: "#9BA0A8" },
};

const statusMeta: Record<AccountStatus, { fg: string; bg: string; ring: string; icon: React.ComponentType<{ size?: number }> }> = {
  Active:       { fg: "#34D399", bg: "rgba(52,211,153,0.10)",  ring: "rgba(52,211,153,0.22)",  icon: CheckCircle2 },
  Warning:      { fg: "#FBBF24", bg: "rgba(251,191,36,0.10)",  ring: "rgba(251,191,36,0.22)",  icon: AlertTriangle },
  Disconnected: { fg: "#F87171", bg: "rgba(248,113,113,0.10)", ring: "rgba(248,113,113,0.22)", icon: XCircle },
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
  const [showAddAccount, setShowAddAccount] = useState(false);
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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .sa-main::-webkit-scrollbar { width: 10px; }
        .sa-main::-webkit-scrollbar-track { background: transparent; }
        .sa-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .sa-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141823; color: #E8E6E1; }
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="sa-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: "#0B0E13" }}>
        <div className="glow-top">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141823" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {activeCount} active sender{activeCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {senderAcc.length} total
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    Sender accounts
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Manage the accounts used to send your campaigns.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddAccount(true)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold self-start md:self-auto transition-all hover:-translate-y-0.5"
                style={{ background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                <Plus size={15} />
                Add sender account
              </button>
            </header>

            {/* ── Summary bar ────────────────────── */}
            <div
              className="float-in mb-6 md:mb-8 rounded-3xl overflow-hidden soft-ring"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1A1F2B]">
                <SummaryTile icon={Layers}       label="Total accounts"   value={String(senderAcc.length)}        tone="#9BA0A8" />
                <SummaryTile icon={CheckCircle2} label="Active"           value={String(activeCount)}             tone="#34D399" />
                <SummaryTile icon={Mail}         label="Emails today"     value={emailsToday.toLocaleString()}    tone="#60A5FA" />
                <SummaryTile icon={Gauge}        label="Daily capacity"   value={dailyCapacity.toLocaleString()}  tone="#A78BFA" />
              </div>
            </div>

            {/* ── Accounts list ─────────────────── */}
            <section className="rounded-3xl overflow-hidden soft-ring mb-6 md:mb-8"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-4 border-b border-[#1A1F2B]">
                <div>
                  <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "#F2F0EB" }}>
                    <Inbox size={15} className="text-[#FF6A39]" />
                    Your accounts
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: "#7A8092" }}>
                    Monitor health and sending capacity.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#6A7080" }}
                  />
                  <input
                    type="text"
                    placeholder="Search accounts…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl py-2 pl-9 pr-9 text-[13px] outline-none transition-all"
                    style={{ background: "#0F131C", color: "#E8E6E1", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B")}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#6A7080] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#1B2130] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </header>

              {/* Loading */}
              {loading && senderAcc.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-16">
                  <Loader2 size={16} className="spin text-[#FF6A39]" />
                  <span className="text-[13px]" style={{ color: "#7A8092" }}>Loading sender accounts…</span>
                </div>
              )}

              {/* List */}
              {filteredAccounts.length > 0 && (
                <ul>
                  {filteredAccounts.map((account, i) => (
                    <SenderAccountRow
                      key={account.id}
                      account={account as any}
                      first={i === 0}
                      onDelete={() => handleDelete(account.id)}
                    />
                  ))}
                </ul>
              )}

              {/* Empty */}
              {!loading && senderAcc.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                    <Mail className="w-6 h-6 text-[#6A7080]" />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: "#F2F0EB" }}>No sender accounts yet</p>
                  <p className="text-[12px] mt-1.5 mb-5" style={{ color: "#7A8092" }}>
                    Connect an account to start sending campaigns.
                  </p>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                  >
                    <Plus size={14} /> Add account
                  </button>
                </div>
              )}

              {/* No matches */}
              {senderAcc.length > 0 && filteredAccounts.length === 0 && (
                <div className="text-center py-14 px-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                    style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                    <Search className="w-5 h-5 text-[#6A7080]" />
                  </div>
                  <p className="text-[13.5px]" style={{ color: "#DADEE7" }}>
                    No accounts match "{search}"
                  </p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-3 text-[12px] font-medium transition-colors"
                    style={{ color: "#FF6A39" }}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </section>

            {/* ── Sending configuration ─────────── */}
            <section className="rounded-3xl p-5 md:p-6 soft-ring"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
              <div className="mb-5">
                <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "#F2F0EB" }}>
                  <Settings2 size={15} className="text-[#FF6A39]" />
                  Sending configuration
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "#7A8092" }}>
                  How your accounts are used during campaigns.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SettingCard
                  icon={Shuffle}
                  title="Account rotation"
                  description="Automatically rotate between active sender accounts."
                  enabled
                />
                <SettingCard
                  icon={Timer}
                  title="Rate limiting"
                  description="Respect hourly and daily limits for each account."
                  enabled
                />
                <SettingCard
                  icon={RotateCcw}
                  title="Automatic retry"
                  description="Retry failed email jobs using another sender."
                  enabled
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} />}
    </div>
  );
};

/* ─────────────── Summary tile ─────────────── */

const SummaryTile: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: string;
}> = ({ icon: Icon, label, value, tone }) => (
  <div className="p-5 md:p-6">
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}2E` }}
      >
        <Icon size={14} style={{ color: tone }} />
      </div>
      <span className="text-[11.5px] uppercase tracking-wider font-medium" style={{ color: "#6A7080" }}>
        {label}
      </span>
    </div>
    <p className="text-[28px] md:text-[32px] font-bold leading-none tracking-tight"
      style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

/* ─────────────── Usage ring (SVG) ─────────────── */

const UsageRing: React.FC<{
  label: string;
  current: number;
  limit: number;
  pct: number;
  size?: number;
}> = ({ label, current, limit, pct, size = 76 }) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  const tone = pct >= 90 ? "#F87171" : pct >= 70 ? "#FBBF24" : "#FF6A39";

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="#1B2130" strokeWidth={stroke} fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={tone} strokeWidth={stroke} fill="none"
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[14px] font-bold font-mono leading-none" style={{ color: "#F2F0EB" }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider" style={{ color: "#6A7080" }}>{label}</p>
        <p className="text-[13px] font-semibold mt-0.5" style={{ color: "#DADEE7", fontFamily: FONT.mono }}>
          {current.toLocaleString()}
          <span style={{ color: "#4A5162" }}> / </span>
          {limit.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

/* ─────────────── Account row ─────────────── */

type AccountWithCampaigns = SenderAccount & { campaigns?: number };

const SenderAccountRow: React.FC<{
  account: AccountWithCampaigns;
  first?: boolean;
  onDelete: () => void;
}> = ({ account, first, onDelete }) => {
  const provider = normalizeProvider(account.provider);
  const status = normalizeStatus(account.status);
  const p = providerMeta[provider];
  const s = statusMeta[status];
  const StatusIcon = s.icon;

  const sentToday = account.emails_sent_today ?? 0;
  const dailyLimit = account.daily_limit ?? 0;
  const sentThisHour = account.emails_sent_hour ?? 0;
  const hourlyLimit = account.hourly_limit ?? 0;
  const dailyPct = pct(sentToday, dailyLimit);
  const hourlyPct = pct(sentThisHour, hourlyLimit);
  const disconnected = status === "Disconnected";
  const campaigns = account.campaigns ?? 0;

  return (
    <li
      className={`px-4 md:px-6 py-5 transition-colors hover:bg-[#11151E] ${disconnected ? "opacity-70" : ""}`}
      style={{ borderTop: first ? "none" : "1px solid #1A1F2B" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

        {/* Provider + identity */}
        <div className="lg:col-span-5 flex items-center gap-4 min-w-0">
          <div
            className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold text-white"
            style={{ background: p.grad, boxShadow: `0 0 0 3px ${p.ring}, 0 6px 18px -8px ${p.fg}66` }}
          >
            {p.short}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>
                {account.email}
              </h3>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
                {status}
              </span>
            </div>
            <p className="text-[12px] mt-1 truncate" style={{ color: "#7A8092" }}>
              {account.display_name} <span style={{ color: "#4A5162" }}>·</span>{" "}
              <span style={{ fontFamily: FONT.mono }}>{account.provider}</span>
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#5A6172" }}>
              {campaigns} campaign{campaigns !== 1 && "s"} using this account
            </p>
          </div>
        </div>

        {/* Usage rings */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <UsageRing label="Daily" current={sentToday} limit={dailyLimit} pct={dailyPct} />
          <UsageRing label="Hourly" current={sentThisHour} limit={hourlyLimit} pct={hourlyPct} />
        </div>

        {/* Actions */}
        <div className="lg:col-span-3 flex items-center lg:justify-end gap-2 flex-wrap">
          {disconnected ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
            >
              <Wifi size={13} /> Reconnect
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-all"
              style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
            >
              <Zap size={13} /> Test
            </button>
          )}

          <button
            className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-all"
            style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
          >
            <Settings2 size={13} /> Manage
          </button>

          <button
            onClick={onDelete}
            aria-label="Delete account"
            className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[12px] font-medium transition-all"
            style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  );
};

/* ─────────────── Setting card ─────────────── */

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
      className="rounded-2xl p-4 transition-all"
      style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: active ? "rgba(255,106,57,0.10)" : "#141823", color: active ? "#FF6A39" : "#7A8092", boxShadow: active ? "inset 0 0 0 1px rgba(255,106,57,0.22)" : "inset 0 0 0 1px #1A1F2B" }}
          >
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold" style={{ color: "#F2F0EB" }}>{title}</h3>
            <p className="mt-1 text-[11.5px] leading-5" style={{ color: "#7A8092" }}>{description}</p>
          </div>
        </div>

        <button
          onClick={() => setActive(!active)}
          role="switch"
          aria-checked={active}
          aria-label={title}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: active ? "#FF6A39" : "#232938" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: active ? 22 : 2 }}
          />
        </button>
      </div>
    </div>
  );
};

/* ─────────────── Add account modal ─────────────── */

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

  const inputBase =
    "w-full rounded-2xl px-4 py-2.5 text-[13px] outline-none transition-all";
  const inputStyle: React.CSSProperties = {
    background: "#0F131C",
    color: "#E8E6E1",
    boxShadow: "inset 0 0 0 1px #1A1F2B",
  };
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)");
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl overflow-hidden float-in"
        style={{ background: "#141823", boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#1A1F2B]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
              <Mail size={18} className="text-[#FF6A39]" />
            </div>
            <div className="min-w-0">
              <h2 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                className="text-[16px] md:text-[18px] font-bold text-white truncate">
                Add sender account
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#8A90A0" }}>
                Connect an account for sending campaigns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-2 rounded-2xl text-[#8A90A0] hover:text-[#E8E6E1] transition-colors"
            style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <Field label="Email address">
            <input
              type="email"
              placeholder="marketing@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </Field>

          <Field label="Display name">
            <input
              type="text"
              placeholder="Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBase}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </Field>

          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className={inputBase}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            >
              <option>Gmail</option>
              <option>Outlook</option>
              <option>Custom SMTP</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3 rounded-2xl p-4"
            style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}>
            <Field label="Daily limit" compact>
              <input
                type="number" min={0} placeholder="500"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={inputBase}
                style={{ ...inputStyle, background: "#141823" }}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </Field>
            <Field label="Hourly limit" compact>
              <input
                type="number" min={0} placeholder="50"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className={inputBase}
                style={{ ...inputStyle, background: "#141823" }}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </Field>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5"
              style={{ background: "rgba(248,113,113,0.08)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
              <AlertTriangle size={14} className="text-[#F87171] shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color: "#F87171" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 md:p-6 border-t border-[#1A1F2B]">
          <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
            credentials encrypted at rest
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
              style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !email || !name}
              className="rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-0.5"
              style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
            >
              {saving ? "Connecting…" : "Connect account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small label wrapper */
const Field: React.FC<{ label: string; compact?: boolean; children: React.ReactNode }> = ({
  label, compact, children,
}) => (
  <div>
    <label
      className={`block font-medium mb-1.5 ${compact ? "text-[10.5px]" : "text-[12px]"}`}
      style={{ color: compact ? "#8A90A0" : "#C7C9CE", textTransform: compact ? "uppercase" : "none", letterSpacing: compact ? "0.06em" : "0" }}
    >
      {label}
    </label>
    {children}
  </div>
);

export default SenderAccountsPage;