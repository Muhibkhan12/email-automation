// src/pages/Admin/Campaigns.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, RefreshCw, Inbox, PauseCircle, CheckCircle2, XCircle, PlayCircle,
  FileEdit, Megaphone, Menu, LayoutGrid, List, Search, ArrowUpRight,
  ArrowDownRight, ChevronRight, ChevronLeft, Clock, Send, Trash2,
  Pencil, Loader2, AlertTriangle, X, AtSign, Users, MailCheck, MailX,
  MailWarning, ExternalLink, Hash, BarChart3, FileCode, FileSpreadsheet,
} from "lucide-react";

import { useCampaigns } from "../../../contexts/CampaignContext";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  getCampaignById,
} from "../../../services/CampaignService";
import AdminSidebar from "../AdminSidebar";

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
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  violet: "#A78BFA",
  violetSoft: "rgba(167,139,250,0.10)",
  violetRing: "rgba(167,139,250,0.22)",
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
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

/* ─────────────────────────── Status meta ─────────────────────────── */

const STATUS_META = {
  Draft:     { label: "Draft",     fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing, Icon: FileEdit },
  Ready:     { label: "Ready",     fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    Icon: CheckCircle2 },
  Running:   { label: "Running",   fg: C.primary, bg: C.primarySoft, ring: C.primaryRing, Icon: PlayCircle },
  Paused:    { label: "Paused",    fg: C.warning, bg: C.warningSoft, ring: C.warningRing, Icon: PauseCircle },
  Completed: { label: "Completed", fg: C.success, bg: C.successSoft, ring: C.successRing, Icon: CheckCircle2 },
  Cancelled: { label: "Cancelled", fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  Icon: XCircle },
};

const normalizeStatus = (s) => {
  if (!s) return "Draft";
  const map = {
    draft: "Draft",
    ready: "Ready",
    running: "Running",
    paused: "Paused",
    completed: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };
  return map[String(s).toLowerCase()] ?? "Draft";
};

const FALLBACK_META = STATUS_META.Draft;

const STATUS_OPTIONS = ["Draft", "Ready", "Running", "Paused", "Completed", "Cancelled"];
const FILTER_KEYS = ["All", ...STATUS_OPTIONS];

const LOG_STATUS_META = {
  Sent:      { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    Icon: Clock },
  Delivered: { fg: C.success, bg: C.successSoft, ring: C.successRing, Icon: CheckCircle2 },
  Bounced:   { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, Icon: MailWarning },
  Failed:    { fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  Icon: MailX },
  Pending:   { fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing, Icon: MailWarning },
  Queued:    { fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    Icon: Clock },
  Sending:   { fg: C.warning, bg: C.warningSoft, ring: C.warningRing, Icon: MailWarning },
};

/* ─────────────────────────── Helpers ─────────────────────────── */

const formatNumber = (n) => {
  if (n === null || n === undefined) return "0";
  return Number(n).toLocaleString();
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const formatRelative = (iso) => {
  if (!iso) return "—";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const s = Math.max(1, Math.floor((now - then) / 1000));
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    return formatDate(iso);
  } catch {
    return "—";
  }
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card = ({ children, className = "" }) => (
  <div className={`rounded-3xl soft-ring transition-colors ${className}`} style={{ background: C.surface }}>
    {children}
  </div>
);

const Pill = ({ fg, bg, ring, children, Icon }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
    style={{ background: bg, color: fg, boxShadow: `inset 0 0 0 1px ${ring}` }}
  >
    {Icon && <Icon size={11} />}
    {children}
  </span>
);

const StatusPill = ({ status, withIcon = true }) => {
  const key = normalizeStatus(status);
  const meta = STATUS_META[key] ?? FALLBACK_META;
  return (
    <Pill fg={meta.fg} bg={meta.bg} ring={meta.ring} Icon={withIcon ? meta.Icon : null}>
      {withIcon === false ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
          {meta.label}
        </>
      ) : (
        meta.label
      )}
    </Pill>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div
    className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-6 py-4 border-b"
    style={{ borderColor: C.border }}
  >
    <div>
      <h2
        style={{ fontFamily: FONT.display }}
        className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F2F0EB] flex items-center gap-2"
      >
        <Icon size={15} style={{ color: C.primary }} /> {title}
      </h2>
      {subtitle && <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const StatCard = ({ title, value, change, trend, icon: Icon, accent }) => (
  <Card className="p-4 md:p-5 float-in">
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
      <span
        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
        style={{
          background: trend === "up" ? C.successSoft : C.dangerSoft,
          color: trend === "up" ? C.success : C.danger,
          boxShadow: `inset 0 0 0 1px ${trend === "up" ? C.successRing : C.dangerRing}`,
          fontFamily: FONT.mono,
        }}
      >
        {trend === "up" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
        {change}
      </span>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: C.dark }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: C.textMuted }}>{title}</p>
  </Card>
);

