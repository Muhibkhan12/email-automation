export interface HtmlTemplates {
  id: number | string;
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
  created_at?: string;
  updated_at?: string;
}
 
/** Fields the API accepts on create / update. */
export interface updateHtmlTemplates {
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
}
 
export interface htmlTemplateId {
  id: number;
}

// types/HtmlTemplatesTypes.ts

export interface HtmlTemplates {
  id: number | string;
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
  created_at?: string;
  updated_at?: string;
}

/** Fields the API accepts on create / update. */
export interface updateHtmlTemplates {
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
}