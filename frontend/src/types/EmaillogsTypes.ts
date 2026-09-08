export type EmailLogsStatus = 'PENDING'| 'SENT'| 'FAILED'


export interface EmailLogs {
    campaign_id : number,
    recipient_id : number,
    sender_account_id : number,
    status : EmailLogsStatus
    error : string
    sent_at : string
    created_at : string;
    updated_at : string;
}
export interface UpdateEmailLogs {
        campaign_id ?: number,
    recipient_id ?: number,
    sender_account_id ?: number,
    status ?: EmailLogsStatus
    error ?: string
    sent_at ?: string
    created_at ?: string;
    updated_at ?: string;
}