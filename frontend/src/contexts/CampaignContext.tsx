import React, { createContext } from 'react'
import { useContext,useState,useEffect } from 'react'
import { getCampaign } from '../services/CampaignService'

export const campaignContext = createContext("null");

export const campaignProvider = ({children}) =>{
    const [campaign, setCampaign] = useState([])

    useEffect(() => {
        const fetchCampaign = async ()=>{
            const data = await getCampaign();

            setCampaign(data);
        }
        fetchCampaign();
    },[]);

    return (
        <campaignContext.Provider value={campaigns}>
            {children}
        </campaignContext.Provider>  
    );
    

}