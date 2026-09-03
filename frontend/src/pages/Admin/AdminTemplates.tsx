// EmailTemplatesAdmin.tsx
import { useEffect, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  Save,
  X,
  Monitor,
  Smartphone,
  FileCode,
  Braces,
  LayoutTemplate,
  Undo2,
  Inbox,
  Check,
  Menu,
  Sparkles,
  Wand2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (iron / ember)                       */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.12)",
  success: "#7FD98A",
  successSoft: "rgba(127,217,138,0.12)",
  warning: "#FFC24B",
  warningSoft: "rgba(255,194,75,0.12)",
  danger: "#FF5C6C",
  dangerSoft: "rgba(255,92,108,0.12)",
  neutral: "#8B8D94",
  neutralSoft: "rgba(139,141,148,0.12)",
  dark: "#E8E6E1",
  bg: "#0E1013",
  surface: "#171A21",
  surfaceHover: "#1B1E24",
  border: "#2A2E37",
  borderHover: "#3A3F4A",
  textMuted: "#8B8D94",
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

// Enhanced template generators with better HTML
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

const initialTemplates: Template[] = [
  {
    id: 1,
    name: "Welcome Series — Email 1",
    subject: "Welcome to {{company}} 👋",
    category: "Welcome",
    status: "Published",
    updatedAt: "2 days ago",
    html: starterHtml("Welcome"),
  },
  {
    id: 2,
    name: "Summer Sale Blast",
    subject: "30% off — ends tonight",
    category: "Promotional",
    status: "Published",
    updatedAt: "5 days ago",
    html: starterHtml("Promotional"),
  },
  {
    id: 3,
    name: "August Newsletter",
    subject: "What's new this month",
    category: "Newsletter",
    status: "Draft",
    updatedAt: "1 hour ago",
    html: starterHtml("Newsletter"),
  },
  {
    id: 4,
    name: "Order Confirmation",
    subject: "Your order is confirmed",
    category: "Transactional",
    status: "Published",
    updatedAt: "2 weeks ago",
    html: starterHtml("Transactional"),
  },
];

const nextId = (list: Template[]) => (list.length ? Math.max(...list.map((t) => t.id)) + 1 : 1);

/* ========================================================= */
/* Template Editor Page - Full Screen */
/* ========================================================= */

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onClose: () => void;
  onDelete?: () => void;
}

