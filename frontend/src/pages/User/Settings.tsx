import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Settings2, Send as SendIcon, Bell, KeyRound, AlertTriangle,
  Copy, Check, RefreshCw, Menu, Eye, EyeOff, ChevronRight,
  ShieldCheck, Save, Webhook, RotateCcw,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type SectionKey = "general" | "email" | "notifications" | "api" | "danger";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType; hint: string }[] = [
  { key: "general",       label: "General",        icon: Settings2,   hint: "Workspace basics" },
  { key: "email",         label: "Email sending",  icon: SendIcon,    hint: "Sending defaults" },
  { key: "notifications", label: "Notifications",  icon: Bell,        hint: "What you get told about" },
  { key: "api",           label: "API & webhooks", icon: KeyRound,    hint: "Integrations" },
  { key: "danger",        label: "Danger zone",    icon: AlertTriangle, hint: "Irreversible actions" },
];

/* ─────────────────── Primitives ─────────────────── */

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked, onChange, label,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
    style={{
      background: checked ? "#FF6A39" : "#232938",
      boxShadow: checked ? "0 0 0 3px rgba(255,106,57,0.15)" : "inset 0 0 0 1px #1A1F2B",
    }}
  >
    <span
      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    />
  </button>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label, hint, children,
}) => (
  <div>
    <label className="block text-[11.5px] font-medium text-[#C7C9CE] mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-[11px] text-[#6B727C]">{hint}</p>}
  </div>
);

const InputShell: React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div
    className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all"
    style={{ background: "#0F131C", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
    onFocusCapture={(e) =>
      (e.currentTarget.style.boxShadow =
        "inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)")
    }
    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B")}
  >
    {Icon && <Icon size={14} className="text-[#6A7080] shrink-0" />}
    {children}
  </div>
);

const textInputCls =
  "w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none";
const monoInputCls = `${textInputCls} font-mono`;

const Card: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
  right?: React.ReactNode;
}> = ({ title, description, icon: Icon, children, footer, danger, right }) => (
  <section
    className="rounded-3xl overflow-hidden soft-ring float-in"
    style={{
      background: "linear-gradient(180deg, #141821 0%, #10141D 100%)",
      boxShadow: danger
        ? "inset 0 0 0 1px rgba(248,113,113,0.22)"
        : "inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02)",
    }}
  >
    {/* Header */}
    <div className="flex flex-wrap items-start justify-between gap-3 px-4 md:px-6 py-4 md:py-5 border-b border-[#1A1F2B]">
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            background: danger ? "rgba(248,113,113,0.10)" : "rgba(255,106,57,0.10)",
            boxShadow: danger
              ? "inset 0 0 0 1px rgba(248,113,113,0.22)"
              : "inset 0 0 0 1px rgba(255,106,57,0.22)",
          }}
        >
          <Icon size={16} className={danger ? "text-[#F87171]" : "text-[#FF6A39]"} />
        </div>
        <div className="min-w-0">
          <h2
            style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
            className={`text-[15px] font-semibold tracking-tight ${danger ? "text-[#F87171]" : "text-[#F2F0EB]"}`}
          >
            {title}
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: danger ? "#E8A5A5" : "#7A8092" }}>
            {description}
          </p>
        </div>
      </div>
      {right}
    </div>

    {/* Body */}
    <div className="p-4 md:p-6">{children}</div>

    {/* Footer */}
    {footer && (
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 md:px-6 py-4 border-t border-[#1A1F2B]">
        {footer}
      </div>
    )}
  </section>
);

