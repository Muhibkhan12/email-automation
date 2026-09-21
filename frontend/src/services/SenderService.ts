import api from "../libs/Axios";
import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

/* Backend response shapes (FastAPI):
   GET    /sender-accounts/all   -> { accounts: SenderAccount[] }
   GET    /sender-accounts/{id}  -> { message, account: SenderAccount }
   POST   /sender-accounts/      -> { message, account: SenderAccount }
   PUT    /sender-accounts/{id}  -> { message, account: SenderAccount }
   DELETE /sender-accounts/{id}  -> { message }
   These helpers unwrap them so the context gets plain objects/arrays. */

// GET /sender-accounts/{id}
export const getSenderAccount = async (id: number): Promise<SenderAccount> => {
  const response = await api.get<{ message: string; account: SenderAccount }>(
    `/sender-accounts/${id}`
  );
  return response.data.account;
};

// PUT /sender-accounts/{id}
export const updateSenderAccount = async (
  id: number,
  data: UpdateSenderAccountInput
): Promise<SenderAccount> => {
  const response = await api.put<{ message: string; account: SenderAccount }>(
    `/sender-accounts/${id}`,
    data
  );
  return response.data.account;
};

// DELETE /sender-accounts/{id}
export const deleteSenderAccount = async (id: number) => {
  const response = await api.delete<{ message: string }>(
    `/sender-accounts/${id}`
  );
  return response.data;
};

// GET /sender-accounts/all
export const getAllSenderAccounts = async (): Promise<SenderAccount[]> => {
  const response = await api.get<{ accounts: SenderAccount[] }>(
    `/sender-accounts/all`
  );
  return response.data.accounts ?? [];
};

// POST /sender-accounts/
export const addSenderAccount = async (
  data: CreateSenderAccountInput
): Promise<SenderAccount> => {
  const response = await api.post<{ message: string; account: SenderAccount }>(
    `/sender-accounts/`,
    data
  );
  return response.data.account;
};