import axios from "axios";
import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
  SenderAccountIdParam,
} from "../types/SenderAccount";


// GET /sender-accounts/{id}
export const getSenderAccount = async (id: number) => {
  const response = await axios.get<SenderAccount>(
    `/sender-accounts/${id}`
  );

  return response.data;
};


// PUT /sender-accounts/{id}
export const updateSenderAccount = async (
  id: number,
  data: UpdateSenderAccountInput
) => {
  const response = await axios.put<SenderAccount>(
    `/sender-accounts/${id}`,
    data
  );

  return response.data;
};


// DELETE /sender-accounts/{id}
export const deleteSenderAccount = async (id: number) => {
  const response = await axios.delete(
    `/sender-accounts/${id}`
  );

  return response.data;
};


// GET /sender-accounts/all
export const getAllSenderAccounts = async () => {
  const response = await axios.get<SenderAccount[]>(
    `/sender-accounts/all`
  );

  return response.data;
};


// POST /sender-accounts/
export const addSenderAccount = async (
  data: CreateSenderAccountInput
) => {
  const response = await axios.post<SenderAccount>(
    `/sender-accounts/`,
    data
  );

  return response.data;
};