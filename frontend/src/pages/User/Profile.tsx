import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Megaphone, Send as SendGlyph, Users, KeyRound, ShieldCheck,
  Monitor, Plus, Pencil, Menu, CheckCircle2, AlertTriangle, X,
  Mail, Trash2, Settings2, ChevronRight, User as UserIcon,
  Clock, MapPin, ShieldAlert,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body, background: "#0B0E13" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .prof-main::-webkit-scrollbar { width: 10px; }
        .prof-main::-webkit-scrollbar-track { background: transparent; }
        .prof-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .prof-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="prof-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: "#0B0E13" }}>
        <div className="glow-top">
          <div className="max-w-[1160px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: "#141823" }}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(52,211,153,0.10)", color: "#34D399", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.20)" }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Active account
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6172", fontFamily: FONT.mono }}>
                      · verified
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em", color: "#F2F0EB" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05]"
                  >
                    Profile
                  </h1>
                  <p className="mt-2 text-[14px] md:text-[15px] max-w-lg" style={{ color: "#8A90A0" }}>
                    Manage your account, security, and connected senders.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold self-start md:self-auto transition-all"
                style={
                  editing
                    ? { background: "#141823", color: "#E8E6E1", boxShadow: "inset 0 0 0 1px #232938" }
                    : { background: "#FF6A39", color: "#fff", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }
                }
              >
                {editing ? <X size={15} /> : <Pencil size={15} />}
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </header>

            {/* ── Hero card ──────────────────────── */}
            <section
              className="float-in relative mb-6 md:mb-8 rounded-3xl overflow-hidden soft-ring"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
            >
              <div
                className="h-24 md:h-28 lg:h-32"
                style={{
                  background:
                    "radial-gradient(600px 200px at 20% 0%, rgba(255,106,57,0.18), transparent 60%), " +
                    "radial-gradient(600px 200px at 90% 100%, rgba(52,211,153,0.10), transparent 60%)",
                }}
              />

              <div className="px-4 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 md:-mt-12 lg:-mt-14">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                    <div className="relative shrink-0">
                      <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-[26px] md:text-[30px] font-bold text-white"
                        style={{
                          background: "linear-gradient(135deg, #FF6A39, #FF8A5C)",
                          boxShadow: "0 20px 40px -20px rgba(255,106,57,0.7), inset 0 0 0 4px #10141D",
                        }}
                      >
                        MK
                      </div>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-4"
                        style={{ background: "#34D399", borderColor: "#10141D", boxShadow: "0 0 10px #34D39988" }}
                      />
                    </div>

                    <div className="text-center sm:text-left pb-1">
                      <h2 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: "#F2F0EB" }}
                        className="text-[22px] md:text-[26px] font-bold leading-tight">
                        Muhib Khan
                      </h2>
                      <p className="text-[13px] mt-0.5" style={{ color: "#8A90A0", fontFamily: FONT.mono }}>
                        muhib@example.com
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pb-1">
                    <Chip icon={Clock} label="Member since Aug 2026" />
                    <Chip icon={MapPin} label="Asia/Karachi" />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Stats ──────────────────────────── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
              <StatCard
                icon={Megaphone}
                accent="#9BA0A8"
                soft="rgba(155,160,168,0.12)"
                label="Campaigns"
                value="24"
                description="+4 this month"
                isEmber={false}
              />
              <StatCard
                icon={SendGlyph}
                accent="#60A5FA"
                soft="rgba(96,165,250,0.12)"
                label="Emails sent"
                value="48,250"
                description="+12.5% this month"
                isEmber={false}
              />
              <StatCard
                icon={Users}
                accent="#34D399"
                soft="rgba(52,211,153,0.12)"
                label="Sender accounts"
                value="5"
                description="2 currently active"
                isEmber={true}
              />
            </section>

            {/* ── Two-column grid ────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6 mb-6 md:mb-8">

              {/* Personal info */}
              <section className="xl:col-span-2 rounded-3xl overflow-hidden soft-ring"
                style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
                <CardHeader
                  icon={UserIcon}
                  title="Personal information"
                  hint="Your basic account details."
                  right={
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(255,106,57,0.10)", color: "#FF6A39", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
                      Account
                    </span>
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 p-4 md:p-6">
                  <InputField label="Full name" value="Muhib Khan" disabled={!editing} />
                  <InputField label="Email address" value="muhib@example.com" disabled={!editing} />
                  <InputField label="Username" value="@muhib" disabled={!editing} />
                  <InputField label="Timezone" value="Asia/Karachi (GMT+5)" disabled={!editing} />
                </div>

                {editing && (
                  <div className="flex justify-end gap-2 px-4 md:px-6 py-4 border-t border-[#1A1F2B]">
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
                      style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                      style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.65)" }}
                    >
                      Save changes
                    </button>
                  </div>
                )}
              </section>

              {/* Security */}
              <section className="rounded-3xl overflow-hidden soft-ring"
                style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
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
                    accent="#FF6A39"
                  />
                  <SecurityItem
                    icon={ShieldAlert}
                    title="Two-factor authentication"
                    description="Not enabled"
                    action="Enable"
                    accent="#FBBF24"
                  />
                  <SecurityItem
                    icon={Monitor}
                    title="Active sessions"
                    description="1 active session"
                    action="View"
                    accent="#60A5FA"
                    last
                  />
                </div>
              </section>
            </div>

            {/* ── Sender accounts ────────────────── */}
            <section className="rounded-3xl overflow-hidden soft-ring mb-6 md:mb-8"
              style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}>
              <CardHeader
                icon={Mail}
                title="Sender accounts"
                hint="Connected accounts used to send campaigns."
                right={
                  <button className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "#FF6A39", boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)" }}>
                    <Plus size={13} /> Add sender
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
                      className="flex items-center gap-4 px-4 md:px-6 py-4 hover:bg-[#11151E] transition-colors"
                      style={{ borderTop: i === 0 ? "none" : "1px solid #1A1F2B" }}
                    >
                      <div
                        className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[15px] font-bold text-white"
                        style={{ background: p.grad, boxShadow: `0 0 0 3px ${p.ring}` }}
                      >
                        {p.short}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-semibold truncate" style={{ color: "#F2F0EB" }}>
                            {a.email}
                          </p>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              background: active ? "rgba(52,211,153,0.10)" : "rgba(248,113,113,0.10)",
                              color:      active ? "#34D399"                : "#F87171",
                              boxShadow:  active ? "inset 0 0 0 1px rgba(52,211,153,0.22)" : "inset 0 0 0 1px rgba(248,113,113,0.22)",
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full"
                              style={{ background: active ? "#34D399" : "#F87171", boxShadow: `0 0 6px ${active ? "#34D399" : "#F87171"}` }} />
                            {a.status}
                          </span>
                        </div>
                        <p className="text-[12px] mt-1" style={{ color: "#7A8092", fontFamily: FONT.mono }}>
                          {a.provider} <span style={{ color: "#4A5162" }}>·</span>{" "}
                          {a.sent.toLocaleString()} emails sent
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-all"
                          style={{ background: "#0F131C", color: "#DADEE7", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                        >
                          <Settings2 size={13} /> Manage
                        </button>
                        <button
                          aria-label="Remove"
                          className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[12px] transition-all"
                          style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ── Danger zone ────────────────────── */}
            <section
              className="rounded-3xl overflow-hidden soft-ring"
              style={{
                background: "linear-gradient(180deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02))",
                boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 md:p-6">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(248,113,113,0.10)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}>
                    <AlertTriangle size={18} className="text-[#F87171]" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: FONT.display }} className="text-[15px] font-semibold text-[#F87171]">
                      Delete account
                    </h2>
                    <p className="mt-1 text-[12.5px] max-w-lg" style={{ color: "#E8A5A5" }}>
                      Permanently delete your account and all associated campaigns, templates, and email data.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <button
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold transition-all self-start md:self-auto"
                  style={{
                    background: "rgba(248,113,113,0.10)",
                    color: "#F87171",
                    boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.30)",
                  }}
                >
                  <Trash2 size={13} />
                  Delete account
                </button>
              </div>
            </section>
          </div>
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
  <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-[#1A1F2B]">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,106,57,0.10)", boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)" }}>
        <Icon size={15} className="text-[#FF6A39]" />
      </div>
      <div>
        <h2 style={{ fontFamily: FONT.display }} className="text-[14.5px] font-semibold tracking-tight text-[#F2F0EB]">
          {title}
        </h2>
        {hint && <p className="text-[11.5px] mt-0.5" style={{ color: "#7A8092" }}>{hint}</p>}
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
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] whitespace-nowrap"
    style={{ background: "#0F131C", color: "#A7ADBB", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
  >
    <Icon size={11} className="text-[#6A7080]" />
    {label}
  </span>
);

/* ─────────────── Stat Card ─────────────── */

interface StatCardProps {
  icon: React.ElementType;
  accent: string;
  soft: string;
  label: string;
  value: string;
  description: string;
  isEmber: boolean;
}

const StatCard = ({ icon: Icon, accent, soft, label, value, description, isEmber }: StatCardProps) => {
  const tone = isEmber ? "#FF6A39" : accent;
  const bg   = isEmber ? "rgba(255,106,57,0.12)" : soft;
  return (
    <div
      className="rounded-3xl p-4 md:p-5 soft-ring transition-all hover:-translate-y-0.5"
      style={{ background: "linear-gradient(180deg, #141823 0%, #10141D 100%)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bg, boxShadow: `inset 0 0 0 1px ${tone}33` }}
        >
          <Icon size={15} style={{ color: tone }} />
        </div>
        {description.startsWith("+") && (
          <span className="text-[10.5px] font-medium"
            style={{ color: "#34D399", fontFamily: FONT.mono }}>{description}</span>
        )}
      </div>
      <p className="text-[26px] font-bold leading-none tracking-tight"
        style={{ color: "#F2F0EB", fontFamily: FONT.mono }}>
        {value}
      </p>
      <p className="text-[12.5px] mt-2" style={{ color: "#DADEE7" }}>{label}</p>
      {!description.startsWith("+") && (
        <p className="text-[11px] mt-0.5" style={{ color: "#6A7080" }}>{description}</p>
      )}
    </div>
  );
};

/* ─────────────── Input Field ─────────────── */

interface InputFieldProps {
  label: string;
  value: string;
  disabled: boolean;
}

const InputField = ({ label, value, disabled }: InputFieldProps) => (
  <div>
    <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: "#C7C9CE" }}>
      {label}
    </label>
    <input
      type="text"
      defaultValue={value}
      disabled={disabled}
      className="w-full rounded-2xl px-3.5 py-2.5 text-[13px] outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: "#0F131C",
        color: "#E8E6E1",
        boxShadow: "inset 0 0 0 1px #1A1F2B",
      }}
      onFocus={(e) => {
        if (!disabled) e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,106,57,0.5), 0 0 0 4px rgba(255,106,57,0.10)";
      }}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "inset 0 0 0 1px #1A1F2B")}
    />
  </div>
);

/* ─────────────── Security Item ─────────────── */

interface SecurityItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  accent?: string;
  last?: boolean;
}

const SecurityItem = ({ icon: Icon, title, description, action, accent = "#FF6A39", last }: SecurityItemProps) => (
  <div
    className="group flex items-center gap-3 px-4 md:px-6 py-4 hover:bg-[#11151E] transition-colors"
    style={{ borderTop: last ? "1px solid #1A1F2B" : undefined, borderBottom: last ? "none" : "1px solid #1A1F2B" }}
  >
    <div
      className="shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center"
      style={{ background: `${accent}14`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <Icon size={14} style={{ color: accent }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium truncate" style={{ color: "#F2F0EB" }}>{title}</p>
      <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "#7A8092" }}>{description}</p>
    </div>
    <button
      className="shrink-0 inline-flex items-center gap-1 text-[12px] font-medium transition-colors"
      style={{ color: accent }}
    >
      {action}
      <ChevronRight size={13} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
    </button>
  </div>
);

export default Profile;