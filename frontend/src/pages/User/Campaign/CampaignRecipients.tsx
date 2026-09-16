// CampaignRecipients.tsx — recipients for ONE campaign (route: /campaigns/:id/recipients)
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useCampaigns } from "../../contexts/CampaignContext";
import type { RecipientStatus } from "../../types/CampaignTypes";
import {
  Search, Users, MailCheck, MailX, MailWarning, Menu, ArrowLeft,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_STYLES: Record<RecipientStatus, { bg: string; fg: string }> = {
  Pending: { bg: "rgba(107,114,124,0.15)", fg: "#9BA0A8" },
  Queued:  { bg: "rgba(59,130,246,0.15)",  fg: "#3B82F6" },
  Sending: { bg: "rgba(234,179,8,0.15)",   fg: "#EAB308" },
  Sent:    { bg: "rgba(34,197,94,0.15)",   fg: "#22C55E" },
  Failed:  { bg: "rgba(239,68,68,0.15)",   fg: "#EF4444" },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Pending", "Queued", "Sending", "Sent", "Failed"];

const CampaignRecipients = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, loading, error } = useCampaigns();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeCampaign = useMemo(
    () => campaigns.find((c) => String(c.id) === id) ?? null,
    [campaigns, id]
  );

  const emailLogByRecipientId = useMemo(() => {
    const map = new Map<number, { status: string; sent_at: string | null }>();
    activeCampaign?.email_logs.forEach((l) => {
      map.set(l.recipient_id, { status: l.status, sent_at: l.sent_at ?? null });
    });
    return map;
  }, [activeCampaign]);

  const recipients = activeCampaign?.recipients ?? [];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipients.filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter;
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q);
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

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-[#0B0E12]"
      style={{ fontFamily: FONT.body }}
    >
      <style>{`
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: #0B0E12; }
        .main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        .sidebar-overlay { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-slide { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } sidebar-slide`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#12151B] h-screen w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5 lg:mb-7">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <button
                onClick={() => navigate("/recipients")}
                className="inline-flex items-center gap-1 text-[10px] md:text-xs text-[#9BA0A8] hover:text-[#FF6A39] transition-colors mb-1"
              >
                <ArrowLeft size={12} /> All recipients
              </button>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#E8E6E1] tracking-tight">
                Recipients
              </h1>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#9BA0A8]">
                {activeCampaign
                  ? `Recipients for "${activeCampaign.campaign_name}"`
                  : "Campaign not found."}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#6B727C] mt-2">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Not found */}
        {!loading && !error && !activeCampaign && (
          <div className="text-center py-16 rounded-xl border border-[#2A2E37] bg-[#1B1E24]">
            <p className="text-sm text-[#9BA0A8] mb-3">Campaign not found.</p>
            <button
              onClick={() => navigate("/campaigns")}
              className="text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium"
            >
              Go to My Campaigns →
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && activeCampaign && (
          <>
            {/* Filter banner */}
            <div className="flex items-center justify-between mb-3 md:mb-4 px-3 py-2 rounded-lg border border-[#FF6A39]/30 bg-[#FF6A39]/10">
              <p className="text-xs text-[#E8E6E1] truncate">
                Showing recipients for{" "}
                <span className="font-semibold">{activeCampaign.campaign_name}</span>
              </p>
              <button
                onClick={() => navigate("/recipients")}
                className="text-xs text-[#FF6A39] hover:underline font-medium flex-shrink-0 ml-3"
              >
                View all
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-5 mb-3 md:mb-4 lg:mb-6">
              {[
                { label: "Total recipients", value: summary.total, icon: Users },
                { label: "Sent", value: summary.sent, icon: MailCheck },
                { label: "Pending / queued", value: summary.pending, icon: MailWarning },
                { label: "Failed", value: summary.failed, icon: MailX },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border border-[#2A2E37] bg-[#12151B] p-2.5 md:p-3 lg:p-5 shadow-sm"
                  >
                    <div className="w-6 h-6 md:w-7 md:h-7 lg:h-9 lg:w-9 rounded-lg flex items-center justify-center mb-1.5 md:mb-2 lg:mb-3 bg-[#FF6A39]/20">
                      <Icon
                        size={11}
                        className="md:w-[12px] md:h-[12px] lg:w-[14px] lg:h-[14px]"
                        style={{ color: "#FF6A39" }}
                      />
                    </div>
                    <p className="text-base md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-mono">
                      {s.value}
                    </p>
                    <p className="text-[9px] md:text-[10px] lg:text-[13px] mt-0.5 md:mt-1 text-[#9BA0A8]">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2.5 md:mb-3 lg:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-2 md:px-3 py-1.5 md:py-2 flex-1 min-w-[140px]">
                <Search
                  size={12}
                  className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FF6A39]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-1.5 md:px-2 lg:px-3 py-1 md:py-1.5 lg:py-2 text-[8px] md:text-[9px] lg:text-xs font-medium transition-colors border ${
                      filter === f
                        ? "bg-[#FF6A39] text-white border-[#FF6A39]"
                        : "bg-[#12151B] text-[#C7C9CE] border-[#2A2E37] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37] gap-2">
                <h2 className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  {filtered.length} {filtered.length === 1 ? "recipient" : "recipients"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px] md:min-w-[600px]">
                  <thead>
                    <tr className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wider text-[#6B727C]">
                      <th className="px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 font-medium">
                        Name
                      </th>
                      <th className="px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">
                        Status
                      </th>
                      <th className="px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">
                        Sent at
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-2 md:px-3 lg:px-5 py-6 md:py-8 lg:py-12 text-center text-[9px] md:text-xs lg:text-sm text-[#6B727C]"
                        >
                          No recipients match.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => {
                        const style = STATUS_STYLES[r.status];
                        const log = emailLogByRecipientId.get(r.id);
                        return (
                          <tr
                            key={r.id}
                            className="border-t border-[#2A2E37] hover:bg-[#1B1E24] transition-colors"
                          >
                            <td className="px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-3">
                              <p className="text-[9px] md:text-[10px] lg:text-[13.5px] font-medium text-[#D1D5DB] truncate">
                                {r.name}
                              </p>
                              <p className="text-[7px] md:text-[8px] lg:text-[12px] text-[#6B727C] truncate">
                                {r.email}
                              </p>
                            </td>
                            <td className="px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3">
                              <span
                                className="inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 text-[7px] md:text-[8px] lg:text-[11px] font-medium"
                                style={{ backgroundColor: style.bg, color: style.fg }}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3 text-[7px] md:text-[8px] lg:text-[12.5px] font-mono text-[#6B727C]">
                              {log?.sent_at
                                ? new Date(log.sent_at).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CampaignRecipients;