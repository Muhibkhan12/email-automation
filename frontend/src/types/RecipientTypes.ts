export type RecipientStatus = 'Pending' | 'Queued' | 'Sending' | 'Sent' | 'Failed';

export interface UpdateRecpient{
	campaign_id ?: number
	upload_id ?: number
	name ?: string
	email ?: string
	company ?: string
	phone ?: string
	is_valid_email ?: boolean
	status : RecipientStatus
}

export interface Recipient {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    status: RecipientStatus;
    sent_at: string | null; // ISO date string ya null
}