import { createContext, useState, useEffect, type ReactNode } from "react";
import { getCampaign } from "../services/CampaignService";
import type { Campaign } from "../types/CampaignTypes";

type CampaignProviderProps = {
  children: ReactNode;
};

export const CampaignContext = createContext<Campaign[]>([]);

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
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