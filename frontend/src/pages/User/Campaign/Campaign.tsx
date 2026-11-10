// UserCampaigns.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useCampaigns } from '../../../contexts/CampaignContext';
import {
  createCampaign,
  startCampaign,
  type Campaign,
  type CreateCampaignData,
} from '../../../services/CampaignService';
import { pauseCampaign, resumeCampaign } from '../../../services/WorkerService';
import Sidebar from '../Sidebar';
import CampaignModal from './CampaignModel';
import StartCampaignModal from './UserCampaignModal';
import {
  Menu, RefreshCw, Search, Plus, Megaphone, Rocket, PauseCircle,
  CheckCircle2, XCircle, FileEdit, ChevronRight, Inbox, AlertTriangle,
  Trash2, Pause, Play, Loader2, X,
} from 'lucide-react';

/* ─────────────── tokens ───────────────
   One graphite neutral ramp. One phosphor accent. Amber/red only for status.
*/
const T = {
  bg:         '#0B0C0E',
  surface:    '#111214',
  surface2:   '#16181B',
  surfaceHi:  '#1C1F23',
  border:     '#24282E',
  borderSoft: '#1B1E22',

  text:       '#E8EAED',
  textMuted:  '#9AA0A6',
  textFaint:  '#6B7075',

  accent:     '#6EE7A8',
  accentInk:  '#0B0C0E',
  accentLine: '#2E6B4D',

  ok:         '#6EE7A8',
  warn:       '#E0A64A',
  danger:     '#E06A6A',
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* ─────────────── status ─────────────── */

type UiStatus = 'DRAFT' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

type StatusMeta = {
  fg: string;
  dot: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const STATUS_META: Record<UiStatus, StatusMeta> = {
  DRAFT:     { fg: T.textMuted, dot: T.textFaint, label: "Draft",     Icon: FileEdit },
  READY:     { fg: T.textMuted, dot: T.textFaint, label: "Ready",     Icon: Rocket },
  RUNNING:   { fg: T.accent,    dot: T.accent,    label: "Running",   Icon: Megaphone },
  PAUSED:    { fg: T.warn,      dot: T.warn,      label: "Paused",    Icon: PauseCircle },
  COMPLETED: { fg: T.textMuted, dot: T.textFaint, label: "Completed", Icon: CheckCircle2 },
  CANCELLED: { fg: T.danger,    dot: T.danger,    label: "Cancelled", Icon: XCircle },
};

/* ─────────────── helpers ─────────────── */

const normalizeStatus = (s?: string): UiStatus => {
  const up = (s || '').toUpperCase() as UiStatus;
  return up in STATUS_META ? up : 'DRAFT';
};

const DELETABLE: UiStatus[] = ['PAUSED', 'COMPLETED', 'DRAFT'];
const canDelete = (s?: string) => DELETABLE.includes(normalizeStatus(s));

const relativeTime = (iso?: string) => {
  if (!iso) return "";
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
    deleteMine,
  } = useCampaigns();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | UiStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Keep only the id, so the modal always shows the freshest campaign from the list.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);

  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pause / resume state
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const selectedCampaign = useMemo(
    () => (selectedId === null ? null : campaigns.find((c) => c.id === selectedId) ?? null),
    [campaigns, selectedId]
  );

  /* Pause / resume — blocks double clicks, and ALWAYS refetches afterwards
     (even on error) so the row never stays on a stale status. */
  const changeState = async (campaign: Campaign, kind: 'pause' | 'resume') => {
    if (busyId !== null) return;
    setBusyId(campaign.id);
    setActionError(null);
    try {
      await (kind === 'pause' ? pauseCampaign : resumeCampaign)(campaign.id);
    } catch (err: any) {
      setActionError(
        apiErrorMessage(err, kind === 'pause' ? 'Could not pause the campaign.' : 'Could not resume the campaign.')
      );
    } finally {
      try { await fetchMine(); } catch { /* ignore */ }
      setBusyId(null);
    }
  };

  const handleStartCampaign = async (data: CreateCampaignData, startNow: boolean) => {
    const payload = {
      campaign_name: data.campaign_name,
      subject: data.subject,
      status: startNow ? ('READY' as const) : ('DRAFT' as const),
    };

    let created: Campaign;
    try {
      created = await createCampaign(payload as unknown as CreateCampaignData);
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
      await deleteMine(campaignToDelete.id);
      setSelectedId((cur) => (cur === campaignToDelete.id ? null : cur));
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
        const matchesStatus = statusFilter === 'all' || normalizeStatus(c.status) === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (c.campaign_name ?? '').toLowerCase().includes(q) ||
          (c.subject ?? '').toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  const statusOptions: Array<'all' | UiStatus> = [
    'all', 'DRAFT', 'READY', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED',
  ];

  const counts = useMemo(() => {
    const m: Record<'all' | UiStatus, number> = {
      all: campaigns.length, DRAFT: 0, READY: 0, RUNNING: 0, PAUSED: 0, COMPLETED: 0, CANCELLED: 0,
    };
    campaigns.forEach((c) => { m[normalizeStatus(c.status)] += 1; });
    return m;
  }, [campaigns]);

  const runningCount = counts.RUNNING;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .uc-main::-webkit-scrollbar { width: 8px; }
        .uc-main::-webkit-scrollbar-track { background: transparent; }
        .uc-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .uc-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        .uc-input::placeholder { color: ${T.textFaint}; }
        .uc-input:focus { outline: none; }
        .uc-seg:focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }

        select option { background: ${T.surface}; color: ${T.text}; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(11,12,14,0.72)' }}
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
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1200 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: runningCount > 0 ? T.accent : T.textFaint }}
                    />
                    {runningCount} running
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {campaigns.length} total
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Campaigns
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Everything you've sent, and everything in flight.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                title="Refresh"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                style={{ color: T.textMuted, border: HAIRLINE }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowStartModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                style={{ background: T.text, color: T.accentInk, border: `1px solid ${T.text}` }}
              >
                <Plus size={14} />
                New campaign
              </button>
            </div>
          </header>

          {/* Pause / resume error banner */}
          {actionError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 mb-5"
              style={{ background: 'rgba(224,106,106,0.06)', border: '1px solid rgba(224,106,106,0.28)' }}
            >
              <AlertTriangle size={14} style={{ color: T.danger }} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-[12.5px] leading-5" style={{ color: T.danger }}>{actionError}</p>
              <button
                onClick={() => setActionError(null)}
                aria-label="Dismiss"
                className="shrink-0 p-0.5 rounded"
                style={{ color: T.danger }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Query bar — search + segmented status filter */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject"
                className="uc-input w-full bg-transparent text-[12.5px] outline-none"
                style={{ color: T.text }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 text-[11px] px-1.5 py-0.5 rounded transition-colors duration-[120ms]"
                  style={{ color: T.textFaint }}
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className="flex items-center rounded-md p-0.5 overflow-x-auto"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              {statusOptions.map((s) => {
                const active = statusFilter === s;
                const label = s === 'all' ? 'All' : STATUS_META[s].label;
                const count = counts[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="uc-seg inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] whitespace-nowrap transition-colors duration-[120ms]"
                    style={{
                      background: active ? T.surface2 : 'transparent',
                      color: active ? T.text : T.textMuted,
                      border: active ? HAIRLINE_SOFT : '1px solid transparent',
                    }}
                  >
                    {label}
                    <span
                      className="tabular-nums"
                      style={{ color: T.textFaint, fontFamily: FONT.mono, fontSize: 10.5 }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading — only on first load, so rows don't vanish during pause/resume refetch */}
          {loading && campaigns.length === 0 && (
            <div className="text-center py-16">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.border, borderTopColor: T.accent }}
              />
              <p className="text-[11.5px] mt-3" style={{ color: T.textFaint }}>Loading campaigns</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="text-center py-12 rounded-xl"
              style={{ border: HAIRLINE, background: T.surface }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <AlertTriangle size={16} style={{ color: T.danger }} />
              </div>
              <p className="text-[13px] mb-4" style={{ color: T.danger }}>{error}</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
                style={{ color: T.textMuted, border: HAIRLINE }}
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredCampaigns.length === 0 && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              <div
                className="w-11 h-11 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <Inbox size={18} style={{ color: T.textFaint }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: T.text }}>
                {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match'}
              </p>
              <p className="text-[12.5px] mt-1.5 mb-5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {campaigns.length === 0
                  ? 'Start your first campaign to see it here.'
                  : 'Try a different search or status filter.'}
              </p>
              <button
                onClick={() =>
                  campaigns.length === 0
                    ? setShowStartModal(true)
                    : (setSearchQuery(''), setStatusFilter('all'))
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms]"
                style={{ background: T.text, color: T.accentInk, border: `1px solid ${T.text}` }}
              >
                {campaigns.length === 0 ? (<><Plus size={13} /> New campaign</>) : 'Clear filters'}
              </button>
            </div>
          )}

          {/* Ledger */}
          {!error && filteredCampaigns.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
              {/* Table header strip */}
              <div
                className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_110px_150px_40px] items-center gap-4 px-5 py-2.5"
                style={{ borderBottom: HAIRLINE_SOFT }}
              >
                <span className="text-[11px]" style={{ color: T.textFaint }}>Campaign</span>
                <span className="text-[11px]" style={{ color: T.textFaint }}>Status</span>
                <span className="text-[11px] text-right" style={{ color: T.textFaint }}>Updated</span>
                <span className="text-[11px] text-right" style={{ color: T.textFaint }}>Actions</span>
                <span />
              </div>

              {filteredCampaigns.map((campaign, idx) => {
                const ui = normalizeStatus(campaign.status);
                const meta = STATUS_META[ui];
                const isRunning = ui === 'RUNNING';
                const isPaused = ui === 'PAUSED';
                const showDelete = canDelete(campaign.status);
                const isBusy = busyId === campaign.id;
                const anyBusy = busyId !== null;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedId(campaign.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedId(campaign.id)}
                    className="grid grid-cols-[minmax(0,1fr)_40px] md:grid-cols-[minmax(0,1fr)_140px_110px_150px_40px] items-center gap-4 px-5 py-3 cursor-pointer transition-colors duration-[120ms]"
                    style={{ borderTop: idx === 0 ? 'none' : HAIRLINE_SOFT }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Campaign cell — with phosphor left strip on running only */}
                    <div className="min-w-0 relative pl-3">
                      {isRunning && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                          style={{ background: T.accent }}
                        />
                      )}
                      <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>
                        {campaign.campaign_name}
                      </p>
                      <p className="text-[11.5px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {campaign.subject || '—'} <span style={{ opacity: 0.6 }}>· #{campaign.id}</span>
                      </p>
                    </div>

                    {/* Status */}
                    <span className="hidden md:inline-flex items-center gap-2 text-[12px]" style={{ color: meta.fg }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                      {meta.label}
                    </span>

                    {/* Updated */}
                    <span
                      className="hidden md:block text-[11.5px] text-right tabular-nums"
                      style={{ color: T.textFaint, fontFamily: FONT.mono }}
                    >
                      {relativeTime(campaign.updated_at)}
                    </span>

                    {/* Actions: pause / resume / delete */}
                    <div className="hidden md:flex items-center justify-end gap-1.5">
                      {isRunning && (
                        <button
                          onClick={(e) => { e.stopPropagation(); changeState(campaign, 'pause'); }}
                          disabled={anyBusy}
                          title="Pause campaign"
                          aria-label={`Pause ${campaign.campaign_name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(224,166,74,0.10)', color: T.warn, border: '1px solid rgba(224,166,74,0.28)' }}
                        >
                          {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Pause size={12} />}
                          {isBusy ? 'Pausing' : 'Pause'}
                        </button>
                      )}
                      {isPaused && (
                        <button
                          onClick={(e) => { e.stopPropagation(); changeState(campaign, 'resume'); }}
                          disabled={anyBusy}
                          title="Resume campaign"
                          aria-label={`Resume ${campaign.campaign_name}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: T.accent, color: T.accentInk, border: `1px solid ${T.accent}` }}
                        >
                          {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          {isBusy ? 'Resuming' : 'Resume'}
                        </button>
                      )}
                      {showDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError(null);
                            setCampaignToDelete(campaign);
                          }}
                          disabled={isBusy}
                          title="Delete campaign"
                          aria-label={`Delete ${campaign.campaign_name}`}
                          className="p-1.5 rounded-md transition-colors duration-[120ms] disabled:opacity-40"
                          style={{ color: T.textFaint }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.surfaceHi; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="flex justify-end">
                      <ChevronRight size={14} style={{ color: T.textFaint }} />
                    </div>
                  </div>
                );
              })}

              {/* Footer strip */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: HAIRLINE_SOFT }}
              >
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  Showing{' '}
                  <span className="tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
                    {filteredCampaigns.length}
                  </span>{' '}
                  of{' '}
                  <span className="tabular-nums" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                    {campaigns.length}
                  </span>
                  {statusFilter !== 'all' && (
                    <>
                      {' '}· {STATUS_META[statusFilter].label}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedCampaign && (
        <CampaignModal
          campaign={selectedCampaign as any}
          busy={busyId === selectedCampaign.id}
          actionError={actionError}
          onPause={() => changeState(selectedCampaign, 'pause')}
          onResume={() => changeState(selectedCampaign, 'resume')}
          onClose={() => setSelectedId(null)}
        />
      )}

      {showStartModal && (
        <StartCampaignModal
          onClose={() => setShowStartModal(false)}
          onSubmit={handleStartCampaign}
        />
      )}

      {/* Delete dialog */}
      {campaignToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(11,12,14,0.72)' }}
          onClick={closeDeleteDialog}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl p-5"
            style={{ background: T.surface, border: HAIRLINE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: T.surfaceHi, border: HAIRLINE }}
              >
                <Trash2 size={15} style={{ color: T.danger }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-medium" style={{ color: T.text }}>Delete campaign</h2>
                <p className="text-[12.5px] mt-1 leading-5" style={{ color: T.textMuted }}>
                  <span style={{ color: T.text }}>{campaignToDelete.campaign_name}</span> will be permanently
                  removed. This cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p
                className="mt-4 text-[12px] rounded-md px-3 py-2"
                style={{ border: HAIRLINE, color: T.danger }}
              >
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms] disabled:opacity-50"
                style={{ color: T.textMuted, border: HAIRLINE }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-colors duration-[120ms] disabled:opacity-60"
                style={{ background: 'transparent', color: T.danger, border: `1px solid ${T.border}` }}
              >
                {deleting && (
                  <span
                    className="w-3 h-3 border-2 rounded-full animate-spin"
                    style={{ borderColor: T.danger, borderTopColor: 'transparent' }}
                  />
                )}
                {deleting ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCampaigns;