import { createContext, useState, useEffect } from "react";
import { getCampaign } from "../services/CampaignService";

export const CampaignContext = createContext(null);

export const CampaignProvider = ({ children }) => {

  const [campaign, setCampaign] = useState([]);

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