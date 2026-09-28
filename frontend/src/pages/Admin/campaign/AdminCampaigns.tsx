// src/pages/Admin/Campaigns.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Inbox,
  PauseCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileEdit,
  Megaphone,
  Menu,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock,
  Send,
  MoreHorizontal,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Filter as FilterIcon,
  Hash,
  AtSign,
} from "lucide-react";

import { useCampaigns } from "../../../contexts/CampaignContext";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
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
  DRAFT:     { label: "Draft",     fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing, Icon: FileEdit     },
  READY:     { label: "Ready",     fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    Icon: CheckCircle2 },
  RUNNING:   { label: "Running",   fg: C.primary, bg: C.primarySoft, ring: C.primaryRing, Icon: PlayCircle   },
  PAUSED:    { label: "Paused",    fg: C.warning, bg: C.warningSoft, ring: C.warningRing, Icon: PauseCircle  },
  COMPLETED: { label: "Completed", fg: C.success, bg: C.successSoft, ring: C.successRing, Icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  Icon: XCircle      },
};

const FALLBACK_META = STATUS_META.DRAFT;

const STATUS_OPTIONS = [
  "DRAFT",
  "READY",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

const FILTER_KEYS = ["ALL", ...STATUS_OPTIONS];

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const relativeTime = (iso) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  } catch {
    return "—";
  }
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card = ({ children, className = "", ...rest }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: C.surface }}
    {...rest}
  >
    {children}
  </div>
);

const StatusPill = ({ status, withIcon = true }) => {
  const meta = STATUS_META[status] ?? FALLBACK_META;
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{
        background: meta.bg,
        color: meta.fg,
        boxShadow: `inset 0 0 0 1px ${meta.ring}`,
      }}
    >
      {withIcon ? (
        <Icon size={11} />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }}
        />
      )}
      {meta.label}
    </span>
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
      {subtitle && (
        <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
          {subtitle}
        </p>
      )}
    </div>
    {right}
  </div>
);

