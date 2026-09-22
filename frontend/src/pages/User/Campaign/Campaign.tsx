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

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0D1015" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-main-content::-webkit-scrollbar { width: 8px; }
        .mf-main-content::-webkit-scrollbar-track { background: transparent; }
        .mf-main-content::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px; }
        .mf-main-content::-webkit-scrollbar-thumb:hover { background: #333A48; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.25s ease-out; }
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

      <main
        className="mf-main-content flex-1 overflow-y-auto"
        style={{ background: '#0D1015', height: '100vh', width: '100%' }}
      >
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">

          {/* ── Header ───────────────────────────── */}
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
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#6B727C]">Workspace</span>
                  <ChevronRight size={10} className="text-[#3A3F4A]" />
                  <span className="text-[10px] font-medium tracking-widest uppercase text-[#FF6A39]">Campaigns</span>
                </div>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.02em" }}
                  className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white leading-tight"
                >
                  Your campaigns
                </h1>
                <p className="mt-1.5 text-[13px] md:text-sm text-[#9BA0A8]">
                  Every campaign you've built, with live status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                title="Refresh"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs md:text-sm font-medium transition-all"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#FF6A39] hover:bg-[#e85a2c] text-white transition-all shadow-[0_10px_30px_-10px_rgba(255,106,57,0.6)]"
              >
                <Plus size={16} />
                New campaign
              </button>
            </div>
          </header>

          {/* ── Filters ──────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 md:mb-6">
            <div className="flex items-center gap-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] focus-within:ring-[#FF6A39]/50 px-3 py-2.5 flex-1 min-w-0 transition-all">
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2.5 rounded-xl bg-[#141821] ring-1 ring-[#232833] text-[#E8E6E1] text-sm focus:ring-[#FF6A39]/50 focus:outline-none cursor-pointer transition-all"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All statuses' : STATUS_STYLES[s].label}
                </option>
              ))}
            </select>
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
            <div className="text-center py-16 rounded-2xl bg-red-500/5 ring-1 ring-red-500/20">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-red-500/10 ring-1 ring-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] text-[#E8E6E1] text-xs font-medium transition-all"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {/* ── Empty ────────────────────────────── */}
          {!loading && !error && filteredCampaigns.length === 0 && (
            <div className="text-center py-20 rounded-2xl bg-[#141821] ring-1 ring-[#232833]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#1F242E] ring-1 ring-[#2A2E37]">
                <Inbox className="w-6 h-6 text-[#6B727C]" />
              </div>
              <p className="text-sm text-[#E8E6E1] font-medium">
                {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match"}
              </p>
              <p className="text-xs text-[#6B727C] mt-1.5 mb-4">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A39] hover:bg-[#e85a2c] text-white text-xs font-medium transition-colors"
              >
                {campaigns.length === 0 ? (<><Plus size={14} /> Create campaign</>) : "Clear filters"}
              </button>
            </div>
          )}

          {/* ── Campaign list ───────────────────── */}
          {!loading && !error && filteredCampaigns.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <p className="text-xs text-[#6B727C]">
                  <span className="text-[#E8E6E1] font-medium">{filteredCampaigns.length}</span>{" "}
                  {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
                  {statusFilter !== 'all' && <> · filtered by <span className="text-[#FF6A39]">{STATUS_STYLES[statusFilter].label}</span></>}
                </p>
              </div>

              <div className="space-y-2.5 md:space-y-3">
                {filteredCampaigns.map((campaign) => {
                  const s = STATUS_STYLES[campaign.status];
                  const StatusIcon = s.Icon;
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className="group fade-in-up relative flex items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-2xl bg-[#141821] ring-1 ring-[#232833] hover:ring-[#333A48] hover:bg-[#161B25] cursor-pointer transition-all"
                    >
                      {/* status accent line */}
                      <span
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                        style={{ background: s.fg, opacity: 0.7 }}
                      />

                      {/* Icon plate */}
                      <div
                        className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ml-2"
                        style={{ background: s.bg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                      >
                        <StatusIcon size={18} />
                      </div>

                      {/* Title + subject */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-[#E8E6E1] text-sm md:text-[15px] truncate">
                            {campaign.campaign_name}
                          </h3>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium"
                            style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                          >
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[11.5px] md:text-xs text-[#6B727C] truncate mt-1 font-mono">
                          {campaign.subject || "—"}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="shrink-0 hidden md:flex flex-col items-end gap-1">
                        <span className="text-[11px] text-[#6B727C] font-mono whitespace-nowrap">
                          {relativeTime(campaign.updated_at)}
                        </span>
                        <span className="text-[10px] text-[#3A3F4A] font-mono">
                          #{campaign.id}
                        </span>
                      </div>

                      {/* Chevron */}
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-[#3A3F4A] group-hover:text-[#FF6A39] group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
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