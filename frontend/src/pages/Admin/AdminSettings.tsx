// AdminSettings.tsx
import React, { useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Save, Shield, X, Menu, Eye, EyeOff,
  Loader2, AlertTriangle, CheckCircle2, User as UserIcon,
  Mail, Key, Lock, ShieldCheck, Sparkles,
} from "lucide-react";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:           "#0A0B10",
  surface:      "#111319",
  surface2:     "#161922",
  surfaceHi:    "#1B1F2A",
  border:       "#232838",
  borderSoft:   "#1B1F2A",
  text:         "#E9EBF0",
  textMuted:    "#9CA3B4",
  textFaint:    "#6B7280",
  brand:        "#6366F1",
  brandSoft:    "rgba(99,102,241,0.12)",
  brandBorder:  "rgba(99,102,241,0.35)",
  success:      "#22C55E",
  successSoft:  "rgba(34,197,94,0.12)",
  successBorder:"rgba(34,197,94,0.35)",
  warn:         "#F59E0B",
  warnSoft:     "rgba(245,158,11,0.12)",
  warnBorder:   "rgba(245,158,11,0.35)",
  danger:       "#EF4444",
  dangerSoft:   "rgba(239,68,68,0.12)",
  dangerBorder: "rgba(239,68,68,0.35)",
  info:         "#38BDF8",
  infoSoft:     "rgba(56,189,248,0.12)",
  infoBorder:   "rgba(56,189,248,0.35)",
};

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING }}>
    {children}
  </div>
);

const InputShell: React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ icon: Icon, children, disabled }) => (
  <div
    className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
    style={{
      background: T.surface2,
      boxShadow: `inset 0 0 0 1px ${T.borderSoft}`,
      opacity: disabled ? 0.6 : 1,
    }}
    onFocusCapture={(e) =>
      (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.brandBorder}, 0 0 0 3px ${T.brandSoft}`)
    }
    onBlurCapture={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.borderSoft}`)}
  >
    {Icon && <Icon size={12} className="shrink-0" />}
    {children}
  </div>
);

const textInputCls = "w-full bg-transparent text-[13px] outline-none";

const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode }> = ({
  label, hint, htmlFor, children,
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px]" style={{ color: T.textFaint }}>{hint}</p>}
  </div>
);

/* ─── FIXED TOGGLE ─── */
const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; disabled?: boolean }> = ({
  checked, onChange, label, disabled,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      background: checked ? T.brand : T.surfaceHi,
      boxShadow: `inset 0 0 0 1px ${checked ? T.brandBorder : T.borderSoft}`,
    }}
  >
    <span
      className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out will-change-transform"
      style={{
        transform: checked ? "translateX(16px)" : "translateX(0)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
      }}
    />
  </button>
);

