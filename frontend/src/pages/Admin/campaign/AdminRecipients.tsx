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

/* ─────────────── status maps ─────────────── */

const STATUS_META: Record<string, { fg: string; bg: string; ring: string }> = {
  Pending:   { fg: T.textMuted, bg: T.surface2,   ring: T.borderSoft },
  Queued:    { fg: T.info,      bg: T.infoSoft,   ring: T.infoBorder },
  Sending:   { fg: T.warn,      bg: T.warnSoft,   ring: T.warnBorder },
  Sent:      { fg: T.info,      bg: T.infoSoft,   ring: T.infoBorder },
  Delivered: { fg: T.success,   bg: T.successSoft,ring: T.successBorder },
  Bounced:   { fg: T.warn,      bg: T.warnSoft,   ring: T.warnBorder },
  Failed:    { fg: T.danger,    bg: T.dangerSoft, ring: T.dangerBorder },
};
const FALLBACK = STATUS_META.Pending;

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

/* ─────────────── primitives ─────────────── */

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] ?? FALLBACK;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: m.fg }} />
      {status}
    </span>
  );
};

/* ─────────────── page ─────────────── */

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
        { width: 6 },
        { width: 28 },
        { width: 38 },
        { width: 14 },
        { width: 18 },
        { width: 22 },
      ];

      const thin = { style: 'thin' as const, color: { argb: 'FFE5E7EB' } };
      const border = { top: thin, left: thin, bottom: thin, right: thin };

      ws.mergeCells('A1:F1');
      const title = ws.getCell('A1');
      title.value = `${campaign?.campaign_name ?? 'Campaign'} — Recipients`;
      title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF111827' } };
      title.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(1).height = 30;

      ws.mergeCells('A2:F2');
      const sub = ws.getCell('A2');
      sub.value = `Campaign #${campaignId}  •  ${filtered.length.toLocaleString()} recipients  •  Exported ${new Date().toLocaleString()}`;
      sub.font = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } };
      sub.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(2).height = 18;

      const HEADER_ROW = 4;
      const headerRow = ws.getRow(HEADER_ROW);
      ['#', 'Name', 'Email', 'Status', 'Last Email', 'Last Sent At'].forEach((h, i) => {
        const c = headerRow.getCell(i + 1);
        c.value = h;
        c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i === 0 ? 0 : 1 };
        c.border = border;
      });
      headerRow.height = 24;

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

      ws.views = [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }];
      ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: 6 } };
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

  const summary: {
    label: string; key: string; Icon: React.ComponentType<{ size?: number }>; fg: string; soft: string;
  }[] = [
    { label: 'Delivered', key: 'Delivered', Icon: CheckCircle2, fg: T.success, soft: T.successSoft },
    { label: 'Sent',      key: 'Sent',      Icon: Mail,         fg: T.info,    soft: T.infoSoft },
    { label: 'Pending',   key: 'Pending',   Icon: Clock,        fg: T.textMuted, soft: T.surface2 },
    { label: 'Bounced',   key: 'Bounced',   Icon: MailWarning,  fg: T.warn,    soft: T.warnSoft },
    { label: 'Failed',    key: 'Failed',    Icon: MailX,        fg: T.danger,  soft: T.dangerSoft },
  ];

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Kill outer body scroll so only <main> scrolls */
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        .rc-main::-webkit-scrollbar { width: 8px; }
        .rc-main::-webkit-scrollbar-track { background: transparent; }
        .rc-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .rc-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

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

      <main className="rc-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <button
                  onClick={() => navigate('/admin/campaigns')}
                  className="inline-flex items-center gap-1 text-[11.5px] transition-colors mb-2 hover:opacity-80"
                  style={{ color: T.textMuted }}
                >
                  <ArrowLeft size={11} /> All campaigns
                </button>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight truncate" style={{ color: T.text }}>
                  Recipients
                </h1>
                <p className="mt-1 text-[13.5px] truncate" style={{ color: T.textMuted }}>
                  {campaign ? (
                    <>
                      {campaign.campaign_name}
                      <span style={{ color: T.textFaint, fontFamily: FONT.mono }}> · #{campaign.id}</span>
                    </>
                  ) : (
                    'Loading campaign…'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={load}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={exportXlsx}
                disabled={filtered.length === 0 || exporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-[12.5px] text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
                style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
              >
                {exporting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet size={12} />
                )}
                {exporting ? 'Exporting…' : 'Export XLSX'}
              </button>
            </div>
          </header>

          {/* Summary */}
          {!loading && !error && recipients.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-5">
              <div className="rounded-lg p-3" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                <Users size={12} style={{ color: T.brand }} className="mb-2" />
                <p className="text-[18px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                  {recipients.length.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>Total</p>
              </div>
              {summary.map(({ label, key, Icon, fg }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                  className="text-left rounded-lg p-3 transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: T.surface2,
                    boxShadow: statusFilter === key
                      ? `inset 0 0 0 1px ${fg}`
                      : `inset 0 0 0 1px ${T.borderSoft}`,
                  }}
                >
                  <span style={{ color: fg }}><Icon size={12} /></span>
                  <p className="text-[18px] font-semibold leading-none mt-2" style={{ color: T.text, fontFamily: FONT.mono }}>
                    {(counts[key] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>{label}</p>
                </button>
              ))}
            </div>
          )}

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: T.text }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
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
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: T.brand, borderTopColor: 'transparent' }}
              />
              <p className="text-[12px] mt-3" style={{ color: T.textMuted }}>Loading recipients…</p>
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
                onClick={load}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
                style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div
              className="text-center py-16 rounded-xl"
              style={{ background: T.surface, boxShadow: RING }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ background: T.surface2, color: T.textFaint }}
              >
                <Inbox size={22} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: T.text }}>
                {recipients.length === 0 ? 'No recipients yet' : 'No recipients match'}
              </p>
              <p className="text-[12px] mt-1.5 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                {recipients.length === 0
                  ? 'Upload a recipient file to this campaign to add people.'
                  : 'Try a different search or status filter.'}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: T.surface, boxShadow: RING }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest"
                      style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Recipient</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Status</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium">Last email</th>
                      <th className="px-4 md:px-5 py-2.5 font-medium text-right">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const last = lastLogByRecipient[r.id];
                      return (
                        <tr
                          key={r.id}
                          className="transition-colors hover:bg-white/[0.02]"
                          style={{ borderTop: `1px solid ${T.borderSoft}` }}
                        >
                          <td className="px-4 md:px-5 py-3">
                            <p className="text-[12.5px] font-medium truncate max-w-[280px]" style={{ color: T.text }}>
                              {r.name || '—'}
                            </p>
                            <p className="text-[11px] truncate max-w-[280px] mt-0.5"
                              style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {r.email}
                            </p>
                          </td>
                          <td className="px-4 md:px-5 py-3">
                            <StatusPill status={r.status || 'Pending'} />
                          </td>
                          <td className="px-4 md:px-5 py-3">
                            {last ? (
                              <div className="flex items-center gap-2">
                                <StatusPill status={last.status} />
                                <span className="text-[10.5px] whitespace-nowrap"
                                  style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                  {formatDate(last.sent_at)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11.5px]" style={{ color: T.textFaint }}>Not sent</span>
                            )}
                          </td>
                          <td className="px-4 md:px-5 py-3 text-right text-[10.5px]"
                            style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                            #{r.id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t"
                style={{ borderColor: T.borderSoft }}>
                <p className="text-[11px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text, fontFamily: FONT.mono }}>{filtered.length.toLocaleString()}</span>{' '}
                  {filtered.length === 1 ? 'recipient' : 'recipients'}
                  {filtered.length !== recipients.length && ` of ${recipients.length.toLocaleString()}`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    Previous
                  </button>
                  <span className="text-[11px] px-1.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCampaignRecipients;