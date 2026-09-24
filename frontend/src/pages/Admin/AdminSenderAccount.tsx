// AdminSenderAccounts.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import AdminSidebar from "./AdminSidebar";
import {
  AtSign, Plus, Search, Edit, Trash2, RefreshCw, CheckCircle2,
  Save, ShieldCheck, ShieldAlert, ShieldX, X, Menu, Send, Mail,
  SlidersHorizontal, AlertTriangle, Loader2, Link2, Link2Off,
  CheckCircle, ExternalLink,
} from "lucide-react";
import type {
  SenderAccount,
  UpdateSenderAccountInput,
} from "../../types/SenderAccount";

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

const STATUS_FILTERS  = ["All", "Active", "Warning", "Disconnected"] as const;
const PROVIDER_FILTERS = ["All", "Gmail", "Outlook"] as const;

type KnownStatus = "Active" | "Warning" | "Disconnected";
type KnownProvider = "Gmail" | "Outlook";

const STATUS_META: Record<KnownStatus, { fg: string; bg: string; ring: string; icon: React.ElementType; label: string }> = {
  Active:       { fg: C.success, bg: C.successSoft, ring: C.successRing, icon: ShieldCheck, label: "Active" },
  Warning:      { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, icon: ShieldAlert, label: "Warning" },
  Disconnected: { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  icon: ShieldX,     label: "Disconnected" },
};

const PROVIDER_META: Record<KnownProvider, { fg: string; bg: string; ring: string; short: string; brand: string }> = {
  Gmail:   { fg: C.danger, bg: C.dangerSoft, ring: C.dangerRing, short: "G", brand: "#EA4335" },
  Outlook: { fg: C.blue,   bg: C.blueSoft,   ring: C.blueRing,   short: "O", brand: "#0078D4" },
};

const statusMeta = (raw: string) =>
  STATUS_META[raw as KnownStatus] ?? {
    fg: C.textMuted, bg: C.inner, ring: C.border,
    icon: ShieldAlert, label: raw || "Unknown",
  };

