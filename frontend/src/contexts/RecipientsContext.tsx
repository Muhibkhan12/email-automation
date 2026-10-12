import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { CampaignRecipient } from "../types/CampaignTypes";
import type { UpdateRecpient } from "../types/RecipientTypes";
import {
    getRecipientsByCampaign,
    getRecipientsService,
    getRecipientsServiceById,
    updateRecipient,
} from "../services/RecipientService";

interface RecipientProviderProps {
    children: ReactNode;
}

// Totals across ALL matching rows (not just the current page)
export interface RecipientSummary {
    total: number;
    sent: number;
    failed: number;
    pending: number; // Pending + Queued + Sending
}

const EMPTY_SUMMARY: RecipientSummary = { total: 0, sent: 0, failed: 0, pending: 0 };

interface RecipientsType {
    recipients: CampaignRecipient[];
    loading: boolean;
    error: string | null;
    total: number;        // rows matching current search/filter (all pages)
    pageCount: number;    // rows on the current page (from backend)
    page: number;
    limit: number;
    summary: RecipientSummary;                 // NEW
    statusCounts: Record<string, number>;      // NEW
    getRecipientsUsingCampaignId: (id: number) => Promise<void>;
    getAllRecipients: (
        page?: number,
        limit?: number,
        uploadId?: number,
        search?: string,
        status?: string
    ) => Promise<void>;
    getRecipientById: (id: number) => Promise<CampaignRecipient | undefined>;
    updateRecipientById: (id: number, data: UpdateRecpient) => Promise<void>;
}

const RecipientsContext = createContext<RecipientsType | undefined>(undefined);

const RecipientsContextProvider = ({ children }: RecipientProviderProps) => {
    const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [total, setTotal] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);

    // NEW: analytics computed by the server over every matching row
    const [summary, setSummary] = useState<RecipientSummary>(EMPTY_SUMMARY);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ All: 0 });

    const requestId = useRef(0);

    const getRecipientsUsingCampaignId = async (campaign_id: number) => {
        try {
            setLoading(true);
            setError(null);

            const data = await getRecipientsByCampaign(campaign_id);

            setRecipients(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch Recipients");
        } finally {
            setLoading(false);
        }
    };

    const getAllRecipients = async (
        p: number = 1,
        l: number = 20,
        uploadId?: number,
        search?: string,
        status?: string
    ) => {
        const myRequest = ++requestId.current;
        try {
            setLoading(true);
            setError(null);

            const res = await getRecipientsService({
                page: p,
                limit: l,
                uploadId,
                search,
                status,
            });

            if (myRequest !== requestId.current) return;

            const list: CampaignRecipient[] = Array.isArray(res?.data) ? res.data : [];
            const pg = res?.pagination;

            setRecipients(list);
            setTotal(pg?.total ?? list.length);
            setPageCount(pg?.count ?? list.length);
            setPage(pg?.page ?? p);
            setLimit(pg?.limit ?? l);

            // NEW
            setSummary({ ...EMPTY_SUMMARY, ...(res?.summary ?? {}) });
            setStatusCounts(res?.status_counts ?? { All: pg?.total ?? list.length });
        } catch (err: any) {
            if (myRequest !== requestId.current) return;
            setError(err?.response?.data?.detail || err.message || "Failed to fetch Recipients");
        } finally {
            if (myRequest === requestId.current) setLoading(false);
        }
    };

    const getRecipientById = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const data = await getRecipientsServiceById(id);
            return data;
        } catch (err: any) {
            setError(err.message || "Failed to fetch Recipient");
            return undefined;
        } finally {
            setLoading(false);
        }
    };

    const updateRecipientById = async (id: number, data: UpdateRecpient) => {
        try {
            setLoading(true);
            setError(null);

            const updated = await updateRecipient(id, data);

            setRecipients((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ...(updated?.data ?? updated) } : r))
            );
        } catch (err: any) {
            setError(err.message || "Failed to update Recipient");
        } finally {
            setLoading(false);
        }
    };

    return (
        <RecipientsContext.Provider
            value={{
                recipients,
                loading,
                error,
                total,
                pageCount,
                page,
                limit,
                summary,
                statusCounts,
                getRecipientsUsingCampaignId,
                getAllRecipients,
                getRecipientById,
                updateRecipientById,
            }}
        >
            {children}
        </RecipientsContext.Provider>
    );
};

export const useRecipients = () => {
    const context = useContext(RecipientsContext);
    if (!context) {
        throw new Error("useRecipients must be used within a RecipientsContextProvider");
    }
    return context;
};

export default RecipientsContextProvider;