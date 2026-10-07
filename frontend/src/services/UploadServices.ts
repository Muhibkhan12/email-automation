import api from "../libs/Axios";
import { isAxiosError } from "axios";
import type { UploadedFile } from "../types/UploadTypes";

// Fallback so existing callers keep working. Pass a real campaignId when you have one.
const DEFAULT_CAMPAIGN_ID = 2;

const buildForm = (file: File) => {
  const formData = new FormData();
  formData.append("file", file); // must match backend param name `file`
  return formData;
};

/* ───────────── extraction (background worker) ───────────── */

export interface RecipientsSummary {
  total: number;
  valid: number;
  invalid: number;
  dupes: number;
  preview: string[];
}

const num = (v: unknown): number =>
  Array.isArray(v) ? v.length : typeof v === "number" ? v : Number(v) || 0;

// Upload row se counts nikalta hai. Field names alag hon to sirf yahan adjust karo.
export const summaryFromUpload = (u: any): RecipientsSummary => ({
  total: num(u?.total_rows ?? u?.total_emails ?? u?.total),
  valid: num(u?.valid_count ?? u?.valid_emails ?? u?.valid),
  invalid: num(u?.invalid_count ?? u?.invalid_emails ?? u?.invalid),
  dupes: num(u?.duplicate_count ?? u?.duplicates ?? u?.dupes),
  preview: Array.isArray(u?.preview)
    ? u.preview.slice(0, 5)
    : Array.isArray(u?.valid)
    ? u.valid.slice(0, 5)
    : [],
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Worker trigger. 409 = already processing/processed -> error nahi, bas poll karna hai.
export const startExtraction = async (uploadId: number) => {
  try {
    const response = await api.post(`worker/extract/${uploadId}`);
    return response.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 409) {
      return { alreadyStarted: true };
    }
    throw err;
  }
};

// Upload row poll karta hai jab tak COMPLETED / FAILED na ho
export const waitForExtraction = async (
  uploadId: number,
  opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<any> => {
  const { intervalMs = 1500, timeoutMs = 120_000, signal } = opts;
  const startedAt = Date.now();

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const upload: any = await getUploadedFilesById(uploadId);
    const s = String(upload?.status ?? "").toLowerCase();

    if (s === "completed") return upload;
    if (s === "failed") {
      throw new Error(upload?.error_message || "Extraction failed on the server.");
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Extraction is taking too long. Please try again.");
    }
    await sleep(intervalMs);
  }
};

/* ───────────── existing calls ───────────── */

export const uploadRecipientsFile = async (
  file: File,
  onProgress?: (percent: number) => void,
  campaignId: number = DEFAULT_CAMPAIGN_ID
): Promise<UploadedFile> => {
  const response = await api.post(`campaigns/${campaignId}/upload`, buildForm(file), {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data?.data ?? response.data;
};

export const uploadFile = async (campaignId: number, file: File) => {
  const response = await api.post(`campaigns/${campaignId}/upload`, buildForm(file), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Backend scopes this to the logged-in user and returns 404 when they have none.
export const getAllUploadedFiles = async (): Promise<UploadedFile[]> => {
  try {
    const response = await api.get("uploads/all");
    return response.data.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
};

export const getUploadedFilesById = async (id: number): Promise<UploadedFile> => {
  const response = await api.get(`uploads/${id}`);
  return response.data.data;
};

export const updateUploadedFile = async (
  id: number,
  payload: { original_filename: string }
): Promise<UploadedFile> => {
  const response = await api.patch(`uploads/${id}`, payload);
  return response.data.data;
};

// Backend's DELETE expects a JSON body: { id }
export const deleteUploadedFile = async (id: number) => {
  const response = await api.delete(`uploads/${id}`, { data: { id } });
  return response.data;
};