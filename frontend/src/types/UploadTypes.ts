// frontend/src/types/UploadTypes.ts
export type UploadStatus = "uploading" | "processing" | "success" | "error";

export interface UploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  rows?: number;
  errorMsg?: string;
  fileData?: any;
  headers?: string[];
  preview?: any[];
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