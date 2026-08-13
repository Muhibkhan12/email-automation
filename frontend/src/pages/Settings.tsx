import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Settings2,
  Send as SendIcon,
  Bell,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (matches other pages)                */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#2F6FED",
  primarySoft: "#EAF0FE",
  success: "#1FA971",
  successSoft: "#E6F7EF",
  warning: "#E8A23D",
  warningSoft: "#FDF3E4",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  dark: "#11141B",
  bg: "#F4F5F8",
  border: "#E7E8EC",
  textMuted: "#8A8F9C",
  textBody: "#4B4F5A",
};

type SectionKey = "general" | "email" | "notifications" | "api" | "danger";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Settings2 },
  { key: "email", label: "Email sending", icon: SendIcon },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "api", label: "API & webhooks", icon: KeyRound },
  { key: "danger", label: "Danger zone", icon: AlertTriangle },
];

/* ---------------------------------------------------------------------- */
/*  Small building blocks                                                  */
/* ---------------------------------------------------------------------- */

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const Toggle = ({ checked, onChange, label }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className="mf-focus relative h-6 w-11 shrink-0 rounded-full transition-colors"
    style={{ background: checked ? COLOR.primary : COLOR.border }}
  >
    <span
      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    />
  </button>
);

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Field = ({ label, hint, children }: FieldProps) => (
  <div>
    <label className="mb-2 block text-sm font-medium" style={{ color: COLOR.textBody }}>
      {label}
    </label>
    {children}
    {hint && (
      <p className="mt-1.5 text-xs" style={{ color: COLOR.textMuted }}>
        {hint}
      </p>
    )}
  </div>
);

const inputStyle: React.CSSProperties = {
  border: `1px solid ${COLOR.border}`,
  background: "#FFFFFF",
  color: COLOR.dark,
  fontFamily: FONT.body,
};

interface CardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}

const Card = ({ title, description, children, footer, danger }: CardProps) => (
  <section
    className="rounded-xl bg-white"
    style={{ border: `1px solid ${danger ? COLOR.danger + "40" : COLOR.border}` }}
  >
    <div className="px-6 py-5" style={{ borderBottom: `1px solid ${danger ? COLOR.danger + "30" : COLOR.border}` }}>
      <h2
        style={{ fontFamily: FONT.display, color: danger ? "#7A2A17" : COLOR.dark }}
        className="font-semibold"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: danger ? "#99432B" : COLOR.textMuted }}>
        {description}
      </p>
    </div>
    <div className="p-6">{children}</div>
    {footer && (
      <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${danger ? COLOR.danger + "30" : COLOR.border}` }}>
        {footer}
      </div>
    )}
  </section>
);

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Settings = () => {
  const [active, setActive] = useState<SectionKey>("general");

  const [workspaceName, setWorkspaceName] = useState("MailForge Workspace");
  const [timezone, setTimezone] = useState("Asia/Karachi (GMT+5)");
  const [replyTo, setReplyTo] = useState("support@company.com");

  const [rateLimit, setRateLimit] = useState("500");
  const [retries, setRetries] = useState("3");
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [pauseOnBounce, setPauseOnBounce] = useState(true);

  const [notifCampaignDone, setNotifCampaignDone] = useState(true);
  const [notifCampaignFailed, setNotifCampaignFailed] = useState(true);
  const [notifSenderIssue, setNotifSenderIssue] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);

  const [copied, setCopied] = useState(false);
  const apiKey = "mf_live_9f2a1c7e4b8d3f6091";

  const copyKey = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-focus:focus-visible,
        .mf-tab:focus-visible,
        .mf-btn:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-input:focus {
          border-color: ${COLOR.primary} !important;
        }
        input.mf-input, select.mf-input {
          width: 100%;
          border-radius: 0.5rem;
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
            className="text-3xl font-bold"
          >
            Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
            Configure your workspace, sending defaults and integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          {/* Section nav */}
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.key;
              const isDanger = s.key === "danger";
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className="mf-tab flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:shrink"
                  style={{
                    background: isActive ? (isDanger ? COLOR.dangerSoft : COLOR.primarySoft) : "transparent",
                    color: isActive ? (isDanger ? COLOR.danger : COLOR.primary) : COLOR.textBody,
                  }}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Section content */}
          <div className="space-y-6">
            {active === "general" && (
              <Card
                title="General"
                description="Basic information about your workspace."
                footer={
                  <button
                    className="mf-btn rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: COLOR.primary }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Workspace name">
                    <input
                      className="mf-input"
                      style={inputStyle}
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                  </Field>
                  <Field label="Timezone" hint="Used for scheduling and reporting.">
                    <select
                      className="mf-input"
                      style={inputStyle}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option>Asia/Karachi (GMT+5)</option>
                      <option>Asia/Dubai (GMT+4)</option>
                      <option>Europe/London (GMT+0)</option>
                      <option>America/New_York (GMT-4)</option>
                    </select>
                  </Field>
                  <Field label="Default reply-to address" hint="Used when a template doesn't set its own.">
                    <input
                      className="mf-input"
                      style={inputStyle}
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                    />
                  </Field>
                </div>
              </Card>
            )}

            {active === "email" && (
              <Card
                title="Email sending"
                description="Defaults applied across every campaign and automation."
                footer={
                  <button
                    className="mf-btn rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: COLOR.primary }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Send rate limit" hint="Emails per minute, per sender account.">
                    <input
                      className="mf-input"
                      style={{ ...inputStyle, fontFamily: FONT.mono }}
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                    />
                  </Field>
                  <Field label="Retry attempts" hint="On soft bounce or temporary SMTP failure.">
                    <input
                      className="mf-input"
                      style={{ ...inputStyle, fontFamily: FONT.mono }}
                      value={retries}
                      onChange={(e) => setRetries(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-1" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                  <ToggleRow
                    className="pt-5"
                    title="Track opens"
                    description="Embed a tracking pixel in outgoing emails."
                    checked={trackOpens}
                    onChange={() => setTrackOpens((v) => !v)}
                  />
                  <ToggleRow
                    title="Track clicks"
                    description="Rewrite links to measure click-through rate."
                    checked={trackClicks}
                    onChange={() => setTrackClicks((v) => !v)}
                  />
                  <ToggleRow
                    title="Pause on high bounce rate"
                    description="Automatically pause a campaign above 5% bounces."
                    checked={pauseOnBounce}
                    onChange={() => setPauseOnBounce((v) => !v)}
                  />
                </div>
              </Card>
            )}

            {active === "notifications" && (
              <Card title="Notifications" description="Choose what you get notified about.">
                <div className="space-y-1">
                  <ToggleRow
                    title="Campaign completed"
                    description="When a campaign finishes sending."
                    checked={notifCampaignDone}
                    onChange={() => setNotifCampaignDone((v) => !v)}
                  />
                  <ToggleRow
                    title="Campaign failed"
                    description="When a campaign stops due to errors or bounces."
                    checked={notifCampaignFailed}
                    onChange={() => setNotifCampaignFailed((v) => !v)}
                  />
                  <ToggleRow
                    title="Sender account issues"
                    description="When a sender account disconnects or gets rate-limited."
                    checked={notifSenderIssue}
                    onChange={() => setNotifSenderIssue((v) => !v)}
                  />
                  <ToggleRow
                    title="Weekly performance summary"
                    description="A digest of sends, opens and clicks every Monday."
                    checked={notifWeeklySummary}
                    onChange={() => setNotifWeeklySummary((v) => !v)}
                  />
                  <ToggleRow
                    title="Email me a copy"
                    description="Also deliver these notifications to your inbox."
                    checked={notifEmailDigest}
                    onChange={() => setNotifEmailDigest((v) => !v)}
                    last
                  />
                </div>
              </Card>
            )}

            {active === "api" && (
              <Card title="API & webhooks" description="Connect MailForge to your own tools and scripts.">
                <Field label="API key" hint="Keep this secret — it grants full send access to your account.">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 truncate rounded-lg px-4 py-2.5 text-sm"
                      style={{ fontFamily: FONT.mono, background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                    >
                      {apiKey}
                    </div>
                    <button
                      onClick={copyKey}
                      className="mf-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                      style={{ border: `1px solid ${COLOR.border}`, background: "#FFFFFF" }}
                      aria-label="Copy API key"
                    >
                      {copied ? (
                        <Check size={15} style={{ color: COLOR.success }} />
                      ) : (
                        <Copy size={15} style={{ color: COLOR.textMuted }} />
                      )}
                    </button>
                    <button
                      className="mf-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                      style={{ border: `1px solid ${COLOR.border}`, background: "#FFFFFF" }}
                      aria-label="Regenerate API key"
                    >
                      <RefreshCw size={15} style={{ color: COLOR.textMuted }} />
                    </button>
                  </div>
                </Field>

                <div className="mt-6">
                  <Field label="Webhook URL" hint="We'll POST delivery, open and click events here.">
                    <input
                      className="mf-input"
                      style={{ ...inputStyle, fontFamily: FONT.mono }}
                      placeholder="https://yourapp.com/webhooks/mailforge"
                    />
                  </Field>
                </div>
              </Card>
            )}

            {active === "danger" && (
              <Card
                title="Danger zone"
                description="These actions are irreversible — proceed carefully."
                danger
              >
                <div className="space-y-1">
                  <DangerRow
                    title="Pause all campaigns"
                    description="Immediately stop every currently running campaign."
                    action="Pause all"
                  />
                  <DangerRow
                    title="Reset sending statistics"
                    description="Clear all historical delivery, open and click data."
                    action="Reset stats"
                  />
                  <DangerRow
                    title="Delete workspace"
                    description="Permanently delete this workspace and everything in it."
                    action="Delete workspace"
                    last
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Row components                                                         */
/* ---------------------------------------------------------------------- */

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
  className?: string;
}

const ToggleRow = ({ title, description, checked, onChange, last, className = "" }: ToggleRowProps) => (
  <div
    className={`flex items-center justify-between gap-4 py-4 ${className}`}
    style={{ borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}
  >
    <div>
      <p className="text-sm font-medium" style={{ color: COLOR.dark }}>
        {title}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: COLOR.textMuted }}>
        {description}
      </p>
    </div>
    <Toggle checked={checked} onChange={onChange} label={title} />
  </div>
);

interface DangerRowProps {
  title: string;
  description: string;
  action: string;
  last?: boolean;
}

const DangerRow = ({ title, description, action, last }: DangerRowProps) => (
  <div
    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
    style={{ borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}
  >
    <div>
      <p className="text-sm font-medium" style={{ color: COLOR.dark }}>
        {title}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: COLOR.textMuted }}>
        {description}
      </p>
    </div>
    <button
      className="mf-btn shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-white"
      style={{ border: `1px solid ${COLOR.danger}55`, color: COLOR.danger, background: "#FFFFFF" }}
    >
      {action}
    </button>
  </div>
);

export default Settings;