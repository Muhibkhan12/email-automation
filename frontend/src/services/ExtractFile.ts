import api from "../libs/Axios";

/* ───────────── types ───────────── */

export interface UploadAnalytics {
  upload_id: number;
  status: string; // "completed" | "failed" | "processing" | "uploaded" ...
  total_rows?: number;
  valid_count?: number;
  invalid_count?: number;
  duplicate_count?: number;
  empty_count?: number;
  with_name?: number;
  with_company?: number;
  with_phone?: number;
  email_column?: string;
  columns?: string[];
  top_domains?: { domain: string; count: number }[];
  preview?: string[];
  error_message?: string | null;
  processed_at?: string;
}

/** Shape the Campaign page uses for the Recipients step. */
export interface RecipientsSummary {
  total: number;
  valid: number;
  invalid: number;
  dupes: number;
  preview: string[];
}

/* ───────────── API calls ───────────── */

// POST /worker/extract/{upload_id}  → queues the extraction job
export const ExtractData = async (upload_id: number) => {
  const response = await api.post(`/worker/extract/${upload_id}`);
  return response.data;
};

// GET /worker/analytics/{upload_id}  → Redis first, MySQL fallback
export const getAnalytics = async (upload_id: number): Promise<UploadAnalytics> => {
  const response = await api.get(`/worker/analytics/${upload_id}`);
  return response.data.data as UploadAnalytics;
};

/* ───────────── polling ───────────── */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Polls analytics until extraction is completed.
 * Throws if extraction failed or took too long.
 */
export const waitForAnalytics = async (
  upload_id: number,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<UploadAnalytics> => {
  const { intervalMs = 1500, timeoutMs = 120_000 } = opts;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const data = await getAnalytics(upload_id);
    const status = String(data.status ?? "").toLowerCase();

    if (status === "completed") return data;
    if (status === "failed") {
      throw new Error(data.error_message || "Extraction failed. Check your file and try again.");
    }
    await sleep(intervalMs);
  }

  throw new Error("Extraction is taking too long. Please try again.");
};

export const summaryFromAnalytics = (a: UploadAnalytics): RecipientsSummary => ({
  total: a.total_rows ?? 0,
  valid: a.valid_count ?? 0,
  invalid: a.invalid_count ?? 0,
  dupes: a.duplicate_count ?? 0,
  preview: a.preview ?? [],
});