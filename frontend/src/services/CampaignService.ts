// src/services/CampaignService.ts
import api from "../libs/Axios";

export type CampaignStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface Campaign {
  id: number;
  user_id: number;
  campaign_name: string;
  subject: string;
  template_id: number;
  sender_account_id?: number;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  campaign_name: string;
  subject: string;
  template_id: number;
  sender_account_id?: number;
  status?: CampaignStatus;
}

export type UpdateCampaignData = Partial<CreateCampaignData>;

/* ── helper ─────────────────────────────────────────── */

const unwrapList = (body: any): any[] => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const unwrapOne = (body: any) => {
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
};

/* ── READ ───────────────────────────────────────────── */

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

/* ── CREATE ─────────────────────────────────────────── */

export const createCampaign = async (
  data: CreateCampaignData
): Promise<Campaign> => {
  const response = await api.post("/campaigns/", data);
  return unwrapOne(response.data);
};

/* ── UPDATE ─────────────────────────────────────────── */
// backend: @router.patch("/update/{id}")

export const updateCampaign = async (
  id: number,
  data: UpdateCampaignData
): Promise<Campaign> => {
  const response = await api.patch(`/campaigns/update/${id}`, data);
  return unwrapOne(response.data);
};

/* ── DELETE ─────────────────────────────────────────── */
// backend: @router.delete("/delete/{id}")

export const deleteCampaign = async (id: number): Promise<void> => {
  await api.delete(`/campaigns/delete/${id}`);
};

/* ── START ──────────────────────────────────────────── */
// NOTE: backend does not expose this yet — add it or remove the button

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