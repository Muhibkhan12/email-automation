// EmailTemplatesAdmin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Plus, Search, Trash2, CheckCircle2, Clock, Code2, Eye, Save, X,
  Monitor, Smartphone, Tablet, FileCode, Braces, LayoutTemplate,
  Inbox, Check, Menu, Sparkles, Wand2, AlertCircle, ArrowLeft,
  Loader2, AlertTriangle, RefreshCw, ChevronRight, Tag,
} from "lucide-react";

import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import type { HtmlTemplates } from "../../types/HtmlTemplatesTypes";

/* ─────────────── Tokens ─────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
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
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  surfaceHover: "#11151E",
  inner: "#0F131C",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

type Category = "Welcome" | "Promotional" | "Newsletter" | "Transactional";
type Status = "Published" | "Draft";

interface Template {
  id: number;
  name: string;
  subject: string;
  category: Category;
  status: Status;
  updatedAt: string;
  html: string;
}

const categories: Category[] = ["Welcome", "Promotional", "Newsletter", "Transactional"];

const variables = [
  "{{first_name}}",
  "{{last_name}}",
  "{{company}}",
  "{{product_name}}",
  "{{unsubscribe_link}}",
];

const variableDescriptions: Record<string, string> = {
  "{{first_name}}": "Recipient's first name",
  "{{last_name}}": "Recipient's last name",
  "{{company}}": "Company or workspace name",
  "{{product_name}}": "Product or service name",
  "{{unsubscribe_link}}": "Unsubscribe link",
};

/* ─────────────── Adapter ─────────────── */

const mapApiTemplate = (raw: HtmlTemplates, index: number): Template => {
  const r = raw as any;
  return {
    id: typeof r.id === "number" ? r.id : index,
    name: r.name ?? r.title ?? r.template_name ?? "Untitled Template",
    subject: r.subject ?? r.subject_line ?? "",
    category: (r.category as Category) ?? "Welcome",
    status: (r.status as Status) ?? "Draft",
    updatedAt: r.updated_at ?? r.updatedAt ?? "—",
    html: r.html ?? r.body ?? r.content ?? "",
  };
};

/* ─────────────── Starter HTML ─────────────── */

const starterHtml = (category: Category) => {
  const base = (body: string, bgColor: string = "#f4f4f5") => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin:0;padding:0;background:${bgColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
${body}
          <tr>
            <td style="padding:20px 32px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;">
              <p style="margin:0;">You're receiving this because you're part of {{company}}.</p>
              <p style="margin:4px 0 0;"><a href="{{unsubscribe_link}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const rows: Record<Category, string> = {
    Welcome: `            <tr>
              <td style="padding:48px 32px 24px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">👋</div>
                <h1 style="margin:0;font-size:24px;color:#0f172a;font-weight:700;">Welcome, {{first_name}}!</h1>
                <p style="margin:12px 0 0;font-size:15px;color:#64748b;line-height:1.6;">
                  We're thrilled to have you at {{company}}. Let's get you started in just a few minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;text-align:center;">
                <a href="#" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Get Started</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px;text-align:center;font-size:13px;color:#94a3b8;line-height:1.5;">
                <p style="margin:0;">Need help? <a href="#" style="color:#0f172a;text-decoration:underline;">Contact support</a></p>
              </td>
            </tr>`,
    Promotional: `            <tr>
              <td style="padding:48px 32px 16px;text-align:center;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;font-weight:600;">🔥 Limited Time Offer</p>
                <h1 style="margin:8px 0 0;font-size:28px;color:#0f172a;font-weight:700;">30% off {{product_name}}</h1>
                <p style="margin:12px 0 0;font-size:15px;color:#64748b;line-height:1.6;">
                  Hi {{first_name}}, this exclusive offer ends soon. Don't miss out on the savings!
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 40px;text-align:center;">
                <div style="background:#fef2f2;border-radius:8px;padding:12px;margin-bottom:16px;">
                  <span style="font-size:32px;font-weight:700;color:#e11d48;">30% OFF</span>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Use code: SUMMER30</p>
                </div>
                <a href="#" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Shop Now</a>
              </td>
            </tr>`,
    Newsletter: `            <tr>
              <td style="padding:48px 32px 16px;">
                <p style="margin:0;font-size:12px;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;font-weight:600;">📬 Monthly Update</p>
                <h1 style="margin:4px 0 0;font-size:22px;color:#0f172a;font-weight:700;">What's new at {{company}}</h1>
                <p style="margin:12px 0 0;font-size:15px;color:#64748b;line-height:1.6;">
                  Hi {{first_name}}, here's what's been happening since we last spoke.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:12px;">
                  <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">✨ Feature Update 1</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Description of the new feature and how it helps you.</p>
                </div>
                <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:12px;">
                  <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">🚀 Feature Update 2</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Another exciting improvement to the platform.</p>
                </div>
                <div style="background:#f8fafc;border-radius:8px;padding:16px;">
                  <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">💡 Team Note</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">A personal message from the {{company}} team.</p>
                </div>
              </td>
            </tr>`,
    Transactional: `            <tr>
              <td style="padding:48px 32px 24px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">✅</div>
                <h1 style="margin:0;font-size:24px;color:#0f172a;font-weight:700;">Order Confirmed</h1>
                <p style="margin:12px 0 0;font-size:15px;color:#64748b;line-height:1.6;">
                  Thanks {{first_name}}! Your order from {{company}} has been confirmed and is being processed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:13px;color:#64748b;">Order #: <strong style="color:#0f172a;">ORD-12345</strong></p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Date: <strong style="color:#0f172a;">August 20, 2026</strong></p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Total: <strong style="color:#0f172a;">$149.99</strong></p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px;text-align:center;">
                <a href="#" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View Order</a>
              </td>
            </tr>`,
  };

  return base(rows[category]);
};

const nextId = (list: Template[]) => (list.length ? Math.max(...list.map((t) => t.id)) + 1 : 1);

/* ─────────────── Editor (fullscreen) ─────────────── */

type Device = "desktop" | "tablet" | "mobile";

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onClose: () => void;
  onDelete?: () => void;
}

const TemplateEditor = ({ template: initialTemplate, onSave, onClose, onDelete }: TemplateEditorProps) => {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [device, setDevice] = useState<Device>("desktop");
  const [savedFlash, setSavedFlash] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = JSON.stringify(initialTemplate) !== JSON.stringify(template);

  const updateTemplate = (patch: Partial<Template>) => setTemplate((prev) => ({ ...prev, ...patch }));

  const insertVariable = (variable: string) => {
    const el = textareaRef.current;
    if (!el) {
      updateTemplate({ html: template.html + variable });
      return;
    }
    const start = el.selectionStart ?? template.html.length;
    const end = el.selectionEnd ?? template.html.length;
    const newHtml = template.html.slice(0, start) + variable + template.html.slice(end);
    updateTemplate({ html: newHtml });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = () => {
    if (!isDirty) return;
    const saved = { ...template, updatedAt: "Just now" };
    onSave(saved);
    setTemplate(saved);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape" && !showDeleteConfirm) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, isDirty, showDeleteConfirm]);

  const statusMeta =
    template.status === "Published"
      ? { fg: COLOR.success, bg: COLOR.successSoft, ring: COLOR.successRing }
      : { fg: COLOR.warning, bg: COLOR.warningSoft, ring: COLOR.warningRing };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      {/* ── Top bar ─────────────────────────── */}
      <div
        className="flex-shrink-0 px-3 md:px-5 py-3"
        style={{ background: COLOR.surface, borderBottom: `1px solid ${COLOR.border}` }}
      >
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12.5px] font-medium transition-colors"
            style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex-1 min-w-0">
            <input
              value={template.name}
              onChange={(e) => updateTemplate({ name: e.target.value })}
              placeholder="Template name"
              className="w-full bg-transparent outline-none truncate text-[16px] md:text-[18px] font-bold tracking-tight"
              style={{ fontFamily: FONT.display, color: COLOR.dark }}
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px]" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
                {template.updatedAt}
              </span>
              {isDirty && (
                <>
                  <span style={{ color: COLOR.border }}>·</span>
                  <span className="text-[11px] font-medium" style={{ color: COLOR.warning }}>
                    ● Unsaved
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={template.category}
              onChange={(e) => updateTemplate({ category: e.target.value as Category })}
              className="rounded-2xl px-3 py-2 text-[12px] outline-none cursor-pointer"
              style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>

            <button
              onClick={() =>
                updateTemplate({ status: template.status === "Published" ? "Draft" : "Published" })
              }
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-medium transition-colors whitespace-nowrap"
              style={{
                background: statusMeta.bg,
                color: statusMeta.fg,
                boxShadow: `inset 0 0 0 1px ${statusMeta.ring}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusMeta.fg, boxShadow: `0 0 6px ${statusMeta.fg}` }} />
              {template.status}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete template"
              className="inline-flex items-center justify-center rounded-2xl p-2.5 transition-colors"
              style={{ background: COLOR.dangerSoft, color: COLOR.danger, boxShadow: `inset 0 0 0 1px ${COLOR.dangerRing}` }}
            >
              <Trash2 size={13} />
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
              style={{
                background: isDirty ? COLOR.primary : COLOR.inner,
                color: isDirty ? "#fff" : COLOR.textMuted,
                boxShadow: isDirty ? "0 12px 30px -12px rgba(255,106,57,0.6)" : `inset 0 0 0 1px ${COLOR.border}`,
              }}
            >
              {savedFlash ? <Check size={13} /> : <Save size={13} />}
              {savedFlash ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Subject + variables row ───────── */}
        <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div
            className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 flex-1 min-w-0 transition-all"
            style={{ background: COLOR.inner, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
          >
            <Tag size={13} style={{ color: COLOR.textMuted }} className="shrink-0" />
            <input
              value={template.subject}
              onChange={(e) => updateTemplate({ subject: e.target.value })}
              placeholder="Subject line"
              className="w-full bg-transparent outline-none text-[13px]"
              style={{ color: COLOR.textBody }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] mr-1" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
              <Braces size={11} /> insert
            </span>
            {variables.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                title={variableDescriptions[v]}
                className="rounded-lg px-2 py-1 text-[10.5px] transition-colors"
                style={{ fontFamily: FONT.mono, background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: HTML + preview ─────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Code pane */}
        <div className="flex flex-col h-full min-h-0">
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}` }}
          >
            <div className="flex items-center gap-2">
              <Code2 size={13} style={{ color: COLOR.textMuted }} />
              <span className="text-[11.5px] font-medium uppercase tracking-widest" style={{ color: COLOR.textMuted }}>HTML</span>
            </div>
            <span className="text-[11px]" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
              {template.html.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={template.html}
            onChange={(e) => updateTemplate({ html: e.target.value })}
            spellCheck={false}
            className="flex-1 w-full resize-none p-4 text-[12px] leading-relaxed outline-none"
            style={{ fontFamily: FONT.mono, background: COLOR.bg, color: COLOR.textBody }}
          />
        </div>

        {/* Preview pane */}
        <div className="flex flex-col h-full min-h-0" style={{ borderLeft: `1px solid ${COLOR.border}` }}>
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}` }}
          >
            <div className="flex items-center gap-2">
              <Eye size={13} style={{ color: COLOR.textMuted }} />
              <span className="text-[11.5px] font-medium uppercase tracking-widest" style={{ color: COLOR.textMuted }}>Preview</span>
            </div>

            <div
              className="inline-flex items-center gap-1 p-1 rounded-2xl"
              style={{ background: COLOR.surface, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
            >
              {([
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ] as { id: Device; icon: React.ElementType }[]).map(({ id, icon: Icon }) => {
                const active = device === id;
                return (
                  <button
                    key={id}
                    onClick={() => setDevice(id)}
                    className="rounded-xl p-1.5 transition-all"
                    style={{
                      background: active ? "#1B2130" : "transparent",
                      color: active ? COLOR.dark : COLOR.textMuted,
                      boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "none",
                    }}
                    aria-label={`${id} preview`}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-start justify-center" style={{ background: COLOR.inner }}>
            <iframe
              title="Template preview"
              srcDoc={template.html}
              sandbox=""
              className="w-full h-full rounded-2xl bg-white transition-all"
              style={{
                border: `1px solid ${COLOR.border}`,
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
                maxWidth: device === "mobile" ? 390 : device === "tablet" ? 768 : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Delete confirm ─────────────────── */}
      {showDeleteConfirm && onDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl overflow-hidden soft-ring modal-pop"
            style={{ background: COLOR.surface }}
          >
            <div className="p-5 md:p-6 border-b" style={{ borderColor: COLOR.border }}>
              <div className="flex items-start gap-3.5">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: COLOR.dangerSoft, boxShadow: `inset 0 0 0 1px ${COLOR.dangerRing}` }}
                >
                  <Trash2 size={18} style={{ color: COLOR.danger }} />
                </div>
                <div className="min-w-0">
                  <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-bold text-white">Delete template?</h3>
                  <p className="text-[12.5px] mt-0.5" style={{ color: COLOR.textMuted }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 md:p-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold"
                style={{ background: COLOR.danger, color: "#0B0E13", boxShadow: "0 12px 30px -12px rgba(248,113,113,0.55)" }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────── Stat tile ─────────────── */

const StatCard: React.FC<{
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: string;
  accentSoft: string;
  accentRing: string;
}> = ({ title, value, description, icon: Icon, accent, accentSoft, accentRing }) => (
  <div className="rounded-3xl p-4 md:p-5 soft-ring" style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}>
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: accentSoft, boxShadow: `inset 0 0 0 1px ${accentRing}` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
    <p className="text-[26px] font-bold leading-none tracking-tight" style={{ fontFamily: FONT.mono, color: COLOR.dark }}>
      {value}
    </p>
    <p className="text-[12.5px] mt-2" style={{ color: COLOR.textBody }}>{title}</p>
    <p className="text-[11px] mt-0.5" style={{ color: COLOR.textMuted }}>{description}</p>
  </div>
);

/* ─────────────── Filter pill ─────────────── */

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void; small?: boolean }> = ({ label, active, onClick, small }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-3 ${small ? "py-1 text-[11px]" : "py-1.5 text-[12px]"} font-medium transition-all`}
    style={{
      background: active ? "#1B2130" : COLOR.inner,
      color: active ? COLOR.dark : COLOR.textMuted,
      boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : `inset 0 0 0 1px ${COLOR.border}`,
    }}
  >
    {label}
  </button>
);

/* ─────────────── Main page ─────────────── */

const EmailTemplatesAdmin = () => {
  const { templates: apiTemplates, loading, error, refetch } = useHtmlTemplates();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft">("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!apiTemplates) return;
    setTemplates(apiTemplates.map(mapApiTemplate));
  }, [apiTemplates]);

  const filtered = useMemo(
    () =>
      templates.filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.subject.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
        const matchesStatus = statusFilter === "All" || t.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [templates, search, categoryFilter, statusFilter]
  );

  const handleCreate = (name: string, subject: string, category: Category) => {
    const newId = nextId(templates);
    const created: Template = {
      id: newId,
      name: name.trim() || "Untitled Template",
      subject: subject.trim() || "New email subject",
      category,
      status: "Draft",
      updatedAt: "Just now",
      html: starterHtml(category),
    };
    setTemplates((prev) => [created, ...prev]);
    setShowNewModal(false);
    setEditingTemplate(created);
  };

  const handleSaveTemplate = (saved: Template) =>
    setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));

  const handleDeleteTemplate = (id: number) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (editingTemplate?.id === id) setEditingTemplate(null);
  };

  const handleAIGenerate = () => {
    if (!generationPrompt.trim()) return;

    const newHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:48px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">✨</div>
              <h1 style="margin:0;font-size:24px;color:#0f172a;font-weight:700;">${generationPrompt}</h1>
              <p style="margin:12px 0 0;font-size:15px;color:#64748b;line-height:1.6;">
                Hi {{first_name}}, this template was generated based on your request.
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;line-height:1.6;">
                Customize this template by editing the HTML or adding variables.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 40px;text-align:center;">
              <a href="#" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Learn More</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;">
              <p style="margin:0;">You're receiving this because you're part of {{company}}.</p>
              <p style="margin:4px 0 0;"><a href="{{unsubscribe_link}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const newId = nextId(templates);
    const aiTemplate: Template = {
      id: newId,
      name: `AI Generated: ${generationPrompt.substring(0, 30)}${generationPrompt.length > 30 ? "…" : ""}`,
      subject: generationPrompt,
      category: "Promotional",
      status: "Draft",
      updatedAt: "Just now",
      html: newHtml,
    };
    setTemplates((prev) => [aiTemplate, ...prev]);
    setShowAIGenerate(false);
    setGenerationPrompt("");
    setEditingTemplate(aiTemplate);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .etm-main::-webkit-scrollbar { width: 10px; }
        .etm-main::-webkit-scrollbar-track { background: transparent; }
        .etm-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .etm-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }

        textarea::-webkit-scrollbar { width: 10px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 8px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="etm-main flex-1 overflow-y-auto" style={{ background: COLOR.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: COLOR.surface }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.textMuted }}>Content</span>
                    <ChevronRight size={10} style={{ color: "#3A3F4A" }} />
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: COLOR.primary }}>Templates</span>
                  </div>
                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    <span style={{ color: COLOR.dark }}>Email templates</span>
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: COLOR.textMuted }}>
                    Build and manage the HTML templates used across every campaign.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={refetch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: COLOR.surface, color: COLOR.textBody }}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setShowAIGenerate(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: COLOR.warningSoft,
                    color: COLOR.warning,
                    boxShadow: `inset 0 0 0 1px ${COLOR.warningRing}`,
                  }}
                >
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">AI generate</span>
                </button>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: COLOR.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
                >
                  <Plus size={14} /> New template
                </button>
              </div>
            </header>

            {/* ── Stats ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard title="Total templates" value={String(templates.length)} description="Across all categories" icon={LayoutTemplate} accent={COLOR.neutral} accentSoft={COLOR.neutralSoft} accentRing={COLOR.neutralRing} />
              <StatCard title="Published"       value={String(templates.filter((t) => t.status === "Published").length)} description="Live and in use" icon={CheckCircle2} accent={COLOR.success} accentSoft={COLOR.successSoft} accentRing={COLOR.successRing} />
              <StatCard title="Drafts"          value={String(templates.filter((t) => t.status === "Draft").length)} description="Not yet published" icon={Clock} accent={COLOR.warning} accentSoft={COLOR.warningSoft} accentRing={COLOR.warningRing} />
              <StatCard title="Categories"      value={String(categories.length)} description="Welcome · Promo · News · Txn" icon={FileCode} accent={COLOR.primary} accentSoft={COLOR.primarySoft} accentRing={COLOR.primaryRing} />
            </div>

            {/* ── Filters ────────────────────────── */}
            <div className="rounded-3xl p-3 md:p-4 mb-6 md:mb-8 soft-ring" style={{ background: COLOR.surface }}>
              <div
                className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 transition-all"
                style={{ background: COLOR.inner, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${COLOR.border}`)}
              >
                <Search size={14} style={{ color: COLOR.textMuted }} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Search templates by name or subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[13.5px] outline-none"
                  style={{ color: COLOR.textBody }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-[#1B2130]"
                    style={{ color: COLOR.textMuted }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] uppercase tracking-wider mr-1" style={{ color: COLOR.textMuted }}>Category</span>
                <FilterPill label="All" active={categoryFilter === "All"} onClick={() => setCategoryFilter("All")} small />
                {categories.map((c) => (
                  <FilterPill key={c} label={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} small />
                ))}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] uppercase tracking-wider mr-1" style={{ color: COLOR.textMuted }}>Status</span>
                <FilterPill label="All"       active={statusFilter === "All"}       onClick={() => setStatusFilter("All")}       small />
                <FilterPill label="Published" active={statusFilter === "Published"} onClick={() => setStatusFilter("Published")} small />
                <FilterPill label="Draft"     active={statusFilter === "Draft"}     onClick={() => setStatusFilter("Draft")}     small />
              </div>
            </div>

            {/* ── Content ────────────────────────── */}
            {loading && templates.length === 0 ? (
              <div className="rounded-3xl p-14 flex flex-col items-center justify-center soft-ring" style={{ background: COLOR.surface }}>
                <Loader2 size={26} className="animate-spin" style={{ color: COLOR.primary }} />
                <p className="mt-3 text-[13px]" style={{ color: COLOR.textMuted }}>Loading templates…</p>
              </div>
            ) : !loading && error && templates.length === 0 ? (
              <div className="rounded-3xl p-12 flex flex-col items-center justify-center text-center soft-ring" style={{ background: COLOR.surface }}>
                <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: COLOR.dangerSoft, boxShadow: `inset 0 0 0 1px ${COLOR.dangerRing}` }}>
                  <AlertTriangle size={26} style={{ color: COLOR.danger }} />
                </div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold" ><span style={{ color: COLOR.dark }}>Couldn't load templates</span></h3>
                <p className="mt-2 text-[13px] max-w-md" style={{ color: COLOR.textMuted }}>{error}</p>
                <button
                  onClick={refetch}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: COLOR.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  <RefreshCw size={13} /> Try again
                </button>
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-3xl p-12 flex flex-col items-center justify-center text-center soft-ring" style={{ background: COLOR.surface }}>
                <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}>
                  <Inbox size={26} style={{ color: COLOR.primary }} />
                </div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold"><span style={{ color: COLOR.dark }}>No templates yet</span></h3>
                <p className="mt-2 text-[13px]" style={{ color: COLOR.textMuted }}>Create your first template to get started.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl p-12 flex flex-col items-center justify-center text-center soft-ring" style={{ background: COLOR.surface }}>
                <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: COLOR.neutralSoft, boxShadow: `inset 0 0 0 1px ${COLOR.neutralRing}` }}>
                  <Inbox size={26} style={{ color: COLOR.neutral }} />
                </div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold"><span style={{ color: COLOR.dark }}>No templates match</span></h3>
                <p className="mt-2 text-[13px] mb-5" style={{ color: COLOR.textMuted }}>Try adjusting your search or filters.</p>
                <button
                  onClick={() => { setSearch(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                  className="text-[12.5px] font-medium"
                  style={{ color: COLOR.primary }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((t, i) => {
                  const published = t.status === "Published";
                  const meta = published
                    ? { fg: COLOR.success, bg: COLOR.successSoft, ring: COLOR.successRing, label: "Published" }
                    : { fg: COLOR.warning, bg: COLOR.warningSoft, ring: COLOR.warningRing, label: "Draft" };
                  return (
                    <button
                      key={t.id}
                      onClick={() => setEditingTemplate(t)}
                      className="group float-in rounded-3xl overflow-hidden soft-ring text-left transition-all hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)", animationDelay: `${Math.min(i * 20, 200)}ms` }}
                    >
                      {/* preview */}
                      <div
                        className="relative h-40 overflow-hidden"
                        style={{
                          background:
                            "radial-gradient(280px 160px at 20% -20%, rgba(255,106,57,0.10), transparent 60%), #0F131C",
                        }}
                      >
                        {t.html ? (
                          <div
                            className="origin-top-left"
                            style={{
                              width: "1280px",
                              height: "1280px",
                              transform: "scale(0.30)",
                              transformOrigin: "top left",
                              pointerEvents: "none",
                            }}
                          >
                            <iframe
                              title={`preview-${t.id}`}
                              srcDoc={t.html}
                              sandbox=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full border-0"
                              style={{ background: "#fff" }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <FileCode size={22} style={{ color: COLOR.textMuted }} />
                          </div>
                        )}

                        <span
                          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                          style={{
                            background: "rgba(11,14,18,0.78)",
                            backdropFilter: "blur(6px)",
                            color: meta.fg,
                            boxShadow: `inset 0 0 0 1px ${meta.ring}`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
                          {meta.label}
                        </span>
                      </div>

                      {/* meta */}
                      <div className="p-4">
                        <p className="text-[13.5px] font-semibold truncate" style={{ color: COLOR.dark }}>{t.name}</p>
                        <p className="text-[11.5px] truncate mt-0.5" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
                          {t.subject || "(no subject)"}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10.5px]"
                            style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
                          >
                            <Tag size={10} /> {t.category}
                          </span>
                          <span className="text-[10.5px]" style={{ color: COLOR.textMuted, fontFamily: FONT.mono }}>
                            {t.updatedAt}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Modals ─────────────────────────────── */}
      {showNewModal && <NewTemplateModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
      {showAIGenerate && (
        <AIGenerateModal
          onClose={() => setShowAIGenerate(false)}
          onGenerate={handleAIGenerate}
          prompt={generationPrompt}
          setPrompt={setGenerationPrompt}
        />
      )}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
          onDelete={() => handleDeleteTemplate(editingTemplate.id)}
        />
      )}
    </div>
  );
};

/* ─────────────── New template modal ─────────────── */

const NewTemplateModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, subject: string, category: Category) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("Welcome");

  const inputStyle: React.CSSProperties = {
    background: COLOR.inner,
    color: COLOR.textBody,
    boxShadow: `inset 0 0 0 1px ${COLOR.border}`,
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: COLOR.surface }}
      >
        <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: COLOR.border }}>
          <div className="flex items-start gap-3.5">
            <div
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: COLOR.primarySoft, boxShadow: `inset 0 0 0 1px ${COLOR.primaryRing}` }}
            >
              <LayoutTemplate size={16} style={{ color: COLOR.primary }} />
            </div>
            <div>
              <h2 style={{ fontFamily: FONT.display }} className="text-[16px] font-bold text-white">New template</h2>
              <p className="text-[12px] mt-0.5" style={{ color: COLOR.textMuted }}>
                Start from a category-matched boilerplate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-2xl transition-colors"
            style={{ background: COLOR.inner, color: COLOR.textMuted, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: COLOR.textBody }}>Template name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cart Abandonment — Reminder"
              className="w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${COLOR.border}`)}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: COLOR.textBody }}>Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. You left something behind"
              className="w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${COLOR.border}`)}
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: COLOR.textBody }}>Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium text-left transition-all"
                    style={{
                      background: active ? COLOR.primarySoft : COLOR.inner,
                      color: active ? COLOR.primary : COLOR.textBody,
                      boxShadow: `inset 0 0 0 1px ${active ? COLOR.primaryRing : COLOR.border}`,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: COLOR.border }}>
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
            style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, subject, category)}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: COLOR.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
          >
            <Plus size={13} /> Create template
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── AI modal ─────────────── */

