import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Flame,
  Check, AlertTriangle, Info, ShieldCheck, Sparkles, AlertCircle,
} from "lucide-react";

import { AuthContext } from "../contexts/AuthContext";
import type { UserLogin } from "../types/UserTypes";

/* ─────────────── design tokens (indigo + mint theme) ─────────────── */

const T = {
  bg:          "#0B0C0E",
  panel:       "#0E0F11",
  panelTop:    "#111214",
  surface:     "#111214",
  surface2:    "#16181B",
  surfaceHi:   "#1C1F23",
  border:      "#24282E",
  borderSoft:  "#1B1E22",
  text:        "#E8EAED",
  textMuted:   "#9AA0A6",
  textFaint:   "#6B7075",

  brand:       "#6366F1",
  brandSoft:   "rgba(99,102,241,0.12)",
  brandBorder: "rgba(99,102,241,0.35)",
  brandInk:    "#ffffff",

  accent:      "#6EE7A8",
  accentInk:   "#0B0C0E",
  accentLine:  "#2E6B4D",

  violet:      "#8B5CF6",

  success:     "#6EE7A8",
  successSoft: "rgba(110,231,168,0.10)",
  successBorder:"rgba(110,231,168,0.28)",

  warn:        "#E0A64A",
  warnSoft:    "rgba(224,166,74,0.10)",
  warnBorder:  "rgba(224,166,74,0.28)",

  danger:      "#E06A6A",
  dangerSoft:  "rgba(224,106,106,0.10)",
  dangerBorder:"rgba(224,106,106,0.28)",

  info:        "#6EC1E7",
};

