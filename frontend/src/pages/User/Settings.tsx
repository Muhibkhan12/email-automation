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
    <label className="mb-2 block text-xs md:text-sm font-medium" style={{ color: "#C7C9CE" }}>
      {label}
    </label>
    {children}
    {hint && (
      <p className="mt-1.5 text-[10px] md:text-xs" style={{ color: "#6B727C" }}>
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
    className="rounded-xl overflow-hidden"
    style={{ 
      border: `1px solid ${danger ? "rgba(248,113,113,0.3)" : "#2A2E37"}`,
      background: "#12151B"
    }}
  >
    <div className="px-4 md:px-6 py-4 md:py-5" style={{ borderBottom: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
      <h2
        style={{ 
          fontFamily: FONT.display, 
          color: danger ? "#F87171" : "#E8E6E1" 
        }}
        className="text-sm md:text-base font-semibold"
      >
        {title}
      </h2>
      <p className="mt-1 text-xs md:text-sm" style={{ color: danger ? "#FCA5A5" : "#9BA0A8" }}>
        {description}
      </p>
    </div>
    <div className="p-4 md:p-6">{children}</div>
    {footer && (
      <div className="flex justify-end px-4 md:px-6 py-3 md:py-4" style={{ borderTop: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-input:focus {
          border-color: #FF6A39 !important;
          box-shadow: 0 0 0 3px rgba(255,106,57,0.1) !important;
        }
        input.mf-input, select.mf-input {
          width: 100%;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        /* Custom scrollbar for the main content */
        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .mf-settings-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-nav {
            flex-direction: row !important;
            overflow-x: auto !important;
            padding-bottom: 0.5rem !important;
          }
          .mf-nav-btn {
            white-space: nowrap !important;
            font-size: 0.7rem !important;
            padding: 0.4rem 0.75rem !important;
          }
        }

        @media (max-width: 768px) {
          .mf-header h1 {
            font-size: 1.5rem !important;
          }
          .mf-field-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-toggle-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem !important;
          }
          .mf-toggle-row-content {
            width: 100% !important;
          }
          .mf-toggle-row-control {
            align-self: flex-end !important;
          }
          .mf-danger-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mf-danger-row button {
            width: 100% !important;
            justify-content: center !important;
          }
          .mf-api-key-container {
            flex-direction: column !important;
          }
          .mf-api-key-input {
            width: 100% !important;
          }
          .mf-api-key-actions {
            width: 100% !important;
            justify-content: stretch !important;
          }
          .mf-api-key-actions button {
            flex: 1 !important;
          }
          .mf-main-content {
            padding: 0.75rem !important;
          }
          .mf-card-padding {
            padding: 0.75rem !important;
          }
          .mf-save-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 640px) {
          .mf-nav-btn {
            font-size: 0.6rem !important;
            padding: 0.3rem 0.6rem !important;
          }
          .mf-nav-btn svg {
            width: 0.8rem !important;
            height: 0.8rem !important;
          }
          .mf-field-label {
            font-size: 0.7rem !important;
          }
          .mf-field-input {
            font-size: 0.7rem !important;
            padding: 0.4rem 0.6rem !important;
          }
          .mf-toggle-title {
            font-size: 0.75rem !important;
          }
          .mf-toggle-desc {
            font-size: 0.6rem !important;
          }
          .mf-danger-title {
            font-size: 0.75rem !important;
          }
          .mf-danger-desc {
            font-size: 0.6rem !important;
          }
          .mf-danger-btn {
            font-size: 0.65rem !important;
            padding: 0.4rem !important;
          }
        }
      `}</style>

      {/* Sidebar - sticky on all screen sizes */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-6 lg:p-8" style={{ background: "#12151B", height: "100vh" }}>
        {/* Header */}
        <div className="mf-header mb-5 md:mb-8">
          <h1
            style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
            className="text-2xl md:text-3xl font-bold" 
            style={{ color: "#E8E6E1" }}
          >
            Settings
          </h1>
          <p className="mt-1 text-xs md:text-sm" style={{ color: "#9BA0A8" }}>
            Configure your workspace, sending defaults and integrations.
          </p>
        </div>

        <div className="mf-settings-grid grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[220px_1fr]">
          {/* Section nav */}
          <nav className="mf-nav flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.key;
              const isDanger = s.key === "danger";
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className="mf-nav-btn flex shrink-0 items-center gap-1.5 md:gap-2.5 rounded-lg px-2.5 md:px-3.5 py-2 md:py-2.5 text-[10px] md:text-sm font-medium transition-colors lg:shrink"
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
                  <Icon size={13} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Section content */}
          <div className="space-y-4 md:space-y-6">
            {active === "general" && (
              <Card
                title="General"
                description="Basic information about your workspace."
                footer={
                  <button
                    className="mf-save-btn rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "#FF6A39" }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="mf-field-grid grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                  <Field label="Workspace name">
                    <input
                      className="mf-field-input mf-input"
                      style={inputStyle}
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                  </Field>
                  <Field label="Timezone" hint="Used for scheduling and reporting.">
                    <select
                      className="mf-field-input mf-input"
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
                      className="mf-field-input mf-input"
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
                    className="mf-save-btn rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "#FF6A39" }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="mf-field-grid grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                  <Field label="Send rate limit" hint="Emails per minute, per sender account.">
                    <input
                      className="mf-field-input mf-input"
                      style={{ ...inputStyle, fontFamily: FONT.mono }}
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                    />
                  </Field>
                  <Field label="Retry attempts" hint="On soft bounce or temporary SMTP failure.">
                    <input
                      className="mf-field-input mf-input"
                      style={{ ...inputStyle, fontFamily: FONT.mono }}
                      value={retries}
                      onChange={(e) => setRetries(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="mt-4 md:mt-6 space-y-0" style={{ borderTop: "1px solid #2A2E37" }}>
                  <ToggleRow
                    className="pt-4 md:pt-5"
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
                <div className="space-y-0">
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
                  <div className="mf-api-key-container flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div
                      className="mf-api-key-input flex-1 truncate rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm"
                      style={{ 
                        fontFamily: FONT.mono, 
                        background: "#0B0E12", 
                        border: "1px solid #2A2E37", 
                        color: "#C7C9CE" 
                      }}
                    >
                      {apiKey}
                    </div>
                    <div className="mf-api-key-actions flex items-center gap-2">
                      <button
                        onClick={copyKey}
                        className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
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
                          <Check size={13} style={{ color: "#34D399" }} />
                        ) : (
                          <Copy size={13} style={{ color: "#6B727C" }} />
                        )}
                      </button>
                      <button
                        className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                        style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1B1E24";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#12151B";
                        }}
                        aria-label="Regenerate API key"
                      >
                        <RefreshCw size={13} style={{ color: "#6B727C" }} />
                      </button>
                    </div>
                  </div>
                </Field>

                <div className="mt-4 md:mt-6">
                  <Field label="Webhook URL" hint="We'll POST delivery, open and click events here.">
                    <input
                      className="mf-field-input mf-input"
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
                <div className="space-y-0">
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
    className={`mf-toggle-row flex items-center justify-between gap-3 md:gap-4 py-3 md:py-4 ${className}`}
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div className="mf-toggle-row-content flex-1">
      <p className="mf-toggle-title text-xs md:text-sm font-medium" style={{ color: "#E8E6E1" }}>
        {title}
      </p>
      <p className="mf-toggle-desc mt-0.5 text-[10px] md:text-xs" style={{ color: "#6B727C" }}>
        {description}
      </p>
    </div>
    <div className="mf-toggle-row-control">
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
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
    className="mf-danger-row flex flex-col gap-2 md:gap-3 py-3 md:py-4 sm:flex-row sm:items-center sm:justify-between"
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div>
      <p className="mf-danger-title text-xs md:text-sm font-medium" style={{ color: "#E8E6E1" }}>
        {title}
      </p>
      <p className="mf-danger-desc mt-0.5 text-[10px] md:text-xs" style={{ color: "#6B727C" }}>
        {description}
      </p>
    </div>
    <button
      className="mf-danger-btn shrink-0 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-medium transition-colors"
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