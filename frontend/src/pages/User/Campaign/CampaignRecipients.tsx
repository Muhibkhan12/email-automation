// CampaignRecipients.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecipientsByCampaign } from "../../../services/RecipientService";
import Sidebar from "../Sidebar";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Adjust to match your actual CampaignRecipient model fields
interface Recipient {
  id: number;
  campaign_id: number;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

// Open-ended status → color mapping. Unknown statuses fall back to
// the default style instead of breaking, since we don't have a fixed enum here.
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Sent: { bg: "rgba(34,197,94,0.1)", text: "#22C55E" },
  Pending: { bg: "rgba(234,179,8,0.1)", text: "#EAB308" },
  Failed: { bg: "rgba(239,68,68,0.1)", text: "#EF4444" },
  Bounced: { bg: "rgba(239,68,68,0.1)", text: "#EF4444" },
  Unsubscribed: { bg: "#2A2E37", text: "#9BA0A8" },
};
const DEFAULT_STATUS_STYLE = { bg: "#2A2E37", text: "#9BA0A8" };

const getStatusStyle = (status?: string) =>
  (status && STATUS_COLORS[status]) || DEFAULT_STATUS_STYLE;

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
      setError(
        err?.response?.data?.detail || err?.message || "Failed to load recipients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const filteredRecipients = useMemo(
    () =>
      recipients.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [recipients, searchQuery]
  );

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .cr-main-content::-webkit-scrollbar { width: 6px; }
        .cr-main-content::-webkit-scrollbar-track { background: #0B0E12; }
        .cr-main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .cr-main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main
        className="cr-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8"
        style={{ background: "#12151B", height: "100vh", width: "100%" }}
      >
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-5 lg:mb-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                ☰
              </button>
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors text-sm"
                title="Back"
              >
                ←
              </button>
              <div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: "#FFFFFF" }}
                  className="text-xl md:text-2xl lg:text-3xl font-bold"
                >
                  Recipients
                </h1>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                  Campaign #{campaignId} · {recipients.length} total
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchRecipients()}
              className="p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors text-sm"
              title="Refresh"
            >
              ⟳
            </button>
          </div>

          {/* Search */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="🔍 Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] placeholder:text-[#6B727C] text-sm focus:border-[#FF6A39] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#6B727C] mt-2">Loading recipients...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-12 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button
                onClick={() => fetchRecipients()}
                className="text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredRecipients.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-[#2A2E37] bg-[#1B1E24]">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm text-[#6B727C]">
                {recipients.length === 0
                  ? "No recipients yet for this campaign."
                  : "No recipients match your search."}
              </p>
            </div>
          )}

          {/* Recipients table */}
          {!loading && !error && filteredRecipients.length > 0 && (
            <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2E37] bg-[#171A21]">
                    <th className="px-4 py-3 text-left font-medium text-[#9BA0A8] text-xs uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#9BA0A8] text-xs uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#9BA0A8] text-xs uppercase tracking-wide">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#9BA0A8] text-xs uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((recipient) => {
                    const style = getStatusStyle(recipient.status);
                    return (
                      <tr
                        key={recipient.id}
                        className="fade-in-up border-b border-[#2A2E37] last:border-b-0 hover:bg-[#171A21] transition-colors"
                      >
                        <td className="px-4 py-3 text-[#E8E6E1] font-medium">{recipient.name}</td>
                        <td className="px-4 py-3 text-[#9BA0A8] font-mono text-xs">{recipient.email}</td>
                        <td className="px-4 py-3 text-[#9BA0A8] font-mono text-xs">
                          {recipient.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[10px] px-2 py-1 rounded font-medium"
                            style={{ background: style.bg, color: style.text }}
                          >
                            {recipient.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CampaignRecipients;