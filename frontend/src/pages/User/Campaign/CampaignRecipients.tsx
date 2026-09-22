// CampaignRecipients.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecipientsByCampaign } from "../../../services/RecipientService";
import Sidebar from "../Sidebar";
import {
  Menu, ArrowLeft, RefreshCw, Search, Mail, Phone, Users,
  AlertTriangle, Inbox, User as UserIcon,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ────────────────────── types & status ────────────────────── */

interface Recipient {
  id: number;
  campaign_id: number;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; ring: string }> = {
  Sent:         { bg: "rgba(34,197,94,0.10)",  fg: "#34D399", ring: "rgba(34,197,94,0.22)" },
  Delivered:    { bg: "rgba(34,197,94,0.10)",  fg: "#34D399", ring: "rgba(34,197,94,0.22)" },
  Pending:      { bg: "rgba(234,179,8,0.10)",  fg: "#FBBF24", ring: "rgba(234,179,8,0.22)" },
  Sending:      { bg: "rgba(234,179,8,0.10)",  fg: "#FBBF24", ring: "rgba(234,179,8,0.22)" },
  Queued:       { bg: "rgba(59,130,246,0.10)", fg: "#60A5FA", ring: "rgba(59,130,246,0.22)" },
  Failed:       { bg: "rgba(239,68,68,0.10)",  fg: "#F87171", ring: "rgba(239,68,68,0.22)" },
  Bounced:      { bg: "rgba(239,68,68,0.10)",  fg: "#F87171", ring: "rgba(239,68,68,0.22)" },
  Unsubscribed: { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.22)" },
};

const DEFAULT_STATUS_STYLE = { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.22)" };

const getStatusStyle = (status?: string) =>
  (status && STATUS_COLORS[status]) || DEFAULT_STATUS_STYLE;

/* ────────────────────── primitives ────────────────────── */

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }}
      />
      {status || "Unknown"}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] p-4">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <Icon size={15} className="text-white" />
    </div>
    <p className="text-2xl font-bold tracking-tight text-white font-mono leading-none">{value}</p>
    <p className="text-[11px] text-[#9BA0A8] mt-1.5">{label}</p>
  </div>
);

/* ────────────────────── page ────────────────────── */

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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0D1015" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .cr-main::-webkit-scrollbar { width: 8px; }
        .cr-main::-webkit-scrollbar-track { background: transparent; }
        .cr-main::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .cr-main::-webkit-scrollbar-thumb:hover { background: #333A48; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.25s ease-out; }
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

      <main className="cr-main flex-1 overflow-y-auto" style={{ background: "#0D1015", height: "100vh", width: "100%" }}>
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ─────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] transition-colors"
              >
                <Menu size={18} />
              </button>
              <button
                onClick={() => navigate(-1)}
                title="Back"
                className="mt-1 p-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] hover:ring-[#333A48] transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#6B727C]">Campaign</span>
                  <span className="text-[10px] text-[#3A3F4A]">/</span>
                  <span className="text-[10px] font-mono tracking-wider text-[#FF6A39]">
                    #{campaignId || "—"}
                  </span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Recipients
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8]">
                  Everyone queued for this campaign.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRecipients}
                title="Refresh"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs md:text-sm font-medium transition-all"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* ── Loading ────────────────────────────── */}
          {loading && (
            <div className="text-center py-16">
              <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6B727C] mt-3">Loading recipients…</p>
            </div>
          )}

          {/* ── Error ──────────────────────────────── */}
          {!loading && error && (
            <div className="text-center py-16 rounded-2xl bg-red-500/5 ring-1 ring-red-500/20">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-red-500/10 ring-1 ring-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={fetchRecipients}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs font-medium transition-all"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {/* ── Empty ──────────────────────────────── */}
          {!loading && !error && filteredRecipients.length === 0 && (
            <div className="text-center py-20 rounded-2xl bg-[#141821] ring-1 ring-[#232833]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                <Inbox className="w-6 h-6 text-[#6B727C]" />
              </div>
              <p className="text-sm text-[#E8E6E1] font-medium">
                {recipients.length === 0 ? "No recipients yet" : "No recipients match"}
              </p>
              <p className="text-xs text-[#6B727C] mt-1.5 mb-4">
                {recipients.length === 0
                  ? "Attach a recipient list to this campaign from the Upload page."
                  : "Try a different search term."}
              </p>
              {recipients.length === 0 ? (
                <button
                  onClick={() => navigate("/user/upload")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A39] hover:bg-[#e85a2c] text-white text-xs font-medium transition-colors"
                >
                  <Users size={14} /> Upload list
                </button>
              ) : (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#FF6A39] hover:text-[#e85a2c] font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* ── Content ────────────────────────────── */}
          {!loading && !error && filteredRecipients.length > 0 && (
            <div className="fade-in-up">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
                <StatCard label="Total recipients" value={summary.total}        icon={Users}    accent="#FF6A39" />
                <StatCard label="With status"      value={summary.withStatus}   icon={Mail}     accent="#60A5FA" />
                <StatCard label="Missing phone"    value={summary.missingPhone} icon={Phone}    accent="#FBBF24" />
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="flex items-center gap-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] focus-within:ring-[#FF6A39]/50 px-3 py-2.5 flex-1 min-w-0 transition-all">
                  <Search size={14} className="text-[#6B727C] shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or phone…"
                    className="w-full bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="shrink-0 text-[10px] text-[#6B727C] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#232833] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="hidden md:inline text-xs text-[#6B727C] font-mono whitespace-nowrap">
                  {filteredRecipients.length} of {recipients.length}
                </span>
              </div>

              {/* Table */}
              <div className="rounded-2xl bg-[#141821] ring-1 ring-[#232833] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: "640px" }}>
                    <thead className="sticky top-0 bg-[#141821] z-10">
                      <tr className="text-[10px] uppercase tracking-widest text-[#6B727C]">
                        <th className="px-4 md:px-6 py-3 font-medium">Recipient</th>
                        <th className="px-4 md:px-6 py-3 font-medium">Email</th>
                        <th className="px-4 md:px-6 py-3 font-medium">Phone</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecipients.map((r) => {
                        const initial = (r.name?.trim()?.[0] || r.email?.[0] || "?").toUpperCase();
                        return (
                          <tr
                            key={r.id}
                            className="border-t border-[#1F242E] hover:bg-[#161B25] transition-colors"
                          >
                            <td className="px-4 md:px-6 py-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold text-white bg-gradient-to-br from-[#FF6A39]/30 to-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13.5px] font-medium text-[#E8E6E1] truncate">
                                    {r.name || "—"}
                                  </p>
                                  <p className="text-[11px] text-[#6B727C] font-mono">
                                    #{r.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail size={13} className="shrink-0 text-[#6B727C]" />
                                <span className="text-[12.5px] font-mono text-[#C7C9CE] truncate">
                                  {r.email || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3.5">
                              {r.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone size={13} className="text-[#6B727C]" />
                                  <span className="text-[12.5px] font-mono text-[#C7C9CE]">{r.phone}</span>
                                </div>
                              ) : (
                                <span className="text-[12.5px] text-[#3A3F4A] font-mono">—</span>
                              )}
                            </td>
                            <td className="px-4 md:px-6 py-3.5 text-right">
                              <StatusPill status={r.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer strip */}
                <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-t border-[#1F242E]">
                  <span className="text-xs text-[#6B727C] font-mono">
                    Campaign #{campaignId}
                  </span>
                  <span className="text-xs text-[#6B727C]">
                    Showing <span className="text-[#E8E6E1] font-medium">{filteredRecipients.length}</span>{" "}
                    of <span className="text-[#E8E6E1] font-medium">{recipients.length}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CampaignRecipients;