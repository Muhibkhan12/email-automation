// pages/User/Recipients.tsx — recipients for the logged-in user only
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useRecipients } from "../../contexts/RecipientsContext";
import type { RecipientStatus } from "../../types/RecipientTypes";
import {
  Search, Users, MailCheck, MailX, MailWarning, Menu,
  ChevronLeft, ChevronRight, ArrowLeft, Inbox, Plus,
  Copy, Check, X, CheckSquare, Square, RefreshCw,
} from "lucide-react";

/* ─────────────── tokens ───────────────
   One graphite neutral ramp. One phosphor accent. Amber/red for status.
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

const STATUS_META: Record<RecipientStatus, { fg: string; dot: string }> = {
  Pending: { fg: T.textMuted, dot: T.textFaint },
  Queued:  { fg: T.textMuted, dot: T.textFaint },
  Sending: { fg: T.warn,      dot: T.warn },
  Sent:    { fg: T.ok,        dot: T.ok },
  Failed:  { fg: T.danger,    dot: T.danger },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Pending", "Queued", "Sending", "Sent", "Failed"];

/* ─────────────── primitives ─────────────── */

const StatusTag: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  const s = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] whitespace-nowrap" style={{ color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

const Avatar: React.FC<{ label: string }> = ({ label }) => {
  const initial = label.trim()?.[0]?.toUpperCase() || "?";
  return (
    <span
      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-medium"
      style={{ background: T.surfaceHi, color: T.textMuted, border: HAIRLINE }}
    >
      {initial}
    </span>
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
      className="inline-flex items-center gap-1 text-[11px] transition-colors duration-[120ms]"
      style={{ fontFamily: FONT.mono, color: copied ? T.accent : T.textFaint }}
      title={`Copy ${label ?? "value"}`}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = T.textMuted; }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = T.textFaint; }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      <span className="truncate">{value}</span>
    </button>
  );
};

