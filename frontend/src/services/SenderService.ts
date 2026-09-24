// frontend/src/services/SenderAccountService.ts
import api from "../libs/Axios";
import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

/* ─────────────── Runtime guard (defensive against bad API rows) ─────────────── */

const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null;

/** Coerce a raw API row into a strictly-typed SenderAccount.
 *  Falls back to safe defaults for any field the backend omits. */
const mapSenderAccount = (raw: any): SenderAccount => {
  const r = isObject(raw) ? raw : {};
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
  };
};

/* ─────────────── Response unwrappers ─────────────── */

/** Handles { account }, { data }, or bare object. Returns null if none. */
const unwrapOne = (raw: any): SenderAccount | null => {
  if (!isObject(raw)) return null;
  const row = raw.account ?? raw.data ?? raw;
  if (!isObject(row) || row.id == null) return null;
  return mapSenderAccount(row);
};

/** Handles [ ... ], { accounts: [...] }, { data: [...] }, { items: [...] }, { results: [...] }. */
const unwrapMany = (raw: any): SenderAccount[] => {
  if (Array.isArray(raw)) return raw.map(mapSenderAccount);

  if (isObject(raw)) {
    const candidates = [raw.accounts, raw.data, raw.items, raw.results];
    for (const c of candidates) {
      if (Array.isArray(c)) return c.map(mapSenderAccount);
    }
  }
  return [];
};

/* ─────────────── CRUD ─────────────── */

/** GET /sender-accounts/all → SenderAccount[] */
export const getAllSenderAccounts = async (): Promise<SenderAccount[]> => {
  const { data } = await api.get("/sender-accounts/all");
  return unwrapMany(data);
};

/** GET /sender-accounts/{id} → SenderAccount (optionally scoped by user_id) */
export const getSenderAccount = async (
  id: number,
  userId?: string
): Promise<SenderAccount> => {
  const { data } = await api.get(`/sender-accounts/${id}`, {
    params: userId ? { user_id: userId } : undefined,
  });
  const mapped = unwrapOne(data);
  if (!mapped) throw new Error("Sender account not found in response");
  return mapped;
};

/** POST /sender-accounts/ → SenderAccount */
export const addSenderAccount = async (
  input: CreateSenderAccountInput
): Promise<SenderAccount> => {
  // Send exactly the shape the backend expects (snake_case).
  const body: CreateSenderAccountInput = {
    user_id: input.user_id,
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

/** PUT /sender-accounts/{id} → SenderAccount */
export const updateSenderAccount = async (
  id: number,
  input: UpdateSenderAccountInput
): Promise<SenderAccount> => {
  // Build the payload from only the keys that were provided.
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
export const deleteSenderAccount = async (
  id: number,
  userId?: string
): Promise<void> => {
  await api.delete(`/sender-accounts/${id}`, {
    params: userId ? { user_id: userId } : undefined,
  });
};