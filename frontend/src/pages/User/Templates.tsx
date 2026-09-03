import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Plus,
  Search,
  LayoutTemplate,
  Sparkles,
  Copy,
  Menu,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = templates.filter((t) => {
    const matchesCategory = category === "All" || t.category === category;
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-card { 
          transition: box-shadow 0.15s ease, transform 0.15s ease; 
          cursor: pointer;
        }
        .mf-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px rgba(0,0,0,0.3); 
        }

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

        @media (max-width: 640px) {
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        {/* Header */}
        <div className="mf-header mb-5 md:mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: "#FFFFFF" }}
                className="text-xl md:text-2xl lg:text-3xl font-bold"
              >
                HTML templates
              </h1>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                Reusable layouts for your campaigns and automations.
              </p>
            </div>
          </div>

          <button
            className="mf-create-btn flex items-center justify-center gap-1.5 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02] w-full sm:w-auto"
            style={{ background: "#FF6A39", boxShadow: "0 4px 12px rgba(255,106,57,0.25)" }}
          >
            <Plus size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" />
            <span className="hidden xs:inline">Create template</span>
            <span className="xs:hidden">Create</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mf-stats-grid mb-4 md:mb-5 lg:mb-6 grid grid-cols-1 gap-2.5 md:gap-3 lg:gap-5 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isEmber = stat.title === "Most reused";
            return (
              <div
                key={stat.title}
                className="mf-stat-card rounded-xl p-2.5 md:p-3 lg:p-5"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                <div 
                  className="flex h-6 w-6 md:h-7 md:w-7 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
                  style={{ background: isEmber ? "rgba(255,106,57,0.12)" : "rgba(255,255,255,0.05)" }}
                >
                  <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: isEmber ? "#FF6A39" : "#9BA0A8" }} />
                </div>
                <h2
                  style={{ fontFamily: FONT.mono, color: "#E8E6E1", fontSize: "clamp(1rem, 2vw, 1.5rem)" }}
                  className="mf-stat-value mt-1.5 md:mt-2 lg:mt-4 truncate font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mf-stat-title mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm" style={{ color: "#9BA0A8" }}>
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mf-toolbar mb-3 md:mb-4 lg:mb-6 flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <div
            className="mf-search-container flex items-center gap-1.5 md:gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex-1 min-w-[140px]"
            style={{ border: "1px solid #2A2E37", background: "#12151B" }}
          >
            <Search size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#6B727C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="mf-search-input bg-transparent text-[10px] md:text-xs lg:text-sm outline-none w-full"
              style={{ color: "#E8E6E1" }}
            />
          </div>

          <div
            className="mf-categories-container flex flex-wrap items-center gap-0.5 md:gap-1 rounded-xl p-0.5 md:p-1 w-full md:w-auto overflow-x-auto"
            style={{ background: "#12151B", border: "1px solid #2A2E37" }}
          >
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="mf-category-btn rounded-lg px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 lg:py-1.5 text-[8px] md:text-[9px] lg:text-xs font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none"
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
        <div className="mf-template-grid grid grid-cols-1 gap-3 md:gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filtered.map((t) => {
            const style = CATEGORY_STYLE[t.category];
            return (
              <div
                key={t.name}
                className="mf-card rounded-xl p-2.5 md:p-3 lg:p-4"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                {/* Mini email preview */}
                <div
                  className="mf-preview-card relative flex flex-col gap-1.5 md:gap-2 rounded-lg p-2.5 md:p-3 lg:p-4"
                  style={{ background: "#0B0E12", height: "clamp(110px, 20vw, 168px)" }}
                >
                  <div
                    className="mf-preview-title h-1.5 md:h-2 lg:h-3 rounded"
                    style={{ background: style.accent, opacity: 0.9, width: "40%" }}
                  />
                  <div className="mf-preview-body h-10 md:h-12 lg:h-16 w-full rounded" style={{ background: style.soft }} />
                  <div className="mf-preview-blocks flex flex-col gap-0.5 md:gap-1 lg:gap-1.5">
                    {Array.from({ length: Math.min(t.blocks, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="mf-preview-block h-0.5 md:h-1 lg:h-1.5 rounded-full"
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
                      className="mt-auto h-3 md:h-4 lg:h-5 rounded"
                      style={{ background: style.accent, width: "clamp(40px, 10vw, 80px)" }}
                    />
                  )}
                </div>

                {/* Meta */}
                <div className="mt-2 md:mt-3 lg:mt-4 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="mf-template-name text-[11px] md:text-xs lg:text-base font-medium truncate" style={{ color: "#E8E6E1" }}>
                      {t.name}
                    </p>
                    <p className="mf-meta-text mt-0.5" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.55rem, 0.8vw, 0.75rem)" }}>
                      Updated {t.updatedOn}
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 md:mt-2 lg:mt-3 flex items-center justify-between">
                  <span
                    className="mf-category-tag rounded-full px-1 md:px-1.5 lg:px-2.5 py-0.5 text-[7px] md:text-[8px] lg:text-xs font-medium"
                    style={{ background: style.soft, color: style.accent }}
                  >
                    {t.category}
                  </span>
                  <span className="mf-used-count" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.55rem, 0.8vw, 0.75rem)" }}>
                    Used {t.usedCount}×
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              className="col-span-full rounded-xl p-6 md:p-8 lg:p-12 text-center"
              style={{ border: "1px solid #2A2E37", background: "#12151B", color: "#6B727C" }}
            >
              <p className="text-[10px] md:text-xs lg:text-sm">No templates match this search.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-1.5 md:mt-2 text-[10px] md:text-xs lg:text-sm font-medium hover:underline"
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