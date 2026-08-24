import React from 'react'
import axios from 'axios'
import { UpdatedCampaignData, CreateCampaignData,Campaign } from '../types/CampaignTypes';
import Campaign from '../pages/User/Campaign';


export const getCampaign = async() =>{
    const response = await axios.get("/campaigns/");
    return response.data;
};

export const getCampaignById = async(id : number) =>{
    const response = await axios.get(`/campaigns/${id}`);
    return response.data;
}

export const deleteCampaign = async(id : Number): Promise<void> => {
    await axios.delete(`/campaigns/${id}`) ;
}

export const updateCampaignById = async(id : number, data : UpdatedCampaignData) => Promise<Campaign> {
    const response = await axios.put(`/campaign/${id},${data}`);
    return response.data;
}