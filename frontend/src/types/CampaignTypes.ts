export interface Campaign {
    id : number;
    user_id : number;
    campaign_name : string;
    subject : string;
    template_id : number;
    sender_accout_id : number;
    status : | "Draft" | "Ready" | "Running" | "Paused" | "Completed" | "Cancelled" 
    created_at : string;
    updated_at : string;
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