const TemplateEditor = ({ template: initialTemplate, onSave, onClose, onDelete }: TemplateEditorProps) => {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [savedFlash, setSavedFlash] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = JSON.stringify(initialTemplate) !== JSON.stringify(template);

  const updateTemplate = (patch: Partial<Template>) => {
    setTemplate((prev) => ({ ...prev, ...patch }));
  };

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
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [template, isDirty]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: COLOR.bg }}>
      {/* Editor Header */}
      <div className="flex-shrink-0 p-3 md:p-4" style={{ background: COLOR.surface, borderBottom: `1px solid ${COLOR.border}` }}>
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 md:gap-2 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition hover:opacity-80"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
              >
                <ArrowLeft size={14} />
                <span className="hidden xs:inline">Back</span>
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                <input
                  value={template.name}
                  onChange={(e) => updateTemplate({ name: e.target.value })}
                  className="mf-title-input rounded-lg border border-transparent px-2 py-1 text-sm md:text-base lg:text-lg font-semibold outline-none transition"
                  style={{ fontFamily: FONT.display, color: COLOR.dark, background: 'transparent', maxWidth: '300px' }}
                  placeholder="Template name"
                />
                {isDirty && (
                  <span className="text-[9px] md:text-xs font-medium" style={{ color: COLOR.warning }}>
                    ● Unsaved
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <select
                value={template.category}
                onChange={(e) => updateTemplate({ category: e.target.value as Category })}
                className="rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium outline-none transition"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={() => updateTemplate({ status: template.status === "Published" ? "Draft" : "Published" })}
                className="rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium transition hover:opacity-90"
                style={{
                  background: template.status === "Published" ? COLOR.successSoft : COLOR.warningSoft,
                  color: template.status === "Published" ? COLOR.success : COLOR.warning,
                }}
              >
                {template.status}
              </button>

              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="flex items-center gap-1 md:gap-1.5 rounded-lg px-3 md:px-4 py-1 md:py-1.5 text-[9px] md:text-xs font-medium transition"
                style={{
                  background: isDirty ? COLOR.primary : COLOR.border,
                  color: isDirty ? COLOR.bg : COLOR.textMuted,
                  cursor: isDirty ? "pointer" : "not-allowed",
                }}
              >
                {savedFlash ? <Check size={12} /> : <Save size={12} />}
                {savedFlash ? "Saved" : isDirty ? "Save" : "Saved"}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium transition hover:opacity-90"
                style={{ background: COLOR.dangerSoft, color: COLOR.danger }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Subject & Variables */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <input
              value={template.subject}
              onChange={(e) => updateTemplate({ subject: e.target.value })}
              placeholder="Subject line"
              className="mf-input flex-1 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs outline-none transition"
              style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
            />

            <div className="flex flex-wrap items-center gap-0.5 md:gap-1">
              <span className="mr-0.5 md:mr-1 flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-medium" style={{ color: COLOR.textMuted }}>
                <Braces size={10} />
                <span className="hidden xs:inline">Insert:</span>
              </span>
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  className="rounded-md px-1 md:px-1.5 py-0.5 text-[8px] md:text-[9px] transition"
                  style={{ fontFamily: FONT.mono, background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                  title={variableDescriptions[v]}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Body - Full width code + preview */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Code Area */}
        <div className="flex flex-col h-full">
          <div
            className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5"
            style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}`, borderRight: `1px solid ${COLOR.border}` }}
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <Code2 size={12} style={{ color: COLOR.textMuted }} />
              <span style={{ color: COLOR.textMuted }} className="text-[10px] md:text-xs font-medium">HTML</span>
            </div>
            <span className="text-[8px] md:text-[9px]" style={{ color: COLOR.textMuted }}>
              {template.html.length} chars
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={template.html}
            onChange={(e) => updateTemplate({ html: e.target.value })}
            spellCheck={false}
            className="flex-1 w-full resize-none p-3 md:p-4 text-[10px] md:text-[12px] leading-relaxed outline-none"
            style={{ fontFamily: FONT.mono, background: COLOR.bg, color: COLOR.textBody, borderRight: `1px solid ${COLOR.border}` }}
          />
        </div>

        {/* Preview Area */}
        <div className="flex flex-col h-full">
          <div
            className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5"
            style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}` }}
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <Eye size={12} style={{ color: COLOR.textMuted }} />
              <span style={{ color: COLOR.textMuted }} className="text-[10px] md:text-xs font-medium">Preview</span>
            </div>
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <button
                onClick={() => setDevice("desktop")}
                className="rounded-md p-1 md:p-1.5 transition"
                style={{
                  background: device === "desktop" ? COLOR.primary : "transparent",
                  color: device === "desktop" ? COLOR.bg : COLOR.textMuted,
                }}
              >
                <Monitor size={12} />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className="rounded-md p-1 md:p-1.5 transition"
                style={{
                  background: device === "mobile" ? COLOR.primary : "transparent",
                  color: device === "mobile" ? COLOR.bg : COLOR.textMuted,
                }}
              >
                <Smartphone size={12} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-4" style={{ background: COLOR.bg }}>
            <iframe
              title="Template preview"
              srcDoc={template.html}
              sandbox=""
              className={`h-full rounded-lg bg-white shadow-lg transition-all mx-auto ${
                device === "mobile" ? "w-[280px] md:w-[375px]" : "w-full max-w-[600px]"
              }`}
              style={{ border: `1px solid ${COLOR.border}` }}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && onDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(14,16,19,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-4 md:p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <h3 className="text-base md:text-lg font-semibold" style={{ color: COLOR.dark }}>Delete Template?</h3>
              <p className="text-[10px] md:text-sm" style={{ color: COLOR.textMuted }}>This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-2 md:gap-3 p-4 md:p-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-medium transition hover:opacity-90"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-medium transition hover:opacity-90"
                style={{ background: COLOR.danger, color: COLOR.bg }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================= */
/* Main List Page */
/* ========================================================= */

const EmailTemplatesAdmin = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft">("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleSaveTemplate = (saved: Template) => {
    setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (editingTemplate?.id === id) {
      setEditingTemplate(null);
    }
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
      name: `AI Generated: ${generationPrompt.substring(0, 30)}${generationPrompt.length > 30 ? '...' : ''}`,
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

        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: ${COLOR.border}; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: ${COLOR.borderHover}; }

        .mf-card { transition: border-color 0.15s ease; }
        .mf-card:hover { border-color: ${COLOR.borderHover}; }
        .mf-row-btn { transition: background-color 0.12s ease; }
        .mf-row-btn:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-input::placeholder { color: ${COLOR.textMuted}; }
        .mf-input:focus, .mf-title-input:focus, .mf-select:focus {
          border-color: ${COLOR.primary} !important;
          box-shadow: 0 0 0 3px ${COLOR.primarySoft};
        }
        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 h-screen w-full" style={{ background: COLOR.bg }}>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <p
                style={{ fontFamily: FONT.mono, color: COLOR.textMuted }}
                className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider"
              >
                Content
              </p>
              <h1
                style={{ fontFamily: FONT.display, color: COLOR.dark, letterSpacing: "-0.01em" }}
                className="mt-0.5 md:mt-1 text-lg md:text-xl lg:text-2xl font-semibold"
              >
                Email Templates
              </h1>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: COLOR.textMuted }}>
                Build and manage the HTML templates used across your campaigns.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium transition hover:opacity-90 flex-1 sm:flex-none"
              style={{ background: COLOR.warningSoft, color: COLOR.warning }}
            >
              <Sparkles size={14} />
              <span className="hidden xs:inline">AI Generate</span>
              <span className="xs:hidden">AI</span>
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium transition hover:opacity-90 flex-1 sm:flex-none"
              style={{ background: COLOR.primary, color: COLOR.bg }}
            >
              <Plus size={14} />
              <span className="hidden xs:inline">New Template</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-2.5 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Templates"
            value={String(templates.length)}
            description="Across all categories"
            icon={LayoutTemplate}
            accent={COLOR.neutral}
            accentSoft={COLOR.neutralSoft}
          />
          <StatCard
            title="Published"
            value={String(templates.filter((t) => t.status === "Published").length)}
            description="Live and in use"
            icon={CheckCircle2}
            accent={COLOR.success}
            accentSoft={COLOR.successSoft}
          />
          <StatCard
            title="Drafts"
            value={String(templates.filter((t) => t.status === "Draft").length)}
            description="Not yet published"
            icon={Clock}
            accent={COLOR.warning}
            accentSoft={COLOR.warningSoft}
          />
          <StatCard
            title="Categories"
            value={String(categories.length)}
            description="Welcome, Promo, News, Txn"
            icon={FileCode}
            accent={COLOR.primary}
            accentSoft={COLOR.primarySoft}
          />
        </div>

        {/* Filters & List */}
        <div className="rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          {/* Filters */}
          <div className="p-3 md:p-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
            <div className="relative mb-2.5 md:mb-3">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: COLOR.textMuted }}
              />
              <input
                type="text"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mf-input w-full rounded-lg py-1.5 md:py-2 pl-7 md:pl-8 pr-2.5 md:pr-3 text-[10px] md:text-xs outline-none transition"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <FilterChip label="All" active={categoryFilter === "All"} onClick={() => setCategoryFilter("All")} />
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  label={c}
                  active={categoryFilter === c}
                  onClick={() => setCategoryFilter(c)}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              <FilterChipSmall label="All" active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
              <FilterChipSmall label="Published" active={statusFilter === "Published"} onClick={() => setStatusFilter("Published")} />
              <FilterChipSmall label="Draft" active={statusFilter === "Draft"} onClick={() => setStatusFilter("Draft")} />
            </div>
          </div>

          {/* Template Grid */}
          <div className="p-3 md:p-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <Inbox size={32} style={{ color: COLOR.textMuted }} className="mb-3" />
                <p className="text-sm" style={{ color: COLOR.textMuted }}>No templates found</p>
                <p className="text-xs mt-1" style={{ color: COLOR.textMuted }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEditingTemplate(t)}
                    className="mf-card rounded-xl p-3 md:p-4 text-left transition"
                    style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-xs font-medium truncate" style={{ color: COLOR.dark }}>
                          {t.name}
                        </p>
                        <p className="text-[8px] md:text-[9px] truncate mt-0.5" style={{ color: COLOR.textMuted }}>
                          {t.subject}
                        </p>
                      </div>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: t.status === "Published" ? COLOR.success : COLOR.warning }}
                        title={t.status}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[7px] md:text-[8px] font-medium"
                        style={{ background: COLOR.surface, color: COLOR.textBody, border: `1px solid ${COLOR.border}` }}
                      >
                        {t.category}
                      </span>
                      <span className="text-[7px] md:text-[8px]" style={{ color: COLOR.textMuted }}>
                        {t.updatedAt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Template Modal */}
        {showNewModal && (
          <NewTemplateModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
        )}

        {/* AI Generate Modal */}
        {showAIGenerate && (
          <AIGenerateModal
            onClose={() => setShowAIGenerate(false)}
            onGenerate={handleAIGenerate}
            prompt={generationPrompt}
            setPrompt={setGenerationPrompt}
          />
        )}

        {/* Full Screen Template Editor */}
        {editingTemplate && (
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onClose={() => setEditingTemplate(null)}
            onDelete={() => handleDeleteTemplate(editingTemplate.id)}
          />
        )}
      </main>
    </div>
  );
};

/* ========================================================= */
/* Stat Card */
/* ========================================================= */

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: string;
  accentSoft: string;
}

const StatCard = ({ title, value, description, icon: Icon, accent, accentSoft }: StatCardProps) => (
  <div
    className="mf-card rounded-xl p-3 md:p-4 lg:p-5 transition"
    style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
  >
    <div className="flex items-start justify-between">
      <p className="text-[9px] md:text-[10px] lg:text-sm" style={{ color: COLOR.textMuted }}>{title}</p>
      <span className="flex h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 items-center justify-center rounded-lg" style={{ background: accentSoft }}>
        <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: accent }} />
      </span>
    </div>
    <h2 style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="mt-1.5 md:mt-2 lg:mt-3 text-base md:text-xl lg:text-2xl font-semibold tracking-tight">
      {value}
    </h2>
    <p className="mt-0.5 md:mt-1 text-[8px] md:text-[9px] lg:text-xs" style={{ color: COLOR.textMuted }}>{description}</p>
  </div>
);

/* ========================================================= */
/* Filter Chips */
/* ========================================================= */

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="rounded-full px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[10px] lg:text-[11px] font-medium transition"
    style={{
      background: active ? COLOR.primary : COLOR.bg,
      color: active ? COLOR.bg : COLOR.textBody,
      border: `1px solid ${active ? COLOR.primary : COLOR.border}`,
    }}
  >
    {label}
  </button>
);

