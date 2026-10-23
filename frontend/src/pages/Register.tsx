import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import {
  Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Loader2,
  Flame, Check, AlertTriangle, CheckCircle2, Sparkles, ShieldCheck,
  AlertCircle, Info,
} from "lucide-react";
import { UserRegister } from "../services/AuthServices";

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

const PASSWORD_RULES = [
  { label: "8+ characters",      test: (v: string) => v.length >= 8 },
  { label: "1 number",           test: (v: string) => /\d/.test(v) },
  { label: "1 uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
];

/* ─────────────── zod schema ─────────────── */

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required."),
    email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/\d/, "Password must include at least one number.")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    agreed: z.literal(true, {
      errorMap: () => ({ message: "Accept the terms to create your account." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterUser { username: string; email: string; password: string; }
interface RegisterResponse { message?: string; [key: string]: unknown; }

const STRENGTH_TIERS = [
  { label: "Weak",   color: T.danger,  },
  { label: "Fair",   color: T.warn,    },
  { label: "Good",   color: T.brand,   },
  { label: "Strong", color: T.success, },
] as const;

/* ─────────────── page ─────────────── */

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "", email: "", password: "", confirmPassword: "",
      agreed: false as unknown as true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(1842);
  const [capsOn, setCapsOn] = useState(false);

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  const passedRules = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strengthIndex = Math.max(0, passedRules - 1);
  const strength = STRENGTH_TIERS[Math.min(strengthIndex, 3)];
  const strengthPct = (passedRules / PASSWORD_RULES.length) * 100;

  const confirmMatches = confirmPassword.length > 0 && confirmPassword === password;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  useEffect(() => {
    const id = setInterval(() => {
      setDelivered((d) => d + Math.floor(Math.random() * 3));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const onCapsCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };
  const navigate = useNavigate();

  const onSubmit = async (values: RegisterFormValues) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const payload: RegisterUser = {
        username: values.name,
        email: values.email,
        password: values.password,
      };
      const res = (await UserRegister(payload)) as RegisterResponse;
      console.log("Register response:", res);
      setSuccessMessage(res?.message ?? "Account created successfully.");
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message || err?.message || "Something went wrong. Try again.";
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
              <Sparkles size={10} /> Set up in under a minute
            </span>

            <h1 className="text-[26px] xl:text-[30px] font-semibold leading-[1.2] max-w-sm" style={{ color: T.text }}>
              Set up your workspace and start shipping campaigns.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed max-w-sm" style={{ color: T.textMuted }}>
              Bring every campaign, recipient, and sender under one roof — with a pipeline you can actually watch.
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ background: T.surface, boxShadow: RING, maxWidth: 400 }}>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
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
        <div className="w-full max-w-[420px]">
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

          <div className="rounded-xl p-5 md:p-6" style={{ background: T.surface, boxShadow: RING }}>
            <div className="mb-5">
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium mb-3"
                style={{
                  background: T.brandSoft,
                  color: T.brand,
                  boxShadow: `inset 0 0 0 1px ${T.brandBorder}`,
                }}
              >
                <ShieldCheck size={10} /> Free · no card required
              </div>
              <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight" style={{ color: T.text }}>
                Create your account
              </h2>
              <p className="mt-1 text-[12.5px]" style={{ color: T.textMuted }}>
                Takes about a minute.
              </p>
            </div>

            {successMessage && (
              <div
                role="status"
                className="mb-4 flex items-start gap-2 rounded-md px-3 py-2.5"
                style={{ background: T.successSoft, boxShadow: `inset 0 0 0 1px ${T.successBorder}` }}
              >
                <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: T.success }} />
                <p className="text-[12px] leading-relaxed" style={{ color: T.success }}>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
              <Field label="Full name" htmlFor="name" error={errors.name?.message}>
                <InputShell icon={UserIcon} invalid={!!errors.name}>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    name="name"
                    placeholder="Jane Cooper"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    {...register("name")}
                    className="w-full bg-transparent text-[13px] outline-none"
                    style={{ color: T.text }}
                  />
                </InputShell>
              </Field>

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
                    {...register("email")}
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
                    autoComplete="new-password"
                    name="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : "password-rules"}
                    onKeyUp={onCapsCheck}
                    onKeyDown={onCapsCheck}
                    {...register("password")}
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
                    <Info size={11} /> Caps Lock is on
                  </p>
                )}

                {password.length > 0 && (
                  <div id="password-rules" className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: T.surfaceHi }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${strengthPct}%`, background: strength.color }}
                        />
                      </div>
                      <span
                        className="text-[10.5px] font-medium shrink-0"
                        style={{ color: strength.color, fontFamily: FONT.mono }}
                      >
                        {strength.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(password);
                        return (
                          <span
                            key={rule.label}
                            className="inline-flex items-center gap-1.5 text-[10.5px] transition-colors"
                            style={{ color: passed ? T.success : T.textFaint, fontFamily: FONT.mono }}
                          >
                            <span
                              className="w-3 h-3 rounded-full flex items-center justify-center"
                              style={{
                                background: passed ? T.successSoft : T.surface2,
                                boxShadow: `inset 0 0 0 1px ${passed ? T.successBorder : T.borderSoft}`,
                              }}
                            >
                              {passed ? (
                                <Check size={7} strokeWidth={3} style={{ color: T.success }} />
                              ) : (
                                <span className="w-0.5 h-0.5 rounded-full" style={{ background: T.textFaint }} />
                              )}
                            </span>
                            {rule.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Field>

              <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <InputShell
                  icon={Lock}
                  invalid={!!errors.confirmPassword || confirmMismatch}
                  valid={confirmMatches}
                >
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirmPassword || confirmMismatch}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    {...register("confirmPassword")}
                    className="w-full bg-transparent text-[13px] outline-none"
                    style={{ color: T.text }}
                  />
                  {confirmMatches && (
                    <CheckCircle2 size={13} className="shrink-0" style={{ color: T.success }} aria-label="Passwords match" />
                  )}
                </InputShell>

                {!errors.confirmPassword && confirmPassword.length > 0 && (
                  <p className="mt-1.5 text-[11px]" style={{ color: confirmMatches ? T.success : T.warn }}>
                    {confirmMatches ? "Passwords match" : "Passwords don't match yet"}
                  </p>
                )}
              </Field>

              <div>
                <label
                  className="flex items-start gap-2 cursor-pointer select-none rounded-md px-2.5 py-2 transition-colors"
                  style={{
                    background: errors.agreed ? T.dangerSoft : T.surface2,
                    boxShadow: `inset 0 0 0 1px ${errors.agreed ? T.dangerBorder : T.borderSoft}`,
                  }}
                >
                  <span className="relative shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      {...register("agreed")}
                      aria-invalid={!!errors.agreed}
                      className="peer sr-only"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded flex items-center justify-center transition-all"
                      style={{ background: T.surfaceHi, boxShadow: `inset 0 0 0 1px ${T.border}` }}
                    >
                      <Check
                        size={10}
                        strokeWidth={3}
                        className="opacity-0 peer-checked:opacity-100 transition-opacity"
                        style={{ color: "#fff" }}
                      />
                    </span>
                    <style>{`
                      input:checked + span {
                        background: ${T.brand} !important;
                        box-shadow: inset 0 0 0 1px ${T.brandBorder} !important;
                      }
                    `}</style>
                  </span>
                  <span className="text-[12px] leading-relaxed" style={{ color: T.textMuted }}>
                    I agree to the{" "}
                    <a href="#" className="hover:underline underline-offset-2" style={{ color: T.brand }}>Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="hover:underline underline-offset-2" style={{ color: T.brand }}>Privacy Policy</a>
                  </span>
                </label>
                {errors.agreed && (
                  <p id="agreed-error" role="alert" className="text-[11px] mt-1.5" style={{ color: T.danger }}>
                    {errors.agreed.message as string}
                  </p>
                )}
              </div>

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

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-md py-2.5 text-[12.5px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
                style={{
                  background: T.brand,
                  boxShadow: "0 6px 18px -8px rgba(99,102,241,0.7)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[12px] mt-5 text-center" style={{ color: T.textMuted }}>
            Already have an account?{" "}
            <a href="/" className="hover:underline underline-offset-2 font-medium" style={{ color: T.brand }}>
              Sign in
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

export default Register;