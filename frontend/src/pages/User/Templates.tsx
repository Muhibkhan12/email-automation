import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Plus,
  Search,
  LayoutTemplate,
  Sparkles,
  Copy,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (matches Analytics.tsx / Campaign.tsx) */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#2F6FED",
  primarySoft: "#EAF0FE",
  success: "#1FA971",
  successSoft: "#E6F7EF",
  warning: "#E8A23D",
  warningSoft: "#FDF3E4",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  dark: "#11141B",
  bg: "#F4F5F8",
  border: "#E7E8EC",
  textMuted: "#8A8F9C",
  textBody: "#4B4F5A",
};

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type Category = "Newsletter" | "Promotional" | "Transactional" | "Welcome" | "Announcement";

interface Template {
  name: string;
  category: Category;
  updatedOn: string;
  usedCount: number;
  blocks: number; // number of skeleton content blocks to render in the preview
  hasButton: boolean;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const CATEGORY_STYLE: Record<Category, { accent: string; soft: string }> = {
  Newsletter: { accent: COLOR.primary, soft: COLOR.primarySoft },
  Promotional: { accent: COLOR.warning, soft: COLOR.warningSoft },
  Transactional: { accent: COLOR.success, soft: COLOR.successSoft },
  Welcome: { accent: "#7C5CFC", soft: "#F0ECFE" },
  Announcement: { accent: COLOR.danger, soft: COLOR.dangerSoft },
};

const templates: Template[] = [
  { name: "Monthly Digest", category: "Newsletter", updatedOn: "Aug 9, 2026", usedCount: 12, blocks: 3, hasButton: false },
  { name: "Flash Sale 48h", category: "Promotional", updatedOn: "Aug 11, 2026", usedCount: 27, blocks: 2, hasButton: true },
  { name: "Order Confirmation", category: "Transactional", updatedOn: "Aug 5, 2026", usedCount: 340, blocks: 4, hasButton: true },
  { name: "New Member Welcome", category: "Welcome", updatedOn: "Jul 28, 2026", usedCount: 58, blocks: 3, hasButton: true },
  { name: "Product Launch", category: "Announcement", updatedOn: "Aug 10, 2026", usedCount: 9, blocks: 2, hasButton: true },
  { name: "Password Reset", category: "Transactional", updatedOn: "Jul 30, 2026", usedCount: 210, blocks: 2, hasButton: true },
  { name: "Weekly Roundup", category: "Newsletter", updatedOn: "Aug 4, 2026", usedCount: 15, blocks: 4, hasButton: false },
  { name: "Feature Announcement", category: "Announcement", updatedOn: "Aug 2, 2026", usedCount: 6, blocks: 3, hasButton: true },
];

const CATEGORIES: Array<Category | "All"> = ["All", "Newsletter", "Promotional", "Transactional", "Welcome", "Announcement"];

const stats = [
  { title: "Total templates", value: templates.length.toString(), icon: LayoutTemplate, accent: COLOR.dark, soft: COLOR.bg },
  {
    title: "Most reused",
    value: templates.reduce((a, b) => (b.usedCount > a.usedCount ? b : a)).name,
    icon: Sparkles,
    accent: COLOR.primary,
    soft: COLOR.primarySoft,
  },
  {
    title: "Total sends from templates",
    value: templates.reduce((sum, t) => sum + t.usedCount, 0).toLocaleString(),
    icon: Copy,
    accent: COLOR.success,
    soft: COLOR.successSoft,
  },
];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Templates = () => {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = templates.filter((t) => {
    const matchesCategory = category === "All" || t.category === category;
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-btn:focus-visible,
        .mf-input:focus-visible,
        .mf-chip:focus-visible,
        .mf-icon-btn:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .mf-card:hover { transform: translateY(-2px); }
        .mf-card:hover .mf-card-actions { opacity: 1; }
        .mf-card-actions { opacity: 0; transition: opacity 0.15s ease; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
              className="text-3xl font-bold"
            >
              HTML templates
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Reusable layouts for your campaigns and automations.
            </p>
          </div>

          <button
            className="mf-btn flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: COLOR.primary }}
          >
            <Plus size={16} />
            Create template
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-white p-5"
                style={{ border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: stat.soft }}>
                  <Icon size={16} style={{ color: stat.accent }} />
                </div>
                <h2
                  style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                  className="mt-4 truncate text-xl font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mt-1 text-sm" style={{ color: COLOR.textBody }}>
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ border: `1px solid ${COLOR.border}`, background: "#FFFFFF" }}
          >
            <Search size={14} style={{ color: COLOR.textMuted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="mf-input bg-transparent text-sm outline-none"
              style={{ color: COLOR.textBody, width: 200 }}
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-1 rounded-xl p-1"
            style={{ background: "#FFFFFF", border: `1px solid ${COLOR.border}` }}
          >
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="mf-chip rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: active ? COLOR.primary : "transparent",
                    color: active ? "#FFFFFF" : COLOR.textBody,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const style = CATEGORY_STYLE[t.category];
            return (
              <div
                key={t.name}
                className="mf-card rounded-xl bg-white p-4"
                style={{ border: `1px solid ${COLOR.border}` }}
              >
                {/* Mini email preview */}
                <div
                  className="relative flex flex-col gap-2 rounded-lg p-4"
                  style={{ background: COLOR.bg, height: 168 }}
                >
                  <div
                    className="mf-card-actions absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white p-1"
                    style={{ border: `1px solid ${COLOR.border}` }}
                  >
                    <button className="mf-icon-btn flex h-6 w-6 items-center justify-center rounded" aria-label={`Edit ${t.name}`}>
                      <Pencil size={12} style={{ color: COLOR.textMuted }} />
                    </button>
                    <button className="mf-icon-btn flex h-6 w-6 items-center justify-center rounded" aria-label={`Duplicate ${t.name}`}>
                      <Copy size={12} style={{ color: COLOR.textMuted }} />
                    </button>
                    <button className="mf-icon-btn flex h-6 w-6 items-center justify-center rounded" aria-label={`Delete ${t.name}`}>
                      <Trash2 size={12} style={{ color: COLOR.danger }} />
                    </button>
                  </div>

                  <div
                    className="h-3 w-2/5 rounded"
                    style={{ background: style.accent, opacity: 0.9 }}
                  />
                  <div className="h-16 w-full rounded" style={{ background: style.soft }} />
                  {Array.from({ length: t.blocks }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full"
                      style={{
                        background: "#FFFFFF",
                        border: `1px solid ${COLOR.border}`,
                        width: i === t.blocks - 1 ? "60%" : "90%",
                      }}
                    />
                  ))}
                  {t.hasButton && (
                    <div
                      className="mt-auto h-5 w-20 rounded"
                      style={{ background: style.accent }}
                    />
                  )}
                </div>

                {/* Meta */}
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" style={{ color: COLOR.dark }}>
                      {t.name}
                    </p>
                    <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="mt-0.5 text-xs">
                      Updated {t.updatedOn}
                    </p>
                  </div>
                  <button className="mf-icon-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100" aria-label={`More actions for ${t.name}`}>
                    <MoreHorizontal size={15} style={{ color: COLOR.textMuted }} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: style.soft, color: style.accent }}
                  >
                    {t.category}
                  </span>
                  <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs">
                    Used {t.usedCount}×
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              className="col-span-full rounded-xl bg-white p-12 text-center"
              style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textMuted }}
            >
              No templates match this search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Templates;