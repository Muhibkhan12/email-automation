// UserCampaigns.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../../../contexts/CampaignContext';
import type { Campaign } from '../../../services/CampaignService';
import Sidebar from '../Sidebar';
import CampaignModal from './CampaignModel';
import {
  Menu, RefreshCw, Search, Plus, Megaphone, Rocket, PauseCircle,
  CheckCircle2, XCircle, FileEdit, ChevronRight, Inbox, AlertTriangle,
  Filter, Sparkles,
} from 'lucide-react';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  Draft:     { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.22)", label: "Draft",     Icon: FileEdit },
  Ready:     { bg: "rgba(59,130,246,0.10)",  fg: "#60A5FA", ring: "rgba(59,130,246,0.22)",  label: "Ready",     Icon: Rocket },
  Running:   { bg: "rgba(34,197,94,0.10)",   fg: "#34D399", ring: "rgba(34,197,94,0.22)",   label: "Running",   Icon: Megaphone },
  Paused:    { bg: "rgba(234,179,8,0.10)",   fg: "#FBBF24", ring: "rgba(234,179,8,0.22)",   label: "Paused",    Icon: PauseCircle },
  Completed: { bg: "rgba(139,92,246,0.10)",  fg: "#A78BFA", ring: "rgba(139,92,246,0.22)",  label: "Completed", Icon: CheckCircle2 },
  Cancelled: { bg: "rgba(239,68,68,0.10)",   fg: "#F87171", ring: "rgba(239,68,68,0.22)",   label: "Cancelled", Icon: XCircle },
};

/* ───────────────────────── helpers ───────────────────────── */

const relativeTime = (iso: string) => {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* ───────────────────────── page ───────────────────────── */

const UserCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, loading, error, refetch } = useCampaigns();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.campaign_name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  const statusOptions: Array<'all' | Campaign['status']> = [
    'all', 'Draft', 'Ready', 'Running', 'Paused', 'Completed', 'Cancelled',
  ];

  const activeCampaigns = campaigns.filter(c => c.status === "Running").length;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .uc-main::-webkit-scrollbar { width: 10px; }
        .uc-main::-webkit-scrollbar-track { background: transparent; }
        .uc-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .uc-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

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
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="uc-main flex-1 overflow-y-auto" style={{ background: '#0B0E13', height: '100vh', width: '100%' }}>
        <div className="glow-top">
          <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ───────────────────────────── */}
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
                      {activeCampaigns} running
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {campaigns.length} total
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    Your campaigns
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Every campaign you've built, with live status.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  title="Refresh"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: "#141821", color: "#E8E6E1" }}
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => navigate('/upload')}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] transition-all hover:-translate-y-0.5"
                  style={{ background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
                >
                  <Plus size={15} />
                  New campaign
                </button>
              </div>
            </header>

            {/* ── Filters ──────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 md:mb-6">
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 flex-1 min-w-0 transition-all"
                style={{ background: "#141821", boxShadow: "inset 0 0 0 1px #232833" }}
              >
                <Search size={14} className="text-[#6B727C] shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or subject…"
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

              <div className="relative">
                <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B727C]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="pl-8 pr-3 py-2.5 rounded-2xl text-[13px] cursor-pointer transition-all focus:outline-none"
                  style={{ background: "#141821", color: "#E8E6E1", boxShadow: "inset 0 0 0 1px #232833" }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All statuses' : STATUS_STYLES[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Loading ──────────────────────────── */}
            {loading && (
              <div className="text-center py-16">
                <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B727C] mt-3">Loading campaigns…</p>
              </div>
            )}

            {/* ── Error ────────────────────────────── */}
            {!loading && error && (
              <div className="text-center py-16 rounded-3xl" style={{ background: "rgba(248,113,113,0.05)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(248,113,113,0.10)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                  <AlertTriangle className="w-5 h-5 text-[#F87171]" />
                </div>
                <p className="text-sm text-[#F87171] mb-3">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-medium transition-all soft-ring"
                  style={{ background: "#141821", color: "#E8E6E1" }}
                >
                  <RefreshCw size={13} /> Try again
                </button>
              </div>
            )}

            {/* ── Empty ────────────────────────────── */}
            {!loading && !error && filteredCampaigns.length === 0 && (
              <div className="text-center py-20 rounded-3xl" style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: "#1B2130", boxShadow: "inset 0 0 0 1px #232938" }}>
                  {campaigns.length === 0
                    ? <Sparkles className="w-6 h-6 text-[#FF6A39]" />
                    : <Inbox className="w-6 h-6 text-[#6A7080]" />
                  }
                </div>
                <p className="text-[14px] font-medium" style={{ color: "#F2F0EB" }}>
                  {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match"}
                </p>
                <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: "#7A8092" }}>
                  {campaigns.length === 0
                    ? "Upload a recipient list and pick a template to get started."
                    : "Try a different search or status filter."}
                </p>
                <button
                  onClick={() =>
                    campaigns.length === 0
                      ? navigate('/upload')
                      : (setSearchQuery(''), setStatusFilter('all'))
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}
                >
                  {campaigns.length === 0 ? (<><Plus size={14} /> Create campaign</>) : "Clear filters"}
                </button>
              </div>
            )}

            {/* ── Campaign list ───────────────────── */}
            {!loading && !error && filteredCampaigns.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <p className="text-[12px]" style={{ color: "#7A8092" }}>
                    <span style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>
                      {filteredCampaigns.length}
                    </span>{" "}
                    {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
                    {statusFilter !== 'all' && (
                      <> · filtered by <span style={{ color: "#FF6A39" }}>{STATUS_STYLES[statusFilter].label}</span></>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  {filteredCampaigns.map((campaign) => {
                    const s = STATUS_STYLES[campaign.status];
                    const StatusIcon = s.Icon;
                    return (
                      <div
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className="group float-in relative flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-3xl cursor-pointer transition-all hover:-translate-y-0.5"
                        style={{
                          background: "linear-gradient(180deg, #141821 0%, #10141D 100%)",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02)",
                        }}
                      >
                        {/* status accent rail */}
                        <span
                          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                          style={{ background: s.fg, opacity: 0.75, boxShadow: `0 0 12px ${s.fg}66` }}
                        />

                        {/* Icon plate */}
                        <div
                          className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ml-2 transition-transform group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${s.fg}22, ${s.fg}08)`,
                            boxShadow: `inset 0 0 0 1px ${s.ring}`,
                          }}
                        >
                          <StatusIcon size={18} />
                          <span className="hidden" style={{ color: s.fg }} />
                          <style>{``}</style>
                          {/* Icon color via inline style on the SVG children */}
                          <span className="sr-only" style={{ color: s.fg }} />
                        </div>

                        {/* Title + subject */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-[#F2F0EB] text-[14px] md:text-[15px] truncate">
                              {campaign.campaign_name}
                            </h3>
                            <span
                              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] md:text-[11px] font-medium"
                              style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg, boxShadow: `0 0 6px ${s.fg}` }} />
                              {s.label}
                            </span>
                          </div>
                          <p className="text-[11.5px] md:text-[12px] text-[#7A8092] truncate mt-1 font-mono">
                            {campaign.subject || "—"}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="shrink-0 hidden md:flex flex-col items-end gap-1">
                          <span className="text-[11px] text-[#7A8092] font-mono whitespace-nowrap">
                            {relativeTime(campaign.updated_at)}
                          </span>
                          <span className="text-[10px] text-[#3A404F] font-mono">
                            #{campaign.id}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-[#3A404F] group-hover:text-[#FF6A39] group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {selectedCampaign && (
        <CampaignModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

export default UserCampaigns;