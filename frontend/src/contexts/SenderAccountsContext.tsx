// frontend/src/contexts/SenderAccountsContext.tsx
import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  getAllSenderAccounts,
  addSenderAccount as apiAdd,
  updateSenderAccount as apiUpdate,
  deleteSenderAccount as apiDelete,
} from "../services/SenderService";
import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

interface SenderAccContextValue {
  senderAcc: SenderAccount[];
  loading: boolean;
  error: string | null;
  fetchAllSenderAccounts: () => Promise<void>;
  addSenderAccount: (data: CreateSenderAccountInput) => Promise<SenderAccount>;
  updateSenderAccount: (id: number, data: UpdateSenderAccountInput) => Promise<SenderAccount>;
  deleteSenderAccount: (id: number) => Promise<void>;
}

export const SenderAccContext = createContext<SenderAccContextValue | null>(null);

export const SenderAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [senderAcc, setSenderAcc] = useState<SenderAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSenderAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getAllSenderAccounts();
      setSenderAcc(rows);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load sender accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const addSenderAccount = useCallback(async (data: CreateSenderAccountInput) => {
    const created = await apiAdd(data);
    setSenderAcc((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateSenderAccount = useCallback(
    async (id: number, data: UpdateSenderAccountInput) => {
      const updated = await apiUpdate(id, data);
      setSenderAcc((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    []
  );

  const deleteSenderAccount = useCallback(async (id: number) => {
    await apiDelete(id);
    setSenderAcc((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    fetchAllSenderAccounts();
  }, [fetchAllSenderAccounts]);

  const value: SenderAccContextValue = {
    senderAcc,
    loading,
    error,
    fetchAllSenderAccounts,
    addSenderAccount,
    updateSenderAccount,
    deleteSenderAccount,
  };

  return <SenderAccContext.Provider value={value}>{children}</SenderAccContext.Provider>;
};