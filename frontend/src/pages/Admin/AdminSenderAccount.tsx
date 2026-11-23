// frontend/src/pages/admin/AdminSenderAccounts.tsx
import React, { useMemo, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  AtSign, Search, Trash2, RefreshCw, CheckCircle2,
  ShieldCheck, ShieldAlert, ShieldX, X, Menu, Send, Mail,
  SlidersHorizontal, AlertTriangle, Loader2, Link2, Link2Off,
  CheckCircle,
} from "lucide-react";
import {
  SenderAccountsProvider,
  useSenderAccounts,
} from "../../contexts/SenderAccountsContext";
import type { SenderAccount } from "../../types/SenderAccount";

const T = {
  bg: "#0B0C0E", surface: "#111214", surface2: "#16181B", surfaceHi: "#1C1F23",
  border: "#24282E", borderSoft: "#1B1E22",
  text: "#E8EAED", textMuted: "#9AA0A6", textFaint: "#6B7075",
  brand: "#6366F1", brandSoft: "rgba(99,102,241,0.12)", brandBorder: "rgba(99,102,241,0.35)",
  accent: "#6EE7A8",
  success: "#6EE7A8", successSoft: "rgba(110,231,168,0.10)", successBorder: "rgba(110,231,168,0.28)",
  warn: "#E0A64A", warnSoft: "rgba(224,166,74,0.10)", warnBorder: "rgba(224,166,74,0.28)",
  danger: "#E06A6A", dangerSoft: "rgba(224,106,106,0.10)", dangerBorder: "rgba(224,106,106,0.28)",
  info: "#6EC1E7", infoSoft: "rgba(110,193,231,0.10)", infoBorder: "rgba(110,193,231,0.28)",
  purple: "#B39DE0", purpleSoft: "rgba(179,157,224,0.10)",
};
const FONT = {
  ui: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};
const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

type KnownStatus = "Active" | "Warning" | "Disconnected";
type KnownProvider = "Gmail" | "Outlook";

const STATUS_META: Record<KnownStatus, { fg: string; bg: string; ring: string; icon: React.ElementType; label: string }> = {
  Active:       { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: ShieldCheck, label: "Active" },
  Warning:      { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: ShieldAlert, label: "Warning" },
  Disconnected: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: ShieldX,     label: "Disconnected" },
};
const PROVIDER_META: Record<KnownProvider, { fg: string; bg: string; ring: string; short: string; brand: string }> = {
  Gmail:   { fg: T.danger, bg: T.dangerSoft, ring: T.dangerBorder, short: "G", brand: "#EA4335" },
  Outlook: { fg: T.info,   bg: T.infoSoft,   ring: T.infoBorder,   short: "O", brand: "#0078D4" },
};
const statusMeta = (raw: string) =>
  STATUS_META[raw as KnownStatus] ?? { fg: T.textMuted, bg: T.surface2, ring: T.borderSoft, icon: ShieldAlert, label: raw || "Unknown" };
const providerMeta = (raw: string) =>
  PROVIDER_META[raw as KnownProvider] ?? { fg: T.textMuted, bg: T.surface2, ring: T.borderSoft, short: (raw?.[0] ?? "?").toUpperCase(), brand: T.textMuted };

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, border: HAIRLINE }}>{children}</div>
);

