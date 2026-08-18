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

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
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
  "Gmail SMTP": { label: "G", accent: "#F87171", soft: "rgba(248,113,113,0.12)" },
  "Outlook SMTP": { label: "O", accent: "#60A5FA", soft: "rgba(96,165,250,0.12)" },
  "Custom SMTP": { label: "S", accent: "#9BA0A8", soft: "rgba(155,160,168,0.12)" },
};

const Profile = () => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-stat:hover { transform: translateY(-2px); }
        .mf-stat { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .mf-row:hover { background-color: #1B1E24; }

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
          .mf-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .mf-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .mf-edit-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .mf-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mf-profile-hero {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .mf-profile-avatar {
            width: 4.5rem !important;
            height: 4.5rem !important;
            font-size: 1.25rem !important;
          }
          .mf-profile-name {
            font-size: 1.25rem !important;
          }
          .mf-profile-status {
            align-self: center !important;
          }
          .mf-info-grid {
            grid-template-columns: 1fr !important;
          }
          .mf-sender-item {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .mf-sender-actions {
            flex-wrap: wrap !important;
          }
          .mf-sender-actions button {
            flex: 1 !important;
          }
          .mf-danger-zone {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .mf-danger-zone button {
            width: 100% !important;
            justify-content: center !important;
          }
          .mf-main-content {
            padding: 0 !important;
          }
          .mf-content-container {
            padding: 0.75rem !important;
          }
          .mf-section-padding {
            padding: 0.75rem !important;
          }
          .mf-stat-card {
            padding: 0.75rem !important;
          }
          .mf-stat-value {
            font-size: 1.25rem !important;
          }
          .mf-stat-label {
            font-size: 0.7rem !important;
          }
          .mf-stat-desc {
            font-size: 0.6rem !important;
          }
          .mf-security-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem !important;
          }
          .mf-security-item button {
            align-self: flex-start !important;
          }
        }

        @media (max-width: 640px) {
          .mf-profile-avatar {
            width: 3.5rem !important;
            height: 3.5rem !important;
            font-size: 1rem !important;
          }
          .mf-profile-name {
            font-size: 1rem !important;
          }
          .mf-profile-email {
            font-size: 0.7rem !important;
          }
          .mf-profile-meta {
            font-size: 0.6rem !important;
          }
          .mf-sender-email {
            font-size: 0.75rem !important;
          }
          .mf-sender-provider {
            font-size: 0.6rem !important;
          }
          .mf-sender-sent {
            font-size: 0.6rem !important;
          }
          .mf-security-title {
            font-size: 0.75rem !important;
          }
          .mf-security-desc {
            font-size: 0.6rem !important;
          }
        }
      `}</style>

      {/* Sidebar - sticky on all screen sizes */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto" style={{ background: "#12151B", height: "100vh" }}>
        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-10" style={{ background: "#12151B", borderBottom: "1px solid #2A2E37" }}>
          <div className="mf-content-container mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-7 lg:px-10">
            <div className="mf-header flex flex-col gap-3 md:gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] md:text-sm font-medium" style={{ color: "#6B727C" }}>
                  Account
                </p>
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                  className="mt-0.5 md:mt-1 text-2xl md:text-3xl font-bold" 
                  style={{ color: "#E8E6E1" }}
                >
                  Profile
                </h1>
                <p className="mt-0.5 md:mt-1 text-xs md:text-sm" style={{ color: "#9BA0A8" }}>
                  Manage your account, security and connected email accounts.
                </p>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="mf-edit-btn flex items-center justify-center gap-1.5 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors"
                style={{ 
                  border: "1px solid #2A2E37", 
                  color: "#C7C9CE", 
                  background: "#12151B" 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1B1E24";
                  e.currentTarget.style.color = "#E8E6E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#12151B";
                  e.currentTarget.style.color = "#C7C9CE";
                }}
              >
                <Pencil size={13} />
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="mf-content-container mx-auto max-w-7xl space-y-4 md:space-y-6 px-4 md:px-6 py-4 md:py-8 lg:px-10">
          {/* ================= PROFILE HERO ================= */}
          <section className="overflow-hidden rounded-xl" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
            <div className="h-16 md:h-28" style={{ background: "linear-gradient(90deg, #1B1E24, #2A2E37, #1B1E24)" }} />

            <div className="px-4 md:px-6 pb-5 md:pb-7">
              <div className="mf-profile-hero -mt-8 md:-mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 md:gap-5">
                  <div className="relative">
                    <div
                      className="mf-profile-avatar flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-2xl border-4 border-[#12151B] text-lg md:text-2xl font-semibold text-white shadow-lg"
                      style={{ fontFamily: FONT.display, background: "#FF6A39" }}
                    >
                      MK
                    </div>
                    <span
                      className="absolute bottom-0.5 md:bottom-1 right-0.5 md:right-1 h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-[#12151B]"
                      style={{ background: "#34D399" }}
                    />
                  </div>

                  <div className="mf-profile-info pb-0 sm:pb-1 text-center sm:text-left">
                    <h2 className="mf-profile-name" style={{ fontFamily: FONT.display, color: "#E8E6E1", fontSize: "clamp(1rem, 2vw, 1.5rem)" }} className="font-semibold">
                      Muhib Khan
                    </h2>
                    <p className="mf-profile-email text-xs md:text-sm" style={{ color: "#9BA0A8" }}>
                      muhib@example.com
                    </p>
                  </div>
                </div>

                <div className="mf-profile-status flex justify-center sm:justify-end pb-0 sm:pb-1">
                  <span
                    className="flex items-center gap-1.5 md:gap-2 rounded-full px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium whitespace-nowrap"
                    style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}
                  >
                    <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full" style={{ background: "#34D399" }} />
                    Active account
                  </span>
                </div>
              </div>

              <div className="mf-profile-meta mt-3 md:mt-6 flex flex-wrap justify-center sm:justify-start gap-x-4 md:gap-x-6 gap-y-1 md:gap-y-2 text-[10px] md:text-sm" style={{ color: "#6B727C" }}>
                <span style={{ fontFamily: FONT.mono }}>Member since Aug 2026</span>
                <span className="hidden sm:block" style={{ color: "#2A2E37" }}>
                  •
                </span>
                <span style={{ fontFamily: FONT.mono }}>Last login today</span>
              </div>
            </div>
          </section>

          {/* ================= STATS ================= */}
          <section className="mf-stats-grid grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-3">
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

          {/* ================= GRID ================= */}
          <div className="mf-profile-grid grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
            {/* ================= PERSONAL INFO ================= */}
            <section className="rounded-xl xl:col-span-2" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
              <div
                className="mf-section-padding flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-5"
                style={{ borderBottom: "1px solid #2A2E37" }}
              >
                <div>
                  <h2 style={{ fontFamily: FONT.display }} className="text-sm md:text-base font-semibold" style={{ color: "#E8E6E1" }}>
                    Personal information
                  </h2>
                  <p className="mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#9BA0A8" }}>
                    Your basic account information.
                  </p>
                </div>
                <span
                  className="rounded-md px-2 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-xs font-medium whitespace-nowrap"
                  style={{ background: "#1B1E24", color: "#C7C9CE" }}
                >
                  Account
                </span>
              </div>

              <div className="mf-info-grid grid grid-cols-1 gap-4 md:gap-6 p-4 md:p-6 md:grid-cols-2">
                <InputField label="Full name" value="Muhib Khan" disabled={!editing} />
                <InputField label="Email address" value="muhib@example.com" disabled={!editing} />
                <InputField label="Username" value="@muhib" disabled={!editing} />
                <InputField label="Timezone" value="Asia/Karachi (GMT+5)" disabled={!editing} />
              </div>

              {editing && (
                <div className="flex justify-end px-4 md:px-6 py-3 md:py-4" style={{ borderTop: "1px solid #2A2E37" }}>
                  <button
                    className="rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "#FF6A39" }}
                  >
                    Save changes
                  </button>
                </div>
              )}
            </section>

            {/* ================= SECURITY ================= */}
            <section className="rounded-xl" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
              <div className="mf-section-padding px-4 md:px-6 py-3 md:py-5" style={{ borderBottom: "1px solid #2A2E37" }}>
                <h2 style={{ fontFamily: FONT.display }} className="text-sm md:text-base font-semibold" style={{ color: "#E8E6E1" }}>
                  Security
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#9BA0A8" }}>
                  Protect your account.
                </p>
              </div>

              <div>
                <SecurityItem 
                  icon={KeyRound} 
                  title="Password" 
                  description="Last changed 30 days ago" 
                  action="Change" 
                  accent="#FF6A39"
                />
                <SecurityItem 
                  icon={ShieldCheck} 
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

          {/* ================= SENDERS ================= */}
          <section className="rounded-xl" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
            <div
              className="mf-section-padding flex flex-col gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderBottom: "1px solid #2A2E37" }}
            >
              <div>
                <h2 style={{ fontFamily: FONT.display }} className="text-sm md:text-base font-semibold" style={{ color: "#E8E6E1" }}>
                  Connected sender accounts
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#9BA0A8" }}>
                  Email accounts used to send your campaigns.
                </p>
              </div>

              <button
                className="flex items-center justify-center gap-1.5 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "#FF6A39" }}
              >
                <Plus size={13} />
                Add sender
              </button>
            </div>

            <div>
              {senderAccounts.map((sender, i) => {
                const p = PROVIDER_STYLE[sender.provider];
                return (
                  <div
                    key={sender.email}
                    className="mf-sender-item mf-row flex flex-col gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 transition sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderTop: i === 0 ? "none" : "1px solid #2A2E37" }}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div
                        className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl text-xs md:text-sm font-semibold shrink-0"
                        style={{ background: p.soft, color: p.accent, fontFamily: FONT.display }}
                      >
                        {p.label}
                      </div>

                      <div className="min-w-0">
                        <p className="mf-sender-email text-xs md:text-sm font-medium truncate" style={{ color: "#E8E6E1" }}>
                          {sender.email}
                        </p>
                        <div className="mt-0.5 md:mt-1 flex flex-wrap items-center gap-1.5 md:gap-2 text-[9px] md:text-xs" style={{ color: "#6B727C" }}>
                          <span className="mf-sender-provider">{sender.provider}</span>
                          <span style={{ color: "#2A2E37" }}>•</span>
                          <span className="mf-sender-sent" style={{ fontFamily: FONT.mono }}>{sender.sent.toLocaleString()} emails sent</span>
                        </div>
                      </div>
                    </div>

                    <div className="mf-sender-actions flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium whitespace-nowrap"
                        style={{
                          background: sender.status === "Active" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                          color: sender.status === "Active" ? "#34D399" : "#F87171",
                        }}
                      >
                        {sender.status}
                      </span>

                      <button
                        className="rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-sm font-medium transition-colors"
                        style={{ 
                          border: "1px solid #2A2E37", 
                          color: "#C7C9CE",
                          background: "transparent"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1B1E24";
                          e.currentTarget.style.color = "#E8E6E1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#C7C9CE";
                        }}
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
          <section className="rounded-xl" style={{ border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)" }}>
            <div className="mf-danger-zone flex flex-col gap-3 md:gap-4 p-4 md:p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 style={{ fontFamily: FONT.display, color: "#F87171" }} className="text-sm md:text-base font-semibold">
                  Delete account
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#FCA5A5" }}>
                  Permanently delete your account and all associated campaigns, templates and email data.
                </p>
              </div>

              <button
                className="rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition hover:bg-[#1B1E24]"
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
  isEmber: boolean;
}

const StatCard = ({ icon: Icon, accent, soft, label, value, description, isEmber }: StatCardProps) => {
  return (
    <div className="mf-stat-card mf-stat rounded-xl p-3 md:p-5" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
      <div 
        className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-lg"
        style={{ background: isEmber ? "rgba(255,106,57,0.12)" : soft }}
      >
        <Icon size={13} style={{ color: isEmber ? "#FF6A39" : accent }} />
      </div>
      <p className="mf-stat-value" style={{ fontFamily: FONT.mono, color: "#E8E6E1", fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }} className="mt-2 md:mt-4 font-semibold tracking-tight">
        {value}
      </p>
      <p className="mf-stat-label mt-0.5 md:mt-1 text-[10px] md:text-sm" style={{ color: "#9BA0A8" }}>
        {label}
      </p>
      <p className="mf-stat-desc mt-0.5 md:mt-1 text-[8px] md:text-xs" style={{ color: "#6B727C" }}>
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
      <label className="mb-1.5 md:mb-2 block text-[10px] md:text-sm font-medium" style={{ color: "#C7C9CE" }}>
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="w-full rounded-lg px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          border: "1px solid #2A2E37",
          background: disabled ? "#0B0E12" : "#12151B",
          color: "#E8E6E1",
          fontFamily: FONT.body,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "#FF6A39";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,106,57,0.1)";
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#2A2E37";
          e.currentTarget.style.boxShadow = "none";
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

const SecurityItem = ({ icon: Icon, title, description, action, accent = "#FF6A39", last }: SecurityItemProps) => {
  return (
    <div
      className="mf-security-item flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-5"
      style={{ borderBottom: last ? "none" : "1px solid #2A2E37" }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-lg shrink-0" style={{ background: `${accent}1A` }}>
          <Icon size={13} style={{ color: accent }} />
        </div>
        <div>
          <p className="mf-security-title text-xs md:text-sm font-medium" style={{ color: "#E8E6E1" }}>
            {title}
          </p>
          <p className="mf-security-desc mt-0.5 text-[9px] md:text-xs" style={{ color: "#6B727C" }}>
            {description}
          </p>
        </div>
      </div>

      <button 
        className="text-[10px] md:text-sm font-medium transition-colors hover:text-[#E8E6E1] shrink-0"
        style={{ color: accent }}
      >
        {action}
      </button>
    </div>
  );
};

export default Profile;