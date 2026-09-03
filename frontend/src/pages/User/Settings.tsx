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
  Menu,
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
    className="relative h-5 w-9 md:h-6 md:w-11 shrink-0 rounded-full transition-colors"
    style={{ background: checked ? "#FF6A39" : "#2A2E37" }}
  >
    <span
      className="absolute top-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
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
    <label className="mb-1 md:mb-2 block text-[10px] md:text-xs lg:text-sm font-medium" style={{ color: "#C7C9CE" }}>
      {label}
    </label>
    {children}
    {hint && (
      <p className="mt-1 md:mt-1.5 text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
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
    <div className="px-3 md:px-4 lg:px-6 py-3 md:py-4 lg:py-5" style={{ borderBottom: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
      <h2
        style={{ 
          fontFamily: FONT.display, 
          color: danger ? "#F87171" : "#E8E6E1" 
        }}
        className="text-xs md:text-sm lg:text-base font-semibold"
      >
        {title}
      </h2>
      <p className="mt-0.5 md:mt-1 text-[9px] md:text-xs lg:text-sm" style={{ color: danger ? "#FCA5A5" : "#9BA0A8" }}>
        {description}
      </p>
    </div>
    <div className="p-3 md:p-4 lg:p-6">{children}</div>
    {footer && (
      <div className="flex justify-end px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4" style={{ borderTop: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "#2A2E37"}` }}>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          padding: 0.4rem 0.6rem;
          font-size: 0.7rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

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

        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        @media (min-width: 640px) {
          input.mf-input, select.mf-input {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }
        }
        @media (min-width: 1024px) {
          input.mf-input, select.mf-input {
            padding: 0.6rem 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        {/* Header */}
        <div className="mf-header mb-4 md:mb-5 lg:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                className="text-xl font-light md:text-2xl lg:text-3xl font-bold" 
              >
                Settings
              </h1>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                Configure your workspace, sending defaults and integrations.
              </p>
            </div>
          </div>
        </div>

        <div className="mf-settings-grid grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 lg:grid-cols-[220px_1fr]">
          {/* Section nav - Horizontal scroll on mobile */}
          <nav className="mf-nav flex gap-0.5 md:gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.key;
              const isDanger = s.key === "danger";
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className="mf-nav-btn flex shrink-0 items-center gap-1 md:gap-1.5 lg:gap-2.5 rounded-lg px-1.5 md:px-2 lg:px-3.5 py-1 md:py-1.5 lg:py-2.5 text-[8px] md:text-[9px] lg:text-sm font-medium transition-colors lg:shrink"
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
                  <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" />
                  <span className="hidden xs:inline">{s.label}</span>
                  <span className="xs:hidden">{s.label.substring(0, 4)}</span>
                </button>
              );
            })}
          </nav>

          {/* Section content */}
          <div className="space-y-3 md:space-y-4 lg:space-y-6">
            {active === "general" && (
              <Card
                title="General"
                description="Basic information about your workspace."
                footer={
                  <button
                    className="mf-save-btn rounded-lg px-3 md:px-4 lg:px-5 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white transition hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "#FF6A39" }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="mf-field-grid grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 md:grid-cols-2">
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
                    className="mf-save-btn rounded-lg px-3 md:px-4 lg:px-5 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white transition hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "#FF6A39" }}
                  >
                    Save changes
                  </button>
                }
              >
                <div className="mf-field-grid grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 md:grid-cols-2">
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

                <div className="mt-3 md:mt-4 lg:mt-6 space-y-0" style={{ borderTop: "1px solid #2A2E37" }}>
                  <ToggleRow
                    className="pt-3 md:pt-4 lg:pt-5"
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
                  <div className="mf-api-key-container flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 md:gap-2">
                    <div
                      className="mf-api-key-input flex-1 truncate rounded-lg px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 text-[9px] md:text-xs lg:text-sm"
                      style={{ 
                        fontFamily: FONT.mono, 
                        background: "#0B0E12", 
                        border: "1px solid #2A2E37", 
                        color: "#C7C9CE" 
                      }}
                    >
                      {apiKey}
                    </div>
                    <div className="mf-api-key-actions flex items-center gap-1.5 md:gap-2">
                      <button
                        onClick={copyKey}
                        className="flex h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
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
                          <Check size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: "#34D399" }} />
                        ) : (
                          <Copy size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: "#6B727C" }} />
                        )}
                      </button>
                      <button
                        className="flex h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                        style={{ border: "1px solid #2A2E37", background: "#12151B" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1B1E24";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#12151B";
                        }}
                        aria-label="Regenerate API key"
                      >
                        <RefreshCw size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: "#6B727C" }} />
                      </button>
                    </div>
                  </div>
                </Field>

                <div className="mt-3 md:mt-4 lg:mt-6">
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
    className={`mf-toggle-row flex items-center justify-between gap-2 md:gap-3 lg:gap-4 py-2 md:py-3 lg:py-4 ${className}`}
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div className="mf-toggle-row-content flex-1 min-w-0">
      <p className="mf-toggle-title text-[10px] md:text-xs lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>
        {title}
      </p>
      <p className="mf-toggle-desc mt-0.5 text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
        {description}
      </p>
    </div>
    <div className="mf-toggle-row-control shrink-0">
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
    className="mf-danger-row flex flex-col gap-1.5 md:gap-2 lg:gap-3 py-2 md:py-3 lg:py-4 sm:flex-row sm:items-center sm:justify-between"
    style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
  >
    <div className="min-w-0 flex-1">
      <p className="mf-danger-title text-[10px] md:text-xs lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>
        {title}
      </p>
      <p className="mf-danger-desc mt-0.5 text-[8px] md:text-[9px] lg:text-xs" style={{ color: "#6B727C" }}>
        {description}
      </p>
    </div>
    <button
      className="mf-danger-btn shrink-0 rounded-lg px-2.5 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-[9px] md:text-[10px] lg:text-sm font-medium transition-colors w-full sm:w-auto"
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