import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
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

const HtmlTemplatesContext = createContext<HtmlTemplatesContextType | undefined>(
  undefined
);

/** Normalizes whatever the API returns into a flat array. */
const normalizeTemplates = (raw: unknown): HtmlTemplates[] => {
  if (Array.isArray(raw)) return raw as HtmlTemplates[];

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // try the most common wrapper keys
    for (const key of ["data", "results", "templates", "items", "rows"]) {
      if (Array.isArray(obj[key])) return obj[key] as HtmlTemplates[];
    }
  }

  return [];
};

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

        const raw = await getHTMLTemplates();

        // 🔍 Debug: remove once things work
        console.log("[HtmlTemplates] raw response:", raw);
        console.log("[HtmlTemplates] isArray:", Array.isArray(raw));

        const data = normalizeTemplates(raw);

        console.log("[HtmlTemplates] normalized count:", data.length);

        if (isMounted) {
          setTemplates(data);
        }
      } catch (err) {
        console.error("Failed to fetch HTML templates:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load templates."
          );
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

export const useHtmlTemplates = () => {
  const context = useContext(HtmlTemplatesContext);
  if (!context) {
    throw new Error(
      "useHtmlTemplates must be used within a HtmlTemplatesProvider"
    );
  }
  return context;
};

export default HtmlTemplatesProvider;