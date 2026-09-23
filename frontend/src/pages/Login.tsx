import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Flame,
  Check, AlertTriangle, Info, ShieldCheck, Sparkles, AlertCircle, CheckCircle2,
} from "lucide-react";

import { AuthContext } from "../contexts/AuthContext";
import type { UserLogin } from "../types/UserTypes";

const STAGES = ["Queued", "Sending", "Delivered"] as const;

type Inputs = UserLogin;

const Login = () => {
  const navigate = useNavigate();

  /* ── Auth context ─────────────────────────────────────── */
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Login must be used inside AuthProvider");
  }
  const { login } = context;

  /* ── Form ─────────────────────────────────────────────── */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  /* ── Local state ──────────────────────────────────────── */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(1842);
  const [capsOn, setCapsOn] = useState(false);
  const [remember, setRemember] = useState(true);

  /* ── Live ticker (decorative) ─────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setDelivered((d) => d + Math.floor(Math.random() * 3));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  /* ── Caps Lock hint ───────────────────────────────────── */
  const onCapsCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  /* ── Submit ───────────────────────────────────────────── */
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
      style={{ background: "#0B0E13", color: "#F2F0EB", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono-ui { font-family: 'JetBrains Mono', monospace; }

        @keyframes travel {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .packet { animation: travel 3.6s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
        .packet-2 { animation-delay: 1.2s; }
        .packet-3 { animation-delay: 2.4s; }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.96); }
        }
        .flame-icon { animation: flicker 2.4s ease-in-out infinite; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }

        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(1px); }
          30%, 50%, 70% { transform: translateX(-2px); }
          40%, 60% { transform: translateX(2px); }
        }
        .shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }

        @media (prefers-reduced-motion: reduce) {
          .packet, .packet-2, .packet-3, .flame-icon, .float-in, .shake { animation: none !important; }
        }
      `}</style>

      {/* ── Brand panel ─────────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #10141D 0%, #0B0E13 100%)",
          borderRight: "1px solid #1A1F2B",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(700px 260px at 20% 0%, rgba(255,106,57,0.12), transparent 60%)," +
              "radial-gradient(500px 220px at 90% 100%, rgba(52,211,153,0.06), transparent 60%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FF6A39, #FFC24B)",
              boxShadow: "0 8px 20px -8px rgba(255,106,57,0.6)",
            }}
          >
            <Flame className="flame-icon w-4 h-4 text-[#0B0E13]" strokeWidth={2.4} />
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight text-[#F2F0EB]">
            Outwerk Solutions
          </span>
        </div>

        {/* Middle */}
        <div className="relative space-y-10">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium mb-5"
              style={{
                background: "rgba(255,106,57,0.10)",
                color: "#FF6A39",
                boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)",
              }}
            >
              <Sparkles size={11} /> Welcome back
            </span>

            <h1 className="font-display text-[30px] xl:text-[34px] font-semibold leading-[1.15] text-[#F2F0EB] max-w-sm">
              Every campaign, tracked from queue to inbox.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[#8A90A0] max-w-sm">
              Sign back in to pick up where you left off — queues, sends, and delivery, all in one view.
            </p>
          </div>

          {/* Pipeline card */}
          <div
            className="rounded-3xl p-5 soft-ring"
            style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)", maxWidth: 420 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
              <span className="font-mono-ui text-[11px] text-[#7A8092]">mailforge · live pipeline</span>
            </div>

            <div className="relative h-[3px] rounded-full mb-5" style={{ background: "#1A1F2B" }}>
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(90deg, #FF6A39, #FFC24B)", opacity: 0.35 }}
              />
              <span className="packet absolute -top-[5.5px] w-3.5 h-3.5 rounded-full bg-[#FF6A39] shadow-[0_0_12px_2px_rgba(255,106,57,0.55)]" />
              <span className="packet packet-2 absolute -top-[5.5px] w-3.5 h-3.5 rounded-full bg-[#FF6A39] shadow-[0_0_12px_2px_rgba(255,106,57,0.55)]" />
              <span className="packet packet-3 absolute -top-[5.5px] w-3.5 h-3.5 rounded-full bg-[#FFC24B] shadow-[0_0_12px_2px_rgba(255,194,75,0.55)]" />
            </div>

            <div className="flex items-center justify-between">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: i === 2 ? "#34D399" : "#FF6A39",
                      boxShadow: `0 0 6px ${i === 2 ? "#34D399" : "#FF6A39"}`,
                    }}
                  />
                  <span className="font-mono-ui text-[10.5px] uppercase tracking-wider text-[#7A8092]">
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <p className="font-mono-ui text-[11.5px] text-[#8A90A0] mt-5 pt-4 border-t border-[#1A1F2B]">
              <span style={{ color: "#F2F0EB" }}>{delivered.toLocaleString()}</span> delivered today
            </p>
          </div>
        </div>

        <p className="relative font-mono-ui text-[11px] text-[#5A6172]">
          v2.4 · status: operational
        </p>
      </aside>

      {/* ── Form panel ──────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-5 md:px-8 py-10">
        <div className="w-full max-w-[440px] float-in">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF6A39, #FFC24B)" }}
            >
              <Flame className="w-4 h-4 text-[#0B0E13]" strokeWidth={2.4} />
            </div>
            <span className="font-display text-[15px] font-semibold text-[#F2F0EB]">
              Outwerk Solutions
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-6 md:p-7 soft-ring"
            style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
          >
            {/* Header */}
            <div className="mb-6">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium mb-4"
                style={{
                  background: "rgba(255,106,57,0.10)",
                  color: "#FF6A39",
                  boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)",
                }}
              >
                <ShieldCheck size={11} /> Secure sign in
              </div>
              <h2 className="font-display text-[22px] md:text-[24px] font-semibold text-[#F2F0EB] tracking-tight">
                Sign in
              </h2>
              <p className="mt-1.5 text-[13px] text-[#8A90A0]">
                Welcome back — pick up where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
                    className="w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none"
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
                    className="w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="shrink-0 text-[#5A6172] hover:text-[#C7C9CE] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </InputShell>

                {/* Caps lock */}
                {capsOn && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#FBBF24]">
                    <Info size={11} /> Caps Lock is on
                  </p>
                )}
              </Field>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      className="w-4 h-4 rounded-md flex items-center justify-center transition-all"
                      style={{ background: "#141821", boxShadow: "inset 0 0 0 1px #1A1F2B" }}
                    >
                      <Check
                        size={11}
                        strokeWidth={3}
                        className="text-[#0B0E13] opacity-0 peer-checked:opacity-100 transition-opacity"
                      />
                    </span>
                    <style>{`
                      .peer:checked + span { background: #FF6A39 !important; box-shadow: 0 0 0 3px rgba(255,106,57,0.18) !important; }
                    `}</style>
                  </span>
                  <span className="text-[12.5px] text-[#8A90A0]">Remember me</span>
                </label>

                <a
                  href="#"
                  className="text-[12.5px] font-medium transition-colors hover:opacity-80"
                  style={{ color: "#FF6A39" }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Server error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 shake"
                  style={{ background: "rgba(248,113,113,0.08)", boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.22)" }}
                >
                  <AlertTriangle size={15} className="text-[#F87171] shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-[#F87171] leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: "#FF6A39",
                  boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)",
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
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-[12.5px] text-[#7A8092] mt-6 text-center">
            New here?{" "}
            <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2 font-medium">
              Create an account
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

/* ── Field ──────────────────────────────────────────────── */

const Field: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label htmlFor={htmlFor} className="block text-[11.5px] font-medium text-[#C7C9CE]">
        {label}
      </label>
      {hint && !error && <span className="text-[10.5px] text-[#5A6172]">{hint}</span>}
    </div>
    {children}
    {error && (
      <p
        id={`${htmlFor}-error`}
        role="alert"
        className="flex items-center gap-1.5 text-[11.5px] text-[#F87171] mt-1.5"
      >
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

/* ── InputShell ─────────────────────────────────────────── */

const InputShell: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  invalid?: boolean;
  valid?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, invalid, valid, children }) => {
  const base = invalid
    ? "inset 0 0 0 1px rgba(248,113,113,0.55)"
    : valid
    ? "inset 0 0 0 1px rgba(52,211,153,0.45)"
    : "inset 0 0 0 1px #1A1F2B";

  const focus = invalid
    ? "inset 0 0 0 1px rgba(248,113,113,0.65), 0 0 0 4px rgba(248,113,113,0.12)"
    : "inset 0 0 0 1px rgba(255,106,57,0.55), 0 0 0 4px rgba(255,106,57,0.10)";

  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all"
      style={{ background: "#0F131C", boxShadow: base }}
      onFocusCapture={(e) => (e.currentTarget.style.boxShadow = focus)}
      onBlurCapture={(e) => (e.currentTarget.style.boxShadow = base)}
    >
      <Icon size={14} className={`shrink-0 ${invalid ? "text-[#F87171]" : "text-[#6A7080]"}`} />
      {children}
    </div>
  );
};

export default Login;