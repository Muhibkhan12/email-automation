// pages/User/Recipients.tsx — recipients for the logged-in user only
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useRecipients } from "../../contexts/RecipientsContext";
import type { RecipientStatus } from "../../types/RecipientTypes";
import {
  Search, Users, MailCheck, MailX, MailWarning, Menu,
  ChevronLeft, ChevronRight, ArrowLeft, Inbox, Plus,
  Copy, Check, Mail, X, CheckSquare, Square,
} from "lucide-react";

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
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

const STATUS_STYLES: Record<RecipientStatus, { bg: string; fg: string; ring: string }> = {
  Pending: { bg: "rgba(156,163,180,0.12)", fg: T.textMuted, ring: "rgba(156,163,180,0.28)" },
  Queued:  { bg: T.infoSoft,              fg: T.info,       ring: T.infoBorder },
  Sending: { bg: T.warnSoft,              fg: T.warn,       ring: T.warnBorder },
  Sent:    { bg: T.successSoft,           fg: T.success,    ring: T.successBorder },
  Failed:  { bg: T.dangerSoft,            fg: T.danger,     ring: T.dangerBorder },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Pending", "Queued", "Sending", "Sent", "Failed"];

const AVATAR_HUES = ["#6366F1", "#38BDF8", "#22C55E", "#F59E0B", "#A78BFA", "#EC4899", "#06B6D4"];
const hueFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
};

/* ─────────────── primitives ─────────────── */

const StatusPill: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
      {status}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
  accentSoft?: string;
}> = ({ label, value, icon: Icon, accent = T.brand, accentSoft = T.brandSoft }) => (
  <div className="rounded-xl p-3.5 md:p-4" style={{ background: T.surface, boxShadow: RING }}>
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center mb-2.5"
      style={{ background: accentSoft, color: accent }}
    >
      <Icon size={14} />
    </div>
    <p className="text-[22px] md:text-[24px] font-semibold tracking-tight leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>{label}</p>
  </div>
);

const Avatar: React.FC<{ label: string; seed: string }> = ({ label, seed }) => {
  const hue = hueFor(seed);
  const initial = label.trim()?.[0]?.toUpperCase() || "?";
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-semibold"
      style={{
        background: `linear-gradient(135deg, ${hue}40, ${hue}10)`,
        color: T.text,
        boxShadow: `inset 0 0 0 1px ${hue}40`,
      }}
    >
      {initial}
    </div>
  );
};

const CopyChip: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1 text-[11px] transition-colors"
      style={{ fontFamily: FONT.mono, color: copied ? T.success : T.textFaint }}
      title={`Copy ${label ?? "value"}`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      <span className="truncate">{value}</span>
    </button>
  );
};

/* ─────────────── page ─────────────── */

