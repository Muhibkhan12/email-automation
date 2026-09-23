import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Loader2,
  Flame, Check, AlertTriangle, CheckCircle2, Sparkles, ShieldCheck,
  AlertCircle, Info,
} from "lucide-react";
import { UserRegister } from "../services/AuthServices";

const STAGES = ["Queued", "Sending", "Delivered"] as const;

const PASSWORD_RULES = [
  { label: "8+ characters",      test: (v: string) => v.length >= 8 },
  { label: "1 number",           test: (v: string) => /\d/.test(v) },
  { label: "1 uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
];

/* ── Zod schema (unchanged rules) ───────────────────────── */
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

interface RegisterUser {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  message?: string;
  [key: string]: unknown;
}

/* ── Password strength tiers ─────────────────────────────── */
const STRENGTH_TIERS = [
  { label: "Weak",   color: "#F87171", glow: "rgba(248,113,113,0.35)" },
  { label: "Fair",   color: "#FBBF24", glow: "rgba(251,191,36,0.35)" },
  { label: "Good",   color: "#FF6A39", glow: "rgba(255,106,57,0.35)" },
  { label: "Strong", color: "#34D399", glow: "rgba(52,211,153,0.35)" },
] as const;

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
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
  const strengthIndex = Math.max(0, passedRules - 1); // 0..2 → maps to first 3 tiers
  const strength = STRENGTH_TIERS[Math.min(strengthIndex, 3)];
  const strengthPct = (passedRules / PASSWORD_RULES.length) * 100;

  const confirmMatches = confirmPassword.length > 0 && confirmPassword === password;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  // Decorative live ticker in the brand panel
  useEffect(() => {
    const id = setInterval(() => {
      setDelivered((d) => d + Math.floor(Math.random() * 3));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const onCapsCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

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

      {/* ── Brand / signature panel ───────────────── */}
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
              <Sparkles size={11} /> Set up in under a minute
            </span>

            <h1 className="font-display text-[30px] xl:text-[34px] font-semibold leading-[1.15] text-[#F2F0EB] max-w-sm">
              Set up your workspace and start shipping campaigns.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[#8A90A0] max-w-sm">
              Bring every campaign, recipient, and sender under one roof — with a pipeline you can actually watch.
            </p>
          </div>

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

      {/* ── Form panel ───────────────────────────── */}
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
                <ShieldCheck size={11} /> Free · no card required
              </div>
              <h2 className="font-display text-[22px] md:text-[24px] font-semibold text-[#F2F0EB] tracking-tight">
                Create your account
              </h2>
              <p className="mt-1.5 text-[13px] text-[#8A90A0]">
                Takes about a minute.
              </p>
            </div>

            {/* Success */}
            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5"
                style={{ background: "rgba(52,211,153,0.08)", boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.22)" }}
              >
                <CheckCircle2 size={15} className="text-[#34D399] shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-[#34D399] leading-relaxed">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Full name */}
              <Field
                label="Full name"
                htmlFor="name"
                error={errors.name?.message}
                hint="As it should appear on your workspace."
              >
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
                    className="w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none"
                  />
                </InputShell>
              </Field>

              {/* Email */}
              <Field
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
              >
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
                    className="w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none"
                  />
                </InputShell>
              </Field>

              {/* Password */}
              <Field
                label="Password"
                htmlFor="password"
                error={errors.password?.message}
              >
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

                {/* Caps lock hint */}
                {capsOn && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#FBBF24]">
                    <Info size={11} /> Caps Lock is on
                  </p>
                )}

                {/* Strength + rules */}
                {password.length > 0 && (
                  <div id="password-rules" className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1F2B" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${strengthPct}%`,
                            background: strength.color,
                            boxShadow: `0 0 10px ${strength.glow}`,
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-medium shrink-0"
                        style={{ color: strength.color, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {strength.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(password);
                        return (
                          <span
                            key={rule.label}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-mono-ui transition-colors ${
                              passed ? "text-[#34D399]" : "text-[#5A6172]"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors"
                              style={{
                                background: passed ? "rgba(52,211,153,0.14)" : "#141821",
                                boxShadow: `inset 0 0 0 1px ${passed ? "rgba(52,211,153,0.30)" : "#1A1F2B"}`,
                              }}
                            >
                              {passed ? (
                                <Check size={8} strokeWidth={3} />
                              ) : (
                                <span className="w-1 h-1 rounded-full" style={{ background: "#3A404F" }} />
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

              {/* Confirm password */}
              <Field
                label="Confirm password"
                htmlFor="confirmPassword"
                error={errors.confirmPassword?.message}
              >
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
                    className="w-full bg-transparent text-[13.5px] text-[#E8E6E1] placeholder:text-[#5A6172] outline-none"
                  />
                  {confirmMatches && (
                    <CheckCircle2 size={15} className="text-[#34D399] shrink-0" aria-label="Passwords match" />
                  )}
                </InputShell>

                {/* Live match hint (only when no zod error, and user has typed) */}
                {!errors.confirmPassword && confirmPassword.length > 0 && (
                  <p
                    className="mt-1.5 text-[11px]"
                    style={{ color: confirmMatches ? "#34D399" : "#FBBF24" }}
                  >
                    {confirmMatches ? "Passwords match" : "Passwords don't match yet"}
                  </p>
                )}
              </Field>

              {/* Terms */}
              <div>
                <label
                  className="flex items-start gap-2.5 cursor-pointer select-none rounded-2xl px-3 py-2.5 transition-colors"
                  style={{
                    background: errors.agreed ? "rgba(248,113,113,0.05)" : "#0F131C",
                    boxShadow: `inset 0 0 0 1px ${errors.agreed ? "rgba(248,113,113,0.30)" : "#1A1F2B"}`,
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
                      input:checked + span { background: #FF6A39 !important; box-shadow: 0 0 0 3px rgba(255,106,57,0.18) !important; }
                    `}</style>
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-[#8A90A0]">
                    I agree to the{" "}
                    <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2">Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2">Privacy Policy</a>
                  </span>
                </label>
                {errors.agreed && (
                  <p id="agreed-error" role="alert" className="text-[11.5px] text-[#F87171] mt-1.5">
                    {errors.agreed.message as string}
                  </p>
                )}
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-[12.5px] text-[#7A8092] mt-6 text-center">
            Already have an account?{" "}
            <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2 font-medium">
              Sign in
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
      {hint && !error && (
        <span className="text-[10.5px] text-[#5A6172]">{hint}</span>
      )}
    </div>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 text-[11.5px] text-[#F87171] mt-1.5">
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

export default Register;