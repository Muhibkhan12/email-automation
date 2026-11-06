import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Search, LayoutTemplate, CheckCircle2, XCircle, Menu,
  Eye, X, Filter, AlertTriangle, Copy, Check,
  Monitor, Tablet, Smartphone, ExternalLink, Inbox, RefreshCw,
} from "lucide-react";
import { useHtmlTemplates } from "../../contexts/HtmlTemplatesContext";

/* ─────────────── tokens ───────────────
   One graphite neutral ramp. One phosphor accent. Amber/red reserved for warn/error.
*/
const T = {
  bg:         "#0B0C0E",
  surface:    "#111214",
  surface2:   "#16181B",
  surfaceHi:  "#1C1F23",
  border:     "#24282E",
  borderSoft: "#1B1E22",

  text:       "#E8EAED",
  textMuted:  "#9AA0A6",
  textFaint:  "#6B7075",

  accent:     "#6EE7A8",
  accentInk:  "#0B0C0E",
  accentLine: "#2E6B4D",

  ok:         "#6EE7A8",
  warn:       "#E0A64A",
  danger:     "#E06A6A",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

type StatusFilter = "All" | "Active" | "Inactive";
const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Inactive"];

const stripHtml = (html: string) =>
  String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { id: Device; label: string; width: number; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "desktop", label: "Desktop", width: 1200, icon: Monitor },
  { id: "tablet",  label: "Tablet",  width: 768,  icon: Tablet },
  { id: "mobile",  label: "Mobile",  width: 390,  icon: Smartphone },
];

/* ─────────────── Mini browser chrome (monochrome) ─────────────── */