const Recipients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get("uploadId");

  const {
    recipients, loading, error, getAllRecipients,
    total, pageCount, page, limit,
    summary, statusCounts,
  } = useRecipients();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    (p: number) => {
      getAllRecipients(
        p,
        limit,
        uploadId ? Number(uploadId) : undefined,
        debouncedQuery || undefined,
        filter === "All" ? undefined : filter
      );
    },
    [getAllRecipients, limit, uploadId, debouncedQuery, filter]
  );

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, debouncedQuery, filter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, filter, debouncedQuery, uploadId]);

  const filtered = recipients;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchPage(p);
  };

  const clearUploadFilter = () => navigate("/user/recipients");

  const toggleOne = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleAllVisible = useCallback(() => {
    setSelectedIds(() => {
      if (allVisibleSelected) return new Set();
      return new Set(filtered.map((r) => r.id));
    });
  }, [allVisibleSelected, filtered]);

  const copySelectedEmails = useCallback(() => {
    const emails = filtered
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.email)
      .filter(Boolean);
    if (emails.length) navigator.clipboard?.writeText(emails.join(", "));
  }, [filtered, selectedIds]);

  const clearSelection = () => setSelectedIds(new Set());

  const hasActiveFilters = query !== "" || filter !== "All";

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .rc-main::-webkit-scrollbar { width: 8px; }
        .rc-main::-webkit-scrollbar-track { background: transparent; }
        .rc-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .rc-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        @media (max-width: 767px) { .rc-table { display: none; } }
        @media (min-width: 768px) { .rc-list { display: none; } }
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

      <main className="rc-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

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
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Audience</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.brand }}>Recipients</span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Recipients
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  {uploadId
                    ? `Showing recipients from upload #${uploadId}.`
                    : "Everyone who belongs to your account."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadId && (
                <button
                  onClick={clearUploadFilter}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                  style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                >
                  <ArrowLeft size={13} /> Clear filter
                </button>
              )}
            </div>
          </header>

          {/* Loading */}
          {loading && recipients.length === 0 && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.brand, borderTopColor: "transparent" }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading recipients…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-16 rounded-xl"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}>
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.18)" }}
              >
                <MailX className="w-4 h-4" style={{ color: T.danger }} />
              </div>
              <p className="text-[13px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && recipients.length === 0 && !hasActiveFilters && (
            <div className="text-center py-20 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}>
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2 }}
              >
                <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {uploadId ? "No recipients for this upload" : "No recipients yet"}
              </p>
              <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {uploadId
                  ? "This file either hasn't been processed or has no valid rows."
                  : "Upload a CSV or Excel file to get started."}
              </p>
              <button
                onClick={() => navigate("/user/upload")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all hover:brightness-110"
                style={{ background: T.brand, color: "#fff" }}
              >
                <Plus size={13} /> Upload a file
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (recipients.length > 0 || hasActiveFilters) && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mb-5 md:mb-6">
                <StatCard label="Total recipients"  value={summary.total}   icon={Users}       accent={T.brand}   accentSoft={T.brandSoft} />
                <StatCard label="Sent"              value={summary.sent}    icon={MailCheck}   accent={T.success} accentSoft={T.successSoft} />
                <StatCard label="Pending / queued"  value={summary.pending} icon={MailWarning} accent={T.warn}    accentSoft={T.warnSoft} />
                <StatCard label="Failed"            value={summary.failed}  icon={MailX}       accent={T.danger}  accentSoft={T.dangerSoft} />
              </div>

              {/* Toolbar */}
              <div className="md:sticky md:top-3 md:z-20 mb-4">
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-lg p-2"
                  style={{ background: "rgba(17,19,25,0.9)", backdropFilter: "blur(10px)", boxShadow: RING }}
                >
                  <div
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 flex-1 min-w-0 transition-shadow"
                    style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
                    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
                  >
                    <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, email, or ID…"
                      className="w-full bg-transparent text-[12.5px] outline-none"
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

                  <div className="flex items-center gap-1 overflow-x-auto">
                    {FILTERS.map((f) => {
                      const active = filter === f;
                      const count = statusCounts[f] ?? 0;
                      return (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                          style={{
                            background: active ? T.brand : T.surface2,
                            color: active ? "#fff" : T.textMuted,
                            boxShadow: active ? "none" : `inset 0 0 0 1px ${T.borderSoft}`,
                          }}
                        >
                          {f}
                          {count > 0 && (
                            <span
                              className="text-[10px] px-1.5 rounded-full"
                              style={{
                                fontFamily: FONT.mono,
                                background: active ? "rgba(255,255,255,0.20)" : T.surfaceHi,
                                color: active ? "#fff" : T.textFaint,
                              }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setQuery(""); setFilter("All"); }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                        style={{ color: T.brand, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                      >
                        <X size={11} /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Selection bar */}
              {selectedIds.size > 0 && (
                <div
                  className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ background: T.brandSoft, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                >
                  <span className="text-[12.5px]" style={{ color: T.text }}>
                    <span style={{ fontFamily: FONT.mono, color: T.brand, fontWeight: 600 }}>{selectedIds.size}</span> selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySelectedEmails}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      <Copy size={11} /> Copy emails
                    </button>
                    <button
                      onClick={clearSelection}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      <X size={11} /> Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Table / list */}
              <div className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
                <div
                  className="flex flex-wrap items-center justify-between px-4 md:px-5 py-3 gap-2"
                  style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleAllVisible}
                      aria-label={allVisibleSelected ? "Deselect all" : "Select all"}
                      className="transition-colors hover:text-white"
                      style={{ color: allVisibleSelected ? T.brand : T.textMuted }}
                    >
                      {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                    <h2 className="text-[12.5px] font-semibold" style={{ color: T.text }}>
                      Recipients
                    </h2>
                  </div>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {pageCount.toLocaleString()} on this page
                  </span>
                </div>

                <div className="rc-table overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>
                        <th className="px-5 py-2.5 font-medium w-[40px]"></th>
                        <th className="px-3 py-2.5 font-medium w-[80px]">ID</th>
                        <th className="px-3 py-2.5 font-medium">Recipient</th>
                        <th className="px-5 py-2.5 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-16 text-center">
                            <div
                              className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                              style={{ background: T.surface2 }}
                            >
                              <Search className="w-4 h-4" style={{ color: T.textFaint }} />
                            </div>
                            <p className="text-[12.5px]" style={{ color: T.textMuted }}>No recipients match your search.</p>
                            <button
                              onClick={() => { setQuery(""); setFilter("All"); }}
                              className="mt-2.5 text-[11.5px] font-medium"
                              style={{ color: T.brand }}
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((r) => {
                          const selected = selectedIds.has(r.id);
                          return (
                            <tr
                              key={r.id}
                              className="transition-colors hover:bg-white/[0.02]"
                              style={{
                                borderTop: `1px solid ${T.borderSoft}`,
                                background: selected ? T.brandSoft : "transparent",
                              }}
                            >
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => toggleOne(r.id)}
                                  className="transition-colors"
                                  style={{ color: selected ? T.brand : T.textMuted }}
                                >
                                  {selected ? <CheckSquare size={14} /> : <Square size={14} />}
                                </button>
                              </td>
                              <td className="px-3 py-3">
                                <CopyChip value={`#${r.id}`} label="ID" />
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar label={r.name || r.email || "?"} seed={String(r.id)} />
                                  <div className="min-w-0">
                                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                      {r.name || "—"}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <Mail size={10} style={{ color: T.textFaint }} className="shrink-0" />
                                      <p className="text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                        {r.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <StatusPill status={r.status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <ul className="rc-list">
                  {filtered.length === 0 ? (
                    <li className="px-4 py-16 text-center">
                      <div
                        className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                        style={{ background: T.surface2 }}
                      >
                        <Search className="w-4 h-4" style={{ color: T.textFaint }} />
                      </div>
                      <p className="text-[12.5px]" style={{ color: T.textMuted }}>No recipients match.</p>
                      <button
                        onClick={() => { setQuery(""); setFilter("All"); }}
                        className="mt-2.5 text-[11.5px] font-medium"
                        style={{ color: T.brand }}
                      >
                        Clear filters
                      </button>
                    </li>
                  ) : (
                    filtered.map((r, i) => {
                      const selected = selectedIds.has(r.id);
                      return (
                        <li
                          key={r.id}
                          className="flex items-center gap-2.5 px-4 py-3 transition-colors"
                          style={{
                            borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}`,
                            background: selected ? T.brandSoft : "transparent",
                          }}
                        >
                          <button
                            onClick={() => toggleOne(r.id)}
                            className="shrink-0"
                            style={{ color: selected ? T.brand : T.textMuted }}
                          >
                            {selected ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>

                          <Avatar label={r.name || r.email || "?"} seed={String(r.id)} />

                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                              {r.name || "—"}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {r.email}
                            </p>
                          </div>

                          <StatusPill status={r.status} />
                        </li>
                      );
                    })
                  )}
                </ul>

                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3"
                  style={{ borderTop: `1px solid ${T.borderSoft}` }}
                >
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    Page <span style={{ color: T.text }}>{page}</span> of {totalPages}
                    {total > 0 && (
                      <>
                        {" · "}
                        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={page <= 1 || loading}
                      className="hidden md:inline-flex items-center rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      First
                    </button>
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      <ChevronLeft size={12} /> Prev
                    </button>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      Next <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={page >= totalPages || loading}
                      className="hidden md:inline-flex items-center rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Recipients;