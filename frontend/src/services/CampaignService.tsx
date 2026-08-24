import axios from 'axios'
import type{ UpdatedCampaignData, CreateCampaignData,Campaign } from '../types/CampaignTypes';


export const getCampaign = async() =>{
    const response = await axios.get("/campaigns/");
    return response.data;
};

export const getCampaignById = async(id : number) =>{
    const response = await axios.get(`/campaigns/${id}`);
    return response.data;
}

export const createCampaign = async(data : CreateCampaignData) => {
    const response = await axios.post(`/campaigns/`, data);
    return response.data
}

export const deleteCampaign = async(id : number): Promise<void> => {
    await axios.delete(`/campaigns/${id}`) ;
};

export const updateCampaignById = async(id : number, data : UpdatedCampaignData): Promise<Campaign> =>  {
    const response = await axios.put(`/campaigns/${id}`, data);
    return response.data;
};