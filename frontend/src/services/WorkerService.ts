import api from "../libs/Axios";

/** Loose on purpose: every field optional so any backend response fits. */
export interface CampaignDTO {
  id?: number;
  status?: string;
  sent_count?: number;
  failed_count?: number;
  total_count?: number;
  [key: string]: any;
}

// POST /worker/start/{campaign_id}  body: { upload_id }
// This is the ONLY place sending actually begins.
export const startCampaign = async (
  campaignId: number,
  uploadId: number
): Promise<CampaignDTO> => {
  await api.post(`/worker/start/${campaignId}`, { upload_id: uploadId });
  return { id: campaignId, status: "running" };
};

/*
 * NOTE: pause / resume / cancel endpoints are NOT in the backend you've
 * shared so far. These paths are assumptions; change them to match your
 * campaigns router (or tell me and I'll write the backend side).
 */
export const pauseCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  await api.post(`/campaigns/${campaignId}/pause`);
  return { id: campaignId, status: "paused" };
};

export const resumeCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  await api.post(`/campaigns/${campaignId}/resume`);
  return { id: campaignId, status: "running" };
};

export const cancelCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  await api.post(`/campaigns/${campaignId}/cancel`);
  return { id: campaignId, status: "cancelled" };
};