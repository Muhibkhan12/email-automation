// AdminSettings.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Save, X, Menu, Eye, EyeOff,
  Loader2, AlertTriangle, CheckCircle2,
  Key, Lock, Sparkles,
} from "lucide-react";
import api from "../../libs/Axios";

/* ─────────────── design tokens — aligned with AdminDashboard ─────────────── */

const T = {
  bg:           "#0E0F11",
  surface:      "#151618",
  surface2:     "#1B1C1F",
  surfaceHi:    "#232427",
  border:       "rgba(236,237,239,0.08)",
  borderSoft:   "rgba(236,237,239,0.14)",
  text:         "#ECEDEF",
  textMuted:    "#A1A4AB",
  textFaint:    "#6C7078",
  accent:       "#F0884D",
  accentSoft:   "rgba(240,136,77,0.12)",
  accentBorder: "rgba(240,136,77,0.35)",
  success:      "#5FB07A",
  successSoft:  "rgba(95,176,122,0.12)",
  successBorder:"rgba(95,176,122,0.35)",
  warn:         "#D4A24C",
  warnSoft:     "rgba(212,162,76,0.12)",
  warnBorder:   "rgba(212,162,76,0.35)",
  danger:       "#D8665D",
  dangerSoft:   "rgba(216,102,93,0.12)",
  dangerBorder: "rgba(216,102,93,0.35)",
  info:         "#6EC1E7",
  infoSoft:     "rgba(110,193,231,0.12)",
  infoBorder:   "rgba(110,193,231,0.35)",
  neutral1:     "#C9CBD0",
};

const FONT = {
  body: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

const RING = `inset 0 0 0 1px ${T.border}`;
const RING_SOFT = `inset 0 0 0 1px ${T.borderSoft}`;

/* ─────────────── primitives ─────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl ${className}`} style={{ background: T.surface, boxShadow: RING }}>
    {children}
  </div>
);

const InputShell: React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  disabled?: boolean;
  invalid?: boolean;
}> = ({ icon: Icon, children, disabled, invalid }) => (
  <div
    className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
    style={{
      background: T.surface2,
      boxShadow: invalid
        ? `inset 0 0 0 1px ${T.dangerBorder}`
        : RING_SOFT,
      opacity: disabled ? 0.6 : 1,
    }}
    onFocusCapture={(e) =>
      (e.currentTarget.style.boxShadow = invalid
        ? `inset 0 0 0 1px ${T.dangerBorder}, 0 0 0 3px ${T.dangerSoft}`
        : `inset 0 0 0 1px ${T.accentBorder}, 0 0 0 3px ${T.accentSoft}`)
    }
    onBlurCapture={(e) =>
      (e.currentTarget.style.boxShadow = invalid
        ? `inset 0 0 0 1px ${T.dangerBorder}`
        : RING_SOFT)
    }
  >
    {Icon && <Icon size={13} strokeWidth={1.5} className="shrink-0" />}
    {children}
  </div>
);

const textInputCls = "w-full bg-transparent text-[13px] outline-none";

const Field: React.FC<{
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[11.5px] font-medium mb-1.5" style={{ color: T.textMuted }}>
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px]" style={{ color: T.textFaint }}>{hint}</p>}
  </div>
);

const Toast: React.FC<{ type: "success" | "error"; msg: string; onClose: () => void }> = ({ type, msg, onClose }) => (
  <div
    role="status"
    className="fixed bottom-5 right-5 z-70 rounded-lg px-4 py-2.5 text-[12px] font-medium flex items-center gap-2"
    style={{
      background: T.surface,
      color: type === "success" ? T.success : T.danger,
      boxShadow: `inset 0 0 0 1px ${type === "success" ? T.successBorder : T.dangerBorder}, 0 20px 40px -20px rgba(0,0,0,0.7)`,
    }}
  >
    {type === "success" ? <CheckCircle2 size={13} strokeWidth={1.5} /> : <AlertTriangle size={13} strokeWidth={1.5} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
      <X size={11} />
    </button>
  </div>
);

/* ─────────────── page ─────────────── */

const AdminSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  /* ── Password section ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: T.surfaceHi };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { score, label: "Weak",   color: T.danger };
    if (score === 3) return { score, label: "Fair",   color: T.warn };
    if (score === 4) return { score, label: "Good",   color: T.info };
    return { score, label: "Strong", color: T.success };
  }, [newPassword]);

  const canSavePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !savingPassword;

  /* ── handlers (real backend calls) ── */

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) return setPasswordError("Enter your current password.");
    if (newPassword.length < 8) return setPasswordError("New password must be at least 8 characters.");
    if (newPassword === currentPassword) return setPasswordError("New password must be different from current.");
    if (newPassword !== confirmPassword) return setPasswordError("Passwords don't match.");

    setSavingPassword(true);
    try {
      await api.put("/auth/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password updated successfully.");
    } catch (e: any) {
      setPasswordError(e?.response?.data?.detail ?? e?.message ?? "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ fontFamily: FONT.body, background: T.bg, height: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.22s cubic-bezier(0.2, 0, 0, 1); }

        .as-main::-webkit-scrollbar { width: 8px; }
        .as-main::-webkit-scrollbar-track { background: transparent; }
        .as-main::-webkit-scrollbar-thumb { background: ${T.surfaceHi}; border-radius: 8px; }

        select option { background: ${T.surface2}; color: ${T.text}; }
        .btn-quiet:hover { background: rgba(236,237,239,0.05); color: ${T.text}; }
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
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6" style={{ maxWidth: 1280 }}>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-1 p-2 rounded-lg btn-quiet"
                style={{ background: T.surface, color: T.textMuted, boxShadow: RING }}
                aria-label="Open menu"
              >
                <Menu size={16} strokeWidth={1.5} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: T.accentSoft, color: T.accent, fontFamily: FONT.mono }}
                  >
                    <Sparkles size={10} strokeWidth={1.5} />
                    Account
                  </span>
                </div>
                <h1 className="text-[28px] leading-8 font-medium tracking-tight" style={{ color: T.text }}>
                  Settings
                </h1>
                <p className="mt-2 text-[12px] max-w-lg" style={{ color: T.textMuted }}>
                  Manage your account password.
                </p>
              </div>
            </div>
          </header>

          <Card className="p-5 md:p-6 float-in w-full max-w-xl">
            <div className="flex items-start gap-3 mb-5 pb-4" style={{ borderBottom: RING_SOFT }}>
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: T.accentSoft, color: T.accent }}
              >
                <Lock size={14} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[14px] font-medium truncate" style={{ color: T.text }}>
                  Change password
                </h2>
                <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
                  Update your sign-in password
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {passwordError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
                >
                  <AlertTriangle size={13} strokeWidth={1.5} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
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
                  <p className="mt-1.5 text-[11px] font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}

              <Field label="Confirm new password" htmlFor="confirmPassword">
                <InputShell
                  icon={Key}
                  invalid={!!confirmPassword && newPassword !== confirmPassword}
                >
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
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                  style={{ background: T.accent, color: T.bg }}
                >
                  {savingPassword ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} strokeWidth={1.5} />}
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminSettings;