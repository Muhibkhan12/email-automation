import { createContext, useState, useEffect, type ReactNode } from "react";
import { getCampaign } from "../services/CampaignService";


type CampaignProviderProps = {
  children: ReactNode;
};


type Campaign = {
  id: number;
  user_id: number;
  campaign_name: string;
  subject: string;
  template_id: number;
  sender_account_id: number;

  status:
    | "DRAFT"
    | "READY"
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "CANCELLED";

  created_at: string;
  updated_at: string;
};


export const CampaignContext = createContext<Campaign[]>([]);


export const CampaignProvider = ({
  children
}: CampaignProviderProps) => {

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