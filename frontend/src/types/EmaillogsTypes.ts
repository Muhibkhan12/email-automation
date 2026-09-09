// types/EmailLogsTypes.ts

export type EmailLogsStatus = 'PENDING' | 'SENT' | 'FAILED';

// Base EmailLog with only the fields from your database
export interface EmailLogs {
    id: number;
    campaign_id: number;
    recipient_id: number;
    sender_account_id: number;
    status: EmailLogsStatus;
    error_message: string | null;  // Changed from 'error' to 'error_message'
    sent_at: string | null;        // Can be null
    created_at: string;
    updated_at: string;
    
    // 👇 EXTRA FIELDS FROM RELATED TABLES (coming from backend)
    campaign_name: string;          // From campaign table
    recipient_email: string;        // From recipient table  
    sender_email: string;           // From sender_account table
}

// For updating email logs
export interface UpdateEmailLogsType {
    status?: EmailLogsStatus;
    error_message?: string | null;  // Changed from 'error' to 'error_message'
    sent_at?: string | null;
}

// For adding new email logs
export interface AddEmailLogsType {
    campaign_id: number;
    recipient_id: number;
    sender_account_id: number;
    status?: EmailLogsStatus;
    error_message?: string | null;
    sent_at?: string | null;
}