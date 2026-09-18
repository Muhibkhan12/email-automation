// What the backend actually returns
export interface SenderAccountApiResponse {
  id: number;
  user_id: number;
  email: string;
  display_name: string;
  provider: "Gmail" | "Outlook" | "Custom SMTP";
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  daily_limit: number;
  hourly_limit: number;
  emails_sent_today: number;
  emails_sent_hour: number;
  status: "Active" | "Warning" | "Disconnected";
  created_at: string;
  updated_at: string;
}

// What the frontend actually uses — no tokens, camelCase
export interface SenderAccount {
  id: number;
  email: string;
  name: string;
  provider: "Gmail" | "Outlook" | "Custom SMTP";
  status: "Active" | "Warning" | "Disconnected";
  dailyLimit: number;
  hourlyLimit: number;
  sentToday: number;
  sentThisHour: number;
}