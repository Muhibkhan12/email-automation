// UserCampaigns.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useCampaigns } from '../../../contexts/CampaignContext';
import {
  createCampaign,
  startCampaign,
  type Campaign,
  type CampaignStatus,
  type CreateCampaignData,
} from '../../../services/CampaignService';
import Sidebar from '../Sidebar';
import CampaignModal from './CampaignModel';
import StartCampaignModal from './UserCampaignModal';
import {
  Menu, RefreshCw, Search, Plus, Megaphone, Rocket, PauseCircle,
  CheckCircle2, XCircle, FileEdit, ChevronRight, Inbox, AlertTriangle,
  Filter, Sparkles,
} from 'lucide-react';

/* ─────────────── design tokens (aligned with other pages) ─────────────── */

const T = {
  bg:        "#0B0D14",
  surface:   "#131722",
  surface2:  "#1A1F2E",
  surfaceHi: "#222838",

  border:    "#2E364A",
  borderSoft:"#232A3C",

  text:      "#F2F4F8",
  textMuted: "#B6BECE",
  textFaint: "#8B93A7",

  brand:       "#7C7FF2",
  brandSoft:   "rgba(124,127,242,0.14)",
  brandBorder: "rgba(124,127,242,0.42)",

  success:      "#34D399",
  successSoft:  "rgba(52,211,153,0.14)",
  successBorder:"rgba(52,211,153,0.42)",

  warn:         "#FBBF24",
  warnSoft:     "rgba(251,191,36,0.14)",
  warnBorder:   "rgba(251,191,36,0.42)",

  danger:       "#F87171",
  dangerSoft:   "rgba(248,113,113,0.14)",
  dangerBorder: "rgba(248,113,113,0.42)",

  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.14)",
  infoBorder:   "rgba(56,189,248,0.42)",

  purple:       "#C4B5FD",
  purpleSoft:   "rgba(196,181,253,0.14)",
  purpleBorder: "rgba(196,181,253,0.42)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── status styles ─────────────── */

type StatusStyle = {
  bg: string; fg: string; ring: string; label: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STATUS_STYLES: Record<CampaignStatus, StatusStyle> = {
  DRAFT:     { bg: "rgba(139,147,167,0.14)", fg: T.textMuted, ring: "rgba(139,147,167,0.32)", label: "Draft",     Icon: FileEdit },
  READY:     { bg: T.infoSoft,               fg: T.info,      ring: T.infoBorder,             label: "Ready",     Icon: Rocket },
  RUNNING:   { bg: T.successSoft,            fg: T.success,   ring: T.successBorder,          label: "Running",   Icon: Megaphone },
  PAUSED:    { bg: T.warnSoft,               fg: T.warn,      ring: T.warnBorder,             label: "Paused",    Icon: PauseCircle },
  COMPLETED: { bg: T.purpleSoft,             fg: T.purple,    ring: T.purpleBorder,           label: "Completed", Icon: CheckCircle2 },
  CANCELLED: { bg: T.dangerSoft,             fg: T.danger,    ring: T.dangerBorder,           label: "Cancelled", Icon: XCircle },
};

/* ─────────────── helpers ─────────────── */

const normalizeStatus = (s?: string): CampaignStatus => {
  const up = (s || '').toUpperCase() as CampaignStatus;
  return up in STATUS_STYLES ? up : 'DRAFT';
};

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

const apiErrorMessage = (err: any, fallback: string) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d: any) => d?.msg || JSON.stringify(d)).join(', ');
  }
  return err?.response?.data?.message || err?.message || fallback;
};

/* ─────────────── page ─────────────── */

