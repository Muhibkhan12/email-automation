// AdminSettings.tsx
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Settings, Save, Mail, Shield, Bell, Key, DollarSign,
  AlertTriangle, CheckCircle2, X, Plus, Trash2, Edit,
  RefreshCw, Eye, EyeOff, Copy, Check, Menu, Download,
  ChevronRight, Sparkles, SlidersHorizontal, Globe, Users,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: "TLS" | "SSL" | "None";
  status: "Active" | "Inactive" | "Error";
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  status: "Active" | "Inactive";
}

/* ─────────────────────────── Tokens ─────────────────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  rowHover: "#11151E",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const InputShell: React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div
    className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all"
    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
    onFocusCapture={(e) =>
      (e.currentTarget.style.boxShadow =
        "inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)")
    }
    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${C.border}`)}
  >
    {Icon && <Icon size={14} className="text-[#6A7080] shrink-0" />}
    {children}
  </div>
);

const textInputCls =
  "w-full bg-transparent text-[13px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none";
const monoInputCls = `${textInputCls} font-mono`;

const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode }> = ({
  label, hint, htmlFor, children,
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[11.5px] font-medium text-[#C7C9CE] mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px] text-[#7A8092]">{hint}</p>}
  </div>
);

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
      background: checked ? C.primary : C.borderHover,
      boxShadow: checked ? "0 0 0 3px rgba(255,106,57,0.15)" : `inset 0 0 0 1px ${C.border}`,
    }}
  >
    <span
      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    />
  </button>
);

const Pill: React.FC<{
  fg: string;
  bg: string;
  ring: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number }>;
}> = ({ fg, bg, ring, children, icon: Icon }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
    style={{ background: bg, color: fg, boxShadow: `inset 0 0 0 1px ${ring}` }}
  >
    {Icon && <Icon size={11} />}
    {children}
  </span>
);

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}> = ({ title, description, checked, onChange }) => (
  <div
    className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0"
    style={{ borderBottom: `1px solid ${C.border}` }}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-medium" style={{ color: C.dark }}>{title}</p>
      <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} label={title} />
  </div>
);

/* ─────────────────────────── Page ─────────────────────────── */

type SectionKey = "general" | "smtp" | "security" | "notifications" | "api" | "billing";

