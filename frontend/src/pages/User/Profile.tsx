import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Megaphone, Send as SendGlyph, Users, KeyRound, ShieldCheck,
  Monitor, Plus, Pencil, Menu, X,
  Mail, Trash2, Settings2, ChevronRight, User as UserIcon,
  Clock, MapPin, ShieldAlert, AlertTriangle,
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
  warn:        "#F59E0B",
  warnSoft:    "rgba(245,158,11,0.12)",
  warnBorder:  "rgba(245,158,11,0.35)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  dangerBorder:"rgba(239,68,68,0.35)",
  info:        "#38BDF8",
  infoSoft:    "rgba(56,189,248,0.12)",
  infoBorder:  "rgba(56,189,248,0.35)",
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

/* ─────────────── types & data ─────────────── */

interface SenderAccount {
  email: string;
  provider: string;
  status: "Active" | "Disconnected";
  sent: number;
}

const senderAccounts: SenderAccount[] = [
  { email: "marketing@company.com", provider: "Gmail SMTP",   status: "Active",       sent: 18420 },
  { email: "sales@company.com",     provider: "Outlook SMTP", status: "Active",       sent: 15830 },
  { email: "hello@company.com",     provider: "Custom SMTP",  status: "Disconnected", sent: 13920 },
];

const PROVIDER_STYLE: Record<string, { short: string; grad: string; ring: string }> = {
  "Gmail SMTP":   { short: "G", grad: "linear-gradient(135deg, #EA4335, #B32C20)", ring: "rgba(234,67,53,0.35)" },
  "Outlook SMTP": { short: "O", grad: "linear-gradient(135deg, #0A66C2, #053C74)", ring: "rgba(10,102,194,0.35)" },
  "Custom SMTP":  { short: "S", grad: "linear-gradient(135deg, #4B5563, #1F2937)", ring: "rgba(107,114,128,0.35)" },
};

