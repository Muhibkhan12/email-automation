import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Menu, Check, ChevronLeft, ChevronRight, UploadCloud, FileText, Mail,
  LayoutTemplate, ClipboardCheck, Rocket, AlertTriangle, CheckCircle2,
  XCircle, Pause, Play, Ban, X, Send, Users, Trash2, Loader2,
  Pencil, Type, Clock, Inbox, Timer, Hourglass, Info,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import { useUpload } from "../../contexts/UploadContext";
import { AuthContext } from "../../contexts/AuthContext";
import {
  ExtractData,
  waitForAnalytics,
  summaryFromAnalytics,
  type RecipientsSummary,
} from "../../services/ExtractFile";
import { createCampaign } from "../../services/CampaignService";
import {
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignProgress,
  parseUtc,
  type CampaignDTO,
  type CampaignProgressDTO,
} from "../../services/WorkerService";

/* ───────── tokens (unchanged) ───────── */
const T = {
  bg: "#0A0B10", surface: "#111319", surface2: "#161922", surfaceHi: "#1B1F2A",
  border: "#232838", borderSoft: "#1B1F2A", text: "#E9EBF0",
  textMuted: "#9CA3B4", textFaint: "#6B7280",
  brand: "#6366F1", brandSoft: "rgba(99,102,241,0.12)", brandBorder: "rgba(99,102,241,0.35)",
  success: "#22C55E", successSoft: "rgba(34,197,94,0.12)",
  warn: "#F59E0B", warnSoft: "rgba(245,158,11,0.12)",
  danger: "#EF4444", dangerSoft: "rgba(239,68,68,0.12)",
  info: "#38BDF8", purple: "#A78BFA",
};
const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};
const RING = `inset 0 0 0 1px ${T.border}`;
const CARD: React.CSSProperties = { background: T.surface, boxShadow: RING };

/* Backend only emits these; "Scheduled" never comes from the server. */
type Status = "Draft" | "Ready" | "Running" | "Paused" | "Completed" | "Failed" | "Cancelled";

const STATUS_TONE: Record<Status, { color: string; soft: string }> = {
  Draft: { color: T.textMuted, soft: "rgba(156,163,180,0.10)" },
  Ready: { color: T.brand, soft: T.brandSoft },
  Running: { color: T.info, soft: "rgba(56,189,248,0.12)" },
  Paused: { color: T.warn, soft: T.warnSoft },
  Completed: { color: T.success, soft: T.successSoft },
  Failed: { color: T.danger, soft: T.dangerSoft },
  Cancelled: { color: T.danger, soft: T.dangerSoft },
};

const STEPS = [
  { label: "Details", sub: "Name & subject", icon: FileText },
  { label: "Sender", sub: "Pick account", icon: Mail },
  { label: "Template", sub: "Choose design", icon: LayoutTemplate },
  { label: "Recipients", sub: "Upload list", icon: Users },
  { label: "Review", sub: "Check & send", icon: ClipboardCheck },
];

/* ───────── helpers ───────── */
const tplId = (t: any): string => String(t?.id ?? t?._id ?? "");
const tplName = (t: any): string => t?.name ?? t?.title ?? t?.template_name ?? "Untitled template";
const tplDesc = (t: any): string => t?.description ?? t?.desc ?? t?.subject ?? "";
const tplHtml = (t: any): string => t?.html ?? t?.html_content ?? t?.content ?? t?.body ?? "";

const errMsg = (e: any, fallback: string) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x: any) => `${(x.loc ?? []).slice(1).join(".")}: ${x.msg}`).join(" | ");
  return d?.toString?.() ?? e?.response?.data?.message ?? e?.message ?? fallback;
};

const toStatus = (raw?: string): Status | null => {
  const s = String(raw ?? "").toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "ready") return "Ready";
  if (["running", "sending", "in_progress", "processing"].includes(s)) return "Running";
  if (s === "paused") return "Paused";
  if (["completed", "done", "finished"].includes(s)) return "Completed";
  if (["failed", "error"].includes(s)) return "Failed";
  if (["cancelled", "canceled"].includes(s)) return "Cancelled";
  return null;
};

const fmt = (iso: string | null | undefined) => {
  const d = parseUtc(iso);
  return d ? d.toLocaleString() : "—";
};

/* ───────── primitives (unchanged) ───────── */
const Btn: React.FC<{
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = "ghost", size = "md", onClick, disabled, children }) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: T.brand, color: "#fff", boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 18px -8px rgba(99,102,241,0.6)" },
    ghost: { background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.border}` },
    subtle: { background: "transparent", color: T.textMuted },
    danger: { background: T.dangerSoft, color: "#FCA5A5", boxShadow: `inset 0 0 0 1px rgba(239,68,68,0.35)` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all
        ${size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]"}
        hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100`}
      style={styles[variant]}>{children}</button>
  );
};
const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> =
  ({ children, className = "", style }) => (
    <div className={`rounded-xl ${className}`} style={{ ...CARD, ...style }}>{children}</div>
  );
const Field: React.FC<{ label: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }> =
  ({ label, hint, right, children }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-medium" style={{ color: T.textMuted }}>{label}</label>
        {right}
      </div>
      {children}
      {hint && <p className="text-[11.5px] mt-1.5" style={{ color: T.textFaint }}>{hint}</p>}
    </div>
  );
