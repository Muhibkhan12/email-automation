import { createContext,useState,useEffect, type ReactNode } from 'react';
import type{ UpdateEmailLogsType,EmailLogs } from '../types/EmaillogsTypes'
import { addEmailLogs,getEmaillog,updateEmailLogs } from '../services/EmailLogServices'

type EmailLogsProvideProps = {
    children : ReactNode;
}

interface EmailLogsContextType {
    emaillogs: EmailLogs[];
    loading : boolean;
    error : string | null ;
    refetch : () => Promise<void>;
}

export const EmailLogsContext = createContext<EmailLogsContextType | undefined>(undefined);

const EmaillogsProvider = ({ children }: EmailLogsProvideProps)  => {
    const [emaillogs, setEmailLogs] = useState<EmailLogs[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEmaillogs = async() => {
        setLoading(true);
        setError(null);
        try{
            const data = await getEmaillog();
            setEmailLogs(data);
        }catch(err : any){
            setError(err.message || 'Failed to fetch campaigns');
        }finally{
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchEmaillogs();
    }, []);

  return (
    <EmailLogsContext.Provider value={{ emaillogs, loading, error, refetch : fetchEmaillogs}}>
        {children}
    </EmailLogsContext.Provider>
  );
}

export default EmaillogsProvider