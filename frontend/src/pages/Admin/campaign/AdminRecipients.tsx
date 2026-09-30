// src/pages/Admin/campaign/AdminCampaignRecipients.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Campaign } from '../../../types/CampaignTypes';
import { getCampaignById } from '../../../services/CampaignService';
import AdminSidebar from '../AdminSidebar';
import {
  Menu, ArrowLeft, RefreshCw, Search, Filter, Users, Inbox, AlertTriangle,
  FileSpreadsheet, Mail, CheckCircle2, MailWarning, MailX, Clock,
} from 'lucide-react';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_META: Record<string, { fg: string; bg: string; ring: string }> = {
  Pending:   { fg: "#9BA0A8", bg: "rgba(155,160,168,0.10)", ring: "rgba(155,160,168,0.22)" },
  Queued:    { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.22)" },
  Sending:   { fg: "#FBBF24", bg: "rgba(251,191,36,0.10)",  ring: "rgba(251,191,36,0.22)" },
  Sent:      { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.22)" },
  Delivered: { fg: "#34D399", bg: "rgba(52,211,153,0.10)",  ring: "rgba(52,211,153,0.22)" },
  Bounced:   { fg: "#FBBF24", bg: "rgba(251,191,36,0.10)",  ring: "rgba(251,191,36,0.22)" },
  Failed:    { fg: "#F87171", bg: "rgba(248,113,113,0.10)", ring: "rgba(248,113,113,0.22)" },
};
const FALLBACK = STATUS_META.Pending;

// Excel cell colors (ARGB)
const XLSX_STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  Pending:   { fg: 'FF6B7280', bg: 'FFF3F4F6' },
  Queued:    { fg: 'FF1D4ED8', bg: 'FFDBEAFE' },
  Sending:   { fg: 'FFB45309', bg: 'FFFEF3C7' },
  Sent:      { fg: 'FF1D4ED8', bg: 'FFDBEAFE' },
  Delivered: { fg: 'FF047857', bg: 'FFD1FAE5' },
  Bounced:   { fg: 'FFB45309', bg: 'FFFEF3C7' },
  Failed:    { fg: 'FFB91C1C', bg: 'FFFEE2E2' },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] ?? FALLBACK;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.fg }} />
      {status}
    </span>
  );
};