const UserCampaigns: React.FC = () => {
  const {
    myCampaigns: campaigns,
    myLoading: loading,
    myError: error,
    fetchMine,
    refetch,
  } = useCampaigns();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const handleStartCampaign = async (data: CreateCampaignData, startNow: boolean) => {
    const payload = {
      campaign_name: data.campaign_name,
      subject: data.subject,
      status: startNow ? ('READY' as const) : ('DRAFT' as const),
    };

    let created: Campaign;
    try {
      created = await createCampaign(payload as CreateCampaignData);
    } catch (err: any) {
      throw new Error(apiErrorMessage(err, 'Could not create the campaign.'));
    }

    if (startNow) {
      try {
        await startCampaign(created.id);
      } catch (err: any) {
        await fetchMine();
        throw new Error(
          `Campaign was created but couldn't be started: ${apiErrorMessage(err, 'start request failed')}`
        );
      }
    }

    await fetchMine();
  };

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchesStatus = statusFilter === 'all' || normalizeStatus(c.status) === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (c.campaign_name ?? '').toLowerCase().includes(q) ||
          (c.subject ?? '').toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  const statusOptions: Array<'all' | CampaignStatus> = [
    'all', 'DRAFT', 'READY', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED',
  ];

  const activeCampaigns = campaigns.filter(c => normalizeStatus(c.status) === "RUNNING").length;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .uc-main::-webkit-scrollbar { width: 8px; }
        .uc-main::-webkit-scrollbar-track { background: transparent; }
        .uc-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .uc-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        select option { background: ${T.surface}; color: ${T.text}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="uc-main flex-1 overflow-y-auto" style={{ background: T.bg, height: '100vh', width: '100%' }}>
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
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {activeCampaigns} running
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {campaigns.length} total
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Your campaigns
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Every campaign you've built, with live status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                title="Refresh"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowStartModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all hover:brightness-110"
                style={{ background: T.brand, color: "#fff", boxShadow: "0 6px 20px -8px rgba(124,127,242,0.7)" }}
              >
                <Plus size={14} />
                New campaign
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-5 md:mb-6">
            <div
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 flex-1 min-w-0 transition-shadow"
              style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.border}`)}
            >
              <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject…"
                className="w-full bg-transparent text-[12.5px] outline-none"
                style={{ color: T.text }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                  style={{ color: T.textFaint }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <Filter size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="pl-7 pr-3 py-2 rounded-lg text-[12.5px] cursor-pointer outline-none transition-shadow"
                style={{ background: T.surface, color: T.text, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.border}`)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All statuses' : STATUS_STYLES[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.brand, borderTopColor: "transparent" }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading campaigns…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.dangerSoft }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: T.danger }} />
              </div>
              <p className="text-[12.5px] mb-3" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredCampaigns.length === 0 && (
            <div
              className="text-center py-20 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2 }}
              >
                {campaigns.length === 0
                  ? <Sparkles className="w-5 h-5" style={{ color: T.brand }} />
                  : <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />}
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match"}
              </p>
              <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {campaigns.length === 0
                  ? "Start your first campaign to see it here."
                  : "Try a different search or status filter."}
              </p>
              <button
                onClick={() =>
                  campaigns.length === 0
                    ? setShowStartModal(true)
                    : (setSearchQuery(''), setStatusFilter('all'))
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all hover:brightness-110"
                style={{ background: T.brand, color: "#fff" }}
              >
                {campaigns.length === 0 ? (<><Plus size={13} /> Start campaign</>) : "Clear filters"}
              </button>
            </div>
          )}

          {/* List */}
          {!loading && !error && filteredCampaigns.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredCampaigns.length}</span>{" "}
                  {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
                  {statusFilter !== 'all' && (
                    <> · filtered by <span style={{ color: T.brand }}>{STATUS_STYLES[statusFilter].label}</span></>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => {
                  const s = STATUS_STYLES[normalizeStatus(campaign.status)];
                  const StatusIcon = s.Icon;
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className="group relative flex items-center gap-3 p-3.5 rounded-lg cursor-pointer transition-all hover:bg-white/[0.03]"
                      style={{ background: T.surface, boxShadow: RING }}
                    >
                      {/* Accent strip */}
                      <span
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                        style={{ background: s.fg, opacity: 0.75 }}
                      />

                      {/* Icon */}
                      <div
                        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center ml-2"
                        style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                      >
                        <StatusIcon size={14} />
                      </div>

                      {/* Title + subject */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-medium text-[13px] truncate" style={{ color: T.text }}>
                            {campaign.campaign_name}
                          </h3>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {campaign.subject || "—"}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="shrink-0 hidden md:flex flex-col items-end gap-0.5">
                        <span className="text-[10.5px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {relativeTime(campaign.updated_at)}
                        </span>
                        <span className="text-[10px]" style={{ color: T.textFaint, fontFamily: FONT.mono, opacity: 0.7 }}>
                          #{campaign.id}
                        </span>
                      </div>

                      <ChevronRight
                        size={14}
                        className="shrink-0 transition-all group-hover:translate-x-0.5"
                        style={{ color: T.textFaint }}
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

      {showStartModal && (
        <StartCampaignModal
          onClose={() => setShowStartModal(false)}
          onSubmit={handleStartCampaign}
        />
      )}
    </div>
  );
};

export default UserCampaigns;