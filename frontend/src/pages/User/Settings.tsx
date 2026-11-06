import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Settings2, Send as SendIcon, Bell, KeyRound, AlertTriangle,
  Copy, Check, RefreshCw, Menu, Eye, EyeOff, ChevronRight,
  ShieldCheck, Save, Webhook, Palette, Sun, Moon, Monitor, X,
} from "lucide-react";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:         "#0B0C0E",
  surface:    "#111214",
  surface2:   "#16181B",
  surfaceHi:  "#1C1F23",
  border:     "#24282E",
  borderSoft: "#1B1E22",
  text:       "#E8EAED",
  textMuted:  "#9AA0A6",
  textFaint:  "#6B7075",
  accent:     "#6EE7A8",
  accentInk:  "#0B0C0E",
  accentLine: "#2E6B4D",
  ok:         "#6EE7A8",
  warn:       "#E0A64A",
  danger:     "#E06A6A",
  info:       "#6EC1E7",
  purple:     "#B39DE0",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* ─────────────── theme system ─────────────── */

type ThemeId = "mint" | "emerald" | "rose" | "amber" | "sky";
type Mode = "dark" | "light" | "system";

interface ThemePreset {
  id: ThemeId;
  label: string;
  brand: string;
  brandSoft: string;
  brandBorder: string;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: "mint",    label: "Mint",    brand: "#6EE7A8", brandSoft: "rgba(110,231,168,0.12)", brandBorder: "rgba(110,231,168,0.35)" },
  { id: "emerald", label: "Emerald", brand: "#22C55E", brandSoft: "rgba(34,197,94,0.12)",   brandBorder: "rgba(34,197,94,0.35)" },
  { id: "rose",    label: "Rose",    brand: "#F43F5E", brandSoft: "rgba(244,63,94,0.12)",   brandBorder: "rgba(244,63,94,0.35)" },
  { id: "amber",   label: "Amber",   brand: "#E0A64A", brandSoft: "rgba(224,166,74,0.12)",  brandBorder: "rgba(224,166,74,0.35)" },
  { id: "sky",     label: "Sky",     brand: "#6EC1E7", brandSoft: "rgba(110,193,231,0.12)", brandBorder: "rgba(110,193,231,0.35)" },
];

const THEME_STORAGE_KEY = "mf.theme";
const MODE_STORAGE_KEY  = "mf.mode";

const applyTheme = (themeId: ThemeId, mode: Mode) => {
  const preset = THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[0];
  const root = document.documentElement;
  root.style.setProperty("--mf-brand", preset.brand);
  root.style.setProperty("--mf-brand-soft", preset.brandSoft);
  root.style.setProperty("--mf-brand-border", preset.brandBorder);
  const resolvedMode =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : mode;
  root.dataset.mode = resolvedMode;
  root.dataset.theme = themeId;
};

const loadTheme = (): { theme: ThemeId; mode: Mode } => {
  try {
    const theme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || "mint";
    const mode  = (localStorage.getItem(MODE_STORAGE_KEY)  as Mode)    || "dark";
    return { theme, mode };
  } catch {
    return { theme: "mint", mode: "dark" };
  }
};

/* ─────────────── sections ─────────────── */

type SectionKey = "general" | "appearance" | "email" | "notifications" | "api" | "danger";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType; blurb: string }[] = [
  { key: "general",       label: "General",        icon: Settings2,    blurb: "Workspace identity and defaults." },
  { key: "appearance",    label: "Appearance",     icon: Palette,      blurb: "Shape how MailForge looks." },
  { key: "email",         label: "Email sending",  icon: SendIcon,     blurb: "Sending rate, retries, and tracking." },
  { key: "notifications", label: "Notifications",  icon: Bell,         blurb: "Choose what reaches your inbox." },
  { key: "api",           label: "API & webhooks", icon: KeyRound,     blurb: "Keys and event callbacks." },
  { key: "danger",        label: "Danger zone",    icon: AlertTriangle,blurb: "Irreversible actions." },
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
    className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-[120ms]"
    style={{
      background: checked ? T.accent : T.surfaceHi,
      boxShadow: `inset 0 0 0 1px ${checked ? "rgba(110,231,168,0.28)" : T.border}`,
    }}
  >
    <span
      className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[120ms]"
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
    className="flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors duration-[120ms]"
    style={{ background: T.surface2, border: HAIRLINE_SOFT }}
    onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
    onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
  >
    {Icon && <Icon size={13} className="shrink-0" style={{ color: T.textFaint }} />}
    {children}
  </div>
);

