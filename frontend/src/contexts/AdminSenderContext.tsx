// frontend/src/contexts/AdminSenderAccountsContext.tsx
//
// Admin-only provider. Separate from SenderAccountsContext so the user
// campaigns page keeps working exactly as before.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  adminListSenderAccounts,
  adminUpdateSenderAccount,
  adminDeleteSenderAccount,
  type AdminSenderAccount,
  type ListScope,
} from "../services/AdminSenderAccountService";
import type { UpdateSenderAccountInput } from "../types/SenderAccount";

interface AdminSenderAccountsValue {
  accounts: AdminSenderAccount[];
  scope: ListScope | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateAccount: (id: number, data: UpdateSenderAccountInput) => Promise<AdminSenderAccount>;
  deleteAccount: (id: number) => Promise<void>;
}

const Ctx = createContext<AdminSenderAccountsValue | null>(null);

export const AdminSenderAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AdminSenderAccount[]>([]);
  const [scope, setScope] = useState<ListScope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListSenderAccounts();
      setAccounts(res.accounts);
      setScope(res.scope);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load sender accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAccount = useCallback(async (id: number, data: UpdateSenderAccountInput) => {
    const updated = await adminUpdateSenderAccount(id, data);
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...updated,
              // keep owner info if the PUT response doesn't include it
              user_id: updated.user_id ?? a.user_id,
              owner_name: updated.owner_name ?? a.owner_name,
              owner_email: updated.owner_email ?? a.owner_email,
            }
          : a
      )
    );
    return updated;
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    await adminDeleteSenderAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ accounts, scope, loading, error, refresh, updateAccount, deleteAccount }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAdminSenderAccounts = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminSenderAccounts must be used inside <AdminSenderAccountsProvider>");
  return v;
};