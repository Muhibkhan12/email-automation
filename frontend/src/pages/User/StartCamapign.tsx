import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Menu, Check, ChevronLeft, ChevronRight, UploadCloud, FileText, Mail, LayoutTemplate,
  ClipboardCheck, Rocket, AlertTriangle, CheckCircle2, XCircle, Pause, Play, Ban,
  Calendar, X, Send, Users, Trash2, Loader2, Pencil, Type, Clock, Inbox,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import { useUpload } from "../../contexts/UploadContext";
import {
  waitForExtraction,
  summaryFromUpload,
  type RecipientsSummary,
} from "../../services/UploadServices";// ← new route
import { ExtractData } from "../../services/ExtractFile";
 // path apne project ke hisaab se
// ⚠️ yahan apne original campaign service imports rakhna:
// createCampaign, startCampaign, getCampaign, pauseCampaign, resumeCampaign, cancelCampaign, type CampaignDTO


/* ───────────── constants ───────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const CARD: React.CSSProperties = { background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" };
const RING = "inset 0 0 0 1px #1A1F2B";

type Status = "Draft" | "Ready" | "Scheduled" | "Running" | "Paused" | "Completed" | "Failed" | "Cancelled";

const STATUS_TONE: Record<Status, string> = {
  Draft: "#9BA0A8", Ready: "#60A5FA", Scheduled: "#A78BFA", Running: "#34D399",
  Paused: "#FBBF24", Completed: "#34D399", Failed: "#F87171", Cancelled: "#F87171",
};

const STEPS = [
  { label: "Details", sub: "Name & subject", icon: FileText },
  { label: "Recipients", sub: "Upload list", icon: Users },
  { label: "Sender", sub: "Pick account", icon: Mail },
  { label: "Template", sub: "Choose design", icon: LayoutTemplate },
  { label: "Review", sub: "Check & send", icon: ClipboardCheck },
];

/* ───────────── helpers ───────────── */

// Template shape tumhare type ke hisaab se alag ho sakta hai, isliye tolerant accessors
const tplId = (t: any): string => String(t?.id ?? t?._id ?? "");
const tplName = (t: any): string => t?.name ?? t?.title ?? t?.template_name ?? "Untitled template";
const tplDesc = (t: any): string => t?.description ?? t?.desc ?? t?.subject ?? "";
const tplHtml = (t: any): string => t?.html ?? t?.html_content ?? t?.content ?? t?.body ?? "";

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.detail?.toString?.() ?? e?.response?.data?.message ?? e?.message ?? fallback;

const toStatus = (raw?: string): Status | null => {
  const s = String(raw ?? "").toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "ready") return "Ready";
  if (s === "scheduled") return "Scheduled";
  if (["running", "sending", "in_progress", "processing"].includes(s)) return "Running";
  if (s === "paused") return "Paused";
  if (["completed", "done", "finished"].includes(s)) return "Completed";
  if (["failed", "error"].includes(s)) return "Failed";
  if (["cancelled", "canceled"].includes(s)) return "Cancelled";
  return null;
};

/* ───────────── small UI pieces ───────────── */

const Btn: React.FC<{
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = "ghost", onClick, disabled, children }) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, #FF7A4D 0%, #FF6A39 100%)",
      color: "#fff",
      boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65), inset 0 1px 0 rgba(255,255,255,0.18)",
    },
    ghost: { background: "#0F131C", color: "#DADEE7", boxShadow: RING },
    danger: { background: "rgba(248,113,113,0.08)", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cm-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      style={styles[variant]}
    >
      {children}
    </button>
  );
};

const Field: React.FC<{ label: string; hint?: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }> = ({
  label, hint, icon, right, children,
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#C7C9CE" }}>
        {icon && <span style={{ color: "#6A7080" }}>{icon}</span>}
        {label}
      </label>
      {right}
    </div>
    {children}
    {hint && <p className="text-[11.5px] mt-2" style={{ color: "#6A7080" }}>{hint}</p>}
  </div>
);

const Stat: React.FC<{ label: string; value: string | number; tone?: string; icon?: React.ReactNode }> = ({
  label, value, tone = "#F2F0EB", icon,
}) => (
  <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "#0F131C", boxShadow: RING }}>
    <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: tone, opacity: tone === "#F2F0EB" ? 0.25 : 0.9 }} />
    <div className="flex items-center justify-between">
      <p className="text-[11.5px] font-medium" style={{ color: "#7A8092" }}>{label}</p>
      {icon && <span style={{ color: tone, opacity: 0.8 }}>{icon}</span>}
    </div>
    <p className="text-[24px] font-bold mt-2 leading-none" style={{ color: tone, fontFamily: FONT.mono, letterSpacing: "-0.02em" }}>{value}</p>
  </div>
);

const Loading = ({ label }: { label: string }) => (
  <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "#0F131C", boxShadow: RING }}>
    <div className="flex items-center justify-center gap-2.5 text-[12.5px] py-2" style={{ color: "#6A7080" }}>
      <Loader2 size={15} className="animate-spin" /> {label}
    </div>
    {[0, 1].map((i) => <div key={i} className="cm-shimmer h-14 rounded-xl" />)}
  </div>
);

const Head = ({ title, sub, icon }: { title: string; sub: string; icon?: React.ReactNode }) => (
  <div className="flex items-start gap-3.5">
    {icon && (
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)", color: "#FF6A39" }}>
        {icon}
      </span>
    )}
    <div>
      <h2 className="text-[19px] font-semibold leading-tight" style={{ color: "#F2F0EB", fontFamily: FONT.display, letterSpacing: "-0.015em" }}>{title}</h2>
      <p className="text-[13px] mt-1" style={{ color: "#7A8092" }}>{sub}</p>
    </div>
  </div>
);

