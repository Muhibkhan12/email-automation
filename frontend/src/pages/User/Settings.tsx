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

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
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
    className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
    style={{ background: checked ? "#FF6A39" : "#2A2E37" }}
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
    <label className="mb-2 block text-sm font-medium text-[#C7C9CE]">
      {label}
    </label>
    {children}
    {hint && (
      <p className="mt-1.5 text-xs text-[#6B727C]">
        {hint}
      </p>
    )}
  </div>
);

const inputStyle: React.CSSProperties = {
  border: "1px solid #2A2E37",
  background: "#0B0E12",
  color: "#E8E6E1",
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
    className="rounded-xl"
    style={{ 
      border: `1px solid ${danger ? "rgba(248,113,113,0.3)" : "#2A2E37"}`,
      background: "#12151B"
    }}
  >
    <div className="px-6 py-5" style={{ borderBottom: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
      <h2
        style={{ 
          fontFamily: FONT.display, 
          color: danger ? "#F87171" : "#E8E6E1" 
        }}
        className="font-semibold"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: danger ? "#FCA5A5" : "#9BA0A8" }}>
        {description}
      </p>
    </div>
    <div className="p-6">{children}</div>
    {footer && (
      <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
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
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-input:focus {
          border-color: #FF6A39 !important;
          box-shadow: 0 0 0 3px rgba(255,106,57,0.1) !important;
        }
        input.mf-input, select.mf-input {
          width: 100%;
          border-radius: 0.5rem;
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-8">
          <h1
            style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
            className="text-3xl font-bold text-[#E8E6E1]"
          >
            Settings
          </h1>
          <p className="mt-1 text-sm text-[#9BA0A8]">
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
                  className="flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:shrink"
                  style={{
                    background: isActive ? (isDanger ? "rgba(248,113,113,0.12)" : "rgba(255,106,57,0.12)") : "transparent",
                    color: isActive ? (isDanger ? "#F87171" : "#FF6A39") : "#9BA0A8",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#1B1E24";
                      e.currentTarget.style.color = "#E8E6E1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#9BA0A8";
                    }
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
                    className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "#FF6A39" }}
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
                    className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "#FF6A39" }}
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

                <div className="mt-6 space-y-1" style={{ borderTop: "1px solid #2A2E37" }}>
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
                      style={{ 
                        fontFamily: FONT.mono, 
                        background: "#0B0E12", 
                        border: "1px solid #2A2E37", 
                        color: "#C7C9CE" 
                      }}
                    >
                      {apiKey}
                    </div>
                    <button
                      onClick={copyKey}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                      style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1B1E24";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#12151B";
                      }}
                      aria-label="Copy API key"
                    >
                      {copied ? (
                        <Check size={15} style={{ color: "#34D399" }} />
                      ) : (
                        <Copy size={15} style={{ color: "#6B727C" }} />
                      )}
                    </button>
                    <button
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                      style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1B1E24";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#12151B";
                      }}
                      aria-label="Regenerate API key"
                    >
                      <RefreshCw size={15} style={{ color: "#6B727C" }} />
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
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div>
      <p className="text-sm font-medium text-[#E8E6E1]">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-[#6B727C]">
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
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div>
      <p className="text-sm font-medium text-[#E8E6E1]">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-[#6B727C]">
        {description}
      </p>
    </div>
    <button
      className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      style={{ 
        border: "1px solid rgba(248,113,113,0.3)", 
        color: "#F87171", 
        background: "transparent"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(248,113,113,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {action}
    </button>
  </div>
);

export default Settings;