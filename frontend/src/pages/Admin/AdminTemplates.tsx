// EmailTemplatesAdmin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ComponentType, CSSProperties, DragEvent, ElementType, FC, ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Plus, Search, Trash2, CheckCircle2, Clock, Code2, Eye, Save, X,
  Monitor, Smartphone, Tablet, FileCode, Braces, LayoutTemplate,
  Inbox, Check, Menu, Sparkles, Wand2, AlertCircle, ArrowLeft,
  Loader2, AlertTriangle, RefreshCw, ChevronRight, Tag,
  Pencil, Copy, ClipboardCopy, Upload, Link2, FileUp, Clipboard,
  Link, Globe, FileText, CheckCircle,
} from "lucide-react";

import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";
import type { HtmlTemplates } from "../../types/HtmlTemplatesTypes";
import type { TemplatePayload } from "../../services/TemplateService";
import { getHTMLTemplatesById } from "../../services/TemplateService";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
  purple:       "#A78BFA",
  purpleSoft:   "rgba(167,139,250,0.12)",
  purpleBorder: "rgba(167,139,250,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

type Id = number | string;
type Category = "Welcome" | "Promotional" | "Newsletter" | "Transactional";
type Status = "Published" | "Draft";

interface Template {
  id: Id;
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

/* ─────────────── helpers ─────────────── */

const formatUpdated = (v?: string) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(+d)) return v;
  const s = (Date.now() - +d) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toPayload = (t: Template): TemplatePayload => ({
  name: t.name,
  subject: t.subject,
  category: t.category,
  status: t.status,
  html: t.html,
});

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s.trim());

const normCategory = (v: unknown): Category =>
  categories.find((c) => c.toLowerCase() === String(v ?? "").toLowerCase()) ?? "Welcome";

const normStatus = (v: unknown): Status =>
  String(v ?? "").toLowerCase() === "published" ? "Published" : "Draft";

const mapApiTemplate = (raw: HtmlTemplates, index: number): Template => {
  const r = raw as any;
  return {
    id: r.id ?? r._id ?? index,
    name: r.name ?? r.title ?? r.template_name ?? "Untitled Template",
    subject: r.subject ?? r.subject_line ?? "",
    category: normCategory(r.category),
    status: normStatus(r.status),
    updatedAt: formatUpdated(r.updated_at ?? r.updatedAt),
    html:
      r.html ??
      r.html_content ??
      r.htmlContent ??
      r.html_body ??
      r.body ??
      r.content ??
      r.template ??
      "",
  };
};

/* ─────────────── starter HTML ─────────────── */

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

