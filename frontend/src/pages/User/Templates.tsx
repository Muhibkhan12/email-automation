import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Plus,
  Search,
  LayoutTemplate,
  CheckCircle2,
  XCircle,
  Menu,
  Eye,
  X,
} from "lucide-react";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type StatusFilter = "All" | "Active" | "Inactive";
const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Inactive"];

const stripHtml = (html: string) =>
  String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const Templates = () => {
  const { templates, loading, error } = useHtmlTemplates();

  const [status, setStatus] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  // Defensive accessors — never crash on undefined fields
  const getName = (t: any) => String(t?.name ?? t?.title ?? "");
  const isActive = (t: any) => Boolean(t?.is_active ?? t?.isActive);
  const getHtml = (t: any) => String(t?.html_content ?? t?.htmlContent ?? "");
  const getDesc = (t: any) => String(t?.description ?? "");

  const safeTemplates = Array.isArray(templates) ? templates : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return safeTemplates.filter((t) => {
      const active = isActive(t);
      const matchesStatus =
        status === "All" ||
        (status === "Active" && active) ||
        (status === "Inactive" && !active);
      const matchesQuery = q === "" || getName(t).toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [safeTemplates, status, query]);

  const stats = [
    {
      title: "Total templates",
      value: safeTemplates.length.toString(),
      icon: LayoutTemplate,
    },
    {
      title: "Active",
      value: safeTemplates.filter(isActive).length.toString(),
      icon: CheckCircle2,
    },
    {
      title: "Inactive",
      value: safeTemplates.filter((t) => !isActive(t)).length.toString(),
      icon: XCircle,
    },
  ];

  // 🔍 Debug — remove once things work
  console.log("[Templates] loading:", loading, "error:", error);
  console.log("[Templates] templates:", safeTemplates);
  console.log("[Templates] filtered:", filtered);

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .mf-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .mf-main-content::-webkit-scrollbar { width: 6px; }
        .mf-main-content::-webkit-scrollbar-track { background: #0B0E12; }
        .mf-main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .mf-main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        .sidebar-overlay { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-slide { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .mf-modal-overlay { animation: fadeIn 0.15s ease-in-out; }
        .mf-modal-panel { animation: modalPop 0.18s ease-out; }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (max-width: 640px) {
          .mf-main-content { padding: 0.75rem !important; }
          .mf-preview-card { height: 120px !important; }
          .mf-meta-text { font-size: 0.6rem !important; }
          .mf-category-tag { font-size: 0.6rem !important; padding: 0.15rem 0.4rem !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          sidebar-slide
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main
        className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8"
        style={{ background: "#12151B", height: "100vh", width: "100%" }}
      >
        {/* Header */}
        <div className="mf-header mb-5 md:mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1
                style={{
                  fontFamily: FONT.display,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                }}
                className="text-xl md:text-2xl lg:text-3xl font-bold"
              >
                HTML templates
              </h1>
              <p
                className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm"
                style={{ color: "#9BA0A8" }}
              >
                Reusable layouts for your campaigns and automations.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mf-stats-grid mb-4 md:mb-5 lg:mb-6 grid grid-cols-1 gap-2.5 md:gap-3 lg:gap-5 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="mf-stat-card rounded-xl p-2.5 md:p-3 lg:p-5"
                style={{ border: "1px solid #2A2E37", background: "#12151B" }}
              >
                <div
                  className="flex h-6 w-6 md:h-7 md:w-7 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <Icon
                    size={12}
                    className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]"
                    style={{ color: "#9BA0A8" }}
                  />
                </div>
                <h2
                  style={{
                    fontFamily: FONT.mono,
                    color: "#E8E6E1",
                    fontSize: "clamp(1rem, 2vw, 1.5rem)",
                  }}
                  className="mf-stat-value mt-1.5 md:mt-2 lg:mt-4 truncate font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p
                  className="mf-stat-title mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm"
                  style={{ color: "#9BA0A8" }}
                >
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
            <Search
              size={12}
              className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#6B727C]"
            />
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
            {STATUS_FILTERS.map((s) => {
              const active = s === status;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
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
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div
            className="rounded-xl p-6 md:p-8 lg:p-12 text-center"
            style={{
              border: "1px solid #2A2E37",
              background: "#12151B",
              color: "#6B727C",
            }}
          >
            <p className="text-[10px] md:text-xs lg:text-sm">
              Loading templates…
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-xl p-6 md:p-8 lg:p-12 text-center"
            style={{
              border: "1px solid #2A2E37",
              background: "#12151B",
              color: "#F87171",
            }}
          >
            <p className="text-[10px] md:text-xs lg:text-sm">{error}</p>
          </div>
        )}

        {/* Template grid */}
        {!loading && !error && (
          <div className="mf-template-grid grid grid-cols-1 gap-3 md:gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filtered.map((t) => {
              const active = isActive(t);
              return (
                <div
                  key={(t as any)?.id ?? getName(t)}
                  className="mf-card rounded-xl p-2.5 md:p-3 lg:p-4"
                  style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                >
                  <div
                    className="mf-preview-card relative flex flex-col gap-1.5 md:gap-2 rounded-lg p-2.5 md:p-3 lg:p-4 overflow-hidden group"
                    style={{
                      background: "#0B0E12",
                      height: "clamp(110px, 20vw, 168px)",
                    }}
                  >
                    <div
                      className="h-1.5 md:h-2 lg:h-3 rounded"
                      style={{
                        background: active ? "#34D399" : "#6B727C",
                        opacity: 0.9,
                        width: "40%",
                      }}
                    />
                    <p
                      className="text-[9px] md:text-[10px] lg:text-xs leading-snug"
                      style={{
                        color: "#9BA0A8",
                        display: "-webkit-box",
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {stripHtml(getHtml(t)) || "No preview content"}
                    </p>

                    {/* Hover overlay with Preview button */}
                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(11,14,18,0.78)" }}
                    >
                      <span
                        className="flex items-center gap-1.5 rounded-lg px-2.5 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] lg:text-xs font-medium"
                        style={{ background: "#FF6A39", color: "#FFFFFF" }}
                      >
                        <Eye size={12} />
                        Preview
                      </span>
                    </button>
                  </div>

                  <div className="mt-2 md:mt-3 lg:mt-4 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="mf-template-name text-[11px] md:text-xs lg:text-base font-medium truncate"
                        style={{ color: "#E8E6E1" }}
                      >
                        {getName(t) || "Untitled template"}
                      </p>
                      <p
                        className="mf-meta-text mt-0.5 truncate"
                        style={{
                          fontFamily: FONT.mono,
                          color: "#6B727C",
                          fontSize: "clamp(0.55rem, 0.8vw, 0.75rem)",
                        }}
                      >
                        {getDesc(t) || "No description"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1.5 md:mt-2 lg:mt-3 flex items-center justify-between">
                    <span
                      className="mf-category-tag rounded-full px-1 md:px-1.5 lg:px-2.5 py-0.5 text-[7px] md:text-[8px] lg:text-xs font-medium"
                      style={{
                        background: active
                          ? "rgba(52,211,153,0.12)"
                          : "rgba(107,114,124,0.12)",
                        color: active ? "#34D399" : "#9BA0A8",
                      }}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>

                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="flex items-center gap-1 rounded-lg px-1.5 md:px-2 lg:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-xs font-medium transition-colors"
                      style={{ color: "#FF6A39", background: "rgba(255,106,57,0.1)" }}
                    >
                      <Eye size={11} />
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div
                className="col-span-full rounded-xl p-6 md:p-8 lg:p-12 text-center"
                style={{
                  border: "1px solid #2A2E37",
                  background: "#12151B",
                  color: "#6B727C",
                }}
              >
                <p className="text-[10px] md:text-xs lg:text-sm">
                  {safeTemplates.length === 0
                    ? "No templates available yet."
                    : "No templates match this search."}
                </p>
                {safeTemplates.length > 0 && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setStatus("All");
                    }}
                    className="mt-1.5 md:mt-2 text-[10px] md:text-xs lg:text-sm font-medium hover:underline"
                    style={{ color: "#FF6A39" }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="mf-modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 lg:p-10"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="mf-modal-panel w-full max-w-5xl h-full max-h-[88vh] rounded-xl overflow-hidden flex flex-col"
            style={{ background: "#12151B", border: "1px solid #2A2E37" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between gap-3 px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b"
              style={{ borderColor: "#2A2E37" }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs md:text-sm lg:text-base font-medium truncate"
                  style={{ color: "#E8E6E1" }}
                >
                  {getName(previewTemplate) || "Untitled template"}
                </p>
                <p
                  className="mt-0.5 text-[9px] md:text-[10px] lg:text-xs truncate"
                  style={{ color: "#6B727C" }}
                >
                  {getDesc(previewTemplate) || "No description"}
                </p>
              </div>

              <span
                className="rounded-full px-1.5 md:px-2 lg:px-2.5 py-0.5 text-[8px] md:text-[9px] lg:text-xs font-medium whitespace-nowrap"
                style={{
                  background: isActive(previewTemplate)
                    ? "rgba(52,211,153,0.12)"
                    : "rgba(107,114,124,0.12)",
                  color: isActive(previewTemplate) ? "#34D399" : "#9BA0A8",
                }}
              >
                {isActive(previewTemplate) ? "Active" : "Inactive"}
              </span>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 md:p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: "#1B1E24", color: "#C7C9CE" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Rendered HTML, bigger scale */}
            <div className="flex-1 overflow-hidden" style={{ background: "#FFFFFF" }}>
              <iframe
                title="template-preview"
                srcDoc={getHtml(previewTemplate) || "<p style='font-family:sans-serif;color:#888;padding:24px;'>No preview content</p>"}
                sandbox=""
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;