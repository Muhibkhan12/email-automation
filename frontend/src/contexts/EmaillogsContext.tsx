// contexts/EmaillogsContext.tsx
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UpdateEmailLogsType, EmailLogs } from '../types/EmaillogsTypes';
import { addEmailLogs, getEmaillog, updateEmailLogs, getEmaillogById } from '../services/EmailLogServices';

type EmailLogsProviderProps = {
    children: ReactNode;
}

interface EmailLogsContextType {
    emaillogs: EmailLogs[];
    emaillog: EmailLogs | null;
    editEmailLogs: EmailLogs | null;
    addedEmailLog: EmailLogs | null;
    editLogs: (id: number, data: UpdateEmailLogsType) => Promise<void>;
    addLogs: (data: EmailLogs) => Promise<void>;
    fetchEmaillog: (id: number) => Promise<void>;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const EmailLogsContext = createContext<EmailLogsContextType | undefined>(undefined);

const EmailLogsProvider = ({ children }: EmailLogsProviderProps) => {
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
            console.log("📦 Full API Response:", response);
            
            // ✅ FIX: Extract the data array from response
            // Your API returns { count: 4, data: [...] }
            const logsData = response?.data || [];
            
            console.log("📊 Extracted logs data:", logsData);
            console.log("📊 Number of logs:", logsData.length);
            
            // ✅ Set ONLY the array, not the whole response object
            setEmailLogs(logsData);
        } catch (err: any) {
            console.error("❌ Failed to fetch email logs:", err);
            setError(err.message || 'Failed to fetch email logs');
            setEmailLogs([]);
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

    const addLogs = useCallback(async (data: EmailLogs) => {
        setLoading(true);
        setError(null);
        try {
            const addData = await addEmailLogs(data);
            setAddedEmailLog(addData);
            setEmailLogs(prev => [...prev, addData]);
        } catch (err: any) {
            setError(err.message || 'Failed to add data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmaillog = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const emailLogUsingId = await getEmaillogById(id);
            setEmailLog(emailLogUsingId);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch log');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmaillogs();
    }, [fetchEmaillogs]);

    return (
        <EmailLogsContext.Provider value={{ 
            emaillogs, 
            emaillog, 
            editEmailLogs, 
            addedEmailLog, 
            editLogs, 
            addLogs, 
            fetchEmaillog, 
            loading, 
            error, 
            refetch: fetchEmaillogs 
        }}>
            {children}
        </EmailLogsContext.Provider>
    );
}

export default EmailLogsProvider;