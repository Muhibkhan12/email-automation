import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Settings2, Send as SendIcon, Bell, KeyRound, AlertTriangle,
  Copy, Check, RefreshCw, Menu, Eye, EyeOff, ChevronRight,
  ShieldCheck, Save, Webhook, Palette, Sun, Moon, Monitor,
} from "lucide-react";

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
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
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

/* ─────────────── theme system ─────────────── */

type ThemeId = "indigo" | "emerald" | "rose" | "amber" | "sky";
type Mode = "dark" | "light" | "system";

interface ThemePreset {
  id: ThemeId;
  label: string;
  brand: string;
  brandSoft: string;
  brandBorder: string;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: "indigo",  label: "Indigo",   brand: "#6366F1", brandSoft: "rgba(99,102,241,0.12)",  brandBorder: "rgba(99,102,241,0.35)" },
  { id: "emerald", label: "Emerald",  brand: "#22C55E", brandSoft: "rgba(34,197,94,0.12)",   brandBorder: "rgba(34,197,94,0.35)" },
  { id: "rose",    label: "Rose",     brand: "#F43F5E", brandSoft: "rgba(244,63,94,0.12)",   brandBorder: "rgba(244,63,94,0.35)" },
  { id: "amber",   label: "Amber",    brand: "#F59E0B", brandSoft: "rgba(245,158,11,0.12)",  brandBorder: "rgba(245,158,11,0.35)" },
  { id: "sky",     label: "Sky",      brand: "#0EA5E9", brandSoft: "rgba(14,165,233,0.12)",  brandBorder: "rgba(14,165,233,0.35)" },
];

const THEME_STORAGE_KEY = "mf.theme";
const MODE_STORAGE_KEY  = "mf.mode";

const applyTheme = (themeId: ThemeId, mode: Mode) => {
  const preset = THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[0];
  const root = document.documentElement;
  root.style.setProperty("--mf-brand", preset.brand);
  root.style.setProperty("--mf-brand-soft", preset.brandSoft);
  root.style.setProperty("--mf-brand-border", preset.brandBorder);

  // Resolve "system" to the OS preference
  const resolvedMode =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : mode;
  root.dataset.mode = resolvedMode;
  root.dataset.theme = themeId;
};

const loadTheme = (): { theme: ThemeId; mode: Mode } => {
  try {
    const theme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || "indigo";
    const mode  = (localStorage.getItem(MODE_STORAGE_KEY)  as Mode)    || "dark";
    return { theme, mode };
  } catch {
    return { theme: "indigo", mode: "dark" };
  }
};

/* ─────────────── sections ─────────────── */

type SectionKey = "general" | "appearance" | "email" | "notifications" | "api" | "danger";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] = [
  { key: "general",       label: "General",        icon: Settings2 },
  { key: "appearance",    label: "Appearance",     icon: Palette },
  { key: "email",         label: "Email sending",  icon: SendIcon },
  { key: "notifications", label: "Notifications",  icon: Bell },
  { key: "api",           label: "API & webhooks", icon: KeyRound },
  { key: "danger",        label: "Danger zone",    icon: AlertTriangle },
];

/* ─────────────── primitives ─────────────── */

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked, onChange, label,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
    style={{
      background: checked ? T.brand : T.surfaceHi,
      boxShadow: `inset 0 0 0 1px ${checked ? T.brandBorder : T.border}`,
    }}
  >
    <span
      className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
    />
  </button>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label, hint, children,
}) => (
  <div>
    <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px]" style={{ color: T.textFaint }}>{hint}</p>}
  </div>
);