const FONT = {
  ui:   "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

const STAGES = ["Queued", "Sending", "Delivered"] as const;

type Inputs = UserLogin;

/* ─────────────── page ─────────────── */

const Login = () => {
  const navigate = useNavigate();

  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Login must be used inside AuthProvider");
  }
  const { login } = context;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(1842);
  const [capsOn, setCapsOn] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setDelivered((d) => d + Math.floor(Math.random() * 3));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const onCapsCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const onSubmit = async (data: Inputs) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(data);
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Invalid email or password.";
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: T.bg, color: T.text, fontFamily: FONT.ui }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes travel {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .packet { animation: travel 3.6s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
        .packet-2 { animation-delay: 1.2s; }
        .packet-3 { animation-delay: 2.4s; }

        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(1px); }
          30%, 50%, 70% { transform: translateX(-2px); }
          40%, 60% { transform: translateX(2px); }
        }
        .shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }

        :focus-visible { outline: 2px solid ${T.accentLine}; outline-offset: 2px; border-radius: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .packet, .packet-2, .packet-3, .shake { animation: none !important; }
        }
      `}</style>

      {/* ── Brand panel (LEFT side) ─────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-10 xl:p-12 relative overflow-hidden order-1"
        style={{
          background: `linear-gradient(160deg, ${T.panelTop} 0%, ${T.panel} 100%)`,
          borderRight: HAIRLINE_SOFT,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(700px 260px at 20% 0%, rgba(99,102,241,0.14), transparent 65%)," +
              "radial-gradient(500px 220px at 90% 100%, rgba(110,231,168,0.06), transparent 65%)",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${T.brand}, ${T.violet})`,
              boxShadow: "0 4px 14px -4px rgba(99,102,241,0.6)",
            }}
          >
            <Flame className="w-4 h-4 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>
            Outwerk Solutions
          </span>
        </div>

        <div className="relative space-y-8">
          <div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium mb-4"
              style={{
                background: T.brandSoft,
                color: T.brand,
                border: `1px solid ${T.brandBorder}`,
              }}
            >
              <Sparkles size={10} /> Welcome back
            </span>

            <h1 className="text-[26px] xl:text-[30px] font-semibold leading-[1.2] max-w-sm" style={{ color: T.text }}>
              Every campaign, tracked from queue to inbox.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed max-w-sm" style={{ color: T.textMuted }}>
              Sign back in to pick up where you left off — queues, sends, and delivery, all in one view.
            </p>
          </div>

          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: T.surface,
              border: HAIRLINE,
              maxWidth: 420,
              boxShadow: "0 12px 32px -16px rgba(0,0,0,0.6)",
            }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: T.brand, opacity: 0.6 }}
            />
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
              <span className="text-[10.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                mailforge · live pipeline
              </span>
            </div>

            <div className="relative h-[2px] rounded-full mb-4" style={{ background: T.borderSoft }}>
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${T.brand}, ${T.violet})`, opacity: 0.4 }}
              />
              <span className="packet absolute -top-[5px] w-3 h-3 rounded-full" style={{ background: T.brand }} />
              <span className="packet packet-2 absolute -top-[5px] w-3 h-3 rounded-full" style={{ background: T.brand }} />
              <span className="packet packet-3 absolute -top-[5px] w-3 h-3 rounded-full" style={{ background: T.violet }} />
            </div>

            <div className="flex items-center justify-between">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === 2 ? T.accent : T.brand }}
                  />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] mt-4 pt-3" style={{ color: T.textMuted, fontFamily: FONT.mono, borderTop: HAIRLINE_SOFT }}>
              <span style={{ color: T.text }}>{delivered.toLocaleString()}</span> delivered today
            </p>
          </div>
        </div>

        <p className="relative text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
          v2.4 · status: operational
        </p>
      </aside>

      {/* ── Form panel (RIGHT side) ──────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-5 md:px-8 py-10 order-2 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 30%, rgba(99,102,241,0.06), transparent 60%)",
          }}
        />

        <div className="w-full max-w-[420px] relative">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.brand}, ${T.violet})` }}
            >
              <Flame className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: T.text }}>
              Outwerk Solutions
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6 md:p-7 relative overflow-hidden"
            style={{
              background: T.surface,
              border: HAIRLINE,
              boxShadow: "0 16px 48px -24px rgba(0,0,0,0.7)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${T.brand}, transparent)`, opacity: 0.5 }}
            />

            <div className="mb-6">
              <div
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium mb-3"
                style={{
                  background: T.brandSoft,
                  color: T.brand,
                  border: `1px solid ${T.brandBorder}`,
                }}
              >
                <ShieldCheck size={10} /> Secure sign in
              </div>
              <h2 className="text-[22px] md:text-[24px] font-semibold tracking-tight" style={{ color: T.text }}>
                Sign in
              </h2>
              <p className="mt-1 text-[12.5px]" style={{ color: T.textMuted }}>
                Welcome back — pick up where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <InputShell icon={Mail} invalid={!!errors.email}>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    name="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    {...register("email", {
                      required: "Enter your email to continue.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address.",
                      },
                    })}
                    className="w-full bg-transparent text-[13px] outline-none"
                    style={{ color: T.text }}
                  />
                </InputShell>
              </Field>

              <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <InputShell icon={Lock} invalid={!!errors.password}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    name="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    onKeyUp={onCapsCheck}
                    onKeyDown={onCapsCheck}
                    {...register("password", {
                      required: "Enter your password to continue.",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters.",
                      },
                    })}
                    className="w-full bg-transparent text-[13px] outline-none"
                    style={{ color: T.text }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="shrink-0"
                    style={{ color: T.textFaint }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </InputShell>

                {capsOn && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.warn }}>
                    <Info size={11} /> Caps Lock is On
                  </p>
                )}
              </Field>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <span className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded flex items-center justify-center transition-all"
                      style={{ background: T.surface2, border: HAIRLINE }}
                    >
                      <Check
                        size={10}
                        strokeWidth={3}
                        className="opacity-0 peer-checked:opacity-100 transition-opacity"
                        style={{ color: "#fff" }}
                      />
                    </span>
                    <style>{`
                      .peer:checked + span {
                        background: ${T.brand} !important;
                        border-color: ${T.brandBorder} !important;
                      }
                    `}</style>
                  </span>
                  <span className="text-[12px]" style={{ color: T.textMuted }}>Remember me</span>
                </label>

                <a
                  href="#"
                  className="text-[12px] font-medium transition-colors"
                  style={{ color: T.brand }}
                >
                  Forgot password?
                </a>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5 shake"
                  style={{ background: T.dangerSoft, border: `1px solid ${T.dangerBorder}` }}
                >
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: T.danger }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: T.danger }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-110 disabled:opacity-60"
                style={{
                  background: T.accent,
                  color: T.accentInk,
                  boxShadow: "0 8px 24px -8px rgba(110,231,168,0.45)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[12px] mt-5 text-center" style={{ color: T.textMuted }}>
            New here?{" "}
            <a href="/register" className="hover:underline underline-offset-2 font-medium" style={{ color: T.brand }}>
              Create an account
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

/* ─────────────── field ─────────────── */

const Field: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label htmlFor={htmlFor} className="block text-[11.5px] font-medium" style={{ color: T.textMuted }}>
        {label}
      </label>
      {hint && !error && <span className="text-[10.5px]" style={{ color: T.textFaint }}>{hint}</span>}
    </div>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: T.danger }}>
        <AlertCircle size={10} />
        {error}
      </p>
    )}
  </div>
);

/* ─────────────── input shell ─────────────── */

const InputShell: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  invalid?: boolean;
  valid?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, invalid, valid, children }) => {
  const base = invalid
    ? `1px solid ${T.dangerBorder}`
    : valid
    ? `1px solid ${T.successBorder}`
    : `1px solid ${T.borderSoft}`;

  const focus = invalid
    ? `1px solid ${T.danger}, 0 0 0 3px ${T.dangerSoft}`
    : `1px solid ${T.brand}, 0 0 0 3px ${T.brandSoft}`;

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors duration-[120ms]"
      style={{ background: T.surface2, border: base }}
      onFocusCapture={(e) => (e.currentTarget.style.border = focus)}
      onBlurCapture={(e) => (e.currentTarget.style.border = base)}
    >
      <Icon size={13} className="shrink-0" style={{ color: invalid ? T.danger : T.textFaint }} />
      {children}
    </div>
  );
};

export default Login;