const Meta = ({ label, value, mono = false, title }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>
      {label}
    </p>
    <p
      className="text-[12.5px] truncate"
      title={title ?? (typeof value === "string" ? value : undefined)}
      style={{ color: C.textBody, fontFamily: mono ? FONT.mono : FONT.body }}
    >
      {value}
    </p>
  </div>
);

/* ─────────────────────────── Grid card ─────────────────────────── */

const CampaignCard = ({ c, onEdit, onDelete, onStart, onOpen, busy }) => {
  const key = normalizeStatus(c.status);
  const meta = STATUS_META[key] ?? FALLBACK_META;
  const Icon = meta.Icon;
  const recipientCount = Array.isArray(c.recipients) ? c.recipients.length : 0;

  return (
    <div
      onClick={() => onOpen(c)}
      className="group relative rounded-2xl soft-ring transition-all hover:-translate-y-0.5 overflow-hidden cursor-pointer"
      style={{ background: C.inner }}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ background: meta.fg, opacity: 0.85, boxShadow: `0 0 12px ${meta.fg}66` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#1F242E", boxShadow: "inset 0 0 0 1px #2A2E37" }}
          >
            <Icon size={16} style={{ color: meta.fg }} />
          </div>
          <StatusPill status={c.status} withIcon={false} />
        </div>

        <h3 className="text-[14.5px] font-semibold tracking-tight truncate" style={{ fontFamily: FONT.display, color: C.dark }}>
          {c.campaign_name}
        </h3>
        <p className="mt-1 text-[12px] truncate" style={{ color: C.textMuted }}>
          {c.subject || "No subject"}
        </p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] min-w-0">
            <AtSign size={11} style={{ color: C.textMuted }} className="shrink-0" />
            <span className="truncate" style={{ color: C.textBody, fontFamily: FONT.mono }}>
              {c.sender_account?.email
                || c.sender_account?.display_name
                || (c.sender_account_id ? `#${c.sender_account_id}` : "No sender")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] min-w-0">
            <FileCode size={11} style={{ color: C.textMuted }} className="shrink-0" />
            <span className="truncate" style={{ color: C.textBody, fontFamily: FONT.mono }}>
              {c.template?.name || (c.template_id ? `#${c.template_id}` : "No template")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] min-w-0">
            <Users size={11} style={{ color: C.textMuted }} className="shrink-0" />
            <span style={{ color: C.textBody, fontFamily: FONT.mono }}>
              {formatNumber(recipientCount)} recipient{recipientCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div
          className="mt-3 pt-3 flex items-center justify-between text-[11px] border-t"
          style={{ borderColor: C.border, color: C.textMuted }}
        >
          <span style={{ fontFamily: FONT.mono }} title={formatDateTime(c.created_at)}>
            {formatRelative(c.created_at)}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: C.neutralSoft, color: C.neutral, fontFamily: FONT.mono, fontSize: 10.5 }}
          >
            #{c.id}
          </span>
        </div>
      </div>

      <div
        className="px-3 pb-3 pt-0 flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {key === "Ready" || key === "Paused" ? (
          <button
            onClick={() => onStart(c)}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50"
            style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
          >
            <PlayCircle size={12} /> Start
          </button>
        ) : (
          <button
            onClick={() => onOpen(c)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium"
            style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
          >
            <Send size={12} /> Open
          </button>
        )}

        <button
          onClick={() => onEdit(c)}
          disabled={busy}
          aria-label="Edit campaign"
          className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130] disabled:opacity-50"
          style={{ color: C.textMuted }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(c)}
          disabled={busy}
          aria-label="Delete campaign"
          className="p-1.5 rounded-lg transition-colors hover:bg-[#2A1F1F] disabled:opacity-50"
          style={{ color: C.danger }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────── Campaign detail drawer ─────────────────────────── */

const DetailRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div
      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
      style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
    >
      <Icon size={13} style={{ color: C.textMuted }} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</p>
      <div className="text-[13px] mt-0.5 min-w-0" style={{ color: C.textBody }}>{children}</div>
    </div>
  </div>
);

