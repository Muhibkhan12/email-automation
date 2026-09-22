// frontend/src/types/UploadTypes.ts

// =========================
// BACKEND ENUM
// =========================

export type UploadStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface UploadedFile {
  id: number;
  campaign_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  total_records: number;
  processed_records: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}


// =========================
// API RESPONSES
// =========================

export interface UploadedFileResponse {
  message: string;
  data: UploadedFile;
}

export interface UploadedFilesResponse {
  message: string;
  data: UploadedFile[];
}


// =========================
// UPDATE UPLOAD
// =========================

export interface UploadedFileUpdate {
  campaign_id?: number;
  original_filename?: string;
  stored_filename?: string;
  file_path?: string;

  file_size?: number;
  mime_type?: string;

  total_records?: number;
  processed_records?: number;

  status?: UploadStatus;

  error_message?: string | null;
}


// =========================
// DELETE RESPONSE
// =========================

export interface DeleteUploadedFileResponse {
  message: string;
}


// =========================
// FRONTEND UI STATE
// =========================

export interface UploadUIState {
  file: File | null;

  progress: number;

  status:
    | "idle"
    | "uploading"
    | "success"
    | "error";

  error: string | null;

  preview: any[];
  headers: string[];
}