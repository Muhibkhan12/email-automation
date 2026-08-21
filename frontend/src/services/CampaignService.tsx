import React from 'react'
import axios from 'axios'


export const getCampaign = async() =>{
    const response = await axios.get("/campaigns/");
    return response.data;
};

export const getCampaignById = async() =>{
    const response = await axios.get("/campaigns/{1}");
    return response.data;
}