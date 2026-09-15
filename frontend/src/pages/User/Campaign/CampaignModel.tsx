// CampaignModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { Campaign, RecipientStatus, EmailLogStatus } from '../../../types/CampaignTypes';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const CAMPAIGN_STATUS_STYLES: Record<Campaign['status'], { bg: string; text: string; label: string }> = {
  Draft:     { bg: '#2A2E37',              text: '#9BA0A8', label: 'Draft' },
  Ready:     { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Ready' },
  Running:   { bg: 'rgba(34,197,94,0.1)',  text: '#22C55E', label: 'Running' },
  Paused:    { bg: 'rgba(234,179,8,0.1)',  text: '#EAB308', label: 'Paused' },
  Completed: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', label: 'Completed' },
  Cancelled: { bg: 'rgba(239,68,68,0.1)',  text: '#EF4444', label: 'Cancelled' },
};

const RECIPIENT_STATUS_STYLES: Record<RecipientStatus, { bg: string; text: string }> = {
  Pending: { bg: '#2A2E37',               text: '#9BA0A8' },
  Queued:  { bg: 'rgba(59,130,246,0.1)',  text: '#3B82F6' },
  Sending: { bg: 'rgba(234,179,8,0.1)',   text: '#EAB308' },
  Sent:    { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E' },
  Failed:  { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444' },
};

const EMAIL_LOG_STATUS_STYLES: Record<EmailLogStatus, { bg: string; text: string }> = {
  Pending: { bg: '#2A2E37',              text: '#9BA0A8' },
  Sent:    { bg: 'rgba(34,197,94,0.1)',  text: '#22C55E' },
  Failed:  { bg: 'rgba(239,68,68,0.1)',  text: '#EF4444' },
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

const CampaignModal: React.FC<CampaignModalProps> = ({ campaign, onClose }) => {
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

  const upload = campaign.uploads[0]; // most campaigns will have one recipient-list upload

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'recipients', label: `Recipients (${campaign.recipients.length})` },
    { id: 'template', label: 'Template' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      style={{ fontFamily: FONT.body }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-[#2A2E37] bg-[#171A21] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#2A2E37]">
          <div className="min-w-0">
            <h2
              style={{ fontFamily: FONT.display, color: '#FFFFFF' }}
              className="text-lg md:text-xl font-bold truncate"
            >
              {campaign.campaign_name}
            </h2>
            <p className="text-xs md:text-sm text-[#9BA0A8] mt-1 truncate">{campaign.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#22262E] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
          <span
            className="text-xs px-2.5 py-1 rounded font-medium"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.label}
          </span>
          <span className="text-xs text-[#6B727C] font-mono">
            Created {formatDate(campaign.created_at)}
          </span>
          <span className="text-xs text-[#6B727C] font-mono">
            Updated {formatDate(campaign.updated_at)}
          </span>
          <span className="text-xs text-[#6B727C]">
            From <span className="text-[#C7C9CE]">{campaign.sender_account.display_name}</span>{' '}
            <span className="font-mono">&lt;{campaign.sender_account.email}&gt;</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mt-4 border-b border-[#2A2E37]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-[#FF6A39] text-[#E8E6E1]'
                  : 'border-transparent text-[#6B727C] hover:text-[#9BA0A8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Recipients</p>
                  <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                    {stats.recipientCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Sent</p>
                  <p className="text-lg font-semibold text-[#22C55E] font-mono mt-1">
                    {stats.sent}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Failed</p>
                  <p className="text-lg font-semibold text-[#EF4444] font-mono mt-1">
                    {stats.failed}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Delivery Rate</p>
                  <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                    {stats.deliveryRate}%
                  </p>
                </div>
              </div>

              {/* Upload progress */}
              {upload && (
                <div className="p-4 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[#E8E6E1] font-medium truncate">
                      📄 {upload.original_filename}
                    </p>
                    <span className="text-xs text-[#6B727C] font-mono flex-shrink-0 ml-2">
                      {upload.status}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#2A2E37] overflow-hidden">
                    <div
                      className="h-full bg-[#FF6A39] rounded-full transition-all"
                      style={{
                        width: `${
                          upload.total_records
                            ? Math.min(100, (upload.processed_records / upload.total_records) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#6B727C] mt-1.5 font-mono">
                    {upload.processed_records} / {upload.total_records} records processed
                  </p>
                </div>
              )}

              {/* Template info */}
              <div className="p-4 rounded-lg bg-[#1B1E24] border border-[#2A2E37] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6B727C] mb-1">Template</p>
                  <p className="text-sm text-[#E8E6E1] font-medium">{campaign.template.name}</p>
                </div>
                <button
                  onClick={() => setTab('template')}
                  className="text-xs text-[#FF6A39] hover:text-[#e85a2c] font-medium"
                >
                  View preview →
                </button>
              </div>
            </div>
          )}

          {tab === 'recipients' && (
            <div className="space-y-2">
              {campaign.recipients.length === 0 && (
                <p className="text-sm text-[#6B727C] text-center py-8">No recipients yet.</p>
              )}
              {campaign.recipients.map((r) => {
                const rStyle = RECIPIENT_STATUS_STYLES[r.status];
                // find matching email log for this recipient, if one exists
                const log = campaign.email_logs.find((l) => l.recipient_id === r.id);
                const logStyle = log ? EMAIL_LOG_STATUS_STYLES[log.status] : null;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#E8E6E1] font-medium truncate">{r.name}</p>
                      <p className="text-xs text-[#6B727C] truncate font-mono">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span
                        className="text-[10px] px-2 py-1 rounded font-medium"
                        style={{ background: rStyle.bg, color: rStyle.text }}
                      >
                        {r.status}
                      </span>
                      {log && (
                        <span
                          className="text-[10px] px-2 py-1 rounded font-medium"
                          style={{ background: logStyle!.bg, color: logStyle!.text }}
                          title={log.sent_at ? `Sent at ${formatDate(log.sent_at)}` : undefined}
                        >
                          Email: {log.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'template' && (
            <div className="rounded-lg border border-[#2A2E37] overflow-hidden bg-white h-[420px]">
              <iframe
                title="Template preview"
                srcDoc={campaign.template.html_content}
                sandbox=""
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2A2E37]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#22262E] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;