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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .mf-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .mf-card:hover .mf-card-actions { opacity: 1; }
        .mf-card-actions { opacity: 0; transition: opacity 0.15s ease; }

        /* Custom scrollbar for the main content */
        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .mf-template-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .mf-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .mf-create-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .mf-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mf-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mf-search-container {
            width: 100% !important;
          }
          .mf-search-input {
            width: 100% !important;
          }
          .mf-categories-container {
            width: 100% !important;
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
          }
          .mf-category-btn {
            font-size: 0.7rem !important;
            padding: 0.4rem 0.6rem !important;
          }
          .mf-template-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-preview-card {
            height: 140px !important;
          }
          .mf-stat-card {
            padding: 0.75rem !important;
          }
          .mf-stat-value {
            font-size: 1.1rem !important;
          }
          .mf-stat-title {
            font-size: 0.7rem !important;
          }
          .mf-template-name {
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 640px) {
          .mf-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-main-content {
            padding: 0.75rem !important;
          }
          .mf-preview-card {
            height: 120px !important;
          }
          .mf-preview-blocks {
            gap: 0.25rem !important;
          }
          .mf-preview-block {
            height: 0.5rem !important;
          }
          .mf-preview-title {
            height: 0.6rem !important;
          }
          .mf-preview-body {
            height: 3rem !important;
          }
          .mf-meta-text {
            font-size: 0.6rem !important;
          }
          .mf-category-tag {
            font-size: 0.6rem !important;
            padding: 0.15rem 0.4rem !important;
          }
          .mf-used-count {
            font-size: 0.6rem !important;
          }
          .mf-card-actions {
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* Sidebar - sticky on all screen sizes */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-6 lg:p-8" style={{ background: "#12151B", height: "100vh" }}>
        {/* Header */}
        <div className="mf-header mb-5 md:mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
              className="text-2xl md:text-3xl font-bold" 
            >
              HTML templates
            </h1>
            <p className="mt-1 text-xs md:text-sm" style={{ color: "#9BA0A8" }}>
              Reusable layouts for your campaigns and automations.
            </p>
          </div>

          <button
            className="mf-create-btn flex items-center justify-center gap-1.5 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "#FF6A39", boxShadow: "0 4px 12px rgba(255,106,57,0.25)" }}
          >
            <Plus size={16} />
            Create template
          </button>
        </div>

        {/* Stats */}
        <div className="mf-stats-grid mb-4 md:mb-6 grid grid-cols-1 gap-3 md:gap-5 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isEmber = stat.title === "Most reused";
            return (
              <div
                key={stat.title}
                className="mf-stat-card rounded-xl p-3 md:p-5"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                <div 
                  className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-lg"
                  style={{ background: isEmber ? "rgba(255,106,57,0.12)" : "rgba(255,255,255,0.05)" }}
                >
                  <Icon size={14} style={{ color: isEmber ? "#FF6A39" : "#9BA0A8" }} />
                </div>
                <h2

                  style={{ fontFamily: FONT.mono, color: "#E8E6E1", fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}
                  className="mf-stat-value mt-2 md:mt-4 truncate font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mf-stat-title mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#9BA0A8" }}>
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mf-toolbar mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
          <div
            className="mf-search-container flex items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex-1"
            style={{ border: "1px solid #2A2E37", background: "#12151B" }}
          >
            <Search size={14} className="text-[#6B727C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="mf-search-input bg-transparent text-xs md:text-sm outline-none" 
              style={{ color: "#E8E6E1", width: "100%" }}
            />
          </div>

          <div
            className="mf-categories-container flex flex-wrap items-center gap-1 rounded-xl p-1"
            style={{ background: "#12151B", border: "1px solid #2A2E37" }}
          >
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="mf-category-btn rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap"
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
        <div className="mf-template-grid grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const style = CATEGORY_STYLE[t.category];
            return (
              <div
                key={t.name}
                className="mf-card rounded-xl p-3 md:p-4"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                {/* Mini email preview */}
                <div
                  className="mf-preview-card relative flex flex-col gap-1.5 md:gap-2 rounded-lg p-3 md:p-4"
                  style={{ background: "#0B0E12", height: "clamp(120px, 20vw, 168px)" }}
                >
                  <div
                    className="mf-card-actions absolute right-1.5 md:right-2 top-1.5 md:top-2 flex items-center gap-0.5 md:gap-1 rounded-lg p-0.5 md:p-1"
                    style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                  >
                    <button 
                      className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil size={10} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                    </button>
                    <button 
                      className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Duplicate ${t.name}`}
                    >
                      <Copy size={10} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                    </button>
                    <button 
                      className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded transition-colors hover:bg-[#1B1E24]"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 size={10} style={{ color: "#F87171" }} />
                    </button>
                  </div>

                  <div
                    className="mf-preview-title h-2 md:h-3 rounded"
                    style={{ background: style.accent, opacity: 0.9, width: "40%" }}
                  />
                  <div className="mf-preview-body h-12 md:h-16 w-full rounded" style={{ background: style.soft }} />
                  <div className="mf-preview-blocks flex flex-col gap-1 md:gap-1.5">
                    {Array.from({ length: Math.min(t.blocks, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="mf-preview-block h-1 md:h-1.5 rounded-full"
                        style={{
                          background: "#12151B",
                          border: "1px solid #2A2E37",
                          width: i === Math.min(t.blocks, 3) - 1 ? "60%" : "90%",
                        }}
                      />
                    ))}
                  </div>
                  {t.hasButton && (
                    <div
                      className="mt-auto h-4 md:h-5 rounded"
                      style={{ background: style.accent, width: "clamp(50px, 10vw, 80px)" }}
                    />
                  )}
                </div>

                {/* Meta */}
                <div className="mt-3 md:mt-4 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="mf-template-name text-sm md:text-base font-medium truncate" style={{ color: "#E8E6E1" }}>
                      {t.name}
                    </p>
                    <p className="mf-meta-text mt-0.5" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.6rem, 1vw, 0.75rem)" }} >
                      Updated {t.updatedOn}
                    </p>
                  </div>
                  <button 
                    className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#1B1E24]"
                    aria-label={`More actions for ${t.name}`}
                  >
                    <MoreHorizontal size={13} className="text-[#6B727C] hover:text-[#E8E6E1]" />
                  </button>
                </div>

                <div className="mt-2 md:mt-3 flex items-center justify-between">
                  <span
                    className="mf-category-tag rounded-full px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-xs font-medium"
                    style={{ background: style.soft, color: style.accent }}
                  >
                    {t.category}
                  </span>
                  <span className="mf-used-count" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.6rem, 1vw, 0.75rem)" }}>
                    Used {t.usedCount}×
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              className="col-span-full rounded-xl p-8 md:p-12 text-center"
              style={{ border: "1px solid #2A2E37", background: "#12151B", color: "#6B727C" }}
            >
              <p className="text-sm md:text-base">No templates match this search.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-2 text-sm font-medium hover:underline" 
                style={{ color: "#FF6A39" }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Templates;