const aiHtml = (prompt: string) => `<!DOCTYPE html>
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
              <h1 style="margin:0;font-size:24px;color:#0f172a;font-weight:700;">${escapeHtml(prompt)}</h1>
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

/* ─────────────── editor (fullscreen) ─────────────── */

type Device = "desktop" | "tablet" | "mobile";

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => Promise<Template>;
  onClose: () => void;
  onDelete?: () => Promise<boolean>;
}

const TemplateEditor = ({ template: initialTemplate, onSave, onClose, onDelete }: TemplateEditorProps) => {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [device, setDevice] = useState<Device>("desktop");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty =
    JSON.stringify(toPayload(initialTemplate)) !== JSON.stringify(toPayload(template));

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

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await onSave(template);
      setTemplate(saved);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      setSaveError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);
    if (ok) onClose();
    else setShowDeleteConfirm(false);
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
  }, [template, isDirty, showDeleteConfirm, saving]);

  const statusMeta =
    template.status === "Published"
      ? { fg: T.success, bg: T.successSoft, ring: T.successBorder }
      : { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: T.bg, fontFamily: FONT.body }}
    >
      {/* Top bar */}
      <div
        className="flex-shrink-0 px-3 md:px-5 py-3"
        style={{ background: T.surface, borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-white/5"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex-1 min-w-0">
            <input
              value={template.name}
              onChange={(e) => updateTemplate({ name: e.target.value })}
              placeholder="Template name"
              className="w-full bg-transparent outline-none truncate text-[14px] md:text-[15px] font-semibold tracking-tight"
              style={{ color: T.text }}
            />
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                {template.updatedAt}
              </span>
              {isDirty && (
                <>
                  <span style={{ color: T.textFaint }}>·</span>
                  <span className="text-[10.5px] font-medium" style={{ color: T.warn }}>
                    ● Unsaved
                  </span>
                </>
              )}
              {saveError && (
                <>
                  <span style={{ color: T.textFaint }}>·</span>
                  <span className="text-[10.5px] font-medium" style={{ color: T.danger }}>
                    {saveError}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={template.category}
              onChange={(e) => updateTemplate({ category: e.target.value as Category })}
              className="rounded-md px-2.5 py-1.5 text-[11.5px] outline-none cursor-pointer"
              style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>

            <button
              onClick={() =>
                updateTemplate({ status: template.status === "Published" ? "Draft" : "Published" })
              }
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors whitespace-nowrap"
              style={{
                background: statusMeta.bg,
                color: statusMeta.fg,
                boxShadow: `inset 0 0 0 1px ${statusMeta.ring}`,
              }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: statusMeta.fg }} />
              {template.status}
            </button>

            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete template"
                className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/5"
                style={{ color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
              >
                <Trash2 size={12} />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                isDirty
                  ? { background: T.brand, color: "#fff", boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }
                  : { color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }
              }
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : savedFlash ? (
                <Check size={12} />
              ) : (
                <Save size={12} />
              )}
              {saving ? "Saving" : savedFlash ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Subject + variables */}
        <div className="mt-2.5 flex flex-col md:flex-row md:items-center gap-2 md:gap-2.5">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <Tag size={11} style={{ color: T.textFaint }} className="shrink-0" />
            <input
              value={template.subject}
              onChange={(e) => updateTemplate({ subject: e.target.value })}
              placeholder="Subject line"
              className="w-full bg-transparent outline-none text-[12.5px]"
              style={{ color: T.text }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10.5px] mr-1" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              <Braces size={10} /> insert
            </span>
            {variables.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                title={variableDescriptions[v]}
                className="rounded-md px-1.5 py-0.5 text-[10px] transition-colors hover:bg-white/5"
                style={{ fontFamily: FONT.mono, background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body: HTML + preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Code pane */}
        <div className="flex flex-col h-full min-h-0">
          <div
            className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{ background: T.bg, borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div className="flex items-center gap-2">
              <Code2 size={12} style={{ color: T.textFaint }} />
              <span className="text-[10.5px] font-medium uppercase tracking-widest" style={{ color: T.textFaint }}>HTML</span>
            </div>
            <span className="text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              {template.html.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={template.html}
            onChange={(e) => updateTemplate({ html: e.target.value })}
            spellCheck={false}
            className="flex-1 w-full resize-none p-4 text-[12px] leading-relaxed outline-none"
            style={{ fontFamily: FONT.mono, background: T.bg, color: T.textMuted }}
          />
        </div>

        {/* Preview pane */}
        <div className="flex flex-col h-full min-h-0" style={{ borderLeft: `1px solid ${T.borderSoft}` }}>
          <div
            className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{ background: T.bg, borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div className="flex items-center gap-2">
              <Eye size={12} style={{ color: T.textFaint }} />
              <span className="text-[10.5px] font-medium uppercase tracking-widest" style={{ color: T.textFaint }}>Preview</span>
            </div>

            <div
              className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              {([
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ] as { id: Device; icon: ElementType }[]).map(({ id, icon: Icon }) => {
                const active = device === id;
                return (
                  <button
                    key={id}
                    onClick={() => setDevice(id)}
                    className="rounded-md p-1.5 transition-colors"
                    style={{
                      background: active ? T.surfaceHi : "transparent",
                      color: active ? T.text : T.textMuted,
                    }}
                    aria-label={`${id} preview`}
                  >
                    <Icon size={12} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-start justify-center" style={{ background: T.surface2 }}>
            <iframe
              title="Template preview"
              srcDoc={template.html}
              sandbox=""
              className="w-full h-full rounded-lg bg-white transition-all"
              style={{
                border: `1px solid ${T.borderSoft}`,
                boxShadow: "0 12px 30px -12px rgba(0,0,0,0.5)",
                maxWidth: device === "mobile" ? 390 : device === "tablet" ? 768 : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && onDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
          >
            <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: T.dangerSoft, color: T.danger }}
                >
                  <Trash2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Delete template?</h3>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                    This permanently removes it from the database.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: T.danger, boxShadow: "0 6px 18px -8px rgba(239,68,68,0.65)" }}
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────── stat tile ─────────────── */

const StatCard: FC<{
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;
  accent: string;
  accentSoft: string;
  accentBorder: string;
}> = ({ title, value, description, icon: Icon, accent, accentSoft, accentBorder }) => (
  <div className="rounded-xl p-4" style={{ background: T.surface, boxShadow: RING }}>
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} />
      </div>
    </div>
    <p className="text-[24px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-2" style={{ color: T.textMuted }}>{title}</p>
    <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint }}>{description}</p>
  </div>
);

/* ─────────────── filter pill ─────────────── */

const FilterPill: FC<{ label: string; active: boolean; onClick: () => void; small?: boolean }> = ({ label, active, onClick, small }) => (
  <button
    onClick={onClick}
    className={`rounded-md px-2 ${small ? "py-0.5 text-[11px]" : "py-1 text-[11.5px]"} font-medium transition-colors`}
    style={{
      background: active ? T.surfaceHi : T.surface2,
      color: active ? T.text : T.textMuted,
      boxShadow: active ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
    }}
  >
    {label}
  </button>
);

/* ─────────────── card action ─────────────── */

const ActionBtn: FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}> = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="w-6 h-6 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
    style={{
      background: "rgba(10,11,16,0.82)",
      backdropFilter: "blur(6px)",
      color: danger ? T.danger : T.textMuted,
      boxShadow: `inset 0 0 0 1px ${danger ? T.dangerBorder : T.border}`,
    }}
  >
    {children}
  </button>
);

/* ─────────────── delete confirm (list) ─────────────── */

const DeleteConfirmModal: FC<{
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ name, busy, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    onClick={() => !busy && onCancel()}
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-2xl overflow-hidden"
      style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
    >
      <div className="p-5 border-b" style={{ borderColor: T.borderSoft }}>
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: T.dangerSoft, color: T.danger }}
          >
            <Trash2 size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold break-words" style={{ color: T.text }}>
              Delete “{name}”?
            </h3>
            <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
              This permanently removes it from the database.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4">
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
          style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          style={{ background: T.danger, boxShadow: "0 6px 18px -8px rgba(239,68,68,0.65)" }}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────── new template modal ─────────────── */

type CreateMode = "starter" | "paste" | "upload" | "url";

interface NewTemplateModalProps {
  busy: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    subject: string;
    category: Category;
    status: Status;
    html: string;
  }) => void;
}

const NewTemplateModal: FC<NewTemplateModalProps> = ({ busy, onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("Welcome");
  const [status, setStatus] = useState<Status>("Draft");
  const [mode, setMode] = useState<CreateMode>("starter");

  const [pasteHtml, setPasteHtml] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [fileHtml, setFileHtml] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlHtml, setUrlHtml] = useState("");

  const [showPreview, setShowPreview] = useState(true);

  const resolvedHtml = useMemo(() => {
    if (mode === "starter") return starterHtml(category);
    if (mode === "paste") return pasteHtml;
    if (mode === "upload") return fileHtml;
    if (mode === "url") return urlHtml;
    return "";
  }, [mode, category, pasteHtml, fileHtml, urlHtml]);

  const htmlSourceLabel: Record<CreateMode, string> = {
    starter: "Starter boilerplate",
    paste: "Pasted HTML",
    upload: "Uploaded file",
    url: "Fetched from URL",
  };

  const canSubmit = !!resolvedHtml.trim() && !busy;

  const readFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileHtml(String(e.target?.result ?? ""));
      setFileName(file.name);
      if (!name) {
        const base = file.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").trim();
        if (base) setName(base.charAt(0).toUpperCase() + base.slice(1));
      }
    };
    reader.onerror = () => setFileHtml("");
    reader.readAsText(file);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setPasteHtml(text);
    } catch { /* ignore */ }
  };

  const fetchFromUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setFetchingUrl(true);
    setUrlError(null);
    try {
      const res = await fetch(trimmed, { mode: "cors" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const text = await res.text();
      if (!looksLikeHtml(text)) throw new Error("Response doesn't look like HTML");
      setUrlHtml(text);
      if (!name) {
        try {
          const u = new URL(trimmed);
          const base = u.pathname.split("/").filter(Boolean).pop()?.replace(/\.html?$/i, "") || u.hostname;
          setName(base.charAt(0).toUpperCase() + base.slice(1));
        } catch { /* ignore */ }
      }
    } catch (e) {
      setUrlError(errMsg(e));
      setUrlHtml("");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim() || "Untitled Template",
      subject: subject.trim() || "New email subject",
      category,
      status,
      html: resolvedHtml,
    });
  };

  const inputStyle: CSSProperties = {
    background: T.surface2,
    color: T.text,
    boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
  };

  const focusRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`;
  };
  const blurRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`;
  };

  const modeTabs: { id: CreateMode; label: string; icon: ElementType; hint: string }[] = [
    { id: "starter", label: "Starter",     icon: LayoutTemplate, hint: "Category boilerplate" },
    { id: "paste",   label: "Paste HTML",  icon: Clipboard,      hint: "Paste raw HTML" },
    { id: "upload",  label: "Upload file", icon: FileUp,         hint: ".html / .htm" },
    { id: "url",     label: "From URL",    icon: Globe,          hint: "Fetch remote HTML" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b flex-shrink-0" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand }}
            >
              <LayoutTemplate size={15} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>New HTML template</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                Build from a starter, paste HTML, upload a file, or fetch from a URL.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Left: form */}
          <div className="p-5 space-y-3.5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: T.borderSoft }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Template name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cart Abandonment"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Subject line</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. You left something behind"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none cursor-pointer"
                  style={inputStyle}
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>Initial status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Draft", "Published"] as Status[]).map((s) => {
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className="rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
                        style={{
                          background: active ? (s === "Published" ? T.successSoft : T.warnSoft) : T.surface2,
                          color: active ? (s === "Published" ? T.success : T.warn) : T.textMuted,
                          boxShadow: `inset 0 0 0 1px ${active ? (s === "Published" ? T.successBorder : T.warnBorder) : T.borderSoft}`,
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>HTML source</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {modeTabs.map(({ id, label, icon: Icon }) => {
                  const active = mode === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors"
                      style={{
                        background: active ? T.brandSoft : T.surface2,
                        color: active ? T.brand : T.textMuted,
                        boxShadow: `inset 0 0 0 1px ${active ? T.brandBorder : T.borderSoft}`,
                      }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === "starter" && (
              <div
                className="rounded-lg p-3 flex items-start gap-2.5"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                <FileText size={13} style={{ color: T.textFaint }} className="mt-0.5 shrink-0" />
                <div className="text-[11.5px] leading-relaxed" style={{ color: T.textMuted }}>
                  A <span style={{ color: T.text, fontWeight: 600 }}>{category}</span> boilerplate will be generated with
                  standard email variables (<span style={{ fontFamily: FONT.mono }}>{"{{first_name}}"}</span>, <span style={{ fontFamily: FONT.mono }}>{"{{company}}"}</span>, etc.) already wired in.
                </div>
              </div>
            )}

            {mode === "paste" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11.5px] font-medium" style={{ color: T.textMuted }}>Paste HTML</label>
                  <button
                    onClick={pasteFromClipboard}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] transition-colors hover:bg-white/5"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <Clipboard size={10} /> Paste
                  </button>
                </div>
                <textarea
                  value={pasteHtml}
                  onChange={(e) => setPasteHtml(e.target.value)}
                  placeholder="<!DOCTYPE html>…"
                  rows={8}
                  spellCheck={false}
                  className="w-full rounded-lg px-3 py-2 text-[12px] outline-none transition-all resize-none"
                  style={{ fontFamily: FONT.mono, ...inputStyle }}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
                {pasteHtml && !looksLikeHtml(pasteHtml) && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.warn }}>
                    <AlertCircle size={10} /> This doesn't look like HTML.
                  </p>
                )}
              </div>
            )}

            {mode === "upload" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={onFileInput}
                />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  style={{
                    background: dragOver ? T.brandSoft : T.surface2,
                    boxShadow: `inset 0 0 0 1px ${dragOver ? T.brandBorder : T.borderSoft}`,
                    border: `1px dashed ${dragOver ? T.brand : T.border}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: T.brandSoft, color: T.brand }}
                  >
                    <Upload size={15} />
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: T.textMuted }}>
                    {fileName ? `Selected: ${fileName}` : "Drop an .html file here"}
                  </p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint }}>
                    or click to browse
                  </p>
                </div>
                {fileHtml && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.success }}>
                    <CheckCircle size={10} /> {fileHtml.length.toLocaleString()} chars loaded
                  </p>
                )}
              </div>
            )}

            {mode === "url" && (
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>HTML URL</label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0"
                    style={inputStyle}
                  >
                    <Link2 size={12} style={{ color: T.textFaint }} className="shrink-0" />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/template.html"
                      className="w-full bg-transparent outline-none text-[12.5px]"
                      style={{ color: T.text }}
                      onFocus={focusRing}
                      onBlur={blurRing}
                    />
                  </div>
                  <button
                    onClick={fetchFromUrl}
                    disabled={!url.trim() || fetchingUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
                  >
                    {fetchingUrl ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
                    Fetch
                  </button>
                </div>
                {urlError && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.danger }}>
                    <AlertTriangle size={10} /> {urlError}
                  </p>
                )}
                {urlHtml && !urlError && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.success }}>
                    <CheckCircle size={10} /> {urlHtml.length.toLocaleString()} chars loaded
                  </p>
                )}
                <p className="mt-1.5 text-[10.5px]" style={{ color: T.textFaint }}>
                  The URL must allow cross-origin requests (CORS).
                </p>
              </div>
            )}

            <div
              className="rounded-lg px-3 py-2 flex items-center justify-between gap-2"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textMuted }}>
                <Code2 size={11} /> {htmlSourceLabel[mode]}
              </span>
              <span className="text-[10.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                {resolvedHtml.length.toLocaleString()} chars
              </span>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="p-5 flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye size={12} style={{ color: T.textFaint }} />
                <span className="text-[10.5px] font-medium uppercase tracking-widest" style={{ color: T.textFaint }}>
                  Live preview
                </span>
              </div>
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="rounded-md px-2 py-1 text-[10.5px] transition-colors hover:bg-white/5"
                style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                {showPreview ? "Hide" : "Show"}
              </button>
            </div>
            {showPreview && (
              <div
                className="flex-1 rounded-lg overflow-hidden flex items-start justify-center"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}`, minHeight: 260 }}
              >
                {resolvedHtml ? (
                  <iframe
                    title="New template preview"
                    srcDoc={resolvedHtml}
                    sandbox=""
                    className="w-full h-full bg-white border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <FileCode size={20} style={{ color: T.textFaint }} />
                    <p className="mt-2 text-[11.5px]" style={{ color: T.textMuted }}>
                      HTML preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t flex-shrink-0" style={{ borderColor: T.borderSoft }}>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create template
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── AI modal ─────────────── */

const AIGenerateModal: FC<{
  busy: boolean;
  onClose: () => void;
  onGenerate: () => void;
  prompt: string;
  setPrompt: (value: string) => void;
}> = ({ busy, onClose, onGenerate, prompt, setPrompt }) => {
  const quickPrompts = [
    { label: "Welcome",    prompt: "A friendly welcome email for new users with a 20% discount" },
    { label: "Promotion",  prompt: "A promotional email announcing a flash sale with urgency" },
    { label: "Newsletter", prompt: "A monthly newsletter with product updates and industry news" },
  ];
  const canGenerate = !!prompt.trim() && !busy;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)` }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: T.warnSoft, color: T.warn }}
            >
              <Sparkles size={15} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>AI template generator</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                Describe what you want and we'll draft it.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
              What kind of email do you want?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A welcome email for new users with a 20% discount code…"
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-all resize-none"
              style={{ background: T.surface2, color: T.text, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
            />
            <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.textFaint }}>
              <AlertCircle size={10} />
              Be specific about tone, purpose, and key messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] mr-1" style={{ color: T.textFaint }}>Quick prompts</span>
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => setPrompt(p.prompt)}
                className="rounded-md px-2 py-0.5 text-[11px] transition-colors hover:bg-white/5"
                style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t" style={{ borderColor: T.borderSoft }}>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 disabled:hover:brightness-100"
            style={{ background: T.warn, color: "#0A0B10", boxShadow: "0 6px 18px -8px rgba(245,158,11,0.65)" }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Generate template
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── main page ─────────────── */

const EmailTemplatesAdmin = () => {
  const {
    templates: apiTemplates,
    loading,
    error,
    refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useHtmlTemplates();

  const templates = useMemo(() => apiTemplates.map(mapApiTemplate), [apiTemplates]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft">("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [busyId, setBusyId] = useState<Id | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (type: "success" | "error", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const filtered = useMemo(
    () =>
      templates.filter((t) => {
        const q = search.toLowerCase();
        const matchesSearch =
          t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
        const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
        const matchesStatus = statusFilter === "All" || t.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [templates, search, categoryFilter, statusFilter]
  );

  const openEditor = async (t: Template) => {
    if (t.html.trim()) {
      setEditingTemplate(t);
      return;
    }
    setBusyId(t.id);
    try {
      const full = await getHTMLTemplatesById(t.id);
      const mapped = mapApiTemplate(full, 0);
      setEditingTemplate({
        ...mapped,
        id: t.id,
        name: mapped.name === "Untitled Template" ? t.name : mapped.name,
        subject: mapped.subject || t.subject,
        updatedAt: mapped.updatedAt === "—" ? t.updatedAt : mapped.updatedAt,
      });
    } catch (e) {
      notify("error", errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  const createAndOpen = async (payload: TemplatePayload) => {
    setCreating(true);
    try {
      const created = await createTemplate(payload);
      const mapped = mapApiTemplate(created, 0);
      mapped.html = mapped.html || payload.html;
      mapped.subject = mapped.subject || payload.subject;
      if (mapped.name === "Untitled Template") mapped.name = payload.name;
      if (mapped.updatedAt === "—") mapped.updatedAt = "Just now";
      setShowNewModal(false);
      setShowAIGenerate(false);
      setGenerationPrompt("");
      setEditingTemplate(mapped);
      notify("success", "Template created");
    } catch (e) {
      notify("error", errMsg(e));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFromModal = (payload: {
    name: string;
    subject: string;
    category: Category;
    status: Status;
    html: string;
  }) => createAndOpen(payload);

  const handleAIGenerate = () => {
    const p = generationPrompt.trim();
    if (!p) return;
    createAndOpen({
      name: `AI Generated: ${p.substring(0, 30)}${p.length > 30 ? "…" : ""}`,
      subject: p,
      category: "Promotional",
      status: "Draft",
      html: aiHtml(p),
    });
  };

  const handleSaveTemplate = async (t: Template): Promise<Template> => {
    const updated = await updateTemplate(t.id, toPayload(t));
    const mapped = mapApiTemplate(updated, 0);
    const result: Template = {
      ...mapped,
      id: t.id,
      name: mapped.name === "Untitled Template" ? t.name : mapped.name,
      subject: mapped.subject || t.subject,
      html: mapped.html || t.html,
      updatedAt: mapped.updatedAt === "—" ? "Just now" : mapped.updatedAt,
    };
    setEditingTemplate(result);
    return result;
  };

  const handleToggleStatus = async (t: Template) => {
    setBusyId(t.id);
    try {
      let html = t.html;
      if (!html.trim()) {
        const full = await getHTMLTemplatesById(t.id);
        html = mapApiTemplate(full, 0).html;
      }
      const status: Status = t.status === "Published" ? "Draft" : "Published";
      await updateTemplate(t.id, { ...toPayload(t), html, status });
      notify("success", status === "Published" ? "Template published" : "Moved to drafts");
    } catch (e) {
      notify("error", errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (t: Template) => {
    setBusyId(t.id);
    try {
      let html = t.html;
      if (!html.trim()) {
        const full = await getHTMLTemplatesById(t.id);
        html = mapApiTemplate(full, 0).html;
      }
      await createTemplate({ ...toPayload(t), html, name: `${t.name} (copy)`, status: "Draft" });
      notify("success", "Template duplicated");
    } catch (e) {
      notify("error", errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyHtml = async (t: Template) => {
    try {
      let html = t.html;
      if (!html.trim()) {
        const full = await getHTMLTemplatesById(t.id);
        html = mapApiTemplate(full, 0).html;
      }
      await navigator.clipboard.writeText(html);
      notify("success", "HTML copied");
    } catch {
      notify("error", "Couldn't copy to clipboard");
    }
  };

  const handleDelete = async (t: Template): Promise<boolean> => {
    setBusyId(t.id);
    try {
      await deleteTemplate(t.id);
      setDeleteTarget(null);
      setEditingTemplate((cur) => (cur?.id === t.id ? null : cur));
      notify("success", "Template deleted");
      return true;
    } catch (e) {
      notify("error", errMsg(e));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Kill outer body scroll so only <main> scrolls */
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .etm-main::-webkit-scrollbar { width: 8px; }
        .etm-main::-webkit-scrollbar-track { background: transparent; }
        .etm-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .etm-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        select option { background: ${T.surface2}; color: ${T.text}; }

        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="etm-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
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
                  <span className="text-[10.5px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Content</span>
                  <ChevronRight size={10} style={{ color: T.textFaint }} />
                  <span className="text-[10.5px] font-medium tracking-widest uppercase" style={{ color: T.brand }}>Templates</span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Email templates
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Build and manage the HTML templates used across every campaign.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-white transition-all hover:brightness-110"
                style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                <Plus size={13} /> New template
              </button>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Total templates" value={String(templates.length)}                                                                    description="Across all categories" icon={LayoutTemplate} accent={T.textMuted} accentSoft={T.surface2} accentBorder={T.borderSoft} />
            <StatCard title="Published"       value={String(templates.filter((t) => t.status === "Published").length)}                          description="Live and in use"          icon={CheckCircle2}   accent={T.success}   accentSoft={T.successSoft}  accentBorder={T.successBorder} />
            <StatCard title="Drafts"          value={String(templates.filter((t) => t.status === "Draft").length)}                              description="Not yet published"        icon={Clock}          accent={T.warn}      accentSoft={T.warnSoft}     accentBorder={T.warnBorder} />
            <StatCard title="Categories"      value={String(categories.length)}                                                                 description="Welcome · Promo · News · Txn" icon={FileCode}   accent={T.brand}     accentSoft={T.brandSoft}    accentBorder={T.brandBorder} />
          </div>

          {/* Filters */}
          <div className="rounded-xl p-3 mb-5" style={{ background: T.surface, boxShadow: RING }}>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
            >
              <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                type="text"
                placeholder="Search templates by name or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: T.text }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                  style={{ color: T.textMuted }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest mr-1" style={{ color: T.textFaint }}>Category</span>
              <FilterPill label="All" active={categoryFilter === "All"} onClick={() => setCategoryFilter("All")} small />
              {categories.map((c) => (
                <FilterPill key={c} label={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} small />
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest mr-1" style={{ color: T.textFaint }}>Status</span>
              <FilterPill label="All"       active={statusFilter === "All"}       onClick={() => setStatusFilter("All")} small />
              <FilterPill label="Published" active={statusFilter === "Published"} onClick={() => setStatusFilter("Published")} small />
              <FilterPill label="Draft"     active={statusFilter === "Draft"}     onClick={() => setStatusFilter("Draft")} small />
            </div>
          </div>

          {/* Content */}
          {loading && templates.length === 0 ? (
            <div className="rounded-xl p-14 flex flex-col items-center justify-center" style={{ background: T.surface, boxShadow: RING }}>
              <Loader2 size={24} className="animate-spin" style={{ color: T.brand }} />
              <p className="mt-3 text-[12.5px]" style={{ color: T.textMuted }}>Loading templates…</p>
            </div>
          ) : !loading && error && templates.length === 0 ? (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center" style={{ background: T.surface, boxShadow: RING }}>
              <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.dangerSoft, color: T.danger }}>
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Couldn't load templates</h3>
              <p className="mt-2 text-[12.5px] max-w-md" style={{ color: T.textMuted }}>{error}</p>
              <button
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110"
                style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center" style={{ background: T.surface, boxShadow: RING }}>
              <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.brandSoft, color: T.brand }}>
                <Inbox size={22} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>No templates yet</h3>
              <p className="mt-2 text-[12.5px]" style={{ color: T.textMuted }}>Create your first template to get started.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center" style={{ background: T.surface, boxShadow: RING }}>
              <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2, color: T.textMuted }}>
                <Inbox size={22} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>No templates match</h3>
              <p className="mt-2 text-[12.5px] mb-4" style={{ color: T.textMuted }}>Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearch(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                className="text-[12px] font-medium"
                style={{ color: T.brand }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((t, i) => {
                const published = t.status === "Published";
                const busy = busyId === t.id;
                const meta = published
                  ? { fg: T.success, ring: T.successBorder, label: "Published" }
                  : { fg: T.warn,    ring: T.warnBorder,    label: "Draft" };
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEditor(t)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && e.key === "Enter") openEditor(t);
                    }}
                    className="group float-in rounded-xl overflow-hidden text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{
                      background: T.surface,
                      boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
                      animationDelay: `${Math.min(i * 20, 200)}ms`,
                    }}
                  >
                    {/* preview */}
                    <div
                      className="relative h-36 overflow-hidden"
                      style={{
                        background: T.surface2,
                        borderBottom: `1px solid ${T.borderSoft}`,
                      }}
                    >
                      {t.html ? (
                        <div
                          className="origin-top-left"
                          style={{
                            width: "1280px",
                            height: "1280px",
                            transform: "scale(0.28)",
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
                          <FileCode size={20} style={{ color: T.textFaint }} />
                        </div>
                      )}

                      {/* actions */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100">
                        <ActionBtn label="Edit"       disabled={busy} onClick={() => openEditor(t)}><Pencil size={11} /></ActionBtn>
                        <ActionBtn label="Duplicate"  disabled={busy} onClick={() => handleDuplicate(t)}><Copy size={11} /></ActionBtn>
                        <ActionBtn label="Copy HTML"  onClick={() => handleCopyHtml(t)}><ClipboardCopy size={11} /></ActionBtn>
                        <ActionBtn label={published ? "Unpublish" : "Publish"} disabled={busy} onClick={() => handleToggleStatus(t)}>
                          {published ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        </ActionBtn>
                        <ActionBtn label="Delete" danger onClick={() => setDeleteTarget(t)}><Trash2 size={11} /></ActionBtn>
                      </div>

                      <span
                        className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "rgba(10,11,16,0.78)",
                          backdropFilter: "blur(6px)",
                          color: meta.fg,
                          boxShadow: `inset 0 0 0 1px ${meta.ring}`,
                        }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: meta.fg }} />
                        {meta.label}
                      </span>

                      {busy && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                          <Loader2 size={18} className="animate-spin" style={{ color: T.brand }} />
                        </div>
                      )}
                    </div>

                    {/* meta */}
                    <div className="p-3.5">
                      <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>{t.name}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {t.subject || "(no subject)"}
                      </p>

                      <div className="mt-3.5 flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]"
                          style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                        >
                          <Tag size={9} /> {t.category}
                        </span>
                        <span className="text-[10px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {t.updatedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showNewModal && (
        <NewTemplateModal
          busy={creating}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateFromModal}
        />
      )}
      {showAIGenerate && (
        <AIGenerateModal
          busy={creating}
          onClose={() => setShowAIGenerate(false)}
          onGenerate={handleAIGenerate}
          prompt={generationPrompt}
          setPrompt={setGenerationPrompt}
        />
      )}
      {editingTemplate && (
        <TemplateEditor
          key={editingTemplate.id}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
          onDelete={() => handleDelete(editingTemplate)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[70] float-in rounded-lg px-4 py-2.5 text-[12px] font-medium"
          style={{
            background: T.surface,
            color: toast.type === "success" ? T.success : T.danger,
            boxShadow: `inset 0 0 0 1px ${toast.type === "success" ? T.successBorder : T.dangerBorder}, 0 20px 40px -20px rgba(0,0,0,0.7)`,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesAdmin;