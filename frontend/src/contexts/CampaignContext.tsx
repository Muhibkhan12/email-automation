// src/contexts/CampaignContext.tsx
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMyCampaigns,
  getCampaign as getAllCampaigns,
  deleteCampaign,
} from "../services/CampaignService";
import type { Campaign } from "../services/CampaignService";

type CampaignProviderProps = { children: ReactNode };

interface CampaignContextType {
  // ── User slice ─────────────────────────────
  myCampaigns: Campaign[];
  myLoading: boolean;
  myError: string | null;
  fetchMine: () => Promise<void>;
  /** Deletes a campaign and removes it from the user slice. Throws on failure. */
  deleteMine: (id: Campaign["id"]) => Promise<void>;

  // ── Admin slice ────────────────────────────
  allCampaigns: Campaign[];
  allLoading: boolean;
  allError: string | null;
  fetchAll: () => Promise<void>;

  // ── Back-compat (points to the user slice) ──
  /** @deprecated use myCampaigns */
  campaigns: Campaign[];
  /** @deprecated use myLoading */
  loading: boolean;
  /** @deprecated use myError */
  error: string | null;
  /** @deprecated use fetchMine */
  refetch: () => Promise<void>;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  // User slice
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);

  // Admin slice
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);

  const fetchMine = useCallback(async () => {
    setMyLoading(true);
    setMyError(null);
    try {
      const data = await getMyCampaigns();
      setMyCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMyError(err?.message || "Failed to fetch your campaigns");
      setMyCampaigns([]);
    } finally {
      setMyLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    setAllError(null);
    try {
      const data = await getAllCampaigns();
      setAllCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAllError(err?.message || "Failed to fetch campaigns");
      setAllCampaigns([]);
    } finally {
      setAllLoading(false);
    }
  }, []);

  // Not optimistic: the API call must succeed before the row is removed.
  // Errors propagate so the calling UI can display them.
  const deleteMine = useCallback(async (id: Campaign["id"]) => {
    await deleteCampaign(id);
    setMyCampaigns((prev) => prev.filter((c) => c.id !== id));
    setAllCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // No auto-fetch. Each page declares what it needs.

  const value = useMemo<CampaignContextType>(
    () => ({
      myCampaigns, myLoading, myError, fetchMine, deleteMine,
      allCampaigns, allLoading, allError, fetchAll,
      // back-compat
      campaigns: myCampaigns,
      loading: myLoading,
      error: myError,
      refetch: fetchMine,
    }),
    [
      myCampaigns, myLoading, myError, fetchMine, deleteMine,
      allCampaigns, allLoading, allError, fetchAll,
    ]
  );

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const ctx = useContext(CampaignContext);
  if (ctx === undefined) {
    throw new Error("useCampaigns must be used within a CampaignProvider");
  }
  return ctx;
};