const Avatar: React.FC<{ name?: string; size?: number; brand?: string }> = ({ name, size = 30, brand }) => {
  const initial = (name || "?").trim()[0]?.toUpperCase() ?? "?";
  const bg = brand ?? T.brand;
  return (
    <div className="shrink-0 rounded-md flex items-center justify-center font-semibold text-white select-none"
      style={{ width: size, height: size, fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)` }} aria-hidden>
      {initial}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; accent: string; accentSoft: string }> =
  ({ title, value, icon: Icon, accent, accentSoft }) => (
    <Card className="p-4 relative overflow-hidden">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: accent, opacity: 0.6 }} />
      <div className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
        style={{ background: accentSoft, color: accent }}>
        <Icon size={14} />
      </div>
      <p className="text-[24px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>{value}</p>
      <p className="text-[11.5px] mt-2 font-medium" style={{ color: T.textMuted }}>{title}</p>
    </Card>
  );

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, border: `1px solid ${meta.ring}` }}>
      <Icon size={10} />{meta.label}
    </span>
  );
};

const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => {
  const meta = providerMeta(provider);
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, border: `1px solid ${meta.ring}`, fontFamily: FONT.mono }}>
      <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold"
        style={{ background: meta.fg, color: T.bg }}>{meta.short}</span>
      {provider || "Unknown"}
    </span>
  );
};

const DeleteConfirmModal: React.FC<{
  account: SenderAccount | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ account, busy, error, onCancel, onConfirm }) => {
  if (!account) return null;
  const meta = providerMeta(account.provider);
  const label = account.display_name || account.email;
  const owner = (account as any).owner_name || (account as any).owner_email;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      style={{ background: "rgba(11,12,14,0.72)", backdropFilter: "blur(4px)" }} role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: T.surface, border: HAIRLINE, boxShadow: "0 24px 64px -16px rgba(0,0,0,0.7)" }}>
        <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: T.dangerSoft, color: T.danger }}>
              <Link2Off size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold wrap-break-word" style={{ color: T.text }}>
                Disconnect “{label}”?
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                The saved OAuth token will be deleted. {owner ? `${owner} can reconnect later.` : "The owner can reconnect later."}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[12px]"
          style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
          <Avatar name={label} brand={meta.brand} size={28} />
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: T.text }}>{account.display_name || "Unnamed"}</p>
            <p className="truncate text-[11px] mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>{account.email}</p>
          </div>
        </div>
        {error && (
          <div className="mx-4 mt-3 rounded-lg px-3 py-2.5 flex items-start gap-2.5 text-[12px]"
            style={{ background: T.dangerSoft, color: T.danger, border: `1px solid ${T.dangerBorder}` }}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 p-4">
          <button onClick={onCancel} disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ color: T.textMuted, border: HAIRLINE }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-semibold disabled:opacity-50"
            style={{ background: T.danger, color: "#0B0C0E", border: `1px solid ${T.danger}` }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

const Inner: React.FC = () => {
  const { accounts, loading, error: ctxError, refresh, deleteSenderAccount } = useSenderAccounts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SenderAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (type: "success" | "error", msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ type, msg });
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  };
  React.useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const filtered = useMemo(() => {
    let r = [...accounts];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((a) =>
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.display_name ?? "").toLowerCase().includes(q) ||
        (a.provider ?? "").toLowerCase().includes(q) ||
        String((a as any).owner_email ?? "").toLowerCase().includes(q) ||
        String((a as any).owner_name ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") r = r.filter((a) => a.status === statusFilter);
    if (providerFilter !== "All") r = r.filter((a) => a.provider === providerFilter);
    return r;
  }, [accounts, search, statusFilter, providerFilter]);

  const activeCount = accounts.filter((a) => a.status === "Active").length;
  const emailsToday = accounts.reduce((s, a) => s + (a.emails_sent_today ?? 0), 0);
  const dailyCapacity = accounts.reduce((s, a) => s + (a.daily_limit ?? 0), 0);
  const hasFilters = !!search || statusFilter !== "All" || providerFilter !== "All";

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteSenderAccount(deleteTarget.id);
      setDeleteTarget(null);
      showFlash("success", "Sender account disconnected.");
    } catch (e: any) {
      setDeleteError(e?.response?.data?.detail ?? e?.message ?? "Failed to disconnect sender account.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const pct = (sent: number, limit: number) =>
    limit > 0 ? Math.max(0, Math.min((sent / limit) * 100, 100)) : 0;

  return (
    <div className="flex w-full overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg, height: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .asa-main::-webkit-scrollbar { width: 8px; }
        .asa-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .asa-row:hover { background: ${T.surface2}; }
        .asa-row .asa-actions { opacity: 0; transition: opacity 0.15s ease; }
        .asa-row:hover .asa-actions, .asa-row:focus-within .asa-actions { opacity: 1; }
        @media (hover: none) { .asa-row .asa-actions { opacity: 1; } }
        select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="asa-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
            <div className="flex items-start gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2 rounded-md"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }} aria-label="Open menu">
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, border: `1px solid ${T.brandBorder}` }}>Admin</span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {accounts.length} account{accounts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-semibold leading-tight tracking-tight"
                  style={{ color: T.text }}>Sender accounts</h1>
                <p className="mt-1 text-[13px] max-w-lg font-medium" style={{ color: T.textMuted }}>
                  All sender accounts connected by every user.
                </p>
              </div>
            </div>
          </header>

          {flash && (
            <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 text-[12px] float-in"
              style={{
                background: flash.type === "success" ? T.successSoft : T.dangerSoft,
                color: flash.type === "success" ? T.accent : T.danger,
                border: `1px solid ${flash.type === "success" ? T.successBorder : T.dangerBorder}`,
              }}>
              {flash.type === "success" ? <CheckCircle size={14} className="mt-0.5 shrink-0" />
                : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <span className="flex-1 font-medium">{flash.msg}</span>
              <button onClick={() => setFlash(null)} className="shrink-0 p-1 rounded-md" aria-label="Dismiss"><X size={12} /></button>
            </div>
          )}

          {ctxError && (
            <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, border: `1px solid ${T.dangerBorder}` }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="flex-1 font-medium">{ctxError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Total accounts" value={String(accounts.length)} icon={AtSign} accent={T.brand} accentSoft={T.brandSoft} />
            <StatCard title="Active" value={String(activeCount)} icon={CheckCircle2} accent={T.accent} accentSoft={T.successSoft} />
            <StatCard title="Emails today" value={emailsToday.toLocaleString()} icon={Send} accent={T.info} accentSoft={T.infoSoft} />
            <StatCard title="Daily capacity" value={dailyCapacity.toLocaleString()} icon={Mail} accent={T.purple} accentSoft={T.purpleSoft} />
          </div>

          <div className="rounded-xl p-3 mb-5 sticky top-3 z-20" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0"
                style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input placeholder="Search by name, email, provider, or owner…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[12.5px] font-medium outline-none" style={{ color: T.text }} />
                {search && (
                  <button onClick={() => setSearch("")} className="shrink-0 text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: T.textMuted }}>Clear</button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <SlidersHorizontal size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: T.textFaint }} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-md text-[12px] font-medium cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT }}>
                    {["All", "Active", "Warning", "Disconnected"].map((f) =>
                      <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <AtSign size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: T.textFaint }} />
                  <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-md text-[12px] font-medium cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT }}>
                    {["All", "Gmail", "Outlook"].map((p) =>
                      <option key={p} value={p}>{p === "All" ? "All providers" : p}</option>)}
                  </select>
                </div>
                {hasFilters && (
                  <button onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-[12px] font-medium"
                    style={{ background: T.surface2, color: T.brand, border: HAIRLINE_SOFT }}>
                    <X size={11} /> Clear
                  </button>
                )}
                <button onClick={refresh} disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium disabled:opacity-60"
                  style={{ color: T.textMuted, border: HAIRLINE }}>
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px]" style={{ color: T.textFaint }}>
              <span className="font-medium">
                Showing <span style={{ color: T.text, fontFamily: FONT.mono }}>{filtered.length}</span>{" "}
                of <span style={{ color: T.text, fontFamily: FONT.mono }}>{accounts.length}</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 980 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                    <th className="px-4 md:px-5 py-3 font-semibold">Account</th>
                    <th className="px-3 py-3 font-semibold">Owner</th>
                    <th className="px-3 py-3 font-semibold">Provider</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold w-40">Daily</th>
                    <th className="px-3 py-3 font-semibold w-40">Hourly</th>
                    <th className="px-4 md:px-5 py-3 font-semibold text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && accounts.length === 0 && (
                    <tr><td colSpan={7}>
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
                        <p className="mt-3 text-[12.5px] font-medium" style={{ color: T.textMuted }}>Loading sender accounts…</p>
                      </div>
                    </td></tr>
                  )}
                  {filtered.map((a) => {
                    const meta = providerMeta(a.provider);
                    const dailyPercent = pct(a.emails_sent_today ?? 0, a.daily_limit ?? 0);
                    const hourlyPercent = pct(a.emails_sent_hour ?? 0, a.hourly_limit ?? 0);
                    const ownerName = (a as any).owner_name;
                    const ownerEmail = (a as any).owner_email;
                    return (
                      <tr key={a.id} className="asa-row float-in transition-colors" style={{ borderTop: HAIRLINE_SOFT }}>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={a.display_name || a.email} brand={meta.brand} size={30} />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                {a.display_name || "Unnamed"}
                              </p>
                              <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                {a.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0 max-w-45">
                            <p className="text-[12px] font-medium truncate" style={{ color: T.text }}>
                              {ownerName || ownerEmail || (a.user_id != null ? `User #${a.user_id}` : "—")}
                            </p>
                            {ownerName && ownerEmail && (
                              <p className="text-[10.5px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                {ownerEmail}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3"><ProviderBadge provider={a.provider} /></td>
                        <td className="px-3 py-3"><StatusPill status={a.status} /></td>
                        <td className="px-3 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10.5px] mb-1">
                              <span style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                {(a.emails_sent_today ?? 0).toLocaleString()}
                              </span>
                              <span style={{ color: T.text, fontFamily: FONT.mono }}>
                                / {(a.daily_limit ?? 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${dailyPercent}%`, background: T.accent }} />
                            </div>
                            <p className="text-[9.5px] mt-1 font-medium"
                              style={{ color: T.textFaint, fontFamily: FONT.mono }}>{Math.round(dailyPercent)}%</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10.5px] mb-1">
                              <span style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                {(a.emails_sent_hour ?? 0).toLocaleString()}
                              </span>
                              <span style={{ color: T.text, fontFamily: FONT.mono }}>
                                / {(a.hourly_limit ?? 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${hourlyPercent}%`, background: T.accent }} />
                            </div>
                            <p className="text-[9.5px] mt-1 font-medium"
                              style={{ color: T.textFaint, fontFamily: FONT.mono }}>{Math.round(hourlyPercent)}%</p>
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <div className="asa-actions flex items-center justify-end gap-1">
                            <button onClick={() => { setDeleteError(null); setDeleteTarget(a); }}
                              className="p-1.5 rounded-md" style={{ color: T.danger }}
                              aria-label={`Disconnect ${a.display_name || a.email}`}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7}>
                      <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center"
                          style={{ background: T.surfaceHi, color: T.textFaint }}>
                          <Link2 size={22} />
                        </div>
                        <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                          {accounts.length === 0 ? "No sender accounts found" : "No accounts match"}
                        </h3>
                        <p className="mt-2 text-[12.5px] font-medium max-w-md" style={{ color: T.textMuted }}>
                          {accounts.length === 0
                            ? ctxError ? "Couldn't load accounts. Check the error above."
                              : "No user has connected a sender account yet."
                            : "Try adjusting your search or filters."}
                        </p>
                        {accounts.length > 0 && (
                          <button onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                            className="mt-4 text-[12px] font-semibold" style={{ color: T.brand }}>
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          account={deleteTarget}
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { if (!deleteBusy) { setDeleteTarget(null); setDeleteError(null); } }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

/* ─────────── Page export ─────────── */
const AdminSenderAccounts: React.FC = () => (
  <SenderAccountsProvider mode="admin">
    <Inner />
  </SenderAccountsProvider>
);

export default AdminSenderAccounts;