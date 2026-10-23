// CampaignModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../../types/CampaignTypes';
import {
  X, FileText, Mail, Send, XCircle, Clock, User as UserIcon,
  FileSpreadsheet, Eye, Users, LayoutTemplate, CheckCircle2, AlertTriangle,
  ExternalLink,
} from 'lucide-react';

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  surface:     "#111319",
  surface2:    "#161922",
  surfaceHi:   "#1B1F2A",
  border:      "#232838",
  borderSoft:  "#1B1F2A",
  text:        "#E9EBF0",
  textMuted:   "#9CA3B4",
  textFaint:   "#6B7280",
  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
  purple:      "#A78BFA",
  purpleSoft:  "rgba(167,139,250,0.12)",
  purpleBorder:"rgba(167,139,250,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── status styles ─────────────── */

const CAMPAIGN_STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string }
> = {
  Draft:     { bg: "rgba(156,163,180,0.12)", fg: T.textMuted, ring: "rgba(156,163,180,0.28)", label: "Draft" },
  Ready:     { bg: T.infoSoft,               fg: T.info,      ring: T.infoBorder,             label: "Ready" },
  Running:   { bg: T.successSoft,            fg: T.success,   ring: T.successBorder,          label: "Running" },
  Paused:    { bg: T.warnSoft,               fg: T.warn,      ring: T.warnBorder,             label: "Paused" },
  Completed: { bg: T.purpleSoft,             fg: T.purple,    ring: T.purpleBorder,           label: "Completed" },
  Cancelled: { bg: T.dangerSoft,             fg: T.danger,    ring: T.dangerBorder,           label: "Cancelled" },
};

type Tab = 'overview' | 'template';

interface CampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/* ─────────────── primitives ─────────────── */

const MetaPill: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; mono?: boolean }> = ({
  icon, children, mono,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${mono ? 'font-mono' : ''}`}
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
  <div className="rounded-lg p-3" style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}>
    <div
      className="w-7 h-7 rounded-md flex items-center justify-center mb-2"
      style={{ background: accentSoft, color: accent }}
    >
      <Icon size={12} />
    </div>
    <p className="text-[18px] font-semibold leading-none tabular-nums" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.textFaint }}>{label}</p>
  </div>
);

/* ─────────────── component ─────────────── */

const CampaignModal: React.FC<CampaignModalProps> = ({ campaign, onClose }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const statusStyle = CAMPAIGN_STATUS_STYLES[campaign.status];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const stats = useMemo(() => {
    const sent = campaign.email_logs.filter((l) => l.status === 'Sent').length;
    const failed = campaign.email_logs.filter((l) => l.status === 'Failed').length;
    const pendingLogs = campaign.email_logs.filter((l) => l.status === 'Pending').length;
    const recipientCount = campaign.recipients.length;
    const deliveryRate = campaign.email_logs.length
      ? Math.round((sent / campaign.email_logs.length) * 100)
      : 0;
    return { sent, failed, pendingLogs, recipientCount, deliveryRate };
  }, [campaign]);

  const upload = campaign.uploads[0];

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'template', label: 'Template', icon: LayoutTemplate },
  ];

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-4 bg-black/70"
      onClick={onClose}
      style={{ fontFamily: FONT.body, animation: 'cm-fade 0.15s ease-out' }}
    >
      <style>{`
        @keyframes cm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cm-rise { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: none } }
        .cm-shell { animation: cm-rise 0.15s ease-out }
        .cm-scroll::-webkit-scrollbar { width: 6px }
        .cm-scroll::-webkit-scrollbar-track { background: transparent }
        .cm-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px }
        .cm-scroll::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi} }
        @media (prefers-reduced-motion: reduce) { .cm-shell { animation: none !important } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-shell w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 64px -16px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 p-4 md:p-5"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand }}
            >
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] md:text-[17px] font-semibold truncate" style={{ color: T.text }}>
                {campaign.campaign_name}
              </h2>
              <p className="text-[12px] md:text-[12.5px] mt-0.5 truncate" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                {campaign.subject || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: T.textMuted, background: T.surface2 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 md:px-5 pt-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg, boxShadow: `inset 0 0 0 1px ${statusStyle.ring}` }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: statusStyle.fg }} />
            {statusStyle.label}
          </span>
          <MetaPill icon={<Clock size={10} style={{ color: T.textFaint }} />} mono>
            Created {formatDate(campaign.created_at)}
          </MetaPill>
          <MetaPill icon={<Clock size={10} style={{ color: T.textFaint }} />} mono>
            Updated {formatDate(campaign.updated_at)}
          </MetaPill>
          <MetaPill icon={<UserIcon size={10} style={{ color: T.textFaint }} />}>
            <span style={{ color: T.text }}>{campaign.sender_account.display_name}</span>
            <span style={{ color: T.textFaint, fontFamily: FONT.mono }}>&lt;{campaign.sender_account.email}&gt;</span>
          </MetaPill>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-5 mt-3">
          <div
            className="inline-flex items-center gap-0.5 p-0.5 rounded-md"
            style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11.5px] font-medium transition-colors"
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
            <button
              onClick={() => {
                navigate(`/user/campaigns/${campaign.id}/recipients`);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11.5px] font-medium transition-colors hover:bg-white/5"
              style={{ color: T.textMuted }}
            >
              <Users size={12} />
              <span>Recipients ({campaign.recipients.length})</span>
              <ExternalLink size={10} style={{ color: T.textFaint }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="cm-scroll flex-1 overflow-y-auto p-4 md:p-5">
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard label="Recipients"    value={stats.recipientCount}          icon={Users}        accent={T.brand}   accentSoft={T.brandSoft} />
                <StatCard label="Sent"          value={stats.sent}                    icon={Send}         accent={T.success} accentSoft={T.successSoft} />
                <StatCard label="Failed"        value={stats.failed}                  icon={XCircle}      accent={T.danger}  accentSoft={T.dangerSoft} />
                <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`}      icon={CheckCircle2} accent={T.purple}  accentSoft={T.purpleSoft} />
              </div>

              {/* Upload progress */}
              {upload && (
                <div
                  className="rounded-lg p-3.5"
                  style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ background: T.brandSoft, color: T.brand }}
                    >
                      <FileSpreadsheet size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                        {upload.original_filename}
                      </p>
                      <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {upload.processed_records} / {upload.total_records} records processed
                      </p>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: T.surfaceHi, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      {upload.status}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: T.brand,
                        width: `${upload.total_records ? Math.min(100, (upload.processed_records / upload.total_records) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Template row */}
              <div
                className="rounded-lg p-3.5 flex items-center justify-between gap-3"
                style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: T.purpleSoft, color: T.purple }}
                  >
                    <LayoutTemplate size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: T.textFaint }}>Template</p>
                    <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                      {campaign.template.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTab('template')}
                  className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors hover:brightness-110"
                  style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>
          )}

          {tab === 'template' && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.border}` }}
            >
              <div
                className="flex items-center gap-2 px-3.5 py-2"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(239,68,68,0.7)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(245,158,11,0.7)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(34,197,94,0.7)" }} />
                <span className="ml-2 text-[10.5px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  {campaign.template.name}
                </span>
              </div>
              <iframe
                title="Template preview"
                srcDoc={campaign.template.html_content}
                sandbox=""
                className="w-full bg-white"
                style={{ height: 420, border: 0 }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 p-3.5 md:p-4"
          style={{ borderTop: `1px solid ${T.borderSoft}` }}
        >
          <p className="text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            Campaign #{campaign.id}
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;