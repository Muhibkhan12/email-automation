import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Search, LayoutTemplate, CheckCircle2, XCircle, Menu,
  Eye, X, Sparkles, Filter, AlertTriangle, Copy, Check,
  Monitor, Tablet, Smartphone, ExternalLink, MoreHorizontal,
} from "lucide-react";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  surface:     "#111319",
  surface2:    "#161922",
  surfaceHi:   "#1B1F2A",
  border:      "#232838",
  borderSoft:  "#1B1F2A",
  text:        "#E9EBF0",
  textMuted:   "#9CA3B4",
  textFaint:   "#6B7280",
  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

type StatusFilter = "All" | "Active" | "Inactive";
const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Inactive"];

const stripHtml = (html: string) =>
  String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/* ─────────────── devices ─────────────── */

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { id: Device; label: string; width: number; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "desktop", label: "Desktop", width: 1200, icon: Monitor },
  { id: "tablet",  label: "Tablet",  width: 768,  icon: Tablet },
  { id: "mobile",  label: "Mobile",  width: 390,  icon: Smartphone },
];

/* ─────────────── Template card ─────────────── */

const TemplateCard: React.FC<{
  tpl: any;
  getName: (t: any) => string;
  getDesc: (t: any) => string;
  getHtml: (t: any) => string;
  isActive: (t: any) => boolean;
  onPreview: () => void;
}> = ({ tpl, getName, getDesc, getHtml, isActive, onPreview }) => {
  const active = isActive(tpl);
  const name = getName(tpl) || "Untitled template";
  const desc = getDesc(tpl) || "No description";
  const html = getHtml(tpl);
  const textPreview = stripHtml(html);
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = String(tpl?.id ?? "");
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="group rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: T.surface, boxShadow: RING }}
    >
      {/* Preview */}
      <button
        type="button"
        onClick={onPreview}
        className="relative w-full block text-left"
        style={{ aspectRatio: "16 / 10" }}
        aria-label={`Preview ${name}`}
      >
        <div
          className="absolute inset-0"
          style={{ background: T.surface2 }}
        >
          {/* mini chrome bar */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1.5 px-3 py-2"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.7)" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.7)" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.7)" }} />
            <div
              className="ml-2 flex-1 h-4 rounded flex items-center px-2 overflow-hidden"
              style={{ background: T.bg, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <span style={{ fontFamily: FONT.mono, color: T.textFaint, fontSize: 9 }}>
                templates/{name.toLowerCase().replace(/\s+/g, "-").slice(0, 22)}
              </span>
            </div>
          </div>

          {/* scaled iframe */}
          <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden">
            {html ? (
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
                  title={`preview-${tpl?.id ?? name}`}
                  srcDoc={html}
                  sandbox=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full border-0"
                  style={{ background: "#fff" }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <p
                  className="text-[11px] leading-relaxed text-center"
                  style={{
                    color: T.textMuted,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {textPreview || "No preview content"}
                </p>
              </div>
            )}
          </div>

          {/* hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(10,11,16,0.72)", backdropFilter: "blur(2px)" }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
            >
              <Eye size={12} />
              Open preview
            </span>
          </div>
        </div>

        {/* status badge */}
        <span
          className="absolute top-8 right-2 z-20 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: active ? T.successSoft : "rgba(156,163,180,0.12)",
            color: active ? T.success : T.textMuted,
            boxShadow: `inset 0 0 0 1px ${active ? T.successBorder : "rgba(156,163,180,0.28)"}`,
            backdropFilter: "blur(6px)",
          }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: active ? T.success : T.textMuted }} />
          {active ? "Active" : "Inactive"}
        </span>
      </button>

      {/* Meta */}
      <div className="p-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: T.text }} title={name}>
            {name}
          </p>
          <p className="mt-0.5 text-[11px] truncate" style={{ fontFamily: FONT.mono, color: T.textFaint }} title={desc}>
            {desc}
          </p>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] transition-colors"
            style={{
              fontFamily: FONT.mono,
              color: copied ? T.success : T.textFaint,
              background: copied ? T.successSoft : T.surface2,
              boxShadow: `inset 0 0 0 1px ${copied ? T.successBorder : T.borderSoft}`,
            }}
            title="Copy template ID"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            #{String(tpl?.id ?? "—")}
          </button>

          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:brightness-110"
            style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
          >
            <Eye size={11} />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Page ─────────────── */

const Templates = () => {
  const { templates, loading, error } = useHtmlTemplates();

  const [status, setStatus] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

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

  const totalCount = safeTemplates.length;
  const activeCount = safeTemplates.filter(isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .tpl-main::-webkit-scrollbar { width: 8px; }
        .tpl-main::-webkit-scrollbar-track { background: transparent; }
        .tpl-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .tpl-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @keyframes modalPop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.15s ease; }
        select option { background: ${T.surface}; color: ${T.text}; }
        @media (prefers-reduced-motion: reduce) { .modal-pop { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="tpl-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1320 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
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
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {activeCount} active
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {totalCount} total
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  HTML templates
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Reusable layouts for your campaigns and automations.
                </p>
              </div>
            </div>
          </header>

          {/* Summary */}
          <div
            className="mb-5 md:mb-6 rounded-xl overflow-hidden"
            style={{ background: T.surface, boxShadow: RING }}
          >
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: T.borderSoft }}>
              <SummaryTile icon={LayoutTemplate} label="Total"    value={totalCount}    tone={T.textMuted} />
              <SummaryTile icon={CheckCircle2}   label="Active"   value={activeCount}   tone={T.success} />
              <SummaryTile icon={XCircle}        label="Inactive" value={inactiveCount} tone={T.danger} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-5 md:mb-6">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-shadow"
              style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.border}`)}
            >
              <Search size={14} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: T.text }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                  style={{ color: T.textFaint }}
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className="inline-flex items-center gap-0.5 p-0.5 rounded-lg self-start sm:self-auto"
              style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              {STATUS_FILTERS.map((s) => {
                const active = s === status;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap"
                    style={{
                      background: active ? T.surfaceHi : "transparent",
                      color: active ? T.text : T.textMuted,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.brand, borderTopColor: "transparent" }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading templates…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.18)" }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: T.danger }} />
              </div>
              <p className="text-[13px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && (
            <>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
                  {filtered.map((t) => (
                    <TemplateCard
                      key={(t as any)?.id ?? getName(t)}
                      tpl={t}
                      getName={getName}
                      getDesc={getDesc}
                      getHtml={getHtml}
                      isActive={isActive}
                      onPreview={() => setPreviewTemplate(t)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-20 rounded-xl"
                  style={{ background: T.surface, boxShadow: RING }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                    style={{ background: T.surface2 }}
                  >
                    {safeTemplates.length === 0
                      ? <Sparkles className="w-5 h-5" style={{ color: T.brand }} />
                      : <Filter className="w-5 h-5" style={{ color: T.textFaint }} />}
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: T.text }}>
                    {safeTemplates.length === 0 ? "No templates yet" : "No templates match"}
                  </p>
                  <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                    {safeTemplates.length === 0
                      ? "Create your first template to reuse across campaigns."
                      : "Try a different search or clear filters."}
                  </p>
                  {safeTemplates.length > 0 && (
                    <button
                      onClick={() => { setQuery(""); setStatus("All"); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all hover:brightness-110"
                      style={{ background: T.brand, color: "#fff" }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          getName={getName}
          getDesc={getDesc}
          getHtml={getHtml}
          isActive={isActive}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};

/* ─────────────── Preview modal ─────────────── */

const PreviewModal: React.FC<{
  template: any;
  getName: (t: any) => string;
  getDesc: (t: any) => string;
  getHtml: (t: any) => string;
  isActive: (t: any) => boolean;
  onClose: () => void;
}> = ({ template, getName, getDesc, getHtml, isActive, onClose }) => {
  const [device, setDevice] = useState<Device>("desktop");
  const [copied, setCopied] = useState(false);

  const name = getName(template) || "Untitled template";
  const desc = getDesc(template) || "No description";
  const html = getHtml(template);
  const active = isActive(template);
  const id = String(template?.id ?? "");

  const handleCopyId = () => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const openRaw = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "1") setDevice("desktop");
      else if (e.key === "2") setDevice("tablet");
      else if (e.key === "3") setDevice("mobile");
      else if (e.key.toLowerCase() === "c") handleCopyId();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentWidth = DEVICES.find((d) => d.id === device)!.width;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 lg:p-8 bg-black/70"
      onClick={onClose}
    >
      <div
        className="modal-pop w-full max-w-6xl h-full max-h-[92vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 64px -16px rgba(0,0,0,0.7)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ background: "rgba(239,68,68,0.7)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "rgba(245,158,11,0.7)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "rgba(34,197,94,0.7)" }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>
              {name}
            </p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              {desc}
            </p>
          </div>

          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
            style={{
              background: active ? T.successSoft : "rgba(156,163,180,0.12)",
              color: active ? T.success : T.textMuted,
              boxShadow: `inset 0 0 0 1px ${active ? T.successBorder : "rgba(156,163,180,0.28)"}`,
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: active ? T.success : T.textMuted }} />
            {active ? "Active" : "Inactive"}
          </span>

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: T.textMuted, background: T.surface2 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <div
            className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            {DEVICES.map((d, i) => {
              const active = d.id === device;
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                  style={{
                    background: active ? T.surfaceHi : "transparent",
                    color: active ? T.text : T.textMuted,
                  }}
                  title={`${d.label} (${i + 1})`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{d.label}</span>
                  <span className="hidden md:inline text-[10px] opacity-60" style={{ fontFamily: FONT.mono }}>
                    {d.width}px
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors"
              style={{
                fontFamily: FONT.mono,
                color: copied ? T.success : T.textFaint,
                background: copied ? T.successSoft : T.surface2,
                boxShadow: `inset 0 0 0 1px ${copied ? T.successBorder : T.borderSoft}`,
              }}
              title="Copy template ID (C)"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              #{id || "—"}
            </button>

            <button
              onClick={openRaw}
              disabled={!html}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
            >
              <ExternalLink size={11} />
              Open raw
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden" style={{ background: T.bg }}>
          <div className="w-full h-full flex items-center justify-center p-3 md:p-6 overflow-auto">
            <div
              className="rounded-lg overflow-hidden"
              style={{
                width: "100%",
                maxWidth: `${currentWidth}px`,
                height: "100%",
                background: "#fff",
                boxShadow: "0 24px 48px -12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
                transition: "max-width 0.2s ease",
              }}
            >
              <iframe
                title="template-preview-full"
                srcDoc={html || "<p style='font-family:sans-serif;color:#888;padding:24px;'>No preview content</p>"}
                sandbox=""
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div
          className="hidden md:flex items-center justify-between gap-3 px-4 py-2 text-[10.5px]"
          style={{ borderTop: `1px solid ${T.borderSoft}`, fontFamily: FONT.mono, color: T.textFaint }}
        >
          <span>Esc to close · 1 desktop · 2 tablet · 3 mobile · C copy id</span>
          <span className="inline-flex items-center gap-2">
            <MoreHorizontal size={12} />
            sandboxed preview
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Summary tile ─────────────── */

const SummaryTile: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone: string;
}> = ({ icon: Icon, label, value, tone }) => (
  <div className="p-4 md:p-5">
    <div className="flex items-center gap-2 mb-2.5">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: `${tone}14`, color: tone }}
      >
        <Icon size={13} />
      </div>
      <span className="text-[10.5px] uppercase tracking-wider font-medium" style={{ color: T.textFaint }}>
        {label}
      </span>
    </div>
    <p className="text-[24px] md:text-[28px] font-semibold leading-none tracking-tight"
      style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

export default Templates;