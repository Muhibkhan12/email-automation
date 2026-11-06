// CampaignModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../../types/CampaignTypes';
import {
  X, FileText, Mail, Send, XCircle, Clock, User as UserIcon,
  FileSpreadsheet, Eye, Users, LayoutTemplate, CheckCircle2, AlertTriangle,
  ExternalLink,
} from 'lucide-react';

/* ─────────────── design tokens (indigo + mint theme) ─────────────── */

const T = {
  bg:          "#0B0C0E",
  surface:     "#111214",
  surface2:    "#16181B",
  surfaceHi:   "#1C1F23",
  border:      "#24282E",
  borderSoft:  "#1B1E22",

  text:        "#E8EAED",
  textMuted:   "#9AA0A6",
  textFaint:   "#6B7075",

  accent:      "#6EE7A8",
  accentInk:   "#0B0C0E",
  accentSoft:  "rgba(110,231,168,0.10)",
  accentBorder:"rgba(110,231,168,0.28)",
  accentLine:  "#2E6B4D",

  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",

  success:     "#6EE7A8",
  successSoft: "rgba(110,231,168,0.10)",
  successBorder:"rgba(110,231,168,0.28)",

  warn:        "#E0A64A",
  warnSoft:    "rgba(224,166,74,0.10)",
  warnBorder:  "rgba(224,166,74,0.28)",

  danger:      "#E06A6A",
  dangerSoft:  "rgba(224,106,106,0.10)",
  dangerBorder:"rgba(224,106,106,0.28)",

  info:        "#6EC1E7",
  infoSoft:    "rgba(110,193,231,0.10)",
  infoBorder:  "rgba(110,193,231,0.28)",

  purple:      "#B39DE0",
  purpleSoft:  "rgba(179,157,224,0.10)",
  purpleBorder:"rgba(179,157,224,0.28)",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* ─────────────── status styles ─────────────── */

const CAMPAIGN_STATUS_STYLES: Record<
  Campaign['status'],
  { bg: string; fg: string; ring: string; label: string }
> = {
  Draft:     { bg: "rgba(154,160,166,0.10)", fg: T.textMuted, ring: "rgba(154,160,166,0.28)", label: "Draft" },
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
    style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT, fontFamily: mono ? FONT.mono : FONT.ui }}
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
  <div
    className="rounded-lg p-3 relative overflow-hidden"
    style={{ background: T.surface2, border: HAIRLINE_SOFT }}
  >
    <span
      aria-hidden
      className="absolute left-0 top-0 bottom-0 w-[2px]"
      style={{ background: accent, opacity: 0.6 }}
    />
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4"
      onClick={onClose}
      style={{ fontFamily: FONT.ui, background: "rgba(11,12,14,0.72)", animation: 'cm-fade 0.15s ease-out' }}
    >
      <style>{`
        @keyframes cm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cm-rise { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: none } }
        .cm-shell { animation: cm-rise 0.15s ease-out }
        .cm-scroll::-webkit-scrollbar { width: 6px }
        .cm-scroll::-webkit-scrollbar-track { background: transparent }
        .cm-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px }
        .cm-scroll::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi} }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) { .cm-shell { animation: none !important } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-shell relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          border: HAIRLINE,
          boxShadow: "0 24px 64px -16px rgba(0,0,0,0.7)",
        }}
      >
        {/* top accent line */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`, opacity: 0.6 }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 md:p-5" style={{ borderBottom: HAIRLINE_SOFT }}>
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand, border: `1px solid ${T.brandBorder}` }}
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
            className="shrink-0 p-1.5 rounded-md transition-colors duration-[120ms]"
            style={{ color: T.textMuted, background: T.surface2, border: HAIRLINE_SOFT }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = T.surface2; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 md:px-5 pt-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg, border: `1px solid ${statusStyle.ring}` }}
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
            style={{ background: T.surface2, border: HAIRLINE_SOFT }}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11.5px] font-medium transition-colors duration-[120ms]"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11.5px] font-medium transition-colors duration-[120ms]"
              style={{ color: T.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent"; }}
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
                <StatCard label="Recipients"    value={stats.recipientCount}     icon={Users}        accent={T.brand}   accentSoft={T.brandSoft} />
                <StatCard label="Sent"          value={stats.sent}               icon={Send}         accent={T.success} accentSoft={T.successSoft} />
                <StatCard label="Failed"        value={stats.failed}             icon={XCircle}      accent={T.danger}  accentSoft={T.dangerSoft} />
                <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`} icon={CheckCircle2} accent={T.purple}  accentSoft={T.purpleSoft} />
              </div>

              {/* Upload progress */}
              {upload && (
                <div className="rounded-lg p-3.5" style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
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
                      style={{ background: T.surfaceHi, color: T.textMuted, border: HAIRLINE_SOFT }}
                    >
                      {upload.status}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: T.accent,
                        width: `${upload.total_records ? Math.min(100, (upload.processed_records / upload.total_records) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Template row */}
              <div
                className="rounded-lg p-3.5 flex items-center justify-between gap-3"
                style={{ background: T.surface2, border: HAIRLINE_SOFT }}
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
                  className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all hover:brightness-110"
                  style={{ background: T.brandSoft, color: T.brand, border: `1px solid ${T.brandBorder}` }}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>
          )}

          {tab === 'template' && (
            <div className="rounded-lg overflow-hidden" style={{ background: T.surface2, border: HAIRLINE }}>
              <div className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: HAIRLINE_SOFT }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(224,106,106,0.7)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(224,166,74,0.7)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "rgba(110,231,168,0.7)" }} />
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
        <div className="flex items-center justify-between gap-2 p-3.5 md:p-4" style={{ borderTop: HAIRLINE_SOFT }}>
          <p className="text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
            Campaign #{campaign.id}
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-[120ms]"
            style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;