const textInputCls = "w-full bg-transparent text-[12.5px] outline-none";
const textInputStyle: React.CSSProperties = { color: T.text, fontFamily: FONT.ui };
const monoInputStyle: React.CSSProperties = { color: T.text, fontFamily: FONT.mono, fontSize: 12.5 };

/* ─────────────── section hero ─────────────── */

const SectionHero: React.FC<{
  icon: React.ElementType;
  title: string;
  blurb: string;
  danger?: boolean;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, blurb, danger, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div className="flex items-start gap-3.5 min-w-0">
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: danger ? "rgba(224,106,106,0.10)" : "rgba(110,231,168,0.10)",
          color: danger ? T.danger : T.accent,
          border: `1px solid ${danger ? "rgba(224,106,106,0.28)" : "rgba(110,231,168,0.28)"}`,
        }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-medium tracking-tight leading-tight"
          style={{ color: danger ? T.danger : T.text }}
        >
          {title}
        </h2>
        <p className="text-[12.5px] mt-1" style={{ color: T.textMuted }}>{blurb}</p>
      </div>
    </div>
    {right}
  </div>
);

/* ─────────────── panel (grouped rows) ─────────────── */

const Panel: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
  <div
    className="rounded-xl overflow-hidden"
    style={{
      background: T.surface,
      border: danger ? "1px solid rgba(224,106,106,0.28)" : HAIRLINE,
    }}
  >
    {children}
  </div>
);

const PanelDivider = () => (
  <div style={{ height: 1, background: T.borderSoft }} />
);

const RowShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 md:px-5 py-4">{children}</div>
);

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}> = ({ title, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-[12.5px] font-medium" style={{ color: T.text }}>{title}</p>
      <p className="mt-0.5 text-[11px]" style={{ color: T.textMuted }}>{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  </div>
);

/* ─────────────── floating section dock ─────────────── */

const SectionDock: React.FC<{
  active: SectionKey;
  onChange: (k: SectionKey) => void;
}> = ({ active, onChange }) => (
  <nav
    className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-6 rounded-xl p-1.5"
    style={{ background: T.surface, border: HAIRLINE }}
  >
    {SECTIONS.map((s) => {
      const Icon = s.icon;
      const isActive = active === s.key;
      const isDanger = s.key === "danger";
      const activeColor = isDanger ? T.danger : T.accent;
      return (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className="group shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-[120ms] text-left whitespace-nowrap"
          style={{
            background: isActive ? T.surface2 : "transparent",
            color: isActive ? activeColor : T.textMuted,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ background: isActive ? activeColor : T.border }}
          />
          <Icon size={13} className="shrink-0" />
          <span>{s.label}</span>
        </button>
      );
    })}
  </nav>
);

/* ─────────────── sliding mode switch ─────────────── */

const ModeSwitch: React.FC<{ mode: Mode; onChange: (m: Mode) => void }> = ({ mode, onChange }) => {
  const opts = [
    { id: "light" as const,  label: "Light",  icon: Sun },
    { id: "dark" as const,   label: "Dark",   icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];
  const idx = opts.findIndex((o) => o.id === mode);

  return (
    <div
      className="relative grid grid-cols-3 gap-1 p-1 rounded-lg"
      style={{ background: T.surface2, border: HAIRLINE_SOFT }}
    >
      <div
        className="absolute top-1 bottom-1 rounded-md transition-all duration-200 ease-out pointer-events-none"
        style={{
          width: `calc((100% - 0.5rem) / 3)`,
          left: `calc(0.25rem + ${idx} * ((100% - 0.5rem) / 3))`,
          background: T.surfaceHi,
          border: HAIRLINE_SOFT,
        }}
      />
      {opts.map(({ id, label, icon: Icon }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors duration-[120ms]"
            style={{ color: isActive ? T.text : T.textMuted }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
};

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

  // Email
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

  // "dirty" flag — shows floating save bar
  const [dirty, setDirty] = useState(false);

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

  const activeSection = SECTIONS.find((s) => s.key === active)!;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .st-main::-webkit-scrollbar { width: 8px; }
        .st-main::-webkit-scrollbar-track { background: transparent; }
        .st-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .st-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .float-in { animation: floatIn 180ms ease-out; }
        @media (prefers-reduced-motion: reduce) { .st-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
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

      <main className="st-main flex-1 overflow-y-auto relative" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1180 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-md transition-colors duration-[120ms]"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Account</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.accent }}>Settings</span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Settings
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Configure your workspace, sending defaults, and integrations.
                </p>
              </div>
            </div>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium self-start md:self-auto"
              style={{ background: "rgba(110,231,168,0.10)", color: T.accent, border: "1px solid rgba(110,231,168,0.28)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
              Saved
            </span>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            <SectionDock active={active} onChange={setActive} />

            <div key={active} className="float-in min-w-0">
              <SectionHero
                icon={activeSection.icon}
                title={activeSection.label}
                blurb={activeSection.blurb}
                danger={active === "danger"}
              />

              {/* GENERAL */}
              {active === "general" && (
                <Panel>
                  <RowShell>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Workspace name">
                        <InputShell>
                          <input
                            className={textInputCls}
                            style={textInputStyle}
                            value={workspaceName}
                            onChange={(e) => { setWorkspaceName(e.target.value); setDirty(true); }}
                          />
                        </InputShell>
                      </Field>
                      <Field label="Timezone" hint="Used for scheduling and reporting.">
                        <InputShell>
                          <select
                            className={textInputCls}
                            style={textInputStyle}
                            value={timezone}
                            onChange={(e) => { setTimezone(e.target.value); setDirty(true); }}
                          >
                            <option>Asia/Karachi (GMT+5)</option>
                            <option>Asia/Dubai (GMT+4)</option>
                            <option>Europe/London (GMT+0)</option>
                            <option>America/New_York (GMT-4)</option>
                          </select>
                        </InputShell>
                      </Field>
                    </div>
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <Field label="Default reply-to address" hint="Used when a template doesn't set its own.">
                      <InputShell>
                        <input
                          className={textInputCls}
                          style={monoInputStyle}
                          value={replyTo}
                          onChange={(e) => { setReplyTo(e.target.value); setDirty(true); }}
                        />
                      </InputShell>
                    </Field>
                  </RowShell>
                </Panel>
              )}

              {/* APPEARANCE */}
              {active === "appearance" && (
                <Panel>
                  <RowShell>
                    <p className="text-[11.5px] font-medium mb-2" style={{ color: T.textMuted }}>
                      Interface mode
                    </p>
                    <ModeSwitch mode={mode} onChange={setMode} />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <p className="text-[11.5px] font-medium mb-3" style={{ color: T.textMuted }}>
                      Accent color
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {THEME_PRESETS.map((preset) => {
                        const isActive = theme === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setTheme(preset.id)}
                            className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 transition-colors duration-[120ms]"
                            style={{
                              background: isActive ? T.surface2 : "transparent",
                              border: isActive ? `1.5px solid ${preset.brand}` : HAIRLINE_SOFT,
                            }}
                          >
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: preset.brand }}
                            >
                              {isActive && <Check size={11} style={{ color: T.accentInk }} strokeWidth={3} />}
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
                  </RowShell>
                </Panel>
              )}

              {/* EMAIL */}
              {active === "email" && (
                <Panel>
                  <RowShell>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Send rate limit" hint="Emails per minute, per sender account.">
                        <InputShell>
                          <input
                            className={textInputCls}
                            style={monoInputStyle}
                            value={rateLimit}
                            onChange={(e) => { setRateLimit(e.target.value); setDirty(true); }}
                          />
                        </InputShell>
                      </Field>
                      <Field label="Retry attempts" hint="On soft bounce or temporary SMTP failure.">
                        <InputShell>
                          <input
                            className={textInputCls}
                            style={monoInputStyle}
                            value={retries}
                            onChange={(e) => { setRetries(e.target.value); setDirty(true); }}
                          />
                        </InputShell>
                      </Field>
                    </div>
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Track opens"
                      description="Embed a tracking pixel in outgoing emails."
                      checked={trackOpens}
                      onChange={() => { setTrackOpens((v) => !v); setDirty(true); }}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Track clicks"
                      description="Rewrite links to measure click-through rate."
                      checked={trackClicks}
                      onChange={() => { setTrackClicks((v) => !v); setDirty(true); }}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Pause on high bounce rate"
                      description="Automatically pause a campaign above 5% bounces."
                      checked={pauseOnBounce}
                      onChange={() => { setPauseOnBounce((v) => !v); setDirty(true); }}
                    />
                  </RowShell>
                </Panel>
              )}

              {/* NOTIFICATIONS */}
              {active === "notifications" && (
                <Panel>
                  <RowShell>
                    <ToggleRow
                      title="Campaign completed"
                      description="When a campaign finishes sending."
                      checked={notifCampaignDone}
                      onChange={() => setNotifCampaignDone((v) => !v)}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Campaign failed"
                      description="When a campaign stops due to errors or bounces."
                      checked={notifCampaignFailed}
                      onChange={() => setNotifCampaignFailed((v) => !v)}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Sender account issues"
                      description="When a sender account disconnects or gets rate-limited."
                      checked={notifSenderIssue}
                      onChange={() => setNotifSenderIssue((v) => !v)}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Weekly performance summary"
                      description="A digest of sends, opens and clicks every Monday."
                      checked={notifWeeklySummary}
                      onChange={() => setNotifWeeklySummary((v) => !v)}
                    />
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <ToggleRow
                      title="Email me a copy"
                      description="Also deliver these notifications to your inbox."
                      checked={notifEmailDigest}
                      onChange={() => setNotifEmailDigest((v) => !v)}
                    />
                  </RowShell>
                </Panel>
              )}

              {/* API */}
              {active === "api" && (
                <Panel>
                  <RowShell>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <label className="text-[11.5px] font-medium" style={{ color: T.textMuted }}>
                        API key
                      </label>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(110,231,168,0.10)", color: T.accent, border: "1px solid rgba(110,231,168,0.28)" }}
                      >
                        <ShieldCheck size={9} /> Encrypted
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <InputShell>
                        <KeyRound size={13} style={{ color: T.textFaint }} className="shrink-0" />
                        <input readOnly value={maskedKey} className={textInputCls} style={monoInputStyle} />
                        <button
                          type="button"
                          onClick={() => setRevealKey((r) => !r)}
                          aria-label={revealKey ? "Hide API key" : "Reveal API key"}
                          className="shrink-0 transition-colors duration-[120ms]"
                          style={{ color: T.textFaint }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = T.text }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = T.textFaint }}
                        >
                          {revealKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </InputShell>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={copyKey}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[11.5px] font-medium transition-colors duration-[120ms]"
                          style={{
                            background: copied ? "rgba(110,231,168,0.10)" : T.surface2,
                            color: copied ? T.accent : T.textMuted,
                            border: copied ? "1px solid rgba(110,231,168,0.28)" : HAIRLINE_SOFT,
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        <button
                          aria-label="Regenerate API key"
                          className="inline-flex items-center justify-center rounded-md p-2 transition-colors duration-[120ms]"
                          style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px]" style={{ color: T.textFaint }}>
                      Keep this secret — it grants full send access to your account.
                    </p>
                  </RowShell>
                  <PanelDivider />
                  <RowShell>
                    <Field label="Webhook URL" hint="We'll POST delivery, open and click events here.">
                      <InputShell icon={Webhook}>
                        <input
                          className={textInputCls}
                          style={monoInputStyle}
                          placeholder="https://yourapp.com/webhooks/mailforge"
                        />
                      </InputShell>
                    </Field>
                  </RowShell>
                </Panel>
              )}

              {/* DANGER */}
              {active === "danger" && (
                <Panel danger>
                  <RowShell>
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                        style={{ background: "rgba(224,106,106,0.10)", color: T.danger }}
                      >
                        <AlertTriangle size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: T.danger }}>
                          These actions are irreversible
                        </p>
                        <p className="mt-1 text-[11.5px]" style={{ color: "rgba(224,106,106,0.75)" }}>
                          Please make sure you understand what each action does before proceeding.
                        </p>
                      </div>
                    </div>
                  </RowShell>
                  <PanelDivider />
                  <div className="divide-y" style={{ borderColor: T.borderSoft }}>
                    {[
                      { title: "Pause all campaigns", desc: "Immediately stop every currently running campaign.", action: "Pause all" },
                      { title: "Reset sending statistics", desc: "Clear all historical delivery, open and click data.", action: "Reset stats" },
                      { title: "Delete workspace", desc: "Permanently delete this workspace and everything in it.", action: "Delete workspace" },
                    ].map((row) => (
                      <div key={row.title} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-medium" style={{ color: T.text }}>{row.title}</p>
                          <p className="mt-0.5 text-[11px]" style={{ color: T.textMuted }}>{row.desc}</p>
                        </div>
                        <button
                          className="shrink-0 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all hover:brightness-110"
                          style={{ background: "rgba(224,106,106,0.10)", color: T.danger, border: "1px solid rgba(224,106,106,0.28)" }}
                        >
                          {row.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </div>

        {/* Floating save bar */}
        {dirty && (
          <div className="sticky bottom-4 z-30 mx-auto px-4 md:px-6 lg:px-10" style={{ maxWidth: 1180 }}>
            <div
              className="float-in flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              style={{ background: T.surface, border: HAIRLINE, boxShadow: "0 12px 32px -16px rgba(0,0,0,0.9)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: T.warn }}
                />
                <p className="text-[12px] truncate" style={{ color: T.textMuted }}>
                  You have unsaved changes.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDirty(false)}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors duration-[120ms]"
                  style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
                >
                  <X size={12} /> Discard
                </button>
                <button
                  onClick={() => setDirty(false)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-all hover:brightness-110"
                  style={{ background: T.accent, color: T.accentInk }}
                >
                  <Save size={12} /> Save changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;