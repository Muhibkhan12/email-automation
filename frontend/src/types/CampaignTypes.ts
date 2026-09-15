
export type RecipientStatus = 'Pending' | 'Queued' | 'Sending' | 'Sent' | 'Failed';

export type EmailLogStatus = 'Pending' | 'Sent' | 'Failed';

export type UploadStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface CampaignUser {
  id: number;
  username: string;
  email: string;
}

export interface CampaignTemplate {
  id: number;
  name: string;
  html_content: string;
}

export interface CampaignSenderAccount {
  id: number;
  display_name: string;
  email: string;
}

export interface CampaignEmailLog {
  id: number;
  recipient_id: number;
  status: EmailLogStatus;
  sent_at: string | null;
}

export interface CampaignUpload {
  id: number;
  original_filename: string;
  status: UploadStatus;
  total_records: number;
  processed_records: number;
}

export interface CampaignRecipient {
  id: number;
  name: string;
  email: string;
  status: RecipientStatus;
}
export interface Campaign {
  id: number;
  user_id: number;
  campaign_name: string;
  subject: string;
  template_id: number;
  sender_account_id: number;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  user: CampaignUser;
  template: CampaignTemplate;
  sender_account: CampaignSenderAccount;
  email_logs: CampaignEmailLog[];
  uploads: CampaignUpload[];
  recipients: CampaignRecipient[];
}
export interface CampaignStatus{
    status : | "Draft" | "Ready" | "Running" | "Paused" | "Completed" | "Cancelled" 
}

export interface CreateCampaignData {
    campaign_name: string;
    subject: string;
    template_id: number;
    sender_account_id: number;
    status?: Campaign["status"];
}

export type UpdatedCampaignData = Partial<CreateCampaignData>;