import { createContext, useState, type ReactNode } from "react";
import type { HtmlTemplates } from "../types/HtmlTemplatesTypes";

type HtmlTemplatesContextType = {
  templates: HtmlTemplates[];
  setTemplates: React.Dispatch<React.SetStateAction<HtmlTemplates[]>>;
};

type HtmlTemplatesProp = {
  children: ReactNode;
};

export const HtmlTemplatesContext =
  createContext<HtmlTemplatesContextType | undefined>(undefined);

const HtmlTemplatesProvider = ({ children }: HtmlTemplatesProp) => {
  const [templates, setTemplates] = useState<HtmlTemplates[]>([]);

  return (
    <HtmlTemplatesContext.Provider
      value={{
        templates,
        setTemplates,
      }}
    >
      {children}
    </HtmlTemplatesContext.Provider>
  );
};

export default HtmlTemplatesProvider;