const FilterChipSmall = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="rounded-full px-1.5 md:px-2 py-0.5 text-[7px] md:text-[8px] lg:text-[10px] font-medium transition"
    style={{
      background: active ? COLOR.primary : COLOR.bg,
      color: active ? COLOR.bg : COLOR.textBody,
      border: `1px solid ${active ? COLOR.primary : COLOR.border}`,
    }}
  >
    {label}
  </button>
);

/* ========================================================= */
/* New Template Modal */
/* ========================================================= */

const NewTemplateModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, subject: string, category: Category) => void;
}) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("Welcome");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(14,16,19,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
        <div className="flex items-center justify-between p-4 md:p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg" style={{ background: COLOR.primarySoft, color: COLOR.primary }}>
              <LayoutTemplate size={14} />
            </span>
            <div>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-sm md:text-base font-semibold">
                New Template
              </h2>
              <p className="text-[10px] md:text-xs" style={{ color: COLOR.textMuted }}>Start from a category-matched boilerplate.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 md:p-2 transition"
            style={{ color: COLOR.textMuted }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 md:space-y-5 p-4 md:p-6">
          <div>
            <label className="mb-1 md:mb-2 block text-[10px] md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Template Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cart Abandonment — Reminder"
              className="mf-input w-full rounded-lg px-2.5 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-sm outline-none transition"
              style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
            />
          </div>

          <div>
            <label className="mb-1 md:mb-2 block text-[10px] md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Subject Line
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. You left something behind"
              className="mf-input w-full rounded-lg px-2.5 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-sm outline-none transition"
              style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
            />
          </div>

          <div>
            <label className="mb-1 md:mb-2 block text-[10px] md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Category
            </label>
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              {categories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="rounded-lg border px-1.5 md:px-3 py-1.5 md:py-2.5 text-left text-[9px] md:text-sm font-medium transition"
                    style={{
                      borderColor: active ? COLOR.primary : COLOR.border,
                      background: active ? COLOR.primarySoft : COLOR.bg,
                      color: active ? COLOR.primary : COLOR.textBody,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-1.5 md:gap-3 p-4 md:p-6" style={{ borderTop: `1px solid ${COLOR.border}` }}>
          <button
            onClick={onClose}
            className="rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-sm font-medium transition hover:opacity-90"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, subject, category)}
            className="rounded-lg px-4 md:px-5 py-1.5 md:py-2.5 text-[10px] md:text-sm font-medium transition hover:opacity-90"
            style={{ background: COLOR.primary, color: COLOR.bg }}
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================= */
/* AI Generate Modal */
/* ========================================================= */

const AIGenerateModal = ({
  onClose,
  onGenerate,
  prompt,
  setPrompt,
}: {
  onClose: () => void;
  onGenerate: () => void;
  prompt: string;
  setPrompt: (value: string) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(14,16,19,0.6)" }}>
    <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      <div className="flex items-center justify-between p-4 md:p-6" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg" style={{ background: COLOR.warningSoft, color: COLOR.warning }}>
            <Sparkles size={14} />
          </span>
          <div>
            <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-sm md:text-base font-semibold">
              AI Template Generator
            </h2>
            <p className="text-[10px] md:text-xs" style={{ color: COLOR.textMuted }}>Describe what you want and AI will generate it</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 md:p-2 transition"
          style={{ color: COLOR.textMuted }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 md:space-y-5 p-4 md:p-6">
        <div>
          <label className="mb-1.5 md:mb-2 block text-xs md:text-sm font-medium" style={{ color: COLOR.textBody }}>
            What kind of email do you want?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A welcome email for new users with a 20% discount code..."
            rows={4}
            className="mf-input w-full rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm outline-none transition resize-none"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          />
          <p className="mt-1.5 text-[9px] md:text-xs" style={{ color: COLOR.textMuted }}>
            <AlertCircle size={12} className="inline mr-1" />
            Be specific about the tone, purpose, and key messages.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-[9px] md:text-xs font-medium" style={{ color: COLOR.textMuted }}>Quick prompts:</span>
          <button
            onClick={() => setPrompt("A friendly welcome email for new users with a 20% discount")}
            className="rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[10px] transition hover:opacity-80"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          >
            Welcome
          </button>
          <button
            onClick={() => setPrompt("A promotional email announcing a flash sale with urgency")}
            className="rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[10px] transition hover:opacity-80"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          >
            Promotion
          </button>
          <button
            onClick={() => setPrompt("A monthly newsletter with product updates and industry news")}
            className="rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[10px] transition hover:opacity-80"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          >
            Newsletter
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 p-4 md:p-6" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <button
          onClick={onClose}
          className="rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90"
          style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
        >
          Cancel
        </button>
        <button
          onClick={onGenerate}
          disabled={!prompt.trim()}
          className="flex items-center gap-1.5 md:gap-2 rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90"
          style={{
            background: prompt.trim() ? COLOR.warning : COLOR.border,
            color: prompt.trim() ? COLOR.bg : COLOR.textMuted,
            cursor: prompt.trim() ? "pointer" : "not-allowed",
          }}
        >
          <Wand2 size={14} />
          Generate Template 
        </button>
      </div>
    </div>
  </div>
);

export default EmailTemplatesAdmin;