const AdminCampaignRecipients: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const PAGE_SIZE = 25;

  const load = async () => {
    if (!Number.isFinite(campaignId)) {
      setError('Invalid campaign id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCampaign(await getCampaignById(campaignId));
    } catch (err: any) {
      setError(err?.message || 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const recipients = campaign?.recipients ?? [];
  const logs = campaign?.email_logs ?? [];

  // Latest email log per recipient
  const lastLogByRecipient = useMemo(() => {
    const map: Record<number, (typeof logs)[number]> = {};
    for (const l of logs) {
      const prev = map[l.recipient_id];
      if (!prev || new Date(l.sent_at ?? 0).getTime() > new Date(prev.sent_at ?? 0).getTime()) {
        map[l.recipient_id] = l;
      }
    }
    return map;
  }, [logs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    recipients.forEach((r) => {
      const k = r.status || 'Pending';
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [recipients]);

  const statusOptions = useMemo(() => ['all', ...Object.keys(counts)], [counts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipients.filter((r) => {
      const okStatus = statusFilter === 'all' || (r.status || 'Pending') === statusFilter;
      const okSearch =
        !q || (r.name ?? '').toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q);
      return okStatus && okSearch;
    });
  }, [recipients, search, statusFilter]);

  useEffect(() => setPage(1), [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── XLSX export ── */

  const exportXlsx = async () => {
    if (exporting || filtered.length === 0) return;
    setExporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'MailForge';
      wb.created = new Date();

      const ws = wb.addWorksheet('Recipients');
      ws.columns = [
        { width: 6 },   // #
        { width: 28 },  // Name
        { width: 38 },  // Email
        { width: 14 },  // Status
        { width: 18 },  // Last email status
        { width: 22 },  // Last sent at
      ];

      const thin = { style: 'thin' as const, color: { argb: 'FFE5E7EB' } };
      const border = { top: thin, left: thin, bottom: thin, right: thin };

      // Title
      ws.mergeCells('A1:F1');
      const title = ws.getCell('A1');
      title.value = `${campaign?.campaign_name ?? 'Campaign'} — Recipients`;
      title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF111827' } };
      title.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(1).height = 30;

      // Subtitle
      ws.mergeCells('A2:F2');
      const sub = ws.getCell('A2');
      sub.value = `Campaign #${campaignId}  •  ${filtered.length.toLocaleString()} recipients  •  Exported ${new Date().toLocaleString()}`;
      sub.font = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } };
      sub.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(2).height = 18;

      // Header (row 4)
      const HEADER_ROW = 4;
      const headerRow = ws.getRow(HEADER_ROW);
      ['#', 'Name', 'Email', 'Status', 'Last Email', 'Last Sent At'].forEach((h, i) => {
        const c = headerRow.getCell(i + 1);
        c.value = h;
        c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6A39' } };
        c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i === 0 ? 0 : 1 };
        c.border = border;
      });
      headerRow.height = 24;

      // Data rows
      filtered.forEach((r, idx) => {
        const last = lastLogByRecipient[r.id];
        const row = ws.getRow(HEADER_ROW + 1 + idx);
        const zebra = idx % 2 === 1 ? 'FFF9FAFB' : 'FFFFFFFF';

        row.getCell(1).value = idx + 1;
        row.getCell(2).value = r.name || '—';
        row.getCell(3).value = r.email || '';
        row.getCell(4).value = r.status || 'Pending';
        row.getCell(5).value = last?.status ?? 'Not sent';
        row.getCell(6).value = last?.sent_at ? new Date(last.sent_at) : '—';
        row.getCell(6).numFmt = 'dd mmm yyyy, hh:mm';

        for (let col = 1; col <= 6; col++) {
          const c = row.getCell(col);
          c.font = { name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
          c.border = border;
          c.alignment = {
            vertical: 'middle',
            horizontal: col === 1 ? 'center' : 'left',
            indent: col === 1 ? 0 : 1,
          };
        }

        // Colored status cells
        [4, 5].forEach((col) => {
          const val = String(row.getCell(col).value);
          const m = XLSX_STATUS_COLORS[val];
          if (m) {
            const c = row.getCell(col);
            c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: m.fg } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: m.bg } };
          }
        });

        row.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: 'FF9CA3AF' } };
        row.height = 20;
      });

      // Freeze header + filter
      ws.views = [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }];
      ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: 6 } };

      // Print setup
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaignId}-recipients-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('XLSX export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const summary: { label: string; key: string; Icon: React.ComponentType<{ size?: number }>; fg: string }[] = [
    { label: 'Delivered', key: 'Delivered', Icon: CheckCircle2, fg: '#34D399' },
    { label: 'Sent',      key: 'Sent',      Icon: Mail,         fg: '#60A5FA' },
    { label: 'Pending',   key: 'Pending',   Icon: Clock,        fg: '#9BA0A8' },
    { label: 'Bounced',   key: 'Bounced',   Icon: MailWarning,  fg: '#FBBF24' },
    { label: 'Failed',    key: 'Failed',    Icon: MailX,        fg: '#F87171' },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: '#0B0E13' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .rc-main::-webkit-scrollbar { width: 10px; }
        .rc-main::-webkit-scrollbar-track { background: transparent; }
        .rc-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top { background: radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%); }
        select option { background: #141821; color: #E8E6E1; }
      `}</style>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="rc-main flex-1 overflow-y-auto" style={{ height: '100vh', width: '100%' }}>
        <div className="glow-top">
          <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div className="flex items-start gap-3 md:gap-4 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] soft-ring"
                  style={{ background: '#141821' }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <button
                    onClick={() => navigate('/admin/campaigns')}
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#7A8092] hover:text-[#F2F0EB] transition-colors mb-3"
                  >
                    <ArrowLeft size={13} /> All campaigns
                  </button>
                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: '-0.025em', color: '#F2F0EB' }}
                    className="text-[26px] md:text-[32px] lg:text-[38px] font-bold leading-[1.05] truncate"
                  >
                    Recipients
                  </h1>
                  <p className="mt-2 text-[14px] truncate" style={{ color: '#8A90A0' }}>
                    {campaign ? (
                      <>
                        {campaign.campaign_name}
                        <span className="text-[#3A404F] font-mono"> · #{campaign.id}</span>
                      </>
                    ) : (
                      'Loading campaign…'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium soft-ring hover:-translate-y-0.5 transition-all"
                  style={{ background: '#141821', color: '#E8E6E1' }}
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={exportXlsx}
                  disabled={filtered.length === 0 || exporting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[13px] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{ background: '#FF6A39', color: '#fff', boxShadow: '0 12px 30px -12px rgba(255,106,57,0.65)' }}
                >
                  {exporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileSpreadsheet size={15} />
                  )}
                  {exporting ? 'Exporting…' : 'Export XLSX'}
                </button>
              </div>
            </header>

            {/* Summary */}
            {!loading && !error && recipients.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <div className="rounded-2xl p-3.5 soft-ring" style={{ background: '#141821' }}>
                  <Users size={14} className="text-[#FF6A39] mb-2.5" />
                  <p className="text-lg font-semibold font-mono leading-none text-[#E8E6E1]">
                    {recipients.length.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mt-1.5">Total</p>
                </div>
                {summary.map(({ label, key, Icon, fg }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                    className="text-left rounded-2xl p-3.5 soft-ring transition-all hover:-translate-y-0.5"
                    style={{
                      background: '#141821',
                      boxShadow: statusFilter === key ? `inset 0 0 0 1px ${fg}66` : undefined,
                    }}
                  >
                    <span style={{ color: fg }}><Icon size={14} /></span>
                    <p className="text-lg font-semibold font-mono leading-none text-[#E8E6E1] mt-2.5">
                      {(counts[key] ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mt-1.5">{label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 flex-1 min-w-0"
                style={{ background: '#141821', boxShadow: 'inset 0 0 0 1px #232833' }}
              >
                <Search size={14} className="text-[#6B727C] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="shrink-0 text-[10px] text-[#6B727C] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#232833]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B727C]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-3 py-2.5 rounded-2xl text-[13px] cursor-pointer focus:outline-none"
                  style={{ background: '#141821', color: '#E8E6E1', boxShadow: 'inset 0 0 0 1px #232833' }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-16">
                <div className="w-7 h-7 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B727C] mt-3">Loading recipients…</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div
                className="text-center py-16 rounded-3xl"
                style={{ background: 'rgba(248,113,113,0.05)', boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.22)' }}
              >
                <AlertTriangle className="w-6 h-6 text-[#F87171] mx-auto mb-3" />
                <p className="text-sm text-[#F87171] mb-3">{error}</p>
                <button
                  onClick={load}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-medium soft-ring"
                  style={{ background: '#141821', color: '#E8E6E1' }}
                >
                  <RefreshCw size={13} /> Try again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div
                className="text-center py-20 rounded-3xl"
                style={{ background: 'linear-gradient(180deg, #141821 0%, #10141D 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}
              >
                <Inbox className="w-6 h-6 text-[#6A7080] mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#F2F0EB]">
                  {recipients.length === 0 ? 'No recipients yet' : 'No recipients match'}
                </p>
                <p className="text-[12px] mt-1.5 text-[#7A8092]">
                  {recipients.length === 0
                    ? 'Upload a recipient file to this campaign to add people.'
                    : 'Try a different search or status filter.'}
                </p>
              </div>
            )}

            {/* Table */}
            {!loading && !error && filtered.length > 0 && (
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #141821 0%, #10141D 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[640px]">
                    <thead>
                      <tr className="border-b border-[#1F242E] text-[10px] uppercase tracking-widest text-[#6B727C]">
                        <th className="px-5 py-3 font-medium">Recipient</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Last email</th>
                        <th className="px-5 py-3 font-medium text-right">ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F242E]">
                      {pageRows.map((r) => {
                        const last = lastLogByRecipient[r.id];
                        return (
                          <tr key={r.id} className="hover:bg-[#161B25] transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-[13px] text-[#F2F0EB] font-medium truncate max-w-[280px]">
                                {r.name || '—'}
                              </p>
                              <p className="text-[11.5px] text-[#7A8092] font-mono truncate max-w-[280px]">
                                {r.email}
                              </p>
                            </td>
                            <td className="px-5 py-3"><StatusPill status={r.status || 'Pending'} /></td>
                            <td className="px-5 py-3">
                              {last ? (
                                <div className="flex items-center gap-2">
                                  <StatusPill status={last.status} />
                                  <span className="text-[11px] text-[#6B727C] font-mono whitespace-nowrap">
                                    {formatDate(last.sent_at)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[12px] text-[#3A404F]">Not sent</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right text-[11px] text-[#3A404F] font-mono">#{r.id}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F242E]">
                  <p className="text-[12px] text-[#7A8092]">
                    <span className="font-mono text-[#F2F0EB]">{filtered.length.toLocaleString()}</span>{' '}
                    {filtered.length === 1 ? 'recipient' : 'recipients'}
                    {filtered.length !== recipients.length && ` of ${recipients.length.toLocaleString()}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-xl text-[12px] soft-ring text-[#C7C9CE] disabled:opacity-40"
                      style={{ background: '#0F131A' }}
                    >
                      Previous
                    </button>
                    <span className="text-[11px] text-[#6B727C] font-mono">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-xl text-[12px] soft-ring text-[#C7C9CE] disabled:opacity-40"
                      style={{ background: '#0F131A' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCampaignRecipients;