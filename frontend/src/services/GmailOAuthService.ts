import { GMAIL_POPUP_NAME } from "../types/gmail";

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

// ⚠️ apne project ke hisaab se change karo (jaha tum JWT store karte ho)
export const getAccessToken = (): string | null => localStorage.getItem("access_token");

export function buildGmailConnectUrl(token: string): string {
  return `${API_BASE}/api/oauth/gmail/connect?token=${encodeURIComponent(token)}`;
}

/** Centered popup. Blocked ho to null return hota hai. */
export function openGmailPopup(url: string): Window | null {
  const w = 520, h = 680;
  const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);
  return window.open(
    url,
    GMAIL_POPUP_NAME,
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
}

export const GmailOAuthService = { buildGmailConnectUrl, openGmailPopup, getAccessToken };
export default GmailOAuthService;