// contexts/HtmlTemplatesContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { HtmlTemplates } from "../types/HtmlTemplatesTypes";
import {
  getHTMLTemplates,
  createHtmlTemplates,
  editHtmlTemplates,
  deleteHtmlTemplates,
  type TemplatePayload,
} from "../services/TemplateService";

type HtmlTemplatesContextType = {
  templates: HtmlTemplates[];
  setTemplates: React.Dispatch<React.SetStateAction<HtmlTemplates[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTemplate: (payload: TemplatePayload) => Promise<HtmlTemplates>;
  updateTemplate: (id: number | string, payload: TemplatePayload) => Promise<HtmlTemplates>;
  deleteTemplate: (id: number | string) => Promise<void>;
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
    for (const key of ["data", "results", "templates", "items", "rows"]) {
      if (Array.isArray(obj[key])) return obj[key] as HtmlTemplates[];
    }
  }

  return [];
};

const getId = (t: unknown): string => {
  const r = t as any;
  return String(r?.id ?? r?._id ?? "");
};

const apiError = (err: unknown): Error => {
  const e = err as any;
  const msg =
    e?.response?.data?.message ||
    (e?.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(", ")
      : null) ||
    (err instanceof Error ? err.message : "Something went wrong");
  return new Error(msg);
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
        const data = normalizeTemplates(raw);

        if (isMounted) setTemplates(data);
      } catch (err) {
        console.error("Failed to fetch HTML templates:", err);
        if (isMounted) setError(apiError(err).message || "Failed to load templates.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  /* ───────── CREATE ───────── */
  const createTemplate = useCallback(async (payload: TemplatePayload) => {
    try {
      const created = await createHtmlTemplates(payload);
      // fallback in case the API returns an empty body
      const item: HtmlTemplates = {
        ...(payload as unknown as HtmlTemplates),
        ...created,
      };
      setTemplates((prev) => [item, ...prev]);
      return item;
    } catch (err) {
      throw apiError(err);
    }
  }, []);

  /* ───────── UPDATE ───────── */
  const updateTemplate = useCallback(
    async (id: number | string, payload: TemplatePayload) => {
      try {
        const updated = await editHtmlTemplates(id, payload);
        let merged: HtmlTemplates = { ...(payload as unknown as HtmlTemplates), id };
        setTemplates((prev) =>
          prev.map((t) => {
            if (getId(t) !== String(id)) return t;
            merged = { ...t, ...payload, ...updated } as HtmlTemplates;
            return merged;
          })
        );
        return merged;
      } catch (err) {
        throw apiError(err);
      }
    },
    []
  );

  /* ───────── DELETE ───────── */
  const deleteTemplate = useCallback(async (id: number | string) => {
    try {
      await deleteHtmlTemplates(id);
      setTemplates((prev) => prev.filter((t) => getId(t) !== String(id)));
    } catch (err) {
      throw apiError(err);
    }
  }, []);

  return (
    <HtmlTemplatesContext.Provider
      value={{
        templates,
        setTemplates,
        loading,
        error,
        refetch: () => setRefetchTrigger((n) => n + 1),
        createTemplate,
        updateTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </HtmlTemplatesContext.Provider>
  );
};

export const useHtmlTemplates = () => {
  const context = useContext(HtmlTemplatesContext);
  if (!context) {
    throw new Error("useHtmlTemplates must be used within a HtmlTemplatesProvider");
  }
  return context;
};

export default HtmlTemplatesProvider;