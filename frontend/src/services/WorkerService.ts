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

/** Shape of GET /worker/progress/{campaign_id} */
export interface CampaignProgressDTO {
  status: string;
  sent: number;
  pending: number;
  queued: number;
  failed: number;
  total: number;
  next_send_at: string | null;      // naive UTC ISO, ends with "Z"
  estimated_finish_at: string | null; // naive UTC ISO, ends with "Z"
}

// POST /worker/start/{campaign_id}  body: { upload_id }
// This is the ONLY place sending actually begins. Backend always starts NOW;
// random-gap scheduling happens server-side inside dispatch_campaign.
export const startCampaign = async (
  campaignId: number,
  uploadId: number
): Promise<CampaignDTO> => {
  await api.post(`/worker/start/${campaignId}`, { upload_id: uploadId });
  return { id: campaignId, status: "running" };
};

// POST /worker/pause/{campaign_id}
export const pauseCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  await api.post(`/worker/pause/${campaignId}`);
  return { id: campaignId, status: "paused" };
};

// POST /worker/resume/{campaign_id}
// Backend re-randomises gaps for remaining PENDING recipients, then flips to RUNNING.
export const resumeCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  await api.post(`/worker/resume/${campaignId}`);
  return { id: campaignId, status: "running" };
};

// NOTE: There is NO cancel endpoint in the backend you shared.
// This stub returns a paused-like shape so the UI doesn't crash, but you should
// implement POST /worker/cancel/{campaign_id} server-side (set campaign → PAUSED
// or a dedicated CANCELLED status, and mark remaining recipients so the dispatcher
// skips them). Until then, calling this will throw a 404 from the API.
export const cancelCampaign = async (campaignId: number): Promise<CampaignDTO> => {
  throw new Error(
    "Cancel is not implemented on the backend yet. Add POST /worker/cancel/{campaign_id}."
  );
};

// GET /worker/progress/{campaign_id}
// This is what the UI should poll — it drives sent/failed/pending + next/finish.
export const getCampaignProgress = async (
  campaignId: number
): Promise<CampaignProgressDTO> => {
  const { data } = await api.get(`/worker/progress/${campaignId}`);
  return data.data as CampaignProgressDTO;
};

/** Parse a backend "naive UTC + Z" timestamp safely. Returns null if invalid. */
export const parseUtc = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  // Backend emits "2024-01-01T12:00:00Z" but the value is naive UTC.
  // new Date("...Z") treats it as UTC, which is what we want.
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return isNaN(d.getTime()) ? null : d;
};