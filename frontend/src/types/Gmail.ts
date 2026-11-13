export type GmailConnectStatus = "connected" | "error";

export interface GmailConnectResult {
  status: GmailConnectStatus;
  reason?: string;
}

/** BroadcastChannel name + payload (popup → opener tab) */
export const GMAIL_OAUTH_CHANNEL = "gmail-oauth";
export const GMAIL_POPUP_NAME = "gmail-connect";

export interface GmailOAuthMessage extends GmailConnectResult {
  type: "gmail-oauth-result";
}

export interface GmailConnectContextValue {
  /** Popup kholta hai (blocked ho to same-tab redirect) */
  connectGmail: () => void;
  connecting: boolean;
  result: GmailConnectResult | null;
  clearResult: () => void;
}