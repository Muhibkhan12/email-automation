import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Menu, Check, ChevronLeft, ChevronRight, UploadCloud, FileText, Mail, LayoutTemplate,
  ClipboardCheck, Rocket, AlertTriangle, CheckCircle2, XCircle, Pause, Play, Ban,
  Calendar, X, Send, Users, Trash2, Loader2,
} from "lucide-react";
import { SenderAccContext } from "../../contexts/SenderAccountsContext";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import { useUpload } from "../../contexts/UploadContext";


/* ───────────── constants ───────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const CARD: React.CSSProperties = { background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" };
const RING = "inset 0 0 0 1px #1A1F2B";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "Draft" | "Ready" | "Scheduled" | "Running" | "Paused" | "Completed" | "Failed" | "Cancelled";

const STATUS_TONE: Record<Status, string> = {
  Draft: "#9BA0A8", Ready: "#60A5FA", Scheduled: "#A78BFA", Running: "#34D399",
  Paused: "#FBBF24", Completed: "#34D399", Failed: "#F87171", Cancelled: "#F87171",
};

const STEPS = [
  { label: "Details", icon: FileText },
  { label: "Recipients", icon: Users },
  { label: "Sender", icon: Mail },
  { label: "Template", icon: LayoutTemplate },
  { label: "Review", icon: ClipboardCheck },
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

function parseRecipients(text: string) {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean)
    .map((r) => r.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  if (!rows.length) return { total: 0, valid: [] as string[], invalid: [] as string[], dupes: 0 };

  let idx = rows[0].findIndex((h) => h.toLowerCase().includes("email"));
  const hasHeader = idx >= 0;
  if (idx < 0) idx = Math.max(0, rows[0].findIndex((c) => EMAIL_RE.test(c)));
  const data = hasHeader ? rows.slice(1) : rows;

  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let dupes = 0;
  for (const r of data) {
    const e = (r[idx] ?? "").toLowerCase();
    if (!EMAIL_RE.test(e)) { invalid.push(r[idx] || "(empty)"); continue; }
    if (seen.has(e)) { dupes++; continue; }
    seen.add(e);
    valid.push(e);
  }
  return { total: data.length, valid, invalid, dupes };
}

/* ───────────── small UI pieces ───────────── */

const Btn: React.FC<{
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = "ghost", onClick, disabled, children }) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" },
    ghost: { background: "#0F131C", color: "#DADEE7", boxShadow: RING },
    danger: { background: "rgba(248,113,113,0.08)", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      style={styles[variant]}
    >
      {children}
    </button>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#C7C9CE" }}>{label}</label>
    {children}
    {hint && <p className="text-[11px] mt-1.5" style={{ color: "#6A7080" }}>{hint}</p>}
  </div>
);

const Stat: React.FC<{ label: string; value: string | number; tone?: string }> = ({ label, value, tone = "#F2F0EB" }) => (
  <div className="rounded-2xl p-4" style={{ background: "#0F131C", boxShadow: RING }}>
    <p className="text-[10.5px] uppercase tracking-wider" style={{ color: "#6A7080" }}>{label}</p>
    <p className="text-[24px] font-bold mt-1.5 leading-none" style={{ color: tone, fontFamily: FONT.mono }}>{value}</p>
  </div>
);

