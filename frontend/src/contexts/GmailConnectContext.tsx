import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SenderAccContext } from "./SenderAccountsContext";
import {
  buildGmailConnectUrl, getAccessToken, openGmailPopup,
} from "../services/GmailOAuthService";
import {
  GMAIL_OAUTH_CHANNEL, GMAIL_POPUP_NAME,
  type GmailConnectContextValue, type GmailConnectResult, type GmailOAuthMessage,
} from "../types/gmail";

const GmailConnectContext = createContext<GmailConnectContextValue | null>(null);

/**
 * Isko Router ke ANDAR aur SenderAccProvider ke ANDAR mount karo.
 * Callback page (/user/sender-account?google=...) par yahi param padhta hai.
 */
export const GmailConnectProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const senderCtx = useContext(SenderAccContext);

  const [connecting, setConnecting] = useState(false);
  const [result, setResult] = useState<GmailConnectResult | null>(null);

  const refetchRef = useRef(senderCtx?.fetchAllSenderAccounts);
  refetchRef.current = senderCtx?.fetchAllSenderAccounts;

  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) { window.clearInterval(pollRef.current); pollRef.current = null; }
  };

  const applyResult = useCallback((r: GmailConnectResult) => {
    stopPolling();
    setConnecting(false);
    setResult(r);
    if (r.status === "connected") refetchRef.current?.();
    try { popupRef.current?.close(); } catch { /* ignore */ }
    popupRef.current = null;
  }, []);

  /* ── opener tab: popup se result sunna ── */
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(GMAIL_OAUTH_CHANNEL);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent<GmailOAuthMessage>) => {
      if (e.data?.type !== "gmail-oauth-result") return;
      applyResult({ status: e.data.status, reason: e.data.reason });
    };
    return () => { ch.close(); channelRef.current = null; };
  }, [applyResult]);

  /* ── callback page: ?google=connected|error padhna ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const google = params.get("google");
    if (google !== "connected" && google !== "error") return;

    const r: GmailConnectResult = {
      status: google,
      reason: params.get("reason") ?? undefined,
    };

    const isPopup = window.name === GMAIL_POPUP_NAME || !!window.opener;
    if (isPopup && channelRef.current) {
      const msg: GmailOAuthMessage = { type: "gmail-oauth-result", ...r };
      channelRef.current.postMessage(msg);
      window.close(); // popup band
      // agar browser close na kare to normal handling bhi chalne do
    }

    applyResult(r);

    params.delete("google");
    params.delete("reason");
    const qs = params.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => () => stopPolling(), []);

  const connectGmail = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setResult({ status: "error", reason: "Session expired. Please login again." });
      return;
    }
    setResult(null);
    setConnecting(true);

    const url = buildGmailConnectUrl(token);
    const popup = openGmailPopup(url);

    if (!popup) {
      // popup blocked → same-tab redirect (wizard state is case mein reset hoga)
      window.location.href = url;
      return;
    }

    popupRef.current = popup;
    popup.focus();

    // user ne popup bina finish kiye band kar diya → button unlock + list refresh
    stopPolling();
    pollRef.current = window.setInterval(() => {
      if (popupRef.current?.closed) {
        stopPolling();
        popupRef.current = null;
        setConnecting(false);
        refetchRef.current?.();
      }
    }, 600);
  }, []);

  const clearResult = useCallback(() => setResult(null), []);

  const value = useMemo<GmailConnectContextValue>(
    () => ({ connectGmail, connecting, result, clearResult }),
    [connectGmail, connecting, result, clearResult]
  );

  return <GmailConnectContext.Provider value={value}>{children}</GmailConnectContext.Provider>;
};

export const useGmailConnect = (): GmailConnectContextValue => {
  const ctx = useContext(GmailConnectContext);
  if (!ctx) throw new Error("useGmailConnect must be used inside <GmailConnectProvider>");
  return ctx;
};