/* ─────────────────── Rows ─────────────────── */

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
}> = ({ title, description, checked, onChange, last }) => (
  <div
    className="group flex items-start justify-between gap-4 py-3.5 first:pt-0"
    style={{ borderBottom: last ? "none" : "1px solid #1A1F2B" }}
  >
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-[#F2F0EB]">{title}</p>
      <p className="mt-0.5 text-[11.5px] text-[#7A8092]">{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  </div>
);

const DangerRow: React.FC<{
  title: string;
  description: string;
  action: string;
  last?: boolean;
}> = ({ title, description, action, last }) => (
  <div
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0"
    style={{ borderBottom: last ? "none" : "1px solid #1A1F2B" }}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-medium text-[#F2F0EB]">{title}</p>
      <p className="mt-0.5 text-[11.5px] text-[#7A8092]">{description}</p>
    </div>
    <button
      className="shrink-0 rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-all hover:-translate-y-0.5"
      style={{
        background: "rgba(248,113,113,0.08)",
        color: "#F87171",
        boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)",
      }}
    >
      {action}
    </button>
  </div>
);

/* ─────────────────── Page ─────────────────── */

const Settings = () => {
  const [active, setActive] = useState<SectionKey>("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General
  const [workspaceName, setWorkspaceName] = useState("MailForge Workspace");
  const [timezone, setTimezone] = useState("Asia/Karachi (GMT+5)");
  const [replyTo, setReplyTo] = useState("support@company.com");

  // Email sending
  const [rateLimit, setRateLimit] = useState("500");
  const [retries, setRetries] = useState("3");
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [pauseOnBounce, setPauseOnBounce] = useState(true);

  // Notifications
  const [notifCampaignDone, setNotifCampaignDone] = useState(true);
  const [notifCampaignFailed, setNotifCampaignFailed] = useState(true);
  const [notifSenderIssue, setNotifSenderIssue] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);

  // API
  const [copied, setCopied] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const apiKey = "mf_live_9f2a1c7e4b8d3f6091";

  const maskedKey = useMemo(() => {
    if (revealKey) return apiKey;
    const head = apiKey.slice(0, 8);
    const tail = apiKey.slice(-4);
    return `${head}${"•".repeat(Math.max(6, apiKey.length - head.length - tail.length))}${tail}`;
  }, [apiKey, revealKey]);

  const copyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .st-main::-webkit-scrollbar { width: 10px; }
        .st-main::-webkit-scrollbar-track { background: transparent; }
        .st-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .st-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="st-main flex-1 overflow-y-auto" style={{ background: "#0B0E13", height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141821" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#6B727C" }}>Account</span>
                    <ChevronRight size={10} style={{ color: "#3A3F4A" }} />
                    <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#FF6A39" }}>Settings</span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Settings
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Configure your workspace, sending defaults, and integrations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Saved
                </span>
              </div>
            </header>

            {/* ── Layout ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

              {/* Section nav */}
              <nav className="flex lg:flex-col gap-1.5 lg:gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = active === s.key;
                  const isDanger = s.key === "danger";
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActive(s.key)}
                      className="group shrink-0 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium transition-all lg:shrink text-left"
                      style={{
                        background: isActive
                          ? isDanger
                            ? "rgba(248,113,113,0.10)"
                            : "rgba(255,106,57,0.10)"
                          : "#141821",
                        color: isActive
                          ? isDanger ? "#F87171" : "#FF6A39"
                          : "#C7C9CE",
                        boxShadow: isActive
                          ? isDanger
                            ? "inset 0 0 0 1px rgba(248,113,113,0.22)"
                            : "inset 0 0 0 1px rgba(255,106,57,0.22)"
                          : "inset 0 0 0 1px #1A1F2B",
                      }}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Section content */}
              <div className="space-y-6 min-w-0">
                {active === "general" && (
                  <Card
                    title="General"
                    description="Basic information about your workspace."
                    icon={Settings2}
                    footer={
                      <SaveButton />
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <Field label="Workspace name">
                        <InputShell>
                          <input
                            className={textInputCls}
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                          />
                        </InputShell>
                      </Field>

                      <Field label="Timezone" hint="Used for scheduling and reporting.">
                        <InputShell>
                          <select
                            className={textInputCls}
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                          >
                            <option>Asia/Karachi (GMT+5)</option>
                            <option>Asia/Dubai (GMT+4)</option>
                            <option>Europe/London (GMT+0)</option>
                            <option>America/New_York (GMT-4)</option>
                          </select>
                        </InputShell>
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Default reply-to address" hint="Used when a template doesn't set its own.">
                          <InputShell>
                            <input
                              className={monoInputCls}
                              value={replyTo}
                              onChange={(e) => setReplyTo(e.target.value)}
                            />
                          </InputShell>
                        </Field>
                      </div>
                    </div>
                  </Card>
                )}

                {active === "email" && (
                  <Card
                    title="Email sending"
                    description="Defaults applied across every campaign and automation."
                    icon={SendIcon}
                    footer={<SaveButton />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-2">
                      <Field label="Send rate limit" hint="Emails per minute, per sender account.">
                        <InputShell>
                          <input
                            className={monoInputCls}
                            value={rateLimit}
                            onChange={(e) => setRateLimit(e.target.value)}
                          />
                        </InputShell>
                      </Field>
                      <Field label="Retry attempts" hint="On soft bounce or temporary SMTP failure.">
                        <InputShell>
                          <input
                            className={monoInputCls}
                            value={retries}
                            onChange={(e) => setRetries(e.target.value)}
                          />
                        </InputShell>
                      </Field>
                    </div>

                    <div className="mt-6 pt-5" style={{ borderTop: "1px solid #1A1F2B" }}>
                      <ToggleRow
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
                        last
                      />
                    </div>
                  </Card>
                )}

                {active === "notifications" && (
                  <Card
                    title="Notifications"
                    description="Choose what you get notified about."
                    icon={Bell}
                  >
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
                  </Card>
                )}

                {active === "api" && (
                  <Card
                    title="API & webhooks"
                    description="Connect MailForge to your own tools and scripts."
                    icon={KeyRound}
                    right={
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          background: "rgba(52,211,153,0.10)",
                          color: "#34D399",
                          boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.22)",
                        }}
                      >
                        <ShieldCheck size={11} /> Encrypted at rest
                      </span>
                    }
                  >
                    <Field label="API key" hint="Keep this secret — it grants full send access to your account.">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <InputShell>
                          <KeyRound size={14} className="text-[#6A7080] shrink-0" />
                          <input
                            readOnly
                            value={maskedKey}
                            className={monoInputCls}
                          />
                          <button
                            type="button"
                            onClick={() => setRevealKey((r) => !r)}
                            aria-label={revealKey ? "Hide API key" : "Reveal API key"}
                            className="shrink-0 text-[#5A6172] hover:text-[#C7C9CE] transition-colors"
                          >
                            {revealKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </InputShell>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={copyKey}
                            className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[12px] font-medium transition-all"
                            style={{
                              background: copied ? "rgba(52,211,153,0.10)" : "#0F131C",
                              color: copied ? "#34D399" : "#DADEE7",
                              boxShadow: copied
                                ? "inset 0 0 0 1px rgba(52,211,153,0.22)"
                                : "inset 0 0 0 1px #1A1F2B",
                            }}
                          >
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                          <button
                            aria-label="Regenerate API key"
                            className="inline-flex items-center justify-center rounded-2xl p-2.5 transition-all"
                            style={{
                              background: "#0F131C",
                              color: "#DADEE7",
                              boxShadow: "inset 0 0 0 1px #1A1F2B",
                            }}
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>
                      </div>
                    </Field>

                    <div className="mt-6 pt-5" style={{ borderTop: "1px solid #1A1F2B" }}>
                      <Field label="Webhook URL" hint="We'll POST delivery, open and click events here.">
                        <InputShell icon={Webhook}>
                          <input
                            className={monoInputCls}
                            placeholder="https://yourapp.com/webhooks/mailforge"
                          />
                        </InputShell>
                      </Field>
                    </div>
                  </Card>
                )}

                {active === "danger" && (
                  <Card
                    title="Danger zone"
                    description="These actions are irreversible — proceed carefully."
                    icon={AlertTriangle}
                    danger
                  >
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
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────── Save button ─────────────────── */

const SaveButton = () => (
  <button
    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
    style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
  >
    <Save size={14} />
    Save changes
  </button>
);

export default Settings;