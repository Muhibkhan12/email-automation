// pages/User/Recipients.tsx — recipients for the logged-in user only
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useRecipients } from "../../contexts/RecipientsContext";
import type { RecipientStatus } from "../../types/RecipientTypes";
import {
  Search, Users, MailCheck, MailX, MailWarning, Menu,
  ChevronLeft, ChevronRight, ArrowLeft, Inbox, Plus,
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

/* ────────────────────────────── Primitives ────────────────────────────── */

const StatusPill: React.FC<{ status: RecipientStatus }> = ({ status }) => {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
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

/* ────────────────────────────── Page ────────────────────────────── */

const Recipients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get("uploadId");

  const { recipients, loading, error, getAllRecipients, total, page, limit } = useRecipients();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refetch when the page mounts or uploadId changes.
  // NOTE: getAllRecipients needs to accept a 3rd `uploadId` arg — see context/service.
  useEffect(() => {
    getAllRecipients(1, 20, uploadId ? Number(uploadId) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  // NOTE: filtering only applies to the current page's data, since pagination
  // is server-side. Search/filter across ALL recipients would need a backend
  // search param instead — flag if you want that instead of per-page filtering.
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

  // NOTE: these summary counts only reflect the current page, not the full dataset,
  // since we only ever hold one page of recipients in state at a time.
  const summary = useMemo(() => {
    const sent = recipients.filter((r) => r.status === "Sent").length;
    const failed = recipients.filter((r) => r.status === "Failed").length;
    const pending = recipients.filter(
      (r) => r.status === "Pending" || r.status === "Queued" || r.status === "Sending"
    ).length;
    return { total: recipients.length, sent, failed, pending };
  }, [recipients]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    getAllRecipients(p, limit, uploadId ? Number(uploadId) : undefined);
  };

  const clearUploadFilter = () => {
    navigate("/user/recipients");
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0D1015" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .main-content::-webkit-scrollbar { width: 8px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #333A48; }
        .fade-in { animation: fadeIn 0.25s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
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

      <main className="main-content flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ───────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] transition-colors"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#6B727C]">Audience</span>
                  <ChevronRight size={10} className="text-[#3A3F4A]" />
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#FF6A39]">Recipients</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Recipients
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8]">
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs md:text-sm font-medium transition-all"
                >
                  <ArrowLeft size={14} /> Clear filter
                </button>
              )}
              <button
                onClick={() => navigate("/user/upload")}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#FF6A39] hover:bg-[#e85a2c] text-white transition-all shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
              >
                <Plus size={16} />
                Add recipients
              </button>
            </div>
          </header>

          {/* ── Loading ──────────────────────────────── */}
          {loading && (
            <div className="text-center py-16">
              <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6B727C] mt-3">Loading recipients…</p>
            </div>
          )}

          {/* ── Error ────────────────────────────────── */}
          {!loading && error && (
            <div className="text-center py-16 rounded-2xl bg-red-500/5 ring-1 ring-red-500/20">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-red-500/10 ring-1 ring-red-500/20">
                <MailX className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ── Empty ────────────────────────────────── */}
          {!loading && !error && recipients.length === 0 && (
            <div className="text-center py-20 rounded-2xl bg-[#141821] ring-1 ring-[#232833]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                <Inbox className="w-6 h-6 text-[#6B727C]" />
              </div>
              <p className="text-sm text-[#E8E6E1] font-medium">
                {uploadId ? "No recipients for this upload" : "No recipients yet"}
              </p>
              <p className="text-xs text-[#6B727C] mt-1.5 mb-4">
                {uploadId
                  ? "This file either hasn't been processed or has no valid rows."
                  : "Upload a CSV or Excel file to get started."}
              </p>
              <button
                onClick={() => navigate("/user/upload")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A39] hover:bg-[#e85a2c] text-white text-xs font-medium transition-colors"
              >
                <Plus size={14} /> Upload a file
              </button>
            </div>
          )}

          {/* ── Content ──────────────────────────────── */}
          {!loading && !error && recipients.length > 0 && (
            <div className="fade-in">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <StatCard label="On this page"        value={summary.total}   icon={Users}       accent="#FF6A39" />
                <StatCard label="Sent"                value={summary.sent}    icon={MailCheck}   accent="#34D399" />
                <StatCard label="Pending / queued"    value={summary.pending} icon={MailWarning} accent="#FBBF24" />
                <StatCard label="Failed"              value={summary.failed}  icon={MailX}       accent="#F87171" />
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 md:mb-5">
                <div className="flex items-center gap-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] focus-within:ring-[#FF6A39]/50 px-3 py-2.5 flex-1 min-w-0 transition-all">
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
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          active
                            ? "bg-[#FF6A39] text-white ring-1 ring-[#FF6A39] shadow-[0_6px_20px_-8px_rgba(255,106,57,0.6)]"
                            : "bg-[#141821] text-[#C7C9CE] ring-1 ring-[#232833] hover:bg-[#161B25] hover:ring-[#333A48]"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3.5 border-b border-[#1F242E] gap-2">
                  <h2 className="text-sm font-semibold text-[#E8E6E1]">
                    {filtered.length}{" "}
                    <span className="text-[#6B727C] font-normal">
                      {filtered.length === 1 ? "recipient" : "recipients"} shown
                    </span>
                  </h2>
                  <span className="text-xs text-[#6B727C] font-mono">
                    {total.toLocaleString()} total
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: "640px" }}>
                    <thead className="sticky top-0 bg-[#141821] z-10">
                      <tr className="text-[10px] uppercase tracking-widest text-[#6B727C]">
                        <th className="px-4 md:px-6 py-3 font-medium w-[100px]">ID</th>
                        <th className="px-4 md:px-6 py-3 font-medium">Recipient</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-16 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                              <Search className="w-5 h-5 text-[#6B727C]" />
                            </div>
                            <p className="text-sm text-[#9BA0A8]">No recipients match your search.</p>
                            <button
                              onClick={() => { setQuery(""); setFilter("All"); }}
                              className="mt-3 text-xs text-[#FF6A39] hover:text-[#e85a2c] font-medium"
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((r) => {
                          const initial = (r.name?.trim()?.[0] || r.email?.[0] || "?").toUpperCase();
                          return (
                            <tr
                              key={r.id}
                              className="border-t border-[#1F242E] hover:bg-[#161B25] transition-colors"
                            >
                              <td className="px-4 md:px-6 py-3.5">
                                <span className="text-[12px] font-mono text-[#6B727C]">#{r.id}</span>
                              </td>
                              <td className="px-4 md:px-6 py-3.5">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold text-white bg-gradient-to-br from-[#FF6A39]/30 to-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[13.5px] font-medium text-[#E8E6E1] truncate">
                                      {r.name || "—"}
                                    </p>
                                    <p className="text-[11.5px] text-[#6B727C] truncate font-mono">
                                      {r.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 md:px-6 py-3.5 text-right">
                                <StatusPill status={r.status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-t border-[#1F242E]">
                  <span className="text-xs text-[#9BA0A8] font-mono">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:ring-[#333A48] hover:text-[#E8E6E1] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-[#232833] transition-all"
                    >
                      <ChevronLeft size={13} />
                      Prev
                    </button>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:ring-[#333A48] hover:text-[#E8E6E1] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-[#232833] transition-all"
                    >
                      Next
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Recipients;