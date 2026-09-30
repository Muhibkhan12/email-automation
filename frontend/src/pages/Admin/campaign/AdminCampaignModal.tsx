// src/pages/Admin/campaign/AdminCampaignModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../../types/CampaignTypes';
import { getCampaignById } from '../../../services/CampaignService';
import {
  X, FileText, Mail, Send, XCircle, Clock, User as UserIcon,
  FileSpreadsheet, Eye, Users, LayoutTemplate, CheckCircle2,
  AtSign, BarChart3, ExternalLink, MailCheck, MailWarning, MailX,
  Calendar, Search, Filter, Inbox, RefreshCw,
} from 'lucide-react';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const CAMPAIGN_STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string }
> = {
  Draft:     { bg: "rgba(155,160,168,0.10)", fg: "#9BA0A8", ring: "rgba(155,160,168,0.22)", label: "Draft" },
  Ready:     { bg: "rgba(59,130,246,0.10)",  fg: "#60A5FA", ring: "rgba(59,130,246,0.22)",  label: "Ready" },
  Running:   { bg: "rgba(34,197,94,0.10)",   fg: "#34D399", ring: "rgba(34,197,94,0.22)",   label: "Running" },
  Paused:    { bg: "rgba(234,179,8,0.10)",   fg: "#FBBF24", ring: "rgba(234,179,8,0.22)",   label: "Paused" },
  Completed: { bg: "rgba(139,92,246,0.10)",  fg: "#A78BFA", ring: "rgba(139,92,246,0.22)",  label: "Completed" },
  Cancelled: { bg: "rgba(239,68,68,0.10)",   fg: "#F87171", ring: "rgba(239,68,68,0.22)",   label: "Cancelled" },
};

const FALLBACK_STATUS = CAMPAIGN_STATUS_STYLES.Draft;

const LOG_STATUS_META: Record<
  string,
  { fg: string; bg: string; ring: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Sent:      { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.22)",  Icon: Clock },
  Delivered: { fg: "#34D399", bg: "rgba(52,211,153,0.10)",  ring: "rgba(52,211,153,0.22)",  Icon: CheckCircle2 },
  Bounced:   { fg: "#FBBF24", bg: "rgba(251,191,36,0.10)",  ring: "rgba(251,191,36,0.22)",  Icon: MailWarning },
  Failed:    { fg: "#F87171", bg: "rgba(248,113,113,0.10)", ring: "rgba(248,113,113,0.22)", Icon: MailX },
  Pending:   { fg: "#9BA0A8", bg: "rgba(155,160,168,0.10)", ring: "rgba(155,160,168,0.22)", Icon: MailWarning },
  Queued:    { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)",  ring: "rgba(96,165,250,0.22)",  Icon: Clock },
  Sending:   { fg: "#FBBF24", bg: "rgba(251,191,36,0.10)",  ring: "rgba(251,191,36,0.22)",  Icon: MailWarning },
};
const FALLBACK_LOG = LOG_STATUS_META.Pending;

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

type Tab = 'overview' | 'recipients' | 'delivery' | 'template';

interface AdminCampaignModalProps {
  campaign: Campaign; // summary row from the list
  onClose: () => void;
  initialTab?: Tab;
}

const PAGE_SIZE = 10;

const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    const then = new Date(iso).getTime();
    const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? '0' : Number(n).toLocaleString();

/* ─────────────── Primitives ─────────────── */

