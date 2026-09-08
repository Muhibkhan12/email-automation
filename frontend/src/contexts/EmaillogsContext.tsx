import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UpdateEmailLogsType, EmailLogs } from '../types/EmaillogsTypes'
import { getEmaillog, updateEmailLogs } from '../services/EmailLogServices'

type EmailLogsProviderProps = {
    children: ReactNode;
}

interface EmailLogsContextType {
    emaillogs: EmailLogs[];
    editEmailLogs: EmailLogs | null;
    editLogs: (id: number, data: UpdateEmailLogsType) => Promise<void>;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const EmailLogsContext = createContext<EmailLogsContextType | undefined>(undefined);

const EmailLogsProvider = ({ children }: EmailLogsProviderProps) => {
    const [emaillogs, setEmailLogs] = useState<EmailLogs[]>([]);
    const [editEmailLogs, setEditEmailLogs] = useState<EmailLogs | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEmaillogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getEmaillog();
            setEmailLogs(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch email logs');
        } finally {
            setLoading(false);
        }
    }, []);

    const editLogs = useCallback(async (id: number, data: UpdateEmailLogsType) => {
        setLoading(true);
        setError(null);
        try {
            const updatedLog = await updateEmailLogs(id, data);
            setEditEmailLogs(updatedLog);
            setEmailLogs(prev =>
                prev.map(log => (log.id === id ? { ...log, ...updatedLog } : log))
            );
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                err.message ||
                'Failed to update Logs'
            )
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmaillogs();
    }, [fetchEmaillogs]);

    return (
        <EmailLogsContext.Provider value={{ emaillogs, editEmailLogs, editLogs, loading, error, refetch: fetchEmaillogs }}>
            {children}
        </EmailLogsContext.Provider>
    );
}

export default EmailLogsProvider