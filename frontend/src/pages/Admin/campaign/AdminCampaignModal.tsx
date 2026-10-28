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

const CAMPAIGN_STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string }
> = {
  Draft:     { bg: T.surface2,     fg: T.textMuted, ring: T.borderSoft,    label: "Draft" },
  Ready:     { bg: T.brandSoft,    fg: T.brand,     ring: T.brandBorder,   label: "Ready" },
  Running:   { bg: T.successSoft,  fg: T.success,   ring: T.successBorder, label: "Running" },
  Paused:    { bg: T.warnSoft,     fg: T.warn,      ring: T.warnBorder,    label: "Paused" },
  Completed: { bg: T.purpleSoft,   fg: T.purple,    ring: T.purpleBorder,  label: "Completed" },
  Cancelled: { bg: T.dangerSoft,   fg: T.danger,    ring: T.dangerBorder,  label: "Cancelled" },
};

const FALLBACK_STATUS = CAMPAIGN_STATUS_STYLES.Draft;

const LOG_STATUS_META: Record<
  string,
  { fg: string; bg: string; ring: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Sent:      { fg: T.info,    bg: T.infoSoft,    ring: T.infoBorder,    Icon: Clock },
  Delivered: { fg: T.success, bg: T.successSoft, ring: T.successBorder, Icon: CheckCircle2 },
  Bounced:   { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    Icon: MailWarning },
  Failed:    { fg: T.danger,  bg: T.dangerSoft,  ring: T.dangerBorder,  Icon: MailX },
  Pending:   { fg: T.textMuted, bg: T.surface2,  ring: T.borderSoft,    Icon: MailWarning },
  Queued:    { fg: T.info,    bg: T.infoSoft,    ring: T.infoBorder,    Icon: Clock },
  Sending:   { fg: T.warn,    bg: T.warnSoft,    ring: T.warnBorder,    Icon: MailWarning },
};
const FALLBACK_LOG = LOG_STATUS_META.Pending;

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
  campaign: Campaign;
  onClose: () => void;
  initialTab?: Tab;
}

const PAGE_SIZE = 10;

/* ─────────────── helpers ─────────────── */

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

/* ─────────────── primitives ─────────────── */

const MetaPill: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; mono?: boolean }> = ({
  icon, children, mono,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] ${mono ? 'font-mono' : ''}`}
    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
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
  accentSoft: string;
}> = ({ label, value, icon: Icon, accent, accentSoft }) => (
  <div className="rounded-lg p-3.5" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
    <div
      className="w-7 h-7 rounded-md flex items-center justify-center mb-2.5"
      style={{ background: accentSoft, color: accent }}
    >
      <Icon size={13} />
    </div>
    <p className="text-[18px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>{value}</p>
    <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>{label}</p>
  </div>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className="flex items-start gap-2.5">
    <div
      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: T.textFaint }}>{label}</p>
      <div className="text-[12.5px] min-w-0" style={{ color: T.textMuted }}>{children}</div>
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
      <h3 className="text-[13px] font-semibold flex items-center gap-2" style={{ color: T.text }}>
        <Icon size={13} style={{ color: T.brand }} />
        {title}
      </h3>
      {subtitle && <p className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = LOG_STATUS_META[status] ?? FALLBACK_LOG;
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

/* ─────────────── component ─────────────── */

const AdminCampaignModal: React.FC<AdminCampaignModalProps> = ({
  campaign: summary,
  onClose,
  initialTab = 'overview',
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);

  const [detail, setDetail] = useState<Campaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      title.value = `${campaign.campaign_name} — Recipients`;
      title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF111827' } };
      title.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(1).height = 30;

      ws.mergeCells('A2:F2');
      const sub = ws.getCell('A2');
      sub.value = `Campaign #${campaign.id}  •  ${filteredRecipients.length.toLocaleString()} recipients  •  Exported ${new Date().toLocaleString()}`;
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
    label: string; key: string; Icon: React.ComponentType<{ size?: number }>; fg: string; soft: string;
  }[] = [
    { label: 'Delivered', key: 'Delivered', Icon: CheckCircle2, fg: T.success, soft: T.successSoft },
    { label: 'Sent',      key: 'Sent',      Icon: Mail,         fg: T.info,    soft: T.infoSoft },
    { label: 'Pending',   key: 'Pending',   Icon: Clock,        fg: T.textMuted, soft: T.surface2 },
    { label: 'Bounced',   key: 'Bounced',   Icon: MailWarning,  fg: T.warn,    soft: T.warnSoft },
    { label: 'Failed',    key: 'Failed',    Icon: MailX,        fg: T.danger,  soft: T.dangerSoft },
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ fontFamily: FONT.body, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', animation: 'cm-fade 0.15s ease-out' }}
    >
      <style>{`
        @keyframes cm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cm-rise { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }
        .cm-shell { animation: cm-rise 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) }
        .cm-scroll::-webkit-scrollbar { width: 8px; height: 8px }
        .cm-scroll::-webkit-scrollbar-track { background: transparent }
        .cm-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px }
        .cm-scroll::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi} }
        .cm-shell select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-shell w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: T.surface,
          boxShadow: `inset 0 0 0 1px ${T.border}, 0 30px 60px -20px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand }}
            >
              <Mail size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  campaign #{campaign.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.fg,
                    boxShadow: `inset 0 0 0 1px ${statusStyle.ring}`,
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: statusStyle.fg }} />
                  {statusStyle.label}
                </span>
              </div>
              <h2 className="text-[17px] font-semibold truncate" style={{ color: T.text }}>
                {campaign.campaign_name}
              </h2>
              <p className="text-[12px] mt-0.5 truncate" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                {campaign.subject || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-2 rounded-md transition-colors hover:bg-white/5"
            style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3">
          <MetaPill icon={<UserIcon size={10} style={{ color: T.textFaint }} />}>
            <span style={{ color: T.text }}>{ownerLabel}</span>
            {ownerEmail && <span style={{ color: T.textFaint, fontFamily: FONT.mono }}>&lt;{ownerEmail}&gt;</span>}
          </MetaPill>
          <MetaPill icon={<Calendar size={10} style={{ color: T.textFaint }} />} mono>
            {formatDate(campaign.created_at)}
          </MetaPill>
          <MetaPill icon={<Clock size={10} style={{ color: T.textFaint }} />} mono>
            {formatDate(campaign.updated_at)}
          </MetaPill>
        </div>

        {/* Tabs */}
        <div className="px-5 mt-3">
          <div
            className="inline-flex max-w-full items-center gap-0.5 p-0.5 rounded-lg overflow-x-auto cm-scroll"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors whitespace-nowrap"
                  style={{
                    background: active ? T.surfaceHi : 'transparent',
                    color: active ? T.text : T.textMuted,
                  }}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="cm-scroll flex-1 overflow-y-auto p-5">
          {detailLoading && (
            <div className="flex items-center gap-2 mb-4 text-[11px]" style={{ color: T.textFaint }}>
              <div
                className="w-3 h-3 border-2 rounded-full animate-spin"
                style={{ borderColor: T.brand, borderTopColor: 'transparent' }}
              />
              Loading full details…
            </div>
          )}
          {detailError && (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
            >
              <span>{detailError}</span>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium hover:opacity-80"
                style={{ color: T.danger }}
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <StatCard label="Recipients"    value={formatNumber(stats.recipientCount)} icon={Users}        accent={T.brand}   accentSoft={T.brandSoft} />
                <StatCard label="Sent"          value={formatNumber(stats.sent)}           icon={Send}         accent={T.success} accentSoft={T.successSoft} />
                <StatCard label="Failed"        value={formatNumber(stats.failed)}         icon={XCircle}      accent={T.danger}  accentSoft={T.dangerSoft} />
                <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`}           icon={CheckCircle2} accent={T.purple}  accentSoft={T.purpleSoft} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Owner */}
                <div className="rounded-lg p-4" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <SectionTitle icon={UserIcon} title="Owner" subtitle="Who created this campaign" />
                  <InfoRow icon={<UserIcon size={12} style={{ color: T.textFaint }} />} label="User">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>{ownerLabel}</p>
                    {ownerEmail && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>{ownerEmail}</p>
                    )}
                  </InfoRow>
                </div>

                {/* Sender */}
                <div className="rounded-lg p-4" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <SectionTitle
                    icon={AtSign}
                    title="Sender account"
                    subtitle="From address used"
                    right={
                      <button
                        onClick={() => navigate('/admin/senders-account')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium hover:opacity-80"
                        style={{ color: T.brand }}
                      >
                        Manage <ExternalLink size={10} />
                      </button>
                    }
                  />
                  {sender ? (
                    <InfoRow icon={<AtSign size={12} style={{ color: T.brand }} />} label="From">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                        {sender.display_name || '—'}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {sender.email || '—'}
                      </p>
                    </InfoRow>
                  ) : (
                    <InfoRow icon={<AtSign size={12} style={{ color: T.textFaint }} />} label="From">
                      <p className="text-[12px]" style={{ color: T.textMuted }}>
                        {campaign.sender_account_id
                          ? `Sender #${campaign.sender_account_id} (details not loaded)`
                          : 'No sender account attached.'}
                      </p>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* Template */}
              <div className="rounded-lg p-4" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                <SectionTitle
                  icon={LayoutTemplate}
                  title="Template"
                  subtitle={template?.name || (campaign.template_id ? `#${campaign.template_id}` : 'No template')}
                  right={
                    <button
                      onClick={() => setTab('template')}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-white/5"
                      style={{ background: T.brandSoft, color: T.brand }}
                    >
                      <Eye size={10} /> Preview
                    </button>
                  }
                />
                <div className="flex items-center gap-2.5">
                  <div
                    className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: T.purpleSoft, color: T.purple }}
                  >
                    <LayoutTemplate size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                      {template?.name ?? (campaign.template_id ? `Template #${campaign.template_id}` : 'No template attached')}
                    </p>
                    <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                      template #{campaign.template_id ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload */}
              {upload && (
                <div className="rounded-lg p-4" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <SectionTitle
                    icon={FileSpreadsheet}
                    title="Source file"
                    subtitle={`${formatNumber(upload.processed_records)} / ${formatNumber(upload.total_records)} processed`}
                    right={
                      <span
                        className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: T.surfaceHi, color: T.textMuted }}
                      >
                        {upload.status}
                      </span>
                    }
                  />
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ background: T.brandSoft, color: T.brand }}
                    >
                      <FileSpreadsheet size={13} />
                    </div>
                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                      {upload.original_filename || 'Untitled file'}
                    </p>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${upload.total_records ? Math.min(100, (upload.processed_records / upload.total_records) * 100) : 0}%`,
                        background: T.brand,
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
              {recipients.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  <div className="rounded-lg p-3" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                    <Users size={12} style={{ color: T.brand }} className="mb-2" />
                    <p className="text-[18px] font-semibold leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
                      {recipients.length.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>Total</p>
                  </div>
                  {recipientSummary.map(({ label, key, Icon, fg, soft }) => (
                    <button
                      key={key}
                      onClick={() => setRStatus(rStatus === key ? 'all' : key)}
                      className="text-left rounded-lg p-3 transition-colors hover:bg-white/[0.02]"
                      style={{
                        background: T.surface2,
                        boxShadow: rStatus === key ? `inset 0 0 0 1px ${fg}` : `inset 0 0 0 1px ${T.borderSoft}`,
                      }}
                    >
                      <span style={{ color: fg }}><Icon size={12} /></span>
                      <p className="text-[18px] font-semibold leading-none mt-2" style={{ color: T.text, fontFamily: FONT.mono }}>
                        {(recipientCounts[key] ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>{label}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-0"
                  style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                >
                  <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                  <input
                    value={rSearch}
                    onChange={(e) => setRSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full bg-transparent text-[13px] outline-none"
                    style={{ color: T.text }}
                  />
                  {rSearch && (
                    <button
                      onClick={() => setRSearch('')}
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
                    value={rStatus}
                    onChange={(e) => setRStatus(e.target.value)}
                    className="pl-7 pr-2.5 py-2 rounded-lg text-[12px] cursor-pointer outline-none"
                    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
                  style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                  aria-label="Refresh"
                >
                  <RefreshCw size={12} className={detailLoading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={exportXlsx}
                  disabled={filteredRecipients.length === 0 || exporting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-40"
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

              {filteredRecipients.length === 0 && (
                <div className="rounded-lg py-14 text-center" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <Inbox size={20} style={{ color: T.textFaint }} className="mx-auto mb-2" />
                  <p className="text-[12.5px] font-medium" style={{ color: T.text }}>
                    {detailLoading && recipients.length === 0
                      ? 'Loading recipients…'
                      : recipients.length === 0
                      ? 'No recipients yet'
                      : 'No recipients match'}
                  </p>
                  {!(detailLoading && recipients.length === 0) && (
                    <p className="text-[11.5px] mt-1.5" style={{ color: T.textMuted }}>
                      {recipients.length === 0
                        ? 'Upload a recipient file to this campaign to add people.'
                        : 'Try a different search or status filter.'}
                    </p>
                  )}
                </div>
              )}

              {filteredRecipients.length > 0 && (
                <div className="rounded-lg overflow-hidden" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <div className="overflow-x-auto cm-scroll">
                    <table className="w-full text-left min-w-[560px]">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}` }}>
                          <th className="px-4 py-2.5 font-medium">Recipient</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5 font-medium">Last email</th>
                          <th className="px-4 py-2.5 font-medium text-right">ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((r) => {
                          const last = lastLogByRecipient[r.id];
                          return (
                            <tr key={r.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                              <td className="px-4 py-2.5">
                                <p className="text-[12px] font-medium truncate max-w-[240px]" style={{ color: T.text }}>
                                  {r.name || '—'}
                                </p>
                                <p className="text-[11px] truncate max-w-[240px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                  {r.email}
                                </p>
                              </td>
                              <td className="px-4 py-2.5"><StatusPill status={r.status || 'Pending'} /></td>
                              <td className="px-4 py-2.5">
                                {last ? (
                                  <div className="flex items-center gap-2">
                                    <StatusPill status={last.status} />
                                    <span className="text-[10.5px] whitespace-nowrap" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                      {formatDate(last.sent_at)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px]" style={{ color: T.textFaint }}>Not sent</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>#{r.id}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t" style={{ borderColor: T.borderSoft }}>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>
                      <span style={{ color: T.text, fontFamily: FONT.mono }}>{filteredRecipients.length.toLocaleString()}</span>{' '}
                      {filteredRecipients.length === 1 ? 'recipient' : 'recipients'}
                      {filteredRecipients.length !== recipients.length && ` of ${recipients.length.toLocaleString()}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRPage((p) => Math.max(1, p - 1))}
                        disabled={rPage === 1}
                        className="px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 disabled:hover:bg-transparent"
                        style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                      >
                        Previous
                      </button>
                      <span className="text-[11px] px-1.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>{rPage} / {totalPages}</span>
                      <button
                        onClick={() => setRPage((p) => Math.min(totalPages, p + 1))}
                        disabled={rPage === totalPages}
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
          )}

          {/* ═══ DELIVERY ═══ */}
          {tab === 'delivery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <StatCard label="Sent"      value={formatNumber(stats.logsByStatus.Sent ?? 0)}      icon={Clock}       accent={T.info}    accentSoft={T.infoSoft} />
                <StatCard label="Delivered" value={formatNumber(stats.logsByStatus.Delivered ?? 0)} icon={MailCheck}   accent={T.success} accentSoft={T.successSoft} />
                <StatCard label="Bounced"   value={formatNumber(stats.logsByStatus.Bounced ?? 0)}   icon={MailWarning} accent={T.warn}    accentSoft={T.warnSoft} />
                <StatCard label="Failed"    value={formatNumber(stats.logsByStatus.Failed ?? 0)}    icon={MailX}       accent={T.danger}  accentSoft={T.dangerSoft} />
              </div>

              {logs.length === 0 ? (
                <div className="rounded-lg p-8 text-center" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <BarChart3 size={20} style={{ color: T.textFaint }} className="mx-auto mb-2" />
                  <p className="text-[12px]" style={{ color: T.textMuted }}>
                    {detailLoading ? 'Loading email logs…' : 'No email logs yet.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
                  <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: T.borderSoft }}>
                    <p className="text-[10.5px] uppercase tracking-widest" style={{ color: T.textFaint }}>Recent events</p>
                    <button
                      onClick={() => navigate('/admin/emaillogs')}
                      className="inline-flex items-center gap-1 text-[11px] font-medium hover:opacity-80"
                      style={{ color: T.brand }}
                    >
                      Open logs <ExternalLink size={10} />
                    </button>
                  </div>
                  <ul className="max-h-[280px] overflow-y-auto cm-scroll">
                    {logs.slice(0, 20).map((l) => {
                      const r = recipientById[l.recipient_id];
                      const meta = LOG_STATUS_META[l.status] ?? FALLBACK_LOG;
                      const Icon = meta.Icon;
                      return (
                        <li
                          key={l.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                          style={{ borderTop: `1px solid ${T.borderSoft}` }}
                        >
                          <div className="min-w-0">
                            <p className="text-[12px] truncate" style={{ color: T.text }}>
                              {r?.email || r?.name || `Recipient #${l.recipient_id ?? '—'}`}
                            </p>
                            <p className="text-[10.5px] truncate mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                              {formatRelative(l.sent_at)}
                              <span style={{ color: T.textFaint }}> · </span>
                              {formatDate(l.sent_at)}
                            </p>
                          </div>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: meta.bg, color: meta.fg, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
                          >
                            <Icon size={10} />
                            {l.status}
                          </span>
                        </li>
                      );
                    })}
                    {logs.length > 20 && (
                      <li className="text-center text-[11px] py-3" style={{ color: T.textFaint, borderTop: `1px solid ${T.borderSoft}` }}>
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
            <div className="rounded-lg overflow-hidden" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: T.borderSoft }}>
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="ml-2.5 text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  {template?.name ?? (campaign.template_id ? `template #${campaign.template_id}` : 'No template')}
                </span>
              </div>
              {template?.html_content ? (
                <iframe
                  title="Template preview"
                  srcDoc={template.html_content}
                  sandbox=""
                  className="w-full bg-white"
                  style={{ height: 440, border: 0 }}
                />
              ) : (
                <div className="p-10 text-center">
                  <LayoutTemplate size={20} style={{ color: T.textFaint }} className="mx-auto mb-2" />
                  <p className="text-[12px]" style={{ color: T.textMuted }}>
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
        <div className="flex items-center justify-between gap-2 p-4 border-t" style={{ borderColor: T.borderSoft }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10.5px] shrink-0" style={{ color: T.textFaint, fontFamily: FONT.mono }}>#{campaign.id}</span>
            <span className="shrink-0" style={{ color: T.textFaint }}>·</span>
            <span className="text-[11px] truncate" style={{ color: T.textFaint }}>
              owner <span style={{ color: T.textMuted }}>{ownerLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {tab !== 'recipients' && (
              <button
                onClick={() => setTab('recipients')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5"
                style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
              >
                <Users size={12} />
                Recipients
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-[12px] rounded-md font-medium transition-colors hover:bg-white/5"
              style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.border}` }}
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