const InputShell: React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div
    className="flex items-center gap-2 rounded-md px-2.5 py-2 transition-shadow"
    style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
    onFocusCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`)}
    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
  >
    {Icon && <Icon size={13} className="shrink-0" style={{ color: T.textFaint }} />}
    {children}
  </div>
);

const textInputCls =
  "w-full bg-transparent text-[12.5px] outline-none";
const textInputStyle: React.CSSProperties = { color: T.text, fontFamily: FONT.body };
const monoInputStyle: React.CSSProperties = { color: T.text, fontFamily: FONT.mono, fontSize: 12.5 };

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
    className="rounded-xl overflow-hidden"
    style={{
      background: T.surface,
      boxShadow: danger ? `inset 0 0 0 1px ${T.dangerBorder}` : RING,
    }}
  >
    <div
      className="flex flex-wrap items-start justify-between gap-3 px-4 md:px-5 py-3.5"
      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{
            background: danger ? T.dangerSoft : T.brandSoft,
            color: danger ? T.danger : T.brand,
          }}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <h2
            className="text-[13.5px] font-semibold tracking-tight"
            style={{ color: danger ? T.danger : T.text }}
          >
            {title}
          </h2>
          <p className="text-[11.5px] mt-0.5" style={{ color: danger ? "rgba(239,68,68,0.8)" : T.textMuted }}>
            {description}
          </p>
        </div>
      </div>
      {right}
    </div>

    <div className="p-4 md:p-5">{children}</div>

    {footer && (
      <div
        className="flex flex-wrap items-center justify-end gap-2 px-4 md:px-5 py-3"
        style={{ borderTop: `1px solid ${T.borderSoft}` }}
      >
        {footer}
      </div>
    )}
  </section>
);

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
}> = ({ title, description, checked, onChange, last }) => (
  <div
    className="flex items-start justify-between gap-4 py-3 first:pt-0"
    style={{ borderBottom: last ? "none" : `1px solid ${T.borderSoft}` }}
  >
    <div className="flex-1 min-w-0">
      <p className="text-[12.5px] font-medium" style={{ color: T.text }}>{title}</p>
      <p className="mt-0.5 text-[11px]" style={{ color: T.textMuted }}>{description}</p>
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
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 first:pt-0"
    style={{ borderBottom: last ? "none" : `1px solid ${T.borderSoft}` }}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] font-medium" style={{ color: T.text }}>{title}</p>
      <p className="mt-0.5 text-[11px]" style={{ color: T.textMuted }}>{description}</p>
    </div>
    <button
      className="shrink-0 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:brightness-110"
      style={{ background: T.dangerSoft, color: T.danger, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
    >
      {action}
    </button>
  </div>
);

/* ─────────────── page ─────────────── */

const Settings = () => {
  const [active, setActive] = useState<SectionKey>("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General
  const [workspaceName, setWorkspaceName] = useState("MailForge Workspace");
  const [timezone, setTimezone] = useState("Asia/Karachi (GMT+5)");
  const [replyTo, setReplyTo] = useState("support@company.com");

  // Appearance
  const initial = loadTheme();
  const [theme, setTheme] = useState<ThemeId>(initial.theme);
  const [mode, setMode]   = useState<Mode>(initial.mode);

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

  // Apply theme/mode live + persist
  useEffect(() => {
    applyTheme(theme, mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {}
  }, [theme, mode]);

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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .st-main::-webkit-scrollbar { width: 8px; }
        .st-main::-webkit-scrollbar-track { background: transparent; }
        .st-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .st-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        select option { background: ${T.surface}; color: ${T.text}; }
        @media (prefers-reduced-motion: reduce) { .st-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="st-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Account</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.brand }}>Settings</span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Settings
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Configure your workspace, sending defaults, and integrations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                Saved
              </span>
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">

            {/* Section nav */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.key;
                const isDanger = s.key === "danger";
                return (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className="group shrink-0 flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors text-left"
                    style={{
                      background: isActive
                        ? (isDanger ? T.dangerSoft : T.brandSoft)
                        : "transparent",
                      color: isActive
                        ? (isDanger ? T.danger : T.brand)
                        : T.textMuted,
                    }}
                  >
                    <Icon size={13} className="shrink-0" />
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Section content */}
            <div className="space-y-4 min-w-0">
              {active === "general" && (
                <Card
                  title="General"
                  description="Basic information about your workspace."
                  icon={Settings2}
                  footer={<SaveButton />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
                    <Field label="Workspace name">
                      <InputShell>
                        <input
                          className={textInputCls}
                          style={textInputStyle}
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                        />
                      </InputShell>
                    </Field>

                    <Field label="Timezone" hint="Used for scheduling and reporting.">
                      <InputShell>
                        <select
                          className={textInputCls}
                          style={textInputStyle}
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
                            className={textInputCls}
                            style={monoInputStyle}
                            value={replyTo}
                            onChange={(e) => setReplyTo(e.target.value)}
                          />
                        </InputShell>
                      </Field>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── NEW: Appearance ───────────────────── */}
              {active === "appearance" && (
                <Card
                  title="Appearance"
                  description="Personalize the look of your workspace."
                  icon={Palette}
                >
                  {/* Mode */}
                  <div className="mb-5">
                    <p className="text-[11.5px] font-medium mb-2" style={{ color: T.textMuted }}>
                      Interface mode
                    </p>
                    <div
                      className="grid grid-cols-3 gap-1.5 p-0.5 rounded-md"
                      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                    >
                      {([
                        { id: "light" as const,  label: "Light",  icon: Sun },
                        { id: "dark" as const,   label: "Dark",   icon: Moon },
                        { id: "system" as const, label: "System", icon: Monitor },
                      ]).map(({ id, label, icon: Icon }) => {
                        const isActive = mode === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setMode(id)}
                            className="flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11.5px] font-medium transition-colors"
                            style={{
                              background: isActive ? T.surfaceHi : "transparent",
                              color: isActive ? T.text : T.textMuted,
                            }}
                          >
                            <Icon size={12} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color theme */}
                  <div>
                    <p className="text-[11.5px] font-medium mb-2" style={{ color: T.textMuted }}>
                      Accent color
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {THEME_PRESETS.map((preset) => {
                        const isActive = theme === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setTheme(preset.id)}
                            className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors"
                            style={{
                              background: isActive ? T.surface2 : "transparent",
                              boxShadow: isActive
                                ? `inset 0 0 0 1.5px ${preset.brand}`
                                : `inset 0 0 0 1px ${T.borderSoft}`,
                            }}
                          >
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{
                                background: preset.brand,
                                boxShadow: isActive ? `0 0 0 3px ${preset.brand}30` : "none",
                              }}
                            >
                              {isActive && <Check size={14} style={{ color: "#fff" }} strokeWidth={3} />}
                            </span>
                            <span
                              className="text-[11.5px] font-medium"
                              style={{ color: isActive ? T.text : T.textMuted }}
                            >
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[11px]" style={{ color: T.textFaint }}>
                      Changes apply instantly and are saved to this device.
                    </p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 mb-2">
                    <Field label="Send rate limit" hint="Emails per minute, per sender account.">
                      <InputShell>
                        <input
                          className={textInputCls}
                          style={monoInputStyle}
                          value={rateLimit}
                          onChange={(e) => setRateLimit(e.target.value)}
                        />
                      </InputShell>
                    </Field>
                    <Field label="Retry attempts" hint="On soft bounce or temporary SMTP failure.">
                      <InputShell>
                        <input
                          className={textInputCls}
                          style={monoInputStyle}
                          value={retries}
                          onChange={(e) => setRetries(e.target.value)}
                        />
                      </InputShell>
                    </Field>
                  </div>

                  <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
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
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                    >
                      <ShieldCheck size={10} /> Encrypted
                    </span>
                  }
                >
                  <Field label="API key" hint="Keep this secret — it grants full send access to your account.">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <InputShell>
                        <KeyRound size={13} style={{ color: T.textFaint }} className="shrink-0" />
                        <input
                          readOnly
                          value={maskedKey}
                          className={textInputCls}
                          style={monoInputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => setRevealKey((r) => !r)}
                          aria-label={revealKey ? "Hide API key" : "Reveal API key"}
                          className="shrink-0 transition-colors hover:text-white"
                          style={{ color: T.textFaint }}
                        >
                          {revealKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </InputShell>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={copyKey}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[11.5px] font-medium transition-colors"
                          style={{
                            background: copied ? T.successSoft : T.surface2,
                            color: copied ? T.success : T.textMuted,
                            boxShadow: `inset 0 0 0 1px ${copied ? T.successBorder : T.borderSoft}`,
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        <button
                          aria-label="Regenerate API key"
                          className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-white/5"
                          style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                  </Field>

                  <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <Field label="Webhook URL" hint="We'll POST delivery, open and click events here.">
                      <InputShell icon={Webhook}>
                        <input
                          className={textInputCls}
                          style={monoInputStyle}
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
      </main>
    </div>
  );
};

/* ─────────────── save button ─────────────── */

const SaveButton = () => (
  <button
    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-all hover:brightness-110"
    style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
  >
    <Save size={12} />
    Save changes
  </button>
);

export default Settings;