const Toast: React.FC<{ type: "success" | "error"; msg: string; onClose: () => void }> = ({ type, msg, onClose }) => (
  <div
    className="fixed bottom-5 right-5 z-70 rounded-lg px-4 py-2.5 text-[12px] font-medium flex items-center gap-2"
    style={{
      background: T.surface,
      color: type === "success" ? T.success : T.danger,
      boxShadow: `inset 0 0 0 1px ${type === "success" ? T.successBorder : T.dangerBorder}, 0 20px 40px -20px rgba(0,0,0,0.7)`,
    }}
  >
    {type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
      <X size={11} />
    </button>
  </div>
);

/* ─────────────── page ─────────────── */

type SectionKey = "profile" | "password" | "security";

const AdminSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("password");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [displayName, setDisplayName] = useState("Admin User");
  const [savedName, setSavedName] = useState("Admin User");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [savingTfa, setSavingTfa] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: T.surfaceHi };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { score, label: "Weak",   color: T.danger };
    if (score <= 3) return { score, label: "Fair",   color: T.warn };
    if (score <= 4) return { score, label: "Good",   color: T.info };
    return { score, label: "Strong", color: T.success };
  }, [newPassword]);

  const canSavePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !savingPassword;

  const handleSaveName = async () => {
    if (displayName.trim() === savedName) return;
    if (displayName.trim().length < 2) {
      showToast("error", "Display name must be at least 2 characters.");
      return;
    }
    setSavingName(true);
    await new Promise((r) => setTimeout(r, 500));
    setSavedName(displayName.trim());
    setSavingName(false);
    showToast("success", "Display name updated.");
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) return setPasswordError("Enter your current password.");
    if (newPassword.length < 8) return setPasswordError("New password must be at least 8 characters.");
    if (newPassword === currentPassword) return setPasswordError("New password must be different from current.");
    if (newPassword !== confirmPassword) return setPasswordError("Passwords don't match.");

    setSavingPassword(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password updated successfully.");
    } catch (e: any) {
      setPasswordError(e?.message ?? "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTfa = async () => {
    setSavingTfa(true);
    await new Promise((r) => setTimeout(r, 500));
    const next = !twoFactorAuth;
    setTwoFactorAuth(next);
    setSavingTfa(false);
    showToast("success", next ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
  };

  const sections: { id: SectionKey; label: string; hint: string; icon: React.ElementType }[] = [
    { id: "password", label: "Change password", hint: "Update your sign-in password", icon: Lock },
    { id: "profile",  label: "Profile",         hint: "Your name and email",          icon: UserIcon },
    { id: "security", label: "Security",        hint: "Two-factor authentication",     icon: Shield },
  ];

  const activeMeta = sections.find((s) => s.id === activeSection)!;

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .as-main::-webkit-scrollbar { width: 8px; }
        .as-main::-webkit-scrollbar-track { background: transparent; }
        .as-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        .as-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }

        select option { background: ${T.surface2}; color: ${T.text}; }
        .as-rail::-webkit-scrollbar { height: 4px; }
        .as-rail::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="as-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 900 }}>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
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
                    style={{ background: T.brandSoft, color: T.brand, boxShadow: `inset 0 0 0 1px ${T.brandBorder}` }}
                  >
                    <Sparkles size={10} /> Account
                  </span>
                  <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    · {sections.length} sections
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                  Settings
                </h1>
                <p className="mt-1 text-[13.5px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage your account and security preferences.
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 md:gap-5">
            <nav className="as-rail flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="group shrink-0 lg:shrink flex items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors lg:w-full"
                    style={{
                      background: isActive ? T.brandSoft : T.surface,
                      boxShadow: isActive
                        ? `inset 0 0 0 1px ${T.brandBorder}`
                        : `inset 0 0 0 1px ${T.borderSoft}`,
                    }}
                  >
                    <Icon size={12} className="shrink-0" style={{ color: isActive ? T.brand : T.textMuted }} />
                    <span
                      className="text-[12px] font-medium whitespace-nowrap"
                      style={{ color: isActive ? T.text : T.textMuted }}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <Card className="p-5 md:p-6 float-in">
              <div className="flex items-start gap-3 mb-5 pb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div
                  className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ background: T.brandSoft, color: T.brand }}
                >
                  <activeMeta.icon size={14} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold truncate" style={{ color: T.text }}>
                    {activeMeta.label}
                  </h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>{activeMeta.hint}</p>
                </div>
              </div>

              {activeSection === "password" && (
                <div className="space-y-4">
                  {passwordError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
                      style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
                    >
                      <AlertTriangle size={13} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
                      <p className="text-[12px]" style={{ color: T.danger }}>{passwordError}</p>
                    </div>
                  )}

                  <Field label="Current password" htmlFor="currentPassword">
                    <InputShell icon={Lock}>
                      <input
                        id="currentPassword"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className={textInputCls}
                        style={{ color: T.text }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                        className="shrink-0 transition-opacity hover:opacity-80"
                        style={{ color: T.textFaint }}
                      >
                        {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </InputShell>
                  </Field>

                  <Field label="New password" htmlFor="newPassword" hint="Use at least 8 characters.">
                    <InputShell icon={Key}>
                      <input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={textInputCls}
                        style={{ color: T.text }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? "Hide password" : "Show password"}
                        className="shrink-0 transition-opacity hover:opacity-80"
                        style={{ color: T.textFaint }}
                      >
                        {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </InputShell>
                  </Field>

                  {newPassword && (
                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              background: i <= passwordStrength.score ? passwordStrength.color : T.surfaceHi,
                            }}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10.5px]" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  <Field label="Confirm new password" htmlFor="confirmPassword">
                    <InputShell icon={Key}>
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className={textInputCls}
                        style={{ color: T.text }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        className="shrink-0 transition-opacity hover:opacity-80"
                        style={{ color: T.textFaint }}
                      >
                        {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </InputShell>
                  </Field>

                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] inline-flex items-center gap-1" style={{ color: T.danger }}>
                      <AlertTriangle size={11} /> Passwords don't match.
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={!canSavePassword}
                      className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                      style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
                    >
                      {savingPassword ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {savingPassword ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "profile" && (
                <div className="space-y-4">
                  <Field label="Display name" htmlFor="displayName" hint="This is how your name appears across the platform.">
                    <InputShell icon={UserIcon}>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name"
                        className={textInputCls}
                        style={{ color: T.text }}
                        maxLength={60}
                      />
                    </InputShell>
                  </Field>

                  <Field label="Email address" htmlFor="email" hint="To change your email, contact support.">
                    <InputShell icon={Mail} disabled>
                      <input
                        id="email"
                        type="email"
                        value="admin@mailforge.io"
                        readOnly
                        className={`${textInputCls} cursor-not-allowed`}
                        style={{ color: T.textMuted }}
                      />
                    </InputShell>
                  </Field>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveName}
                      disabled={savingName || displayName.trim() === savedName || displayName.trim().length < 2}
                      className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                      style={{ background: T.brand, boxShadow: "0 6px 18px -8px rgba(99,102,241,0.65)" }}
                    >
                      {savingName ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {savingName ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-4">
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-4"
                    style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.borderSoft}` }}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                        style={{ background: T.brandSoft, color: T.brand }}
                      >
                        <ShieldCheck size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: T.text }}>
                          Two-factor authentication
                        </p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: T.textMuted }}>
                          {twoFactorAuth
                            ? "Enabled — your account is protected with a second factor."
                            : "Add an extra layer of security to your account."}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={twoFactorAuth}
                      onChange={handleToggleTfa}
                      disabled={savingTfa}
                      label="Toggle two-factor authentication"
                    />
                  </div>

                  <div
                    className="rounded-lg p-3.5 flex items-start gap-2.5"
                    style={{ background: T.infoSoft, boxShadow: `inset 0 0 0 1px ${T.infoBorder}` }}
                  >
                    <Shield size={13} style={{ color: T.info }} className="shrink-0 mt-0.5" />
                    <p className="text-[11.5px] leading-relaxed" style={{ color: T.info }}>
                      When two-factor authentication is enabled, you'll be asked for a one-time code from
                      your authenticator app whenever you sign in on a new device.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          type={toast.type}
          msg={toast.msg}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminSettings;