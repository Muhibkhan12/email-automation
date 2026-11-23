// frontend/src/contexts/SenderAccountsContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getMySenderAccounts,
  adminGetAllSenderAccounts,
  addSenderAccount as apiAdd,
  updateSenderAccount as apiUpdate,
  deleteSenderAccount as apiDelete,
  adminDeleteSenderAccount as apiAdminDelete,
} from "../services/SenderService";

import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";

export type SenderAccountsMode = "user" | "admin";

interface SenderAccContextValue {
  accounts: SenderAccount[];
  loading: boolean;
  error: string | null;
  mode: SenderAccountsMode;

  refresh: () => Promise<void>;

  addSenderAccount: (data: CreateSenderAccountInput) => Promise<SenderAccount>;
  updateSenderAccount: (id: number, data: UpdateSenderAccountInput) => Promise<SenderAccount>;
  deleteSenderAccount: (id: number) => Promise<void>;

  getById: (id: number) => SenderAccount | undefined;
}

const SenderAccContext = createContext<SenderAccContextValue | null>(null);

export const useSenderAccounts = () => {
  const ctx = useContext(SenderAccContext);
  if (!ctx) throw new Error("useSenderAccounts must be used within SenderAccountsProvider");
  return ctx;
};

interface ProviderProps {
  mode?: SenderAccountsMode;
  autoLoad?: boolean;
  children: React.ReactNode;
}

export const SenderAccountsProvider: React.FC<ProviderProps> = ({
  mode = "user",
  autoLoad = true,
  children,
}) => {
  const [accounts, setAccounts] = useState<SenderAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const inflightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchRows = useCallback(async (): Promise<SenderAccount[]> => {
    return mode === "admin"
      ? await adminGetAllSenderAccounts()
      : await getMySenderAccounts();
  }, [mode]);

  const refresh = useCallback(async (): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;

    const p = (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchRows();
        if (mountedRef.current) setAccounts(rows);
      } catch (e: any) {
        const code = e?.response?.status;
        const msg =
          code === 401
            ? "Session expired. Please log in again."
            : code === 403
            ? mode === "admin"
              ? "Admin access required."
              : "You don't have permission for this action."
            : e?.response?.data?.detail ?? e?.message ?? "Failed to load sender accounts";
        if (mountedRef.current) {
          setError(msg);
          setAccounts([]);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = p;
    return p;
  }, [fetchRows, mode]);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  const addSenderAccount = useCallback(
    async (data: CreateSenderAccountInput) => {
      const created = await apiAdd(data);
      if (mountedRef.current) setAccounts((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateSenderAccount = useCallback(
    async (id: number, data: UpdateSenderAccountInput) => {
      const updated = await apiUpdate(id, data);
      if (mountedRef.current) {
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
      return updated;
    },
    []
  );

  const deleteSenderAccount = useCallback(
    async (id: number) => {
      let snapshot: SenderAccount[] = [];
      setAccounts((prev) => {
        snapshot = prev;
        return prev.filter((a) => a.id !== id);
      });

      try {
        if (mode === "admin") await apiAdminDelete(id);
        else await apiDelete(id);
      } catch (e) {
        if (mountedRef.current) setAccounts(snapshot);
        throw e;
      }
    },
    [mode]
  );

  const getById = useCallback(
    (id: number) => accounts.find((a) => a.id === id),
    [accounts]
  );

  const value = useMemo<SenderAccContextValue>(
    () => ({
      accounts,
      loading,
      error,
      mode,
      refresh,
      addSenderAccount,
      updateSenderAccount,
      deleteSenderAccount,
      getById,
    }),
    [
      accounts,
      loading,
      error,
      mode,
      refresh,
      addSenderAccount,
      updateSenderAccount,
      deleteSenderAccount,
      getById,
    ]
  );

  return <SenderAccContext.Provider value={value}>{children}</SenderAccContext.Provider>;
};