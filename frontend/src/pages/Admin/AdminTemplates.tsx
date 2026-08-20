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

const starterHtml = (category: Category) => {
  const base = (body: string) => `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
${body}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const rows: Record<Category, string> = {
    Welcome: `            <tr>
              <td style="padding:40px 32px 24px;text-align:center;">
                <h1 style="margin:0;font-size:22px;color:#0f172a;">Welcome, {{first_name}} 👋</h1>
                <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                  We're glad you're here. Let's get {{company}} set up in the next few minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px;text-align:center;">
                <a href="#" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Get Started</a>
              </td>
            </tr>`,
    Promotional: `            <tr>
              <td style="padding:40px 32px 16px;text-align:center;">
                <p style="margin:0;font-size:12px;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Limited time</p>
                <h1 style="margin:8px 0 0;font-size:24px;color:#0f172a;">30% off {{product_name}}</h1>
                <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                  Hi {{first_name}}, this offer ends soon — don't miss out.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px;text-align:center;">
                <a href="#" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Shop the Sale</a>
              </td>
            </tr>`,
    Newsletter: `            <tr>
              <td style="padding:40px 32px 8px;">
                <h1 style="margin:0;font-size:20px;color:#0f172a;">This month at {{company}}</h1>
                <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                  Hi {{first_name}}, here's what's new since we last wrote.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 40px;">
                <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">
                  • Feature update one<br/>
                  • Feature update two<br/>
                  • A small note from the team
                </p>
              </td>
            </tr>`,
    Transactional: `            <tr>
              <td style="padding:40px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;color:#0f172a;">Order confirmed</h1>
                <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                  Thanks {{first_name}}, your order from {{company}} is on its way.
                </p>
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

const EmailTemplatesAdmin = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<number | null>(initialTemplates[0]?.id ?? null);
  const [draft, setDraft] = useState<Template | null>(
    initialTemplates.length ? { ...initialTemplates[0] } : null
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showNewModal, setShowNewModal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const saved = templates.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(saved ? { ...saved } : null);
  }, [selectedId]);

  const isDirty = !!(saved && draft && JSON.stringify(saved) !== JSON.stringify(draft));

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const updateDraft = (patch: Partial<Template>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const insertVariable = (variable: string) => {
    if (!draft) return;
    const el = textareaRef.current;
    if (!el) {
      updateDraft({ html: draft.html + variable });
      return;
    }
    const start = el.selectionStart ?? draft.html.length;
    const end = el.selectionEnd ?? draft.html.length;
    const newHtml = draft.html.slice(0, start) + variable + draft.html.slice(end);
    updateDraft({ html: newHtml });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = () => {
    if (!draft || !isDirty) return;
    const withTimestamp = { ...draft, updatedAt: "Just now" };
    setTemplates((prev) => prev.map((t) => (t.id === draft.id ? withTimestamp : t)));
    setDraft(withTimestamp);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleDiscard = () => {
    if (saved) setDraft({ ...saved });
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
  }, [draft, isDirty]);

  const handleDuplicate = () => {
    if (!draft) return;
    const newId = nextId(templates);
    const copy: Template = {
      ...draft,
      id: newId,
      name: `${draft.name} (Copy)`,
      status: "Draft",
      updatedAt: "Just now",
    };
    setTemplates((prev) => [copy, ...prev]);
    setSelectedId(newId);
  };

  const handleDelete = () => {
    if (selectedId === null) return;
    const remaining = templates.filter((t) => t.id !== selectedId);
    setTemplates(remaining);
    setSelectedId(remaining.length > 0 ? remaining[0].id : null);
  };

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
    setSelectedId(newId);
    setShowNewModal(false);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: ${COLOR.border}; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: ${COLOR.borderHover}; }

        .template-list::-webkit-scrollbar { width: 4px; }
        .template-list::-webkit-scrollbar-track { background: transparent; }
        .template-list::-webkit-scrollbar-thumb { background: ${COLOR.border}; border-radius: 3px; }
        .template-list::-webkit-scrollbar-thumb:hover { background: ${COLOR.borderHover}; }

        .mf-card { transition: border-color 0.15s ease; }
        .mf-card:hover { border-color: ${COLOR.borderHover}; }
        .mf-row-btn { transition: background-color 0.12s ease; }
        .mf-row-btn:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-icon-btn { transition: background-color 0.12s ease, color 0.12s ease; }
        .mf-icon-btn:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-input::placeholder { color: ${COLOR.textMuted}; }
        .mf-input:focus, .mf-title-input:focus, .mf-select:focus {
          border-color: ${COLOR.primary} !important;
          box-shadow: 0 0 0 3px ${COLOR.primarySoft};
        }
        .mf-var-pill:hover { border-color: ${COLOR.primary}; color: ${COLOR.primary}; }
      `}</style>

      {/* Sidebar - sticky */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 h-screen" style={{ background: COLOR.bg }}>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              style={{ fontFamily: FONT.mono, color: COLOR.textMuted }}
              className="text-[11px] font-medium uppercase tracking-wider"
            >
              Content
            </p>
            <h1
              style={{ fontFamily: FONT.display, color: COLOR.dark, letterSpacing: "-0.01em" }}
              className="mt-1 text-xl md:text-2xl font-semibold"
            >
              Email Templates
            </h1>
            <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
              Build and manage the HTML templates used across your campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90 w-full sm:w-auto"
            style={{ background: COLOR.primary, color: COLOR.bg }}
          >
            <Plus size={15} />
            New Template
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Editor layout */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[280px_1fr]">
          {/* Template list */}
          <div className="mf-card overflow-hidden rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div className="p-3 md:p-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: COLOR.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mf-input w-full rounded-lg py-2 pl-8 pr-3 text-xs md:text-sm outline-none transition"
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
            </div>

            <div className="template-list max-h-[400px] md:max-h-[560px] overflow-y-auto">
              {filtered.map((t) => {
                const isSelected = t.id === selectedId;
                const showsDirty = isSelected && isDirty;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="mf-row-btn relative block w-full px-3 md:px-4 py-3 md:py-3.5 text-left transition"
                    style={{
                      background: isSelected ? COLOR.primarySoft : "transparent",
                      borderBottom: `1px solid ${COLOR.border}`,
                    }}
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-[3px] rounded-r-full transition-opacity"
                      style={{ background: COLOR.primary, opacity: isSelected ? 1 : 0 }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="truncate text-xs md:text-sm font-medium"
                        style={{ color: isSelected ? COLOR.primary : COLOR.dark }}
                      >
                        {t.name}
                        {showsDirty && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: COLOR.warning }} />}
                      </p>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: t.status === "Published" ? COLOR.success : COLOR.warning }}
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] md:text-xs" style={{ color: COLOR.textMuted }}>
                      {t.subject}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                      <span
                        style={{ fontFamily: FONT.mono, background: COLOR.bg, color: COLOR.textBody, border: `1px solid ${COLOR.border}` }}
                        className="rounded-md px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium"
                      >
                        {t.category}
                      </span>
                      <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[9px] md:text-[10px]">
                        {t.updatedAt}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-6 md:p-8 text-center text-xs md:text-sm" style={{ color: COLOR.textMuted }}>
                  No templates found.
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          {draft ? (
            <div className="mf-card overflow-hidden rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              {/* Editor header */}
              <div className="flex flex-col gap-3 md:gap-4 p-4 md:p-5" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="mf-title-input w-full rounded-lg border border-transparent px-2 py-1 text-base md:text-lg font-semibold outline-none transition sm:w-auto sm:flex-1"
                    style={{ fontFamily: FONT.display, color: COLOR.dark }}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={draft.category}
                      onChange={(e) => updateDraft({ category: e.target.value as Category })}
                      className="mf-select rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium outline-none transition"
                      style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>

                    <button
                      onClick={() =>
                        updateDraft({ status: draft.status === "Published" ? "Draft" : "Published" })
                      }
                      className="rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition hover:opacity-90"
                      style={{
                        background: draft.status === "Published" ? COLOR.successSoft : COLOR.warningSoft,
                        color: draft.status === "Published" ? COLOR.success : COLOR.warning,
                      }}
                    >
                      {draft.status}
                    </button>
                  </div>
                </div>

                <input
                  value={draft.subject}
                  onChange={(e) => updateDraft({ subject: e.target.value })}
                  placeholder="Subject line"
                  className="mf-input w-full rounded-lg px-3 py-2 text-xs md:text-sm outline-none transition"
                  style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                />

                <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span
                      className="mr-1 flex items-center gap-1 text-[10px] md:text-[11px] font-medium"
                      style={{ color: COLOR.textMuted }}
                    >
                      <Braces size={12} /> Insert:
                    </span>
                    {variables.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="mf-var-pill rounded-md px-1.5 md:px-2 py-0.5 md:py-1 text-[9px] md:text-[11px] transition"
                        style={{ fontFamily: FONT.mono, background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 w-full md:w-auto">
                    {isDirty && (
                      <button
                        onClick={handleDiscard}
                        className="mf-icon-btn flex items-center gap-1 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition"
                        style={{ color: COLOR.textMuted }}
                      >
                        <Undo2 size={12} /> Discard
                      </button>
                    )}
                    <button
                      onClick={handleDuplicate}
                      className="flex items-center gap-1 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition hover:opacity-90"
                      style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition hover:opacity-90"
                      style={{ background: COLOR.dangerSoft, border: `1px solid transparent`, color: COLOR.danger }}
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isDirty}
                      className="flex items-center gap-1 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-medium transition"
                      style={{
                        background: isDirty ? COLOR.primary : COLOR.border,
                        color: isDirty ? COLOR.bg : COLOR.textMuted,
                        cursor: isDirty ? "pointer" : "not-allowed",
                      }}
                    >
                      {savedFlash ? <Check size={12} /> : <Save size={12} />}
                      {savedFlash ? "Saved" : isDirty ? "Save" : "Saved"}
                      {isDirty && !savedFlash && (
                        <span
                          style={{ fontFamily: FONT.mono, color: COLOR.bg, opacity: 0.7 }}
                          className="ml-0.5 hidden text-[9px] sm:inline"
                        >
                          ⌘S
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code + Preview split */}
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Code */}
                <div style={{ borderBottom: `1px solid ${COLOR.border}` }} className="lg:border-b-0" >
                  <div
                    className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5"
                    style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}`, borderRight: `1px solid ${COLOR.border}` }}
                  >
                    <Code2 size={13} style={{ color: COLOR.textMuted }} />
                    <span style={{ color: COLOR.textMuted }} className="text-[10px] md:text-xs font-medium">HTML</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={draft.html}
                    onChange={(e) => updateDraft({ html: e.target.value })}
                    spellCheck={false}
                    className="h-[300px] md:h-[480px] w-full resize-none p-3 md:p-4 text-[11px] md:text-[12.5px] leading-relaxed outline-none"
                    style={{ fontFamily: FONT.mono, background: COLOR.bg, color: COLOR.textBody, borderRight: `1px solid ${COLOR.border}` }}
                  />
                </div>

                {/* Preview */}
                <div>
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 py-2 md:py-2.5"
                    style={{ background: COLOR.bg, borderBottom: `1px solid ${COLOR.border}` }}
                  >
                    <div className="flex items-center gap-2">
                      <Eye size={13} style={{ color: COLOR.textMuted }} />
                      <span style={{ color: COLOR.textMuted }} className="text-[10px] md:text-xs font-medium">Preview</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
                      <button
                        onClick={() => setDevice("desktop")}
                        className="rounded-md p-1.5 transition"
                        style={{
                          background: device === "desktop" ? COLOR.primary : "transparent",
                          color: device === "desktop" ? COLOR.bg : COLOR.textMuted,
                        }}
                      >
                        <Monitor size={13} />
                      </button>
                      <button
                        onClick={() => setDevice("mobile")}
                        className="rounded-md p-1.5 transition"
                        style={{
                          background: device === "mobile" ? COLOR.primary : "transparent",
                          color: device === "mobile" ? COLOR.bg : COLOR.textMuted,
                        }}
                      >
                        <Smartphone size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex h-[300px] md:h-[480px] items-start justify-center overflow-auto p-3 md:p-4" style={{ background: COLOR.bg }}>
                    <iframe
                      title="Template preview"
                      srcDoc={draft.html}
                      sandbox=""
                      className={`h-full rounded-lg bg-white shadow-lg transition-all ${
                        device === "mobile" ? "w-[320px] md:w-[375px]" : "w-full"
                      }`}
                      style={{ border: `1px solid ${COLOR.border}` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 md:p-16 text-center"
              style={{ background: COLOR.surface, borderColor: COLOR.border }}
            >
              <span className="mb-3 flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full" style={{ background: COLOR.primarySoft }}>
                <Inbox size={16} style={{ color: COLOR.primary }} />
              </span>
              <h3 className="text-xs md:text-sm font-medium" style={{ color: COLOR.dark }}>No templates yet</h3>
              <p className="mt-1 text-xs md:text-sm" style={{ color: COLOR.textMuted }}>Create your first template to get started.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90"
                style={{ background: COLOR.primary, color: COLOR.bg }}
              >
                <Plus size={15} /> New Template
              </button>
            </div>
          )}
        </div>

        {showNewModal && (
          <NewTemplateModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
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
    className="mf-card rounded-xl p-4 md:p-5 transition"
    style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
  >
    <div className="flex items-start justify-between">
      <p className="text-[10px] md:text-sm" style={{ color: COLOR.textMuted }}>{title}</p>
      <span className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg" style={{ background: accentSoft }}>
        <Icon size={13} style={{ color: accent }} />
      </span>
    </div>
    <h2 style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="mt-2 md:mt-3 text-xl md:text-2xl font-semibold tracking-tight">
      {value}
    </h2>
    <p className="mt-1 text-[9px] md:text-xs" style={{ color: COLOR.textMuted }}>{description}</p>
  </div>
);

/* ========================================================= */
/* Filter Chip */
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
    className="rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-[11px] font-medium transition"
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
            className="mf-icon-btn rounded-lg p-1.5 md:p-2 transition"
            style={{ color: COLOR.textMuted }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4 md:space-y-5 p-4 md:p-6">
          <div>
            <label className="mb-1.5 md:mb-2 block text-xs md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Template Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cart Abandonment — Reminder"
              className="mf-input w-full rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm outline-none transition"
              style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
            />
          </div>

          <div>
            <label className="mb-1.5 md:mb-2 block text-xs md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Subject Line
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. You left something behind"
              className="mf-input w-full rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm outline-none transition"
              style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
            />
          </div>

          <div>
            <label className="mb-1.5 md:mb-2 block text-xs md:text-sm font-medium" style={{ color: COLOR.textBody }}>
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="rounded-lg border px-2 md:px-3 py-2 md:py-2.5 text-left text-[10px] md:text-sm font-medium transition"
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

        <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 p-4 md:p-6" style={{ borderTop: `1px solid ${COLOR.border}` }}>
          <button
            onClick={onClose}
            className="rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90"
            style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, subject, category)}
            className="rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:opacity-90"
            style={{ background: COLOR.primary, color: COLOR.bg }}
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesAdmin;