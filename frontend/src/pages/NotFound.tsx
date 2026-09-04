import { Link } from "react-router-dom";
import { MailX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ">
          <MailX className="h-10 w-10 text-orange-600" strokeWidth={1.5} />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-bold text-orange-800 tracking-tight">404</h1>

        <h2 className="mt-3 text-xl text-white font-semibold text-orange-00">
          This page bounced back
        </h2>

        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The page you're looking for doesn't exist, was moved, or the link
          might be broken. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-slate-400">
          MailForge — Email Automation Dashboard
        </p>
      </div>
    </div>
  );
}