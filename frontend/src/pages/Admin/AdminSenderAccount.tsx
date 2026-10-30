// AdminSenderAccounts.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import {
  AdminSenderAccountsProvider,
  useAdminSenderAccounts,
} from "../../contexts/AdminSenderContext";
import type { AdminSenderAccount } from "../../services/AdminSenderAccountService";
import {
  AtSign, Plus, Search, Edit, Trash2, RefreshCw, CheckCircle2,
  Save, ShieldCheck, ShieldAlert, ShieldX, X, Menu, Send, Mail,
  SlidersHorizontal, AlertTriangle, Loader2, Link2, Link2Off,
  CheckCircle, ExternalLink, User,
} from "lucide-react";
import type { UpdateSenderAccountInput } from "../../types/SenderAccount";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg: "#0A0B10", surface: "#111319", surface2: "#161922", surfaceHi: "#1B1F2A",
  border: "#232838", borderSoft: "#1B1F2A",
  text: "#E9EBF0", textMuted: "#9CA3B4", textFaint: "#6B7280",
  brand: "#6366F1", brandSoft: "rgba(99,102,241,0.12)", brandBorder: "rgba(99,102,241,0.35)",
  success: "#22C55E", successSoft: "rgba(34,197,94,0.12)", successBorder: "rgba(34,197,94,0.35)",
  warn: "#F59E0B", warnSoft: "rgba(245,158,11,0.12)", warnBorder: "rgba(245,158,11,0.35)",
  danger: "#EF4444", dangerSoft: "rgba(239,68,68,0.12)", dangerBorder: "rgba(239,68,68,0.35)",
  info: "#38BDF8", infoSoft: "rgba(56,189,248,0.12)", infoBorder: "rgba(56,189,248,0.35)",
  purple: "#A78BFA", purpleSoft: "rgba(167,139,250,0.12)",
};

const FONT = {
  body: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

const STATUS_FILTERS = ["All", "Active", "Warning", "Disconnected"] as const;
const PROVIDER_FILTERS = ["All", "Gmail", "Outlook"] as const;

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
  STATUS_META[raw as KnownStatus] ?? {
    fg: T.textMuted, bg: T.surface2, ring: T.borderSoft, icon: ShieldAlert, label: raw || "Unknown",
  };

const providerMeta = (raw: string) =>
  PROVIDER_META[raw as KnownProvider] ?? {
    fg: T.textMuted, bg: T.surface2, ring: T.borderSoft,
    short: (raw?.[0] ?? "?").toUpperCase(), brand: T.textMuted,
  };

const ownerLabel = (a: AdminSenderAccount) =>
  a.owner_name || a.owner_email || (a.user_id ? `User #${a.user_id}` : "—");

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING }}>{children}</div>
);

const Avatar: React.FC<{ name?: string; size?: number; brand?: string }> = ({ name, size = 30, brand }) => {
  const initial = (name || "?").trim()[0]?.toUpperCase() ?? "?";
  const bg = brand ?? T.brand;
  return (
    <div
      className="shrink-0 rounded-md flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
};

const StatCard: React.FC<{
  title: string; value: string; icon: React.ElementType; accent: string; accentSoft: string;
}> = ({ title, value, icon: Icon, accent, accentSoft }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: accentSoft, color: accent }}>
        <Icon size={14} />
      </div>
    </div>
    <p className="text-[24px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>{value}</p>
    <p className="text-[11.5px] mt-2" style={{ color: T.textMuted }}>{title}</p>
  </Card>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
    >
      <Icon size={10} />{meta.label}
    </span>
  );
};

const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => {
  const meta = providerMeta(provider);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}`, fontFamily: FONT.mono }}
    >
      <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold" style={{ background: meta.fg, color: T.bg }}>
        {meta.short}
      </span>
      {provider || "Unknown"}
    </span>
  );
};

const OutlookLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="8" height="8" rx="1" fill="#F25022" />
    <rect x="13" y="3" width="8" height="8" rx="1" fill="#7FBA00" />
    <rect x="3" y="13" width="8" height="8" rx="1" fill="#00A4EF" />
    <rect x="13" y="13" width="8" height="8" rx="1" fill="#FFB900" />
  </svg>
);

const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.3 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.3 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.4C29.4 34.6 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.4 5.4C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/* ─────────────── form helpers ─────────────── */

interface FormState {
  display_name: string;
  status: string;
  daily_limit: number;
  hourly_limit: number;
}

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
      {label}
      {required && <span className="ml-1" style={{ color: T.danger }}>*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[10.5px]" style={{ color: T.textFaint }}>{hint}</p>}
  </div>
);

const inputCls = "w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all";
const inputStyle: React.CSSProperties = {
  background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
};
const onFocusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`);
const onFocusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`);

/* ─────────────── connect modal ─────────────── */

const PROVIDERS = [
  {
    id: "outlook" as const, label: "Outlook / Microsoft 365",
    description: "Connect a Microsoft work, school, or personal account.",
    Logo: OutlookLogo, accent: "#0078D4", endpoint: "/sender-accounts/oauth/outlook/start",
  },
  {
    id: "gmail" as const, label: "Gmail / Google Workspace",
    description: "Connect a Google account with Gmail send permissions.",
    Logo: GoogleLogo, accent: "#EA4335", endpoint: "/sender-accounts/oauth/gmail/start",
  },
];

const ConnectModal: React.FC<{
  busyId: string | null; error: string | null; onClose: () => void;
  onConnect: (providerId: "outlook" | "gmail") => void;
}> = ({ busyId, error, onClose, onConnect }) => (
  <div
    className="fixed inset-0 z-60 flex items-center justify-center p-4"
    onClick={() => !busyId && onClose()}
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    role="dialog" aria-modal="true"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-xl rounded-2xl overflow-hidden modal-pop"
      style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: T.borderSoft }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: T.brandSoft, color: T.brand }}>
            <Link2 size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold truncate" style={{ color: T.text }}>Connect a sender account</h2>
            <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
              Authorize a mailbox with an OAuth provider. You'll be redirected back when done.
            </p>
          </div>
        </div>
        <button
          onClick={onClose} disabled={!!busyId} aria-label="Close"
          className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-50"
          style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-2.5">
        {error && (
          <div className="rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-[12px]"
            style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        {PROVIDERS.map((p) => {
          const Logo = p.Logo;
          const busy = busyId === p.id;
          const disabled = !!busyId && !busy;
          return (
            <button
              key={p.id} onClick={() => onConnect(p.id)} disabled={disabled || busy}
              className="w-full text-left rounded-lg px-3.5 py-3 transition-colors hover:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <span className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                style={{ background: T.surfaceHi, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                <Logo size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-semibold" style={{ color: T.text }}>{p.label}</span>
                <span className="block text-[11px] mt-0.5" style={{ color: T.textMuted }}>{p.description}</span>
              </span>
              <span
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md"
                style={{ color: p.accent, background: `${p.accent}1A`, boxShadow: `inset 0 0 0 1px ${p.accent}44` }}
              >
                {busy ? (<><Loader2 size={11} className="animate-spin" /> Redirecting…</>) : (<>Connect <ExternalLink size={11} /></>)}
              </span>
            </button>
          );
        })}

        <p className="text-[10.5px] leading-relaxed pt-1" style={{ color: T.textFaint }}>
          We never see your password. The provider issues a scoped token that only allows sending
          email from the account you select. You can revoke access anytime from the provider's security settings.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: T.borderSoft }}>
        <button
          onClick={onClose} disabled={!!busyId}
          className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
          style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────── delete confirm ─────────────── */

const DeleteConfirmModal: React.FC<{
  account: AdminSenderAccount; busy: boolean; onCancel: () => void; onConfirm: () => void;
}> = ({ account, busy, onCancel, onConfirm }) => {
  const meta = providerMeta(account.provider);
  const label = account.display_name || account.email;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      role="dialog" aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden modal-pop"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
      >
        <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: T.dangerSoft, color: T.danger }}>
              <Link2Off size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold wrap-break-word" style={{ color: T.text }}>Disconnect “{label}”?</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                The saved OAuth token will be deleted and the owner will no longer be able to send from this account.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[12px]"
          style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
          <Avatar name={account.display_name || account.email} brand={meta.brand} size={28} />
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: T.text }}>{account.display_name || "Unnamed"}</p>
            <p className="truncate text-[11px] mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>{account.email}</p>
            <p className="truncate text-[10.5px] mt-0.5" style={{ color: T.textFaint }}>Owner: {ownerLabel(account)}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4">
          <button
            onClick={onCancel} disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: T.danger, boxShadow: "0 6px 18px -8px rgba(239,68,68,0.65)" }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── edit modal ─────────────── */

const EditModal: React.FC<{
  account: AdminSenderAccount; form: FormState; saving: boolean; error: string | null;
  onChange: (f: FormState) => void; onClose: () => void; onSave: () => void;
}> = ({ account, form, saving, error, onChange, onClose, onSave }) => {
  const meta = providerMeta(account.provider);
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      role="dialog" aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl overflow-hidden modal-pop"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: meta.bg, color: meta.fg }}>
              <AtSign size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold truncate" style={{ color: T.text }}>Edit sender account</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>Update display name, limits, and status.</p>
            </div>
          </div>
          <button
            onClick={onClose} disabled={saving} aria-label="Close"
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="rounded-lg px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
            <Avatar name={account.display_name || account.email} brand={meta.brand} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium" style={{ color: T.text }}>{account.email}</p>
              <p className="truncate text-[10.5px] mt-0.5" style={{ color: T.textMuted }}>
                Connected via {account.provider} OAuth · Owner: {ownerLabel(account)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Display name" required>
              <input
                type="text" value={form.display_name} placeholder="Marketing"
                onChange={(e) => onChange({ ...form, display_name: e.target.value })}
                className={inputCls} style={inputStyle} onFocus={onFocusIn} onBlur={onFocusOut}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => onChange({ ...form, status: e.target.value })}
                className={inputCls} style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Warning">Warning</option>
                <option value="Disconnected">Disconnected</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Daily limit" hint={`Sent today: ${account.emails_sent_today.toLocaleString()}`}>
              <input
                type="number" min={0} value={form.daily_limit}
                onChange={(e) => onChange({ ...form, daily_limit: Math.max(0, parseInt(e.target.value) || 0) })}
                className={inputCls} style={{ ...inputStyle, fontFamily: FONT.mono }} onFocus={onFocusIn} onBlur={onFocusOut}
              />
            </Field>
            <Field label="Hourly limit" hint={`Sent this hour: ${account.emails_sent_hour.toLocaleString()}`}>
              <input
                type="number" min={0} value={form.hourly_limit}
                onChange={(e) => onChange({ ...form, hourly_limit: Math.max(0, parseInt(e.target.value) || 0) })}
                className={inputCls} style={{ ...inputStyle, fontFamily: FONT.mono }} onFocus={onFocusIn} onBlur={onFocusOut}
              />
            </Field>
          </div>

          <p className="text-[10.5px] leading-relaxed" style={{ color: T.textFaint }}>
            Email and provider can't be changed — they're tied to the connected OAuth grant.
            To switch mailboxes, disconnect and connect a new one.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: T.borderSoft }}>
          <button
            onClick={onClose} disabled={saving}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── usage cell ─────────────── */

const getUsagePercent = (sent: number, limit: number) => {
  if (!limit || limit <= 0) return 0;
  return Math.max(0, Math.min((sent / limit) * 100, 100));
};

const usageTone = (percent: number) => (percent >= 90 ? T.danger : percent >= 70 ? T.warn : T.success);

const UsageCell: React.FC<{ sent: number; limit: number }> = ({ sent, limit }) => {
  const percent = getUsagePercent(sent, limit);
  const tone = usageTone(percent);
  return (
    <div className="w-32">
      <div className="flex items-center justify-between text-[10.5px] mb-1">
        <span style={{ color: T.textMuted, fontFamily: FONT.mono }}>{sent.toLocaleString()}</span>
        <span style={{ color: T.text, fontFamily: FONT.mono }}>/ {limit.toLocaleString()}</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: tone }} />
      </div>
      <p className="text-[9.5px] mt-1" style={{ color: tone, fontFamily: FONT.mono }}>{Math.round(percent)}%</p>
    </div>
  );
};

/* ─────────────── page ─────────────── */

const AdminSenderAccountsPage: React.FC = () => {
  const { accounts, scope, loading, error, refresh, updateAccount, deleteAccount } = useAdminSenderAccounts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showConnect, setShowConnect] = useState(false);
  const [connectBusyId, setConnectBusyId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [editingAccount, setEditingAccount] = useState<AdminSenderAccount | null>(null);
  const [formData, setFormData] = useState<FormState>({ display_name: "", status: "Active", daily_limit: 500, hourly_limit: 100 });
  const [deleteTarget, setDeleteTarget] = useState<AdminSenderAccount | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (type: "success" | "error", msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ type, msg });
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  };

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  /* OAuth redirect result */
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorCode = searchParams.get("error");
    if (!connected && !errorCode) return;

    if (connected) {
      showFlash("success", `Connected ${connected === "gmail" ? "Gmail" : "Outlook"} account.`);
      refresh();
    } else if (errorCode) {
      const human =
        errorCode === "access_denied"   ? "You cancelled the consent screen." :
        errorCode === "invalid_state"   ? "OAuth state check failed. Please retry." :
        errorCode === "exchange_failed" ? "Token exchange with the provider failed." :
        errorCode === "provider_error"  ? "The provider returned an error." :
        `Connection failed (${errorCode}).`;
      showFlash("error", human);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("connected");
    next.delete("error");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.email ?? "").toLowerCase().includes(q) ||
          (a.display_name ?? "").toLowerCase().includes(q) ||
          (a.provider ?? "").toLowerCase().includes(q) ||
          (a.owner_name ?? "").toLowerCase().includes(q) ||
          (a.owner_email ?? "").toLowerCase().includes(q) ||
          (a.user_id ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") result = result.filter((a) => a.status === statusFilter);
    if (providerFilter !== "All") result = result.filter((a) => a.provider === providerFilter);
    return result;
  }, [accounts, search, statusFilter, providerFilter]);

  const activeCount = accounts.filter((a) => a.status === "Active").length;
  const emailsToday = accounts.reduce((s, a) => s + (a.emails_sent_today ?? 0), 0);
  const dailyCapacity = accounts.reduce((s, a) => s + (a.daily_limit ?? 0), 0);
  const hasActiveFilters = !!search || statusFilter !== "All" || providerFilter !== "All";

  const clearFilters = () => { setSearch(""); setStatusFilter("All"); setProviderFilter("All"); };

  /* connect */
  const openConnectModal = () => {
    setConnectError(null);
    setConnectBusyId(null);
    setShowConnect(true);
  };

  const handleConnect = async (providerId: "outlook" | "gmail") => {
    setConnectError(null);
    setConnectBusyId(providerId);
    try {
      const provider = PROVIDERS.find((p) => p.id === providerId);
      if (!provider) throw new Error("Unknown provider");

      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}${provider.endpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ redirect_uri: `${window.location.origin}/admin/senders-account` }),
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Backend returned ${res.status}`);
      }

      const data = await res.json();
      const authorizeUrl: string | undefined = data?.authorize_url ?? data?.url ?? data?.redirect_url;
      if (!authorizeUrl) throw new Error("Backend did not return an authorize_url.");
      window.location.href = authorizeUrl;
    } catch (e: any) {
      setConnectError(e?.message ?? "Failed to start OAuth flow.");
      setConnectBusyId(null);
    }
  };

  /* edit */
  const openEditModal = (account: AdminSenderAccount) => {
    setEditError(null);
    setEditingAccount(account);
    setFormData({
      display_name: account.display_name ?? "",
      status: account.status || "Active",
      daily_limit: account.daily_limit ?? 500,
      hourly_limit: account.hourly_limit ?? 100,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;

    const display_name = formData.display_name.trim();
    if (!display_name) return setEditError("Display name is required.");
    if (formData.daily_limit > 0 && formData.hourly_limit > formData.daily_limit) {
      return setEditError("Hourly limit can't be higher than the daily limit.");
    }

    setSaving(true);
    setEditError(null);
    try {
      const payload: UpdateSenderAccountInput = {
        display_name,
        status: formData.status,
        daily_limit: formData.daily_limit,
        hourly_limit: formData.hourly_limit,
      };
      await updateAccount(editingAccount.id, payload);
      setEditingAccount(null);
      showFlash("success", "Sender account updated.");
    } catch (e: any) {
      setEditError(e?.response?.data?.detail ?? e?.message ?? "Failed to update sender account.");
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      showFlash("success", "Sender account disconnected.");
    } catch (e: any) {
      setDeleteTarget(null);
      setActionError(e?.response?.data?.detail ?? e?.message ?? "Failed to disconnect sender account.");
    } finally {
      setDeletingId(null);
    }
  };

  const showEmpty = !loading && filteredAccounts.length === 0;

  return (
    <div className="flex w-full overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .asa-main::-webkit-scrollbar { width: 8px; }
        .asa-main::-webkit-scrollbar-track { background: transparent; }
        .asa-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .asa-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        .asa-row:hover { background: rgba(255,255,255,0.02); }
        .asa-row .asa-actions { opacity: 0; transition: opacity 0.15s ease; }
        .asa-row:hover .asa-actions, .asa-row:focus-within .asa-actions { opacity: 1; }
        @media (hover: none) { .asa-row .asa-actions { opacity: 1; } }
        select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="asa-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
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
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}>
                    Admin
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {accounts.length} account{accounts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Sender accounts
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Every connected mailbox across all users. Manage limits, status, and disconnect accounts.
                </p>
              </div>
            </div>

            <button
              onClick={openConnectModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-white transition-all hover:brightness-110 self-start md:self-auto"
              style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
            >
              <Plus size={13} /> Connect account
            </button>
          </header>

          {/* Scope warning: admin route missing, showing only the admin's own accounts */}
          {scope === "mine" && (
            <div className="mb-5 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.warnSoft, color: T.warn, boxShadow: `inset 0 0 0 1px ${T.warnBorder}` }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span className="flex-1">
                The admin endpoint <code style={{ fontFamily: FONT.mono }}>/admin/sender-accounts</code> wasn't found, so this list
                only shows <b>your own</b> accounts. Point <code style={{ fontFamily: FONT.mono }}>ADMIN_BASE</code> in
                AdminSenderAccountService.ts at a route that returns all users' accounts.
              </span>
            </div>
          )}

          {/* Flash toast */}
          {flash && (
            <div
              className="mb-5 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-[12px] float-in"
              style={{
                background: flash.type === "success" ? T.successSoft : T.dangerSoft,
                color: flash.type === "success" ? T.success : T.danger,
                boxShadow: `inset 0 0 0 1px ${flash.type === "success" ? T.successBorder : T.dangerBorder}`,
              }}
            >
              {flash.type === "success" ? <CheckCircle size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
              <span className="flex-1">{flash.msg}</span>
              <button onClick={() => setFlash(null)} className="shrink-0 p-1 rounded-md hover:bg-black/20" aria-label="Dismiss"><X size={12} /></button>
            </div>
          )}

          {/* Persistent error */}
          {(actionError || error) && (
            <div className="mb-5 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span className="flex-1">{actionError || error}</span>
              <button onClick={() => setActionError(null)} className="shrink-0 p-1 rounded-md hover:bg-black/20" aria-label="Dismiss"><X size={12} /></button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Total accounts" value={String(accounts.length)}        icon={AtSign}       accent={T.brand}   accentSoft={T.brandSoft} />
            <StatCard title="Active"         value={String(activeCount)}            icon={CheckCircle2} accent={T.success} accentSoft={T.successSoft} />
            <StatCard title="Emails today"   value={emailsToday.toLocaleString()}   icon={Send}         accent={T.info}    accentSoft={T.infoSoft} />
            <StatCard title="Daily capacity" value={dailyCapacity.toLocaleString()} icon={Mail}         accent={T.purple}  accentSoft={T.purpleSoft} />
          </div>

          {/* Command bar */}
          <div className="rounded-xl p-3 mb-5 sticky top-3 z-20" style={{ background: T.surface, boxShadow: RING }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
              >
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input
                  placeholder="Search by name, email, owner, or provider…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[13px] outline-none"
                  style={{ color: T.text }}
                  aria-label="Search sender accounts"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5" style={{ color: T.textMuted }}>
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <SlidersHorizontal size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    aria-label="Filter by status"
                  >
                    {STATUS_FILTERS.map((f) => <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <AtSign size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                  <select
                    value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    aria-label="Filter by provider"
                  >
                    {PROVIDER_FILTERS.map((p) => <option key={p} value={p}>{p === "All" ? "All providers" : p}</option>)}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors"
                    style={{ background: T.surface2, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <X size={11} /> Clear
                  </button>
                )}

                <button
                  onClick={() => refresh()} disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
                  style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px]" style={{ color: T.textFaint }}>
              <span>
                Showing <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredAccounts.length}</span>{" "}
                of <span style={{ color: T.text, fontFamily: FONT.mono }}>{accounts.length}</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 1020 }}>
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                    <th className="px-4 md:px-5 py-2.5 font-medium" scope="col">Account</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Owner</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Provider</th>
                    <th className="px-3 py-2.5 font-medium" scope="col">Status</th>
                    <th className="px-3 py-2.5 font-medium w-40" scope="col">Daily</th>
                    <th className="px-3 py-2.5 font-medium w-40" scope="col">Hourly</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium text-right" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>

                <tbody>
                  {loading && accounts.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="py-20 flex flex-col items-center justify-center">
                          <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
                          <p className="mt-3 text-[12.5px]" style={{ color: T.textMuted }}>Loading sender accounts…</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filteredAccounts.map((account) => {
                    const isDeleting = deletingId === account.id;
                    const meta = providerMeta(account.provider);
                    return (
                      <tr key={account.id} className="asa-row float-in transition-colors" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={account.display_name || account.email} brand={meta.brand} size={30} />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{account.display_name || "Unnamed"}</p>
                              <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>{account.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 min-w-0 max-w-[180px]">
                            <User size={11} className="shrink-0" style={{ color: T.textFaint }} />
                            <span className="text-[11.5px] truncate" style={{ color: T.textMuted }} title={account.owner_email || undefined}>
                              {ownerLabel(account)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3"><ProviderBadge provider={account.provider} /></td>
                        <td className="px-3 py-3"><StatusPill status={account.status} /></td>
                        <td className="px-3 py-3"><UsageCell sent={account.emails_sent_today} limit={account.daily_limit} /></td>
                        <td className="px-3 py-3"><UsageCell sent={account.emails_sent_hour} limit={account.hourly_limit} /></td>

                        <td className="px-4 md:px-5 py-3 text-right">
                          <div className="asa-actions flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(account)}
                              aria-label={`Edit ${account.display_name || account.email}`}
                              className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                              style={{ color: T.textMuted }}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(account)}
                              disabled={isDeleting}
                              aria-label={`Disconnect ${account.display_name || account.email}`}
                              className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                              style={{ color: T.danger }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = T.dangerSoft)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {showEmpty && (
                    <tr>
                      <td colSpan={7}>
                        <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                          <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center" style={{ background: T.brandSoft, color: T.brand }}>
                            <Link2 size={22} />
                          </div>
                          <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>
                            {accounts.length === 0 ? "No connected accounts" : "No accounts match"}
                          </h3>
                          <p className="mt-2 text-[12.5px] max-w-md" style={{ color: T.textMuted }}>
                            {accounts.length === 0
                              ? "Connect a Gmail or Outlook mailbox to start sending."
                              : "Try adjusting your search or filters."}
                          </p>
                          {accounts.length === 0 ? (
                            <button
                              onClick={openConnectModal}
                              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110"
                              style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
                            >
                              <Plus size={12} /> Connect account
                            </button>
                          ) : (
                            <button onClick={clearFilters} className="mt-4 text-[12px] font-medium" style={{ color: T.brand }}>
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
          </div>
        </div>
      </main>

      {showConnect && (
        <ConnectModal
          busyId={connectBusyId}
          error={connectError}
          onClose={() => { if (!connectBusyId) setShowConnect(false); }}
          onConnect={handleConnect}
        />
      )}

      {editingAccount && (
        <EditModal
          account={editingAccount}
          form={formData}
          saving={saving}
          error={editError}
          onChange={setFormData}
          onClose={() => !saving && setEditingAccount(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          account={deleteTarget}
          busy={deletingId === deleteTarget.id}
          onCancel={() => deletingId === null && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

/* ─────────────── export: page wrapped in its own admin provider ─────────────── */

const AdminSenderAccounts: React.FC = () => (
  <AdminSenderAccountsProvider>
    <AdminSenderAccountsPage />
  </AdminSenderAccountsProvider>
);

export default AdminSenderAccounts;