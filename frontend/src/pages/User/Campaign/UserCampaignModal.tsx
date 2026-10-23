// StartCampaignModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Rocket, FileEdit, AlertTriangle } from 'lucide-react';
import type { CreateCampaignData } from '../../../services/CampaignService';

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
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

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
  'w-full rounded-md px-3 py-2 text-[13px] outline-none transition-shadow';

const inputStyle: React.CSSProperties = {
  background: T.surface2,
  color: T.text,
  boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
  fontFamily: FONT.body,
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; hint?: string }> = ({
  htmlFor, children, hint,
}) => (
  <label htmlFor={htmlFor} className="block mb-1.5">
    <span className="text-[12px] font-medium" style={{ color: T.textMuted }}>{children}</span>
    {hint && <span className="ml-2 text-[11px]" style={{ color: T.textFaint }}>{hint}</span>}
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
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-campaign-title"
    >
      <style>{`
        @keyframes scIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: none } }
        .sc-in { animation: scIn 0.15s ease-out }
        @media (prefers-reduced-motion: reduce) { .sc-in { animation: none !important } }
        .sc-scroll::-webkit-scrollbar { width: 6px }
        .sc-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px }
      `}</style>

      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => !busy && onClose()}
      />

      <div
        className="sc-in relative w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-xl sm:rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          boxShadow: `inset 0 0 0 1px ${T.border}, 0 24px 64px -16px rgba(0,0,0,0.7)`,
          fontFamily: FONT.body,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-4 md:px-5 pt-4 md:pt-5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: T.brandSoft, color: T.brand }}
            >
              <Rocket size={15} />
            </div>
            <div>
              <h2
                id="start-campaign-title"
                className="text-[15px] font-semibold leading-tight"
                style={{ color: T.text }}
              >
                Start a campaign
              </h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                Give it a name and a subject to launch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-40"
            style={{ color: T.textMuted, background: T.surface2 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="sc-scroll flex-1 overflow-y-auto px-4 md:px-5 pb-1 space-y-3.5">
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
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
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
              onFocus={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
            />
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-md px-3 py-2.5 text-[12px]"
              style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
              role="alert"
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 md:px-5 py-3.5 mt-2"
          style={{ borderTop: `1px solid ${T.borderSoft}` }}
        >
          <button
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-40"
            style={{ color: T.textMuted }}
          >
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
          >
            {submitting === 'draft' ? (
              <>
                <span
                  className="w-3 h-3 border-2 rounded-full animate-spin"
                  style={{ borderColor: T.textMuted, borderTopColor: 'transparent' }}
                />
                Saving…
              </>
            ) : (
              <>
                <FileEdit size={12} />
                Save as draft
              </>
            )}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100"
            style={{ background: T.brand, boxShadow: '0 6px 18px -8px rgba(99,102,241,0.65)' }}
          >
            {submitting === 'start' ? (
              <>
                <span
                  className="w-3 h-3 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                />
                Starting…
              </>
            ) : (
              <>
                <Rocket size={12} />
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