import api from "../libs/Axios";
import type {
  SenderAccount,
  SenderAccountApiResponse,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

const mapSenderAccount = (a: SenderAccountApiResponse): SenderAccount => ({
  id: a.id,
  email: a.email,
  name: a.display_name,
  provider: a.provider,
  status: a.status,
  dailyLimit: a.daily_limit,
  hourlyLimit: a.hourly_limit,
  sentToday: a.emails_sent_today,
  sentThisHour: a.emails_sent_hour,
});

const extractList = (payload: any): SenderAccountApiResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  return [];
};

const extractOne = (payload: any): SenderAccountApiResponse => {
  if (payload?.data) return payload.data;
  if (payload?.account) return payload.account;
  return payload;
};

export const getAllSenderAccounts = async (): Promise<SenderAccount[]> => {
  const response = await api.get(`/sender-accounts/all`);
  const rows = extractList(response.data);

  if (rows.length === 0) {
    // Not an error, but useful during debugging
    console.warn(
      "[SenderService] getAllSenderAccounts returned 0 rows. Raw response:",
      response.data
    );
  }

  return rows.map(mapSenderAccount);
};

export const getSenderAccount = async (id: number): Promise<SenderAccount> => {
  const response = await api.get(`/sender-accounts/${id}`);
  return mapSenderAccount(extractOne(response.data));
};

export const updateSenderAccount = async (
  id: number,
  data: UpdateSenderAccountInput
): Promise<SenderAccount> => {
  const response = await api.put(`/sender-accounts/${id}`, data);
  return mapSenderAccount(extractOne(response.data));
};

export const deleteSenderAccount = async (id: number): Promise<void> => {
  await api.delete(`/sender-accounts/${id}`);
};

export const addSenderAccount = async (
  data: CreateSenderAccountInput
): Promise<SenderAccount> => {
  const response = await api.post(`/sender-accounts`, data);
  return mapSenderAccount(extractOne(response.data));
};