const Stat: React.FC<{ label: string; value: string | number; tone?: string }> = ({ label, value, tone = T.text }) => (
  <div className="rounded-lg p-3.5" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
    <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: T.textFaint }}>{label}</p>
    <p className="text-[20px] font-semibold mt-1.5 leading-none" style={{ color: tone, fontFamily: FONT.mono }}>{value}</p>
  </div>
);
const Loading = ({ label }: { label: string }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2.5 text-[12.5px] py-1" style={{ color: T.textMuted }}>
      <Loader2 size={14} className="animate-spin" /> {label}
    </div>
  </Card>
);
const Head = ({ title, sub }: { title: string; sub: string }) => (
  <div>
    <h2 className="text-[17px] font-semibold" style={{ color: T.text }}>{title}</h2>
    <p className="text-[13px] mt-1" style={{ color: T.textMuted }}>{sub}</p>
  </div>
);
const Notice = ({ tone, children }: { tone: "error" | "warn" | "info" | "success"; children: React.ReactNode }) => {
  const map = {
    error: { c: T.danger, soft: T.dangerSoft, border: "rgba(239,68,68,0.28)" },
    warn: { c: T.warn, soft: T.warnSoft, border: "rgba(245,158,11,0.28)" },
    info: { c: T.info, soft: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.28)" },
    success: { c: T.success, soft: T.successSoft, border: "rgba(34,197,94,0.28)" },
  }[tone];
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3"
      style={{ background: map.soft, boxShadow: `inset 0 0 0 1px ${map.border}` }}>
      <AlertTriangle size={14} style={{ color: map.c }} className="mt-0.5 shrink-0" />
      <p className="text-[12.5px] leading-5" style={{ color: map.c }}>{children}</p>
    </div>
  );
};
const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-md rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-150"
      style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 64px -16px rgba(0,0,0,0.7)` }}>
      <button onClick={onClose} aria-label="Close"
        className="absolute top-4 right-4 p-1.5 rounded-md transition-colors hover:bg-white/5"
        style={{ color: T.textFaint }}><X size={15} /></button>
      {children}
    </div>
  </div>
);
const Ring = ({ pct, color }: { pct: number; color: string }) => {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke={T.surfaceHi} strokeWidth="8" />
        <circle cx="66" cy="66" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={color} strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>{pct}%</span>
        <span className="text-[10.5px] mt-1 uppercase tracking-wider" style={{ color: T.textFaint }}>complete</span>
      </div>
    </div>
  );
};

/* ───────── page ───────── */
const CampaignCreatePage = () => {
  const ctx = useContext(SenderAccContext);
  const accounts: any[] = Array.isArray(ctx?.senderAcc) ? (ctx!.senderAcc as any[]) : [];
  const sendersLoading = ctx?.loading ?? false;
  const sendersError = ctx?.error ?? null;
  const fetchSenders = ctx?.fetchAllSenderAccounts;

  const auth = useContext(AuthContext);
  const currentUserId = auth?.user?.user_id ?? null;

  const available = accounts.filter(
    (a) => (a.status ?? "").toLowerCase() === "active" &&
      (a.daily_limit ?? 0) - (a.emails_sent_today ?? 0) > 0
  );

  const { templates, loading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useHtmlTemplates();
  const { uploadRecipients } = useUpload();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fileName, setFileName] = useState("");
  const [recipients, setRecipients] = useState<RecipientsSummary | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [senderId, setSenderId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("Draft");
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [run, setRun] = useState({ sent: 0, failed: 0, total: 0 });
  /** Live server-side scheduling info from /worker/progress */
  const [live, setLive] = useState<CampaignProgressDTO | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const loadTokenRef = useRef(0);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => { fetchSenders?.(); /* eslint-disable-next-line */ }, []);
  useEffect(() => () => { loadTokenRef.current++; }, []);

  const sender = available.find((a) => a.id === senderId) ?? null;
  const template = templates.find((t) => tplId(t) === templateId) ?? null;
  const total = recipients?.valid ?? 0;
  const remaining = sender ? (sender.daily_limit ?? 0) - (sender.emails_sent_today ?? 0) : 0;

  const checks = useMemo(() => {
    const list: { ok: boolean; level: "error" | "warn"; label: string; detail?: string }[] = [
      { ok: !!name.trim(), level: "error", label: "Campaign name", detail: "Give your campaign a name." },
      { ok: !!subject.trim(), level: "error", label: "Subject line", detail: "Add an email subject." },
      { ok: total > 0 && uploaded, level: "error", label: "Recipients", detail: "Upload a file with at least one valid email." },
      { ok: !!sender, level: "error", label: "Sender account", detail: "Select an available sender account." },
      { ok: !!template, level: "error", label: "HTML template", detail: "Choose a template." },
    ];
    if (sender && total > remaining) {
      list.push({
        ok: false, level: "warn", label: "Daily capacity",
        detail: `${total.toLocaleString()} recipients exceed today's remaining ${remaining.toLocaleString()} sends — sending will continue over ${Math.ceil(total / (sender.daily_limit || 1))} days.`,
      });
    }
    if (recipients && recipients.invalid > 0) {
      list.push({ ok: false, level: "warn", label: "Invalid emails", detail: `${recipients.invalid} invalid row(s) will be skipped.` });
    }
    return list;
  }, [name, subject, total, uploaded, sender, template, remaining, recipients]);

  const ready = checks.every((c) => c.ok || c.level === "warn");

  useEffect(() => {
    if (status === "Draft" || status === "Ready") setStatus(ready ? "Ready" : "Draft");
  }, [ready, status]);

  /** Merge a progress payload into local state. */
  const applyProgress = (p: CampaignProgressDTO) => {
    setLive(p);
    setRun({
      sent: p.sent ?? 0,
      failed: p.failed ?? 0,
      total: p.total ?? runRef.current.total,
    });
    const next = toStatus(p.status);
    if (next) setStatus(next);
  };

  /** Poll /worker/progress while running/paused. */
  useEffect(() => {
    if (!campaignId || !["Running", "Paused"].includes(status)) return;
    let stop = false;
    const tick = async () => {
      try {
        const p = await getCampaignProgress(campaignId);
        if (!stop && p) applyProgress(p);
      } catch { /* ignore */ }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line
  }, [campaignId, status]);

  /* ─── file load (unchanged) ─── */
  const loadFile = async (file?: File) => {
    if (!file) return;
    const token = ++loadTokenRef.current;
    const stale = () => token !== loadTokenRef.current;
    setUploadError(""); setUploaded(false); setUploadId(null); setRecipients(null);
    setFileName(file.name); setUploading(true); setExtracting(false); setProgress(0);
    try {
      const saved: any = await uploadRecipients(file, setProgress);
      if (stale()) return;
      const id: number | null = saved?.id ?? null;
      if (!id) throw new Error("File upload ho gayi, lekin response mein file id nahi mili.");
      setUploadId(id); setUploading(false); setExtracting(true);
      await ExtractData(id);
      const finished = await waitForAnalytics(id);
      if (stale()) return;
      const summary = summaryFromAnalytics(finished);
      setRecipients(summary);
      setUploaded(summary.valid > 0);
    } catch (e) {
      if (stale()) return;
      setUploadError(errMsg(e, "File upload failed. Please try again."));
    } finally {
      if (!stale()) { setUploading(false); setExtracting(false); }
    }
  };
  const clearFile = () => {
    loadTokenRef.current++;
    setRecipients(null); setFileName(""); setUploaded(false); setUploadId(null);
    setUploadError(""); setProgress(0); setUploading(false); setExtracting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canNext = [
    !!name.trim() && !!subject.trim(),
    !!sender,
    !!template,
    total > 0 && uploaded && !uploading && !extracting,
    ready,
  ][step];

  /* ─── launch ─── */
  const launch = async () => {
    if (!sender || !template || uploadId === null) return;
    const userId = auth?.user?.user_id ?? currentUserId;
    if (!userId) { setSubmitError("User not loaded. Please log in again."); return; }

    setSubmitting(true); setSubmitError("");
    try {
      let id = campaignId;
      if (id === null) {
        const templateIdNum = Number((template as any).id ?? (template as any)._id);
        if (!templateIdNum) throw new Error("Missing template id.");
        const res: any = await createCampaign({
          user_id: userId,
          template_id: templateIdNum,
          sender_account_id: sender.id,
          campaign_name: name.trim(),
          subject: subject.trim(),
          sent_count: 0,
          status: "Draft",
        });
        const campaign = res?.campaign ?? res;
        const newId = campaign?.id;
        if (typeof newId !== "number") {
          throw new Error(`Campaign created but no valid id in response: ${JSON.stringify(res)}`);
        }
        id = newId;
        setCampaignId(newId);
        setRun({ sent: 0, failed: 0, total });
      }

      // Backend always starts immediately and schedules random gaps server-side.
      await startCampaign(id, uploadId);
      setStatus("Running");
      setConfirmOpen(false);
      fetchSenders?.();
      // Fetch initial progress right away so the UI shows the next send time.
      try {
        const p = await getCampaignProgress(id);
        applyProgress(p);
      } catch { /* ignore */ }
    } catch (e) {
      setSubmitError(errMsg(e, "Could not start the campaign."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── actions ─── */
  const act = async (fn: (id: number) => Promise<CampaignDTO>, fallback: Status) => {
    if (!campaignId) return;
    setActionError("");
    try {
      await fn(campaignId);
      setStatus(fallback);
      try {
        const p = await getCampaignProgress(campaignId);
        applyProgress(p);
      } catch { /* ignore */ }
    } catch (e) {
      setActionError(errMsg(e, "Action failed. Please try again."));
    }
  };

  const reset = () => {
    setStep(0); setName(""); setSubject(""); clearFile();
    setSenderId(null); setTemplateId(null);
    setCampaignId(null); setSubmitError(""); setActionError("");
    setRun({ sent: 0, failed: 0, total: 0 }); setStatus("Draft"); setLive(null);
  };

  const editing = status === "Draft" || status === "Ready";
  const shownTotal = live?.total || run.total || total;
  const done = run.sent + run.failed;
  const pct = shownTotal ? Math.min(100, Math.round((done / shownTotal) * 100)) : 0;
  const tone = STATUS_TONE[status];

  const summaryItems = [
    { label: "Details", icon: FileText, done: !!name.trim() && !!subject.trim(), value: name.trim() || "Not set yet" },
    { label: "Sender", icon: Mail, done: !!sender, value: sender?.email ?? "Not selected" },
    { label: "Template", icon: LayoutTemplate, done: !!template, value: template ? tplName(template) : "Not selected" },
    { label: "Recipients", icon: Users, done: total > 0 && uploaded, value: total ? `${total.toLocaleString()} valid emails` : "No file uploaded" },
  ];
  const completion = Math.round((summaryItems.filter((s) => s.done).length / summaryItems.length) * 100);

  /* ───────── render ───────── */
  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .cm-input { width:100%; border-radius:8px; padding:10px 14px; font-size:13.5px; outline:none;
          background:${T.surface2}; color:${T.text}; box-shadow: inset 0 0 0 1px ${T.border};
          transition: box-shadow .15s, background .15s; }
        .cm-input:focus { box-shadow: inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}; background:${T.surfaceHi}; }
        .cm-input::placeholder { color:${T.textFaint}; }
        .cm-scroll::-webkit-scrollbar { width:6px; }
        .cm-scroll::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }
        .cm-scroll::-webkit-scrollbar-track { background:transparent; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes zoomIn { from{transform:scale(0.96)} to{transform:scale(1)} }
        .fade-in{animation:fadeIn .15s ease}
        .zoom-in-95{animation:zoomIn .15s ease}
        @media (prefers-reduced-motion: reduce){ .fade-in,.zoom-in-95{animation:none!important} }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto" style={{ height: "100vh", background: T.bg }}>
        <div className="mx-auto px-4 md:px-8 lg:px-10 py-6 md:py-10" style={{ maxWidth: 1160 }}>

          <header className="flex items-center gap-3 mb-7">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: T.textMuted, boxShadow: RING }} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                  style={{ background: tone.soft, color: tone.color, boxShadow: `inset 0 0 0 1px ${tone.color}33` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.color }} />
                  {status}
                </span>
                {editing && <span className="text-[11.5px]" style={{ color: T.textFaint }}>Step {step + 1} of {STEPS.length}</span>}
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight truncate" style={{ color: T.text }}>
                {editing ? "New campaign" : name}
              </h1>
              <p className="mt-1 text-[13.5px] truncate" style={{ color: T.textMuted }}>
                {editing ? "Set up your campaign in five steps." : subject}
              </p>
            </div>
          </header>

          {editing && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
              <div className="min-w-0 space-y-5">

                {/* Step rail (unchanged) */}
                <div className="rounded-xl px-1.5 py-1.5 overflow-x-auto cm-scroll" style={{ background: T.surface, boxShadow: RING }}>
                  <div className="flex items-center gap-1 min-w-max sm:min-w-0">
                    {STEPS.map((s, i) => {
                      const isDone = i < step, isCur = i === step, Icon = s.icon;
                      return (
                        <div key={s.label} className="flex items-center gap-1 flex-1 last:flex-none">
                          <button onClick={() => i < step && setStep(i)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all flex-1"
                            style={{ cursor: i < step ? "pointer" : "default", background: isCur ? T.brandSoft : "transparent" }}>
                            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                              style={{
                                background: isDone ? T.successSoft : isCur ? T.brand : T.surface2,
                                color: isDone ? T.success : isCur ? "#fff" : T.textFaint,
                                boxShadow: isDone || isCur ? "none" : `inset 0 0 0 1px ${T.border}`,
                              }}>
                              {isDone ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                            </span>
                            <span className="hidden sm:block min-w-0">
                              <span className="block text-[12px] font-medium leading-tight truncate"
                                style={{ color: isCur || isDone ? T.text : T.textFaint }}>{s.label}</span>
                            </span>
                          </button>
                          {i < STEPS.length - 1 && (
                            <span className="h-px w-2 shrink-0" style={{ background: isDone ? T.success : T.border }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Card className="p-5 md:p-7 animate-in fade-in duration-200" key={step}>
                  {/* Step 0: details (unchanged) */}
                  {step === 0 && (
                    <div className="space-y-6">
                      <Head title="Campaign details" sub="Start by naming your campaign and writing a subject." />
                      <Field label="Campaign name" hint="Only you see this — it helps you find the campaign later.">
                        <input className="cm-input" placeholder="e.g. October product launch"
                          value={name} onChange={(e) => setName(e.target.value)} />
                      </Field>
                      <Field label="Email subject" hint="This is what recipients see in their inbox."
                        right={<span className="text-[11px]" style={{ color: subject.length > 70 ? T.warn : T.textFaint, fontFamily: FONT.mono }}>{subject.length}/70</span>}>
                        <input className="cm-input" placeholder="e.g. Something new is here"
                          value={subject} onChange={(e) => setSubject(e.target.value)} />
                      </Field>
                      <div>
                        <p className="text-[12px] font-medium mb-2" style={{ color: T.textMuted }}>Inbox preview</p>
                        <div className="rounded-lg p-3.5 flex items-center gap-3"
                          style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: T.brandSoft, color: T.brand }}><Inbox size={15} /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                {sender?.display_name || "Your sender"}
                              </p>
                              <p className="text-[11px] shrink-0" style={{ color: T.textFaint }}>Just now</p>
                            </div>
                            <p className="text-[12.5px] truncate mt-0.5" style={{ color: subject.trim() ? T.textMuted : T.textFaint }}>
                              {subject.trim() || "Your subject line will appear here"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: sender (unchanged) */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <Head title="Sender account" sub="Only connected accounts with capacity left today are shown." />
                      {sendersLoading && accounts.length === 0 ? (
                        <Loading label="Loading sender accounts…" />
                      ) : sendersError && accounts.length === 0 ? (
                        <div className="space-y-3">
                          <Notice tone="error">{sendersError}</Notice>
                          <Btn onClick={() => fetchSenders?.()}>Retry</Btn>
                        </div>
                      ) : available.length === 0 ? (
                        <Notice tone="warn">No sender accounts are available right now. Connect or reconnect one on the Sender accounts page.</Notice>
                      ) : (
                        <div className="space-y-2.5">
                          {available.map((a) => {
                            const sel = a.id === senderId;
                            const limit = a.daily_limit ?? 0;
                            const used = a.emails_sent_today ?? 0;
                            const left = limit - used;
                            const usedPct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                            return (
                              <button key={a.id} onClick={() => setSenderId(a.id)}
                                className="w-full text-left rounded-lg p-3.5 transition-all hover:brightness-110"
                                style={{
                                  background: sel ? T.brandSoft : T.surface2,
                                  boxShadow: sel ? `inset 0 0 0 1.5px ${T.brandBorder}` : `inset 0 0 0 1px ${T.borderSoft}`,
                                }}>
                                <div className="flex items-center gap-3.5">
                                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
                                    style={{ background: "linear-gradient(135deg, #0A66C2, #053C74)" }}>
                                    {(a.provider ?? "?").slice(0, 1).toUpperCase()}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{a.email}</p>
                                    <p className="text-[11.5px] truncate mt-0.5" style={{ color: T.textFaint }}>{a.display_name} · {a.provider}</p>
                                  </div>
                                  <div className="text-right shrink-0 hidden sm:block">
                                    <p className="text-[13.5px] font-semibold" style={{ color: T.success, fontFamily: FONT.mono }}>{left.toLocaleString()}</p>
                                    <p className="text-[10.5px]" style={{ color: T.textFaint }}>sends left</p>
                                  </div>
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: sel ? T.brand : "transparent", boxShadow: sel ? "none" : `inset 0 0 0 1.5px ${T.border}` }}>
                                    {sel && <Check size={11} strokeWidth={3} className="text-white" />}
                                  </span>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                                    <div className="h-full rounded-full transition-all"
                                      style={{ width: `${usedPct}%`, background: usedPct > 80 ? T.warn : T.success }} />
                                  </div>
                                  <span className="text-[10.5px] shrink-0" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                    {used.toLocaleString()} / {limit.toLocaleString()}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: template (unchanged) */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <Head title="HTML template" sub="Pick the design for your email." />
                      {templatesLoading && templates.length === 0 ? (
                        <Loading label="Loading templates…" />
                      ) : templatesError && templates.length === 0 ? (
                        <div className="space-y-3">
                          <Notice tone="error">{templatesError}</Notice>
                          <Btn onClick={refetchTemplates}>Retry</Btn>
                        </div>
                      ) : templates.length === 0 ? (
                        <Notice tone="warn">No templates found. Create one on the Templates page first.</Notice>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="cm-scroll md:col-span-2 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
                            {templates.map((t) => {
                              const id = tplId(t), sel = id === templateId;
                              return (
                                <button key={id} onClick={() => setTemplateId(id)}
                                  className="w-full text-left rounded-lg p-3 flex items-center gap-3 transition-all hover:brightness-110"
                                  style={{
                                    background: sel ? T.brandSoft : T.surface2,
                                    boxShadow: sel ? `inset 0 0 0 1.5px ${T.brandBorder}` : `inset 0 0 0 1px ${T.borderSoft}`,
                                  }}>
                                  <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-[12px] font-semibold"
                                    style={{ background: sel ? "rgba(99,102,241,0.2)" : T.surfaceHi, color: sel ? T.brand : T.textMuted }}>
                                    {tplName(t).slice(0, 1).toUpperCase()}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{tplName(t)}</p>
                                    {tplDesc(t) && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: T.textFaint }}>{tplDesc(t)}</p>}
                                  </div>
                                  {sel && <Check size={14} strokeWidth={3} style={{ color: T.brand }} className="shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          <div className="md:col-span-3 rounded-lg overflow-hidden flex flex-col"
                            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.border}`, minHeight: 300 }}>
                            <div className="flex items-center gap-2 px-3.5 py-2 border-b" style={{ borderColor: T.borderSoft }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: "#EF4444", opacity: 0.6 }} />
                              <span className="w-2 h-2 rounded-full" style={{ background: "#F59E0B", opacity: 0.6 }} />
                              <span className="w-2 h-2 rounded-full" style={{ background: "#22C55E", opacity: 0.6 }} />
                              <span className="ml-2 text-[11px] truncate" style={{ color: T.textFaint }}>{template ? tplName(template) : "Preview"}</span>
                            </div>
                            {template ? (
                              tplHtml(template) ? (
                                <iframe title="Template preview" sandbox="" srcDoc={tplHtml(template)}
                                  className="w-full bg-white" style={{ height: 360, border: 0 }} />
                              ) : (
                                <div className="flex-1 flex items-center justify-center text-[12px]" style={{ color: T.textFaint, minHeight: 260 }}>
                                  This template has no HTML content
                                </div>
                              )
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[12px]" style={{ color: T.textFaint, minHeight: 260 }}>
                                <LayoutTemplate size={22} style={{ color: T.border }} />
                                Select a template to preview it
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: recipients (unchanged) */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <Head title="Recipients" sub="Upload a CSV or Excel file with an “email” column." />
                      {!fileName ? (
                        <div
                          role="button" tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                          onClick={() => fileRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files?.[0]); }}
                          className="cursor-pointer rounded-xl py-14 px-6 text-center transition-colors"
                          style={{ background: dragging ? T.brandSoft : T.surface2, border: `1.5px dashed ${dragging ? T.brand : T.border}` }}>
                          <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                            style={{ background: T.brandSoft, color: T.brand }}><UploadCloud size={20} /></div>
                          <p className="text-[14px] font-medium" style={{ color: T.text }}>Drop your file here, or click to browse</p>
                          <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>Make sure it has an “email” column.</p>
                          <div className="flex items-center justify-center gap-2 mt-4">
                            {[".csv", ".xlsx"].map((f) => (
                              <span key={f} className="rounded px-2 py-0.5 text-[11px]"
                                style={{ background: T.surfaceHi, color: T.textFaint, fontFamily: FONT.mono }}>{f}</span>
                            ))}
                          </div>
                          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
                            onChange={(e) => loadFile(e.target.files?.[0])} />
                        </div>
                      ) : (
                        <>
                          <div className="rounded-lg p-3.5 space-y-3" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: T.successSoft, color: T.success }}><FileText size={15} /></span>
                                <div className="min-w-0">
                                  <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{fileName}</p>
                                  <p className="text-[11px] mt-0.5 flex items-center gap-1.5"
                                    style={{ color: uploadError ? T.danger : uploaded ? T.success : T.textFaint }}>
                                    {uploaded && <CheckCircle2 size={11} />}
                                    {uploading ? `Uploading… ${progress}%`
                                      : extracting ? "Extracting emails…"
                                      : uploadError ? "Upload failed"
                                      : uploaded ? "Uploaded & extracted"
                                      : recipients ? "No usable emails"
                                      : "Waiting…"}
                                  </p>
                                </div>
                              </div>
                              <Btn variant="danger" size="sm" onClick={clearFile} disabled={uploading}>
                                <Trash2 size={12} /> Remove
                              </Btn>
                            </div>
                            {uploading && (
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: T.brand }} />
                              </div>
                            )}
                            {extracting && (
                              <div className="flex items-center gap-2 text-[11.5px]" style={{ color: T.textMuted }}>
                                <Loader2 size={12} className="animate-spin" /> Server is reading your file…
                              </div>
                            )}
                          </div>

                          {uploadError && <Notice tone="error">{uploadError} Remove the file and try again.</Notice>}

                          {recipients && (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                <Stat label="Rows" value={recipients.total.toLocaleString()} />
                                <Stat label="Valid" value={recipients.valid.toLocaleString()} tone={T.success} />
                                <Stat label="Invalid" value={recipients.invalid.toLocaleString()} tone={recipients.invalid ? T.danger : T.text} />
                                <Stat label="Duplicates" value={recipients.dupes.toLocaleString()} tone={recipients.dupes ? T.warn : T.text} />
                              </div>
                              {recipients.valid === 0 ? (
                                <Notice tone="error">No valid email addresses found in this file.</Notice>
                              ) : (
                                recipients.preview.length > 0 && (
                                  <div className="rounded-lg overflow-hidden" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                                    <p className="px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide border-b"
                                      style={{ color: T.textFaint, borderColor: T.borderSoft }}>Preview</p>
                                    {recipients.preview.map((e) => (
                                      <p key={e} className="px-3.5 py-2 text-[12px] border-b last:border-0"
                                        style={{ color: T.textMuted, fontFamily: FONT.mono, borderColor: T.borderSoft }}>{e}</p>
                                    ))}
                                  </div>
                                )
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 4: review */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <Head title="Review & start" sub="Check everything before sending." />

                      <div className="rounded-lg divide-y" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}`, borderColor: T.borderSoft }}>
                        {([
                          ["Campaign", name || "—", FileText, 0],
                          ["Subject", subject || "—", Type, 0],
                          ["Sender", sender ? `${sender.display_name} <${sender.email}>` : "—", Mail, 1],
                          ["Template", template ? tplName(template) : "—", LayoutTemplate, 2],
                          ["Recipients", total ? `${total.toLocaleString()} valid (${fileName})` : "—", Users, 3],
                        ] as const).map(([k, v, Icon, goto]) => (
                          <div key={k} className="flex items-center gap-3 px-3.5 py-3" style={{ borderColor: T.borderSoft }}>
                            <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                              style={{ background: T.surfaceHi, color: T.textFaint }}><Icon size={13} /></span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px]" style={{ color: T.textFaint }}>{k}</p>
                              <p className="text-[12.5px] font-medium truncate mt-0.5" style={{ color: T.text }}>{v}</p>
                            </div>
                            <button onClick={() => setStep(goto)}
                              className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                              style={{ color: T.textFaint }} aria-label={`Edit ${k}`}><Pencil size={12} /></button>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg p-3.5 space-y-2" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: T.textFaint }}>Checklist</p>
                        {checks.map((c) => (
                          <div key={c.label + (c.detail ?? "")} className="flex items-start gap-2 text-[12px]">
                            {c.ok ? <CheckCircle2 size={14} style={{ color: T.success }} className="mt-0.5 shrink-0" />
                              : c.level === "warn" ? <AlertTriangle size={14} style={{ color: T.warn }} className="mt-0.5 shrink-0" />
                              : <XCircle size={14} style={{ color: T.danger }} className="mt-0.5 shrink-0" />}
                            <span className="leading-5" style={{ color: c.ok ? T.textMuted : c.level === "warn" ? T.warn : T.danger }}>
                              <b className="font-medium">{c.label}</b>{!c.ok && c.detail ? ` — ${c.detail}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* NEW: honest scheduling info — replaces the fake "Schedule later" toggle. */}
                      <div className="rounded-lg p-3.5" style={{ background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}>
                        <div className="flex items-start gap-2.5">
                          <Timer size={15} style={{ color: T.brand }} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12.5px] font-medium" style={{ color: T.text }}>Sending starts immediately</p>
                            <p className="text-[11.5px] mt-1 leading-5" style={{ color: T.textMuted }}>
                              Emails are scheduled one-by-one with random human-like gaps
                              (15 seconds to 15 minutes), respecting {sender?.daily_limit?.toLocaleString() ?? "your"} daily
                              and {sender?.hourly_limit?.toLocaleString() ?? "hourly"} limits. You can pause or resume anytime —
                              remaining recipients get a fresh schedule on resume.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-3"
                        style={{
                          background: ready ? T.successSoft : T.dangerSoft,
                          boxShadow: `inset 0 0 0 1px ${ready ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)"}`,
                        }}>
                        {ready ? <CheckCircle2 size={15} style={{ color: T.success }} /> : <XCircle size={15} style={{ color: T.danger }} />}
                        <p className="text-[12.5px] font-medium" style={{ color: ready ? T.success : T.danger }}>
                          {ready ? "Campaign is ready to start" : "Fix the issues above to continue"}
                        </p>
                      </div>

                      {actionError && <Notice tone="error">{actionError}</Notice>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-7 pt-5 border-t" style={{ borderColor: T.borderSoft }}>
                    <Btn onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                      <ChevronLeft size={14} /> Back
                    </Btn>
                    {step < 4 ? (
                      <Btn variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                        Continue <ChevronRight size={14} />
                      </Btn>
                    ) : (
                      <Btn variant="primary" onClick={() => { setSubmitError(""); setConfirmOpen(true); }} disabled={!ready}>
                        <Rocket size={14} /> Start campaign
                      </Btn>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar summary (unchanged) */}
              <aside className="hidden lg:block sticky top-6 rounded-xl p-5" style={CARD}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold" style={{ color: T.text }}>Summary</p>
                  <span className="text-[12px] font-medium"
                    style={{ color: completion === 100 ? T.success : T.textMuted, fontFamily: FONT.mono }}>{completion}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: T.surfaceHi }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completion}%`, background: T.brand }} />
                </div>
                <div className="space-y-0.5">
                  {summaryItems.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button key={s.label} onClick={() => i < step && setStep(i)}
                        className="w-full flex items-center gap-2.5 rounded-md p-2 text-left transition-colors"
                        style={{ cursor: i < step ? "pointer" : "default", background: i === step ? T.surface2 : "transparent" }}>
                        <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: s.done ? T.successSoft : T.surface2, color: s.done ? T.success : T.textFaint }}>
                          {s.done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>{s.label}</span>
                          <span className="block text-[12px] font-medium truncate mt-0.5"
                            style={{ color: s.done ? T.text : T.textFaint }}>{s.value}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3.5 border-t flex items-center gap-2 text-[11px]" style={{ borderColor: T.borderSoft, color: T.textFaint }}>
                  <Clock size={11} /> Sends right after you start
                </div>
              </aside>
            </div>
          )}

          {/* Non-editing status view */}
          {!editing && (
            <Card className="p-5 md:p-7 space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                <div className="mx-auto md:mx-0">
                  <Ring pct={pct} color={status === "Cancelled" || status === "Failed" ? T.danger : T.brand} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold" style={{ color: T.text }}>
                    {status === "Completed" ? "Campaign completed"
                      : status === "Cancelled" ? "Campaign cancelled"
                      : status === "Failed" ? "Campaign failed"
                      : status === "Paused" ? "Campaign paused"
                      : "Sending in progress"}
                  </p>
                  <p className="text-[12.5px] mt-1 mb-4" style={{ color: T.textMuted }}>
                    {done.toLocaleString()} of {shownTotal.toLocaleString()} emails processed.
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: status === "Cancelled" || status === "Failed" ? T.danger : T.brand }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <Stat label="Total" value={shownTotal.toLocaleString()} />
                <Stat label="Sent" value={run.sent.toLocaleString()} tone={T.success} />
                <Stat label="Failed" value={run.failed.toLocaleString()} tone={run.failed ? T.danger : T.text} />
                <Stat label="Pending" value={(live?.pending ?? Math.max(0, shownTotal - done - (live?.queued ?? 0))).toLocaleString()} tone={T.info} />
                <Stat label="Queued" value={(live?.queued ?? 0).toLocaleString()} tone={T.purple} />
              </div>

              {/* NEW: scheduling info from /worker/progress */}
              {(status === "Running" || status === "Paused") && live && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-lg p-3.5 flex items-center gap-3"
                    style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                    <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "rgba(56,189,248,0.12)", color: T.info }}><Timer size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>Next send</p>
                      <p className="text-[13px] font-medium truncate mt-0.5" style={{ color: T.text }}>
                        {status === "Paused" ? "Paused" : live.next_send_at ? fmt(live.next_send_at) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg p-3.5 flex items-center gap-3"
                    style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                    <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "rgba(167,139,250,0.12)", color: T.purple }}><Hourglass size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] uppercase tracking-wide" style={{ color: T.textFaint }}>Estimated finish</p>
                      <p className="text-[13px] font-medium truncate mt-0.5" style={{ color: T.text }}>
                        {status === "Paused" ? "—" : live.estimated_finish_at ? fmt(live.estimated_finish_at) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === "Completed" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Stat label="Success rate" value={`${shownTotal ? ((run.sent / shownTotal) * 100).toFixed(1) : 0}%`} tone={T.success} />
                  <Stat label="Completed at" value={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                </div>
              )}

              {actionError && <Notice tone="error">{actionError}</Notice>}

              <div className="flex gap-2.5 flex-wrap">
                {status === "Running" && <Btn onClick={() => act(pauseCampaign, "Paused")}><Pause size={13} /> Pause</Btn>}
                {status === "Paused" && <Btn variant="primary" onClick={() => act(resumeCampaign, "Running")}><Play size={13} /> Resume</Btn>}
                {(status === "Running" || status === "Paused") && (
                  <Btn variant="danger" onClick={() => setCancelOpen(true)}><Ban size={13} /> Cancel campaign</Btn>
                )}
                {(status === "Completed" || status === "Cancelled" || status === "Failed") && (
                  <Btn variant="primary" onClick={reset}><Rocket size={13} /> New campaign</Btn>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>

      {confirmOpen && (
        <Modal onClose={() => !submitting && setConfirmOpen(false)}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: T.brandSoft, color: T.brand }}><Rocket size={18} /></div>
          <h2 className="text-[17px] font-semibold" style={{ color: T.text }}>Start this campaign?</h2>
          <p className="text-[13px] mt-2 leading-6" style={{ color: T.textMuted }}>
            <b style={{ color: T.text }}>{total.toLocaleString()}</b> emails will be sent from{" "}
            <b style={{ color: T.text }}>{sender?.email}</b> using the{" "}
            <b style={{ color: T.text }}>{template ? tplName(template) : ""}</b> template.
            Sending begins immediately with random human-like gaps. This can't be undone once emails are sent.
          </p>
          {submitError && <div className="mt-4"><Notice tone="error">{submitError}</Notice></div>}
          <div className="flex justify-end gap-2.5 mt-6">
            <Btn onClick={() => setConfirmOpen(false)} disabled={submitting}>Go back</Btn>
            <Btn variant="primary" onClick={launch} disabled={submitting}>
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? "Please wait…" : "Yes, start"}
            </Btn>
          </div>
        </Modal>
      )}

      {cancelOpen && (
        <Modal onClose={() => setCancelOpen(false)}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: T.dangerSoft, color: T.danger }}><Ban size={18} /></div>
          <h2 className="text-[17px] font-semibold" style={{ color: T.text }}>Cancel this campaign?</h2>
          <p className="text-[13px] mt-2 leading-6" style={{ color: T.textMuted }}>
            Sending will stop. Emails already sent can't be recalled.
          </p>
          <div className="mt-3">
            <Notice tone="warn">
              The backend cancel endpoint isn't implemented yet — this will return a 404.
              Use <b>Pause</b> until <code style={{ fontFamily: FONT.mono }}>POST /worker/cancel/:id</code> is added.
            </Notice>
          </div>
          <div className="flex justify-end gap-2.5 mt-6">
            <Btn onClick={() => setCancelOpen(false)}>Keep running</Btn>
            <Btn variant="danger" onClick={() => { setCancelOpen(false); act(cancelCampaign, "Cancelled").catch(() => {}); }}>
              Try cancel
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CampaignCreatePage;