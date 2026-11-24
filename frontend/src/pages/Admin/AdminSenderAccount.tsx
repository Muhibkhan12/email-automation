// frontend/src/pages/admin/AdminSenderAccounts.tsx
import React, { useMemo, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  AtSign, Search, Trash2, RefreshCw,
  ShieldCheck, ShieldAlert, ShieldX, X, Menu, Send, 
  SlidersHorizontal, AlertTriangle, Loader2, Link2, Link2Off,
  CheckCircle, Gauge, User as UserIcon,
} from "lucide-react";
import {
  SenderAccountsProvider,
  useSenderAccounts,
} from "../../contexts/SenderAccountsContext";
import type { SenderAccount } from "../../types/SenderAccount";

/* ─────────────── design tokens — aligned with AdminDashboard ─────────────── */
const T = {
  bg: "#0E0F11", surface: "#151618", surface2: "#1B1C1F", surfaceHi: "#232427",
  border: "rgba(236,237,239,0.08)", borderSoft: "rgba(236,237,239,0.14)",
  text: "#ECEDEF", textMuted: "#A1A4AB", textFaint: "#6C7078",
  accent: "#F0884D", accentSoft: "rgba(240,136,77,0.12)", accentBorder: "rgba(240,136,77,0.35)",
  success: "#5FB07A", successSoft: "rgba(95,176,122,0.10)", successBorder: "rgba(95,176,122,0.28)",
  warn: "#D4A24C", warnSoft: "rgba(212,162,76,0.10)", warnBorder: "rgba(212,162,76,0.28)",
  danger: "#D8665D", dangerSoft: "rgba(216,102,93,0.10)", dangerBorder: "rgba(216,102,93,0.28)",
  info: "#6EC1E7", infoSoft: "rgba(110,193,231,0.10)", infoBorder: "rgba(110,193,231,0.28)",
  neutral1: "#C9CBD0", neutral2: "#8E9199", neutral3: "#5E6169", neutral4: "#44464C",
};
const FONT = {
  ui: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};
const RING = `inset 0 0 0 1px ${T.border}`;
const RING_SOFT = `inset 0 0 0 1px ${T.borderSoft}`;

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

const pct = (n: number, d: number) => (d > 0 ? Math.max(0, Math.min((n / d) * 100, 100)) : 0);
const initials = (s?: string) => (s || "?").trim()[0]?.toUpperCase() ?? "?";

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING }}>{children}</div>
);

const Avatar: React.FC<{ name?: string; size?: number; brand?: string }> = ({ name, size = 32, brand }) => {
  const bg = brand ?? T.accent;
  return (
    <div className="shrink-0 rounded-lg flex items-center justify-center font-medium text-white select-none"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
        fontFamily: FONT.mono,
      }} aria-hidden>
      {initials(name)}
    </div>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}>
      <Icon size={10} />{meta.label}
    </span>
  );
};

const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => {
  const meta = providerMeta(provider);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}`, fontFamily: FONT.mono }}>
      <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold"
        style={{ background: meta.fg, color: T.bg }}>{meta.short}</span>
      {provider || "Unknown"}
    </span>
  );
};

/* ─────────────── stat card with capacity bar ─────────────── */

const MetricCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  bar?: { value: number; limit: number; color: string };
}> = ({ label, value, hint, icon: Icon, accent, accentSoft, bar }) => (
  <Card className="p-4 relative overflow-hidden">
    <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: accent, opacity: 0.6 }} />
    <div className="flex items-start justify-between mb-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accentSoft, color: accent }}>
        <Icon size={14} strokeWidth={1.5} />
      </div>
      {bar && (
        <span className="text-[10.5px] font-medium tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
          {Math.round(pct(bar.value, bar.limit))}%
        </span>
      )}
    </div>
    <p className="text-[22px] font-medium leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2 font-medium" style={{ color: T.textMuted }}>{label}</p>
    {bar && (
      <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct(bar.value, bar.limit)}%`, background: bar.color }} />
      </div>
    )}
    {hint && <p className="text-[10px] mt-1.5 font-medium" style={{ color: T.textFaint, fontFamily: FONT.mono }}>{hint}</p>}
  </Card>
);

