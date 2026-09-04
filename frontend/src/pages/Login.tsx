import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Flame } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { UserLogin } from '../types/UserTypes'

const STAGES = ['Queued', 'Sending', 'Delivered'] as const

type Inputs = UserLogin // expects { email: string; password: string } — adjust if your type differs

const Login = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delivered, setDelivered] = useState(1842)

  // Subtle live ticker in the brand panel — purely decorative
  useEffect(() => {
    const id = setInterval(() => {
      setDelivered((d) => d + Math.floor(Math.random() * 3))
    }, 2600)
    return () => clearInterval(id)
  }, [])
  const Login = () => {
  const navigate = useNavigate()

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("Login must be used inside AuthProvider")
  }

  const { login } = context

  // ...
}

 const user = await login(data);

    console.log("LOGGED IN USER:", user);
    console.log("LOGGED IN ROLE:", user.role);

    if (user.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0E1013] text-[#E8E6E1] font-['Inter',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono-ui { font-family: 'JetBrains Mono', monospace; }

        @keyframes travel {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .packet {
          animation: travel 3.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .packet-2 { animation-delay: 1.2s; }
        .packet-3 { animation-delay: 2.4s; }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.96); }
        }
        .flame-icon { animation: flicker 2.4s ease-in-out infinite; }
      `}</style>

      {/* Brand / signature panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-[#12151B] border-r border-[#2A2E37] p-12 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <Flame className="flame-icon w-6 h-6 text-[#FF6A39]" strokeWidth={2.2} />
          <span className="font-display text-lg font-semibold tracking-tight text-[#E8E6E1]">
            Outwerk Solutions
          </span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-[#E8E6E1] max-w-xs">
              Every campaign, tracked from queue to inbox.
            </h1>
          </div>

          {/* Pipeline signature element */}
          <div className="space-y-3">
            <div className="relative h-[2px] bg-[#2A2E37] rounded-full overflow-visible">
              <span className="packet absolute -top-[5px] w-3 h-3 rounded-full bg-[#FF6A39] shadow-[0_0_10px_2px_rgba(255,106,57,0.55)]" />
              <span className="packet packet-2 absolute -top-[5px] w-3 h-3 rounded-full bg-[#FF6A39] shadow-[0_0_10px_2px_rgba(255,106,57,0.55)]" />
              <span className="packet packet-3 absolute -top-[5px] w-3 h-3 rounded-full bg-[#FFC24B] shadow-[0_0_10px_2px_rgba(255,194,75,0.55)]" />
            </div>
            <div className="flex justify-between font-mono-ui text-[11px] uppercase tracking-wider text-[#8B8D94]">
              {STAGES.map((stage) => (
                <span key={stage}>{stage}</span>
              ))}
            </div>
          </div>

          <p className="font-mono-ui text-[12px] text-[#8B8D94]">
            {delivered.toLocaleString()} delivered today
          </p>
        </div>

        <p className="font-mono-ui text-[11px] text-[#5B5D64]">
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <Flame className="w-5 h-5 text-[#FF6A39]" strokeWidth={2.2} />
            <span className="font-display text-base font-semibold text-[#E8E6E1]">
              Outwerk Solutions
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-[#E8E6E1]">
              Sign in
            </h2>
            <p className="text-sm text-[#8B8D94] mt-1.5">
              Welcome back — pick up where you left off.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#8B8D94] mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B5D64]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email', {
                    required: 'Enter your email to continue.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address.',
                    },
                  })}
                  className="w-full bg-[#171A21] border border-[#2A2E37] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#E8E6E1] placeholder-[#5B5D64] outline-none transition-colors focus:border-[#FF6A39] focus:ring-1 focus:ring-[#FF6A39]/40"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#FF6A39] mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#8B8D94]"
                >
                  Password
                </label>

              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B5D64]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Enter your password to continue.',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters.',
                    },
                  })}
                  className="w-full bg-[#171A21] border border-[#2A2E37] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[#E8E6E1] placeholder-[#5B5D64] outline-none transition-colors focus:border-[#FF6A39] focus:ring-1 focus:ring-[#FF6A39]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B5D64] hover:text-[#8B8D94] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#FF6A39] mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs text-[#FF6A39] bg-[#FF6A39]/10 border border-[#FF6A39]/30 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6A39] hover:bg-[#FF7F52] disabled:opacity-60 disabled:cursor-not-allowed text-[#0E1013] font-medium text-sm rounded-lg py-2.5 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login