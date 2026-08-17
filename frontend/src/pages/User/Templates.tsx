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

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type Category = "Newsletter" | "Promotional" | "Transactional" | "Welcome" | "Announcement";

interface Template {
  name: string;
  category: Category;
  updatedOn: string;
  usedCount: number;
  blocks: number;
  hasButton: boolean;
}

const CATEGORY_STYLE: Record<Category, { accent: string; soft: string }> = {
  Newsletter: { accent: "#FF6A39", soft: "rgba(255,106,57,0.12)" },
  Promotional: { accent: "#FBBF24", soft: "rgba(251,191,36,0.12)" },
  Transactional: { accent: "#34D399", soft: "rgba(52,211,153,0.12)" },
  Welcome: { accent: "#A78BFA", soft: "rgba(167,139,250,0.12)" },
  Announcement: { accent: "#F87171", soft: "rgba(248,113,113,0.12)" },
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
  { title: "Total templates", value: templates.length.toString(), icon: LayoutTemplate },
  {
    title: "Most reused",
    value: templates.reduce((a, b) => (b.usedCount > a.usedCount ? b : a)).name,
    icon: Sparkles,
  },
  {
    title: "Total sends from templates",
    value: templates.reduce((sum, t) => sum + t.usedCount, 0).toLocaleString(),
    icon: Copy,
  },
];

const Templates = () => {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = templates.filter((t) => {
    const matchesCategory = category === "All" || t.category === category;
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .mf-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .mf-card:hover .mf-card-actions { opacity: 1; }
        .mf-card-actions { opacity: 0; transition: opacity 0.15s ease; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
              className="text-3xl font-bold text-[#E8E6E1]"
            >
              HTML templates
            </h1>
            <p className="mt-1 text-sm text-[#9BA0A8]">
              Reusable layouts for your campaigns and automations.
            </p>
          </div>

          <button
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "#FF6A39", boxShadow: "0 4px 12px rgba(255,106,57,0.25)" }}
          >
            <Plus size={16} />
            Create template
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isEmber = stat.title === "Most reused";
            return (
              <div
                key={stat.title}
                className="rounded-xl p-5"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: isEmber ? "rgba(255,106,57,0.12)" : "rgba(255,255,255,0.05)" }}
                >
                  <Icon size={16} style={{ color: isEmber ? "#FF6A39" : "#9BA0A8" }} />
                </div>
                <h2
                  style={{ fontFamily: FONT.mono }}
                  className="mt-4 truncate text-xl font-semibold tracking-tight text-[#E8E6E1]"
                >
                  {stat.value}
                </h2>
                <p className="mt-1 text-sm text-[#9BA0A8]">
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
            style={{ border: "1px solid #2A2E37", background: "#12151B" }}
          >
            <Search size={14} className="text-[#6B727C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
              style={{ width: 200 }}
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-1 rounded-xl p-1"
            style={{ background: "#12151B", border: "1px solid #2A2E37" }}
          >
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: active ? "#FF6A39" : "transparent",
                    color: active ? "#FFFFFF" : "#C7C9CE",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#1B1E24";
                      e.currentTarget.style.color = "#E8E6E1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#C7C9CE";
                    }
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
                className="mf-card rounded-xl p-4"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                {/* Mini email preview */}
                <div
                  className="relative flex flex-col gap-2 rounded-lg p-4"
                  style={{ background: "#0B0E12", height: 168 }}
                >
                  <div
                    className="mf-card-actions absolute right-2 top-2 flex items-center gap-1 rounded-lg p-1"
                    style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                  >
                    <button 
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil size={12} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                    </button>
                    <button 
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Duplicate ${t.name}`}
                    >
                      <Copy size={12} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                    </button>
                    <button 
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 size={12} style={{ color: "#F87171" }} />
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
                        background: "#12151B",
                        border: "1px solid #2A2E37",
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
                    <p className="font-medium text-[#E8E6E1]">
                      {t.name}
                    </p>
                    <p style={{ fontFamily: FONT.mono }} className="mt-0.5 text-xs text-[#6B727C]">
                      Updated {t.updatedOn}
                    </p>
                  </div>
                  <button 
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#1B1E24]"
                    aria-label={`More actions for ${t.name}`}
                  >
                    <MoreHorizontal size={15} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: style.soft, color: style.accent }}
                  >
                    {t.category}
                  </span>
                  <span style={{ fontFamily: FONT.mono }} className="text-xs text-[#6B727C]">
                    Used {t.usedCount}×
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              className="col-span-full rounded-xl p-12 text-center"
              style={{ border: "1px solid #2A2E37", background: "#12151B", color: "#6B727C" }}
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