const providerMeta = (raw: string) =>
  PROVIDER_META[raw as KnownProvider] ?? {
    fg: C.textMuted, bg: C.inner, ring: C.border,
    short: (raw?.[0] ?? "?").toUpperCase(),
    brand: C.textMuted,
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

const Avatar: React.FC<{ name?: string; size?: number; brand?: string }> = ({ name, size = 36, brand }) => {
  const initial = (name || "?").trim()[0]?.toUpperCase() ?? "?";
  const bg = brand ?? C.primary;
  return (
    <div
      className="shrink-0 rounded-xl flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size, height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
        boxShadow: `0 8px 20px -10px ${bg}80, inset 0 0 0 1px rgba(255,255,255,0.06)`,
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

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
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

const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => {
  const meta = providerMeta(provider);
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
      {provider || "Unknown"}
    </span>
  );
};

/* Microsoft 4-square logo (mono-friendly, uses currentColor) */
const OutlookLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3"  y="3"  width="8" height="8" rx="1" fill="#F25022" />
    <rect x="13" y="3"  width="8" height="8" rx="1" fill="#7FBA00" />
    <rect x="3"  y="13" width="8" height="8" rx="1" fill="#00A4EF" />
    <rect x="13" y="13" width="8" height="8" rx="1" fill="#FFB900" />
  </svg>
);

/* Google "G" logo */
const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.3 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.3 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.4C29.4 34.6 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.4 5.4C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/* ─────────────────────────── Form shape ─────────────────────────── */

interface FormState {
  display_name: string;
  email: string;
  provider: string;
  status: string;
  daily_limit: number;
  hourly_limit: number;
}

const EMPTY_FORM: FormState = {
  display_name: "",
  email: "",
  provider: "Outlook",
  status: "Active",
  daily_limit: 500,
  hourly_limit: 100,
};

/* ─────────────────────────── Connect modal ─────────────────────────── */

const PROVIDERS = [
  {
    id: "outlook" as const,
    label: "Outlook / Microsoft 365",
    description: "Connect a Microsoft work, school, or personal account.",
    Logo: OutlookLogo,
    accent: "#0078D4",
    endpoint: "/sender-accounts/oauth/outlook/start",
  },
  {
    id: "gmail" as const,
    label: "Gmail / Google Workspace",
    description: "Connect a Google account with Gmail send permissions.",
    Logo: GoogleLogo,
    accent: "#EA4335",
    endpoint: "/sender-accounts/oauth/gmail/start",
  },
];

const ConnectModal: React.FC<{
  busyId: string | null;
  error: string | null;
  onClose: () => void;
  onConnect: (providerId: "outlook" | "gmail") => void;
}> = ({ busyId, error, onClose, onConnect }) => {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !busyId && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
            >
              <Link2 size={18} style={{ color: C.primary }} />
            </div>
            <div className="min-w-0">
              <h2
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                className="text-[16px] md:text-[18px] font-bold text-white truncate"
              >
                Connect a sender account
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                Authorize a mailbox with an OAuth provider. You'll be redirected back when done.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={!!busyId}
            aria-label="Close"
            className="shrink-0 p-2 rounded-2xl transition-colors disabled:opacity-50"
            style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-3">
          {error && (
            <div
              className="rounded-2xl px-3.5 py-3 flex items-start gap-3 text-[12.5px]"
              style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {PROVIDERS.map((p) => {
            const Logo = p.Logo;
            const busy = busyId === p.id;
            const disabled = !!busyId && !busy;

            return (
              <button
                key={p.id}
                onClick={() => onConnect(p.id)}
                disabled={disabled || busy}
                className="w-full text-left rounded-2xl px-4 py-3.5 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center gap-4"
                style={{
                  background: C.inner,
                  boxShadow: `inset 0 0 0 1px ${C.border}`,
                }}
              >
                <span
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.03)", boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <Logo size={22} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-semibold" style={{ color: C.dark }}>
                    {p.label}
                  </span>
                  <span className="block text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    {p.description}
                  </span>
                </span>
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                  style={{
                    color: p.accent,
                    background: `${p.accent}1A`,
                    boxShadow: `inset 0 0 0 1px ${p.accent}44`,
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Redirecting…
                    </>
                  ) : (
                    <>
                      Connect <ExternalLink size={12} />
                    </>
                  )}
                </span>
              </button>
            );
          })}

          <p className="text-[11px] leading-relaxed pt-1" style={{ color: C.textMuted }}>
            We never see your password. The provider issues a scoped token that only allows sending
            email from the account you select. You can revoke access anytime from the provider's
            security settings.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: C.border }}>
          <button
            onClick={onClose}
            disabled={!!busyId}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
            style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Delete confirm ─────────────────────────── */

const DeleteConfirmModal: React.FC<{
  account: SenderAccount | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ account, busy, onCancel, onConfirm }) => {
  if (!account) return null;
  const meta = providerMeta(account.provider);
  const label = account.display_name || account.email;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: C.surface }}
      >
        <div className="p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-start gap-3.5">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <Link2Off size={18} style={{ color: C.danger }} />
            </div>
            <div className="min-w-0">
              <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-bold text-white break-words">
                Disconnect “{label}”?
              </h3>
              <p className="text-[12.5px] mt-0.5" style={{ color: C.textMuted }}>
                The saved OAuth token will be deleted. You can reconnect later.
              </p>
            </div>
          </div>
        </div>

        <div
          className="mx-5 md:mx-6 mt-4 rounded-2xl px-3.5 py-3 flex items-center gap-3 text-[12px]"
          style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
        >
          <Avatar name={account.display_name || account.email} brand={meta.brand} size={32} />
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: C.dark }}>
              {account.display_name || "Unnamed"}
            </p>
            <p className="truncate text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
              {account.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 md:p-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
            style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold disabled:opacity-60"
            style={{ background: C.danger, color: "#0B0E13", boxShadow: "0 12px 30px -12px rgba(248,113,113,0.55)" }}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

const AdminSenderAccounts = () => {
  const context = useContext(SenderAccContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Modal state
  const [showConnect, setShowConnect] = useState(false);
  const [connectBusyId, setConnectBusyId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [editingAccount, setEditingAccount] = useState<SenderAccount | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SenderAccount | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (type: "success" | "error", msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ type, msg });
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  };

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  /* ── Read OAuth redirect params on mount ── */
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorCode = searchParams.get("error");

    if (connected) {
      showFlash("success", `Connected ${connected === "gmail" ? "Gmail" : "Outlook"} account.`);
      // Refresh list, then strip the query params so a page reload doesn't refire.
      context?.fetchAllSenderAccounts?.();
      const next = new URLSearchParams(searchParams);
      next.delete("connected");
      next.delete("error");
      setSearchParams(next, { replace: true });
    } else if (errorCode) {
      const human =
        errorCode === "access_denied"    ? "You cancelled the consent screen." :
        errorCode === "invalid_state"    ? "OAuth state check failed. Please retry." :
        errorCode === "exchange_failed"  ? "Token exchange with the provider failed." :
        errorCode === "provider_error"   ? "The provider returned an error." :
        `Connection failed (${errorCode}).`;
      showFlash("error", human);
      const next = new URLSearchParams(searchParams);
      next.delete("connected");
      next.delete("error");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    error,
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
          (a.display_name ?? "").toLowerCase().includes(q) ||
          (a.provider ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") result = result.filter((a) => a.status === statusFilter);
    if (providerFilter !== "All") result = result.filter((a) => a.provider === providerFilter);

    return result;
  }, [accounts, search, statusFilter, providerFilter]);

  const activeCount = accounts.filter((a) => a.status === "Active").length;
  const emailsToday = accounts.reduce((sum, a) => sum + (a.emails_sent_today ?? 0), 0);
  const dailyCapacity = accounts.reduce((sum, a) => sum + (a.daily_limit ?? 0), 0);

  const hasActiveFilters = !!search || statusFilter !== "All" || providerFilter !== "All";

  /* ── Connect flow ── */

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

      // Ask the backend for the provider's authorize URL.
      // Expected response: { authorize_url: string }  (or { url } / { redirect_url })
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}${provider.endpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            // If your backend also accepts a Bearer token for this endpoint,
            // the axios interceptor path will pick it up automatically when
            // you swap `fetch` for `api.post`. This raw fetch is used so we
            // don't depend on the axios instance here.
            ...(localStorage.getItem("access_token")
              ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
              : {}),
          },
          body: JSON.stringify({
            redirect_uri: `${window.location.origin}/admin/senders-account`,
          }),
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Backend returned ${res.status}`);
      }

      const data = await res.json();
      const authorizeUrl: string | undefined =
        data?.authorize_url ?? data?.url ?? data?.redirect_url;

      if (!authorizeUrl) {
        throw new Error("Backend did not return an authorize_url.");
      }

      // Leave the app — user lands on Microsoft/Google consent screen.
      window.location.href = authorizeUrl;
    } catch (e: any) {
      setConnectError(e?.message ?? "Failed to start OAuth flow.");
      setConnectBusyId(null);
    }
  };

  /* ── Edit flow ── */

  const openEditModal = (account: SenderAccount) => {
    setActionError(null);
    setEditingAccount(account);
    setFormData({
      display_name: account.display_name ?? "",
      email: account.email ?? "",
      provider: account.provider ?? "Outlook",
      status: account.status ?? "Active",
      daily_limit: account.daily_limit ?? 500,
      hourly_limit: account.hourly_limit ?? 100,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;

    const display_name = formData.display_name.trim();
    if (!display_name) {
      setActionError("Display name is required.");
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      const payload: UpdateSenderAccountInput = {
        display_name,
        status: formData.status,
        daily_limit: formData.daily_limit,
        hourly_limit: formData.hourly_limit,
      };
      await updateSenderAccount(editingAccount.id, payload);
      setEditingAccount(null);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to update sender account.";
      setActionError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete flow ── */

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteSenderAccount(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to disconnect sender account.";
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getUsagePercent = (sent: number, limit: number) => {
    if (!limit || limit <= 0) return 0;
    return Math.max(0, Math.min((sent / limit) * 100, 100));
  };

  const usageTone = (percent: number) =>
    percent >= 90 ? { fg: C.danger,  track: C.dangerSoft  } :
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

            {/* Header */}
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
                    Connect mailboxes via OAuth. No passwords, no SMTP credentials.
                  </p>
                </div>
              </div>

              <button
                onClick={openConnectModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 self-start md:self-auto"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                <Plus size={15} /> Connect account
              </button>
            </header>

            {/* Flash toast */}
            {flash && (
              <div
                className="mb-5 rounded-2xl px-4 py-3 flex items-start gap-3 text-[12.5px] float-in"
                style={{
                  background: flash.type === "success" ? C.successSoft : C.dangerSoft,
                  color: flash.type === "success" ? C.success : C.danger,
                  boxShadow: `inset 0 0 0 1px ${flash.type === "success" ? C.successRing : C.dangerRing}`,
                }}
              >
                {flash.type === "success"
                  ? <CheckCircle size={15} className="mt-0.5 shrink-0" />
                  : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                <span className="flex-1">{flash.msg}</span>
                <button
                  onClick={() => setFlash(null)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/20"
                  aria-label="Dismiss"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Persistent error */}
            {(actionError || error) && (
              <div
                className="mb-5 rounded-2xl px-4 py-3 flex items-start gap-3 text-[12.5px]"
                style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
              >
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span className="flex-1">{actionError || error}</span>
                <button
                  onClick={() => setActionError(null)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/20"
                  aria-label="Dismiss"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard title="Total accounts"  value={String(accounts.length)}          icon={AtSign}        accent={C.primary} accentSoft={C.primarySoft} accentRing={C.primaryRing} />
              <StatCard title="Active"          value={String(activeCount)}              icon={CheckCircle2}  accent={C.success} accentSoft={C.successSoft} accentRing={C.successRing} />
              <StatCard title="Emails today"    value={emailsToday.toLocaleString()}     icon={Send}          accent={C.blue}    accentSoft={C.blueSoft}    accentRing={C.blueRing} />
              <StatCard title="Daily capacity"  value={dailyCapacity.toLocaleString()}   icon={Mail}          accent={C.violet}  accentSoft={C.violetSoft}  accentRing={C.violetRing} />
            </div>

            {/* Command bar */}
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
                      {STATUS_FILTERS.map((f) => <option key={f} value={f}>{f === "All" ? "All statuses" : f}</option>)}
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

            {/* Table */}
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

                    {!loading && filteredAccounts.map((account) => {
                      const dailyPercent = getUsagePercent(account.emails_sent_today, account.daily_limit);
                      const hourlyPercent = getUsagePercent(account.emails_sent_hour, account.hourly_limit);
                      const dailyTone = usageTone(dailyPercent);
                      const hourlyTone = usageTone(hourlyPercent);
                      const isDeleting = deletingId === account.id;
                      const meta = providerMeta(account.provider);

                      return (
                        <tr key={account.id} className="asa-row float-in transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td className="px-4 md:px-6 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={account.display_name} brand={meta.brand} size={36} />
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-medium truncate" style={{ color: C.dark }}>
                                  {account.display_name || "Unnamed"}
                                </p>
                                <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5"><ProviderBadge provider={account.provider} /></td>
                          <td className="px-3 py-3.5"><StatusPill status={account.status} /></td>

                          <td className="px-3 py-3.5">
                            <div className="w-[140px]">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.emails_sent_today.toLocaleString()}
                                </span>
                                <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                                  / {account.daily_limit.toLocaleString()}
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

                          <td className="px-3 py-3.5">
                            <div className="w-[140px]">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                                  {account.emails_sent_hour.toLocaleString()}
                                </span>
                                <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                                  / {account.hourly_limit.toLocaleString()}
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

                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <div className="asa-actions flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(account)}
                                aria-label={`Edit ${account.display_name || account.email}`}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(account)}
                                disabled={isDeleting}
                                aria-label={`Disconnect ${account.display_name || account.email}`}
                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: C.danger }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = C.dangerSoft)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filteredAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                            <div
                              className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                              style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                            >
                              <Link2 size={26} style={{ color: C.primary }} />
                            </div>
                            <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold text-[#F2F0EB]">
                              {accounts.length === 0 ? "No connected accounts" : "No accounts match"}
                            </h3>
                            <p className="mt-2 text-[13px] max-w-md" style={{ color: C.textMuted }}>
                              {accounts.length === 0
                                ? "Connect a Gmail or Outlook mailbox to start sending."
                                : "Try adjusting your search or filters."}
                            </p>
                            {accounts.length === 0 ? (
                              <button
                                onClick={openConnectModal}
                                className="mt-5 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                              >
                                <Plus size={13} /> Connect account
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
            </div>
          </div>
        </div>
      </main>

      {/* Connect modal */}
      {showConnect && (
        <ConnectModal
          busyId={connectBusyId}
          error={connectError}
          onClose={() => {
            if (connectBusyId) return;
            setShowConnect(false);
          }}
          onConnect={handleConnect}
        />
      )}

      {/* Edit modal */}
      {editingAccount && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !saving && setEditingAccount(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl overflow-hidden soft-ring modal-pop"
            style={{ background: C.surface }}
          >
            <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: C.border }}>
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: providerMeta(editingAccount.provider).bg,
                    boxShadow: `inset 0 0 0 1px ${providerMeta(editingAccount.provider).ring}`,
                  }}
                >
                  <AtSign size={18} style={{ color: providerMeta(editingAccount.provider).fg }} />
                </div>
                <div className="min-w-0">
                  <h2 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-[16px] md:text-[18px] font-bold text-white truncate">
                    Edit sender account
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                    Update display name, limits, and status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                disabled={saving}
                aria-label="Close"
                className="shrink-0 p-2 rounded-2xl transition-colors disabled:opacity-50"
                style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Connected account summary (read-only) */}
              <div
                className="rounded-2xl px-3.5 py-3 flex items-center gap-3"
                style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <Avatar
                  name={editingAccount.display_name || editingAccount.email}
                  brand={providerMeta(editingAccount.provider).brand}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium" style={{ color: C.dark }}>
                    {editingAccount.email}
                  </p>
                  <p className="truncate text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                    Connected via {editingAccount.provider} OAuth
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Display name" required>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Marketing"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    min={0}
                    value={formData.daily_limit}
                    onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    style={{ ...inputStyle, fontFamily: FONT.mono }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <Field label="Hourly limit">
                  <input
                    type="number"
                    min={0}
                    value={formData.hourly_limit}
                    onChange={(e) => setFormData({ ...formData, hourly_limit: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    style={{ ...inputStyle, fontFamily: FONT.mono }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: C.textMuted }}>
                Email and provider can't be changed — they're tied to the connected OAuth grant.
                To switch mailboxes, disconnect and connect a new one.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: C.border }}>
              <button
                onClick={() => setEditingAccount(null)}
                disabled={saving}
                className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-50"
                style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          account={deleteTarget}
          busy={deletingId === deleteTarget.id}
          onCancel={() => !deletingId && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
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