/* ─────────────── page ─────────────── */

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .prof-main::-webkit-scrollbar { width: 8px; }
        .prof-main::-webkit-scrollbar-track { background: transparent; }
        .prof-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .prof-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="prof-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1160 }}>

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
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: T.successSoft, color: T.success, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
                    Active account
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · verified
                  </span>
                </div>

                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Profile
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage your account, security, and connected senders.
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium self-start md:self-auto transition-all"
              style={
                editing
                  ? { background: T.surface, color: T.text, boxShadow: `inset 0 0 0 1px ${T.border}` }
                  : { background: T.brand, color: "#fff", boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }
              }
            >
              {editing ? <X size={13} /> : <Pencil size={13} />}
              {editing ? "Cancel editing" : "Edit profile"}
            </button>
          </header>

          {/* Hero card */}
          <section className="mb-5 md:mb-6 rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
            <div
              className="h-20 md:h-24"
              style={{
                background:
                  "radial-gradient(500px 180px at 15% 0%, rgba(99,102,241,0.18), transparent 65%), " +
                  "radial-gradient(500px 180px at 95% 100%, rgba(34,197,94,0.10), transparent 65%)",
              }}
            />

            <div className="px-4 md:px-5 pb-4 md:pb-5">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-9 md:-mt-11">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5">
                  <div className="relative shrink-0">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-[22px] md:text-[26px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${T.brand}, #8B5CF6)`,
                        boxShadow: `0 16px 32px -16px rgba(99,102,241,0.7), inset 0 0 0 3px ${T.surface}`,
                      }}
                    >
                      MK
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px]"
                      style={{ background: T.success, borderColor: T.surface }}
                    />
                  </div>

                  <div className="text-center sm:text-left pb-1">
                    <h2 className="text-[19px] md:text-[22px] font-semibold leading-tight" style={{ color: T.text }}>
                      Muhib Khan
                    </h2>
                    <p className="text-[12px] mt-0.5" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                      muhib@example.com
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 pb-1">
                  <Chip icon={Clock} label="Member since Aug 2026" />
                  <Chip icon={MapPin} label="Asia/Karachi" />
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
            <StatCard icon={Megaphone} label="Campaigns"       value="24"     description="+4 this month"        accent={T.brand}   accentSoft={T.brandSoft} />
            <StatCard icon={SendGlyph} label="Emails sent"     value="48,250" description="+12.5% this month"    accent={T.info}    accentSoft={T.infoSoft} />
            <StatCard icon={Users}     label="Sender accounts" value="5"      description="2 currently active"   accent={T.success} accentSoft={T.successSoft} />
          </section>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 mb-5 md:mb-6">

            {/* Personal info */}
            <section className="xl:col-span-2 rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
              <CardHeader
                icon={UserIcon}
                title="Personal information"
                hint="Your basic account details."
                right={
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                  >
                    Account
                  </span>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 p-4 md:p-5">
                <InputField label="Full name"      value="Muhib Khan"              disabled={!editing} />
                <InputField label="Email address"  value="muhib@example.com"       disabled={!editing} />
                <InputField label="Username"       value="@muhib"                  disabled={!editing} />
                <InputField label="Timezone"       value="Asia/Karachi (GMT+5)"    disabled={!editing} />
              </div>

              {editing && (
                <div
                  className="flex justify-end gap-2 px-4 md:px-5 py-3"
                  style={{ borderTop: `1px solid ${T.borderSoft}` }}
                >
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-white/5"
                    style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-all hover:brightness-110"
                    style={{ background: T.brand }}
                  >
                    Save changes
                  </button>
                </div>
              )}
            </section>

            {/* Security */}
            <section className="rounded-xl overflow-hidden" style={{ background: T.surface, boxShadow: RING }}>
              <CardHeader
                icon={ShieldCheck}
                title="Security"
                hint="Protect your account."
              />

              <div>
                <SecurityItem
                  icon={KeyRound}
                  title="Password"
                  description="Last changed 30 days ago"
                  action="Change"
                  accent={T.brand}
                />
                <SecurityItem
                  icon={ShieldAlert}
                  title="Two-factor authentication"
                  description="Not enabled"
                  action="Enable"
                  accent={T.warn}
                />
                <SecurityItem
                  icon={Monitor}
                  title="Active sessions"
                  description="1 active session"
                  action="View"
                  accent={T.info}
                  last
                />
              </div>
            </section>
          </div>

          {/* Sender accounts */}
          <section className="rounded-xl overflow-hidden mb-5 md:mb-6" style={{ background: T.surface, boxShadow: RING }}>
            <CardHeader
              icon={Mail}
              title="Sender accounts"
              hint="Connected accounts used to send campaigns."
              right={
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:brightness-110"
                  style={{ background: T.brand }}
                >
                  <Plus size={12} /> Add sender
                </button>
              }
            />

            <ul>
              {senderAccounts.map((a, i) => {
                const p = PROVIDER_STYLE[a.provider] ?? PROVIDER_STYLE["Custom SMTP"];
                const active = a.status === "Active";
                return (
                  <li
                    key={a.email}
                    className="flex items-center gap-3 px-4 md:px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}` }}
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-bold text-white"
                      style={{ background: p.grad, boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${p.ring}` }}
                    >
                      {p.short}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>
                          {a.email}
                        </p>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: active ? T.successSoft : T.dangerSoft,
                            color: active ? T.success : T.danger,
                            boxShadow: `inset 0 0 0 1px ${active ? T.successBorder : T.dangerBorder}`,
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: active ? T.success : T.danger }}
                          />
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {a.provider} <span style={{ color: T.border }}>·</span> {a.sent.toLocaleString()} emails sent
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-white/5"
                        style={{ color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                      >
                        <Settings2 size={12} /> Manage
                      </button>
                      <button
                        aria-label="Remove"
                        className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11.5px] transition-colors hover:bg-white/5"
                        style={{ color: T.danger, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Danger zone */}
          <section
            className="rounded-xl overflow-hidden"
            style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.18)", color: T.danger }}
                >
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h2 className="text-[13.5px] font-semibold" style={{ color: T.danger }}>
                    Delete account
                  </h2>
                  <p className="mt-1 text-[11.5px] max-w-lg" style={{ color: "rgba(239,68,68,0.8)" }}>
                    Permanently delete your account and all associated campaigns, templates, and email data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                className="shrink-0 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:brightness-110 self-start md:self-auto"
                style={{ background: T.danger, color: "#fff" }}
              >
                <Trash2 size={12} />
                Delete account
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ─────────────── subcomponents ─────────────── */

const CardHeader: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, hint, right }) => (
  <div
    className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3"
    style={{ borderBottom: `1px solid ${T.borderSoft}` }}
  >
    <div className="flex items-start gap-2.5">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: T.brandSoft, color: T.brand }}
      >
        <Icon size={13} />
      </div>
      <div>
        <h2 className="text-[13px] font-semibold tracking-tight" style={{ color: T.text }}>
          {title}
        </h2>
        {hint && <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{hint}</p>}
      </div>
    </div>
    {right}
  </div>
);

const Chip: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = ({ icon: Icon, label }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
    style={{ background: T.surface2, color: T.textMuted, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
  >
    <Icon size={10} style={{ color: T.textFaint }} />
    {label}
  </span>
);

/* ─────────────── Stat Card ─────────────── */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  accent: string;
  accentSoft: string;
}

const StatCard = ({ icon: Icon, label, value, description, accent, accentSoft }: StatCardProps) => (
  <div className="rounded-xl p-3.5 md:p-4" style={{ background: T.surface, boxShadow: RING }}>
    <div className="flex items-start justify-between mb-2.5">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: accentSoft, color: accent }}
      >
        <Icon size={14} />
      </div>
      {description.startsWith("+") && (
        <span className="text-[10px] font-medium" style={{ color: T.success, fontFamily: FONT.mono }}>
          {description}
        </span>
      )}
    </div>
    <p className="text-[22px] font-semibold leading-none tracking-tight" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[11.5px] mt-1.5" style={{ color: T.textMuted }}>{label}</p>
    {!description.startsWith("+") && (
      <p className="text-[10.5px] mt-0.5" style={{ color: T.textFaint }}>{description}</p>
    )}
  </div>
);

/* ─────────────── Input Field ─────────────── */

interface InputFieldProps {
  label: string;
  value: string;
  disabled: boolean;
}

const InputField = ({ label, value, disabled }: InputFieldProps) => (
  <div>
    <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
      {label}
    </label>
    <input
      type="text"
      defaultValue={value}
      disabled={disabled}
      className="w-full rounded-md px-3 py-2 text-[12.5px] outline-none transition-shadow disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: T.surface2,
        color: T.text,
        boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
      }}
      onFocus={(e) => {
        if (!disabled) e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`;
      }}
      onBlur={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
    />
  </div>
);

/* ─────────────── Security Item ─────────────── */

interface SecurityItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  accent: string;
  last?: boolean;
}

const SecurityItem = ({ icon: Icon, title, description, action, accent, last }: SecurityItemProps) => (
  <div
    className="group flex items-center gap-2.5 px-4 md:px-5 py-3 transition-colors hover:bg-white/[0.02]"
    style={{ borderTop: last ? `1px solid ${T.borderSoft}` : undefined, borderBottom: last ? "none" : `1px solid ${T.borderSoft}` }}
  >
    <div
      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
      style={{ background: `${accent}14`, color: accent }}
    >
      <Icon size={12} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-medium truncate" style={{ color: T.text }}>{title}</p>
      <p className="text-[10.5px] mt-0.5 truncate" style={{ color: T.textMuted }}>{description}</p>
    </div>
    <button
      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors"
      style={{ color: accent }}
    >
      {action}
      <ChevronRight size={11} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
    </button>
  </div>
);

export default Profile;