/* ─────────────── dual usage micro-bar ─────────────── */

const UsageCell: React.FC<{ sent: number; limit: number; label: string; tone: string }> = ({ sent, limit, label, tone }) => {
  const p = pct(sent, limit);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1 gap-2">
        <span style={{ color: T.textFaint, fontFamily: FONT.mono }}>{label}</span>
        <span style={{ color: T.textMuted, fontFamily: FONT.mono }}>
          <span style={{ color: T.text }}>{sent.toLocaleString()}</span>
          <span style={{ color: T.textFaint }}> / {limit.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surface2 }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${p}%`, background: p >= 80 ? T.warn : tone }} />
      </div>
    </div>
  );
};

/* ─────────────── delete modal ─────────────── */

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
  const ownerName = (account as any).owner_name;
  const ownerEmail = (account as any).owner_email;
  const owner = ownerName || ownerEmail;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: T.surface, boxShadow: `${RING}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}>
        <div className="p-5" style={{ borderBottom: RING_SOFT }}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: T.dangerSoft, color: T.danger }}>
              <Link2Off size={16} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-medium wrap-break-word" style={{ color: T.text }}>
                Disconnect "{label}"?
              </h3>
              <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
                The saved OAuth token will be deleted. {owner ? `${owner} can reconnect later.` : "The owner can reconnect later."}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[12px]"
          style={{ background: T.surface2, boxShadow: RING_SOFT }}>
          <Avatar name={label} brand={meta.brand} size={28} />
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: T.text }}>{account.display_name || "Unnamed"}</p>
            <p className="truncate text-[11px] mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>{account.email}</p>
          </div>
          <span className="ml-auto text-[10px] shrink-0" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            #{account.id}
          </span>
        </div>
        {error && (
          <div className="mx-4 mt-3 rounded-lg px-3 py-2.5 flex items-start gap-2.5 text-[12px]"
            style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 p-4">
          <button onClick={onCancel} disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: RING }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ background: T.danger, color: "#fff" }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={1.5} />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── skeleton row ─────────────── */

const SkeletonRow: React.FC = () => (
  <tr style={{ borderTop: RING_SOFT }}>
    <td className="px-4 md:px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg" style={{ background: T.surface2 }} />
        <div className="space-y-1.5">
          <div className="h-2.5 w-32 rounded" style={{ background: T.surface2 }} />
          <div className="h-2 w-44 rounded" style={{ background: T.surface2 }} />
        </div>
      </div>
    </td>
    <td className="px-3 py-4"><div className="h-2.5 w-24 rounded" style={{ background: T.surface2 }} /></td>
    <td className="px-3 py-4"><div className="h-5 w-20 rounded" style={{ background: T.surface2 }} /></td>
    <td className="px-3 py-4"><div className="h-5 w-20 rounded-full" style={{ background: T.surface2 }} /></td>
    <td className="px-3 py-4"><div className="h-2 w-32 rounded" style={{ background: T.surface2 }} /></td>
    <td className="px-3 py-4"><div className="h-2 w-32 rounded" style={{ background: T.surface2 }} /></td>
    <td className="px-4 md:px-5 py-4"><div className="h-6 w-6 ml-auto rounded" style={{ background: T.surface2 }} /></td>
  </tr>
);

