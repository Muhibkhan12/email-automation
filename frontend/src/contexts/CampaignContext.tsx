import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { getCampaign } from "../services/CampaignService";
import type { Campaign } from "../services/CampaignService";

type CampaignProviderProps = {
  children: ReactNode;
};

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaign();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <CampaignContext.Provider value={{ campaigns, loading, error, refetch: fetchCampaigns }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
};