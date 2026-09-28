import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getMyCampaigns,
  getCampaign as getAllCampaigns,
} from "../services/CampaignService";
import type { Campaign } from "../services/CampaignService";

type CampaignProviderProps = { children: ReactNode };

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchAll: () => Promise<void>;      // <-- new
  fetchMine: () => Promise<void>;     // <-- new
}

export const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runFetch = async (fn: () => Promise<Campaign[]>, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fn();
      console.log(`[CampaignContext] ${label}:`, data?.length, "campaigns");
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(`[CampaignContext] ${label} failed:`, err);
      setError(err?.message || "Failed to fetch campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = () => runFetch(getAllCampaigns, "fetchAll");
  const fetchMine = () => runFetch(getMyCampaigns, "fetchMine");

  // Default: fetch my campaigns (existing behaviour)
  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        loading,
        error,
        refetch: fetchMine,   // keep old name working
        fetchAll,
        fetchMine,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaigns must be used within a CampaignProvider");
  }
  return context;
};