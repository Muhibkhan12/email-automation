import { createContext, useState, type ReactNode } from "react";
import type { CampaignRecipient } from "../types/CampaignTypes";
import { getCampaignById } from "../services/CampaignService";

interface RecipientProviderProps {
    children: ReactNode;
}

interface RecipientsType {
    recipients: CampaignRecipient[];
    loading: boolean;
    error: string;
    getCampaignUsingId: (id: number) => Promise<void>;
}

const RecipientsContext = createContext<RecipientsType | undefined>(
    undefined
);

const RecipientsContextProvider = ({
    children,
}: RecipientProviderProps) => {
    const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getCampaignUsingId = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const data = await getCampaignById(id);

            setRecipients(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch campaigns");
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
                getCampaignUsingId,
            }}
        >
            {children}
        </RecipientsContext.Provider>
    );
};

export default RecipientsContextProvider;