/* ─────────────── page ─────────────── */

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
  const warnCount = accounts.filter((a) => a.status === "Warning").length;
  const disconnectedCount = accounts.filter((a) => a.status === "Disconnected").length;
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

  return (
    <div className="flex w-full overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg, height: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0, 0, 1); }
        .asa-main::-webkit-scrollbar { width: 8px; }
        .asa-main::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }
        .asa-row { transition: background-color 120ms cubic-bezier(0.2, 0, 0, 1); }
        .asa-row:hover { background: rgba(236,237,239,0.03); }
        .asa-row .asa-actions { opacity: 0; transition: opacity 0.15s ease; }
        .asa-row:hover .asa-actions, .asa-row:focus-within .asa-actions { opacity: 1; }
        @media (hover: none) { .asa-row .asa-actions { opacity: 1; } }
        select option { background: ${T.surface2}; color: ${T.text}; }
        .btn-quiet:hover { background: rgba(236,237,239,0.05); color: ${T.text}; }
      `}</style>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="asa-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1440 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2 rounded-lg btn-quiet"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }} aria-label="Open menu">
                <Menu size={16} strokeWidth={1.5} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: T.accentSoft, color: T.accent, fontFamily: FONT.mono }}>
                    <span style={{ width: 4, height: 4, borderRadius: 99, background: T.accent }} />
                    Admin view
                  </span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {accounts.length} account{accounts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>
                  Sender accounts
                </h1>
                <p className="mt-2 text-[12px] max-w-2xl" style={{ color: T.textMuted }}>
                  Every connected account across all users — health, capacity, and ownership at a glance.
                </p>
              </div>
            </div>
            <button onClick={refresh} disabled={loading}
              className="btn-quiet inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium disabled:opacity-60 self-start md:self-auto"
              style={{ color: T.textMuted, background: T.surface, boxShadow: RING }}>
              <RefreshCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </header>

          {flash && (
            <div className="rounded-lg px-4 py-3 flex items-start gap-2.5 text-[12px] float-in"
              style={{
                background: flash.type === "success" ? T.successSoft : T.dangerSoft,
                color: flash.type === "success" ? T.success : T.danger,
                boxShadow: `inset 0 0 0 1px ${flash.type === "success" ? T.successBorder : T.dangerBorder}`,
              }}>
              {flash.type === "success" ? <CheckCircle size={14} className="mt-0.5 shrink-0" />
                : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <span className="flex-1 font-medium">{flash.msg}</span>
              <button onClick={() => setFlash(null)} className="shrink-0 p-1 rounded-md" aria-label="Dismiss"><X size={12} /></button>
            </div>
          )}

          {ctxError && (
            <div className="rounded-lg px-4 py-3 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="flex-1 font-medium">{ctxError}</span>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total accounts"
              value={String(accounts.length)}
              hint={`${warnCount + disconnectedCount} need attention`}
              icon={AtSign}
              accent={T.accent}
              accentSoft={T.accentSoft}
            />
            <MetricCard
              label="Active"
              value={String(activeCount)}
              hint={accounts.length ? `${Math.round((activeCount / accounts.length) * 100)}% of fleet` : "No accounts yet"}
              icon={ShieldCheck}
              accent={T.success}
              accentSoft={T.successSoft}
            />
            <MetricCard
              label="Emails today"
              value={emailsToday.toLocaleString()}
              hint={dailyCapacity ? `of ${dailyCapacity.toLocaleString()} daily` : "No capacity set"}
              icon={Send}
              accent={T.info}
              accentSoft={T.infoSoft}
              bar={{ value: emailsToday, limit: dailyCapacity, color: T.info }}
            />
            <MetricCard
              label="Daily capacity"
              value={dailyCapacity.toLocaleString()}
              hint={`${Math.round(pct(emailsToday, dailyCapacity))}% used`}
              icon={Gauge}
              accent={T.neutral1}
              accentSoft={"rgba(201,203,208,0.10)"}
            />
          </div>

          {/* Filters */}
          <div className="rounded-xl p-3" style={{ background: T.surface, boxShadow: RING }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0"
                style={{ background: T.surface2, boxShadow: RING_SOFT }}>
                <Search size={13} strokeWidth={1.5} style={{ color: T.textFaint }} className="shrink-0" />
                <input placeholder="Search by name, email, provider, or owner…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[12.5px] outline-none" style={{ color: T.text }} />
                {search && (
                  <button onClick={() => setSearch("")} className="shrink-0 text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: T.textMuted }}>Clear</button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <SlidersHorizontal size={11} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: T.textFaint }} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: RING_SOFT, fontFamily: FONT.mono }}>
                    {["All", "Active", "Warning", "Disconnected"].map((f) =>
                      <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <AtSign size={11} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: T.textFaint }} />
                  <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: RING_SOFT, fontFamily: FONT.mono }}>
                    {["All", "Gmail", "Outlook"].map((p) =>
                      <option key={p} value={p}>{p === "All" ? "All providers" : p}</option>)}
                  </select>
                </div>
                {hasFilters && (
                  <button onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium"
                    style={{ background: T.surface2, color: T.accent, boxShadow: RING_SOFT, fontFamily: FONT.mono }}>
                    <X size={12} strokeWidth={1.5} /> Clear
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              <span>
                Showing <span style={{ color: T.text }}>{filtered.length}</span>{" "}
                of <span style={{ color: T.text }}>{accounts.length}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.success }} /> {activeCount}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.warn }} /> {warnCount}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.danger }} /> {disconnectedCount}</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 980 }}>
                <thead>
                  <tr className="text-[12px]" style={{ color: T.textFaint, borderBottom: RING_SOFT }}>
                    <th className="px-4 md:px-5 py-3 font-normal">Account</th>
                    <th className="px-3 py-3 font-normal">Owner</th>
                    <th className="px-3 py-3 font-normal">Provider</th>
                    <th className="px-3 py-3 font-normal">Status</th>
                    <th className="px-3 py-3 font-normal w-40">Daily usage</th>
                    <th className="px-3 py-3 font-normal w-40">Hourly usage</th>
                    <th className="px-4 md:px-5 py-3 font-normal text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && accounts.length === 0 && (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  )}
                  {filtered.map((a) => {
                    const meta = providerMeta(a.provider);
                    const sm = statusMeta(a.status);
                    const ownerName = (a as any).owner_name;
                    const ownerEmail = (a as any).owner_email;
                    const ownerDisplay = ownerName || ownerEmail || (a.user_id != null ? `User #${a.user_id}` : "—");
                    return (
                      <tr key={a.id} className="asa-row float-in" style={{ borderTop: RING_SOFT, position: "relative" }}>
                        <td className="px-0 py-0 w-0" style={{ padding: 0 }}>
                          <span style={{
                            position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
                            background: sm.fg, opacity: 0.7,
                          }} aria-hidden />
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={a.display_name || a.email} brand={meta.brand} size={30} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>
                                {a.display_name || "Unnamed"}
                              </p>
                              <p className="text-[12px] truncate mt-1" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                {a.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0 max-w-45">
                            <p className="text-[12px] font-medium truncate flex items-center gap-1.5" style={{ color: T.text }}>
                              <UserIcon size={11} strokeWidth={1.5} style={{ color: T.textFaint }} className="shrink-0" />
                              {ownerDisplay}
                            </p>
                            {ownerName && ownerEmail && (
                              <p className="text-[11px] truncate mt-1" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                {ownerEmail}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3"><ProviderBadge provider={a.provider} /></td>
                        <td className="px-3 py-3"><StatusPill status={a.status} /></td>
                        <td className="px-3 py-3">
                          <UsageCell
                            label="Today"
                            sent={a.emails_sent_today ?? 0}
                            limit={a.daily_limit ?? 0}
                            tone={T.success}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <UsageCell
                            label="Hour"
                            sent={a.emails_sent_hour ?? 0}
                            limit={a.hourly_limit ?? 0}
                            tone={T.info}
                          />
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <div className="asa-actions flex items-center justify-end gap-1">
                            <button onClick={() => { setDeleteError(null); setDeleteTarget(a); }}
                              className="p-1.5 rounded-md btn-quiet" style={{ color: T.danger }}
                              aria-label={`Disconnect ${a.display_name || a.email}`}>
                              <Trash2 size={13} strokeWidth={1.5} />
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
                          style={{ background: T.surface2, color: T.textFaint }}>
                          <Link2 size={22} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-[14px] font-medium" style={{ color: T.text }}>
                          {accounts.length === 0 ? "No sender accounts yet" : "No accounts match"}
                        </h3>
                        <p className="mt-2 text-[12px] max-w-md" style={{ color: T.textMuted }}>
                          {accounts.length === 0
                            ? ctxError
                              ? "Couldn't load accounts. Check the error above."
                              : "No user has connected a sender account yet."
                            : "Try adjusting your search or filters."}
                        </p>
                        {accounts.length > 0 && (
                          <button onClick={() => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); }}
                            className="mt-4 text-[12px] font-medium" style={{ color: T.accent }}>
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