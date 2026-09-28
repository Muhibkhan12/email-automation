// services/TemplateService.ts
import api from "../libs/Axios";
import type { HtmlTemplates } from "../types/HtmlTemplatesTypes";

/** Shape the UI works with. */
export interface TemplatePayload {
  name: string;
  subject: string;
  category: string;
  status: string;
  html: string;
}

/* ───────── subject + category ko description column mein rakhna ───────── */

const META_TAG = "[[meta]]";

const packDescription = (text: string, subject: string, category: string) =>
  text + META_TAG + JSON.stringify({ subject, category });

const unpackDescription = (desc: any) => {
  const str = typeof desc === "string" ? desc : "";
  const i = str.indexOf(META_TAG);
  if (i === -1) return { text: str, subject: "", category: "" };

  const text = str.slice(0, i);
  try {
    const meta = JSON.parse(str.slice(i + META_TAG.length));
    return { text, subject: meta.subject || "", category: meta.category || "" };
  } catch {
    return { text, subject: "", category: "" };
  }
};

/* ───────── UI <-> backend mapping ───────── */

// UI -> backend
const toApi = (data: TemplatePayload, descriptionText = "") => ({
  name: data.name,
  html_content: data.html,
  is_active: data.status === "Published",
  description: packDescription(descriptionText, data.subject, data.category),
});

// backend -> UI
const fromApi = (raw: any): HtmlTemplates => {
  if (!raw) return raw;
  const meta = unpackDescription(raw.description);

  return {
    ...raw,
    description: meta.text,
    html: raw.html_content ?? "",
    subject: meta.subject,
    category: meta.category || "Welcome",
    status: raw.is_active ? "Published" : "Draft",
  } as HtmlTemplates;
};

// Response { template: {...} } ho, { data: {...} } ho ya seedha object, teeno chalenge
const unwrapOne = (res: { data: any }): HtmlTemplates => {
  const d = res.data;
  return fromApi(d?.template ?? d?.data ?? d);
};

/* ───────── READ (list) ───────── */
export const getHTMLTemplates = async (): Promise<HtmlTemplates[]> => {
  const response = await api.get("/html-templates");
  const d = response.data;
  const list = Array.isArray(d) ? d : d?.templates ?? d?.data ?? [];
  return list.map(fromApi);
};

/* ───────── READ (single) ───────── */
export const getHTMLTemplatesById = async (id: number | string): Promise<HtmlTemplates> => {
  const response = await api.get(`/html-templates/${id}`);
  return unwrapOne(response);
};

/* ───────── CREATE ───────── */
export const createHtmlTemplates = async (data: TemplatePayload): Promise<HtmlTemplates> => {
  const response = await api.post("/html-templates", toApi(data));
  return unwrapOne(response);
};

/* ───────── UPDATE ───────── */
export const editHtmlTemplates = async (
  id: number | string,
  data: TemplatePayload
): Promise<HtmlTemplates> => {
  // Purana description text na khoye, isliye pehle current record padho
  let descriptionText = "";
  try {
    const current: any = await getHTMLTemplatesById(id);
    descriptionText = current?.description || "";
  } catch {
    // fetch fail ho gaya to bina purane text ke aage badho
  }

  const response = await api.put(`/html-templates/${id}`, toApi(data, descriptionText));
  return unwrapOne(response);
};

/* ───────── DELETE ───────── */
export const deleteHtmlTemplates = async (id: number | string) => {
  const response = await api.delete(`/html-templates/${id}`);
  return response.data;
};