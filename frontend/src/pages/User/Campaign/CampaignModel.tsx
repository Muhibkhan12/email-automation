// CampaignModal.tsx
import React, { useEffect } from 'react';
import type{ Campaign } from '../../../types/CampaignTypes';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_STYLES: Record<Campaign['status'], { bg: string; text: string; label: string }> = {
  Draft:     { bg: '#2A2E37',              text: '#9BA0A8', label: 'Draft' },
  Ready:     { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Ready' },
  Running:   { bg: 'rgba(34,197,94,0.1)',  text: '#22C55E', label: 'Running' },
  Paused:    { bg: 'rgba(234,179,8,0.1)',  text: '#EAB308', label: 'Paused' },
  Completed: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', label: 'Completed' },
  Cancelled: { bg: 'rgba(239,68,68,0.1)',  text: '#EF4444', label: 'Cancelled' },
};

interface CampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ campaign, onClose }) => {
  const statusStyle = STATUS_STYLES[campaign.status];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      style={{ fontFamily: FONT.body }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#2A2E37] bg-[#171A21] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#2A2E37] sticky top-0 bg-[#171A21]">
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

        {/* Body */}
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-xs px-2.5 py-1 rounded font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {statusStyle.label}
            </span>
            {campaign.created_at && (
              <span className="text-xs text-[#6B727C] font-mono">
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            )}
            <span className="text-xs text-[#6B727C] font-mono">
              Updated {new Date(campaign.updated_at).toLocaleDateString()}
            </span>
          </div>

          {/* Stats grid — remove any fields that don't exist on your Campaign type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {campaign.recipient_count !== undefined && (
              <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Recipients</p>
                <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                  {campaign.recipient_count}
                </p>
              </div>
            )}
            {campaign.sent_count !== undefined && (
              <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Sent</p>
                <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                  {campaign.sent_count}
                </p>
              </div>
            )}
            {campaign.open_rate !== undefined && (
              <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Open Rate</p>
                <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                  {campaign.open_rate}%
                </p>
              </div>
            )}
            {campaign.click_rate !== undefined && (
              <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37]">
                <p className="text-[10px] uppercase tracking-wide text-[#6B727C]">Click Rate</p>
                <p className="text-lg font-semibold text-[#E8E6E1] font-mono mt-1">
                  {campaign.click_rate}%
                </p>
              </div>
            )}
          </div>

          {/* Body / content preview */}
          {campaign.body && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#6B727C] mb-2">Content</p>
              <div className="p-3 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-sm text-[#C7C9CE] whitespace-pre-wrap max-h-64 overflow-y-auto">
                {campaign.body}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2A2E37] sticky bottom-0 bg-[#171A21]">
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