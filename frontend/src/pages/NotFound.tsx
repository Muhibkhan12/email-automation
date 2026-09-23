import { Link } from "react-router-dom";
import { MailX, Home, ArrowLeft, Search, Sparkles } from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0B0E13", color: "#F2F0EB", fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }

        @keyframes floatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }

        @keyframes drift {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(6px, -4px); }
          100% { transform: translate(0, 0); }
        }
        .drift { animation: drift 6s ease-in-out infinite; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }

        @media (prefers-reduced-motion: reduce) {
          .ping, .float-in, .drift { animation: none !important; }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px 260px at 50% -60px, rgba(255,106,57,0.12), transparent 70%)," +
            "radial-gradient(600px 220px at 90% 110%, rgba(52,211,153,0.05), transparent 60%)",
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 75%)",
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md float-in">
        <div
          className="rounded-3xl p-8 md:p-10 text-center soft-ring"
          style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
        >
          {/* Icon plate */}
          <div className="mx-auto mb-6 relative">
            <div
              className="drift w-20 h-20 mx-auto rounded-3xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, rgba(255,106,57,0.22), rgba(255,106,57,0.06))",
                boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.28), 0 20px 40px -20px rgba(255,106,57,0.5)",
              }}
            >
              <MailX className="w-8 h-8" style={{ color: "#FF6A39" }} strokeWidth={1.8} />
              {/* pulse dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF6A39]">
                <span className="absolute inset-0 rounded-full bg-[#FF6A39] ping" />
              </span>
            </div>
          </div>

          {/* 404 */}
          <div className="mb-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: "rgba(255,106,57,0.10)",
                color: "#FF6A39",
                boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.22)",
              }}
            >
              <Search size={11} /> Page not found
            </span>
          </div>

          <h1
            className="mt-4 text-[64px] md:text-[72px] leading-none font-bold tracking-tight"
            style={{
              fontFamily: FONT.display,
              background: "linear-gradient(180deg, #F2F0EB 0%, #7A8092 120%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </h1>

          <h2
            className="mt-3 text-[18px] md:text-[20px] font-semibold text-[#F2F0EB] tracking-tight"
            style={{ fontFamily: FONT.display }}
          >
            This page bounced back
          </h2>

          <p className="mt-2.5 text-[13px] leading-relaxed text-[#8A90A0] max-w-sm mx-auto">
            The page you're looking for doesn't exist, was moved, or the link might be broken. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              to="/"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "#FF6A39", boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)" }}
            >
              <Home size={15} />
              Go to dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-medium transition-all hover:-translate-y-0.5"
              style={{
                background: "#0F131C",
                color: "#DADEE7",
                boxShadow: "inset 0 0 0 1px #1A1F2B",
              }}
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              Go back
            </button>
          </div>

          {/* Divider */}
          <div
            className="mt-8 pt-5 flex items-center justify-between gap-3 text-[11px]"
            style={{ borderTop: "1px solid #1A1F2B", fontFamily: FONT.mono, color: "#5A6172" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#FF6A39]" />
              MailForge
            </span>
            <span>error · 404</span>
          </div>
        </div>

        {/* Below card */}
        <p className="mt-6 text-center text-[11px]" style={{ fontFamily: FONT.mono, color: "#5A6172" }}>
          If you believe this is a mistake, contact support.
        </p>
      </div>
    </div>
  );
}