const AIGenerateModal: React.FC<{
  onClose: () => void;
  onGenerate: () => void;
  prompt: string;
  setPrompt: (value: string) => void;
}> = ({ onClose, onGenerate, prompt, setPrompt }) => {
  const quickPrompts = [
    { label: "Welcome", prompt: "A friendly welcome email for new users with a 20% discount" },
    { label: "Promotion", prompt: "A promotional email announcing a flash sale with urgency" },
    { label: "Newsletter", prompt: "A monthly newsletter with product updates and industry news" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl overflow-hidden soft-ring modal-pop"
        style={{ background: COLOR.surface }}
      >
        <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b" style={{ borderColor: COLOR.border }}>
          <div className="flex items-start gap-3.5">
            <div
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: COLOR.warningSoft, boxShadow: `inset 0 0 0 1px ${COLOR.warningRing}` }}
            >
              <Sparkles size={16} style={{ color: COLOR.warning }} />
            </div>
            <div>
              <h2 style={{ fontFamily: FONT.display }} className="text-[16px] font-bold text-white">AI template generator</h2>
              <p className="text-[12px] mt-0.5" style={{ color: COLOR.textMuted }}>
                Describe what you want and we'll draft it.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-2xl transition-colors"
            style={{ background: COLOR.inner, color: COLOR.textMuted, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: COLOR.textBody }}>
              What kind of email do you want?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A welcome email for new users with a 20% discount code…"
              rows={4}
              className="w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all resize-none"
              style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${COLOR.border}`)}
            />
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px]" style={{ color: COLOR.textMuted }}>
              <AlertCircle size={11} />
              Be specific about tone, purpose, and key messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] mr-1" style={{ color: COLOR.textMuted }}>Quick prompts</span>
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => setPrompt(p.prompt)}
                className="rounded-full px-2.5 py-1 text-[11px] transition-colors"
                style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 md:p-6 border-t" style={{ borderColor: COLOR.border }}>
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
            style={{ background: COLOR.inner, color: COLOR.textBody, boxShadow: `inset 0 0 0 1px ${COLOR.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
            style={{
              background: prompt.trim() ? COLOR.warning : COLOR.inner,
              color: prompt.trim() ? "#0B0E13" : COLOR.textMuted,
              boxShadow: prompt.trim() ? "0 12px 30px -12px rgba(251,191,36,0.55)" : `inset 0 0 0 1px ${COLOR.border}`,
            }}
          >
            <Wand2 size={13} /> Generate template
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesAdmin;