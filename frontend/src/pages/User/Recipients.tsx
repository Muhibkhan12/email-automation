// pages/User/Recipients.tsx — recipients for the logged-in user only
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useRecipients } from "../../contexts/RecipientsContext";
import type { RecipientStatus } from "../../types/RecipientTypes";
import {
  Search, Users, MailCheck, MailX, MailWarning, Menu,
  ChevronLeft, ChevronRight, ArrowLeft, Inbox, Plus,
  Copy, Check, Mail, X, CheckSquare, Square, Filter,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_STYLES: Record<RecipientStatus, { bg: string; fg: string; ring: string }> = {
  Pending: { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.20)" },
  Queued:  { bg: "rgba(59,130,246,0.10)",  fg: "#60A5FA", ring: "rgba(59,130,246,0.22)" },
  Sending: { bg: "rgba(234,179,8,0.10)",   fg: "#FBBF24", ring: "rgba(234,179,8,0.22)" },
  Sent:    { bg: "rgba(34,197,94,0.10)",   fg: "#34D399", ring: "rgba(34,197,94,0.22)" },
  Failed:  { bg: "rgba(239,68,68,0.10)",   fg: "#F87171", ring: "rgba(239,68,68,0.22)" },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Pending", "Queued", "Sending", "Sent", "Failed"];

/* Deterministic avatar hue so scanning the list is faster */
const AVATAR_HUES = ["#FF6A39", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F472B6", "#22D3EE"];
const hueFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
};

/* ────────────────────────────── Primitives ────────────────────────────── */

const StatusPill: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
      {status}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
}> = ({ label, value, icon: Icon, accent = "#FF6A39" }) => (
  <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] p-4 md:p-5 transition-colors hover:ring-[#333A48]">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <Icon size={16} className="text-white" />
    </div>
    <p className="text-2xl md:text-[26px] font-bold tracking-tight text-white font-mono leading-none">
      {value.toLocaleString()}
    </p>
    <p className="text-[11px] md:text-xs text-[#9BA0A8] mt-1.5">{label}</p>
  </div>
);

const Avatar: React.FC<{ label: string; seed: string }> = ({ label, seed }) => {
  const hue = hueFor(seed);
  const initial = label.trim()?.[0]?.toUpperCase() || "?";
  return (
    <div
      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold"
      style={{
        background: `linear-gradient(135deg, ${hue}40, ${hue}10)`,
        color: "#F2F0EB",
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
      className="inline-flex items-center gap-1.5 text-[11.5px] transition-colors"
      style={{ fontFamily: FONT.mono, color: copied ? "#34D399" : "#7A8092" }}
      title={`Copy ${label ?? "value"}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span className="truncate">{value}</span>
    </button>
  );
};

/* ────────────────────────────── Page ────────────────────────────── */

const Recipients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get("uploadId");

  const { recipients, loading, error, getAllRecipients, total, page, limit } = useRecipients();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Refetch when the page mounts or uploadId changes.
  useEffect(() => {
    getAllRecipients(1, 20, uploadId ? Number(uploadId) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  // Clear selection when the page or filter changes.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, filter, query, uploadId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipients.filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter;
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        String(r.id).includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [recipients, query, filter]);

  const summary = useMemo(() => {
    const sent = recipients.filter((r) => r.status === "Sent").length;
    const failed = recipients.filter((r) => r.status === "Failed").length;
    const pending = recipients.filter(
      (r) => r.status === "Pending" || r.status === "Queued" || r.status === "Sending"
    ).length;
    return { total: recipients.length, sent, failed, pending };
  }, [recipients]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: recipients.length };
    for (const r of recipients) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [recipients]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    getAllRecipients(p, limit, uploadId ? Number(uploadId) : undefined);
  };

  const clearUploadFilter = () => navigate("/user/recipients");

  /* Selection helpers */
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
    setSelectedIds((prev) => {
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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .rc-main::-webkit-scrollbar { width: 10px; }
        .rc-main::-webkit-scrollbar-track { background: transparent; }
        .rc-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .rc-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        /* Hide the desktop table on mobile, show the mobile list */
        @media (max-width: 767px) {
          .rc-table { display: none; }
        }
        @media (min-width: 768px) {
          .rc-list { display: none; }
        }
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

      <main className="rc-main flex-1 overflow-y-auto" style={{ background: "#0B0E13", height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ───────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141821" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="inline-flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#6B727C" }}>Audience</span>
                    <ChevronRight size={10} style={{ color: "#3A3F4A" }} />
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#FF6A39" }}>Recipients</span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold text-[#F2F0EB] leading-[1.05]"
                  >
                    Recipients
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium soft-ring transition-all hover:-translate-y-0.5"
                    style={{ background: "#141821", color: "#E8E6E1" }}
                  >
                    <ArrowLeft size={14} /> Clear filter
                  </button>
                )}
                <button
                  onClick={() => navigate("/user/upload")}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] transition-all hover:-translate-y-0.5"
                  style={{ background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
                >
                  <Plus size={15} /> Add recipients
                </button>
              </div>
            </header>

            {/* ── Loading ──────────────────────────────── */}
            {loading && recipients.length === 0 && (
              <div className="text-center py-16">
                <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B727C] mt-3">Loading recipients…</p>
              </div>
            )}

            {/* ── Error ────────────────────────────────── */}
            {!loading && error && (
              <div className="text-center py-16 rounded-3xl"
                style={{ background: "rgba(248,113,113,0.05)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(248,113,113,0.10)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                  <MailX className="w-5 h-5 text-[#F87171]" />
                </div>
                <p className="text-sm text-[#F87171]">{error}</p>
              </div>
            )}

            {/* ── Empty ────────────────────────────────── */}
            {!loading && !error && recipients.length === 0 && (
              <div className="text-center py-20 rounded-3xl"
                style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                  <Inbox className="w-6 h-6 text-[#6A7080]" />
                </div>
                <p className="text-[14px] font-medium" style={{ color: "#F2F0EB" }}>
                  {uploadId ? "No recipients for this upload" : "No recipients yet"}
                </p>
                <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: "#7A8092" }}>
                  {uploadId
                    ? "This file either hasn't been processed or has no valid rows."
                    : "Upload a CSV or Excel file to get started."}
                </p>
                <button
                  onClick={() => navigate("/user/upload")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                >
                  <Plus size={14} /> Upload a file
                </button>
              </div>
            )}

            {/* ── Content ──────────────────────────────── */}
            {!loading && !error && recipients.length > 0 && (
              <div className="float-in">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                  <StatCard label="On this page"     value={summary.total}   icon={Users}       accent="#FF6A39" />
                  <StatCard label="Sent"             value={summary.sent}    icon={MailCheck}   accent="#34D399" />
                  <StatCard label="Pending / queued" value={summary.pending} icon={MailWarning} accent="#FBBF24" />
                  <StatCard label="Failed"           value={summary.failed}  icon={MailX}       accent="#F87171" />
                </div>

                {/* Toolbar — sticky on md+ */}
                <div className="md:sticky md:top-3 md:z-20 mb-4 md:mb-5">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl p-2 md:p-2.5 soft-ring"
                    style={{ background: "rgba(20,24,33,0.85)", backdropFilter: "blur(10px)" }}
                  >
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 min-w-0 transition-all"
                      style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      onFocusCapture={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)")}
                      onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B")}
                    >
                      <Search size={14} className="text-[#6B727C] shrink-0" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, email, or ID…"
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

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {FILTERS.map((f) => {
                        const active = filter === f;
                        const count = statusCounts[f] ?? 0;
                        return (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                              active
                                ? "text-white"
                                : "text-[#C7C9CE] hover:text-[#E8E6E1]"
                            }`}
                            style={{
                              background: active ? "#FF6A39" : "#0F131C",
                              boxShadow: active
                                ? "0 6px 20px -8px rgba(255,106,57,0.6)"
                                : "inset 0 0 0 1px #1A1F2B",
                            }}
                          >
                            {f}
                            {count > 0 && (
                              <span
                                className="text-[10px] px-1.5 rounded-full"
                                style={{
                                  fontFamily: FONT.mono,
                                  background: active ? "rgba(255,255,255,0.20)" : "#171C28",
                                  color: active ? "#fff" : "#6A7080",
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
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-[#FF6A39] hover:text-[#e85a2c] transition-colors"
                          style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selection bar */}
                {selectedIds.size > 0 && (
                  <div
                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5 float-in"
                    style={{
                      background: "rgba(255,106,57,0.10)",
                      boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)",
                    }}
                  >
                    <span className="text-[12.5px] text-[#F2F0EB]">
                      <span style={{ fontFamily: FONT.mono }}>{selectedIds.size}</span> selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copySelectedEmails}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors"
                        style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        <Copy size={12} /> Copy emails
                      </button>
                      <button
                        onClick={clearSelection}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors"
                        style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        <X size={12} /> Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* List container */}
                <div className="rounded-3xl overflow-hidden soft-ring"
                  style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}>
                  <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3.5 border-b border-[#1A1F2B] gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleAllVisible}
                        aria-label={allVisibleSelected ? "Deselect all" : "Select all"}
                        className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                      >
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <h2 className="text-[13px] font-semibold" style={{ color: "#F2F0EB" }}>
                        {filtered.length}{" "}
                        <span style={{ color: "#7A8092", fontWeight: 400 }}>
                          {filtered.length === 1 ? "recipient" : "recipients"} shown
                        </span>
                      </h2>
                    </div>
                    <span className="text-[11.5px] text-[#6B727C]" style={{ fontFamily: FONT.mono }}>
                      {total.toLocaleString()} total
                    </span>
                  </div>

                  {/* Table (desktop) */}
                  <div className="rc-table overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest" style={{ color: "#7A8092" }}>
                          <th className="px-6 py-3 font-medium w-[44px]"></th>
                          <th className="px-3 py-3 font-medium w-[90px]">ID</th>
                          <th className="px-3 py-3 font-medium">Recipient</th>
                          <th className="px-6 py-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-16 text-center">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                                style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                                <Search className="w-5 h-5 text-[#6A7080]" />
                              </div>
                              <p className="text-sm" style={{ color: "#8A90A0" }}>No recipients match your search.</p>
                              <button
                                onClick={() => { setQuery(""); setFilter("All"); }}
                                className="mt-3 text-[12px] font-medium"
                                style={{ color: "#FF6A39" }}
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
                                className="border-t border-[#1A1F2B] transition-colors hover:bg-[#11151E]"
                                style={{ background: selected ? "rgba(255,106,57,0.06)" : "transparent" }}
                              >
                                <td className="px-6 py-3.5">
                                  <button
                                    onClick={() => toggleOne(r.id)}
                                    className="text-[#7A8092] hover:text-[#E8E6E1] transition-colors"
                                  >
                                    {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                                  </button>
                                </td>
                                <td className="px-3 py-3.5">
                                  <CopyChip value={`#${r.id}`} label="ID" />
                                </td>
                                <td className="px-3 py-3.5">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar label={r.name || r.email || "?"} seed={String(r.id)} />
                                    <div className="min-w-0">
                                      <p className="text-[13.5px] font-medium truncate" style={{ color: "#F2F0EB" }}>
                                        {r.name || "—"}
                                      </p>
                                      <div className="flex items-center gap-1.5">
                                        <Mail size={11} className="text-[#6A7080] shrink-0" />
                                        <p className="text-[11.5px] truncate" style={{ color: "#7A8092", fontFamily: FONT.mono }}>
                                          {r.email}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <StatusPill status={r.status} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* List (mobile) */}
                  <ul className="rc-list">
                    {filtered.length === 0 ? (
                      <li className="px-4 py-16 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                          style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                          <Search className="w-5 h-5 text-[#6A7080]" />
                        </div>
                        <p className="text-sm" style={{ color: "#8A90A0" }}>No recipients match.</p>
                        <button
                          onClick={() => { setQuery(""); setFilter("All"); }}
                          className="mt-3 text-[12px] font-medium"
                          style={{ color: "#FF6A39" }}
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
                            className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                            style={{
                              borderTop: i === 0 ? "none" : "1px solid #1A1F2B",
                              background: selected ? "rgba(255,106,57,0.06)" : "transparent",
                            }}
                          >
                            <button
                              onClick={() => toggleOne(r.id)}
                              className="shrink-0 text-[#7A8092]"
                            >
                              {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>

                            <Avatar label={r.name || r.email || "?"} seed={String(r.id)} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[13.5px] font-medium truncate" style={{ color: "#F2F0EB" }}>
                                  {r.name || "—"}
                                </p>
                              </div>
                              <p className="text-[11.5px] truncate" style={{ color: "#7A8092", fontFamily: FONT.mono }}>
                                {r.email}
                              </p>
                            </div>

                            <StatusPill status={r.status} />
                          </li>
                        );
                      })
                    )}
                  </ul>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t border-[#1A1F2B]">
                    <span className="text-[11.5px] text-[#7A8092]" style={{ fontFamily: FONT.mono }}>
                      Page <span style={{ color: "#F2F0EB" }}>{page}</span> of {totalPages}
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
                        className="hidden md:inline-flex items-center rounded-xl px-2.5 py-2 text-[11.5px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "#0F131C", color: "#C7C9CE", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        First
                      </button>
                      <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1 || loading}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "#0F131C", color: "#C7C9CE", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        <ChevronLeft size={13} /> Prev
                      </button>
                      <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages || loading}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "#0F131C", color: "#C7C9CE", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        Next <ChevronRight size={13} />
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={page >= totalPages || loading}
                        className="hidden md:inline-flex items-center rounded-xl px-2.5 py-2 text-[11.5px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "#0F131C", color: "#C7C9CE", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Recipients;