const MiniChrome: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1.5"
    style={{ background: T.surface2, borderBottom: HAIRLINE_SOFT }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.border }} />
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.border }} />
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.border }} />
    <div
      className="ml-2 flex-1 h-4 rounded flex items-center px-2 overflow-hidden"
      style={{ background: T.bg, border: HAIRLINE_SOFT }}
    >
      <span
        className="truncate"
        style={{ fontFamily: FONT.mono, color: T.textFaint, fontSize: 9 }}
      >
        templates/{name.toLowerCase().replace(/\s+/g, "-").slice(0, 22)}
      </span>
    </div>
  </div>
);

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
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: T.surface, border: HAIRLINE }}
    >
      {/* Preview */}
      <button
        type="button"
        onClick={onPreview}
        className="relative w-full block text-left group"
        style={{ aspectRatio: "16 / 10" }}
        aria-label={`Preview ${name}`}
      >
        <div className="absolute inset-0 flex flex-col" style={{ background: T.surface2 }}>
          <MiniChrome name={name} />

          <div className="relative flex-1 overflow-hidden">
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

            {/* Hover affordance — small hairline chip, no blur, no glow */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]"
              style={{ background: "rgba(11,12,14,0.55)" }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium"
                style={{ background: T.text, color: T.accentInk }}
              >
                <Eye size={11} /> Preview
              </span>
            </div>
          </div>

          {/* Status chip */}
          <span
            className="absolute top-8 right-2 z-10 inline-flex items-center gap-1.5 rounded text-[10px] px-1.5 py-0.5"
            style={{
              background: T.bg,
              color: active ? T.ok : T.textMuted,
              border: HAIRLINE,
            }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: active ? T.ok : T.textFaint }}
            />
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      </button>

      {/* Meta */}
      <div className="p-3.5 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: T.text }} title={name}>
            {name}
          </p>
          <p className="mt-1 text-[11.5px] leading-4 truncate" style={{ color: T.textFaint }} title={desc}>
            {desc}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] transition-colors duration-[120ms]"
            style={{
              fontFamily: FONT.mono,
              color: copied ? T.accent : T.textFaint,
              border: HAIRLINE,
              background: "transparent",
            }}
            title="Copy template ID"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            #{String(tpl?.id ?? "—")}
          </button>

          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-[120ms]"
            style={{ color: T.text, border: HAIRLINE, background: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.surface2; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
  const { templates, loading, error, refetch } = useHtmlTemplates();

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
  const hasActiveFilters = query.trim() !== "" || status !== "All";

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .tpl-main::-webkit-scrollbar { width: 8px; }
        .tpl-main::-webkit-scrollbar-track { background: transparent; }
        .tpl-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .tpl-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .tpl-input::placeholder { color: ${T.textFaint}; }
        .tpl-input:focus { outline: none; }
        .tpl-seg:focus-visible, .tpl-ctrl:focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }

        select option { background: ${T.surface}; color: ${T.text}; }

        @keyframes modal-fade { from { opacity: 0 } to { opacity: 1 } }
        .modal-fade { animation: modal-fade 120ms ease-out; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
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
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: activeCount > 0 ? T.accent : T.textFaint }}
                    />
                    {activeCount} active
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {totalCount} total
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  HTML templates
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Reusable layouts for your campaigns and automations.
                </p>
              </div>
            </div>
          </header>

          {/* Summary strip — three numbers, no tiles, no icons */}
          <div
            className="grid grid-cols-3 rounded-xl overflow-hidden mb-6"
            style={{ background: T.surface, border: HAIRLINE }}
          >
            {[
              { label: "Total",    value: totalCount,    tone: T.text },
              { label: "Active",   value: activeCount,   tone: T.ok },
              { label: "Inactive", value: inactiveCount, tone: T.textMuted },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                className="p-4 md:p-5"
                style={{ borderRight: i < arr.length - 1 ? HAIRLINE_SOFT : "none" }}
              >
                <p className="text-[11px]" style={{ color: T.textFaint }}>{s.label}</p>
                <p
                  className="text-[22px] md:text-[24px] font-medium mt-1.5 leading-none tabular-nums"
                  style={{ color: s.tone, fontFamily: FONT.mono }}
                >
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Query bar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0 transition-colors duration-[120ms]"
              style={{ background: T.surface, border: HAIRLINE }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates"
                className="tpl-input w-full bg-transparent text-[12.5px] outline-none"
                style={{ color: T.text }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 text-[11px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
                  style={{ color: T.textFaint }}
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className="flex items-center rounded-md p-0.5 overflow-x-auto"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              {STATUS_FILTERS.map((s) => {
                const active = s === status;
                const count = s === "All" ? totalCount : s === "Active" ? activeCount : inactiveCount;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="tpl-seg inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] whitespace-nowrap transition-colors duration-[120ms]"
                    style={{
                      background: active ? T.surface2 : "transparent",
                      color: active ? T.text : T.textMuted,
                      border: active ? HAIRLINE_SOFT : "1px solid transparent",
                    }}
                  >
                    {s}
                    <span
                      className="tabular-nums"
                      style={{ color: T.textFaint, fontFamily: FONT.mono, fontSize: 10.5 }}
                    >
                      {count}
                    </span>
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
                style={{ borderColor: T.border, borderTopColor: T.accent }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading templates</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-12 rounded-xl"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <AlertTriangle size={16} style={{ color: T.danger }} />
              </div>
              <p className="text-[13px] mb-4" style={{ color: T.danger }}>{error}</p>
              {refetch && (
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
                  style={{ color: T.textMuted, border: HAIRLINE }}
                >
                  <RefreshCw size={12} /> Try again
                </button>
              )}
            </div>
          )}

          {/* Grid or empty */}
          {!loading && !error && (
            filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                className="text-center py-16 rounded-xl"
                style={{ background: T.surface, border: HAIRLINE }}
              >
                <div
                  className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                  style={{ background: T.surfaceHi, border: HAIRLINE }}
                >
                  {safeTemplates.length === 0
                    ? <Inbox size={18} style={{ color: T.textFaint }} />
                    : <Filter size={18} style={{ color: T.textFaint }} />}
                </div>
                <p className="text-[14px] font-medium" style={{ color: T.text }}>
                  {safeTemplates.length === 0 ? "No templates yet" : "No templates match"}
                </p>
                <p className="text-[12.5px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                  {safeTemplates.length === 0
                    ? "Create your first template to reuse across campaigns."
                    : "Try a different search or clear the filter."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setQuery(""); setStatus("All"); }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                    style={{ background: T.text, color: T.accentInk, border: `1px solid ${T.text}` }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </main>

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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 lg:p-8"
      style={{ background: "rgba(11,12,14,0.78)" }}
      onClick={onClose}
    >
      <div
        className="modal-fade w-full max-w-6xl h-full max-h-[92vh] rounded-xl overflow-hidden flex flex-col"
        style={{
          background: T.surface,
          border: HAIRLINE,
          boxShadow: "0 16px 48px -24px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: HAIRLINE_SOFT }}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ background: T.border }} />
            <span className="w-2 h-2 rounded-full" style={{ background: T.border }} />
            <span className="w-2 h-2 rounded-full" style={{ background: T.border }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>
              {name}
            </p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
              {desc}
            </p>
          </div>

          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded text-[10px] px-1.5 py-0.5 whitespace-nowrap"
            style={{ color: active ? T.ok : T.textMuted, border: HAIRLINE }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: active ? T.ok : T.textFaint }}
            />
            {active ? "Active" : "Inactive"}
          </span>

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 p-1.5 rounded-md transition-colors duration-[120ms]"
            style={{ color: T.textMuted }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Device + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: HAIRLINE_SOFT }}>
          <div
            className="inline-flex items-center rounded-md p-0.5"
            style={{ background: T.surface2, border: HAIRLINE_SOFT }}
          >
            {DEVICES.map((d, i) => {
              const active = d.id === device;
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  className="tpl-seg inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11.5px] font-medium transition-colors duration-[120ms]"
                  style={{
                    background: active ? T.surfaceHi : "transparent",
                    color: active ? T.text : T.textMuted,
                    border: active ? HAIRLINE_SOFT : "1px solid transparent",
                  }}
                  title={`${d.label} (${i + 1})`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{d.label}</span>
                  <span
                    className="hidden md:inline tabular-nums"
                    style={{ fontFamily: FONT.mono, fontSize: 10, color: T.textFaint }}
                  >
                    {d.width}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors duration-[120ms]"
              style={{
                fontFamily: FONT.mono,
                color: copied ? T.accent : T.textFaint,
                border: HAIRLINE,
                background: "transparent",
              }}
              title="Copy template ID (C)"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              #{id || "—"}
            </button>

            <button
              onClick={openRaw}
              disabled={!html}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors duration-[120ms] disabled:opacity-50"
              style={{ color: T.textMuted, border: HAIRLINE }}
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
              className="rounded-md overflow-hidden flex"
              style={{
                width: "100%",
                maxWidth: `${currentWidth}px`,
                height: "100%",
                background: "#fff",
                border: HAIRLINE,
              }}
            >
              <iframe
                title="template-preview-full"
                srcDoc={
                  html ||
                  "<p style='font-family:sans-serif;color:#888;padding:24px;'>No preview content</p>"
                }
                sandbox=""
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div
          className="hidden md:flex items-center justify-between gap-3 px-4 py-2 text-[10.5px]"
          style={{ borderTop: HAIRLINE_SOFT, color: T.textFaint, fontFamily: FONT.mono }}
        >
          <span>Esc close · 1 desktop · 2 tablet · 3 mobile · C copy id</span>
        </div>
      </div>
    </div>
  );
};

export default Templates;