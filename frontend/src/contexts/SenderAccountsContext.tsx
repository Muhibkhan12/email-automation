import { createContext, useEffect, useState, type ReactNode } from "react";

import {
  getSenderAccount,
  updateSenderAccount,
  deleteSenderAccount,
  getAllSenderAccounts,
  addSenderAccount,
} from "../services/SenderService";

import type {
  SenderAccount,
  CreateSenderAccountInput,
  UpdateSenderAccountInput,
} from "../types/SenderAccount";


type SenderAccountProp = {
  children: ReactNode;
};


type SenderAccountContextType = {
  senderAcc: SenderAccount[];
  loading: boolean;

  fetchSenderAccount: (id: number) => Promise<void>;
  fetchAllSenderAccounts: () => Promise<void>;

  addSenderAccount: (data: CreateSenderAccountInput) => Promise<void>;

  updateSenderAccount: (
    id: number,
    data: UpdateSenderAccountInput
  ) => Promise<void>;

  deleteSenderAccount: (id: number) => Promise<void>;
};


export const SenderAccContext =
  createContext<SenderAccountContextType | undefined>(undefined);


const SenderAccountsContext = ({ children }: SenderAccountProp) => {

  const [senderAcc, setSenderAcc] = useState<SenderAccount[]>([]);
  const [loading, setLoading] = useState(false);


  const fetchSenderAccount = async (id: number) => {
    try {
      setLoading(true);

      const data = await getSenderAccount(id);

      setSenderAcc([data]);

    } finally {
      setLoading(false);
    }
  };


  const fetchAllSenderAccounts = async () => {
    try {
      setLoading(true);

      const data = await getAllSenderAccounts();

      setSenderAcc(data);

    } finally {
      setLoading(false);
    }
  };


  const addSenderAccountHandler = async (
    data: CreateSenderAccountInput
  ) => {

    const newAccount = await addSenderAccount(data);

    setSenderAcc(prev => [
      ...prev,
      newAccount,
    ]);
  };


  const updateSenderAccountHandler = async (
    id: number,
    data: UpdateSenderAccountInput
  ) => {

    const updatedAccount = await   updateSenderAccount(id, data);

    setSenderAcc(prev =>
      prev.map(account =>
        account.id === id
          ? updatedAccount
          : account
      )
    );
  };


  const deleteSenderAccountHandler = async (id: number) => {

    await deleteSenderAccount(id);

    setSenderAcc(prev =>
      prev.filter(account => account.id !== id)
    );
  };


  useEffect(() => {
    fetchAllSenderAccounts();
  }, []);


  return (
    <SenderAccContext.Provider
      value={{
        senderAcc,
        loading,
        fetchSenderAccount,
        fetchAllSenderAccounts,
        addSenderAccount: addSenderAccountHandler,
        updateSenderAccount: updateSenderAccountHandler,
        deleteSenderAccount: deleteSenderAccountHandler,
      }}
    >
      {children}
    </SenderAccContext.Provider>
  );
};


export default SenderAccountsContext;