const StatBox = ({ label, value, fg, bg, ring, Icon }) => (
  <div className="rounded-2xl p-3" style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
    <div className="flex items-center gap-2 mb-1.5">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: bg, boxShadow: `inset 0 0 0 1px ${ring}` }}
      >
        <Icon size={11} style={{ color: fg }} />
      </div>
      <span className="text-[10.5px] uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</span>
    </div>
    <p className="text-[20px] font-bold leading-none" style={{ fontFamily: FONT.mono, color: C.dark }}>
      {value}
    </p>
  </div>
);

const CampaignDetailDrawer = ({ open, campaign, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !campaign?.id) return;
    let cancelled = false;
    setDetail(campaign);
    setLoading(true);

    (async () => {
      try {
        const data = await getCampaignById(campaign.id);
        if (!cancelled) setDetail(data);
      } catch (e) {
        console.warn("Falling back to list data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, campaign]);

  if (!open || !campaign) return null;

  const c = detail || campaign;
  const statusKey = normalizeStatus(c.status);
  const statusMeta = STATUS_META[statusKey] ?? FALLBACK_META;

  const senderEmail = c.sender_account?.email ?? "—";
  const senderName = c.sender_account?.display_name ?? c.sender_account?.name ?? "—";
  const senderId = c.sender_account?.id ?? c.sender_account_id;

  const template = c.template ?? null;

  const recipients = Array.isArray(c.recipients) ? c.recipients : [];
  const logs = Array.isArray(c.email_logs) ? c.email_logs : [];
  const uploads = Array.isArray(c.uploads) ? c.uploads : [];

  const logsByStatus = logs.reduce((acc, l) => {
    const k = l.status || "Pending";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const recipientById = recipients.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {});

  const totalSent = logsByStatus.Sent ?? 0;
  const totalFailed = logsByStatus.Failed ?? 0;
  const totalPending = logsByStatus.Pending ?? 0;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="w-full max-w-2xl h-full overflow-y-auto border-l flex flex-col"
        style={{ background: C.surface, borderColor: C.border }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 md:py-5 border-b sticky top-0 z-10"
          style={{ background: C.surface, borderColor: C.border }}
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: statusMeta.bg, boxShadow: `inset 0 0 0 1px ${statusMeta.ring}` }}
            >
              <statusMeta.Icon size={18} style={{ color: statusMeta.fg }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] uppercase tracking-widest" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                campaign #{c.id}
              </p>
              <h2
                className="text-[16px] md:text-[18px] font-bold tracking-tight truncate"
                style={{ fontFamily: FONT.display, color: C.dark }}
              >
                {c.campaign_name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusPill status={c.status} withIcon={false} />
                <span style={{ color: C.textMuted, fontFamily: FONT.mono, fontSize: 11 }}>·</span>
                <span
                  className="text-[11.5px] truncate max-w-[280px]"
                  style={{ color: C.textMuted }}
                  title={c.subject || ""}
                >
                  {c.subject || "No subject"}
                </span>
                {loading && (
                  <span className="text-[10.5px] inline-flex items-center gap-1" style={{ color: C.textMuted }}>
                    <Loader2 size={10} className="animate-spin" /> refreshing
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl transition-colors"
            style={{ color: C.textMuted, background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 md:p-6 space-y-6">

          {/* Overview */}
          <section>
            <SectionHeader icon={Megaphone} title="Overview" />
            <div
              className="mt-4 rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5"
              style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <Meta label="Campaign ID" value={`#${c.id}`} mono />
              <Meta label="Status" value={statusMeta.label} />
              <Meta label="Subject" value={c.subject || "—"} mono />
              <Meta label="Created" value={formatDateTime(c.created_at)} mono title={c.created_at} />
              <Meta label="Last updated" value={formatDateTime(c.updated_at)} mono title={c.updated_at} />
            </div>
          </section>

          {/* Sender */}
          <section>
            <SectionHeader
              icon={AtSign}
              title="Sender account"
              right={
                senderId && (
                  <Link
                    to={`/admin/senders-account`}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium"
                    style={{ color: C.primary }}
                  >
                    Manage <ExternalLink size={11} />
                  </Link>
                )
              }
            />
            <div className="mt-4">
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <div
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                >
                  <AtSign size={16} style={{ color: C.primary }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold truncate" style={{ color: C.dark }}>
                    {senderName}
                  </p>
                  <p className="text-[11.5px] mt-0.5 truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                    {senderEmail}
                  </p>
                </div>
                {senderId && (
                  <span className="text-[10.5px] shrink-0" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                    #{senderId}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Template */}
          <section>
            <SectionHeader
              icon={FileCode}
              title="Template"
              right={
                template?.id && (
                  <Link
                    to={`/admin/templates`}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium"
                    style={{ color: C.primary }}
                  >
                    Open <ExternalLink size={11} />
                  </Link>
                )
              }
            />
            <div className="mt-4">
              {template ? (
                <div className="rounded-2xl overflow-hidden" style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
                  <div className="p-4 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: C.dark }}>
                        {template.name || `Template #${template.id}`}
                      </p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                        #{template.id}
                      </p>
                    </div>
                  </div>
                  {template.html_content ? (
                    <iframe
                      title="Template preview"
                      srcDoc={template.html_content}
                      sandbox=""
                      className="w-full bg-white"
                      style={{ height: 240, border: 0, borderTop: `1px solid ${C.border}` }}
                    />
                  ) : (
                    <p className="px-4 py-3 text-[12px]" style={{ color: C.textMuted, borderTop: `1px solid ${C.border}` }}>
                      Preview not available.
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-4 text-[12.5px]"
                  style={{ background: C.inner, color: C.textMuted, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  {c.template_id ? `Template #${c.template_id} (details not loaded)` : "No template attached."}
                </div>
              )}
            </div>
          </section>

          {/* Recipients */}
          <section>
            <SectionHeader
              icon={Users}
              title="Recipients"
              subtitle={`${formatNumber(recipients.length)} total`}
              right={
                <Link
                  to={`/admin/campaigns/${c.id}/recipients`}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium"
                  style={{ color: C.primary }}
                >
                  View all <ExternalLink size={11} />
                </Link>
              }
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total"   value={formatNumber(recipients.length)}  fg={C.primary} bg={C.primarySoft} ring={C.primaryRing} Icon={Users} />
              <StatBox label="Sent"    value={formatNumber(totalSent)}          fg={C.success} bg={C.successSoft} ring={C.successRing} Icon={MailCheck} />
              <StatBox label="Failed"  value={formatNumber(totalFailed)}        fg={C.danger}  bg={C.dangerSoft}  ring={C.dangerRing}  Icon={MailX} />
              <StatBox label="Pending" value={formatNumber(totalPending || recipients.length)} fg={C.warning} bg={C.warningSoft} ring={C.warningRing} Icon={MailWarning} />
            </div>

            {recipients.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {recipients.slice(0, 6).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: C.dark }}>
                        {r.name || r.email || `Recipient #${r.id}`}
                      </p>
                      {r.email && r.name && (
                        <p className="text-[11px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                          {r.email}
                        </p>
                      )}
                    </div>
                    {r.status && LOG_STATUS_META[r.status] && (
                      <Pill
                        fg={LOG_STATUS_META[r.status].fg}
                        bg={LOG_STATUS_META[r.status].bg}
                        ring={LOG_STATUS_META[r.status].ring}
                      >
                        {r.status}
                      </Pill>
                    )}
                  </li>
                ))}
                {recipients.length > 6 && (
                  <li className="text-[11.5px] text-center pt-1" style={{ color: C.textMuted }}>
                    + {formatNumber(recipients.length - 6)} more
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* Delivery */}
          <section>
            <SectionHeader
              icon={BarChart3}
              title="Delivery"
              subtitle={logs.length ? `${formatNumber(logs.length)} events logged` : "No logs yet"}
              right={
                <Link
                  to={`/admin/emaillogs`}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium"
                  style={{ color: C.primary }}
                >
                  Open logs <ExternalLink size={11} />
                </Link>
              }
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Sent"      value={formatNumber(logsByStatus.Sent ?? 0)}      fg={C.blue}    bg={C.blueSoft}    ring={C.blueRing}    Icon={Clock} />
              <StatBox label="Delivered" value={formatNumber(logsByStatus.Delivered ?? 0)} fg={C.success} bg={C.successSoft} ring={C.successRing} Icon={CheckCircle2} />
              <StatBox label="Bounced"   value={formatNumber(logsByStatus.Bounced ?? 0)}   fg={C.warning} bg={C.warningSoft} ring={C.warningRing} Icon={MailWarning} />
              <StatBox label="Failed"    value={formatNumber(logsByStatus.Failed ?? 0)}    fg={C.danger}  bg={C.dangerSoft}  ring={C.dangerRing}  Icon={MailX} />
            </div>

            {logs.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {logs.slice(0, 6).map((l) => {
                  const r = recipientById[l.recipient_id];
                  return (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                      style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] truncate" style={{ color: C.dark }}>
                          {r?.email || r?.name || `Recipient #${l.recipient_id ?? "—"}`}
                        </p>
                        <p className="text-[10.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                          {formatRelative(l.sent_at)}
                          <span style={{ color: C.border }}> · </span>
                          {formatDateTime(l.sent_at)}
                        </p>
                      </div>
                      {l.status && LOG_STATUS_META[l.status] && (
                        <Pill
                          fg={LOG_STATUS_META[l.status].fg}
                          bg={LOG_STATUS_META[l.status].bg}
                          ring={LOG_STATUS_META[l.status].ring}
                          Icon={LOG_STATUS_META[l.status].Icon}
                        >
                          {l.status}
                        </Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Uploads */}
          {uploads.length > 0 && (
            <section>
              <SectionHeader
                icon={FileSpreadsheet}
                title="Source files"
                subtitle={`${formatNumber(uploads.length)} upload${uploads.length === 1 ? "" : "s"} linked`}
              />
              <ul className="mt-4 space-y-2">
                {uploads.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                      >
                        <FileSpreadsheet size={14} style={{ color: C.primary }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium truncate" style={{ color: C.dark }}>
                          {u.original_filename || "Untitled file"}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                          {formatNumber(u.processed_records ?? 0)} / {formatNumber(u.total_records ?? 0)} processed
                        </p>
                      </div>
                    </div>
                    <Pill
                      fg={LOG_STATUS_META[u.status === "uploaded" ? "Pending" : "Sent"]?.fg ?? C.neutral}
                      bg={LOG_STATUS_META[u.status === "uploaded" ? "Pending" : "Sent"]?.bg ?? C.neutralSoft}
                      ring={LOG_STATUS_META[u.status === "uploaded" ? "Pending" : "Sent"]?.ring ?? C.neutralRing}
                    >
                      {u.status || "uploaded"}
                    </Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 md:px-6 py-4 border-t flex items-center justify-between gap-2 sticky bottom-0"
          style={{ background: C.surface, borderColor: C.border }}
        >
          <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
            #{c.id} · {statusMeta.label}
          </span>
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
            style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

/* ─────────────────────────── Create / edit drawer ─────────────────────────── */

const EMPTY_FORM = {
  campaign_name: "",
  subject: "",
  template_id: "",
  sender_account_id: "",
  status: "Draft",
};

const CampaignDrawer = ({ open, initial, onClose, onSaved }) => {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (initial) {
      setForm({
        campaign_name: initial.campaign_name ?? "",
        subject: initial.subject ?? "",
        template_id: String(initial.template_id ?? ""),
        sender_account_id: String(initial.sender_account_id ?? ""),
        status: normalizeStatus(initial.status),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!form.campaign_name.trim()) return setErr("Campaign name is required.");
    if (!form.subject.trim()) return setErr("Subject is required.");

    const payload = {
      campaign_name: form.campaign_name.trim(),
      subject: form.subject.trim(),
      template_id: Number(form.template_id) || 0,
      status: form.status,
    };
    if (form.sender_account_id !== "") {
      payload.sender_account_id = Number(form.sender_account_id);
    }

    setSubmitting(true);
    try {
      if (isEdit) await updateCampaign(initial.id, payload);
      else await createCampaign(payload);
      await onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || e?.message || "Failed to save campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="w-full max-w-md h-full overflow-y-auto border-l"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
          <h2 className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: FONT.display, color: C.dark }}>
            {isEdit ? "Edit campaign" : "New campaign"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1B2130]"
            style={{ color: C.textMuted }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Campaign name" value={form.campaign_name} onChange={set("campaign_name")} placeholder="Summer promotion" required />
          <Field label="Subject" value={form.subject} onChange={set("subject")} placeholder="Our biggest sale of the year" required />
          <Field label="Template ID" value={form.template_id} onChange={set("template_id")} placeholder="2" type="number" />
          <Field label="Sender account ID" value={form.sender_account_id} onChange={set("sender_account_id")} placeholder="1" type="number" />

          <label className="block">
            <span className="block mb-1.5 text-[11px] font-medium" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
              Status
            </span>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full rounded-2xl px-3 py-2.5 text-[13px] outline-none"
              style={{ background: C.inner, color: C.dark, boxShadow: `inset 0 0 0 1px ${C.border}`, fontFamily: FONT.body }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </label>

          {err && (
            <div
              className="rounded-2xl px-3.5 py-2.5 text-[12px] flex items-start gap-2"
              style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)" }}
            >
              {submitting ? (<><Loader2 size={13} className="animate-spin" /> Saving…</>) : isEdit ? "Save changes" : "Create campaign"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-[13px] font-medium"
              style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, required, type = "text" }) => (
  <label className="block">
    <span className="block mb-1.5 text-[11px] font-medium" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
      {label}
      {required && <span style={{ color: C.primary }}> *</span>}
    </span>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-2xl px-3 py-2.5 text-[13px] outline-none"
      style={{ background: C.inner, color: C.dark, boxShadow: `inset 0 0 0 1px ${C.border}`, fontFamily: FONT.body }}
    />
  </label>
);

/* ─────────────────────────── Confirm dialog ─────────────────────────── */

const ConfirmDialog = ({ open, title, body, confirmLabel, onConfirm, onCancel, busy }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl p-5 soft-ring" style={{ background: C.surface }}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
          >
            <AlertTriangle size={15} style={{ color: C.danger }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold tracking-tight" style={{ fontFamily: FONT.display, color: C.dark }}>
              {title}
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: C.textMuted }}>{body}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl px-4 py-2 text-[12.5px] font-medium"
            style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12.5px] font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: C.danger }}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmLabel ?? "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

export default function Campaigns() {
  const {
    allCampaigns: campaigns,
    allLoading: loading,
    allError: error,
    fetchAll,
  } = useCampaigns();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAll();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const stats = useMemo(() => {
    const total = campaigns.length;
    const running = campaigns.filter((c) => normalizeStatus(c.status) === "Running").length;
    const completed = campaigns.filter((c) => normalizeStatus(c.status) === "Completed").length;
    const drafts = campaigns.filter((c) => normalizeStatus(c.status) === "Draft").length;

    return [
      { title: "Total campaigns", value: formatNumber(total),     change: "+6.2%",                 trend: "up",   icon: Megaphone,    accent: C.primary },
      { title: "Running now",     value: formatNumber(running),   change: running ? "+3.1%" : "0%", trend: "up",   icon: PlayCircle,   accent: C.blue    },
      { title: "Completed",       value: formatNumber(completed), change: "+12.4%",                trend: "up",   icon: CheckCircle2, accent: C.success },
      { title: "Drafts",          value: formatNumber(drafts),    change: "-2.0%",                 trend: "down", icon: FileEdit,     accent: C.warning },
    ];
  }, [campaigns]);

  const visibleCampaigns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const key = normalizeStatus(c.status);
      const matchesStatus = filter === "All" || key === filter;
      const matchesQuery =
        !q ||
        (c.campaign_name ?? "").toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q) ||
        (c.sender_account?.email ?? "").toLowerCase().includes(q) ||
        (c.sender_account?.display_name ?? "").toLowerCase().includes(q) ||
        (c.template?.name ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [campaigns, filter, query]);

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (c) => { setEditing(c); setDrawerOpen(true); };
  const openDetail = (c) => setDetailTarget(c);
  const askDelete = (c) => setConfirmTarget(c);

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      await deleteCampaign(confirmTarget.id);
      await fetchAll();
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setBusy(false);
      setConfirmTarget(null);
    }
  };

  const handleStart = async (c) => {
    setBusy(true);
    try {
      await startCampaign(c.id);
      await fetchAll();
    } catch (e) {
      console.error("Start failed:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .cmp-main::-webkit-scrollbar { width: 10px; }
        .cmp-main::-webkit-scrollbar-track { background: transparent; }
        .cmp-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .cmp-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }
        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .cmp-row:hover { background: ${C.rowHover}; }
        .cmp-row .cmp-actions { opacity: 0; transition: opacity 0.15s ease; }
        .cmp-row:hover .cmp-actions, .cmp-row:focus-within .cmp-actions { opacity: 1; }
        thead.cmp-thead th { position: sticky; top: 0; background: ${C.inner}; z-index: 1; }
        :focus-visible { outline: 2px solid ${C.primary}; outline-offset: 2px; border-radius: 12px; }
        @media (prefers-reduced-motion: reduce) {
          .ping, .float-in { animation: none !important; }
        }
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

      <main className="cmp-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

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
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: C.successSoft, color: C.success, boxShadow: `inset 0 0 0 1px ${C.successRing}` }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                  <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                    · {formatNumber(campaigns.length)} campaigns
                  </span>
                  <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                    · updated {now || "--:--:--"}
                  </span>
                </div>

                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                  className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                >
                  Campaigns
                </h1>
                <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                  Inspect every campaign — sender, template, recipients, and delivery, all in one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: C.surface, color: C.textBody }}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)" }}
              >
                <Plus size={14} />
                New campaign
              </button>
            </div>
          </header>

          {error && (
            <div
              className="mb-6 rounded-2xl px-4 py-3 text-[12.5px]"
              style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {stats.map((s) => <StatCard key={s.title} {...s} />)}
          </div>

          <Card className="mb-6 md:mb-8 p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2 flex-1 min-w-0"
                style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <Search size={14} style={{ color: C.textMuted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, subject, sender, or template…"
                  className="bg-transparent outline-none border-0 text-[12.5px] flex-1 min-w-0"
                  style={{ color: C.dark, fontFamily: FONT.body }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {FILTER_KEYS.map((key) => {
                  const meta = key === "All"
                    ? { fg: C.textBody, bg: C.inner, ring: C.border, label: "All" }
                    : STATUS_META[key];
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-all"
                      style={{
                        background: active ? meta.bg : "transparent",
                        color: active ? meta.fg : C.textMuted,
                        boxShadow: `inset 0 0 0 1px ${active ? meta.ring : C.border}`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: active ? meta.fg : C.border,
                          boxShadow: active ? `0 0 6px ${meta.fg}` : "none",
                        }}
                      />
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center rounded-2xl p-0.5 shrink-0" style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className="p-1.5 rounded-xl transition-colors"
                  style={{ background: view === "grid" ? C.surface : "transparent", color: view === "grid" ? C.dark : C.textMuted }}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setView("table")}
                  aria-label="Table view"
                  className="p-1.5 rounded-xl transition-colors"
                  style={{ background: view === "table" ? C.surface : "transparent", color: view === "table" ? C.dark : C.textMuted }}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </Card>

          {loading && campaigns.length === 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[220px] rounded-2xl animate-pulse"
                  style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                />
              ))}
            </div>
          )}

          {!loading && campaigns.length === 0 && !error && (
            <Card className="p-10 text-center">
              <div
                className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
              >
                <Inbox size={22} style={{ color: C.primary }} strokeWidth={1.8} />
              </div>
              <h2 className="text-[16px] font-semibold tracking-tight" style={{ fontFamily: FONT.display, color: C.dark }}>
                No campaigns yet
              </h2>
              <p className="mt-1.5 text-[12.5px] max-w-sm mx-auto" style={{ color: C.textMuted }}>
                Create your first campaign to start sending emails to your recipients.
              </p>
              <button
                onClick={openCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)" }}
              >
                <Plus size={14} />
                Create campaign
              </button>
            </Card>
          )}

          {!loading && campaigns.length > 0 && visibleCampaigns.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-[13px]" style={{ color: C.textMuted }}>No campaigns match your filters.</p>
              <button
                onClick={() => { setFilter("All"); setQuery(""); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12px] font-medium"
                style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                Clear filters
              </button>
            </Card>
          )}

          {!loading && visibleCampaigns.length > 0 && view === "grid" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCampaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  c={c}
                  busy={busy}
                  onEdit={openEdit}
                  onDelete={askDelete}
                  onStart={handleStart}
                  onOpen={openDetail}
                />
              ))}
            </div>
          )}

          {!loading && visibleCampaigns.length > 0 && view === "table" && (
            <Card className="overflow-hidden">
              <SectionHeader
                icon={Megaphone}
                title="All campaigns"
                subtitle={`${formatNumber(visibleCampaigns.length)} of ${formatNumber(campaigns.length)} shown`}
                right={
                  <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                    {filter === "All" ? "no filter" : filter.toLowerCase()}
                  </span>
                }
              />

              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 1100 }}>
                  <thead className="cmp-thead">
                    <tr className="text-[10px] uppercase tracking-widest" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
                      <th className="px-4 md:px-6 py-3 font-medium">ID</th>
                      <th className="px-3 py-3 font-medium">Campaign</th>
                      <th className="px-3 py-3 font-medium">Sender</th>
                      <th className="px-3 py-3 font-medium">Template</th>
                      <th className="px-3 py-3 font-medium text-right">Recipients</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right">Created</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCampaigns.map((c) => {
                      const key = normalizeStatus(c.status);
                      const recipientCount = Array.isArray(c.recipients) ? c.recipients.length : 0;
                      return (
                        <tr
                          key={c.id}
                          className="cmp-row transition-colors cursor-pointer"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          onClick={() => openDetail(c)}
                        >
                          <td className="px-4 md:px-6 py-3.5">
                            <span style={{ fontFamily: FONT.mono, color: C.textMuted, fontSize: 11 }}>
                              {c.id}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="text-[12.5px] font-medium truncate max-w-[220px]" style={{ color: C.dark }}>
                              {c.campaign_name}
                            </p>
                            <p className="text-[11px] truncate max-w-[220px]" style={{ color: C.textMuted }}>
                              {c.subject || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] truncate block max-w-[200px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                              {c.sender_account?.email || (c.sender_account_id ? `#${c.sender_account_id}` : "—")}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] truncate block max-w-[160px]" style={{ color: C.textBody, fontFamily: FONT.mono }}>
                              {c.template?.name || (c.template_id ? `#${c.template_id}` : "—")}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right text-[12.5px] tabular-nums" style={{ fontFamily: FONT.mono, color: C.textBody }}>
                            {formatNumber(recipientCount)}
                          </td>
                          <td className="px-3 py-3.5"><StatusPill status={c.status} /></td>
                          <td
                            className="px-4 md:px-6 py-3.5 text-right text-[11.5px] whitespace-nowrap"
                            style={{ fontFamily: FONT.mono, color: C.textMuted }}
                            title={formatDateTime(c.created_at)}
                          >
                            {formatRelative(c.created_at)}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="cmp-actions flex items-center justify-end gap-1.5">
                              {(key === "Ready" || key === "Paused") && (
                                <button
                                  onClick={() => handleStart(c)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50"
                                  style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                                >
                                  <PlayCircle size={11} /> Start
                                </button>
                              )}
                              <button
                                onClick={() => openDetail(c)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                                aria-label="View details"
                              >
                                <ExternalLink size={14} />
                              </button>
                              <button
                                onClick={() => openEdit(c)}
                                disabled={busy}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130] disabled:opacity-50"
                                style={{ color: C.textMuted }}
                                aria-label="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => askDelete(c)}
                                disabled={busy}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#2A1F1F] disabled:opacity-50"
                                style={{ color: C.danger }}
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t" style={{ borderColor: C.border }}>
                <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                  Showing <span style={{ color: C.dark, fontFamily: FONT.mono }}>1–{formatNumber(visibleCampaigns.length)}</span> of{" "}
                  <span style={{ color: C.dark, fontFamily: FONT.mono }}>{formatNumber(campaigns.length)}</span> campaigns
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium text-center" style={{ background: C.primary, color: "#fff" }}>
                    1
                  </span>
                  <button
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <CampaignDrawer
        open={drawerOpen}
        initial={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchAll}
      />

      <CampaignDetailDrawer
        open={!!detailTarget}
        campaign={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete this campaign?"
        body={confirmTarget ? `“${confirmTarget.campaign_name}” will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}