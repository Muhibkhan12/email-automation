import api from "../libs/Axios";
import type { SenderAccount, UpdateSenderAccountInput } from "../types/SenderAccount";

/* ─────────────── endpoints (change these in ONE place) ─────────────── */

/** Admin routes that return / modify accounts across ALL users. */
const ADMIN_BASE = "/admin/sender-accounts";
/** Existing user-scoped routes (used only as a fallback). */
const USER_BASE = "/sender-accounts";

/* ─────────────── types ─────────────── */

export interface AdminSenderAccount extends SenderAccount {
  owner_name?: string;
  owner_email?: string;
}

/** "all"  = admin route answered, list contains every user's accounts.
 *  "mine" = admin route not found, fell back to the logged-in user's accounts. */
export type ListScope = "all" | "mine";

/* ─────────────── mapping ─────────────── */

const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null;

const mapAccount = (raw: any): AdminSenderAccount => {
  const r = isObject(raw) ? raw : {};
  const owner = isObject(r.user) ? r.user : isObject(r.owner) ? r.owner : {};
  return {
    id: Number(r.id ?? 0),
    user_id: r.user_id != null ? String(r.user_id) : undefined,
    display_name: String(r.display_name ?? r.name ?? ""),
    email: String(r.email ?? ""),
    provider: String(r.provider ?? ""),
    status: String(r.status ?? ""),
    daily_limit: Number(r.daily_limit ?? r.dailyLimit ?? 0) || 0,
    hourly_limit: Number(r.hourly_limit ?? r.hourlyLimit ?? 0) || 0,
    emails_sent_today: Number(r.emails_sent_today ?? r.sentToday ?? 0) || 0,
    emails_sent_hour: Number(r.emails_sent_hour ?? r.sentThisHour ?? 0) || 0,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
    owner_name: r.owner_name ?? r.user_name ?? owner.name ?? owner.full_name ?? undefined,
    owner_email: r.owner_email ?? r.user_email ?? owner.email ?? undefined,
  };
};

const unwrapMany = (raw: any): AdminSenderAccount[] => {
  if (Array.isArray(raw)) return raw.map(mapAccount);
  if (isObject(raw)) {
    for (const c of [raw.accounts, raw.data, raw.items, raw.results]) {
      if (Array.isArray(c)) return c.map(mapAccount);
    }
  }
  return [];
};

const unwrapOne = (raw: any): AdminSenderAccount | null => {
  if (!isObject(raw)) return null;
  const row = raw.account ?? raw.data ?? raw;
  if (!isObject(row) || row.id == null) return null;
  return mapAccount(row);
};

const isMissingRoute = (e: any) => {
  const s = e?.response?.status;
  return s === 404 || s === 405;
};

/* ─────────────── calls ─────────────── */

/** List every sender account (all users). Falls back to the user's own list
 *  if the admin route doesn't exist, and reports which one it got. */
export const adminListSenderAccounts = async (): Promise<{
  accounts: AdminSenderAccount[];
  scope: ListScope;
}> => {
  try {
    const { data } = await api.get(ADMIN_BASE);
    return { accounts: unwrapMany(data), scope: "all" };
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    const { data } = await api.get(`${USER_BASE}/all`);
    return { accounts: unwrapMany(data), scope: "mine" };
  }
};

/** Update limits / status / display name. */
export const adminUpdateSenderAccount = async (
  id: number,
  input: UpdateSenderAccountInput
): Promise<AdminSenderAccount> => {
  const body: UpdateSenderAccountInput = {};
  if (input.display_name !== undefined) body.display_name = input.display_name;
  if (input.status !== undefined) body.status = input.status;
  if (input.daily_limit !== undefined) body.daily_limit = input.daily_limit;
  if (input.hourly_limit !== undefined) body.hourly_limit = input.hourly_limit;

  let data: any;
  try {
    ({ data } = await api.put(`${ADMIN_BASE}/${id}`, body));
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    ({ data } = await api.put(`${USER_BASE}/${id}`, body));
  }
  const mapped = unwrapOne(data);
  if (!mapped) throw new Error("Backend did not return the updated account");
  return mapped;
};

/** Delete (disconnect) an account. */
export const adminDeleteSenderAccount = async (id: number): Promise<void> => {
  try {
    await api.delete(`${ADMIN_BASE}/${id}`);
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    await api.delete(`${USER_BASE}/${id}`);
  }
};