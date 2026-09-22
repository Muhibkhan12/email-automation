// CampaignModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../../types/CampaignTypes';
import {
  X, FileText, Mail, Send, XCircle, Clock, User as UserIcon,
  FileSpreadsheet, Eye, Users, LayoutTemplate, CheckCircle2, AlertTriangle,
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

type Tab = 'overview' | 'recipients' | 'template';

interface CampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/* ────────────────────────── small primitives ────────────────────────── */

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

/* ────────────────────────── component ────────────────────────── */

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

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }>; navigates?: boolean }[] = [
    { id: 'overview',   label: 'Overview',   icon: FileText },
    { id: 'recipients', label: `Recipients (${campaign.recipients.length})`, icon: Users, navigates: true },
    { id: 'template',   label: 'Template',   icon: LayoutTemplate },
  ];

  const handleTabClick = (tabId: Tab) => {
    if (tabId === 'recipients') {
      navigate(`/user/campaigns/${campaign.id}/recipients`);
      onClose();
      return;
    }
    setTab(tabId);
  };

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
        .cm-scroll::-webkit-scrollbar { width: 8px }
        .cm-scroll::-webkit-scrollbar-track { background: transparent }
        .cm-scroll::-webkit-scrollbar-thumb { background: #232833; border-radius: 8px }
        .cm-scroll::-webkit-scrollbar-thumb:hover { background: #333A48 }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-shell w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#141821] ring-1 ring-[#232833] shadow-2xl overflow-hidden"
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#1F242E]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
              <Mail size={18} className="text-[#FF6A39]" />
            </div>
            <div className="min-w-0">
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

        {/* ── Meta row ───────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-5 md:px-6 pt-4">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg, boxShadow: `inset 0 0 0 1px ${statusStyle.ring}` }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusStyle.fg, boxShadow: `0 0 8px ${statusStyle.fg}` }}
            />
            {statusStyle.label}
          </span>
          <MetaPill icon={<Clock size={11} className="text-[#6B727C]" />} mono>
            Created {formatDate(campaign.created_at)}
          </MetaPill>
          <MetaPill icon={<Clock size={11} className="text-[#6B727C]" />} mono>
            Updated {formatDate(campaign.updated_at)}
          </MetaPill>
          <MetaPill icon={<UserIcon size={11} className="text-[#6B727C]" />}>
            <span className="text-[#E8E6E1]">{campaign.sender_account.display_name}</span>
            <span className="text-[#6B727C] font-mono">&lt;{campaign.sender_account.email}&gt;</span>
          </MetaPill>
        </div>

        {/* ── Tabs ───────────────────────────────── */}
        <div className="px-5 md:px-6 mt-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0F131A] ring-1 ring-[#232833]">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    active
                      ? 'bg-[#1B1F29] text-[#E8E6E1] ring-1 ring-[#2A2E37] shadow-sm'
                      : 'text-[#6B727C] hover:text-[#C7C9CE]'
                  }`}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                  {t.navigates && (
                    <span className="text-[10px] text-[#3A3F4A]">↗</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ───────────────────────────────── */}
        <div className="cm-scroll flex-1 overflow-y-auto p-5 md:p-6">
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Recipients"    value={stats.recipientCount}  icon={Users}        accent="#FF6A39" />
                <StatCard label="Sent"          value={stats.sent}            icon={Send}         accent="#34D399" />
                <StatCard label="Failed"        value={stats.failed}          icon={XCircle}      accent="#F87171" />
                <StatCard label="Delivery rate" value={`${stats.deliveryRate}%`} icon={CheckCircle2} accent="#A78BFA" />
              </div>

              {/* Upload progress */}
              {upload && (
                <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20">
                      <FileSpreadsheet size={15} className="text-[#FF6A39]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#E8E6E1] font-medium truncate">
                        {upload.original_filename}
                      </p>
                      <p className="text-[11px] text-[#6B727C] font-mono">
                        {upload.processed_records} / {upload.total_records} records processed
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#1B1F29] text-[#9BA0A8] ring-1 ring-[#2A2E37]">
                      {upload.status}
                    </span>
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

              {/* Template row */}
              <div className="rounded-xl bg-[#0F131A] ring-1 ring-[#232833] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#A78BFA]/10 ring-1 ring-[#A78BFA]/20">
                    <LayoutTemplate size={15} className="text-[#A78BFA]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-[#6B727C] mb-0.5">Template</p>
                    <p className="text-sm text-[#E8E6E1] font-medium truncate">
                      {campaign.template.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTab('template')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#FF6A39] bg-[#FF6A39]/10 ring-1 ring-[#FF6A39]/20 hover:bg-[#FF6A39]/15 transition-colors"
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>
          )}

          {tab === 'template' && (
            <div className="rounded-xl ring-1 ring-[#232833] overflow-hidden bg-[#0F131A]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1F242E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-[11px] text-[#6B727C] font-mono truncate">
                  {campaign.template.name}
                </span>
              </div>
              <iframe
                title="Template preview"
                srcDoc={campaign.template.html_content}
                sandbox=""
                className="w-full h-[420px] bg-white"
              />
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 p-4 md:p-5 border-t border-[#1F242E]">
          <p className="text-[11px] text-[#6B727C] font-mono">
            Campaign #{campaign.id}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl bg-[#0F131A] ring-1 ring-[#232833] text-[#C7C9CE] hover:bg-[#1B1F29] hover:ring-[#333A48] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;