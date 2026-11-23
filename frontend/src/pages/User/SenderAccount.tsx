// frontend/src/pages/MySenderAccounts.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  AtSign, Search, Trash2, RefreshCw, Plus, X, Send, Mail,
  SlidersHorizontal, AlertTriangle, Loader2, Link2, Link2Off,
  CheckCircle, ShieldCheck, ShieldAlert, ShieldX, Edit3, Save,
} from "lucide-react";
import {
  SenderAccountsProvider,
  useSenderAccounts,
} from "../../contexts/SenderAccountsContext";
import type {
  SenderAccount,
  CreateSenderAccountInput,
} from "../../types/SenderAccount";
// NOTE: adjust this path/name to match where your sidebar component lives

import Sidebar from "./Sidebar";

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

const PROVIDERS = ["Gmail", "Outlook"] as const;
type KnownStatus = "Active" | "Warning" | "Disconnected";

const STATUS_META: Record<KnownStatus, { fg: string; bg: string; ring: string; icon: React.ElementType }> = {
  Active:       { fg: T.success, bg: T.successSoft, ring: T.successBorder, icon: ShieldCheck },
  Warning:      { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    icon: ShieldAlert },
  Disconnected: { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  icon: ShieldX },
};

const providerBrand = (p: string) =>
  p === "Gmail" ? "#EA4335" : p === "Outlook" ? "#0078D4" : T.brand;

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

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status as KnownStatus];
  const Icon = meta?.icon ?? ShieldAlert;
  const m = meta ?? { fg: T.textMuted, bg: T.surface2, ring: T.borderSoft, icon: ShieldAlert };
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: m.bg, color: m.fg, border: `1px solid ${m.ring}` }}>
      <Icon size={10} />{status || "Unknown"}
    </span>
  );
};

const UsageBar: React.FC<{ sent: number; limit: number }> = ({ sent, limit }) => {
  const pct = limit > 0 ? Math.max(0, Math.min((sent / limit) * 100, 100)) : 0;
  return (
    <div className="w-32">
      <div className="flex items-center justify-between text-[10.5px] mb-1">
        <span style={{ color: T.textMuted, fontFamily: FONT.mono }}>{sent.toLocaleString()}</span>
        <span style={{ color: T.text, fontFamily: FONT.mono }}>/ {limit.toLocaleString()}</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: T.accent }} />
      </div>
      <p className="text-[9.5px] mt-1 font-medium" style={{ color: T.textFaint, fontFamily: FONT.mono }}>{Math.round(pct)}%</p>
    </div>
  );
};

/* ─────────── Add / Edit modal ─────────── */
const AccountFormModal: React.FC<{
  open: boolean;
  mode: "create" | "edit";
  initial?: SenderAccount | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CreateSenderAccountInput) => void;
}> = ({ open, mode, initial, busy, error, onClose, onSubmit }) => {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [provider, setProvider] = useState(initial?.provider ?? "Gmail");
  const [daily, setDaily] = useState<number>(initial?.daily_limit ?? 500);
  const [hourly, setHourly] = useState<number>(initial?.hourly_limit ?? 50);

  React.useEffect(() => {
    if (!open) return;
    setDisplayName(initial?.display_name ?? "");
    setEmail(initial?.email ?? "");
    setProvider(initial?.provider ?? "Gmail");
    setDaily(initial?.daily_limit ?? 500);
    setHourly(initial?.hourly_limit ?? 50);
  }, [open, initial]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      display_name: displayName.trim(),
      email: email.trim(),
      provider,
      daily_limit: Number(daily) || 0,
      hourly_limit: Number(hourly) || 0,
    } as CreateSenderAccountInput);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
      style={{ background: "rgba(11,12,14,0.72)", backdropFilter: "blur(4px)" }} role="dialog" aria-modal="true">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: T.surface, border: HAIRLINE, boxShadow: "0 24px 64px -16px rgba(0,0,0,0.7)" }}>
        <div className="p-5 border-b flex items-start justify-between gap-3" style={{ borderColor: T.borderSoft }}>
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
              {mode === "create" ? "Add sender account" : "Edit sender account"}
            </h3>
            <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
              {mode === "create"
                ? "Connect a Gmail or Outlook account you own."
                : "Update the saved account details."}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy}
            className="p-1.5 rounded-md" style={{ color: T.textMuted }} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-medium mb-1 block" style={{ color: T.textMuted }}>Display name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
              placeholder="Sales team"
              className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none"
              style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }} />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium mb-1 block" style={{ color: T.textMuted }}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="sender@example.com"
              className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none"
              style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT, fontFamily: FONT.mono }} />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium mb-1 block" style={{ color: T.textMuted }}>Provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none cursor-pointer"
              style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium mb-1 block" style={{ color: T.textMuted }}>Daily limit</span>
              <input type="number" min={0} value={daily} onChange={(e) => setDaily(Number(e.target.value))}
                className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none"
                style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT, fontFamily: FONT.mono }} />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium mb-1 block" style={{ color: T.textMuted }}>Hourly limit</span>
              <input type="number" min={0} value={hourly} onChange={(e) => setHourly(Number(e.target.value))}
                className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none"
                style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT, fontFamily: FONT.mono }} />
            </label>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2.5 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, border: `1px solid ${T.dangerBorder}` }}>
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: T.borderSoft }}>
          <button type="button" onClick={onClose} disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ color: T.textMuted, border: HAIRLINE }}>Cancel</button>
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-semibold disabled:opacity-50"
            style={{ background: T.brand, color: "#fff", border: `1px solid ${T.brandBorder}` }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : mode === "create" ? <Plus size={12} /> : <Save size={12} />}
            {mode === "create" ? "Add account" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─────────── Delete confirm ─────────── */
const DeleteConfirmModal: React.FC<{
  account: SenderAccount | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ account, busy, error, onCancel, onConfirm }) => {
  if (!account) return null;
  const brand = providerBrand(account.provider);
  const label = account.display_name || account.email;
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
                This removes the saved account and its OAuth token. You can reconnect later.
              </p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[12px]"
          style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
          <Avatar name={label} brand={brand} size={28} />
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

/* ─────────── Inner page ─────────── */
const Inner: React.FC = () => {
  const {
    accounts, loading, error: ctxError, refresh,
    addSenderAccount, updateSenderAccount, deleteSenderAccount,
  } = useSenderAccounts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");

  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (type: "success" | "error", msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ type, msg });
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  };
  React.useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<SenderAccount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SenderAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filtered = useMemo(() => {
    let r = [...accounts];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((a) =>
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.display_name ?? "").toLowerCase().includes(q) ||
        (a.provider ?? "").toLowerCase().includes(q)
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

  const openCreate = () => {
    setFormMode("create");
    setEditTarget(null);
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (acc: SenderAccount) => {
    setFormMode("edit");
    setEditTarget(acc);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmitForm = async (data: CreateSenderAccountInput) => {
    setFormBusy(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        await addSenderAccount(data);
        showFlash("success", "Sender account added.");
      } else if (editTarget) {
        await updateSenderAccount(editTarget.id, data);
        showFlash("success", "Sender account updated.");
      }
      setFormOpen(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.detail ?? e?.message ?? "Failed to save sender account.");
    } finally {
      setFormBusy(false);
    }
  };

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
    <div className="flex w-full" style={{ fontFamily: FONT.ui, background: T.bg, minHeight: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .msa-row:hover { background: ${T.surface2}; }
        .msa-row .msa-actions { opacity: 0; transition: opacity 0.15s ease; }
        .msa-row:hover .msa-actions, .msa-row:focus-within .msa-actions { opacity: 1; }
        @media (hover: none) { .msa-row .msa-actions { opacity: 1; } }
        select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>

      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto" style={{ height: "100dvh" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
            <div>
              <h1 className="text-[24px] md:text-[26px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                My sender accounts
              </h1>
              <p className="mt-1 text-[13px] max-w-lg font-medium" style={{ color: T.textMuted }}>
                Connect and manage the email accounts you use to send campaigns.
              </p>
            </div>
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-semibold self-start md:self-auto"
              style={{ background: T.brand, color: "#fff", border: `1px solid ${T.brandBorder}` }}>
              <Plus size={13} /> Add sender account
            </button>
          </header>

          {flash && (
            <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5 text-[12px]"
              style={{
                background: flash.type === "success" ? T.successSoft : T.dangerSoft,
                color: flash.type === "success" ? T.success : T.danger,
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
            {[
              { title: "Total accounts", value: String(accounts.length), icon: AtSign, accent: T.brand, soft: T.brandSoft },
              { title: "Active", value: String(activeCount), icon: CheckCircle, accent: T.accent, soft: T.successSoft },
              { title: "Emails today", value: emailsToday.toLocaleString(), icon: Send, accent: T.info, soft: T.infoSoft },
              { title: "Daily capacity", value: dailyCapacity.toLocaleString(), icon: Mail, accent: T.purple, soft: T.purpleSoft },
            ].map(({ title, value, icon: Icon, accent, soft }) => (
              <Card key={title} className="p-4 relative overflow-hidden">
                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: accent, opacity: 0.6 }} />
                <div className="w-8 h-8 rounded-md flex items-center justify-center mb-3" style={{ background: soft, color: accent }}>
                  <Icon size={14} />
                </div>
                <p className="text-[24px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>{value}</p>
                <p className="text-[11.5px] mt-2 font-medium" style={{ color: T.textMuted }}>{title}</p>
              </Card>
            ))}
          </div>

          <div className="rounded-xl p-3 mb-5" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0"
                style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input placeholder="Search by name, email, provider…" value={search}
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
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 820 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                    <th className="px-4 md:px-5 py-3">Account</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 w-40">Daily</th>
                    <th className="px-3 py-3 w-40">Hourly</th>
                    <th className="px-4 md:px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && accounts.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
                        <p className="mt-3 text-[12.5px] font-medium" style={{ color: T.textMuted }}>Loading sender accounts…</p>
                      </div>
                    </td></tr>
                  )}
                  {filtered.map((a) => {
                    const brand = providerBrand(a.provider);
                    return (
                      <tr key={a.id} className="msa-row transition-colors" style={{ borderTop: HAIRLINE_SOFT }}>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={a.display_name || a.email} brand={brand} size={30} />
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
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
                            style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT, fontFamily: FONT.mono }}>
                            {a.provider || "Unknown"}
                          </span>
                        </td>
                        <td className="px-3 py-3"><StatusPill status={a.status} /></td>
                        <td className="px-3 py-3"><UsageBar sent={a.emails_sent_today ?? 0} limit={a.daily_limit ?? 0} /></td>
                        <td className="px-3 py-3"><UsageBar sent={a.emails_sent_hour ?? 0} limit={a.hourly_limit ?? 0} /></td>
                        <td className="px-4 md:px-5 py-3 text-right">
                          <div className="msa-actions flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(a)}
                              className="p-1.5 rounded-md" style={{ color: T.textMuted }} aria-label="Edit">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => { setDeleteError(null); setDeleteTarget(a); }}
                              className="p-1.5 rounded-md" style={{ color: T.danger }} aria-label="Disconnect">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center"
                          style={{ background: T.surfaceHi, color: T.textFaint }}>
                          <Link2 size={22} />
                        </div>
                        <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                          {accounts.length === 0 ? "No sender accounts yet" : "No accounts match"}
                        </h3>
                        <p className="mt-2 text-[12.5px] font-medium max-w-md" style={{ color: T.textMuted }}>
                          {accounts.length === 0
                            ? "Connect your first Gmail or Outlook account to start sending."
                            : "Try adjusting your search or filters."}
                        </p>
                        {accounts.length === 0 ? (
                          <button onClick={openCreate}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-semibold"
                            style={{ background: T.brand, color: "#fff", border: `1px solid ${T.brandBorder}` }}>
                            <Plus size={12} /> Add sender account
                          </button>
                        ) : (
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

      <AccountFormModal
        open={formOpen}
        mode={formMode}
        initial={editTarget}
        busy={formBusy}
        error={formError}
        onClose={() => { if (!formBusy) setFormOpen(false); }}
        onSubmit={handleSubmitForm}
      />

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
const MySenderAccounts: React.FC = () => (
  <SenderAccountsProvider mode="user">
    <Inner />
  </SenderAccountsProvider>
);

export default MySenderAccounts;