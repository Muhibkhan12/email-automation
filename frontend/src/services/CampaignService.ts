// src/services/CampaignService.ts
import api from "../libs/Axios";

export type CampaignStatus =
  | "Draft"
  | "Ready"
  | "Running"
  | "Paused"
  | "Completed"
  | "Cancelled";

export interface Campaign {
  id: number;
  user_id: number;
  campaign_name: string;
  subject: string;
  template_id: number;
  sender_account_id?: number;
  status: CampaignStatus;
  recipient_count?: number;
  sent_count?: number;
  failed_count?: number;
  total_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Matches backend `AddCampaignSchema` EXACTLY:
 *   user_id: int              (required)
 *   template_id: int          (required)
 *   sender_account_id: int    (required)
 *   campaign_name: str        (required)
 *   subject: str              (required)
 *   status: CampaignStatus    (optional, defaults to Draft)
 */
export interface CreateCampaignData {
  user_id: number;
  template_id: number;
  sender_account_id: number;
  campaign_name: string;
  subject: string;
  status?: CampaignStatus;
}

export type UpdateCampaignData = Partial<CreateCampaignData>;

const unwrapList = (body: any): any[] => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const unwrapOne = (body: any) => {
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
};

export const getCampaign = async (): Promise<Campaign[]> => {
  try {
    const response = await api.get("/campaigns/");
    return unwrapList(response.data);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
};

export const getMyCampaigns = async (): Promise<Campaign[]> => {
  try {
    const response = await api.get("/campaigns/my");
    return unwrapList(response.data);
  } catch (error) {
    console.error("Error fetching my campaigns:", error);
    return [];
  }
};

export const getCampaignById = async (id: number): Promise<Campaign | null> => {
  try {
    const response = await api.get(`/campaigns/${id}`);
    return unwrapOne(response.data) ?? null;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }
};

export const createCampaign = async (
  data: CreateCampaignData
): Promise<Campaign> => {
  const response = await api.post("/campaigns/", data);

  // Backend add_campaign returns: { message, campaign: {...} }
  const body = response.data;
  if (body && typeof body === "object" && "campaign" in body) {
    return body.campaign as Campaign;
  }
  // Fallback for endpoints that wrap in { data: ... }
  return unwrapOne(body);
};

export const updateCampaign = async (
  id: number,
  data: UpdateCampaignData
): Promise<Campaign> => {
  const response = await api.patch(`/campaigns/update/${id}`, data);
  return unwrapOne(response.data);
};

export const deleteCampaign = async (id: number): Promise<void> => {
  await api.delete(`/campaigns/delete/${id}`);
};

export const startCampaign = async (id: number): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/start`);
  return unwrapOne(response.data);
};

export const getCampaignProgress = async (id: number): Promise<any> => {
  const response = await api.get(`/campaigns/${id}/progress`);
  return unwrapOne(response.data);
};

export default {
  getCampaign,
  getMyCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  getCampaignProgress,
};