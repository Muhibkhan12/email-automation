import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  EmailLogs,
  AddEmailLogsType,
  UpdateEmailLogsType,
} from "../pages/User/EmailLogs";

import {
  addEmailLogs,
  getEmaillog,
  updateEmailLogs,
  getEmaillogById,
} from "../services/EmailLogServices";

type EmailLogsProviderProps = { children: ReactNode };

export interface EmailLogsContextType {
  emaillogs: EmailLogs[];
  emaillog: EmailLogs | null;
  editEmailLogs: EmailLogs | null;
  addedEmailLog: EmailLogs | null;
  editLogs: (id: number, data: UpdateEmailLogsType) => Promise<void>;
  addLogs: (data: AddEmailLogsType) => Promise<void>;
  fetchEmaillog: (id: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const EmailLogsContext = createContext<EmailLogsContextType | undefined>(undefined);

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.detail || err?.message || fallback;

export const EmailLogsProvider = ({ children }: EmailLogsProviderProps) => {
  const [emaillogs, setEmailLogs] = useState<EmailLogs[]>([]);
  const [emaillog, setEmailLog] = useState<EmailLogs | null>(null);
  const [editEmailLogs, setEditEmailLogs] = useState<EmailLogs | null>(null);
  const [addedEmailLog, setAddedEmailLog] = useState<EmailLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmaillogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmaillog();
      setEmailLogs(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to fetch email logs"));
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmaillog = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmaillogById(id);
      setEmailLog(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to fetch log"));
    } finally {
      setLoading(false);
    }
  }, []);

  const addLogs = useCallback(async (data: AddEmailLogsType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await addEmailLogs(data);
      setAddedEmailLog(response.data);
      setEmailLogs((prev) => [response.data, ...prev]);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to add log"));
    } finally {
      setLoading(false);
    }
  }, []);

  const editLogs = useCallback(async (id: number, data: UpdateEmailLogsType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateEmailLogs(id, data);
      setEditEmailLogs(response.data);
      setEmailLogs((prev) =>
        prev.map((log) => (log.id === id ? { ...log, ...response.data } : log))
      );
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update log"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmaillogs();
  }, [fetchEmaillogs]);

  return (
    <EmailLogsContext.Provider
      value={{
        emaillogs,
        emaillog,
        editEmailLogs,
        addedEmailLog,
        editLogs,
        addLogs,
        fetchEmaillog,
        loading,
        error,
        refetch: fetchEmaillogs,
      }}
    >
      {children}
    </EmailLogsContext.Provider>
  );
};

// Consumer hook, kept next to the context so there is one import for everything
// eslint-disable-next-line react-refresh/only-export-components
export const useEmailLogs = (): EmailLogsContextType => {
  const ctx = useContext(EmailLogsContext);
  if (!ctx) {
    throw new Error("useEmailLogs must be used inside <EmailLogsProvider>");
  }
  return ctx;
};

export default EmailLogsProvider;