const Sparkline = ({ points, color }) => {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((p - min) / range) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const id = `sg-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[24px]">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

const StatCard = ({ title, value, hint, icon: Icon, accent, spark = [2, 3, 3, 4, 5, 4, 6] }) => (
  <Card className="p-4 md:p-5 float-in relative overflow-hidden">
    <div
      aria-hidden
      className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }}
    />
    <div className="relative flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p
      className="relative text-[26px] font-bold leading-none tracking-tight"
      style={{ fontFamily: FONT.mono, color: C.dark }}
    >
      {value}
    </p>
    <p className="relative text-[11.5px] mt-2 mb-3" style={{ color: C.textMuted }}>
      {title}
      {hint && <span style={{ color: C.textMuted }}> · {hint}</span>}
    </p>
    <div className="relative opacity-80">
      <Sparkline points={spark} color={accent} />
    </div>
  </Card>
);

/* ─────────────────────────── Grid card ─────────────────────────── */

const CampaignCard = ({ c, onEdit, onDelete, onStart, busy }) => {
  const meta = STATUS_META[c.status] ?? FALLBACK_META;
  const Icon = meta.Icon;

  return (
    <div
      className="group relative rounded-2xl soft-ring transition-all hover:-translate-y-1 overflow-hidden float-in"
      style={{ background: C.inner }}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all group-hover:top-2 group-hover:bottom-2"
        style={{
          background: meta.fg,
          opacity: 0.85,
          boxShadow: `0 0 12px ${meta.fg}66`,
        }}
      />

      <Link to={`/admin/campaigns/${c.id}`} className="block pl-5 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#1F242E", boxShadow: "inset 0 0 0 1px #2A2E37" }}
          >
            <Icon size={16} style={{ color: meta.fg }} />
          </div>
          <StatusPill status={c.status} withIcon={false} />
        </div>

        <h3
          className="text-[14.5px] font-semibold tracking-tight truncate"
          style={{ fontFamily: FONT.display, color: C.dark }}
        >
          {c.campaign_name}
        </h3>
        <p className="mt-1 text-[12px] truncate" style={{ color: C.textMuted }}>
          {c.subject || "No subject"}
        </p>

        <div className="mt-3 flex items-center gap-3 text-[10.5px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
          <span className="inline-flex items-center gap-1">
            <Hash size={10} /> {c.id}
          </span>
          {c.template_id ? (
            <span className="inline-flex items-center gap-1 truncate">
              <FileEdit size={10} /> tpl {c.template_id}
            </span>
          ) : null}
        </div>

        <div
          className="mt-3 pt-3 flex items-center justify-between text-[11px] border-t"
          style={{ borderColor: C.border, fontFamily: FONT.mono, color: C.textMuted }}
        >
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {relativeTime(c.created_at)}
          </span>
          <ChevronRight size={12} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>

      {/* Action row */}
      <div className="px-3 pb-3 pt-1 flex items-center gap-1.5">
        {c.status === "READY" || c.status === "PAUSED" ? (
          <button
            onClick={() => onStart(c)}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: C.primarySoft,
              color: C.primary,
              boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
            }}
          >
            <PlayCircle size={12} /> Start
          </button>
        ) : (
          <Link
            to={`/admin/campaigns/${c.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-all hover:-translate-y-0.5"
            style={{
              background: C.primarySoft,
              color: C.primary,
              boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
            }}
          >
            <Send size={12} /> Open
          </Link>
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

/* ─────────────────────────── Drawer ─────────────────────────── */

const EMPTY_FORM = {
  campaign_name: "",
  subject: "",
  template_id: "",
  sender_account_id: "",
  status: "DRAFT",
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
        status: initial.status ?? "DRAFT",
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
      setErr(
        e?.response?.data?.detail || e?.message || "Failed to save campaign."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const currentMeta = STATUS_META[form.status] ?? FALLBACK_META;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="w-full max-w-md h-full overflow-y-auto border-l flex flex-col"
        style={{ background: C.surface, borderColor: C.border }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ background: C.surface, borderColor: C.border }}
        >
          <div>
            <p
              className="text-[10.5px] uppercase tracking-widest"
              style={{ color: C.textMuted, fontFamily: FONT.mono }}
            >
              {isEdit ? `campaign #${initial.id}` : "new campaign"}
            </p>
            <h2
              className="mt-0.5 text-[16px] font-semibold tracking-tight"
              style={{ fontFamily: FONT.display, color: C.dark }}
            >
              {isEdit ? "Edit campaign" : "Create campaign"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1B2130]"
            style={{ color: C.textMuted }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-5 space-y-6 flex-1">
            {/* Section: Basics */}
            <section className="space-y-4">
              <SectionLabel icon={Megaphone} label="Basics" />
              <Field
                label="Campaign name"
                value={form.campaign_name}
                onChange={set("campaign_name")}
                placeholder="Summer promotion"
                required
              />
              <Field
                label="Subject"
                value={form.subject}
                onChange={set("subject")}
                placeholder="Our biggest sale of the year"
                required
                hint={`${form.subject.length}/80`}
                maxLength={80}
              />
            </section>

            {/* Section: Configuration */}
            <section className="space-y-4">
              <SectionLabel icon={SlidersHorizontal} label="Configuration" />
              <Field
                label="Template ID"
                value={form.template_id}
                onChange={set("template_id")}
                placeholder="1"
                type="number"
                icon={FileEdit}
              />
              <Field
                label="Sender account ID"
                value={form.sender_account_id}
                onChange={set("sender_account_id")}
                placeholder="1"
                type="number"
                icon={AtSign}
              />

              <label className="block">
                <span
                  className="block mb-1.5 text-[11px] font-medium"
                  style={{ color: C.textMuted, fontFamily: FONT.mono }}
                >
                  Status
                </span>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={set("status")}
                    className="w-full appearance-none rounded-2xl px-3 py-2.5 pr-9 text-[13px] outline-none"
                    style={{
                      background: C.inner,
                      color: C.dark,
                      boxShadow: `inset 0 0 0 1px ${C.border}`,
                      fontFamily: FONT.body,
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: currentMeta.fg,
                      boxShadow: `0 0 6px ${currentMeta.fg}`,
                    }}
                  />
                </div>
              </label>
            </section>

            {err && (
              <div
                className="rounded-2xl px-3.5 py-2.5 text-[12px] flex items-start gap-2 float-in"
                style={{
                  background: C.dangerSoft,
                  color: C.danger,
                  boxShadow: `inset 0 0 0 1px ${C.dangerRing}`,
                }}
              >
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 border-t flex items-center gap-2 sticky bottom-0"
            style={{ background: C.surface, borderColor: C.border }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: C.primary,
                boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create campaign"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-[13px] font-medium"
              style={{
                background: C.inner,
                color: C.textBody,
                boxShadow: `inset 0 0 0 1px ${C.border}`,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2">
    <Icon size={12} style={{ color: C.primary }} />
    <span
      className="text-[10.5px] uppercase tracking-widest"
      style={{ color: C.textMuted, fontFamily: FONT.mono }}
    >
      {label}
    </span>
    <span className="flex-1 h-px" style={{ background: C.border }} />
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  icon: Icon,
  hint,
  maxLength,
}) => (
  <label className="block">
    <span
      className="mb-1.5 flex items-center justify-between text-[11px] font-medium"
      style={{ color: C.textMuted, fontFamily: FONT.mono }}
    >
      <span>
        {label}
        {required && <span style={{ color: C.primary }}> *</span>}
      </span>
      {hint && <span>{hint}</span>}
    </span>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }}>
          <Icon size={13} />
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-2xl px-3 py-2.5 text-[13px] outline-none"
        style={{
          background: C.inner,
          color: C.dark,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
          fontFamily: FONT.body,
          paddingLeft: Icon ? 34 : undefined,
        }}
      />
    </div>
  </label>
);

/* ─────────────────────────── Confirm dialog ─────────────────────────── */

const ConfirmDialog = ({ open, title, body, confirmLabel, onConfirm, onCancel, busy }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-3xl p-5 soft-ring float-in"
        style={{ background: C.surface }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
          >
            <AlertTriangle size={15} style={{ color: C.danger }} />
          </div>
          <div className="min-w-0">
            <h3
              className="text-[14px] font-semibold tracking-tight"
              style={{ fontFamily: FONT.display, color: C.dark }}
            >
              {title}
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: C.textMuted }}>
              {body}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl px-4 py-2 text-[12.5px] font-medium"
            style={{
              background: C.inner,
              color: C.textBody,
              boxShadow: `inset 0 0 0 1px ${C.border}`,
            }}
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
  const { campaigns, loading, error, fetchAll } = useCampaigns();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
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
    const running = campaigns.filter((c) => c.status === "RUNNING").length;
    const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
    const drafts = campaigns.filter((c) => c.status === "DRAFT").length;
    return [
      { title: "Total campaigns", value: String(total),     hint: "all time",     icon: Megaphone,    accent: C.primary, spark: [3, 4, 4, 5, 6, 6, 7] },
      { title: "Running now",     value: String(running),   hint: "active",       icon: PlayCircle,   accent: C.blue,    spark: [1, 1, 2, 1, 3, 2, 3] },
      { title: "Completed",       value: String(completed), hint: "finished",     icon: CheckCircle2, accent: C.success, spark: [2, 3, 3, 4, 5, 6, 7] },
      { title: "Drafts",          value: String(drafts),    hint: "not sent yet", icon: FileEdit,     accent: C.warning, spark: [5, 4, 4, 3, 4, 3, 2] },
    ];
  }, [campaigns]);

  const visibleCampaigns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesStatus = filter === "ALL" || c.status === filter;
      const matchesQuery =
        !q ||
        (c.campaign_name ?? "").toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [campaigns, filter, query]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setDrawerOpen(true);
  };

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
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ background: C.bg, fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .cmp-main::-webkit-scrollbar { width: 10px; }
        .cmp-main::-webkit-scrollbar-track { background: transparent; }
        .cmp-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .cmp-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }
        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
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

      <div
        className={`
          fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main
        className="cmp-main flex-1 overflow-y-auto"
        style={{ background: C.bg, height: "100vh", width: "100%" }}
      >
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
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        background: C.successSoft,
                        color: C.success,
                        boxShadow: `inset 0 0 0 1px ${C.successRing}`,
                      }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Live
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {campaigns.length} campaigns
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {now || "--:--:--"}
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Campaigns
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Create, monitor, and manage all your email campaigns in one place.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
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
                  style={{
                    background: C.primary,
                    boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)",
                  }}
                >
                  <Plus size={14} />
                  New campaign
                </button>
              </div>
            </header>

            {error && (
              <div
                className="mb-6 rounded-2xl px-4 py-3 text-[12.5px] flex items-start gap-2"
                style={{
                  background: C.dangerSoft,
                  color: C.danger,
                  boxShadow: `inset 0 0 0 1px ${C.dangerRing}`,
                }}
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {stats.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </div>

            {/* Toolbar */}
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
                    placeholder="Search campaigns…"
                    className="bg-transparent outline-none border-0 text-[12.5px] flex-1 min-w-0"
                    style={{ color: C.dark, fontFamily: FONT.body }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="p-0.5 rounded"
                      style={{ color: C.textMuted }}
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="hidden md:inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest mr-1"
                    style={{ color: C.textMuted, fontFamily: FONT.mono }}
                  >
                    <FilterIcon size={11} /> status
                  </span>
                  {FILTER_KEYS.map((key) => {
                    const meta =
                      key === "ALL"
                        ? { fg: C.textBody, bg: C.inner, ring: C.border, label: "All" }
                        : STATUS_META[key];
                    const active = filter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-all hover:-translate-y-0.5"
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

                <div
                  className="flex items-center rounded-2xl p-0.5 shrink-0"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className="p-1.5 rounded-xl transition-colors"
                    style={{
                      background: view === "grid" ? C.surface : "transparent",
                      color: view === "grid" ? C.dark : C.textMuted,
                    }}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setView("table")}
                    aria-label="Table view"
                    className="p-1.5 rounded-xl transition-colors"
                    style={{
                      background: view === "table" ? C.surface : "transparent",
                      color: view === "table" ? C.dark : C.textMuted,
                    }}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </Card>

            {/* Loading skeleton */}
            {loading && campaigns.length === 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[180px] rounded-2xl animate-pulse"
                    style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && campaigns.length === 0 && !error && (
              <Card className="p-10 text-center float-in">
                <div
                  className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                >
                  <Sparkles size={22} style={{ color: C.primary }} strokeWidth={1.8} />
                </div>
                <h2
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ fontFamily: FONT.display, color: C.dark }}
                >
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

            {/* No matches */}
            {!loading && campaigns.length > 0 && visibleCampaigns.length === 0 && (
              <Card className="p-8 text-center float-in">
                <div
                  className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <Search size={18} style={{ color: C.textMuted }} />
                </div>
                <p className="text-[13px] font-medium" style={{ color: C.dark }}>
                  No campaigns match your filters
                </p>
                <p className="mt-1 text-[12px]" style={{ color: C.textMuted }}>
                  Try adjusting your search or clearing the status filter.
                </p>
                <button
                  onClick={() => {
                    setFilter("ALL");
                    setQuery("");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12px] font-medium"
                  style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  Clear filters
                </button>
              </Card>
            )}

            {/* Grid */}
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
                  />
                ))}
              </div>
            )}

            {/* Table */}
            {!loading && visibleCampaigns.length > 0 && view === "table" && (
              <Card className="overflow-hidden float-in">
                <SectionHeader
                  icon={Megaphone}
                  title="All campaigns"
                  subtitle={`${visibleCampaigns.length} of ${campaigns.length} shown`}
                  right={
                    <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                      {filter === "ALL" ? "no filter" : filter.toLowerCase()}
                    </span>
                  }
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 980 }}>
                    <thead className="cmp-thead">
                      <tr
                        className="text-[10px] uppercase tracking-widest"
                        style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
                      >
                        <th className="px-4 md:px-6 py-3 font-medium">ID</th>
                        <th className="px-3 py-3 font-medium">Campaign</th>
                        <th className="px-3 py-3 font-medium">Subject</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium text-right">Template</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">Created</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCampaigns.map((c) => (
                        <tr
                          key={c.id}
                          className="cmp-row transition-colors"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                        >
                          <td className="px-4 md:px-6 py-3.5">
                            <span style={{ fontFamily: FONT.mono, color: C.textMuted, fontSize: 11.5 }}>
                              #{c.id}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <Link
                              to={`/admin/campaigns/${c.id}`}
                              className="text-[12.5px] font-medium hover:underline"
                              style={{ color: C.dark }}
                            >
                              {c.campaign_name}
                            </Link>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className="text-[12px] truncate block max-w-[260px]"
                              style={{ fontFamily: FONT.mono, color: C.textMuted }}
                            >
                              {c.subject || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill status={c.status} />
                          </td>
                          <td
                            className="px-3 py-3.5 text-right text-[12px]"
                            style={{ fontFamily: FONT.mono, color: C.textMuted }}
                          >
                            {c.template_id ?? "—"}
                          </td>
                          <td
                            className="px-4 md:px-6 py-3.5 text-right text-[11.5px] whitespace-nowrap"
                            style={{ fontFamily: FONT.mono, color: C.textMuted }}
                          >
                            {formatDate(c.created_at)}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <div className="cmp-actions flex items-center justify-end gap-1.5">
                              {(c.status === "READY" || c.status === "PAUSED") && (
                                <button
                                  onClick={() => handleStart(c)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50"
                                  style={{
                                    background: C.primarySoft,
                                    color: C.primary,
                                    boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
                                  }}
                                >
                                  <PlayCircle size={11} />
                                  Start
                                </button>
                              )}
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
                              <Link
                                to={`/admin/campaigns/${c.id}`}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                                aria-label="More"
                              >
                                <MoreHorizontal size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t"
                  style={{ borderColor: C.border }}
                >
                  <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                    Showing{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      1–{visibleCampaigns.length}
                    </span>{" "}
                    of{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      {campaigns.length}
                    </span>{" "}
                    campaigns
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
                    <span
                      className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium text-center"
                      style={{ background: C.primary, color: "#fff" }}
                    >
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
        </div>
      </main>

      <CampaignDrawer
        open={drawerOpen}
        initial={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchAll}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete this campaign?"
        body={
          confirmTarget
            ? `“${confirmTarget.campaign_name}” will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}