const MetaPill: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; mono?: boolean }> = ({
  icon, children, mono,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-[#C7C9CE] bg-[#0F131A] ring-1 ring-[#232833] ${
      mono ? 'font-mono' : ''
    }`}
  >
    {icon}
    {children}
  </span>
);

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-3.5">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
      style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <Icon size={14} className="text-white" />
    </div>
    <p className="text-lg font-semibold font-mono leading-none text-[#E8E6E1]">{value}</p>
    <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mt-1.5">{label}</p>
  </div>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-[#0F131A] ring-1 ring-[#232833]">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-0.5">{label}</p>
      <div className="text-[12.5px] text-[#C7C9CE] min-w-0">{children}</div>
    </div>
  </div>
);

const SectionTitle: React.FC<{
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, right }) => (
  <div className="flex items-end justify-between gap-3 mb-3">
    <div>
      <h3 className="text-[13px] font-semibold text-[#F2F0EB] flex items-center gap-2" style={{ fontFamily: FONT.display }}>
        <Icon size={14} className="text-[#FF6A39]" />
        {title}
      </h3>
      {subtitle && <p className="text-[11px] text-[#6B727C] mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = LOG_STATUS_META[status] ?? FALLBACK_LOG;
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

/* ─────────────── Component ─────────────── */

const AdminCampaignModal: React.FC<AdminCampaignModalProps> = ({
  campaign: summary,
  onClose,
  initialTab = 'overview',
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);

  // Full record fetched via GET /campaigns/{id}
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Recipients tab state
  const [rSearch, setRSearch] = useState('');
  const [rStatus, setRStatus] = useState('all');
  const [rPage, setRPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    getCampaignById(summary.id)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => {
        if (!cancelled) setDetailError(err?.message || 'Failed to load campaign details');
      })
      .finally(() => { if (!cancelled) setDetailLoading(false); });

    return () => { cancelled = true; };
  }, [summary.id, reloadKey]);

  // Show the list row instantly, swap in the full record when it arrives
  const campaign = detail && detail.id === summary.id ? detail : summary;

  const statusStyle = CAMPAIGN_STATUS_STYLES[campaign.status] ?? FALLBACK_STATUS;
  const template = campaign.template ?? null;
  const sender = campaign.sender_account ?? null;
  const owner = campaign.user ?? null;
  const uploads = campaign.uploads ?? [];
  const recipients = campaign.recipients ?? [];
  const logs = campaign.email_logs ?? [];
  const upload = uploads[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const stats = useMemo(() => {
    const sent = logs.filter((l) => l.status === 'Sent').length;
    const failed = logs.filter((l) => l.status === 'Failed').length;
    const pendingLogs = logs.filter((l) => l.status === 'Pending').length;
    const recipientCount = recipients.length;
    const deliveryRate = logs.length ? Math.round((sent / logs.length) * 100) : 0;
    const logsByStatus = logs.reduce<Record<string, number>>((acc, l) => {
      const k = l.status || 'Pending';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { sent, failed, pendingLogs, recipientCount, deliveryRate, logsByStatus };
  }, [logs, recipients]);

  const recipientById = useMemo(
    () =>
      recipients.reduce<Record<number, (typeof recipients)[number]>>((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {}),
    [recipients]
  );

  /* ── Recipients tab derived data ── */

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

  const recipientCounts = useMemo(() => {
    const c: Record<string, number> = {};
    recipients.forEach((r) => {
      const k = r.status || 'Pending';
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [recipients]);

  const statusOptions = useMemo(() => ['all', ...Object.keys(recipientCounts)], [recipientCounts]);

  const filteredRecipients = useMemo(() => {
    const q = rSearch.trim().toLowerCase();
    return recipients.filter((r) => {
      const okStatus = rStatus === 'all' || (r.status || 'Pending') === rStatus;
      const okSearch =
        !q || (r.name ?? '').toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q);
      return okStatus && okSearch;
    });
  }, [recipients, rSearch, rStatus]);

  useEffect(() => setRPage(1), [rSearch, rStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipients.length / PAGE_SIZE));
  const pageRows = filteredRecipients.slice((rPage - 1) * PAGE_SIZE, rPage * PAGE_SIZE);

  /* ── XLSX export ── */

  const exportXlsx = async () => {
    if (exporting || filteredRecipients.length === 0) return;
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
      title.value = `${campaign.campaign_name} — Recipients`;
      title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF111827' } };
      title.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(1).height = 30;

      // Subtitle
      ws.mergeCells('A2:F2');
      const sub = ws.getCell('A2');
      sub.value = `Campaign #${campaign.id}  •  ${filteredRecipients.length.toLocaleString()} recipients  •  Exported ${new Date().toLocaleString()}`;
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
      filteredRecipients.forEach((r, idx) => {
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
      a.download = `campaign-${campaign.id}-recipients-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('XLSX export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const recipientSummary: {
    label: string; key: string; Icon: React.ComponentType<{ size?: number }>; fg: string;
  }[] = [
    { label: 'Delivered', key: 'Delivered', Icon: CheckCircle2, fg: '#34D399' },
    { label: 'Sent',      key: 'Sent',      Icon: Mail,         fg: '#60A5FA' },
    { label: 'Pending',   key: 'Pending',   Icon: Clock,        fg: '#9BA0A8' },
    { label: 'Bounced',   key: 'Bounced',   Icon: MailWarning,  fg: '#FBBF24' },
    { label: 'Failed',    key: 'Failed',    Icon: MailX,        fg: '#F87171' },
  ];

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview',   label: 'Overview', icon: FileText },
    { id: 'recipients', label: detailLoading && !detail ? 'Recipients' : `Recipients (${recipients.length})`, icon: Users },
    { id: 'delivery',   label: detailLoading && !detail ? 'Delivery' : `Delivery (${logs.length})`, icon: BarChart3 },
    { id: 'template',   label: 'Template', icon: LayoutTemplate },
  ];

  const ownerLabel = owner?.username || owner?.email || `user #${campaign.user_id}`;
  const ownerEmail = owner?.email;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      style={{ fontFamily: FONT.body, animation: 'cm-fade 0.15s ease-out' }}
    >
      <style>{`
        @keyframes cm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cm-rise { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }
        .cm-shell { animation: cm-rise 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) }
        .cm-scroll::-webkit-scrollbar { width: 8px; height: 8px }
        .cm-scroll::-webkit-scrollbar-track { background: transparent }
        .cm-scroll::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px }
        .cm-scroll::-webkit-scrollbar-thumb:hover { background: #333A48 }
        .cm-shell select option { background: #141821; color: #E8E6E1; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-shell w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#141821] ring-1 ring-[#232833] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#1F242E]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
              <Mail size={18} className="text-[#FF6A39]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-[#6B727C]" style={{ fontFamily: FONT.mono }}>
                  campaign #{campaign.id}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.fg,
                    boxShadow: `inset 0 0 0 1px ${statusStyle.ring}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.fg, boxShadow: `0 0 6px ${statusStyle.fg}` }} />
                  {statusStyle.label}
                </span>
              </div>
              <h2
                style={{ fontFamily: FONT.display, letterSpacing: '-0.01em' }}
                className="text-lg md:text-xl font-bold text-white truncate"
              >
                {campaign.campaign_name}
              </h2>
              <p className="text-xs md:text-sm text-[#9BA0A8] mt-1 truncate font-mono">
                {campaign.subject || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-2 rounded-xl bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] hover:ring-[#333A48] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 px-5 md:px-6 pt-4">
          <MetaPill icon={<UserIcon size={11} className="text-[#6B727C]" />}>
            <span className="text-[#E8E6E1]">{ownerLabel}</span>
            {ownerEmail && <span className="text-[#6B727C] font-mono">&lt;{ownerEmail}&gt;</span>}
          </MetaPill>
          <MetaPill icon={<Calendar size={11} className="text-[#6B727C]" />} mono>
            {formatDate(campaign.created_at)}
          </MetaPill>
          <MetaPill icon={<Clock size={11} className="text-[#6B727C]" />} mono>
            {formatDate(campaign.updated_at)}
          </MetaPill>
        </div>

        {/* Tabs */}
        <div className="px-5 md:px-6 mt-4">
          <div className="inline-flex max-w-full items-center gap-1 p-1 rounded-xl bg-[#0F131A] ring-1 ring-[#232833] overflow-x-auto cm-scroll">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#1B1F29] text-[#E8E6E1] ring-1 ring-[#2A2E37] shadow-sm'
                      : 'text-[#6B727C] hover:text-[#C7C9CE]'
                  }`}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="cm-scroll flex-1 overflow-y-auto p-5 md:p-6">
          {detailLoading && (
            <div className="flex items-center gap-2 mb-4 text-[11px] text-[#6B727C]">
              <div className="w-3.5 h-3.5 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin" />
              Loading full details…
            </div>
          )}
          {detailError && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[12px] text-[#F87171] bg-[#F87171]/5 ring-1 ring-[#F87171]/20">
              <span>{detailError}</span>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-[#E8E6E1] hover:text-white"
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Recipients"    value={formatNumber(stats.recipientCount)} icon={Users}        accent="#FF6A39" />
                <StatCard label="Sent"          value={formatNumber(stats.sent)}           icon={Send}         accent="#34D399" />
                <StatCard label="Failed"        value={formatNumber(stats.failed)}         icon={XCircle}      accent="#F87171" />
                <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`}           icon={CheckCircle2} accent="#A78BFA" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner */}
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4">
                  <SectionTitle icon={UserIcon} title="Owner" subtitle="Who created this campaign" />
                  <InfoRow icon={<UserIcon size={13} className="text-[#6B727C]" />} label="User">
                    <p className="text-[13px] text-[#E8E6E1] font-medium truncate">{ownerLabel}</p>
                    {ownerEmail && (
                      <p className="text-[11.5px] text-[#6B727C] font-mono truncate">{ownerEmail}</p>
                    )}
                    <p className="text-[10.5px] text-[#3A404F] font-mono mt-0.5">user #{campaign.user_id}</p>
                  </InfoRow>
                </div>

                {/* Sender */}
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4">
                  <SectionTitle
                    icon={AtSign}
                    title="Sender account"
                    subtitle="From address used"
                    right={
                      <button
                        onClick={() => navigate('/admin/senders-account')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FF6A39] hover:text-[#ff8457]"
                      >
                        Manage <ExternalLink size={11} />
                      </button>
                    }
                  />
                  {sender ? (
                    <InfoRow icon={<AtSign size={13} className="text-[#FF6A39]" />} label="From">
                      <p className="text-[13px] text-[#E8E6E1] font-medium truncate">
                        {sender.display_name || '—'}
                      </p>
                      <p className="text-[11.5px] text-[#6B727C] font-mono truncate">
                        {sender.email || '—'}
                      </p>
                      <p className="text-[10.5px] text-[#3A404F] font-mono mt-0.5">
                        sender #{sender.id ?? campaign.sender_account_id ?? '—'}
                      </p>
                    </InfoRow>
                  ) : (
                    <InfoRow icon={<AtSign size={13} className="text-[#6B727C]" />} label="From">
                      <p className="text-[12.5px] text-[#7A8092]">
                        {campaign.sender_account_id
                          ? `Sender #${campaign.sender_account_id} (details not loaded)`
                          : 'No sender account attached.'}
                      </p>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* Template */}
              <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4">
                <SectionTitle
                  icon={LayoutTemplate}
                  title="Template"
                  subtitle={template?.name || (campaign.template_id ? `#${campaign.template_id}` : 'No template')}
                  right={
                    <button
                      onClick={() => setTab('template')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#FF6A39] bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20 hover:bg-[#FF6A39]/15 transition-colors"
                    >
                      <Eye size={11} /> Preview
                    </button>
                  }
                />
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#A78BFA]/10 ring-1 ring-[#A78BFA]/20">
                    <LayoutTemplate size={14} className="text-[#A78BFA]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#E8E6E1] font-medium truncate">
                      {template?.name ?? (campaign.template_id ? `Template #${campaign.template_id}` : 'No template attached')}
                    </p>
                    <p className="text-[10.5px] text-[#3A404F] font-mono mt-0.5">
                      template #{campaign.template_id ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload */}
              {upload && (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4">
                  <SectionTitle
                    icon={FileSpreadsheet}
                    title="Source file"
                    subtitle={`${formatNumber(upload.processed_records)} / ${formatNumber(upload.total_records)} processed`}
                    right={
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#1B1F29] text-[#9BA0A8] ring-1 ring-[#2A2E37]">
                        {upload.status}
                      </span>
                    }
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
                      <FileSpreadsheet size={14} className="text-[#FF6A39]" />
                    </div>
                    <p className="text-[13px] text-[#E8E6E1] font-medium truncate">
                      {upload.original_filename || 'Untitled file'}
                    </p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1F242E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF6A39] to-[#FF8A5C] transition-all duration-500"
                      style={{
                        width: `${
                          upload.total_records
                            ? Math.min(100, (upload.processed_records / upload.total_records) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ RECIPIENTS ═══ */}
          {tab === 'recipients' && (
            <div className="space-y-4">
              {/* Summary chips (click to filter) */}
              {recipients.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <div className="rounded-xl p-3.5 bg-[#0F131A] ring-1 ring-[#232833]">
                    <Users size={14} className="text-[#FF6A39] mb-2.5" />
                    <p className="text-lg font-semibold font-mono leading-none text-[#E8E6E1]">
                      {recipients.length.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mt-1.5">Total</p>
                  </div>
                  {recipientSummary.map(({ label, key, Icon, fg }) => (
                    <button
                      key={key}
                      onClick={() => setRStatus(rStatus === key ? 'all' : key)}
                      className="text-left rounded-xl p-3.5 bg-[#0F131A] ring-1 transition-all hover:-translate-y-0.5"
                      style={{ ['--tw-ring-color' as any]: rStatus === key ? `${fg}99` : '#232833' }}
                    >
                      <span style={{ color: fg }}><Icon size={14} /></span>
                      <p className="text-lg font-semibold font-mono leading-none text-[#E8E6E1] mt-2.5">
                        {(recipientCounts[key] ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mt-1.5">{label}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-0 bg-[#0F131A] ring-1 ring-[#232833]">
                  <Search size={14} className="text-[#6B727C] shrink-0" />
                  <input
                    value={rSearch}
                    onChange={(e) => setRSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full bg-transparent text-[13px] outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
                  />
                  {rSearch && (
                    <button
                      onClick={() => setRSearch('')}
                      className="shrink-0 text-[10px] text-[#6B727C] hover:text-[#E8E6E1] px-1.5 py-0.5 rounded hover:bg-[#232833]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B727C]" />
                  <select
                    value={rStatus}
                    onChange={(e) => setRStatus(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-xl text-[12.5px] cursor-pointer focus:outline-none bg-[#0F131A] ring-1 ring-[#232833] text-[#E8E6E1]"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-[#0F131A] ring-1 ring-[#232833] text-[#E8E6E1] hover:bg-[#1B1F29] transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw size={13} className={detailLoading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={exportXlsx}
                  disabled={filteredRecipients.length === 0 || exporting}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white bg-[#FF6A39] hover:bg-[#ff7a4d] transition-colors disabled:opacity-40"
                >
                  {exporting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileSpreadsheet size={13} />
                  )}
                  {exporting ? 'Exporting…' : 'Export XLSX'}
                </button>
              </div>

              {/* Empty */}
              {filteredRecipients.length === 0 && (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] py-14 text-center">
                  <Inbox size={22} className="text-[#3A404F] mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-[#F2F0EB]">
                    {detailLoading && recipients.length === 0
                      ? 'Loading recipients…'
                      : recipients.length === 0
                      ? 'No recipients yet'
                      : 'No recipients match'}
                  </p>
                  {!(detailLoading && recipients.length === 0) && (
                    <p className="text-[11.5px] mt-1.5 text-[#7A8092]">
                      {recipients.length === 0
                        ? 'Upload a recipient file to this campaign to add people.'
                        : 'Try a different search or status filter.'}
                    </p>
                  )}
                </div>
              )}

              {/* Table */}
              {filteredRecipients.length > 0 && (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] overflow-hidden">
                  <div className="overflow-x-auto cm-scroll">
                    <table className="w-full text-left min-w-[560px]">
                      <thead>
                        <tr className="border-b border-[#1F242E] text-[10px] uppercase tracking-widest text-[#6B727C]">
                          <th className="px-4 py-2.5 font-medium">Recipient</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5 font-medium">Last email</th>
                          <th className="px-4 py-2.5 font-medium text-right">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F242E]">
                        {pageRows.map((r) => {
                          const last = lastLogByRecipient[r.id];
                          return (
                            <tr key={r.id} className="hover:bg-[#161B25] transition-colors">
                              <td className="px-4 py-2.5">
                                <p className="text-[12.5px] text-[#F2F0EB] font-medium truncate max-w-[240px]">
                                  {r.name || '—'}
                                </p>
                                <p className="text-[11px] text-[#7A8092] font-mono truncate max-w-[240px]">
                                  {r.email}
                                </p>
                              </td>
                              <td className="px-4 py-2.5"><StatusPill status={r.status || 'Pending'} /></td>
                              <td className="px-4 py-2.5">
                                {last ? (
                                  <div className="flex items-center gap-2">
                                    <StatusPill status={last.status} />
                                    <span className="text-[10.5px] text-[#6B727C] font-mono whitespace-nowrap">
                                      {formatDate(last.sent_at)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11.5px] text-[#3A404F]">Not sent</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right text-[10.5px] text-[#3A404F] font-mono">#{r.id}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#1F242E]">
                    <p className="text-[11.5px] text-[#7A8092]">
                      <span className="font-mono text-[#F2F0EB]">{filteredRecipients.length.toLocaleString()}</span>{' '}
                      {filteredRecipients.length === 1 ? 'recipient' : 'recipients'}
                      {filteredRecipients.length !== recipients.length &&
                        ` of ${recipients.length.toLocaleString()}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRPage((p) => Math.max(1, p - 1))}
                        disabled={rPage === 1}
                        className="px-3 py-1.5 rounded-lg text-[11.5px] bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-[11px] text-[#6B727C] font-mono">{rPage} / {totalPages}</span>
                      <button
                        onClick={() => setRPage((p) => Math.min(totalPages, p + 1))}
                        disabled={rPage === totalPages}
                        className="px-3 py-1.5 rounded-lg text-[11.5px] bg-[#141821] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ DELIVERY ═══ */}
          {tab === 'delivery' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Sent"      value={formatNumber(stats.logsByStatus.Sent ?? 0)}      icon={Clock}       accent="#60A5FA" />
                <StatCard label="Delivered" value={formatNumber(stats.logsByStatus.Delivered ?? 0)} icon={MailCheck}   accent="#34D399" />
                <StatCard label="Bounced"   value={formatNumber(stats.logsByStatus.Bounced ?? 0)}   icon={MailWarning} accent="#FBBF24" />
                <StatCard label="Failed"    value={formatNumber(stats.logsByStatus.Failed ?? 0)}    icon={MailX}       accent="#F87171" />
              </div>

              {logs.length === 0 ? (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-8 text-center">
                  <BarChart3 size={22} className="text-[#3A404F] mx-auto mb-2" />
                  <p className="text-[12.5px] text-[#7A8092]">
                    {detailLoading ? 'Loading email logs…' : 'No email logs yet.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1F242E] flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-[#6B727C]">Recent events</p>
                    <button
                      onClick={() => navigate('/admin/emaillogs')}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FF6A39] hover:text-[#ff8457]"
                    >
                      Open logs <ExternalLink size={11} />
                    </button>
                  </div>
                  <ul className="divide-y divide-[#1F242E] max-h-[280px] overflow-y-auto cm-scroll">
                    {logs.slice(0, 20).map((l) => {
                      const r = recipientById[l.recipient_id];
                      const meta = LOG_STATUS_META[l.status] ?? FALLBACK_LOG;
                      const Icon = meta.Icon;
                      return (
                        <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[12px] text-[#E8E6E1] truncate">
                              {r?.email || r?.name || `Recipient #${l.recipient_id ?? '—'}`}
                            </p>
                            <p className="text-[10.5px] text-[#6B727C] font-mono truncate">
                              {formatRelative(l.sent_at)}
                              <span className="text-[#3A404F]"> · </span>
                              {formatDate(l.sent_at)}
                            </p>
                          </div>
                          <span
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                          >
                            <Icon size={10} />
                            {l.status}
                          </span>
                        </li>
                      );
                    })}
                    {logs.length > 20 && (
                      <li className="text-center text-[11px] text-[#6B727C] py-3">
                        + {formatNumber(logs.length - 20)} more events
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ═══ TEMPLATE ═══ */}
          {tab === 'template' && (
            <div className="rounded-xl ring-1 ring-[#232833] overflow-hidden bg-[#0F131A]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1F242E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-[11px] text-[#6B727C] font-mono truncate">
                  {template?.name ?? (campaign.template_id ? `template #${campaign.template_id}` : 'No template')}
                </span>
              </div>
              {template?.html_content ? (
                <iframe
                  title="Template preview"
                  srcDoc={template.html_content}
                  sandbox=""
                  className="w-full h-[440px] bg-white"
                />
              ) : (
                <div className="p-10 text-center bg-[#0F131A]">
                  <LayoutTemplate size={22} className="text-[#3A404F] mx-auto mb-2" />
                  <p className="text-[12.5px] text-[#7A8092]">
                    {detailLoading
                      ? 'Loading template…'
                      : campaign.template_id
                      ? `Template #${campaign.template_id} has no preview content.`
                      : 'No template attached to this campaign.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-4 md:p-5 border-t border-[#1F242E]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] text-[#6B727C] font-mono shrink-0">#{campaign.id}</span>
            <span className="text-[#3A404F] shrink-0">·</span>
            <span className="text-[11px] text-[#6B727C] truncate">
              owner <span className="text-[#9BA0A8]">{ownerLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {tab !== 'recipients' && (
              <button
                onClick={() => setTab('recipients')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-[#FF6A39] bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20 hover:bg-[#FF6A39]/15 transition-colors"
              >
                <Users size={13} />
                Recipients
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] hover:ring-[#333A48] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaignModal;