import api from "../libs/Axios";

export interface Campaign {
  id: number;
  user_id: number;
  campaign_name: string;
  subject: string;
  template_id: number;
  status: 'DRAFT' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export const getCampaign = async (): Promise<Campaign[]> => {
  try {
    const response = await api.get('/campaigns');
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

export const getMyCampaigns = async (): Promise<Campaign[]> => {
  try {
    const response = await api.get('/campaigns/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns', error);
    return [];
  }
};

export const getCampaignById = async (id: number): Promise<Campaign | null> => {
  try {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
};

export const createCampaign = async (data: any): Promise<Campaign> => {
  const response = await api.post('/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id: number, data: any): Promise<Campaign> => {
  const response = await api.put(`/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id: number): Promise<void> => {
  await api.delete(`/campaigns/${id}`);
};

export const startCampaign = async (id: number): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/start`);
  return response.data;
};

export const getCampaignProgress = async (id: number): Promise<any> => {
  const response = await api.get(`/campaigns/${id}/progress`);
  return response.data;
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