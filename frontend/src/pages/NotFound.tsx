import { Link } from "react-router-dom";
import { MailX, Home, ArrowLeft, Search, Sparkles, ChevronRight, Zap, Shield, Globe } from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "#080A0F", color: "#F2F0EB", fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* ---------- animation primitives ---------- */

        @keyframes ping {
          0%        { transform: scale(1);   opacity: 0.75; }
          75%, 100% { transform: scale(2.2); opacity: 0;    }
        }
        .ping { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }

        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.65; }
          100% { transform: scale(2.4); opacity: 0;    }
        }
        .pulse-ring { animation: pulseRing 2.4s ease-out infinite; }

        @keyframes drift {
          0%   { transform: translate(0, 0)      rotate(0deg);   }
          33%  { transform: translate(3px, -4px) rotate(1.5deg); }
          66%  { transform: translate(-2px, 2px) rotate(-1deg);  }
          100% { transform: translate(0, 0)      rotate(0deg);   }
        }
        .drift { animation: drift 7s ease-in-out infinite; }

        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,106,57,0.16) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3.5s ease-in-out infinite;
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .float-in { animation: floatIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }

        /* ---------- surface treatment ---------- */

        .soft-ring {
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 1px 0 rgba(255,255,255,0.03);
        }

        .glass {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          .ping, .float-in, .drift, .shimmer, .pulse-ring { animation: none !important; }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px 360px at 50% -100px, rgba(255,106,57,0.14), transparent 65%)," +
            "radial-gradient(600px 260px at 85% 100%, rgba(52,211,153,0.05), transparent 60%)," +
            "radial-gradient(450px 220px at 10% 90%, rgba(96,165,250,0.05), transparent 60%)",
        }}
      />

      {/* Grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav
        className="relative w-full max-w-md flex items-center justify-between mb-6 float-in"
        style={{ animationDelay: "0.05s" }}
      >
        <Link to="/" className="flex items-center gap-2 text-[13px] font-semibold" style={{ fontFamily: FONT.display }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(255,106,57,0.3), rgba(255,106,57,0.08))",
              boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.3)",
            }}
          >
            <Sparkles size={12} style={{ color: "#FF6A39" }} />
          </div>
          MailForge
        </Link>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "#7A8092",
            fontFamily: FONT.mono,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          error · 404
        </span>
      </nav>

      {/* Card */}
      <div className="relative w-full max-w-sm float-in" style={{ animationDelay: "0.1s" }}>
        <div
          className="rounded-2xl p-6 text-center soft-ring glass relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgba(20,24,33,0.95) 0%, rgba(14,18,26,0.98) 100%)" }}
        >
          {/* Shimmer top edge */}
          <div className="absolute top-0 left-0 right-0 h-px shimmer" />

          {/* Icon plate */}
          <div className="mx-auto mb-5 relative w-16 h-16">
            {/* halo rings */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.14)" }}
            />
            <div
              className="absolute -inset-2.5 rounded-full"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.06)" }}
            />

            {/* drifting plate */}
            <div
              className="drift w-full h-full mx-auto rounded-2xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, rgba(255,106,57,0.25), rgba(255,106,57,0.05))",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,106,57,0.32), 0 16px 32px -16px rgba(255,106,57,0.6)",
              }}
            >
              <MailX className="w-6 h-6" style={{ color: "#FF6A39" }} strokeWidth={1.7} />

              {/* pulse dot — anchored inside the plate's top-right corner */}
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                style={{ background: "#FF6A39" }}
              >
                <span className="absolute inset-0 rounded-full ping" style={{ background: "#FF6A39" }} />
                <span
                  className="absolute inset-0 rounded-full pulse-ring"
                  style={{ boxShadow: "0 0 0 1px #FF6A39" }}
                />
              </span>
            </div>
          </div>

          {/* Badge */}
          <div className="mb-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{
                background: "rgba(255,106,57,0.08)",
                color: "#FF8A5C",
                boxShadow: "inset 0 0 0 1px rgba(255,106,57,0.2)",
              }}
            >
              <Search size={10} />
              Page not found
            </span>
          </div>

          {/* 404 */}
          <h1
            className="mt-3 text-[56px] leading-none font-bold tracking-tighter"
            style={{
              fontFamily: FONT.display,
              background: "linear-gradient(180deg, #F2F0EB 0%, #6B7284 130%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </h1>

          <h2
            className="mt-2.5 text-[16px] font-semibold text-[#F2F0EB] tracking-tight"
            style={{ fontFamily: FONT.display }}
          >
            This page bounced back
          </h2>

          <p className="mt-2 text-[12.5px] leading-relaxed text-[#8A90A0] max-w-[18rem] mx-auto">
            The page you're looking for doesn't exist, was moved, or the link might be broken.
            Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/"
              className="group inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FF6A39, #FF5A1F)",
                boxShadow: "0 10px 24px -10px rgba(255,106,57,0.8)",
              }}
            >
              <Home size={13} />
              Go to dashboard
              <ChevronRight size={12} className="opacity-60 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                color: "#DADEE7",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
              Go back
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-1.5">
            {[
              { icon: Zap, label: "Fast support" },
              { icon: Shield, label: "Secure" },
              { icon: Globe, label: "99.9% uptime" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <Icon size={11} style={{ color: "#FF6A39" }} />
                <span
                  className="text-[9px] font-medium"
                  style={{ color: "#7A8092", fontFamily: FONT.mono }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="mt-4 text-center text-[10px]"
          style={{ fontFamily: FONT.mono, color: "#4A5060" }}
        >
          If you believe this is a mistake,{" "}
          <a
            href="mailto:support@mailforge.com"
            className="transition-colors hover:text-[#FF6A39]"
            style={{ color: "#6A7080" }}
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}