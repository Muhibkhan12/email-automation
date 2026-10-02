// StartCampaignModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Rocket, FileEdit, AlertTriangle } from 'lucide-react';
import type { CreateCampaignData } from '../../../services/CampaignService';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface Props {
  onClose: () => void;
  /**
   * startNow = true  -> save as Draft, then start it (backend flips Draft -> Running)
   * startNow = false -> just save it as a Draft
   * Throw an Error from here to show a message inside the modal.
   */
  onSubmit: (data: CreateCampaignData, startNow: boolean) => Promise<void>;
}

const inputBase =
  'w-full rounded-2xl px-3.5 py-2.5 text-[13.5px] outline-none transition-all text-[#E8E6E1] placeholder:text-[#6B727C] focus:ring-2 focus:ring-[#FF6A39]/40';
const inputStyle: React.CSSProperties = {
  background: '#0F131B',
  boxShadow: 'inset 0 0 0 1px #232833',
  fontFamily: FONT.body,
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; hint?: string }> = ({
  htmlFor, children, hint,
}) => (
  <label htmlFor={htmlFor} className="block mb-1.5">
    <span className="text-[12.5px] font-medium" style={{ color: '#C7C9CE' }}>{children}</span>
    {hint && <span className="ml-2 text-[11px]" style={{ color: '#5A6172' }}>{hint}</span>}
  </label>
);

const StartCampaignModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [submitting, setSubmitting] = useState<null | 'start' | 'draft'>(null);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const busy = submitting !== null;

  useEffect(() => {
    firstFieldRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, busy]);

  const submit = async (startNow: boolean) => {
    setError(null);

    if (!campaignName.trim()) return setError('Give your campaign a name.');
    if (!subject.trim()) return setError('Add an email subject line.');

    // Backend enum is title-cased: 'Draft' | 'Ready' | 'Running' | ...
    // Always create as Draft; the /start endpoint handles the transition.
    const data = {
      campaign_name: campaignName.trim(),
      subject: subject.trim(),
      status: 'Draft',
    } as CreateCampaignData;

    setSubmitting(startNow ? 'start' : 'draft');
    try {
      await onSubmit(data, startNow);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Try again.');
      setSubmitting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-campaign-title"
    >
      <style>{`
        @keyframes scIn { from { opacity: 0; transform: translateY(14px) scale(0.985); } to { opacity: 1; transform: none; } }
        .sc-in { animation: scIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @media (prefers-reduced-motion: reduce) { .sc-in { animation: none; } }
        .sc-scroll::-webkit-scrollbar { width: 8px; }
        .sc-scroll::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; }
      `}</style>

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      <div
        className="sc-in relative w-full sm:max-w-130 max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #141821 0%, #10141D 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px -20px rgba(0,0,0,0.8)',
          fontFamily: FONT.body,
        }}
      >
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,106,57,0.22), rgba(255,106,57,0.06))',
                boxShadow: 'inset 0 0 0 1px rgba(255,106,57,0.28)',
                color: '#FF6A39',
              }}
            >
              <Rocket size={18} />
            </div>
            <div>
              <h2
                id="start-campaign-title"
                className="text-[18px] font-bold leading-tight"
                style={{ fontFamily: FONT.display, color: '#F2F0EB', letterSpacing: '-0.02em' }}
              >
                Start a campaign
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#7A8092' }}>
                Give it a name and a subject to launch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-2 rounded-xl text-[#8A90A0] hover:text-[#F2F0EB] hover:bg-[#1B2130] transition-colors disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        <div className="sc-scroll flex-1 overflow-y-auto px-5 md:px-6 pb-2 space-y-4">
          <div>
            <Label htmlFor="sc-name">Campaign name</Label>
            <input
              id="sc-name"
              ref={firstFieldRef}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. October product update"
              className={inputBase}
              style={inputStyle}
            />
          </div>

          <div>
            <Label htmlFor="sc-subject">Email subject</Label>
            <input
              id="sc-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What recipients see in their inbox"
              className={inputBase}
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[12.5px]"
              style={{
                background: 'rgba(248,113,113,0.06)',
                color: '#F87171',
                boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.22)',
              }}
              role="alert"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div
          className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-5 md:px-6 py-4 mt-2"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all disabled:opacity-40"
            style={{ background: '#141821', color: '#E8E6E1', boxShadow: 'inset 0 0 0 1px #232833' }}
          >
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all disabled:opacity-50"
            style={{ background: '#1B2130', color: '#E8E6E1', boxShadow: 'inset 0 0 0 1px #2A3042' }}
          >
            {submitting === 'draft' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <FileEdit size={14} />
                Save as draft
              </>
            )}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: '#FF6A39', boxShadow: '0 12px 30px -12px rgba(255,106,57,0.65)' }}
          >
            {submitting === 'start' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Rocket size={14} />
                Start campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartCampaignModal;