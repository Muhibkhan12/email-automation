import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Plus, Search, LayoutTemplate, CheckCircle2, XCircle, Menu,
  Eye, X, Sparkles, Filter, AlertTriangle, Copy, Check,
  Monitor, Tablet, Smartphone, ExternalLink, MoreHorizontal,
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

/* ─────────────── Device sizes for preview ─────────────── */

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
      className="group float-in rounded-3xl overflow-hidden soft-ring transition-all hover:-translate-y-0.5"
      style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
    >
      {/* ── Preview ────────────────────────────── */}
      <button
        type="button"
        onClick={onPreview}
        className="relative w-full block text-left"
        style={{ aspectRatio: "16 / 10" }}
        aria-label={`Preview ${name}`}
      >
        {/* device chrome */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(280px 160px at 20% -20%, rgba(255,106,57,0.10), transparent 60%), #0F131C",
          }}
        >
          {/* mini chrome bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1.5 px-3 py-2"
            style={{ background: "rgba(11,14,18,0.85)", backdropFilter: "blur(6px)" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: "#F87171" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#FBBF24" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#34D399" }} />
            <div
              className="ml-2 flex-1 h-4 rounded-md flex items-center px-2 overflow-hidden"
              style={{ background: "#0B0E13", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
            >
              <span style={{ fontFamily: FONT.mono, color: "#5A6172", fontSize: 9 }}>
                templates/{name.toLowerCase().replace(/\s+/g, "-").slice(0, 22)}
              </span>
            </div>
          </div>

          {/* live scaled iframe, or fallback text */}
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
                    color: "#8A90A0",
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
            style={{ background: "rgba(11,14,18,0.72)", backdropFilter: "blur(2px)" }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-semibold text-white transition-transform group-hover:scale-[1.03]"
              style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
            >
              <Eye size={13} />
              Open preview
            </span>
          </div>
        </div>

        {/* status badge — floats top-right */}
        <span
          className="absolute top-9 right-3 z-20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
          style={{
            background: active ? "rgba(52,211,153,0.14)" : "rgba(155,160,168,0.14)",
            color: active ? "#34D399" : "#9BA0A8",
            boxShadow: `inset 0 0 0 1px ${active ? "rgba(52,211,153,0.28)" : "rgba(155,160,168,0.28)"}`,
            backdropFilter: "blur(6px)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: active ? "#34D399" : "#9BA0A8",
              boxShadow: active ? "0 0 6px #34D399" : "none",
            }}
          />
          {active ? "Active" : "Inactive"}
        </span>
      </button>

      {/* ── Meta ───────────────────────────────── */}
      <div className="p-4">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: "#F2F0EB" }} title={name}>
            {name}
          </p>
          <p
            className="mt-0.5 text-[11.5px] truncate"
            style={{ fontFamily: FONT.mono, color: "#7A8092" }}
            title={desc}
          >
            {desc}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {/* id + copy chip */}
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors"
            style={{
              fontFamily: FONT.mono,
              color: copied ? "#34D399" : "#5A6172",
              background: copied ? "rgba(52,211,153,0.10)" : "#0F131C",
              boxShadow: `inset 0 0 0 1px ${copied ? "rgba(52,211,153,0.22)" : "#1A1F2B"}`,
            }}
            title="Copy template ID"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            #{String(tpl?.id ?? "—")}
          </button>

          {/* actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[12px] font-medium transition-all hover:-translate-y-0.5"
              style={{
                background: "rgba(255,106,57,0.10)",
                color: "#FF6A39",
                boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)",
              }}
            >
              <Eye size={12} />
              Preview
            </button>
          </div>
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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.98) translateY(6px); } to { opacity: 1; transform: none; } }
        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .tpl-main::-webkit-scrollbar { width: 10px; }
        .tpl-main::-webkit-scrollbar-track { background: transparent; }
        .tpl-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .tpl-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="tpl-main flex-1 overflow-y-auto" style={{ background: "#0B0E13", height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141821" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {activeCount} active
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {totalCount} total
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    HTML templates
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Reusable layouts for your campaigns and automations.
                  </p>
                </div>
              </div>

              <button
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] transition-all hover:-translate-y-0.5 self-start md:self-auto"
                style={{ background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                <Plus size={15} />
                New template
              </button>
            </header>

            {/* Summary */}
            <div
              className="float-in mb-6 md:mb-8 rounded-3xl overflow-hidden soft-ring"
              style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
            >
              <div className="grid grid-cols-3 divide-x divide-[#1A1F2B]">
                <SummaryTile icon={LayoutTemplate} label="Total"    value={totalCount}    tone="#9BA0A8" />
                <SummaryTile icon={CheckCircle2}   label="Active"   value={activeCount}   tone="#34D399" />
                <SummaryTile icon={XCircle}        label="Inactive" value={inactiveCount} tone="#F87171" />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 md:mb-8">
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 flex-1 min-w-0 transition-all"
                style={{ background: "#141821", boxShadow: "inset 0 0 0 1px #232833" }}
                onFocusCapture={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)")}
                onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #232833")}
              >
                <Search size={14} className="text-[#6B727C] shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="shrink-0 text-[10px] text-[#6B727C] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#232833] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div
                className="inline-flex items-center gap-1 p-1 rounded-2xl soft-ring self-start sm:self-auto"
                style={{ background: "#10141D" }}
              >
                {STATUS_FILTERS.map((s) => {
                  const active = s === status;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className="rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap"
                      style={{
                        background: active ? "#1B2130" : "transparent",
                        color: active ? "#F2F0EB" : "#7A8092",
                        boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 14px -6px rgba(0,0,0,0.6)" : "none",
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
                <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B727C] mt-3">Loading templates…</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div
                className="text-center py-16 rounded-3xl"
                style={{ background: "rgba(248,113,113,0.05)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(248,113,113,0.10)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                  <AlertTriangle className="w-5 h-5 text-[#F87171]" />
                </div>
                <p className="text-sm text-[#F87171]">{error}</p>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && (
              <>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
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
                    className="text-center py-20 rounded-3xl"
                    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}
                    >
                      {safeTemplates.length === 0
                        ? <Sparkles className="w-6 h-6 text-[#FF6A39]" />
                        : <Filter className="w-6 h-6 text-[#6A7080]" />}
                    </div>
                    <p className="text-[14px] font-medium" style={{ color: "#F2F0EB" }}>
                      {safeTemplates.length === 0 ? "No templates yet" : "No templates match"}
                    </p>
                    <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: "#7A8092" }}>
                      {safeTemplates.length === 0
                        ? "Create your first template to reuse across campaigns."
                        : "Try a different search or clear filters."}
                    </p>
                    {safeTemplates.length > 0 && (
                      <button
                        onClick={() => { setQuery(""); setStatus("All"); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Preview Modal ───────────────────────── */}
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

  // Esc closes, 1/2/3 switch device, C copies id
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 lg:p-8 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-pop w-full max-w-6xl h-full max-h-[92vh] rounded-3xl overflow-hidden flex flex-col soft-ring"
        style={{ background: "#141821" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-[#1A1F2B]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] md:text-sm font-semibold truncate" style={{ color: "#F2F0EB" }}>
              {name}
            </p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: "#7A8092", fontFamily: FONT.mono }}>
              {desc}
            </p>
          </div>

          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
            style={{
              background: active ? "rgba(52,211,153,0.10)" : "rgba(155,160,168,0.10)",
              color: active ? "#34D399" : "#9BA0A8",
              boxShadow: `inset 0 0 0 1px ${active ? "rgba(52,211,153,0.22)" : "rgba(155,160,168,0.22)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: active ? "#34D399" : "#9BA0A8",
                boxShadow: active ? "0 0 6px #34D399" : "none",
              }}
            />
            {active ? "Active" : "Inactive"}
          </span>

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 p-2 rounded-2xl text-[#8A90A0] hover:text-[#E8E6E1] transition-colors"
            style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Toolbar: device switcher + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-2.5 border-b border-[#1A1F2B]">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-2xl soft-ring"
            style={{ background: "#0F131C" }}
          >
            {DEVICES.map((d, i) => {
              const active = d.id === device;
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-all"
                  style={{
                    background: active ? "#1B2130" : "transparent",
                    color: active ? "#F2F0EB" : "#7A8092",
                    boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "none",
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
              className="inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-[11.5px] transition-colors"
              style={{
                fontFamily: FONT.mono,
                color: copied ? "#34D399" : "#7A8092",
                background: copied ? "rgba(52,211,153,0.10)" : "#0F131C",
                boxShadow: `inset 0 0 0 1px ${copied ? "rgba(52,211,153,0.22)" : "#1A1F2B"}`,
              }}
              title="Copy template ID (C)"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              #{id || "—"}
            </button>

            <button
              onClick={openRaw}
              disabled={!html}
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50"
              style={{
                background: "#0F131C",
                color: "#DADEE7",
                boxShadow: "inset 0 0 0 1px #1A1F2B",
              }}
            >
              <ExternalLink size={12} />
              Open raw
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden" style={{ background: "#0B0E13" }}>
          <div className="w-full h-full flex items-center justify-center p-3 md:p-6 overflow-auto">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: "100%",
                maxWidth: `${currentWidth}px`,
                height: "100%",
                background: "#fff",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px #1A1F2B",
                transition: "max-width 0.25s ease",
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
        <div className="hidden md:flex items-center justify-between gap-3 px-5 py-2.5 border-t border-[#1A1F2B] text-[11px]"
          style={{ fontFamily: FONT.mono, color: "#5A6172" }}>
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
  <div className="p-5 md:p-6">
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}2E` }}
      >
        <Icon size={14} style={{ color: tone }} />
      </div>
      <span className="text-[11.5px] uppercase tracking-wider font-medium" style={{ color: "#6A7080" }}>
        {label}
      </span>
    </div>
    <p className="text-[28px] md:text-[32px] font-bold leading-none tracking-tight"
      style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>
      {value}
    </p>
  </div>
);

export default Templates;