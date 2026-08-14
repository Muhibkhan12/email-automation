import { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Megaphone,
  Send as SendGlyph,
  Users,
  KeyRound,
  ShieldCheck,
  Monitor,
  Plus,
  Pencil,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (matches Analytics/Campaign/Templates) */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#2F6FED",
  primarySoft: "#EAF0FE",
  success: "#1FA971",
  successSoft: "#E6F7EF",
  warning: "#E8A23D",
  warningSoft: "#FDF3E4",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  dark: "#11141B",
  bg: "#F4F5F8",
  border: "#E7E8EC",
  textMuted: "#8A8F9C",
  textBody: "#4B4F5A",
};

interface SenderAccount {
  email: string;
  provider: string;
  status: "Active" | "Disconnected";
  sent: number;
}

const senderAccounts: SenderAccount[] = [
  { email: "marketing@company.com", provider: "Gmail SMTP", status: "Active", sent: 18420 },
  { email: "sales@company.com", provider: "Outlook SMTP", status: "Active", sent: 15830 },
  { email: "hello@company.com", provider: "Custom SMTP", status: "Disconnected", sent: 13920 },
];

const PROVIDER_STYLE: Record<string, { label: string; accent: string; soft: string }> = {
  "Gmail SMTP": { label: "G", accent: COLOR.danger, soft: COLOR.dangerSoft },
  "Outlook SMTP": { label: "O", accent: COLOR.primary, soft: COLOR.primarySoft },
  "Custom SMTP": { label: "S", accent: COLOR.dark, soft: COLOR.bg },
};

const Profile = () => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-btn:focus-visible,
        .mf-input:focus-visible,
        .mf-link:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-stat:hover { transform: translateY(-2px); }
        .mf-stat { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .mf-row:hover { background-color: ${COLOR.bg}; }
      `}</style>

      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* ================= HEADER ================= */}
        <div className="bg-white" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <div className="mx-auto max-w-7xl px-6 py-7 lg:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: COLOR.textMuted }}>
                  Account
                </p>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
                  className="mt-1 text-3xl font-bold"
                >
                  Profile
                </h1>
                <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                  Manage your account, security and connected email accounts.
                </p>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="mf-btn flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textBody, background: "#FFFFFF" }}
              >
                <Pencil size={14} />
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:px-10">
          {/* ================= PROFILE HERO ================= */}
          <section className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${COLOR.border}` }}>
            <div className="h-28" style={{ background: `linear-gradient(90deg, ${COLOR.dark}, #1E2536, ${COLOR.dark})` }} />

            <div className="px-6 pb-7">
              <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-5">
                  <div className="relative">
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white text-2xl font-semibold text-white shadow-lg"
                      style={{ fontFamily: FONT.display, background: COLOR.primary }}
                    >
                      MK
                    </div>
                    <span
                      className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white"
                      style={{ background: COLOR.success }}
                    />
                  </div>

                  <div className="pb-1">
                    <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-2xl font-semibold">
                      Muhib Khan
                    </h2>
                    <p className="text-sm" style={{ color: COLOR.textMuted }}>
                      muhib@example.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-1">
                  <span
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: COLOR.successSoft, color: "#0F6E56" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR.success }} />
                    Active account
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: COLOR.textMuted }}>
                <span style={{ fontFamily: FONT.mono }}>Member since Aug 2026</span>
                <span className="hidden sm:block" style={{ color: COLOR.border }}>
                  •
                </span>
                <span style={{ fontFamily: FONT.mono }}>Last login today</span>
              </div>
            </div>
          </section>

          {/* ================= STATS ================= */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Megaphone} accent={COLOR.dark} soft={COLOR.bg} label="Campaigns" value="24" description="+4 this month" />
            <StatCard icon={SendGlyph} accent={COLOR.primary} soft={COLOR.primarySoft} label="Emails sent" value="48,250" description="+12.5% this month" />
            <StatCard icon={Users} accent={COLOR.success} soft={COLOR.successSoft} label="Sender accounts" value="5" description="2 currently active" />
          </section>

          {/* ================= GRID ================= */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* ================= PERSONAL INFO ================= */}
            <section className="rounded-xl bg-white xl:col-span-2" style={{ border: `1px solid ${COLOR.border}` }}>
              <div
                className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: `1px solid ${COLOR.border}` }}
              >
                <div>
                  <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="font-semibold">
                    Personal information
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                    Your basic account information.
                  </p>
                </div>
                <span
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{ background: COLOR.bg, color: COLOR.textBody }}
                >
                  Account
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <InputField label="Full name" value="Muhib Khan" disabled={!editing} />
                <InputField label="Email address" value="muhib@example.com" disabled={!editing} />
                <InputField label="Username" value="@muhib" disabled={!editing} />
                <InputField label="Timezone" value="Asia/Karachi (GMT+5)" disabled={!editing} />
              </div>

              {editing && (
                <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                  <button
                    className="mf-btn rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: COLOR.primary }}
                  >
                    Save changes
                  </button>
                </div>
              )}
            </section>

            {/* ================= SECURITY ================= */}
            <section className="rounded-xl bg-white" style={{ border: `1px solid ${COLOR.border}` }}>
              <div className="px-6 py-5" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="font-semibold">
                  Security
                </h2>
                <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                  Protect your account.
                </p>
              </div>

              <div>
                <SecurityItem icon={KeyRound} title="Password" description="Last changed 30 days ago" action="Change" />
                <SecurityItem icon={ShieldCheck} title="Two-factor authentication" description="Not enabled" action="Enable" accent={COLOR.warning} />
                <SecurityItem icon={Monitor} title="Active sessions" description="1 active session" action="View" last />
              </div>
            </section>
          </div>

          {/* ================= SENDERS ================= */}
          <section className="rounded-xl bg-white" style={{ border: `1px solid ${COLOR.border}` }}>
            <div
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderBottom: `1px solid ${COLOR.border}` }}
            >
              <div>
                <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="font-semibold">
                  Connected sender accounts
                </h2>
                <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                  Email accounts used to send your campaigns.
                </p>
              </div>

              <button
                className="mf-btn flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: COLOR.primary }}
              >
                <Plus size={14} />
                Add sender
              </button>
            </div>

            <div>
              {senderAccounts.map((sender, i) => {
                const p = PROVIDER_STYLE[sender.provider];
                return (
                  <div
                    key={sender.email}
                    className="mf-row flex flex-col gap-4 px-6 py-5 transition sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold"
                        style={{ background: p.soft, color: p.accent, fontFamily: FONT.display }}
                      >
                        {p.label}
                      </div>

                      <div>
                        <p className="font-medium" style={{ color: COLOR.dark }}>
                          {sender.email}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: COLOR.textMuted }}>
                          <span>{sender.provider}</span>
                          <span style={{ color: COLOR.border }}>•</span>
                          <span style={{ fontFamily: FONT.mono }}>{sender.sent.toLocaleString()} emails sent</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className="rounded-full px-3 py-1.5 text-xs font-medium"
                        style={{
                          background: sender.status === "Active" ? COLOR.successSoft : COLOR.dangerSoft,
                          color: sender.status === "Active" ? "#0F6E56" : "#993C1D",
                        }}
                      >
                        {sender.status}
                      </span>

                      <button
                        className="mf-link rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
                        style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= DANGER ZONE ================= */}
          <section className="rounded-xl" style={{ border: `1px solid ${COLOR.danger}30`, background: COLOR.dangerSoft }}>
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 style={{ fontFamily: FONT.display, color: "#7A2A17" }} className="font-semibold">
                  Delete account
                </h2>
                <p className="mt-1 max-w-xl text-sm" style={{ color: "#99432B" }}>
                  Permanently delete your account and all associated campaigns, templates and email data.
                </p>
              </div>

              <button
                className="mf-btn rounded-lg bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-white"
                style={{ border: `1px solid ${COLOR.danger}55`, color: COLOR.danger }}
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ========================================================= */
/* Components */
/* ========================================================= */

interface StatCardProps {
  icon: React.ElementType;
  accent: string;
  soft: string;
  label: string;
  value: string;
  description: string;
}

const StatCard = ({ icon: Icon, accent, soft, label, value, description }: StatCardProps) => {
  return (
    <div className="mf-stat rounded-xl bg-white p-5" style={{ border: `1px solid ${COLOR.border}` }}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: soft }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <p style={{ fontFamily: FONT.mono, color: COLOR.dark }} className="mt-4 text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-sm" style={{ color: COLOR.textBody }}>
        {label}
      </p>
      <p className="mt-1 text-xs" style={{ color: COLOR.textMuted }}>
        {description}
      </p>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  disabled: boolean;
}

const InputField = ({ label, value, disabled }: InputFieldProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" style={{ color: COLOR.textBody }}>
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="mf-input w-full rounded-lg px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          border: `1px solid ${COLOR.border}`,
          background: disabled ? COLOR.bg : "#FFFFFF",
          color: COLOR.dark,
          fontFamily: FONT.body,
        }}
      />
    </div>
  );
};

interface SecurityItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  accent?: string;
  last?: boolean;
}

const SecurityItem = ({ icon: Icon, title, description, action, accent = COLOR.primary, last }: SecurityItemProps) => {
  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-5"
      style={{ borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${accent}1A` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: COLOR.dark }}>
            {title}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: COLOR.textMuted }}>
            {description}
          </p>
        </div>
      </div>

      <button className="mf-link text-sm font-medium transition" style={{ color: COLOR.primary }}>
        {action}
      </button>
    </div>
  );
};

export default Profile;