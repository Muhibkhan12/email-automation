import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { HtmlTemplates } from "../types/HtmlTemplatesTypes";
import { getHTMLTemplates } from "../services/TemplateService";

type HtmlTemplatesContextType = {
  templates: HtmlTemplates[];
  setTemplates: React.Dispatch<React.SetStateAction<HtmlTemplates[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type HtmlTemplatesProp = {
  children: ReactNode;
};

const HtmlTemplatesContext = createContext<HtmlTemplatesContextType | undefined>(undefined);

const HtmlTemplatesProvider = ({ children }: HtmlTemplatesProp) => {
  const [templates, setTemplates] = useState<HtmlTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getHTMLTemplates();
        if (isMounted) {
          setTemplates(data);
        }
      } catch (err) {
        console.error("Failed to fetch HTML templates:", err);
        if (isMounted) {
          setError("Failed to load templates.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  return (
    <HtmlTemplatesContext.Provider
      value={{
        templates,
        setTemplates,
        loading,
        error,
        refetch: () => setRefetchTrigger((n) => n + 1),
      }}
    >
      {children}
    </HtmlTemplatesContext.Provider>
  );
};

// Hook usi file mein — koi extra file nahi
export const useHtmlTemplates = () => {
  const context = useContext(HtmlTemplatesContext);
  if (!context) {
    throw new Error("useHtmlTemplates must be used within a HtmlTemplatesProvider");
  }
  return context;
};

export default HtmlTemplatesProvider;