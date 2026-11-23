// frontend/src/services/SenderAccountService.ts
import api from "../libs/Axios";
import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

/* ─────────────── Runtime guards ─────────────── */

const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null;

const mapSenderAccount = (raw: any): SenderAccount => {
  const r = isObject(raw) ? raw : {};
  return {
    id: Number(r.id ?? 0),
    user_id: r.user_id != null ? String(r.user_id) : undefined,
    display_name: String(r.display_name ?? r.name ?? ""),
    email: String(r.email ?? ""),
    provider: String(r.provider ?? ""),
    status: String(r.status ?? "Active"),
    daily_limit: Number(r.daily_limit ?? r.dailyLimit ?? 0) || 0,
    hourly_limit: Number(r.hourly_limit ?? r.hourlyLimit ?? 0) || 0,
    emails_sent_today: Number(r.emails_sent_today ?? r.sentToday ?? 0) || 0,
    emails_sent_hour: Number(r.emails_sent_hour ?? r.sentThisHour ?? 0) || 0,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
    // admin-only fields — kept optional so user page ignores them
    owner_email: r.owner_email ?? null,
    owner_name: r.owner_name ?? null,
  } as SenderAccount;
};

const unwrapOne = (raw: any): SenderAccount | null => {
  if (!isObject(raw)) return null;
  const row = raw.account ?? raw.data ?? raw;
  if (!isObject(row) || row.id == null) return null;
  return mapSenderAccount(row);
};

const unwrapMany = (raw: any): SenderAccount[] => {
  if (Array.isArray(raw)) return raw.map(mapSenderAccount);
  if (isObject(raw)) {
    for (const c of [raw.accounts, raw.data, raw.items, raw.results]) {
      if (Array.isArray(c)) return c.map(mapSenderAccount);
    }
  }
  return [];
};

/* ─────────────── USER-SCOPED ─────────────── */

/** GET /sender-accounts/my → all sender accounts of the logged-in user */
export const getMySenderAccounts = async (): Promise<SenderAccount[]> => {
  const { data } = await api.get("/sender-accounts/my");
  return unwrapMany(data);
};

/** GET /sender-accounts/{id} */
export const getSenderAccount = async (id: number): Promise<SenderAccount> => {
  const { data } = await api.get(`/sender-accounts/${id}`);
  const mapped = unwrapOne(data);
  if (!mapped) throw new Error("Sender account not found in response");
  return mapped;
};

/** POST /sender-accounts/  — user_id derived from auth token, NOT sent by client */
export const addSenderAccount = async (
  input: CreateSenderAccountInput
): Promise<SenderAccount> => {
  const body = {
    display_name: input.display_name,
    email: input.email,
    provider: input.provider,
    daily_limit: input.daily_limit,
    hourly_limit: input.hourly_limit,
  };
  const { data } = await api.post("/sender-accounts/", body);
  const mapped = unwrapOne(data);
  if (!mapped) throw new Error("Backend did not return the created account");
  return mapped;
};

/** PUT /sender-accounts/{id} */
export const updateSenderAccount = async (
  id: number,
  input: UpdateSenderAccountInput
): Promise<SenderAccount> => {
  const body: UpdateSenderAccountInput = {};
  if (input.display_name !== undefined) body.display_name = input.display_name;
  if (input.email !== undefined) body.email = input.email;
  if (input.status !== undefined) body.status = input.status;
  if (input.daily_limit !== undefined) body.daily_limit = input.daily_limit;
  if (input.hourly_limit !== undefined) body.hourly_limit = input.hourly_limit;

  const { data } = await api.put(`/sender-accounts/${id}`, body);
  const mapped = unwrapOne(data);
  if (!mapped) throw new Error("Backend did not return the updated account");
  return mapped;
};

/** DELETE /sender-accounts/{id} */
export const deleteSenderAccount = async (id: number): Promise<void> => {
  await api.delete(`/sender-accounts/${id}`);
};

/* ─────────────── ADMIN-ONLY ─────────────── */

/** GET /sender-accounts/admin/all → every user's sender accounts (flattened) */
export const adminGetAllSenderAccounts = async (): Promise<SenderAccount[]> => {
  const { data } = await api.get("/sender-accounts/admin/all");
  return unwrapMany(data);
};

/** DELETE /sender-accounts/admin/{id} */
export const adminDeleteSenderAccount = async (id: number): Promise<void> => {
  await api.delete(`/sender-accounts/admin/${id}`);
};