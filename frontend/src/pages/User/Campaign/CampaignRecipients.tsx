// CampaignRecipients.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecipientsByCampaign } from "../../../services/RecipientService";
import Sidebar from "../Sidebar";
import {
  Menu, ArrowLeft, RefreshCw, Search, Mail, Phone, Users,
  AlertTriangle, Inbox,
} from "lucide-react";

/* ─────────────── design tokens (aligned with rest of app) ─────────────── */

const T = {
  bg:         "#0B0C0E",
  surface:    "#111214",
  surface2:   "#16181B",
  surfaceHi:  "#1C1F23",
  border:     "#24282E",
  borderSoft: "#1B1E22",

  text:      "#E8EAED",
  textMuted: "#9AA0A6",
  textFaint: "#6B7075",

  accent:     "#6EE7A8",
  accentInk:  "#0B0C0E",
  accentLine: "#2E6B4D",

  ok:     "#6EE7A8",
  warn:   "#E0A64A",
  danger: "#E06A6A",
  info:   "#6EC1E7",
  purple: "#B39DE0",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* ─────────────── types & status ─────────────── */

interface Recipient {
  id: number;
  campaign_id: number;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; ring: string }> = {
  Sent:         { bg: "rgba(110,231,168,0.10)", fg: T.ok,     ring: "rgba(110,231,168,0.28)" },
  Delivered:    { bg: "rgba(110,231,168,0.10)", fg: T.ok,     ring: "rgba(110,231,168,0.28)" },
  Pending:      { bg: "rgba(224,166,74,0.10)",  fg: T.warn,   ring: "rgba(224,166,74,0.28)"  },
  Sending:      { bg: "rgba(224,166,74,0.10)",  fg: T.warn,   ring: "rgba(224,166,74,0.28)"  },
  Queued:       { bg: "rgba(110,193,231,0.10)", fg: T.info,   ring: "rgba(110,193,231,0.28)" },
  Failed:       { bg: "rgba(224,106,106,0.10)", fg: T.danger, ring: "rgba(224,106,106,0.28)" },
  Bounced:      { bg: "rgba(224,106,106,0.10)", fg: T.danger, ring: "rgba(224,106,106,0.28)" },
  Unsubscribed: { bg: "rgba(154,160,166,0.10)", fg: T.textMuted, ring: "rgba(154,160,166,0.28)" },
};

const DEFAULT_STATUS_STYLE = { bg: "rgba(154,160,166,0.10)", fg: T.textMuted, ring: "rgba(154,160,166,0.28)" };

const getStatusStyle = (status?: string) =>
  (status && STATUS_COLORS[status]) || DEFAULT_STATUS_STYLE;

/* ─────────────── primitives ─────────────── */

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.ring}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
      {status || "Unknown"}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  accentSoft: string;
}> = ({ label, value, icon: Icon, accent, accentSoft }) => (
  <div className="rounded-xl p-3.5" style={{ background: T.surface, border: HAIRLINE }}>
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center mb-2.5"
      style={{ background: accentSoft, color: accent }}
    >
      <Icon size={14} />
    </div>
    <p className="text-[22px] font-medium tracking-tight leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-1.5" style={{ color: T.textMuted }}>{label}</p>
  </div>
);

/* ─────────────── page ─────────────── */

