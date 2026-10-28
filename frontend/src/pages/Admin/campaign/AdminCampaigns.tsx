// src/pages/Admin/AdminCampaigns.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../../../contexts/CampaignContext';
import type { Campaign } from '../../../types/CampaignTypes';
import AdminSidebar from '../AdminSidebar';
import AdminCampaignModal from './AdminCampaignModal';
import {
  Menu, RefreshCw, Search, Plus, Megaphone, Rocket, PauseCircle,
  CheckCircle2, XCircle, FileEdit, ChevronRight, Inbox, AlertTriangle,
  Filter, Sparkles, User as UserIcon,
} from 'lucide-react';

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
  purple:       "#A78BFA",
  purpleSoft:   "rgba(167,139,250,0.12)",
  purpleBorder: "rgba(167,139,250,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

/* ─────────────── status map ─────────────── */

const STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  Draft:     { bg: T.surface2,     fg: T.textMuted, ring: T.borderSoft,   label: "Draft",     Icon: FileEdit },
  Ready:     { bg: T.brandSoft,    fg: T.brand,     ring: T.brandBorder,  label: "Ready",     Icon: Rocket },
  Running:   { bg: T.successSoft,  fg: T.success,   ring: T.successBorder,label: "Running",   Icon: Megaphone },
  Paused:    { bg: T.warnSoft,     fg: T.warn,      ring: T.warnBorder,   label: "Paused",    Icon: PauseCircle },
  Completed: { bg: T.purpleSoft,   fg: T.purple,    ring: T.purpleBorder, label: "Completed", Icon: CheckCircle2 },
  Cancelled: { bg: T.dangerSoft,   fg: T.danger,    ring: T.dangerBorder, label: "Cancelled", Icon: XCircle },
};

/* ─────────────── helpers ─────────────── */

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

/** Resolve a friendly owner label from a campaign. Never shows a raw id. */
const ownerLabelOf = (campaign: Campaign): { name: string; sub: string } => {
  const u = campaign.user;
  const name = u?.username?.trim();
  const email = u?.email?.trim();
  if (name) return { name, sub: email ?? "" };
  if (email) return { name: email.split("@")[0], sub: email };
  return { name: "Unknown owner", sub: "" };
};

/* ─────────────── page ─────────────── */

const AdminCampaigns: React.FC = () => {
  const navigate = useNavigate();

  const {
    allCampaigns: campaigns,
    allLoading: loading,
    allError: error,
    fetchAll,
  } = useCampaigns();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.campaign_name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          (c.user?.email ?? '').toLowerCase().includes(q) ||
          (c.user?.username ?? '').toLowerCase().includes(q) ||
          (c.sender_account?.email ?? '').toLowerCase().includes(q) ||
          (c.template?.name ?? '').toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  const statusOptions: Array<'all' | Campaign['status']> = [
    'all', 'Draft', 'Ready', 'Running', 'Paused', 'Completed', 'Cancelled',
  ];

  const activeCampaigns = campaigns.filter(c => c.status === 'Running').length;
  const hasActiveFilters = !!searchQuery || statusFilter !== 'all';

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Kill outer body scroll so only <main> scrolls */
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .ac-main::-webkit-scrollbar { width: 8px; }
        .ac-main::-webkit-scrollbar-track { background: transparent; }
        .ac-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .ac-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ac-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
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
                  All campaigns
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Every campaign across the platform, with live status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => fetchAll()}
                title="Refresh"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/admin/upload')}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-[12.5px] transition-all hover:brightness-110"
                style={{ background: T.brand, color: "#fff", boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                <Plus size={14} />
                New campaign
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-5">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
            >
              <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, subject, owner, sender, or template…"
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: T.text }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                  style={{ color: T.textMuted }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <Filter size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All statuses' : STATUS_STYLES[s].label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors"
                style={{ background: T.surface2, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.brand, borderTopColor: "transparent" }}
              />
              <p className="text-[12px] mt-3" style={{ color: T.textMuted }}>Loading campaigns…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-14 rounded-xl"
              style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.dangerSoft, color: T.danger }}
              >
                <AlertTriangle size={22} />
              </div>
              <p className="text-[12.5px] mb-3" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={() => fetchAll()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredCampaigns.length === 0 && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2, color: campaigns.length === 0 ? T.brand : T.textFaint }}
              >
                {campaigns.length === 0
                  ? <Sparkles size={22} />
                  : <Inbox size={22} />}
              </div>
              <p className="text-[14px] font-semibold" style={{ color: T.text }}>
                {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match"}
              </p>
              <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {campaigns.length === 0
                  ? "Create a campaign to get started."
                  : "Try a different search or status filter."}
              </p>
              <button
                onClick={() =>
                  campaigns.length === 0
                    ? navigate('/admin/upload')
                    : (setSearchQuery(''), setStatusFilter('all'))
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium text-white transition-all hover:brightness-110"
                style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                {campaigns.length === 0 ? (<><Plus size={13} /> Create campaign</>) : "Clear filters"}
              </button>
            </div>
          )}

          {/* Campaign list */}
          {!loading && !error && filteredCampaigns.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text, fontFamily: FONT.mono }}>
                    {filteredCampaigns.length}
                  </span>{" "}
                  {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
                  {statusFilter !== 'all' && (
                    <> · filtered by <span style={{ color: T.brand }}>{STATUS_STYLES[statusFilter].label}</span></>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => {
                  const s = STATUS_STYLES[campaign.status];
                  const StatusIcon = s.Icon;
                  const owner = ownerLabelOf(campaign);
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className="group float-in relative flex items-center gap-3 p-3.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{
                        background: T.surface,
                        boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
                      }}
                    >
                      {/* Status rail */}
                      <span
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                        style={{ background: s.fg, opacity: 0.85 }}
                      />

                      <div
                        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center ml-1.5"
                        style={{ background: s.bg, color: s.fg }}
                      >
                        <StatusIcon size={15} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold truncate text-[13px]" style={{ color: T.text }}>
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
                        <p className="text-[11.5px] truncate mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                          {campaign.subject || "—"}
                        </p>

                        {/* Owner strip — now shows NAME, not id */}
                        <div className="flex items-center gap-1.5 mt-1 min-w-0">
                          <UserIcon size={10} style={{ color: T.textFaint }} className="shrink-0" />
                          <span className="text-[11px] font-medium truncate" style={{ color: T.textMuted }}>
                            {owner.name}
                          </span>
                          {owner.sub && (
                            <span className="text-[10px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              · {owner.sub}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 hidden md:flex flex-col items-end gap-0.5">
                        <span className="text-[11px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {relativeTime(campaign.updated_at)}
                        </span>
                        <span className="text-[10px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          #{campaign.id}
                        </span>
                      </div>

                      <ChevronRight
                        size={14}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5"
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
        <AdminCampaignModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

export default AdminCampaigns;