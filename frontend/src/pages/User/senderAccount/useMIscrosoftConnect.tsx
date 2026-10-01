import { useCallback, useState } from "react";

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const API_ORIGIN = new URL(API || window.location.origin, window.location.origin).origin;

export interface MicrosoftConnectOptions {
  displayName?: string;
  dailyLimit: number;
  hourlyLimit: number;
}

/**
 * Flow:
 * 1. Open a blank popup synchronously (so browsers don't block it).
 * 2. Ask the backend for the Microsoft authorize URL (it creates the `state`).
 * 3. Point the popup at that URL; the user signs in and consents.
 * 4. Microsoft redirects to the backend callback, which exchanges the code,
 *    stores the refresh token, creates the sender account, and renders a tiny
 *    page that does:
 *      window.opener.postMessage({ type: "ms-oauth-result", success: true }, FRONTEND_ORIGIN)
 * 5. We receive that message here and resolve.
 */
export function useMicrosoftConnect() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (opts: MicrosoftConnectOptions) => {
    setError(null);
    setConnecting(true);

    const w = 520;
    const h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      "about:blank",
      "ms-oauth",
      `width=${w},height=${h},left=${left},top=${top}`
    );

    if (!popup) {
      const msg = "Popup was blocked. Allow popups for this site and try again.";
      setError(msg);
      setConnecting(false);
      throw new Error(msg);
    }

    let cleanup = () => {};

    try {
      const qs = new URLSearchParams({
        daily_limit: String(opts.dailyLimit),
        hourly_limit: String(opts.hourlyLimit),
        ...(opts.displayName ? { display_name: opts.displayName } : {}),
      });

      const res = await fetch(`${API}/api/auth/microsoft/url?${qs}`, {
        credentials: "include", // or attach your Authorization header here
      });
      if (!res.ok) throw new Error("Could not start Microsoft sign-in.");
      const { url } = (await res.json()) as { url: string };

      popup.location.href = url;

      await new Promise<void>((resolve, reject) => {
        const onMessage = (e: MessageEvent) => {
          if (e.origin !== API_ORIGIN) return;
          if (e.data?.type !== "ms-oauth-result") return;
          cleanup();
          if (e.data.success) resolve();
          else reject(new Error(e.data.error || "Microsoft sign-in failed."));
        };

        const poll = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error("Sign-in window was closed before finishing."));
          }
        }, 500);

        cleanup = () => {
          window.removeEventListener("message", onMessage);
          window.clearInterval(poll);
        };

        window.addEventListener("message", onMessage);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microsoft sign-in failed.";
      setError(msg);
      throw err;
    } finally {
      cleanup();
      if (!popup.closed) popup.close();
      setConnecting(false);
    }
  }, []);

  return { connect, connecting, error, clearError: () => setError(null) };
}