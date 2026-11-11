import { useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "../User/Sidebar";
import {
  Menu, Check, AlertTriangle, User as UserIcon, KeyRound, Mail,
  Eye, EyeOff, Loader2, ShieldCheck, Circle,
} from "lucide-react";
import UsersContext from "../../contexts/UsersContext";
import { AuthContext } from "../../contexts/AuthContext";
import { changeUserPassword } from "../../services/UserServices";

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
  warn:       "#E0A64A",
  danger:     "#E06A6A",
};

const FONT = { ui: "'Inter', system-ui, -apple-system, sans-serif" };
const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

/* /auth/profile returns user_id + username; other endpoints may return id + name. Handle both. */
type ProfileUser = { id?: number; user_id?: number; username?: string; name?: string; email?: string };

type Notice = { type: "success" | "error"; text: string } | null;

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/* password rules shown live under the "new password" field */
const RULES = [
  { id: "len",   label: "At least 8 characters",       test: (p: string) => p.length >= 8 },
  { id: "case",  label: "Upper and lowercase letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num",   label: "A number",                    test: (p: string) => /\d/.test(p) },
  { id: "sym",   label: "A symbol",                    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
  { label: "Too weak", color: T.danger },
  { label: "Weak",     color: T.danger },
  { label: "Fair",     color: T.warn },
  { label: "Good",     color: T.accent },
  { label: "Strong",   color: T.accent },
];

/* ─────────────── page ─────────────── */

const Profile = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("Profile must be used inside UserProvider");
  const { selectedUser, getUserUsingId, editUser, loading } = ctx;

  const authCtx = useContext(AuthContext);
  const authUser = authCtx?.user as ProfileUser | null | undefined;
  const userId = authUser?.id ?? authUser?.user_id ?? 0;

  const me = selectedUser as ProfileUser | null;
  const currentName = me?.username ?? me?.name ?? "";
  const currentEmail = me?.email ?? authUser?.email ?? "";
  const initialLoading = loading && !selectedUser;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // name form
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameNotice, setNameNotice] = useState<Notice>(null);

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showSaved, setShowSaved] = useState(false); // eye toggle in the info card
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  useEffect(() => {
    if (userId) getUserUsingId(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (selectedUser) setName(currentName);
  }, [selectedUser, currentName]);

  // success messages fade out on their own
  useEffect(() => {
    if (nameNotice?.type !== "success") return;
    const t = setTimeout(() => setNameNotice(null), 3000);
    return () => clearTimeout(t);
  }, [nameNotice]);

  useEffect(() => {
    if (passwordNotice?.type !== "success") return;
    const t = setTimeout(() => setPasswordNotice(null), 4000);
    return () => clearTimeout(t);
  }, [passwordNotice]);

  const storedPassword = (selectedUser as unknown as { password?: string } | null)?.password;

  const nameChanged = !!selectedUser && name.trim() !== currentName;

  const passedRules = useMemo(() => RULES.filter((r) => r.test(newPassword)).length, [newPassword]);
  const strength = newPassword ? STRENGTH[passedRules] : null;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const matches = confirmPassword.length > 0 && confirmPassword === newPassword;

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameNotice({ type: "error", text: "Name can't be empty." });
      return;
    }
    try {
      setSavingName(true);
      setNameNotice(null);
      await editUser(userId, { username: trimmed } as unknown as Parameters<typeof editUser>[1]);
      await getUserUsingId(userId);
      setNameNotice({ type: "success", text: "Name updated." });
    } catch {
      setNameNotice({ type: "error", text: "Couldn't update your name. Try again." });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordNotice(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({ type: "error", text: "Fill in all password fields." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: "error", text: "New passwords don't match." });
      return;
    }

    try {
      setSavingPassword(true);
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowSaved(false);
      getUserUsingId(userId);
      setPasswordNotice({ type: "success", text: "Password changed." });
    } catch {
      setPasswordNotice({
        type: "error",
        text: "Couldn't change your password. Check your current password and try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.ui, background: T.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .prof-main::-webkit-scrollbar { width: 8px; }
        .prof-main::-webkit-scrollbar-track { background: transparent; }
        .prof-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .prof-input {
          background: ${T.surface2}; color: ${T.text}; border: ${HAIRLINE_SOFT};
          transition: border-color 120ms, box-shadow 120ms, background 120ms;
        }
        .prof-input::placeholder { color: ${T.textFaint}; }
        .prof-input:hover:not(:disabled) { border-color: ${T.border}; }
        .prof-input:focus { border-color: ${T.accentLine}; box-shadow: 0 0 0 3px rgba(110,231,168,0.10); outline: none; }
        .prof-input:disabled { opacity: 0.5; }
        .prof-input[aria-invalid="true"] { border-color: rgba(224,106,106,0.5); }
        .prof-input[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px rgba(224,106,106,0.12); }
        .prof-ghost:hover:not(:disabled) { background: ${T.surfaceHi}; color: ${T.text}; }
        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 6px; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(11,12,14,0.72)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="prof-main flex-1 overflow-y-auto" style={{ height: "100vh", width: "100%", background: T.bg }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1040 }}>
          {/* Header */}
          <header className="flex items-start gap-3 mb-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mt-1 p-2 rounded-md"
              style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <div>
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight" style={{ color: T.text }}>
                Profile
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: T.textMuted }}>
                Update your name or change your password.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
            {/* ───── Identity card ───── */}
            <aside
              className="rounded-2xl overflow-hidden lg:sticky lg:top-6"
              style={{ background: T.surface, border: HAIRLINE }}
            >
              <div
                className="h-20"
                style={{
                  background:
                    "radial-gradient(120% 140% at 0% 0%, rgba(110,231,168,0.22), rgba(110,231,168,0) 60%), linear-gradient(180deg, #14171A, #111214)",
                  borderBottom: HAIRLINE_SOFT,
                }}
              />
              <div className="px-5 pb-5 -mt-10">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-[26px] font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${T.accent}, #4BC98E)`,
                    color: T.accentInk,
                    boxShadow: `0 0 0 4px ${T.surface}`,
                  }}
                  aria-hidden
                >
                  {initialLoading ? "" : getInitials(currentName)}
                </div>

                <h2 className="mt-4 text-[18px] font-semibold leading-tight truncate" style={{ color: T.text }}>
                  {initialLoading ? "Loading…" : currentName || "—"}
                </h2>
                <p className="mt-0.5 text-[12.5px] truncate" style={{ color: T.textMuted }}>
                  {initialLoading ? "" : currentEmail}
                </p>

                <dl className="mt-5 pt-4 space-y-3.5" style={{ borderTop: HAIRLINE_SOFT }}>
                  <InfoItem icon={UserIcon} label="Full name" value={currentName} loading={initialLoading} />
                  <InfoItem icon={Mail} label="Email" value={currentEmail} loading={initialLoading} />
                  <InfoItem
                    icon={KeyRound}
                    label="Password"
                    value={storedPassword}
                    secret
                    visible={showSaved}
                    onToggle={storedPassword ? () => setShowSaved((v) => !v) : undefined}
                    loading={initialLoading}
                  />
                </dl>
              </div>
            </aside>

            {/* ───── Forms ───── */}
            <div className="space-y-5 min-w-0">
              {/* Name */}
              <Card
                icon={UserIcon}
                title="Name"
                description="This is how you appear across the app."
                footer={
                  <>
                    <NoticeLine notice={nameNotice} />
                    <div className="flex items-center gap-2 ml-auto">
                      {nameChanged && (
                        <GhostButton onClick={() => { setName(currentName); setNameNotice(null); }}>
                          Reset
                        </GhostButton>
                      )}
                      <PrimaryButton onClick={handleSaveName} disabled={!nameChanged || savingName} busy={savingName}>
                        {savingName ? "Saving" : "Save name"}
                      </PrimaryButton>
                    </div>
                  </>
                }
              >
                <Field label="Full name" htmlFor="prof-name">
                  <input
                    id="prof-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && nameChanged && !savingName) handleSaveName(); }}
                    disabled={initialLoading}
                    className="prof-input w-full rounded-lg px-3.5 py-2.5 text-[13.5px]"
                  />
                </Field>
              </Card>

              {/* Password */}
              <Card
                icon={KeyRound}
                title="Password"
                description="Use a strong password you don't use anywhere else."
                footer={
                  <>
                    <NoticeLine notice={passwordNotice} />
                    <div className="ml-auto">
                      <PrimaryButton onClick={handleChangePassword} disabled={savingPassword} busy={savingPassword}>
                        {savingPassword ? "Changing" : "Change password"}
                      </PrimaryButton>
                    </div>
                  </>
                }
              >
                <div className="space-y-5">
                  <Field label="Current password" htmlFor="prof-current">
                    <PasswordInput
                      id="prof-current"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      visible={showCurrent}
                      onToggle={() => setShowCurrent((v) => !v)}
                    />
                  </Field>

                  <div className="h-px" style={{ background: T.borderSoft }} />

                  <Field label="New password" htmlFor="prof-new">
                    <PasswordInput
                      id="prof-new"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={setNewPassword}
                      visible={showNew}
                      onToggle={() => setShowNew((v) => !v)}
                      placeholder="At least 8 characters"
                    />

                    {newPassword && strength && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className="h-1 flex-1 rounded-full transition-colors duration-200"
                              style={{ background: i <= passedRules ? strength.color : T.border }}
                            />
                          ))}
                          <span className="ml-2 text-[11.5px] font-medium w-14 text-right" style={{ color: strength.color }}>
                            {strength.label}
                          </span>
                        </div>
                        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          {RULES.map((r) => {
                            const ok = r.test(newPassword);
                            return (
                              <li
                                key={r.id}
                                className="flex items-center gap-1.5 text-[11.5px] transition-colors"
                                style={{ color: ok ? T.accent : T.textFaint }}
                              >
                                {ok ? <Check size={11} strokeWidth={3} /> : <Circle size={9} />}
                                {r.label}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </Field>

                  <Field label="Confirm new password" htmlFor="prof-confirm">
                    <PasswordInput
                      id="prof-confirm"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      visible={showNew}
                      onToggle={() => setShowNew((v) => !v)}
                      invalid={mismatch}
                    />
                    {mismatch && (
                      <p className="mt-1.5 text-[11.5px]" style={{ color: T.danger }}>Passwords don't match yet.</p>
                    )}
                    {matches && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11.5px]" style={{ color: T.accent }}>
                        <ShieldCheck size={11} /> Passwords match.
                      </p>
                    )}
                  </Field>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────── components ─────────────── */

const Card = ({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => (
  <section className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
    <div className="flex items-start gap-3 px-6 pt-5 pb-4">
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(110,231,168,0.10)", color: T.accent }}
      >
        <Icon size={15} />
      </div>
      <div>
        <h2 className="text-[14px] font-semibold leading-tight" style={{ color: T.text }}>{title}</h2>
        <p className="mt-0.5 text-[12px]" style={{ color: T.textMuted }}>{description}</p>
      </div>
    </div>

    <div className="px-6 pb-6">{children}</div>

    <div
      className="flex flex-wrap items-center gap-3 px-6 py-3.5 min-h-14.5"
      style={{ borderTop: HAIRLINE_SOFT, background: "rgba(255,255,255,0.015)" }}
    >
      {footer}
    </div>
  </section>
);

const InfoItem = ({
  icon: Icon,
  label,
  value,
  loading,
  secret,
  visible,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  loading?: boolean;
  secret?: boolean;
  visible?: boolean;
  onToggle?: () => void;
}) => {
  const hidden = secret && !visible;
  const text = loading ? "Loading…" : hidden ? "••••••••••" : value || "—";
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: T.surface2, color: T.textMuted }}
      >
        <Icon size={12} />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px]" style={{ color: T.textFaint }}>{label}</dt>
        <dd
          className="text-[13px] font-medium truncate"
          style={{ color: T.text, letterSpacing: hidden ? "0.08em" : undefined }}
        >
          {text}
        </dd>
      </div>
      {secret && onToggle && !loading && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="prof-ghost shrink-0 p-1.5 rounded-md transition-colors"
          style={{ color: T.textFaint }}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
};

const Field = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-[12.5px] font-medium mb-2" style={{ color: T.textMuted }}>
      {label}
    </label>
    {children}
  </div>
);

const PasswordInput = ({
  id,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
}) => (
  <div className="relative">
    <input
      id={id}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      placeholder={placeholder}
      aria-invalid={invalid ? "true" : undefined}
      onChange={(e) => onChange(e.target.value)}
      className="prof-input w-full rounded-lg pl-3.5 pr-11 py-2.5 text-[13.5px]"
    />
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="prof-ghost absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors"
      style={{ color: T.textFaint }}
    >
      {visible ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  </div>
);

const PrimaryButton = ({
  children,
  onClick,
  disabled,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
    style={{ background: T.accent, color: T.accentInk }}
  >
    {busy && <Loader2 size={13} className="animate-spin" />}
    {children}
  </button>
);

const GhostButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="prof-ghost rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors"
    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}
  >
    {children}
  </button>
);

const NoticeLine = ({ notice }: { notice: Notice }) => {
  if (!notice) return null;
  const ok = notice.type === "success";
  const color = ok ? T.accent : T.danger;
  const Icon = ok ? Check : AlertTriangle;
  return (
    <p role="status" className="flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color }}>
      <Icon size={13} />
      {notice.text}
    </p>
  );
};

export default Profile;