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
  Menu,
} from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0B0E12]">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
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

      {/* Main content */}
      <main className="main-content flex-1 overflow-y-auto bg-[#12151B] h-screen w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#12151B] border-b border-[#2A2E37]">
          <div className="mx-auto max-w-7xl px-3 md:px-4 lg:px-6 xl:px-10 py-3 md:py-4 lg:py-7">
            <div className="flex flex-col gap-3 md:gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <p className="text-[10px] md:text-sm font-medium text-[#6B727C]">Account</p>
                  <h1 className="mt-0.5 md:mt-1 text-xl md:text-2xl lg:text-3xl font-bold text-[#E8E6E1] tracking-tight">
                    Profile
                  </h1>
                  <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#9BA0A8]">
                    Manage your account, security and connected email accounts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2A2E37] px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] bg-[#12151B] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition-colors w-full sm:w-auto"
              >
                <Pencil size={12} className="md:w-[13px] md:h-[13px] lg:w-[13px] lg:h-[13px]" />
                {editing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl space-y-3 md:space-y-4 lg:space-y-6 px-3 md:px-4 lg:px-6 xl:px-10 py-3 md:py-4 lg:py-8">
          {/* Profile Hero */}
          <section className="overflow-hidden rounded-xl border border-[#2A2E37] bg-[#12151B]">
            <div className="h-12 md:h-16 lg:h-28 bg-gradient-to-r from-[#1B1E24] via-[#2A2E37] to-[#1B1E24]" />

            <div className="px-3 md:px-4 lg:px-6 pb-4 md:pb-5 lg:pb-7">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-5 -mt-6 md:-mt-8 lg:-mt-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 md:gap-3 lg:gap-5">
                  <div className="relative">
                    <div className="flex h-12 w-12 md:h-16 md:w-16 lg:h-24 lg:w-24 items-center justify-center rounded-2xl border-4 border-[#12151B] text-base md:text-lg lg:text-2xl font-semibold text-white shadow-lg bg-[#FF6A39]">
                      MK
                    </div>
                    <span className="absolute bottom-0 md:bottom-1 right-0 md:right-1 h-2.5 w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4 rounded-full border-2 border-[#12151B] bg-emerald-400" />
                  </div>

                  <div className="text-center sm:text-left pb-0 sm:pb-1">
                    <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-[#E8E6E1]">Muhib Khan</h2>
                    <p className="text-[10px] md:text-xs lg:text-sm text-[#9BA0A8]">muhib@example.com</p>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end pb-0 sm:pb-1">
                  <span className="flex items-center gap-1 md:gap-1.5 lg:gap-2 rounded-full px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 lg:py-1.5 text-[8px] md:text-[9px] lg:text-xs font-medium whitespace-nowrap bg-emerald-500/15 text-emerald-400">
                    <span className="h-1 w-1 md:h-1.5 md:w-1.5 lg:h-1.5 lg:w-1.5 rounded-full bg-emerald-400" />
                    <span className="hidden xs:inline">Active account</span>
                    <span className="xs:hidden">Active</span>
                  </span>
                </div>
              </div>

              <div className="mt-2 md:mt-3 lg:mt-6 flex flex-wrap justify-center sm:justify-start gap-x-2 md:gap-x-4 lg:gap-x-6 gap-y-1 md:gap-y-1.5 lg:gap-y-2 text-[8px] md:text-[9px] lg:text-sm text-[#6B727C]">
                <span className="font-mono">Member since Aug 2026</span>
                <span className="hidden xs:block text-[#2A2E37]">•</span>
                <span className="font-mono">Last login today</span>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
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

          {/* Grid */}
          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 xl:grid-cols-3">
            {/* Personal Info */}
            <section className="rounded-xl border border-[#2A2E37] bg-[#12151B] xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5 border-b border-[#2A2E37]">
                <div>
                  <h2 className="text-xs md:text-sm lg:text-base font-semibold text-[#E8E6E1]">Personal information</h2>
                  <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm text-[#9BA0A8]">
                    Your basic account information.
                  </p>
                </div>
                <span className="rounded-md px-1.5 md:px-2 lg:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-xs font-medium whitespace-nowrap bg-[#1B1E24] text-[#C7C9CE]">
                  Account
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6 p-3 md:p-4 lg:p-6">
                <InputField label="Full name" value="Muhib Khan" disabled={!editing} />
                <InputField label="Email address" value="muhib@example.com" disabled={!editing} />
                <InputField label="Username" value="@muhib" disabled={!editing} />
                <InputField label="Timezone" value="Asia/Karachi (GMT+5)" disabled={!editing} />
              </div>

              {editing && (
                <div className="flex justify-end px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4 border-t border-[#2A2E37]">
                  <button className="rounded-lg px-3 md:px-4 lg:px-5 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white bg-[#FF6A39] hover:opacity-90 transition">
                    Save changes
                  </button>
                </div>
              )}
            </section>

            {/* Security */}
            <section className="rounded-xl border border-[#2A2E37] bg-[#12151B]">
              <div className="px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5 border-b border-[#2A2E37]">
                <h2 className="text-xs md:text-sm lg:text-base font-semibold text-[#E8E6E1]">Security</h2>
                <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm text-[#9BA0A8]">Protect your account.</p>
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

          {/* Senders */}
          <section className="rounded-xl border border-[#2A2E37] bg-[#12151B]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5 border-b border-[#2A2E37]">
              <div>
                <h2 className="text-xs md:text-sm lg:text-base font-semibold text-[#E8E6E1]">Connected sender accounts</h2>
                <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm text-[#9BA0A8]">
                  Email accounts used to send your campaigns.
                </p>
              </div>

              <button className="flex items-center justify-center gap-1.5 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-white bg-[#FF6A39] hover:opacity-90 transition w-full sm:w-auto">
                <Plus size={12} className="md:w-[13px] md:h-[13px] lg:w-[13px] lg:h-[13px]" />
                <span className="hidden xs:inline">Add sender</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>

            <div>
              {senderAccounts.map((sender, i) => {
                const p = PROVIDER_STYLE[sender.provider];
                return (
                  <div
                    key={sender.email}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5 border-t border-[#2A2E37] hover:bg-[#1B1E24] transition"
                  >
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                      <div
                        className="flex h-7 w-7 md:h-9 md:w-9 lg:h-11 lg:w-11 items-center justify-center rounded-xl text-[9px] md:text-xs lg:text-sm font-semibold shrink-0"
                        style={{ background: p.soft, color: p.accent }}
                      >
                        {p.label}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] md:text-xs lg:text-sm font-medium truncate text-[#E8E6E1]">
                          {sender.email}
                        </p>
                        <div className="mt-0.5 md:mt-1 flex flex-wrap items-center gap-1 md:gap-1.5 lg:gap-2 text-[8px] md:text-[9px] lg:text-xs text-[#6B727C]">
                          <span>{sender.provider}</span>
                          <span className="text-[#2A2E37]">•</span>
                          <span className="font-mono">{sender.sent.toLocaleString()} emails sent</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                      <span
                        className="rounded-full px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 lg:py-1.5 text-[8px] md:text-[9px] lg:text-xs font-medium whitespace-nowrap"
                        style={{
                          background: sender.status === "Active" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                          color: sender.status === "Active" ? "#34D399" : "#F87171",
                        }}
                      >
                        <span className="hidden xs:inline">{sender.status}</span>
                        <span className="xs:hidden">{sender.status.charAt(0)}</span>
                      </span>

                      <button className="rounded-lg border border-[#2A2E37] px-2 md:px-2.5 lg:px-3 py-1 md:py-1.5 lg:py-2 text-[8px] md:text-[9px] lg:text-sm font-medium text-[#C7C9CE] bg-transparent hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition">
                        <span className="hidden xs:inline">Manage</span>
                        <span className="xs:hidden">⚙</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 lg:gap-4 p-3 md:p-4 lg:p-6">
              <div>
                <h2 className="text-xs md:text-sm lg:text-base font-semibold text-rose-400">Delete account</h2>
                <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm text-rose-300">
                  Permanently delete your account and all associated campaigns, templates and email data.
                </p>
              </div>

              <button className="rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium text-rose-400 border border-rose-500/30 bg-transparent hover:bg-rose-500/10 transition w-full sm:w-auto">
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
    <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] p-2.5 md:p-3 lg:p-5 hover:translate-y-[-2px] transition-transform duration-150">
      <div 
        className="flex h-6 w-6 md:h-7 md:w-7 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
        style={{ background: isEmber ? "rgba(255,106,57,0.12)" : soft }}
      >
        <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: isEmber ? "#FF6A39" : accent }} />
      </div>
      <p className="mt-1.5 md:mt-2 lg:mt-4 text-base md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-mono">
        {value}
      </p>
      <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-sm text-[#9BA0A8]">
        {label}
      </p>
      <p className="mt-0.5 md:mt-1 text-[7px] md:text-[8px] lg:text-xs text-[#6B727C]">
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
      <label className="mb-1 md:mb-1.5 lg:mb-2 block text-[9px] md:text-[10px] lg:text-sm font-medium text-[#C7C9CE]">
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="w-full rounded-lg px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-3 text-[10px] md:text-xs lg:text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 border border-[#2A2E37] bg-[#0B0E12] text-[#E8E6E1] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/10"
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
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 md:gap-2 lg:gap-4 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5 ${last ? "" : "border-b border-[#2A2E37]"}`}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex h-6 w-6 md:h-7 md:w-7 lg:h-9 lg:w-9 items-center justify-center rounded-lg shrink-0" style={{ background: `${accent}1A` }}>
          <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[10px] md:text-xs lg:text-sm font-medium text-[#E8E6E1]">{title}</p>
          <p className="mt-0.5 text-[8px] md:text-[9px] lg:text-xs text-[#6B727C]">{description}</p>
        </div>
      </div>

      <button className="text-[9px] md:text-[10px] lg:text-sm font-medium hover:text-[#E8E6E1] shrink-0" style={{ color: accent }}>
        {action}
      </button>
    </div>
  );
};

export default Profile;