const CampaignRecipients: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecipients = async () => {
    if (!campaignId || Number.isNaN(campaignId)) {
      setError("No campaign selected.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRecipientsByCampaign(campaignId);
      setRecipients(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load recipients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const filteredRecipients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)
    );
  }, [recipients, searchQuery]);

  const summary = useMemo(() => {
    const total = recipients.length;
    const missingPhone = recipients.filter((r) => !r.phone).length;
    const withStatus = recipients.filter((r) => !!r.status).length;
    return { total, missingPhone, withStatus };
  }, [recipients]);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        .cr-main::-webkit-scrollbar { width: 8px; }
        .cr-main::-webkit-scrollbar-track { background: transparent; }
        .cr-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .cr-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        .cr-input::placeholder { color: ${T.textFaint}; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) { .cr-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="cr-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8" style={{ maxWidth: 1180 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-2.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <button
                onClick={() => navigate(-1)}
                title="Back"
                className="mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Back"
                onMouseEnter={(e) => { e.currentTarget.style.color = T.text }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted }}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Campaign</span>
                  <span className="text-[10px]" style={{ color: T.border }}>/</span>
                  <span className="text-[10px] font-medium tracking-wider" style={{ color: T.accent, fontFamily: FONT.mono }}>
                    #{campaignId || "—"}
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Recipients
                </h1>
                <p className="mt-1 text-[13px]" style={{ color: T.textMuted }}>
                  Everyone queued for this campaign.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRecipients}
                disabled={loading}
                title="Refresh"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors duration-[120ms] disabled:opacity-50"
                style={{ color: T.textMuted, border: HAIRLINE }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.border, borderTopColor: T.accent }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading recipients…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-14 rounded-xl"
              style={{ background: "rgba(224,106,106,0.06)", border: "1px solid rgba(224,106,106,0.28)" }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(224,106,106,0.12)" }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: T.danger }} />
              </div>
              <p className="text-[12.5px] mb-3 font-medium" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={fetchRecipients}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors duration-[120ms]"
                style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
              >
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredRecipients.length === 0 && (
            <div className="text-center py-16 rounded-xl" style={{ background: T.surface, border: HAIRLINE }}>
              <div
                className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {recipients.length === 0 ? "No recipients yet" : "No recipients match"}
              </p>
              <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {recipients.length === 0
                  ? "Attach a recipient list to this campaign from the Upload page."
                  : "Try a different search term."}
              </p>
              {recipients.length === 0 ? (
                <button
                  onClick={() => navigate("/user/upload")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-medium transition-all hover:brightness-110"
                  style={{ background: T.accent, color: T.accentInk }}
                >
                  <Users size={13} /> Upload list
                </button>
              ) : (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[11.5px] font-medium transition-colors duration-[120ms] hover:opacity-70"
                  style={{ color: T.accent }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Content */}
          {!loading && !error && filteredRecipients.length > 0 && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <StatCard label="Total recipients" value={summary.total}        icon={Users} accent={T.accent} accentSoft="rgba(110,231,168,0.10)" />
                <StatCard label="With status"      value={summary.withStatus}   icon={Mail}  accent={T.info}   accentSoft="rgba(110,193,231,0.10)" />
                <StatCard label="Missing phone"    value={summary.missingPhone} icon={Phone} accent={T.warn}   accentSoft="rgba(224,166,74,0.10)" />
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0 transition-colors duration-[120ms]"
                  style={{ background: T.surface, border: HAIRLINE }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.border)}
                >
                  <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or phone…"
                    className="cr-input w-full bg-transparent text-[12.5px] outline-none"
                    style={{ color: T.text }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="shrink-0 text-[11px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
                      style={{ color: T.textFaint }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="hidden md:inline text-[11px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  {filteredRecipients.length} of {recipients.length}
                </span>
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: "640px" }}>
                    <thead className="sticky top-0 z-10" style={{ background: T.surface }}>
                      <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                        <th className="px-4 md:px-5 py-2.5 font-medium">Recipient</th>
                        <th className="px-3 py-2.5 font-medium">Email</th>
                        <th className="px-3 py-2.5 font-medium">Phone</th>
                        <th className="px-4 md:px-5 py-2.5 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecipients.map((r) => {
                        const initial = (r.name?.trim()?.[0] || r.email?.[0] || "?").toUpperCase();
                        return (
                          <tr
                            key={r.id}
                            className="transition-colors duration-[120ms]"
                            style={{ borderTop: HAIRLINE_SOFT }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td className="px-4 md:px-5 py-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-medium"
                                  style={{
                                    background: "rgba(110,231,168,0.10)",
                                    color: T.accent,
                                    border: "1px solid rgba(110,231,168,0.28)",
                                  }}
                                >
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                                    {r.name || "—"}
                                  </p>
                                  <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                    #{r.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Mail size={11} className="shrink-0" style={{ color: T.textFaint }} />
                                <span className="text-[11.5px] truncate" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                  {r.email || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {r.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <Phone size={11} style={{ color: T.textFaint }} />
                                  <span className="text-[11.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                                    {r.phone}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>—</span>
                              )}
                            </td>
                            <td className="px-4 md:px-5 py-3 text-right">
                              <StatusPill status={r.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer strip */}
                <div
                  className="flex items-center justify-between px-4 md:px-5 py-3"
                  style={{ borderTop: HAIRLINE_SOFT }}
                >
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    Campaign #{campaignId}
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint }}>
                    Showing <span style={{ color: T.text }}>{filteredRecipients.length}</span>{" "}
                    of <span style={{ color: T.text }}>{recipients.length}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CampaignRecipients;