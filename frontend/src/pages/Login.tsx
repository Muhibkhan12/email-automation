import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Flame,
  Check, AlertTriangle, Info, ShieldCheck, Sparkles, AlertCircle,
} from "lucide-react";

import { AuthContext } from "../contexts/AuthContext";
import type { UserLogin } from "../types/UserTypes";

/* ─────────────── design tokens ─────────────── */

const T = {
  bg:          "#0A0B10",
  panel:       "#0D0F15",
  panelTop:    "#101219",
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
  violet:      "#8B5CF6",
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
}

const FONT = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
}

const RING = `inset 0 0 0 1px ${T.border}`

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
      style={{ background: T.bg, color: T.text, fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

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

        @media (prefers-reduced-motion: reduce) {
          .packet, .packet-2, .packet-3, .shake { animation: none !important; }
        }
      `}</style>

      {/* ── Brand panel ─────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-10 xl:p-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${T.panelTop} 0%, ${T.panel} 100%)`,
          borderRight: `1px solid ${T.borderSoft}`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(700px 260px at 20% 0%, rgba(99,102,241,0.14), transparent 65%)," +
              "radial-gradient(500px 220px at 90% 100%, rgba(139,92,246,0.08), transparent 65%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${T.brand}, ${T.violet})`,
              boxShadow: "0 4px 12px -4px rgba(99,102,241,0.6)",
            }}
          >
            <Flame className="w-4 h-4 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: T.text }}>
            Outwerk Solutions
          </span>
        </div>

        {/* Middle */}
        <div className="relative space-y-8">
          <div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium mb-4"
              style={{
                background: T.brandSoft,
                color: T.brand,
                boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
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

          {/* Pipeline card */}
          <div
            className="rounded-xl p-4"
            style={{ background: T.surface, boxShadow: RING, maxWidth: 400 }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
              <span className="text-[10.5px]" style={{ color: T.textMuted, fontFamily: FONT.mono }}>
                mailforge · live pipeline
              </span>
            </div>

            <div className="relative h-0.5 rounded-full mb-4" style={{ background: T.borderSoft }}>
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${T.brand}, ${T.violet})`, opacity: 0.4 }}
              />
              <span className="packet absolute -top-1.25 w-3 h-3 rounded-full" style={{ background: T.brand }} />
              <span className="packet packet-2 absolute -top-1.25 w-3 h-3 rounded-full" style={{ background: T.brand }} />
              <span className="packet packet-3 absolute -top-1.25 w-3 h-3 rounded-full" style={{ background: T.violet }} />
            </div>

            <div className="flex items-center justify-between">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === 2 ? T.success : T.brand }}
                  />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] mt-4 pt-3" style={{ color: T.textMuted, fontFamily: FONT.mono, borderTop: `1px solid ${T.borderSoft}` }}>
              <span style={{ color: T.text }}>{delivered.toLocaleString()}</span> delivered today
            </p>
          </div>
        </div>

        <p className="relative text-[10.5px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
          v2.4 · status: operational
        </p>
      </aside>

      {/* ── Form panel ──────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-5 md:px-8 py-10">
        <div className="w-full max-w-100">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.brand}, ${T.violet})` }}
            >
              <Flame className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: T.text }}>
              Outwerk Solutions
            </span>
          </div>

          {/* Card */}
          <div className="rounded-xl p-5 md:p-6" style={{ background: T.surface, boxShadow: RING }}>
            {/* Header */}
            <div className="mb-5">
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium mb-3"
                style={{
                  background: T.brandSoft,
                  color: T.brand,
                  boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
                }}
              >
                <ShieldCheck size={10} /> Secure sign in
              </div>
              <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight" style={{ color: T.text }}>
                Sign in
              </h2>
              <p className="mt-1 text-[12.5px]" style={{ color: T.textMuted }}>
                Welcome back — pick up where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Email */}
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
                    aria-describedby={errors.email ? "email-error" : undefined}
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

              {/* Password */}
              <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <InputShell icon={Lock} invalid={!!errors.password}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    name="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
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
                    aria-pressed={showPassword}
                    className="shrink-0 transition-colors hover:text-white"
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

              {/* Remember + forgot */}
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
                      style={{ background: T.surface2, boxShadow: `inset 0 0 0 1px ${T.border}` }}
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
                        box-shadow: inset 0 0 0 1px ${T.brandBorder} !important;
                      }
                    `}</style>
                  </span>
                  <span className="text-[12px]" style={{ color: T.textMuted }}>Remember me</span>
                </label>

                <a
                  href="#"
                  className="text-[12px] font-medium transition-colors hover:brightness-110"
                  style={{ color: T.brand }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Server error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md px-3 py-2.5 shake"
                  style={{ background: T.dangerSoft, boxShadow: `inset 0 0 0 1px ${T.dangerBorder}` }}
                >
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: T.danger }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: T.danger }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-md py-2.5 text-[12.5px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
                style={{
                  background: T.brand,
                  boxShadow: "0 6px 18px -8px rgba(99,102,241,0.7)",
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
      <p
        id={`${htmlFor}-error`}
        role="alert"
        className="flex items-center gap-1 text-[11px] mt-1.5"
        style={{ color: T.danger }}
      >
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
    ? `inset 0 0 0 1px ${T.dangerBorder}`
    : valid
    ? `inset 0 0 0 1px ${T.successBorder}`
    : `inset 0 0 0 1px ${T.borderSoft}`;

  const focus = invalid
    ? `inset 0 0 0 1px ${T.danger}, 0 0 0 3px ${T.dangerSoft}`
    : `inset 0 0 0 1px ${T.brand}, 0 0 0 3px ${T.brandSoft}`;

  return (
    <div
      className="flex items-center gap-2 rounded-md px-2.5 py-2 transition-shadow"
      style={{ background: T.surface2, boxShadow: base }}
      onFocusCapture={(e) => (e.currentTarget.style.boxShadow = focus)}
      onBlurCapture={(e) => (e.currentTarget.style.boxShadow = base)}
    >
      <Icon size={13} className="shrink-0" style={{ color: invalid ? T.danger : T.textFaint }} />
      {children}
    </div>
  );
};

export default Login;