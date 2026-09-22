// frontend/src/types/UploadTypes.ts
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

  total_records: number;
  processed_records: number;

  status: UploadStatus;

  created_at: string;
  updated_at: string;

  file_size: number;
  mime_type: string;

  error_message: string | null;
}

export interface UpdateUploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  rows: number;
  errorMsg: string;
  fileData: any;
  headers: string[];
  preview: any[];
}

export interface RecentUpload {
  id: string;
  name: string;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  status: "Completed" | "Failed";
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
  thumbnail: string;
  category: string;
  used: number;
  created_at: string;
}