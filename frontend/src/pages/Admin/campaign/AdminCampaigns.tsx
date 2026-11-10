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
  Filter, Sparkles, User as UserIcon, Trash2,
} from 'lucide-react';

/* ─────────────── design tokens (matches AdminDashboard) ─────────────── */

const T = {
  bg:          "#0E0F11",
  surface:     "#151618",
  surface2:    "#1B1C1F",
  surfaceHi:   "#232427",
  line:        "rgba(236,237,239,0.08)",
  lineStrong:  "rgba(236,237,239,0.14)",
  text:        "#ECEDEF",
  textMuted:   "#A1A4AB",
  textFaint:   "#6C7078",
  accent:      "#F0884D",
  accentSoft:  "rgba(240,136,77,0.12)",
  success:     "#5FB07A",
  warn:        "#D4A24C",
  danger:      "#D8665D",
  neutral1:    "#C9CBD0",
  neutral2:    "#8E9199",
  neutral3:    "#5E6169",
  neutral4:    "#44464C",
};

const FONT = {
  body: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.line}`;
const ICON = { size: 16, strokeWidth: 1.5 };

/* ─────────────── status map ─────────────── */

const STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }
> = {
  Draft:     { bg: T.surface2,                fg: T.textMuted, ring: T.line,                          label: "Draft",     Icon: FileEdit },
  Ready:     { bg: "rgba(201,203,208,0.10)",  fg: T.neutral1,  ring: "rgba(201,203,208,0.28)",       label: "Ready",     Icon: Rocket },
  Running:   { bg: "rgba(95,176,122,0.12)",   fg: T.success,   ring: "rgba(95,176,122,0.30)",        label: "Running",   Icon: Megaphone },
  Paused:    { bg: "rgba(212,162,76,0.12)",   fg: T.warn,      ring: "rgba(212,162,76,0.30)",        label: "Paused",    Icon: PauseCircle },
  Completed: { bg: "rgba(142,145,153,0.12)",  fg: T.neutral2,  ring: "rgba(142,145,153,0.30)",       label: "Completed", Icon: CheckCircle2 },
  Cancelled: { bg: "rgba(216,102,93,0.12)",   fg: T.danger,    ring: "rgba(216,102,93,0.30)",        label: "Cancelled", Icon: XCircle },
};

/* ─────────────── helpers (unchanged) ─────────────── */

const DELETABLE: Array<Campaign['status']> = ['Paused', 'Completed', 'Draft'];
const canDelete = (status: Campaign['status']) => DELETABLE.includes(status);

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
    deleteMine: deleteCampaignById,
  } = useCampaigns();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const closeDeleteDialog = () => {
    if (deleting) return;
    setCampaignToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    if (!canDelete(campaignToDelete.status)) {
      setDeleteError('Only paused or completed campaigns can be deleted.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCampaignById(campaignToDelete.id);
      setSelectedCampaign((cur) => (cur?.id === campaignToDelete.id ? null : cur));
      setCampaignToDelete(null);
    } catch (err: any) {
      setDeleteError(apiErrorMessage(err, 'Could not delete the campaign.'));
    } finally {
      setDeleting(false);
    }
  };

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

  const activeCampaigns = campaigns.filter((c) => c.status === 'Running').length;
  const hasActiveFilters = !!searchQuery || statusFilter !== 'all';
  const stagger = (i: number) => ({ "--i": i } as React.CSSProperties);

  return (
    <div
      className="ac-root flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        .ac-root { --ease: cubic-bezier(0.2, 0, 0, 1); }

        @keyframes enter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .enter { animation: enter 240ms var(--ease) both; animation-delay: calc(var(--i, 0) * 40ms); }

        .ac-root button, .ac-root a { transition-property: color, background-color, box-shadow, opacity; transition-duration: 120ms; transition-timing-function: var(--ease); }
        .ac-root button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .row-hover { transition: background-color 120ms var(--ease); }
        .row-hover:hover { background: rgba(236,237,239,0.03); }

        .btn-primary:hover { background: #FFFFFF; }
        .btn-quiet:hover { background: rgba(236,237,239,0.05); color: ${T.text}; }
        .btn-press:active { transform: scale(0.98); }

        .ac-main::-webkit-scrollbar { width: 8px; }
        .ac-main::-webkit-scrollbar-track { background: transparent; }
        .ac-main::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }

        select option { background: ${T.surface2}; color: ${T.text}; }

        @media (prefers-reduced-motion: reduce) {
          .enter { animation: none !important; }
          .btn-press:active { transform: none; }
        }
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
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1440 }}>

          {/* Header — dashboard style */}
          <header className="enter flex flex-col md:flex-row md:items-end justify-between gap-4" style={stagger(0)}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg btn-quiet"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu {...ICON} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "rgba(95,176,122,0.12)", color: T.success, fontFamily: FONT.mono }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    {activeCampaigns} running
                  </span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {campaigns.length} total
                  </span>
                </div>
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>
                  All campaigns
                </h1>
                <p className="mt-2 text-[12px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                  Every campaign across the platform, with live status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchAll()}
                title="Refresh"
                className="btn-quiet btn-press inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium"
                style={{ color: T.textMuted, background: T.surface, boxShadow: RING }}
              >
                <RefreshCw {...ICON} size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/admin/upload')}
                className="btn-primary btn-press inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ background: T.text, color: T.bg }}
              >
                <Plus size={14} strokeWidth={1.5} />
                New campaign
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="enter flex flex-col sm:flex-row sm:items-center gap-2" style={stagger(1)}>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0 transition-all"
              style={{ background: T.surface, boxShadow: RING }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.accent}, 0 0 0 3px ${T.accentSoft}`)}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = RING)}
            >
              <Search size={14} style={{ color: T.textFaint }} strokeWidth={1.5} className="shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, subject, owner, sender, or template…"
                className="w-full bg-transparent text-[12px] outline-none"
                style={{ color: T.text }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-[11px] px-1.5 py-0.5 rounded btn-quiet"
                  style={{ color: T.textMuted, fontFamily: FONT.mono }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <Filter size={12} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="pl-8 pr-3 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING, fontFamily: FONT.mono }}
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
                className="btn-quiet inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[12px] font-medium"
                style={{ background: T.surface, color: T.accent, boxShadow: RING }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.neutral2, borderTopColor: "transparent" }}
              />
              <p className="text-[12px] mt-3" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                Loading campaigns…
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-14 rounded-xl"
              style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.danger}55` }}
            >
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(216,102,93,0.12)", color: T.danger }}
              >
                <AlertTriangle size={22} strokeWidth={1.5} />
              </div>
              <p className="text-[12px] mb-3" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={() => fetchAll()}
                className="btn-quiet inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium"
                style={{ color: T.textMuted, boxShadow: RING }}
              >
                <RefreshCw {...ICON} size={14} /> Try again
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
                style={{ background: T.surface2, color: campaigns.length === 0 ? T.accent : T.textFaint }}
              >
                {campaigns.length === 0
                  ? <Sparkles size={22} strokeWidth={1.5} />
                  : <Inbox size={22} strokeWidth={1.5} />}
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match"}
              </p>
              <p className="text-[12px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
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
                className="btn-primary btn-press inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ background: T.text, color: T.bg }}
              >
                {campaigns.length === 0 ? (<><Plus size={14} strokeWidth={1.5} /> Create campaign</>) : "Clear filters"}
              </button>
            </div>
          )}

          {/* Campaign list */}
          {!loading && !error && filteredCampaigns.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  <span style={{ color: T.text }}>{filteredCampaigns.length}</span>{" "}
                  {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
                  {statusFilter !== 'all' && (
                    <> · filtered by <span style={{ color: T.accent }}>{STATUS_STYLES[statusFilter].label}</span></>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {filteredCampaigns.map((campaign, i) => {
                  const s = STATUS_STYLES[campaign.status];
                  const StatusIcon = s.Icon;
                  const owner = ownerLabelOf(campaign);
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className="enter group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer row-hover"
                      style={{
                        background: T.surface,
                        boxShadow: RING,
                        ...stagger(i + 2),
                      }}
                    >
                      <span
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                        style={{ background: s.fg, opacity: 0.85 }}
                      />

                      <div
                        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ml-1.5"
                        style={{ background: s.bg, color: s.fg }}
                      >
                        <StatusIcon size={15} strokeWidth={1.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-medium truncate text-[13px]" style={{ color: T.text }}>
                            {campaign.campaign_name}
                          </h3>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}`, fontFamily: FONT.mono }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[12px] truncate mt-1" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                          {campaign.subject || "—"}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                          <UserIcon size={11} strokeWidth={1.5} style={{ color: T.textFaint }} className="shrink-0" />
                          <span className="text-[12px] truncate" style={{ color: T.textMuted }}>
                            {owner.name}
                          </span>
                          {owner.sub && (
                            <span className="text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              · {owner.sub}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 hidden md:flex flex-col items-end gap-1">
                        <span className="text-[12px] whitespace-nowrap tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          {relativeTime(campaign.updated_at)}
                        </span>
                        <span className="text-[11px] tabular-nums" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                          #{campaign.id}
                        </span>
                      </div>

                      {canDelete(campaign.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError(null);
                            setCampaignToDelete(campaign);
                          }}
                          title="Delete campaign"
                          aria-label={`Delete ${campaign.campaign_name}`}
                          className="shrink-0 p-1.5 rounded-md btn-quiet"
                          style={{ color: T.textFaint }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      )}

                      <ChevronRight
                        {...ICON}
                        size={14}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: T.textFaint }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedCampaign && (
        <AdminCampaignModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Delete confirmation */}
      {campaignToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={closeDeleteDialog}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl p-5"
            style={{ background: T.surface, boxShadow: `inset 0 0 0 1px ${T.line}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(216,102,93,0.12)", boxShadow: `inset 0 0 0 1px rgba(216,102,93,0.30)` }}
              >
                <Trash2 size={15} strokeWidth={1.5} style={{ color: T.danger }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-medium" style={{ color: T.text }}>Delete campaign?</h2>
                <p className="text-[12px] mt-1.5 leading-5" style={{ color: T.textMuted }}>
                  <span style={{ color: T.text }}>{campaignToDelete.campaign_name}</span>, owned by{" "}
                  <span style={{ color: T.text }}>{ownerLabelOf(campaignToDelete).name}</span>, will be
                  permanently removed. This can't be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p
                className="mt-4 text-[12px] rounded-md px-3 py-2"
                style={{ background: "rgba(216,102,93,0.12)", color: T.danger, boxShadow: `inset 0 0 0 1px rgba(216,102,93,0.30)` }}
              >
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="btn-quiet btn-press px-3.5 py-2 rounded-lg text-[12px] font-medium disabled:opacity-50"
                style={{ color: T.textMuted, background: T.surface, boxShadow: RING }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="btn-press inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium disabled:opacity-60"
                style={{ background: T.danger, color: '#fff' }}
              >
                {deleting && (
                  <span
                    className="w-3 h-3 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                  />
                )}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;