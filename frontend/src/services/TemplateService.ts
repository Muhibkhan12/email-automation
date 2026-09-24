// services/TemplateService.ts
import api from "../libs/Axios";
import type { HtmlTemplates } from "../types/HtmlTemplatesTypes";

/** Shape sent to the API on create / update. */
export interface TemplatePayload {
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
}

/**
 * Laravel resources usually reply with { data: {...} }.
 * This handles both wrapped and unwrapped responses.
 */
const unwrap = <T,>(res: { data: any }): T => (res.data?.data ?? res.data) as T;

/* ───────── READ (list) ───────── */
export const getHTMLTemplates = async (): Promise<HtmlTemplates[]> => {
  const response = await api.get("/html-templates");
  return response.data.data ?? response.data;
};

/* ───────── READ (single) ───────── */
export const getHTMLTemplatesById = async (id: number | string): Promise<HtmlTemplates> => {
  const response = await api.get(`/html-templates/${id}`);
  return unwrap<HtmlTemplates>(response);
};

/* ───────── CREATE ───────── */
export const createHtmlTemplates = async (data: TemplatePayload): Promise<HtmlTemplates> => {
  const response = await api.post("/html-templates", data);
  return unwrap<HtmlTemplates>(response);
};

/* ───────── UPDATE ───────── */
export const editHtmlTemplates = async (
  id: number | string,
  data: TemplatePayload
): Promise<HtmlTemplates> => {
  const response = await api.put(`/html-templates/${id}`, data);
  return unwrap<HtmlTemplates>(response);
};

/* ───────── DELETE ───────── */
export const deleteHtmlTemplates = async (id: number | string) => {
  const response = await api.delete(`/html-templates/${id}`);
  return response.data;
};