const Loading = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-2.5 rounded-2xl py-10 text-[12.5px]" style={{ background: "#0F131C", boxShadow: RING, color: "#6A7080" }}>
    <Loader2 size={15} className="animate-spin" /> {label}
  </div>
);

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
  const [recipients, setRecipients] = useState<ReturnType<typeof parseRecipients> | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // Page khulte hi fresh sender data (emails_sent_today change hota rehta hai)
  useEffect(() => {
    fetchSenders?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sender = available.find((a) => a.id === senderId) ?? null;
  const template = templates.find((t) => tplId(t) === templateId) ?? null;
  const total = recipients?.valid.length ?? 0;
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
    if (recipients && recipients.invalid.length > 0) {
      list.push({ ok: false, level: "warn", label: "Invalid emails", detail: `${recipients.invalid.length} invalid row(s) will be skipped.` });
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
  const loadFile = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    setUploaded(false);
    setUploadId(null);

    const text = await file.text();
    const parsed = parseRecipients(text);
    setFileName(file.name);
    setRecipients(parsed);
    if (parsed.valid.length === 0) return;

    setUploading(true);
    setProgress(0);
    try {
      const saved: any = await uploadRecipients(file, setProgress);
      setUploadId(saved?.id ?? null);
      setUploaded(true);
    } catch (e) {
      setUploadError(errMsg(e, "File upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setRecipients(null); setFileName(""); setUploaded(false); setUploadId(null);
    setUploadError(""); setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canNext = [
    !!name.trim() && !!subject.trim(),
    total > 0 && uploaded && !uploading,
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

  /* ───────────── render ───────────── */
  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
        .glow-top { background: radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%), radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%); }
        .cm-input { width: 100%; border-radius: 16px; padding: 10px 16px; font-size: 13px; outline: none; background: #0F131C; color: #E8E6E1; box-shadow: ${RING}; transition: box-shadow .2s; }
        .cm-input:focus { box-shadow: inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10); }
        .cm-input::placeholder { color: #4A5162; }
        .cm-input[type="datetime-local"] { color-scheme: dark; }
      `}</style>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto" style={{ height: "100vh", background: "#0B0E13" }}>
        <div className="glow-top">
          <div className="max-w-215 mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-12">

            {/* Header */}
            <header className="flex items-start gap-3 md:gap-4 mb-8">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] soft-ring" style={{ background: "#141823" }}>
                <Menu size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium mb-2.5"
                  style={{ background: `${tone}1A`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
                  {status.toUpperCase()}
                </span>
                <h1 className="text-[28px] md:text-[36px] font-bold leading-[1.05] truncate" style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}>
                  {editing ? "New campaign" : name}
                </h1>
                <p className="mt-2 text-[14px]" style={{ color: "#8A90A0" }}>
                  {editing ? "Set up your campaign in a few quick steps." : subject}
                </p>
              </div>
            </header>

            {/* ═════════ WIZARD ═════════ */}
            {editing && (
              <>
                {/* Stepper */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                  {STEPS.map((s, i) => {
                    const isDone = i < step;
                    const isCur = i === step;
                    return (
                      <div key={s.label} className="flex items-center gap-2 flex-1 last:flex-none min-w-fit">
                        <button
                          onClick={() => i < step && setStep(i)}
                          className="flex items-center gap-2"
                          style={{ cursor: i < step ? "pointer" : "default" }}
                        >
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
                            style={{
                              background: isDone ? "#34D399" : isCur ? "#FF6A39" : "#0F131C",
                              color: isDone || isCur ? "#0B0E13" : "#6A7080",
                              boxShadow: isDone || isCur ? "none" : "inset 0 0 0 1px #232938",
                              fontFamily: FONT.mono,
                            }}>
                            {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
                          </span>
                          <span className="hidden sm:inline text-[12.5px] font-medium" style={{ color: isCur || isDone ? "#DADEE7" : "#5A6172" }}>{s.label}</span>
                        </button>
                        {i < STEPS.length - 1 && <span className="h-px flex-1 min-w-4" style={{ background: isDone ? "#34D39955" : "#1A1F2B" }} />}
                      </div>
                    );
                  })}
                </div>

                <section key={step} className="float-in rounded-3xl p-5 md:p-7 soft-ring" style={CARD}>

                  {/* Step 1 – Details */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <Head title="Campaign details" sub="Start by naming your campaign." />
                      <Field label="Campaign name">
                        <input className="cm-input" placeholder="e.g. October product launch" value={name} onChange={(e) => setName(e.target.value)} />
                      </Field>
                      <Field label="Email subject" hint="This is what recipients see in their inbox.">
                        <input className="cm-input" placeholder="e.g. Something new is here 🎉" value={subject} onChange={(e) => setSubject(e.target.value)} />
                      </Field>
                    </div>
                  )}

                  {/* Step 2 – Recipients */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <Head title="Recipients" sub="Upload a CSV with an “email” column." />
                      {!recipients ? (
                        <div
                          onClick={() => fileRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files?.[0]); }}
                          className="cursor-pointer rounded-2xl py-12 px-6 text-center transition-all"
                          style={{
                            background: dragging ? "rgba(255,106,57,0.06)" : "#0F131C",
                            border: `1.5px dashed ${dragging ? "#FF6A39" : "#232938"}`,
                          }}
                        >
                          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
                            <UploadCloud size={20} className="text-[#FF6A39]" />
                          </div>
                          <p className="text-[14px] font-medium" style={{ color: "#F2F0EB" }}>Drop your file here, or click to browse</p>
                          <p className="text-[12px] mt-1" style={{ color: "#6A7080" }}>.csv or .txt · one email per row</p>
                          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl p-3.5 space-y-3" style={{ background: "#0F131C", boxShadow: RING }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.10)", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.22)" }}>
                                  <FileText size={15} className="text-[#34D399]" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium truncate" style={{ color: "#F2F0EB" }}>{fileName}</p>
                                  <p className="text-[11px]" style={{ color: uploadError ? "#F87171" : uploaded ? "#34D399" : "#6A7080" }}>
                                    {uploading ? `Uploading… ${progress}%` : uploadError ? "Upload failed" : uploaded ? "Uploaded" : "Waiting…"}
                                  </p>
                                </div>
                              </div>
                              <Btn variant="danger" onClick={clearFile} disabled={uploading}><Trash2 size={13} /> Remove</Btn>
                            </div>
                            {uploading && (
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "#FF6A39" }} />
                              </div>
                            )}
                          </div>

                          {uploadError && <Notice tone="error">{uploadError} Remove the file and try again.</Notice>}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label="Rows" value={recipients.total} />
                            <Stat label="Valid" value={recipients.valid.length} tone="#34D399" />
                            <Stat label="Invalid" value={recipients.invalid.length} tone={recipients.invalid.length ? "#F87171" : "#F2F0EB"} />
                            <Stat label="Duplicates" value={recipients.dupes} tone={recipients.dupes ? "#FBBF24" : "#F2F0EB"} />
                          </div>
                          {recipients.valid.length === 0 ? (
                            <Notice tone="error">No valid email addresses found. Check that the file has an “email” column.</Notice>
                          ) : (
                            <div className="rounded-2xl overflow-hidden" style={{ background: "#0F131C", boxShadow: RING }}>
                              <p className="px-4 py-2.5 text-[11px] uppercase tracking-wider border-b border-[#1A1F2B]" style={{ color: "#6A7080" }}>Preview</p>
                              {recipients.valid.slice(0, 5).map((e) => (
                                <p key={e} className="px-4 py-2 text-[12.5px] border-b border-[#1A1F2B] last:border-0" style={{ color: "#DADEE7", fontFamily: FONT.mono }}>{e}</p>
                              ))}
                              {recipients.valid.length > 5 && (
                                <p className="px-4 py-2 text-[11.5px]" style={{ color: "#6A7080" }}>+ {(recipients.valid.length - 5).toLocaleString()} more</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 3 – Sender (from DB) */}
                  {step === 2 && (
                    <div className="space-y-4">
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
                            const left = (a.daily_limit ?? 0) - (a.emails_sent_today ?? 0);
                            return (
                              <button key={a.id} onClick={() => setSenderId(a.id)}
                                className="w-full text-left flex items-center gap-4 rounded-2xl p-4 transition-all"
                                style={{
                                  background: sel ? "rgba(255,106,57,0.06)" : "#0F131C",
                                  boxShadow: sel ? "inset 0 0 0 1.5px rgba(255,106,57,0.7), 0 0 0 4px rgba(255,106,57,0.08)" : RING,
                                }}>
                                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                                  style={{ background: "linear-gradient(135deg, #0A66C2, #053C74)" }}>
                                  {(a.provider ?? "?").slice(0, 1).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{a.email}</p>
                                  <p className="text-[11.5px] truncate" style={{ color: "#7A8092" }}>{a.display_name} · {a.provider}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[13px] font-semibold" style={{ color: "#34D399", fontFamily: FONT.mono }}>{left.toLocaleString()}</p>
                                  <p className="text-[10.5px]" style={{ color: "#6A7080" }}>sends left today</p>
                                </div>
                                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: sel ? "#FF6A39" : "transparent", boxShadow: sel ? "none" : "inset 0 0 0 1.5px #2A2F3B" }}>
                                  {sel && <Check size={12} strokeWidth={3} className="text-white" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4 – Template (from DB) */}
                  {step === 3 && (
                    <div className="space-y-4">
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
                          <div className="md:col-span-2 space-y-2.5 max-h-90 overflow-y-auto pr-1">
                            {templates.map((t) => {
                              const id = tplId(t);
                              const sel = id === templateId;
                              return (
                                <button key={id} onClick={() => setTemplateId(id)} className="w-full text-left rounded-2xl p-4 transition-all"
                                  style={{
                                    background: sel ? "rgba(255,106,57,0.06)" : "#0F131C",
                                    boxShadow: sel ? "inset 0 0 0 1.5px rgba(255,106,57,0.7), 0 0 0 4px rgba(255,106,57,0.08)" : RING,
                                  }}>
                                  <p className="text-[13.5px] font-semibold truncate" style={{ color: "#F2F0EB" }}>{tplName(t)}</p>
                                  {tplDesc(t) && <p className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: "#7A8092" }}>{tplDesc(t)}</p>}
                                </button>
                              );
                            })}
                          </div>
                          <div className="md:col-span-3 rounded-2xl overflow-hidden" style={{ background: "#0F131C", boxShadow: RING, minHeight: 280 }}>
                            {template ? (
                              tplHtml(template) ? (
                                <iframe title="Template preview" sandbox="" srcDoc={tplHtml(template)} className="w-full bg-white" style={{ height: 360, border: 0 }} />
                              ) : (
                                <div className="h-70 flex items-center justify-center text-[12.5px]" style={{ color: "#6A7080" }}>This template has no HTML content</div>
                              )
                            ) : (
                              <div className="h-70 flex items-center justify-center text-[12.5px]" style={{ color: "#6A7080" }}>Select a template to preview it</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5 – Review */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <Head title="Review & start" sub="Check everything before sending." />

                      <div className="rounded-2xl divide-y divide-[#1A1F2B]" style={{ background: "#0F131C", boxShadow: RING }}>
                        {[
                          ["Campaign", name || "—"],
                          ["Subject", subject || "—"],
                          ["Recipients", total ? `${total.toLocaleString()} valid (${fileName})` : "—"],
                          ["Sender", sender ? `${sender.display_name} <${sender.email}>` : "—"],
                          ["Template", template ? tplName(template) : "—"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="text-[12px]" style={{ color: "#6A7080" }}>{k}</span>
                            <span className="text-[13px] font-medium text-right truncate" style={{ color: "#F2F0EB" }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Validation */}
                      <div className="space-y-2">
                        {checks.map((c) => (
                          <div key={c.label + (c.detail ?? "")} className="flex items-start gap-2.5 text-[12.5px]">
                            {c.ok ? <CheckCircle2 size={15} className="text-[#34D399] mt-0.5 shrink-0" />
                              : c.level === "warn" ? <AlertTriangle size={15} className="text-[#FBBF24] mt-0.5 shrink-0" />
                              : <XCircle size={15} className="text-[#F87171] mt-0.5 shrink-0" />}
                            <span style={{ color: c.ok ? "#DADEE7" : c.level === "warn" ? "#FBBF24" : "#F87171" }}>
                              <b className="font-medium">{c.label}</b>{!c.ok && c.detail ? ` — ${c.detail}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* When to send */}
                      <div>
                        <p className="text-[12px] font-medium mb-2" style={{ color: "#C7C9CE" }}>When to send</p>
                        <div className="grid grid-cols-2 gap-2.5">
                          {([["now", "Send now", Send], ["later", "Schedule", Calendar]] as const).map(([id, label, Icon]) => (
                            <button key={id} onClick={() => setMode(id)} className="flex items-center gap-2.5 rounded-2xl p-3.5 text-[13px] font-medium transition-all"
                              style={{
                                background: mode === id ? "rgba(255,106,57,0.06)" : "#0F131C",
                                color: mode === id ? "#F2F0EB" : "#8A90A0",
                                boxShadow: mode === id ? "inset 0 0 0 1.5px rgba(255,106,57,0.7)" : RING,
                              }}>
                              <Icon size={15} className={mode === id ? "text-[#FF6A39]" : ""} /> {label}
                            </button>
                          ))}
                        </div>
                        {mode === "later" && (
                          <div className="mt-3">
                            <input type="datetime-local" className="cm-input" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
                        style={{ background: ready ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", boxShadow: `inset 0 0 0 1px ${ready ? "rgba(52,211,153,0.22)" : "rgba(248,113,113,0.22)"}` }}>
                        {ready ? <CheckCircle2 size={16} className="text-[#34D399]" /> : <XCircle size={16} className="text-[#F87171]" />}
                        <p className="text-[12.5px] font-medium" style={{ color: ready ? "#34D399" : "#F87171" }}>
                          {ready ? "Campaign is ready to start" : "Fix the issues above to continue"}
                        </p>
                      </div>

                      {actionError && <Notice tone="error">{actionError}</Notice>}
                    </div>
                  )}

                  {/* Nav */}
                  <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#1A1F2B]">
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
              </>
            )}

            {/* ═════════ AFTER LAUNCH: scheduled / running / done ═════════ */}
            {!editing && (
              <section className="float-in rounded-3xl p-5 md:p-7 soft-ring space-y-6" style={CARD}>
                {status === "Scheduled" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(167,139,250,0.10)", boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.25)" }}>
                        <Calendar size={18} className="text-[#A78BFA]" />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold" style={{ color: "#F2F0EB" }}>Scheduled for {new Date(scheduleAt).toLocaleString()}</p>
                        <p className="text-[12px]" style={{ color: "#7A8092" }}>{shownTotal.toLocaleString()} emails will be sent from {sender?.email}.</p>
                      </div>
                    </div>
                    {actionError && <Notice tone="error">{actionError}</Notice>}
                    <div className="flex gap-2.5 flex-wrap">
                      <Btn onClick={editSchedule}>Edit schedule</Btn>
                      <Btn variant="primary" onClick={() => act(startCampaign, "Running")}><Play size={13} /> Send now</Btn>
                      <Btn variant="danger" onClick={() => act(cancelCampaign, "Cancelled")}>Cancel schedule</Btn>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-end justify-between mb-2.5">
                        <p className="text-[13px] font-medium" style={{ color: "#C7C9CE" }}>
                          {status === "Completed" ? "Campaign completed" : status === "Cancelled" ? "Campaign cancelled" : status === "Failed" ? "Campaign failed" : "Sending progress"}
                        </p>
                        <p className="text-[22px] font-bold" style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>{pct}%</p>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1B2130" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: status === "Cancelled" || status === "Failed" ? "#F87171" : "linear-gradient(90deg, #FF6A39, #34D399)" }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat label="Total" value={shownTotal.toLocaleString()} />
                      <Stat label="Sent" value={run.sent.toLocaleString()} tone="#34D399" />
                      <Stat label="Failed" value={run.failed.toLocaleString()} tone={run.failed ? "#F87171" : "#F2F0EB"} />
                      <Stat label="Pending" value={Math.max(0, shownTotal - done).toLocaleString()} tone="#60A5FA" />
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
                      {finished && <Btn variant="primary" onClick={reset}>New campaign</Btn>}
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
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
            <Rocket size={18} className="text-[#FF6A39]" />
          </div>
          <h2 className="text-[18px] font-bold text-white" style={{ fontFamily: FONT.display }}>
            {mode === "later" ? "Schedule this campaign?" : "Start this campaign?"}
          </h2>
          <p className="text-[13px] mt-2 leading-6" style={{ color: "#8A90A0" }}>
            <b style={{ color: "#F2F0EB" }}>{total.toLocaleString()}</b> emails will be sent from{" "}
            <b style={{ color: "#F2F0EB" }}>{sender?.email}</b> using the <b style={{ color: "#F2F0EB" }}>{template ? tplName(template) : ""}</b> template
            {mode === "later" ? <> on <b style={{ color: "#F2F0EB" }}>{new Date(scheduleAt).toLocaleString()}</b></> : ""}. This can't be undone once emails are sent.
          </p>
          {submitError && <div className="mt-4"><Notice tone="error">{submitError}</Notice></div>}
          <div className="flex justify-end gap-2.5 mt-6">
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
          <h2 className="text-[18px] font-bold text-white" style={{ fontFamily: FONT.display }}>Cancel this campaign?</h2>
          <p className="text-[13px] mt-2 leading-6" style={{ color: "#8A90A0" }}>
            Sending will stop. Emails already sent can't be recalled.
          </p>
          <div className="flex justify-end gap-2.5 mt-6">
            <Btn onClick={() => setCancelOpen(false)}>Keep running</Btn>
            <Btn variant="danger" onClick={() => { setCancelOpen(false); act(cancelCampaign, "Cancelled"); }}>Cancel campaign</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ───────────── shared bits ───────────── */

const Head = ({ title, sub }: { title: string; sub: string }) => (
  <div>
    <h2 className="text-[17px] font-semibold" style={{ color: "#F2F0EB", fontFamily: FONT.display }}>{title}</h2>
    <p className="text-[12.5px] mt-0.5" style={{ color: "#7A8092" }}>{sub}</p>
  </div>
);

const Notice = ({ tone, children }: { tone: "error" | "warn"; children: React.ReactNode }) => {
  const c = tone === "error" ? "#F87171" : "#FBBF24";
  return (
    <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: `${c}14`, boxShadow: `inset 0 0 0 1px ${c}38` }}>
      <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: c }} />
      <p className="text-[12.5px]" style={{ color: c }}>{children}</p>
    </div>
  );
};

const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-3xl p-6 float-in"
      style={{ background: "#141823", boxShadow: "inset 0 0 0 1px #232938, 0 30px 60px -20px rgba(0,0,0,0.6)" }}>
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-2xl text-[#8A90A0]" style={{ background: "#0F131C", boxShadow: RING }}>
        <X size={14} />
      </button>
      {children}
    </div>
  </div>
);

export default CampaignCreatePage;