  import api from "../libs/Axios";
  import type {
    SenderAccount,
    CreateSenderAccountInput,
    UpdateSenderAccountInput,
  } from "../types/SenderAccount";

  // maps raw backend row -> safe frontend shape (drops tokens)
  const mapSenderAccount = (a: any) => ({
    id: a.id,
    email: a.email,
    name: a.display_name ?? a.name,
    provider: a.provider,
    status: a.status,
    dailyLimit: a.daily_limit ?? a.dailyLimit,
    hourlyLimit: a.hourly_limit ?? a.hourlyLimit,
    sentToday: a.emails_sent_today ?? a.sentToday,
    sentThisHour: a.emails_sent_hour ?? a.sentThisHour,
  });

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

  export const getAllSenderAccounts = async () => {
    const response = await api.get("/sender-accounts/all");
    const raw = response.data;
    const rows = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.accounts)
      ? raw.accounts
      : Array.isArray(raw?.data)
      ? raw.data
      : [];

    return rows.map(mapSenderAccount);
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