const Notice = ({ tone, children }: { tone: "error" | "warn"; children: React.ReactNode }) => {
  const c = tone === "error" ? "#F87171" : "#FBBF24";
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: `${c}14`, boxShadow: `inset 0 0 0 1px ${c}38` }}>
      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c}1F` }}>
        <AlertTriangle size={13} style={{ color: c }} />
      </span>
      <p className="text-[12.5px] leading-5 pt-0.5" style={{ color: c }}>{children}</p>
    </div>
  );
};

const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-3xl p-7 float-in"
      style={{ background: "linear-gradient(180deg, #171C28 0%, #141823 100%)", boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.6)" }}>
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-xl text-[#8A90A0] transition-colors hover:text-white" style={{ background: "#0F131C", boxShadow: RING }}>
        <X size={14} />
      </button>
      {children}
    </div>
  </div>
);

const Ring = ({ pct, color }: { pct: number; color: string }) => {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: 144, height: 144 }}>
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6A39" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <circle cx="72" cy="72" r={r} fill="none" stroke="#1B2130" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke={color === "grad" ? "url(#ringGrad)" : color}
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-bold leading-none" style={{ color: "#F2F0EB", fontFamily: FONT.mono, letterSpacing: "-0.03em" }}>{pct}%</span>
        <span className="text-[11px] mt-1.5" style={{ color: "#6A7080" }}>complete</span>
      </div>
    </div>
  );
};

/* ───────────── page ───────────── */

const CampaignCreatePage = () => {
  /* ── DB data: sender accounts ── */
  const ctx = useContext(SenderAccContext);
  const accounts: any[] = Array.isArray(ctx?.senderAcc) ? (ctx!.senderAcc as any[]) : [];
  const sendersLoading = ctx?.loading ?? false;
  const sendersError = ctx?.error ?? null;
  const fetchSenders = ctx?.fetchAllSenderAccounts;

  // Only accounts that are connected AND still have sending capacity today
  const available = accounts.filter(
    (a) => (a.status ?? "").toLowerCase() === "active" && (a.daily_limit ?? 0) - (a.emails_sent_today ?? 0) > 0
  );

  /* ── DB data: html templates ── */
  const { templates, loading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useHtmlTemplates();

  /* ── recipients upload (backend) ── */
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
  const [mode, setMode] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [status, setStatus] = useState<Status>("Draft");
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [run, setRun] = useState({ sent: 0, failed: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  // Har naye file load / remove / unmount pe purana extraction poll cancel karne ke liye
  const loadTokenRef = useRef(0);

  // Page khulte hi fresh sender data (emails_sent_today change hota rehta hai)
  useEffect(() => {
    fetchSenders?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unmount pe chalta hua poll stale ho jaye
  useEffect(() => {
    return () => { loadTokenRef.current++; };
  }, []);

  const sender = available.find((a) => a.id === senderId) ?? null;
  const template = templates.find((t) => tplId(t) === templateId) ?? null;
  const total = recipients?.valid ?? 0;
  const remaining = sender ? (sender.daily_limit ?? 0) - (sender.emails_sent_today ?? 0) : 0;

  /* ── validation for the review step ── */
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
    if (mode === "later") {
      if (!scheduleAt) list.push({ ok: false, level: "error", label: "Schedule", detail: "Pick a date and time." });
      else if (new Date(scheduleAt).getTime() <= Date.now())
        list.push({ ok: false, level: "error", label: "Schedule", detail: "Pick a time in the future." });
    }
    return list;
  }, [name, subject, total, uploaded, sender, template, remaining, recipients, mode, scheduleAt]);

  const ready = checks.every((c) => c.ok || c.level === "warn");

  useEffect(() => {
    if (status === "Draft" || status === "Ready") setStatus(ready ? "Ready" : "Draft");
  }, [ready, status]);

  /* ── sync server state into the UI ── */
  const applyServer = (c: CampaignDTO, fallback?: Status) => {
    setRun((r) => ({
      sent: c.sent_count ?? r.sent,
      failed: c.failed_count ?? r.failed,
      total: c.total_count ?? (r.total || total),
    }));
    const next = toStatus(c.status) ?? fallback;
    if (next) setStatus(next);
  };

  /* ── real progress: poll backend while scheduled / running / paused ── */
  useEffect(() => {
    if (!campaignId || !["Scheduled", "Running", "Paused"].includes(status)) return;
    let stop = false;
    const t = setInterval(async () => {
      try {
        const c = await getCampaign(campaignId);
        if (!stop) applyServer(c);
      } catch {
        /* ek poll fail hua to ignore, next tick retry karega */
      }
    }, 3000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, status]);

  /* ── handlers ── */
  // Flow: upload -> POST /worker/extract/{id} -> poll upload status -> stats UI
  const loadFile = async (file?: File) => {
    if (!file) return;
    const token = ++loadTokenRef.current;
    const stale = () => token !== loadTokenRef.current;

    setUploadError("");
    setUploaded(false);
    setUploadId(null);
    setRecipients(null);
    setFileName(file.name);
    setUploading(true);
    setExtracting(false);
    setProgress(0);

    try {
      const saved: any = await uploadRecipients(file, setProgress);
      if (stale()) return;
      const id: number | null = saved?.id ?? null;
      if (!id) throw new Error("File upload ho gayi, lekin response mein file id nahi mili.");
      setUploadId(id);
      setUploading(false);

      setExtracting(true);
      await ExtractData(id); // ← new route used here
      const finished = await waitForExtraction(id);
      if (stale()) return;

      const summary = summaryFromUpload(finished);
      setRecipients(summary);
      setUploaded(summary.valid > 0);
    } catch (e) {
      if (stale()) return;
      setUploadError(errMsg(e, "File upload failed. Please try again."));
    } finally {
      if (!stale()) {
        setUploading(false);
        setExtracting(false);
      }
    }
  };

  const clearFile = () => {
    loadTokenRef.current++; // chalta hua poll ignore ho jayega
    setRecipients(null); setFileName(""); setUploaded(false); setUploadId(null);
    setUploadError(""); setProgress(0); setUploading(false); setExtracting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canNext = [
    !!name.trim() && !!subject.trim(),
    total > 0 && uploaded && !uploading && !extracting,
    !!sender,
    !!template,
    ready,
  ][step];

  const launch = async () => {
    if (!sender || !template) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await createCampaign({
        name: name.trim(),
        subject: subject.trim(),
        upload_id: uploadId,
        sender_account_id: sender.id,
        template_id: (template as any).id ?? (template as any)._id,
        schedule_at: mode === "later" ? new Date(scheduleAt).toISOString() : null,
      });
      setCampaignId(created.id);
      setRun({ sent: 0, failed: 0, total });

      if (mode === "now") {
        const started = await startCampaign(created.id);
        applyServer(started, "Running");
      } else {
        applyServer(created, "Scheduled");
      }
      setConfirmOpen(false);
      fetchSenders?.(); // capacity refresh
    } catch (e) {
      setSubmitError(errMsg(e, "Could not create the campaign."));
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (fn: (id: number) => Promise<CampaignDTO>, fallback: Status) => {
    if (!campaignId) return;
    setActionError("");
    try {
      applyServer(await fn(campaignId), fallback);
    } catch (e) {
      setActionError(errMsg(e, "Action failed. Please try again."));
    }
  };

  const editSchedule = async () => {
    if (!campaignId) return;
    setActionError("");
    try {
      await cancelCampaign(campaignId); // purana schedule hata ke wizard wapas kholte hain
      setCampaignId(null);
      setStatus("Draft");
      setStep(4);
    } catch (e) {
      setActionError(errMsg(e, "Could not edit the schedule."));
    }
  };

  const reset = () => {
    setStep(0); setName(""); setSubject(""); clearFile();
    setSenderId(null); setTemplateId(null); setMode("now"); setScheduleAt("");
    setCampaignId(null); setSubmitError(""); setActionError("");
    setRun({ sent: 0, failed: 0, total: 0 }); setStatus("Draft");
  };

  const editing = status === "Draft" || status === "Ready";
  const shownTotal = run.total || total;
  const done = run.sent + run.failed;
  const pct = shownTotal ? Math.min(100, Math.round((done / shownTotal) * 100)) : 0;
  const tone = STATUS_TONE[status];
  const finished = status === "Completed" || status === "Cancelled" || status === "Failed";
  const live = status === "Running";

  // Right-side live summary (UI only)
  const summaryItems = [
    { label: "Details", icon: FileText, done: !!name.trim() && !!subject.trim(), value: name.trim() || "Not set yet" },
    { label: "Recipients", icon: Users, done: total > 0 && uploaded, value: total ? `${total.toLocaleString()} valid emails` : "No file uploaded" },
    { label: "Sender", icon: Mail, done: !!sender, value: sender?.email ?? "Not selected" },
    { label: "Template", icon: LayoutTemplate, done: !!template, value: template ? tplName(template) : "Not selected" },
  ];
  const completion = Math.round((summaryItems.filter((s) => s.done).length / summaryItems.length) * 100);

  /* ───────────── render ───────────── */
  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 var(--pulse, rgba(52,211,153,0.55)); } 70% { box-shadow: 0 0 0 7px rgba(0,0,0,0); } 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .pulse-dot { animation: pulseDot 1.8s ease-out infinite; }
        .cm-shimmer { background: linear-gradient(90deg, #131824 25%, #1A2030 50%, #131824 75%); background-size: 200% 100%; animation: shimmer 1.6s linear infinite; }
        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px -28px rgba(0,0,0,0.6); }
        .glow-top { background: radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%), radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%); }
        .grid-bg { background-image: linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px); background-size: 44px 44px; -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 420px); mask-image: linear-gradient(180deg, #000 0%, transparent 420px); }
        .cm-input { width: 100%; border-radius: 14px; padding: 12px 16px; font-size: 13.5px; outline: none; background: #0F131C; color: #E8E6E1; box-shadow: ${RING}; transition: box-shadow .2s; }
        .cm-input.has-icon { padding-left: 42px; }
        .cm-input:focus { box-shadow: inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10); }
        .cm-input::placeholder { color: #4A5162; }
        .cm-input[type="datetime-local"] { color-scheme: dark; }
        .cm-btn:focus-visible, .cm-opt:focus-visible, .cm-step:focus-visible { outline: 2px solid rgba(255,106,57,0.7); outline-offset: 2px; }
        .cm-opt { transition: transform .2s, box-shadow .2s, background .2s; }
        .cm-opt:hover { transform: translateY(-1px); }
        .cm-scroll::-webkit-scrollbar { width: 6px; }
        .cm-scroll::-webkit-scrollbar-thumb { background: #232938; border-radius: 99px; }
        @media (prefers-reduced-motion: reduce) { .float-in, .pulse-dot, .cm-shimmer { animation: none !important; } }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto relative" style={{ height: "100vh", background: "#0B0E13" }}>
        <div className="absolute inset-x-0 top-0 h-105 grid-bg pointer-events-none" aria-hidden />
        <div className="glow-top relative">
          <div className="mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-12" style={{ maxWidth: 1120 }}>

            {/* Header */}
            <header className="flex items-start gap-3 md:gap-4 mb-8">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2.5 rounded-xl text-[#C7C9CE] soft-ring" style={{ background: "#141823" }} aria-label="Open menu">
                <Menu size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5 text-[11.5px] font-medium mb-3"
                  style={{ background: `${tone}1A`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${live ? "pulse-dot" : ""}`}
                    style={{ background: tone, ["--pulse" as any]: `${tone}8C` }}
                  />
                  {status}
                </span>
                <h1 className="text-[30px] md:text-[40px] font-bold leading-[1.05] truncate" style={{ fontFamily: FONT.display, letterSpacing: "-0.03em", color: "#F2F0EB" }}>
                  {editing ? "New campaign" : name}
                </h1>
                <p className="mt-2.5 text-[14.5px] truncate" style={{ color: "#8A90A0" }}>
                  {editing ? "Set up your campaign in five quick steps." : subject}
                </p>
              </div>
              {editing && (
                <div className="hidden md:flex flex-col items-end gap-1 pt-1.5 shrink-0">
                  <span className="text-[12px]" style={{ color: "#6A7080" }}>Step {step + 1} of {STEPS.length}</span>
                  <span className="text-[13px] font-semibold" style={{ color: "#DADEE7", fontFamily: FONT.display }}>{STEPS[step].label}</span>
                </div>
              )}
            </header>

            {/* ═════════ WIZARD ═════════ */}
            {editing && (
              <>
                {/* Stepper */}
                <div className="rounded-2xl p-2.5 mb-6 soft-ring overflow-x-auto" style={{ background: "#0F131C" }}>
                  <div className="flex items-center gap-1.5 min-w-max sm:min-w-0">
                    {STEPS.map((s, i) => {
                      const isDone = i < step;
                      const isCur = i === step;
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="flex items-center gap-1.5 flex-1 last:flex-none">
                          <button
                            onClick={() => i < step && setStep(i)}
                            className="cm-step flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all flex-1"
                            style={{
                              cursor: i < step ? "pointer" : "default",
                              background: isCur ? "rgba(255,106,57,0.08)" : "transparent",
                              boxShadow: isCur ? "inset 0 0 0 1px rgba(255,106,57,0.3)" : "none",
                            }}
                          >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                              style={{
                                background: isDone ? "#34D399" : isCur ? "#FF6A39" : "#141823",
                                color: isDone || isCur ? "#0B0E13" : "#6A7080",
                                boxShadow: isDone || isCur ? "none" : "inset 0 0 0 1px #232938",
                              }}>
                              {isDone ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                            </span>
                            <span className="hidden sm:block min-w-0">
                              <span className="block text-[12.5px] font-semibold leading-tight" style={{ color: isCur || isDone ? "#F2F0EB" : "#5A6172" }}>{s.label}</span>
                              <span className="hidden xl:block text-[11px] mt-0.5 truncate" style={{ color: isCur ? "#8A90A0" : "#4A5162" }}>{s.sub}</span>
                            </span>
                          </button>
                          {i < STEPS.length - 1 && (
                            <span className="h-px w-3 shrink-0 sm:w-4" style={{ background: isDone ? "#34D39966" : "#1A1F2B" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
                  <section key={step} className="float-in rounded-3xl p-5 md:p-8 soft-ring" style={CARD}>

                    {/* Step 1 – Details */}
                    {step === 0 && (
                      <div className="space-y-6">
                        <Head icon={<FileText size={18} />} title="Campaign details" sub="Start by naming your campaign and writing a subject." />
                        <Field label="Campaign name" icon={<Pencil size={12} />} hint="Only you see this — it helps you find the campaign later.">
                          <input className="cm-input" placeholder="e.g. October product launch" value={name} onChange={(e) => setName(e.target.value)} />
                        </Field>
                        <Field
                          label="Email subject"
                          icon={<Type size={12} />}
                          hint="This is what recipients see in their inbox."
                          right={<span className="text-[11px]" style={{ color: subject.length > 70 ? "#FBBF24" : "#6A7080", fontFamily: FONT.mono }}>{subject.length}/70</span>}
                        >
                          <input className="cm-input" placeholder="e.g. Something new is here 🎉" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </Field>

                        {/* live inbox preview */}
                        <div>
                          <p className="text-[12px] font-medium mb-2" style={{ color: "#C7C9CE" }}>Inbox preview</p>
                          <div className="rounded-2xl p-4 flex items-center gap-3.5" style={{ background: "#0F131C", boxShadow: RING }}>
                            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
                              <Inbox size={16} className="text-[#FF6A39]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[13px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{sender?.display_name || "Your sender"}</p>
                                <p className="text-[11px] shrink-0" style={{ color: "#6A7080" }}>Just now</p>
                              </div>
                              <p className="text-[13px] truncate mt-0.5" style={{ color: subject.trim() ? "#DADEE7" : "#4A5162" }}>
                                {subject.trim() || "Your subject line will appear here"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2 – Recipients */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <Head icon={<Users size={18} />} title="Recipients" sub="Upload a CSV or Excel file with an “email” column." />
                        {!fileName ? (
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files?.[0]); }}
                            className="cm-opt cursor-pointer rounded-2xl py-14 px-6 text-center"
                            style={{
                              background: dragging ? "rgba(255,106,57,0.06)" : "#0F131C",
                              border: `1.5px dashed ${dragging ? "#FF6A39" : "#2A3040"}`,
                              transform: dragging ? "scale(1.01)" : undefined,
                            }}
                          >
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22), 0 12px 28px -12px rgba(255,106,57,0.5)" }}>
                              <UploadCloud size={22} className="text-[#FF6A39]" />
                            </div>
                            <p className="text-[15px] font-semibold" style={{ color: "#F2F0EB", fontFamily: FONT.display }}>Drop your file here, or click to browse</p>
                            <p className="text-[12.5px] mt-1.5" style={{ color: "#6A7080" }}>Make sure it has an “email” column.</p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              {[".csv", ".xlsx"].map((f) => (
                                <span key={f} className="rounded-lg px-2.5 py-1 text-[11.5px]" style={{ background: "#141823", color: "#8A90A0", boxShadow: "inset 0 0 0 1px #232938", fontFamily: FONT.mono }}>{f}</span>
                              ))}
                            </div>
                            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
                          </div>
                        ) : (
                          <>
                            <div className="rounded-2xl p-4 space-y-3.5" style={{ background: "#0F131C", boxShadow: RING }}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.10)", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.22)" }}>
                                    <FileText size={17} className="text-[#34D399]" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[13.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{fileName}</p>
                                    <p className="text-[11.5px] mt-0.5 flex items-center gap-1.5" style={{ color: uploadError ? "#F87171" : uploaded ? "#34D399" : "#6A7080" }}>
                                      {uploaded && <CheckCircle2 size={12} />}
                                      {uploading
                                        ? `Uploading… ${progress}%`
                                        : extracting
                                        ? "Extracting emails…"
                                        : uploadError
                                        ? "Upload failed"
                                        : uploaded
                                        ? "Uploaded & extracted"
                                        : recipients
                                        ? "No usable emails"
                                        : "Waiting…"}
                                    </p>
                                  </div>
                                </div>
                                <Btn variant="danger" onClick={clearFile} disabled={uploading}><Trash2 size={13} /> Remove</Btn>
                              </div>
                              {uploading && (
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #FF6A39, #FF8A5E)" }} />
                                </div>
                              )}
                              {extracting && (
                                <div className="flex items-center gap-2 text-[12px]" style={{ color: "#6A7080" }}>
                                  <Loader2 size={13} className="animate-spin" /> Server is reading your file…
                                </div>
                              )}
                            </div>

                            {uploadError && <Notice tone="error">{uploadError} Remove the file and try again.</Notice>}

                            {recipients && (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <Stat label="Rows" value={recipients.total.toLocaleString()} icon={<FileText size={14} />} />
                                  <Stat label="Valid" value={recipients.valid.toLocaleString()} tone="#34D399" icon={<CheckCircle2 size={14} />} />
                                  <Stat label="Invalid" value={recipients.invalid.toLocaleString()} tone={recipients.invalid ? "#F87171" : "#F2F0EB"} icon={<XCircle size={14} />} />
                                  <Stat label="Duplicates" value={recipients.dupes.toLocaleString()} tone={recipients.dupes ? "#FBBF24" : "#F2F0EB"} icon={<AlertTriangle size={14} />} />
                                </div>

                                {recipients.total > 0 && (
                                  <div>
                                    <div className="flex h-2 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                                      <div style={{ width: `${(recipients.valid / recipients.total) * 100}%`, background: "#34D399" }} />
                                      <div style={{ width: `${(recipients.invalid / recipients.total) * 100}%`, background: "#F87171" }} />
                                      <div style={{ width: `${(recipients.dupes / recipients.total) * 100}%`, background: "#FBBF24" }} />
                                    </div>
                                    <p className="text-[11.5px] mt-2" style={{ color: "#6A7080" }}>
                                      {Math.round((recipients.valid / recipients.total) * 100)}% of rows are ready to send.
                                    </p>
                                  </div>
                                )}

                                {recipients.valid === 0 ? (
                                  <Notice tone="error">No valid email addresses found in this file.</Notice>
                                ) : (
                                  recipients.preview.length > 0 && (
                                    <div className="rounded-2xl overflow-hidden" style={{ background: "#0F131C", boxShadow: RING }}>
                                      <p className="px-4 py-3 text-[12px] font-medium border-b border-[#1A1F2B]" style={{ color: "#8A90A0" }}>Preview</p>
                                      {recipients.preview.map((e) => (
                                        <p key={e} className="px-4 py-2.5 text-[12.5px] border-b border-[#1A1F2B] last:border-0" style={{ color: "#DADEE7", fontFamily: FONT.mono }}>{e}</p>
                                      ))}
                                      {recipients.valid > recipients.preview.length && (
                                        <p className="px-4 py-2.5 text-[11.5px]" style={{ color: "#6A7080", background: "rgba(255,255,255,0.015)" }}>+ {(recipients.valid - recipients.preview.length).toLocaleString()} more</p>
                                      )}
                                    </div>
                                  )
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 3 – Sender (from DB) */}
                    {step === 2 && (
                      <div className="space-y-5">
                        <Head icon={<Mail size={18} />} title="Sender account" sub="Only connected accounts with capacity left today are shown." />
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
                          <div className="space-y-3">
                            {available.map((a) => {
                              const sel = a.id === senderId;
                              const limit = a.daily_limit ?? 0;
                              const used = a.emails_sent_today ?? 0;
                              const left = limit - used;
                              const usedPct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                              return (
                                <button key={a.id} onClick={() => setSenderId(a.id)}
                                  className="cm-opt w-full text-left rounded-2xl p-4"
                                  style={{
                                    background: sel ? "rgba(255,106,57,0.06)" : "#0F131C",
                                    boxShadow: sel ? "inset 0 0 0 1.5px rgba(255,106,57,0.7), 0 0 0 4px rgba(255,106,57,0.08)" : RING,
                                  }}>
                                  <div className="flex items-center gap-4">
                                    <span className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                                      style={{ background: "linear-gradient(135deg, #0A66C2, #053C74)" }}>
                                      {(a.provider ?? "?").slice(0, 1).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[14px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{a.email}</p>
                                      <p className="text-[12px] truncate mt-0.5" style={{ color: "#7A8092" }}>{a.display_name} · {a.provider}</p>
                                    </div>
                                    <div className="text-right shrink-0 hidden sm:block">
                                      <p className="text-[15px] font-semibold" style={{ color: "#34D399", fontFamily: FONT.mono }}>{left.toLocaleString()}</p>
                                      <p className="text-[11px]" style={{ color: "#6A7080" }}>sends left today</p>
                                    </div>
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                      style={{ background: sel ? "#FF6A39" : "transparent", boxShadow: sel ? "none" : "inset 0 0 0 1.5px #2A2F3B" }}>
                                      {sel && <Check size={13} strokeWidth={3} className="text-white" />}
                                    </span>
                                  </div>
                                  <div className="mt-3.5 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                                      <div className="h-full rounded-full" style={{ width: `${usedPct}%`, background: usedPct > 80 ? "#FBBF24" : "#34D399" }} />
                                    </div>
                                    <span className="text-[11px] shrink-0" style={{ color: "#6A7080", fontFamily: FONT.mono }}>
                                      {used.toLocaleString()} / {limit.toLocaleString()} <span className="sm:hidden">· {left.toLocaleString()} left</span>
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4 – Template (from DB) */}
                    {step === 3 && (
                      <div className="space-y-5">
                        <Head icon={<LayoutTemplate size={18} />} title="HTML template" sub="Pick the design for your email." />
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
                            <div className="cm-scroll md:col-span-2 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
                              {templates.map((t) => {
                                const id = tplId(t);
                                const sel = id === templateId;
                                return (
                                  <button key={id} onClick={() => setTemplateId(id)} className="cm-opt w-full text-left rounded-2xl p-3.5 flex items-center gap-3"
                                    style={{
                                      background: sel ? "rgba(255,106,57,0.06)" : "#0F131C",
                                      boxShadow: sel ? "inset 0 0 0 1.5px rgba(255,106,57,0.7), 0 0 0 4px rgba(255,106,57,0.08)" : RING,
                                    }}>
                                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold"
                                      style={{ background: sel ? "rgba(255,106,57,0.14)" : "#141823", color: sel ? "#FF6A39" : "#8A90A0", boxShadow: "inset 0 0 0 1px #232938", fontFamily: FONT.display }}>
                                      {tplName(t).slice(0, 1).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[13.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{tplName(t)}</p>
                                      {tplDesc(t) && <p className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: "#7A8092" }}>{tplDesc(t)}</p>}
                                    </div>
                                    {sel && <Check size={15} strokeWidth={3} className="text-[#FF6A39] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="md:col-span-3 rounded-2xl overflow-hidden flex flex-col" style={{ background: "#0F131C", boxShadow: RING, minHeight: 300 }}>
                              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1A1F2B]">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171", opacity: 0.7 }} />
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24", opacity: 0.7 }} />
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399", opacity: 0.7 }} />
                                <span className="ml-2 text-[11.5px] truncate" style={{ color: "#6A7080" }}>{template ? tplName(template) : "Preview"}</span>
                              </div>
                              {template ? (
                                tplHtml(template) ? (
                                  <iframe title="Template preview" sandbox="" srcDoc={tplHtml(template)} className="w-full bg-white" style={{ height: 360, border: 0 }} />
                                ) : (
                                  <div className="flex-1 flex items-center justify-center text-[12.5px]" style={{ color: "#6A7080", minHeight: 260 }}>This template has no HTML content</div>
                                )
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[12.5px]" style={{ color: "#6A7080", minHeight: 260 }}>
                                  <LayoutTemplate size={22} style={{ color: "#2A3040" }} />
                                  Select a template to preview it
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 5 – Review */}
                    {step === 4 && (
                      <div className="space-y-7">
                        <Head icon={<ClipboardCheck size={18} />} title="Review & start" sub="Check everything before sending." />

                        <div className="rounded-2xl divide-y divide-[#1A1F2B]" style={{ background: "#0F131C", boxShadow: RING }}>
                          {([
                            ["Campaign", name || "—", FileText, 0],
                            ["Subject", subject || "—", Type, 0],
                            ["Recipients", total ? `${total.toLocaleString()} valid (${fileName})` : "—", Users, 1],
                            ["Sender", sender ? `${sender.display_name} <${sender.email}>` : "—", Mail, 2],
                            ["Template", template ? tplName(template) : "—", LayoutTemplate, 3],
                          ] as const).map(([k, v, Icon, goto]) => (
                            <div key={k} className="flex items-center gap-3.5 px-4 py-3.5">
                              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#141823", color: "#6A7080", boxShadow: "inset 0 0 0 1px #232938" }}>
                                <Icon size={14} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11.5px]" style={{ color: "#6A7080" }}>{k}</p>
                                <p className="text-[13.5px] font-medium truncate mt-0.5" style={{ color: "#F2F0EB" }}>{v}</p>
                              </div>
                              <button onClick={() => setStep(goto)} className="cm-btn rounded-lg p-2 transition-colors hover:text-white" style={{ color: "#6A7080" }} aria-label={`Edit ${k}`}>
                                <Pencil size={13} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Validation */}
                        <div className="rounded-2xl p-4 space-y-2.5" style={{ background: "#0F131C", boxShadow: RING }}>
                          <p className="text-[12px] font-medium" style={{ color: "#8A90A0" }}>Checklist</p>
                          {checks.map((c) => (
                            <div key={c.label + (c.detail ?? "")} className="flex items-start gap-2.5 text-[12.5px]">
                              {c.ok ? <CheckCircle2 size={15} className="text-[#34D399] mt-0.5 shrink-0" />
                                : c.level === "warn" ? <AlertTriangle size={15} className="text-[#FBBF24] mt-0.5 shrink-0" />
                                : <XCircle size={15} className="text-[#F87171] mt-0.5 shrink-0" />}
                              <span className="leading-5" style={{ color: c.ok ? "#DADEE7" : c.level === "warn" ? "#FBBF24" : "#F87171" }}>
                                <b className="font-medium">{c.label}</b>{!c.ok && c.detail ? ` — ${c.detail}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* When to send */}
                        <div>
                          <p className="text-[12px] font-medium mb-2.5" style={{ color: "#C7C9CE" }}>When to send</p>
                          <div className="grid grid-cols-2 gap-3">
                            {([["now", "Send now", "Starts right away", Send], ["later", "Schedule", "Pick a date & time", Calendar]] as const).map(([id, label, sub, Icon]) => (
                              <button key={id} onClick={() => setMode(id)} className="cm-opt flex items-center gap-3 rounded-2xl p-4 text-left"
                                style={{
                                  background: mode === id ? "rgba(255,106,57,0.06)" : "#0F131C",
                                  boxShadow: mode === id ? "inset 0 0 0 1.5px rgba(255,106,57,0.7), 0 0 0 4px rgba(255,106,57,0.08)" : RING,
                                }}>
                                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                  style={{ background: mode === id ? "rgba(255,106,57,0.14)" : "#141823", color: mode === id ? "#FF6A39" : "#6A7080", boxShadow: "inset 0 0 0 1px #232938" }}>
                                  <Icon size={15} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[13.5px] font-semibold" style={{ color: mode === id ? "#F2F0EB" : "#8A90A0" }}>{label}</span>
                                  <span className="block text-[11.5px] mt-0.5 truncate" style={{ color: "#6A7080" }}>{sub}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                          {mode === "later" && (
                            <div className="mt-3 float-in relative">
                              <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6A7080" }} />
                              <input type="datetime-local" className="cm-input has-icon" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                          style={{ background: ready ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", boxShadow: `inset 0 0 0 1px ${ready ? "rgba(52,211,153,0.22)" : "rgba(248,113,113,0.22)"}` }}>
                          {ready ? <CheckCircle2 size={17} className="text-[#34D399]" /> : <XCircle size={17} className="text-[#F87171]" />}
                          <p className="text-[13px] font-medium" style={{ color: ready ? "#34D399" : "#F87171" }}>
                            {ready ? "Campaign is ready to start" : "Fix the issues above to continue"}
                          </p>
                        </div>

                        {actionError && <Notice tone="error">{actionError}</Notice>}
                      </div>
                    )}

                    {/* Nav */}
                    <div className="flex items-center justify-between mt-9 pt-6 border-t border-[#1A1F2B]">
                      <Btn onClick={() => setStep((s) => s - 1)} disabled={step === 0}><ChevronLeft size={14} /> Back</Btn>
                      {step < 4 ? (
                        <Btn variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Continue <ChevronRight size={14} /></Btn>
                      ) : (
                        <Btn variant="primary" onClick={() => { setSubmitError(""); setConfirmOpen(true); }} disabled={!ready}>
                          <Rocket size={14} /> {mode === "later" ? "Schedule campaign" : "Start campaign"}
                        </Btn>
                      )}
                    </div>
                  </section>

                  {/* Live summary */}
                  <aside className="hidden lg:block sticky top-6 rounded-3xl p-5 soft-ring" style={CARD}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[14px] font-semibold" style={{ color: "#F2F0EB", fontFamily: FONT.display }}>Campaign summary</p>
                      <span className="text-[12px] font-semibold" style={{ color: completion === 100 ? "#34D399" : "#8A90A0", fontFamily: FONT.mono }}>{completion}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: "#1B2130" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completion}%`, background: "linear-gradient(90deg, #FF6A39, #34D399)" }} />
                    </div>
                    <div className="space-y-1">
                      {summaryItems.map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.label}
                            onClick={() => i < step && setStep(i)}
                            className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors"
                            style={{ cursor: i < step ? "pointer" : "default", background: i === step ? "rgba(255,255,255,0.03)" : "transparent" }}
                          >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: s.done ? "rgba(52,211,153,0.10)" : "#0F131C",
                                color: s.done ? "#34D399" : "#5A6172",
                                boxShadow: s.done ? "inset 0 0 0 1px rgba(52,211,153,0.22)" : "inset 0 0 0 1px #232938",
                              }}>
                              {s.done ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11.5px]" style={{ color: "#6A7080" }}>{s.label}</span>
                              <span className="block text-[12.5px] font-medium truncate mt-0.5" style={{ color: s.done ? "#F2F0EB" : "#4A5162" }}>{s.value}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#1A1F2B] flex items-center gap-2 text-[11.5px]" style={{ color: "#6A7080" }}>
                      <Clock size={12} />
                      {mode === "later" && scheduleAt ? `Scheduled · ${new Date(scheduleAt).toLocaleString()}` : mode === "later" ? "Scheduled · pick a time" : "Sends right after you start"}
                    </div>
                  </aside>
                </div>
              </>
            )}

            {/* ═════════ AFTER LAUNCH: scheduled / running / done ═════════ */}
            {!editing && (
              <section className="float-in rounded-3xl p-5 md:p-8 soft-ring space-y-7" style={CARD}>
                {status === "Scheduled" ? (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.10)", boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.25)" }}>
                        <Calendar size={22} className="text-[#A78BFA]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[17px] font-semibold" style={{ color: "#F2F0EB", fontFamily: FONT.display }}>Scheduled for {new Date(scheduleAt).toLocaleString()}</p>
                        <p className="text-[13px] mt-1" style={{ color: "#7A8092" }}>{shownTotal.toLocaleString()} emails will be sent from {sender?.email}.</p>
                      </div>
                    </div>
                    {actionError && <Notice tone="error">{actionError}</Notice>}
                    <div className="flex gap-2.5 flex-wrap">
                      <Btn onClick={editSchedule}><Pencil size={13} /> Edit schedule</Btn>
                      <Btn variant="primary" onClick={() => act(startCampaign, "Running")}><Play size={13} /> Send now</Btn>
                      <Btn variant="danger" onClick={() => act(cancelCampaign, "Cancelled")}>Cancel schedule</Btn>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-9">
                      <div className="mx-auto md:mx-0">
                        <Ring pct={pct} color={status === "Cancelled" || status === "Failed" ? "#F87171" : "grad"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[19px] font-semibold" style={{ color: "#F2F0EB", fontFamily: FONT.display }}>
                          {status === "Completed" ? "Campaign completed" : status === "Cancelled" ? "Campaign cancelled" : status === "Failed" ? "Campaign failed" : status === "Paused" ? "Campaign paused" : "Sending in progress"}
                        </p>
                        <p className="text-[13px] mt-1 mb-5" style={{ color: "#7A8092" }}>
                          {done.toLocaleString()} of {shownTotal.toLocaleString()} emails processed.
                        </p>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: status === "Cancelled" || status === "Failed" ? "#F87171" : "linear-gradient(90deg, #FF6A39, #34D399)" }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat label="Total" value={shownTotal.toLocaleString()} icon={<Users size={14} />} />
                      <Stat label="Sent" value={run.sent.toLocaleString()} tone="#34D399" icon={<CheckCircle2 size={14} />} />
                      <Stat label="Failed" value={run.failed.toLocaleString()} tone={run.failed ? "#F87171" : "#F2F0EB"} icon={<XCircle size={14} />} />
                      <Stat label="Pending" value={Math.max(0, shownTotal - done).toLocaleString()} tone="#60A5FA" icon={<Clock size={14} />} />
                    </div>

                    {status === "Completed" && (
                      <div className="grid grid-cols-2 gap-3">
                        <Stat label="Success rate" value={`${shownTotal ? ((run.sent / shownTotal) * 100).toFixed(1) : 0}%`} tone="#34D399" />
                        <Stat label="Completed at" value={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                      </div>
                    )}

                    {actionError && <Notice tone="error">{actionError}</Notice>}

                    <div className="flex gap-2.5 flex-wrap">
                      {status === "Running" && <Btn onClick={() => act(pauseCampaign, "Paused")}><Pause size={13} /> Pause</Btn>}
                      {status === "Paused" && <Btn variant="primary" onClick={() => act(resumeCampaign, "Running")}><Play size={13} /> Resume</Btn>}
                      {(status === "Running" || status === "Paused") && <Btn variant="danger" onClick={() => setCancelOpen(true)}><Ban size={13} /> Cancel campaign</Btn>}
                      {finished && <Btn variant="primary" onClick={reset}><Rocket size={13} /> New campaign</Btn>}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Start confirmation */}
      {confirmOpen && (
        <Modal onClose={() => !submitting && setConfirmOpen(false)}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22), 0 12px 28px -12px rgba(255,106,57,0.5)" }}>
            <Rocket size={20} className="text-[#FF6A39]" />
          </div>
          <h2 className="text-[20px] font-bold text-white" style={{ fontFamily: FONT.display, letterSpacing: "-0.015em" }}>
            {mode === "later" ? "Schedule this campaign?" : "Start this campaign?"}
          </h2>
          <p className="text-[13.5px] mt-2.5 leading-6" style={{ color: "#8A90A0" }}>
            <b style={{ color: "#F2F0EB" }}>{total.toLocaleString()}</b> emails will be sent from{" "}
            <b style={{ color: "#F2F0EB" }}>{sender?.email}</b> using the <b style={{ color: "#F2F0EB" }}>{template ? tplName(template) : ""}</b> template
            {mode === "later" ? <> on <b style={{ color: "#F2F0EB" }}>{new Date(scheduleAt).toLocaleString()}</b></> : ""}. This can't be undone once emails are sent.
          </p>
          {submitError && <div className="mt-4"><Notice tone="error">{submitError}</Notice></div>}
          <div className="flex justify-end gap-2.5 mt-7">
            <Btn onClick={() => setConfirmOpen(false)} disabled={submitting}>Go back</Btn>
            <Btn variant="primary" onClick={launch} disabled={submitting}>
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? "Please wait…" : mode === "later" ? "Confirm schedule" : "Yes, start"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Cancel confirmation */}
      {cancelOpen && (
        <Modal onClose={() => setCancelOpen(false)}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(248,113,113,0.10)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
            <Ban size={20} className="text-[#F87171]" />
          </div>
          <h2 className="text-[20px] font-bold text-white" style={{ fontFamily: FONT.display, letterSpacing: "-0.015em" }}>Cancel this campaign?</h2>
          <p className="text-[13.5px] mt-2.5 leading-6" style={{ color: "#8A90A0" }}>
            Sending will stop. Emails already sent can't be recalled.
          </p>
          <div className="flex justify-end gap-2.5 mt-7">
            <Btn onClick={() => setCancelOpen(false)}>Keep running</Btn>
            <Btn variant="danger" onClick={() => { setCancelOpen(false); act(cancelCampaign, "Cancelled"); }}>Cancel campaign</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CampaignCreatePage;