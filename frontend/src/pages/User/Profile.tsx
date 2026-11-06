import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Megaphone, Send as SendGlyph, Users, KeyRound, ShieldCheck,
  Monitor, Plus, Pencil, Menu, X,
  Mail, Trash2, Settings2, ChevronRight, User as UserIcon,
  Clock, MapPin, ShieldAlert, AlertTriangle, Check,
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
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        .prof-main::-webkit-scrollbar { width: 8px; }
        .prof-main::-webkit-scrollbar-track { background: transparent; }
        .prof-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .prof-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        .prof-input::placeholder { color: ${T.textFaint}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 180ms ease-out; }
        @media (prefers-reduced-motion: reduce) { .prof-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
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
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.textMuted }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                    Active account
                  </span>
                  <span style={{ color: T.border }}>|</span>
                  <span className="text-[12px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    verified
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>
                  Profile
                </h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage your account, security, and connected senders.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {saved && (
                <span className="fade-up inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: "rgba(110,231,168,0.10)", color: T.accent, border: "1px solid rgba(110,231,168,0.28)" }}>
                  <Check size={11} /> Saved
                </span>
              )}
              <button
                onClick={() => setEditing(!editing)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all"
                style={
                  editing
                    ? { background: T.surface, color: T.text, border: HAIRLINE }
                    : { background: T.accent, color: T.accentInk }
                }
              >
                {editing ? <X size={13} /> : <Pencil size={13} />}
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          </header>

          {/* Hero — split identity layout */}
          <section className="mb-6 rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
                {/* Avatar + status ring */}
                <div className="relative shrink-0 self-center md:self-auto">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-[26px] font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${T.accent}, #4BC98E)`,
                      color: T.accentInk,
                      boxShadow: `0 0 0 4px ${T.surface}, 0 0 0 5px rgba(110,231,168,0.35)`,
                    }}
                  >
                    MK
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-[3px]"
                    style={{ background: T.accent, borderColor: T.surface }}
                  >
                    <Check size={10} style={{ color: T.accentInk }} strokeWidth={3} />
                  </span>
                </div>

                {/* Identity text */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h2 className="text-[22px] font-medium leading-tight" style={{ color: T.text }}>
                      Muhib Khan
                    </h2>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ background: "rgba(110,231,168,0.10)", color: T.accent, border: "1px solid rgba(110,231,168,0.28)" }}
                    >
                      <ShieldCheck size={10} /> Verified
                    </span>
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                    muhib@example.com
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 flex-wrap">
                    <Chip icon={Clock} label="Member since Aug 2026" />
                    <Chip icon={MapPin} label="Asia/Karachi" />
                    <Chip icon={UserIcon} label="@muhib" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats ribbon — vertical accent rail */}
          <section className="mb-6 rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: T.borderSoft }}>
              <StatRibbon
                icon={Megaphone}
                label="Campaigns"
                value="24"
                delta="+4 this month"
                accent={T.accent}
              />
              <StatRibbon
                icon={SendGlyph}
                label="Emails sent"
                value="48,250"
                delta="+12.5% this month"
                accent={T.info}
              />
              <StatRibbon
                icon={Users}
                label="Sender accounts"
                value="5"
                delta="2 currently active"
                accent={T.ok}
              />
            </div>
          </section>

          {/* Two-column info panel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 mb-6">

            {/* Personal information */}
            <section className="xl:col-span-2 rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: HAIRLINE_SOFT }}>
                <div className="flex items-center gap-2.5">
                  <UserIcon size={14} style={{ color: T.accent }} />
                  <h2 className="text-[12.5px] font-medium" style={{ color: T.text }}>
                    Personal information
                  </h2>
                </div>
                <span className="text-[10.5px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>
                  Account
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <InfoCell label="Full name"      value="Muhib Khan"             editing={editing} divider />
                <InfoCell label="Email address"  value="muhib@example.com"      editing={editing} divider />
                <InfoCell label="Username"       value="@muhib"                 editing={editing} divider />
                <InfoCell label="Timezone"       value="Asia/Karachi (GMT+5)"   editing={editing} divider />
              </div>

              {editing && (
                <div className="flex justify-end gap-2 px-5 py-3" style={{ borderTop: HAIRLINE_SOFT }}>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors duration-[120ms]"
                    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-all hover:brightness-110"
                    style={{ background: T.accent, color: T.accentInk }}
                  >
                    Save changes
                  </button>
                </div>
              )}
            </section>

            {/* Security */}
            <section className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
              <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: HAIRLINE_SOFT }}>
                <ShieldCheck size={14} style={{ color: T.accent }} />
                <h2 className="text-[12.5px] font-medium" style={{ color: T.text }}>Security</h2>
              </div>

              <div>
                <SecurityRow
                  icon={KeyRound}
                  title="Password"
                  description="Last changed 30 days ago"
                  action="Change"
                  accent={T.accent}
                />
                <SecurityRow
                  icon={ShieldAlert}
                  title="Two-factor authentication"
                  description="Not enabled"
                  action="Enable"
                  accent={T.warn}
                />
                <SecurityRow
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
          <section className="rounded-xl overflow-hidden mb-6" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: HAIRLINE_SOFT }}>
              <div className="flex items-center gap-2.5">
                <Mail size={14} style={{ color: T.accent }} />
                <div>
                  <h2 className="text-[12.5px] font-medium" style={{ color: T.text }}>Sender accounts</h2>
                  <p className="text-[10.5px] mt-0.5" style={{ color: T.textMuted }}>
                    Connected accounts used to send campaigns.
                  </p>
                </div>
              </div>
              <button
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all hover:brightness-110"
                style={{ background: T.accent, color: T.accentInk }}
              >
                <Plus size={12} /> Add sender
              </button>
            </div>

            <ul>
              {senderAccounts.map((a, i) => {
                const p = PROVIDER_STYLE[a.provider] ?? PROVIDER_STYLE["Custom SMTP"];
                const active = a.status === "Active";
                return (
                  <li
                    key={a.email}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-[120ms]"
                    style={{ borderTop: i === 0 ? "none" : HAIRLINE_SOFT }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-medium text-white"
                      style={{ background: p.grad, boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${p.ring}` }}
                    >
                      {p.short}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12.5px] font-medium truncate" style={{ color: T.text }}>
                          {a.email}
                        </p>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: active ? "rgba(110,231,168,0.10)" : "rgba(224,106,106,0.10)",
                            color: active ? T.ok : T.danger,
                            border: `1px solid ${active ? "rgba(110,231,168,0.28)" : "rgba(224,106,106,0.28)"}`,
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: active ? T.ok : T.danger }}
                          />
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                        {a.provider} <span style={{ color: T.border }}>·</span> {a.sent.toLocaleString()} emails sent
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-0.5">
                      <button
                        className="inline-flex items-center justify-center rounded-md p-2 transition-colors duration-[120ms]"
                        style={{ color: T.textMuted }}
                        title="Manage"
                        onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surfaceHi }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent" }}
                      >
                        <Settings2 size={13} />
                      </button>
                      <button
                        aria-label="Remove"
                        className="inline-flex items-center justify-center rounded-md p-2 transition-colors duration-[120ms]"
                        style={{ color: T.textFaint }}
                        title="Remove"
                        onMouseEnter={(e) => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.surfaceHi }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.background = "transparent" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Danger strip */}
          <section
            className="rounded-xl overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4"
            style={{ background: "rgba(224,106,106,0.05)", border: "1px solid rgba(224,106,106,0.28)" }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: "rgba(224,106,106,0.12)", color: T.danger }}
              >
                <AlertTriangle size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[12.5px] font-medium" style={{ color: T.danger }}>
                  Delete account
                </h2>
                <p className="mt-0.5 text-[11px] max-w-lg" style={{ color: "rgba(224,106,106,0.75)" }}>
                  Permanently delete your account and all associated campaigns, templates, and email data.
                </p>
              </div>
            </div>

            <button
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-all hover:brightness-110 self-start md:self-auto"
              style={{ background: "rgba(224,106,106,0.12)", color: T.danger, border: "1px solid rgba(224,106,106,0.28)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(224,106,106,0.2)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(224,106,106,0.12)" }}
            >
              <Trash2 size={12} />
              Delete account
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ─────────────── subcomponents ─────────────── */

const Chip: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = ({ icon: Icon, label }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
    style={{ background: T.surface2, color: T.textMuted, border: HAIRLINE_SOFT }}
  >
    <Icon size={10} style={{ color: T.textFaint }} />
    {label}
  </span>
);

/* ─────────────── Stat Ribbon ─────────────── */

interface StatRibbonProps {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: string;
  accent: string;
}

const StatRibbon = ({ icon: Icon, label, value, delta, accent }: StatRibbonProps) => (
  <div className="relative px-5 py-4">
    <span
      aria-hidden
      className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full hidden sm:block"
      style={{ background: accent, opacity: 0.6 }}
    />
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={12} style={{ color: accent }} />
      <span className="text-[10.5px] uppercase tracking-wider font-medium" style={{ color: T.textFaint }}>
        {label}
      </span>
    </div>
    <p className="text-[22px] font-medium leading-none tracking-tight" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value}
    </p>
    <p className="text-[10.5px] mt-1.5" style={{ color: delta.startsWith("+") ? T.ok : T.textMuted, fontFamily: FONT.mono }}>
      {delta}
    </p>
  </div>
);

/* ─────────────── Info Cell ─────────────── */

interface InfoCellProps {
  label: string;
  value: string;
  editing: boolean;
  divider?: boolean;
}

const InfoCell = ({ label, value, editing, divider }: InfoCellProps) => (
  <div
    className="px-5 py-4"
    style={{ borderBottom: divider ? HAIRLINE_SOFT : undefined }}
  >
    <label className="block text-[10.5px] font-medium tracking-wider uppercase mb-2" style={{ color: T.textFaint }}>
      {label}
    </label>
    {editing ? (
      <input
        type="text"
        defaultValue={value}
        className="prof-input w-full rounded-md px-2.5 py-1.5 text-[12.5px] outline-none transition-colors duration-[120ms]"
        style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}
        onFocus={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
        onBlur={(e) => (e.currentTarget.style.borderColor = T.borderSoft)}
      />
    ) : (
      <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>{value}</p>
    )}
  </div>
);

/* ─────────────── Security Row ─────────────── */

interface SecurityRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  accent: string;
  last?: boolean;
}

const SecurityRow = ({ icon: Icon, title, description, action, accent, last }: SecurityRowProps) => (
  <div
    className="group flex items-center gap-3 px-5 py-3 transition-colors duration-[120ms]"
    style={{ borderBottom: last ? "none" : HAIRLINE_SOFT }}
    onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors duration-[120ms]"
      style={{ color: accent }}
    >
      {action}
      <ChevronRight size={11} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
    </button>
  </div>
);

export default Profile;