import { useEffect, useRef, useState } from "react";
import Sidebar from "../User/Sidebar";
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
} from "lucide-react";

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

  // Load a fresh working copy whenever the selection changes.
  useEffect(() => {
    setDraft(saved ? { ...saved } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Cmd/Ctrl+S saves the current draft instead of triggering the browser's save dialog.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Content</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Email Templates
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Build and manage the HTML templates used across your campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={15} />
            New Template
          </button>
        </div>

        {/* Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Templates"
            value={String(templates.length)}
            description="Across all categories"
            icon={LayoutTemplate}
            accent="text-slate-900 bg-slate-100"
          />
          <StatCard
            title="Published"
            value={String(templates.filter((t) => t.status === "Published").length)}
            description="Live and in use"
            icon={CheckCircle2}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Drafts"
            value={String(templates.filter((t) => t.status === "Draft").length)}
            description="Not yet published"
            icon={Clock}
            accent="text-amber-600 bg-amber-50"
          />
          <StatCard
            title="Categories"
            value={String(categories.length)}
            description="Welcome, Promo, News, Txn"
            icon={FileCode}
            accent="text-violet-600 bg-violet-50"
          />
        </div>

        {/* Editor layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Template list */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  label="All"
                  active={categoryFilter === "All"}
                  onClick={() => setCategoryFilter("All")}
                />
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

            <div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
              {filtered.map((t) => {
                const isSelected = t.id === selectedId;
                const showsDirty = isSelected && isDirty;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`block w-full px-4 py-3.5 text-left transition ${
                      isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {t.name}
                        {showsDirty && <span className="ml-1 text-slate-400">•</span>}
                      </p>
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          t.status === "Published" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{t.subject}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.updatedAt}</span>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No templates found.</div>
              )}
            </div>
          </div>

          {/* Editor */}
          {draft ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Editor header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="w-full rounded-lg border border-transparent px-2 py-1 text-lg font-semibold text-slate-900 outline-none transition hover:border-slate-200 focus:border-slate-300 focus:bg-slate-50 sm:w-auto sm:flex-1"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={draft.category}
                      onChange={(e) => updateDraft({ category: e.target.value as Category })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>

                    <button
                      onClick={() =>
                        updateDraft({ status: draft.status === "Published" ? "Draft" : "Published" })
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        draft.status === "Published"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {draft.status}
                    </button>
                  </div>
                </div>

                <input
                  value={draft.subject}
                  onChange={(e) => updateDraft({ subject: e.target.value })}
                  placeholder="Subject line"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400 focus:bg-white"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Braces size={12} /> Insert:
                    </span>
                    {variables.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {isDirty && (
                      <button
                        onClick={handleDiscard}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                      >
                        <Undo2 size={13} /> Discard
                      </button>
                    )}
                    <button
                      onClick={handleDuplicate}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Copy size={13} /> Duplicate
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isDirty}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition ${
                        isDirty ? "bg-slate-900 hover:bg-slate-800" : "cursor-not-allowed bg-slate-300"
                      }`}
                    >
                      <Save size={13} /> {savedFlash ? "Saved" : isDirty ? "Save" : "Saved"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code + Preview split */}
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Code */}
                <div className="border-b border-slate-100 lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <Code2 size={13} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">HTML</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={draft.html}
                    onChange={(e) => updateDraft({ html: e.target.value })}
                    spellCheck={false}
                    className="h-[480px] w-full resize-none bg-slate-900 p-4 font-mono text-[12.5px] leading-relaxed text-slate-100 outline-none"
                  />
                </div>

                {/* Preview */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Eye size={13} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">Preview</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                      <button
                        onClick={() => setDevice("desktop")}
                        className={`rounded-md p-1.5 transition ${
                          device === "desktop"
                            ? "bg-slate-900 text-white"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Monitor size={13} />
                      </button>
                      <button
                        onClick={() => setDevice("mobile")}
                        className={`rounded-md p-1.5 transition ${
                          device === "mobile"
                            ? "bg-slate-900 text-white"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Smartphone size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex h-[480px] items-start justify-center overflow-auto bg-slate-100 p-4">
                    <iframe
                      title="Template preview"
                      srcDoc={draft.html}
                      sandbox=""
                      className={`h-full rounded-lg border border-slate-200 bg-white shadow-sm transition-all ${
                        device === "mobile" ? "w-[375px]" : "w-full"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <Inbox size={18} className="text-slate-400" />
              </span>
              <h3 className="text-sm font-medium text-slate-900">No templates yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create your first template to get started.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

const StatCard = ({ title, value, description, icon: Icon, accent }: StatCardProps) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between">
      <p className="text-sm text-slate-500">{title}</p>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={16} />
      </span>
    </div>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</h2>
    <p className="mt-1.5 text-xs text-slate-400">{description}</p>
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
    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <LayoutTemplate size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">New Template</h2>
              <p className="text-xs text-slate-500">Start from a category-matched boilerplate.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Template Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cart Abandonment — Reminder"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Subject Line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. You left something behind"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                    category === c
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, subject, category)}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesAdmin;