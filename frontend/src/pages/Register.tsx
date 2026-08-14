import React, { useEffect, useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Flame, Check } from 'lucide-react'

const STAGES = ['Queued', 'Sending', 'Delivered'] as const

const PASSWORD_RULES = [
  { label: '8+ characters', test: (v: string) => v.length >= 8 },
  { label: '1 number', test: (v: string) => /\d/.test(v) },
  { label: '1 uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
]

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
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

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !email || !password || !confirmPassword) {
      setError('Fill in every field to continue.')
      return
    }
    if (!passwordValid) {
      setError('Password does not meet the requirements below.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setError('Accept the terms to create your account.')
      return
    }

    setLoading(true)
    try {
      // TODO: replace with real signup call
      await new Promise((resolve) => setTimeout(resolve, 900))
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
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
            MailForge
          </span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-[#E8E6E1] max-w-xs">
              Set up your workspace and start shipping campaigns.
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
          v2.4 · status: operational
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <Flame className="w-5 h-5 text-[#FF6A39]" strokeWidth={2.2} />
            <span className="font-display text-base font-semibold text-[#E8E6E1]">
              MailForge
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-[#E8E6E1]">
              Create your account
            </h2>
            <p className="text-sm text-[#8B8D94] mt-1.5">
              Takes about a minute — no card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-[#8B8D94] mb-1.5"
              >
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B5D64]" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Cooper"
                  className="w-full bg-[#171A21] border border-[#2A2E37] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#E8E6E1] placeholder-[#5B5D64] outline-none transition-colors focus:border-[#FF6A39] focus:ring-1 focus:ring-[#FF6A39]/40"
                />
              </div>
            </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-[#171A21] border border-[#2A2E37] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#E8E6E1] placeholder-[#5B5D64] outline-none transition-colors focus:border-[#FF6A39] focus:ring-1 focus:ring-[#FF6A39]/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#8B8D94] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B5D64]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

              {password.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <span
                        key={rule.label}
                        className={`flex items-center gap-1 text-[11px] font-mono-ui ${
                          passed ? 'text-[#7FD98A]' : 'text-[#5B5D64]'
                        }`}
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        {rule.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-[#8B8D94] mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B5D64]" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#171A21] border border-[#2A2E37] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#E8E6E1] placeholder-[#5B5D64] outline-none transition-colors focus:border-[#FF6A39] focus:ring-1 focus:ring-[#FF6A39]/40"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5 rounded border-[#2A2E37] bg-[#171A21] accent-[#FF6A39]"
              />
              <span className="text-xs text-[#8B8D94]">
                I agree to the{' '}
                <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2">
                  Privacy Policy
                </a>
              </span>
            </label>

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
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-[#5B5D64] mt-8 text-center">
            Already have an account?{' '}
            <a href="#" className="text-[#FF6A39] hover:underline underline-offset-2">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register