const AdminSettings = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General
  const [workspaceName, setWorkspaceName] = useState("MailForge Platform");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [language, setLanguage] = useState("English");

  // Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [passwordPolicy, setPasswordPolicy] = useState("strict");
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  // Notifications
  const [notifCampaigns, setNotifCampaigns] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifBilling, setNotifBilling] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // SMTP
  const [smtpConfigs, setSmtpConfigs] = useState<SMTPConfig[]>([
    { id: "smtp1", name: "Primary SMTP", host: "smtp.mailforge.io", port: 587, username: "smtp@mailforge.io", encryption: "TLS", status: "Active" },
    { id: "smtp2", name: "Backup SMTP",  host: "smtp2.mailforge.io", port: 465, username: "backup@mailforge.io", encryption: "SSL", status: "Inactive" },
    { id: "smtp3", name: "Custom SMTP",  host: "smtp.company.com",  port: 587, username: "custom@company.com",  encryption: "TLS", status: "Error" },
  ]);

  // Webhooks
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: "webhook1", name: "Campaign Events", url: "https://api.company.com/webhooks/campaign", status: "Active" },
    { id: "webhook2", name: "System Events",   url: "https://api.company.com/webhooks/system",   status: "Inactive" },
  ]);

  const sections: { id: SectionKey; label: string; hint: string; icon: React.ElementType }[] = [
    { id: "general",       label: "General",           hint: "Platform basics",   icon: Settings },
    { id: "smtp",          label: "SMTP configuration", hint: "Mail servers",      icon: Mail },
    { id: "security",      label: "Security",          hint: "Access & policies", icon: Shield },
    { id: "notifications", label: "Notifications",     hint: "What you get told", icon: Bell },
    { id: "api",           label: "API & webhooks",    hint: "Integrations",      icon: Key },
    { id: "billing",       label: "Billing",           hint: "Plan & invoices",   icon: DollarSign },
  ];

  /* ── Handlers (unchanged behavior) ─────────── */
  const handleCopyApiKey = () => {
    navigator.clipboard?.writeText("mf_live_9f2a1c7e4b8d3f6091a2c4e");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addIpToWhitelist = () => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (newIp && !ipWhitelist.includes(newIp) && ipRegex.test(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
    } else if (newIp && !ipWhitelist.includes(newIp)) {
      alert("Please enter a valid IP address");
    }
  };

  const removeIpFromWhitelist = (ip: string) =>
    setIpWhitelist(ipWhitelist.filter((i) => i !== ip));

  const handleEditSMTP = (id: string) => {
    console.log("Edit SMTP:", id);
    alert(`Edit SMTP configuration: ${id}`);
  };
  const handleDeleteSMTP = (id: string) => {
    if (window.confirm("Are you sure you want to delete this SMTP configuration?")) {
      setSmtpConfigs(smtpConfigs.filter((config) => config.id !== id));
    }
  };
  const handleAddSMTP = () => alert("Add new SMTP configuration");

  const handleEditWebhook = (id: string) => {
    console.log("Edit webhook:", id);
    alert(`Edit webhook: ${id}`);
  };
  const handleDeleteWebhook = (id: string) => {
    if (window.confirm("Are you sure you want to delete this webhook?")) {
      setWebhooks(webhooks.filter((webhook) => webhook.id !== id));
    }
  };
  const handleAddWebhook = () => alert("Add new webhook");

  const handleSaveChanges = () => alert("Settings saved successfully!");

  /* ── Section renderers ─────────────────────── */

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Platform name" htmlFor="workspaceName">
              <InputShell icon={Globe}>
                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={textInputCls}
                />
              </InputShell>
            </Field>

            <Field label="Timezone" htmlFor="timezone">
              <InputShell>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={textInputCls}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (GMT-4)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                </select>
              </InputShell>
            </Field>

            <Field label="Date format" htmlFor="dateFormat">
              <InputShell>
                <select
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className={textInputCls}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </InputShell>
            </Field>

            <Field label="Language" htmlFor="language">
              <InputShell>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={textInputCls}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </InputShell>
            </Field>
          </div>
        );

      case "smtp":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 style={{ fontFamily: FONT.display }} className="text-[15px] font-semibold tracking-tight text-[#F2F0EB]">
                  SMTP configurations
                </h3>
                <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                  Manage the mail servers this platform sends through.
                </p>
              </div>
              <button
                onClick={handleAddSMTP}
                className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
              >
                <Plus size={13} /> Add SMTP
              </button>
            </div>

            <div className="space-y-2.5">
              {smtpConfigs.map((config) => {
                const statusMeta =
                  config.status === "Active"
                    ? { fg: C.success, bg: C.successSoft, ring: C.successRing }
                    : config.status === "Error"
                    ? { fg: C.danger, bg: C.dangerSoft, ring: C.dangerRing }
                    : { fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing };
                return (
                  <div
                    key={config.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13.5px] font-semibold" style={{ color: C.dark }}>{config.name}</p>
                        <Pill fg={statusMeta.fg} bg={statusMeta.bg} ring={statusMeta.ring}>{config.status}</Pill>
                      </div>
                      <p className="mt-1 text-[11.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                        {config.host}:{config.port} · {config.encryption} · {config.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditSMTP(config.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
                        style={{ background: C.surface, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSMTP(config.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors"
                        style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            {/* 2FA */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
              style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium" style={{ color: C.dark }}>Two-factor authentication</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Require 2FA for all admin accounts.</p>
              </div>
              <Toggle
                checked={twoFactorAuth}
                onChange={() => setTwoFactorAuth(!twoFactorAuth)}
                label="Toggle two-factor authentication"
              />
            </div>

            <Field label="Session timeout" hint="Auto-logout after inactivity." htmlFor="sessionTimeout">
              <InputShell>
                <select
                  id="sessionTimeout"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className={textInputCls}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </InputShell>
            </Field>

            <Field label="Password policy" htmlFor="passwordPolicy">
              <InputShell>
                <select
                  id="passwordPolicy"
                  value={passwordPolicy}
                  onChange={(e) => setPasswordPolicy(e.target.value)}
                  className={textInputCls}
                >
                  <option value="basic">Basic (min 8 characters)</option>
                  <option value="medium">Medium (8+ chars, 1 uppercase, 1 number)</option>
                  <option value="strict">Strict (12+ chars, upper, lower, number, symbol)</option>
                </select>
              </InputShell>
            </Field>

            <div>
              <label className="block text-[11.5px] font-medium text-[#C7C9CE] mb-1.5">IP whitelist</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <InputShell>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="Enter IP address"
                    className={monoInputCls}
                    onKeyDown={(e) => { if (e.key === "Enter") addIpToWhitelist(); }}
                  />
                </InputShell>
                <button
                  onClick={addIpToWhitelist}
                  className="shrink-0 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  Add
                </button>
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: C.textMuted }}>Restrict admin access to specific IPs.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ipWhitelist.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px]"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}`, fontFamily: FONT.mono }}
                  >
                    {ip}
                    <button
                      onClick={() => removeIpFromWhitelist(ip)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${ip} from whitelist`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {ipWhitelist.length === 0 && (
                  <span className="text-[11.5px]" style={{ color: C.textMuted }}>No IPs whitelisted yet.</span>
                )}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div>
            <ToggleRow
              title="Campaign notifications"
              description="Campaign completion and failure alerts."
              checked={notifCampaigns}
              onChange={() => setNotifCampaigns(!notifCampaigns)}
            />
            <ToggleRow
              title="System notifications"
              description="System health and maintenance alerts."
              checked={notifSystem}
              onChange={() => setNotifSystem(!notifSystem)}
            />
            <ToggleRow
              title="Security alerts"
              description="Security incidents and login alerts."
              checked={notifSecurity}
              onChange={() => setNotifSecurity(!notifSecurity)}
            />
            <ToggleRow
              title="Billing notifications"
              description="Invoices, payments, and subscription alerts."
              checked={notifBilling}
              onChange={() => setNotifBilling(!notifBilling)}
            />
            <ToggleRow
              title="Weekly digest"
              description="Weekly summary of platform activity."
              checked={notifWeeklyDigest}
              onChange={() => setNotifWeeklyDigest(!notifWeeklyDigest)}
            />
            <ToggleRow
              title="Email digest"
              description="Also deliver these notifications to your inbox."
              checked={emailDigest}
              onChange={() => setEmailDigest(!emailDigest)}
            />
          </div>
        );

      case "api":
        return (
          <div className="space-y-5">
            <Field label="API key" hint="Use this key to authenticate API requests. Keep it secret.">
              <div className="flex flex-col sm:flex-row gap-2">
                <InputShell icon={Key}>
                  <input
                    readOnly
                    value={showApiKey ? "mf_live_9f2a1c7e4b8d3f6091a2c4e" : "••••••••••••••••••••••••"}
                    className={monoInputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    className="shrink-0 text-[#5A6172] hover:text-[#C7C9CE] transition-colors"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </InputShell>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyApiKey}
                    className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-[12px] font-medium transition-colors"
                    style={{
                      background: copied ? C.successSoft : C.inner,
                      color: copied ? C.success : C.textBody,
                      boxShadow: `inset 0 0 0 1px ${copied ? C.successRing : C.border}`,
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    aria-label="Regenerate API key"
                    className="inline-flex items-center justify-center rounded-2xl p-2.5 transition-colors"
                    style={{ background: C.inner, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            </Field>

            <div className="pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                <div>
                  <h3 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold tracking-tight text-[#F2F0EB]">
                    Webhooks
                  </h3>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                    Endpoints we POST events to.
                  </p>
                </div>
                <button
                  onClick={handleAddWebhook}
                  className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  <Plus size={13} /> Add webhook
                </button>
              </div>

              <div className="space-y-2.5">
                {webhooks.map((webhook) => {
                  const meta = webhook.status === "Active"
                    ? { fg: C.success, bg: C.successSoft, ring: C.successRing }
                    : { fg: C.warning, bg: C.warningSoft, ring: C.warningRing };
                  return (
                    <div
                      key={webhook.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4"
                      style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-medium" style={{ color: C.dark }}>{webhook.name}</p>
                          <Pill fg={meta.fg} bg={meta.bg} ring={meta.ring}>{webhook.status}</Pill>
                        </div>
                        <p className="mt-1 text-[11.5px] truncate" style={{ color: C.textMuted, fontFamily: FONT.mono }}>
                          {webhook.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditWebhook(webhook.id)}
                          aria-label={`Edit ${webhook.name}`}
                          className="p-2 rounded-xl transition-colors"
                          style={{ background: C.surface, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          aria-label={`Delete ${webhook.name}`}
                          className="p-2 rounded-xl transition-colors"
                          style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <Field label="API rate limits" hint="Applies across all API keys.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputShell>
                    <input type="number" defaultValue="1000" className={monoInputCls} />
                  </InputShell>
                  <InputShell>
                    <input type="number" defaultValue="10000" className={monoInputCls} />
                  </InputShell>
                </div>
              </Field>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p className="text-[11px]" style={{ color: C.textMuted }}>Requests per minute</p>
                <p className="text-[11px]" style={{ color: C.textMuted }}>Requests per hour</p>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            {/* Plan */}
            <div
              className="rounded-2xl p-5"
              style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 style={{ fontFamily: FONT.display }} className="text-[16px] font-semibold tracking-tight text-[#F2F0EB]">
                      Enterprise Plan
                    </h3>
                    <Pill fg={C.success} bg={C.successSoft} ring={C.successRing}>Active</Pill>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.textMuted }}>
                    Unlimited workspaces · 10,000 emails/day · Priority support
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[24px] font-bold leading-none" style={{ fontFamily: FONT.mono, color: C.dark }}>
                    $499
                    <span className="text-[12px] font-normal ml-1" style={{ color: C.textMuted }}>/mo</span>
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>Next billing: Sep 15, 2026</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <button
                  className="rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  Upgrade plan
                </button>
                <button
                  className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                  style={{ background: C.surface, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  Manage subscription
                </button>
                <button
                  className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                  style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                >
                  Cancel subscription
                </button>
              </div>
            </div>

            {/* Payment method */}
            <div
              className="rounded-2xl p-4"
              style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                <div>
                  <h4 style={{ fontFamily: FONT.display }} className="text-[13.5px] font-semibold" ><span style={{ color: C.dark }}>Payment method</span></h4>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Manage the card on file.</p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-semibold text-white"
                  style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.6)" }}
                >
                  <Plus size={13} /> Add card
                </button>
              </div>

              <div
                className="flex items-center justify-between gap-3 rounded-2xl p-3"
                style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.border}` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[16px]"
                    style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    💳
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>Visa ending in 4242</p>
                    <p className="text-[11px] truncate" style={{ color: C.textMuted }}>Expires 12/2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill fg={C.success} bg={C.successSoft} ring={C.successRing}>Default</Pill>
                  <button className="p-2 rounded-xl transition-colors" style={{ color: C.textMuted }} aria-label="Edit card">
                    <Edit size={13} />
                  </button>
                  <button className="p-2 rounded-xl transition-colors" style={{ color: C.danger }} aria-label="Delete card">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Billing history */}
            <div
              className="rounded-2xl p-4"
              style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                <div>
                  <h4 style={{ fontFamily: FONT.display }} className="text-[13.5px] font-semibold"><span style={{ color: C.dark }}>Billing history</span></h4>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>Recent invoices and payments.</p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-colors"
                  style={{ background: C.surface, color: C.textBody, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <Download size={13} /> Export all
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: "INV-2026-001", date: "Aug 15, 2026" },
                  { id: "INV-2026-000", date: "Jul 15, 2026" },
                ].map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-2xl p-3"
                    style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: C.dark }}>Invoice #{inv.id}</p>
                      <p className="text-[11px] truncate" style={{ color: C.textMuted }}>{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] font-medium" style={{ fontFamily: FONT.mono, color: C.dark }}>$499.00</span>
                      <Pill fg={C.success} bg={C.successSoft} ring={C.successRing} icon={CheckCircle2}>Paid</Pill>
                      <button className="p-2 rounded-xl transition-colors" style={{ color: C.textMuted }} aria-label="Download invoice">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div
              className="rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ background: "rgba(248,113,113,0.05)", boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
                >
                  <AlertTriangle size={18} style={{ color: C.danger }} />
                </div>
                <div className="min-w-0">
                  <h4 style={{ fontFamily: FONT.display }} className="text-[14px] font-semibold" ><span style={{ color: C.danger }}>Delete platform</span></h4>
                  <p className="text-[12px] mt-0.5 max-w-xl" style={{ color: "#E8A5A5" }}>
                    Permanently delete the entire platform and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold transition-all self-start md:self-auto"
                style={{ background: C.dangerSoft, color: C.danger, boxShadow: `inset 0 0 0 1px ${C.dangerRing}` }}
              >
                <Trash2 size={13} /> Delete platform
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeMeta = sections.find((s) => s.id === activeSection)!;

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: C.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .as-main::-webkit-scrollbar { width: 10px; }
        .as-main::-webkit-scrollbar-track { background: transparent; }
        .as-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .as-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
        select option { background: #141821; color: #E8E6E1; }
        .as-rail::-webkit-scrollbar { height: 4px; }
        .as-rail::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 4px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="as-main flex-1 overflow-y-auto" style={{ background: C.bg, height: "100vh", width: "100%" }}>
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                    >
                      <Sparkles size={11} /> Admin
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · {sections.length} sections
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Settings
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: C.textMuted }}>
                    Configure platform settings and preferences.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 self-start md:self-auto"
                style={{ background: C.primary, boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
              >
                <Save size={14} /> Save changes
              </button>
            </header>

            {/* ── Layout ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 md:gap-6">

              {/* Section rail */}
              <nav className="as-rail flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {sections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className="group shrink-0 lg:shrink flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition-all lg:w-full"
                      style={{
                        background: isActive ? C.primarySoft : C.surface,
                        boxShadow: isActive
                          ? `inset 0 0 0 1px ${C.primaryRing}`
                          : `inset 0 0 0 1px ${C.border}`,
                      }}
                    >
                      <Icon size={14} className="shrink-0" style={{ color: isActive ? C.primary : C.textMuted }} />
                      <span
                        className="text-[12.5px] font-medium whitespace-nowrap"
                        style={{ color: isActive ? C.dark : C.textBody }}
                      >
                        {s.label}
                      </span>
                      <ChevronRight
                        size={13}
                        className="hidden lg:block ml-auto shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: isActive ? C.primary : C.border }}
                      />
                    </button>
                  );
                })}
              </nav>

              {/* Section content */}
              <Card className="p-5 md:p-6 lg:p-7 float-in">
                <div className="flex items-start gap-3.5 mb-5 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div
                    className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: C.primarySoft, boxShadow: `inset 0 0 0 1px ${C.primaryRing}` }}
                  >
                    <activeMeta.icon size={16} style={{ color: C.primary }} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                      className="text-[16px] md:text-[18px] font-bold text-[#F2F0EB] truncate"
                    >
                      {activeMeta.label}
                    </h2>
                    <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>{activeMeta.hint}</p>
                  </div>
                </div>
                {renderSection()}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;