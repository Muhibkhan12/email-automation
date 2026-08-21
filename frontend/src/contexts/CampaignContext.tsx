import { createContext, useState, useEffect, ReactNode } from "react";
import { getCampaign } from "../services/CampaignService";
import Campaign from "../pages/User/Campaign";


type campaignProviderProps = {
    children : ReactNode;
}

export const CampaignContext = createContext(null);

export const CampaignProvider = ({ children } : campaignProviderProps ) => {

  const [campaign, setCampaign] = useState<Campaign[]>([]);

  useEffect(() => {

    const fetchCampaign = async () => {

      const data = await getCampaign();

      setCampaign(data);
    };

    fetchCampaign();

  }, []);

  return (
    <CampaignContext.Provider value={campaign}>
      {children}
    </CampaignContext.Provider>
  );
};