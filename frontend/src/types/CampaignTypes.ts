export interface Campaign {
    id : number;
    user_id : number;
    campaign_name : string;
    subject : string;
    template_id : number;
    sender_accout_id : number;
    status : | "DRAFT" | "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";
    created_at : string;
    updated_at : string;
}

export interface CreateCampaignData {
    campaign_name: string;
    subject: string;
    template_id: number;
    sender_account_id: number;
    status?: Campaign["status"];
}

export type UpdatedCampaignData = Partial<CreateCampaignData>;