const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    onClick={onChange}
    aria-label={label}
    aria-pressed={checked}
    className="transition-colors duration-[120ms]"
    style={{ color: checked ? T.accent : T.textFaint }}
  >
    {checked ? <CheckSquare size={14} /> : <Square size={14} />}
  </button>
);

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
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .rc-main::-webkit-scrollbar { width: 8px; }
        .rc-main::-webkit-scrollbar-track { background: transparent; }
        .rc-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .rc-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .rc-input::placeholder { color: ${T.textFaint}; }
        .rc-input:focus { outline: none; }
        .rc-seg:focus-visible, .rc-ctrl:focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }

        @media (max-width: 767px) { .rc-table { display: none; } }
        @media (min-width: 768px) { .rc-list { display: none; } }

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

      <main className="rc-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1200 }}>

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
                  <span className="text-[12px]" style={{ color: T.textMuted }}>Audience</span>
                  {uploadId && (
                    <>
                      <span style={{ color: T.border }}>|</span>
                      <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        upload #{uploadId}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Recipients
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  {uploadId
                    ? `Every valid address from upload #${uploadId}.`
                    : "Recipients across your campaigns and uploads."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadId && (
                <button
                  onClick={clearUploadFilter}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                  style={{ color: T.textMuted, border: HAIRLINE }}
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
                style={{ borderColor: T.border, borderTopColor: T.accent }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading recipients</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-12 rounded-xl"
              style={{ border: HAIRLINE, background: T.surface }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <MailX size={16} style={{ color: T.danger }} />
              </div>
              <p className="text-[13px] mb-4" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={() => fetchPage(page)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
                style={{ color: T.textMuted, border: HAIRLINE }}
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          )}

          {/* Empty — no data at all */}
          {!loading && !error && recipients.length === 0 && !hasActiveFilters && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              <div
                className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <Inbox size={18} style={{ color: T.textFaint }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {uploadId ? "No recipients for this upload" : "No recipients yet"}
              </p>
              <p className="text-[12.5px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {uploadId
                  ? "This file either hasn't been processed or has no valid rows."
                  : "Upload a CSV or Excel file to get started."}
              </p>
              <button
                onClick={() => navigate("/user/upload")}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                style={{ background: T.text, color: T.accentInk, border: `1px solid ${T.text}` }}
              >
                <Plus size={13} /> Upload a file
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (recipients.length > 0 || hasActiveFilters) && (
            <>
              {/* Stat row — numbers only, no icon tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total recipients", value: summary.total,   tone: T.text },
                  { label: "Sent",             value: summary.sent,    tone: T.ok },
                  { label: "Pending / queued", value: summary.pending, tone: T.warn },
                  { label: "Failed",           value: summary.failed,  tone: summary.failed ? T.danger : T.text },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-4" style={{ background: T.surface, border: HAIRLINE }}>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>{s.label}</p>
                    <p
                      className="text-[22px] font-medium mt-1.5 leading-none tabular-nums"
                      style={{ color: s.tone, fontFamily: FONT.mono }}
                    >
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Query bar */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
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
                    placeholder="Search by name, email, or ID"
                    className="rc-input w-full bg-transparent text-[12.5px] outline-none"
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
                  {FILTERS.map((f) => {
                    const active = filter === f;
                    const count = statusCounts[f] ?? 0;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="rc-seg inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] whitespace-nowrap transition-colors duration-[120ms]"
                        style={{
                          background: active ? T.surface2 : "transparent",
                          color: active ? T.text : T.textMuted,
                          border: active ? HAIRLINE_SOFT : "1px solid transparent",
                        }}
                      >
                        {f}
                        <span
                          className="tabular-nums"
                          style={{ color: T.textFaint, fontFamily: FONT.mono, fontSize: 10.5 }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setQuery(""); setFilter("All"); }}
                      className="rc-seg inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[12px] whitespace-nowrap transition-colors duration-[120ms]"
                      style={{ color: T.textMuted }}
                    >
                      <X size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger */}
              <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>

                {/* Ledger header strip — selection info sits here, inline */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  style={{ borderBottom: HAIRLINE_SOFT }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                    />
                    <span className="text-[11.5px]" style={{ color: T.textMuted }}>
                      {hasSelection ? (
                        <>
                          <span className="tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                            {selectedIds.size}
                          </span>{" "}
                          selected
                        </>
                      ) : (
                        "Recipients"
                      )}
                    </span>
                  </div>

                  {hasSelection ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copySelectedEmails}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors duration-[120ms]"
                        style={{ color: T.textMuted, border: HAIRLINE }}
                      >
                        <Copy size={11} /> Copy emails
                      </button>
                      <button
                        onClick={clearSelection}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors duration-[120ms]"
                        style={{ color: T.textMuted, border: HAIRLINE }}
                      >
                        <X size={11} /> Clear
                      </button>
                    </div>
                  ) : (
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: T.textFaint, fontFamily: FONT.mono }}
                    >
                      {pageCount.toLocaleString()} on this page
                    </span>
                  )}
                </div>

                {/* Desktop table */}
                <div className="rc-table overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px]" style={{ color: T.textFaint }}>
                        <th className="px-5 py-2.5 font-normal w-[40px]"></th>
                        <th className="px-3 py-2.5 font-normal w-[90px]">Id</th>
                        <th className="px-3 py-2.5 font-normal">Recipient</th>
                        <th className="px-5 py-2.5 font-normal text-right w-[110px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-16 text-center">
                            <div
                              className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                              style={{ background: T.surfaceHi, border: HAIRLINE }}
                            >
                              <Search size={16} style={{ color: T.textFaint }} />
                            </div>
                            <p className="text-[12.5px]" style={{ color: T.textMuted }}>No recipients match your search.</p>
                            <button
                              onClick={() => { setQuery(""); setFilter("All"); }}
                              className="mt-3 text-[11.5px] font-medium transition-colors duration-[120ms]"
                              style={{ color: T.textMuted, border: HAIRLINE, padding: "6px 12px", borderRadius: 6 }}
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
                              className="transition-colors duration-[120ms]"
                              style={{
                                borderTop: HAIRLINE_SOFT,
                                background: selected ? T.surface2 : "transparent",
                              }}
                              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = T.surface2; }}
                              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                            >
                              <td className="px-5 py-3">
                                <Checkbox
                                  checked={selected}
                                  onChange={() => toggleOne(r.id)}
                                  label={selected ? "Deselect recipient" : "Select recipient"}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <CopyChip value={`#${r.id}`} label="ID" />
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar label={r.name || r.email || "?"} />
                                  <div className="min-w-0">
                                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                      {r.name || "—"}
                                    </p>
                                    <p
                                      className="text-[11px] truncate mt-0.5"
                                      style={{ color: T.textFaint, fontFamily: FONT.mono }}
                                    >
                                      {r.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <StatusTag status={r.status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="rc-list">
                  {filtered.length === 0 ? (
                    <li className="px-4 py-16 text-center">
                      <div
                        className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                        style={{ background: T.surfaceHi, border: HAIRLINE }}
                      >
                        <Search size={16} style={{ color: T.textFaint }} />
                      </div>
                      <p className="text-[12.5px]" style={{ color: T.textMuted }}>No recipients match.</p>
                      <button
                        onClick={() => { setQuery(""); setFilter("All"); }}
                        className="mt-3 text-[11.5px] font-medium"
                        style={{ color: T.textMuted, border: HAIRLINE, padding: "6px 12px", borderRadius: 6 }}
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
                          className="flex items-center gap-3 px-4 py-3"
                          style={{
                            borderTop: i === 0 ? "none" : HAIRLINE_SOFT,
                            background: selected ? T.surface2 : "transparent",
                          }}
                        >
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleOne(r.id)}
                            label={selected ? "Deselect recipient" : "Select recipient"}
                          />
                          <Avatar label={r.name || r.email || "?"} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                              {r.name || "—"}
                            </p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {r.email}
                            </p>
                          </div>
                          <StatusTag status={r.status} />
                        </li>
                      );
                    })
                  )}
                </ul>

                {/* Footer strip — pagination */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  style={{ borderTop: HAIRLINE_SOFT }}
                >
                  <span className="text-[11.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    Page <span style={{ color: T.text }}>{page}</span> of {totalPages}
                    {total > 0 && (
                      <>
                        {" · "}
                        <span className="tabular-nums">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of{" "}
                        <span className="tabular-nums">{total.toLocaleString()}</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={page <= 1 || loading}
                      className="rc-ctrl hidden md:inline-flex items-center rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: T.textMuted, border: HAIRLINE }}
                    >
                      First
                    </button>
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || loading}
                      className="rc-ctrl inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: T.textMuted, border: HAIRLINE }}
                    >
                      <ChevronLeft size={12} /> Prev
                    </button>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="rc-ctrl inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: T.textMuted, border: HAIRLINE }}
                    >
                      Next <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={page >= totalPages || loading}
                      className="rc-ctrl hidden md:inline-flex items-center rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: T.textMuted, border: HAIRLINE }}
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