type UploadStatus = "uploading" | "processing" | "success" | "error";

export interface UploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  rows?: number;
  errorMsg?: string;
  fileData?: any; // Store parsed file data
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