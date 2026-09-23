import api from "../libs/Axios";
import type { UploadedFile } from "../types/UploadTypes";

let campaign_id = 2;
const UPLOAD_ENDPOINT = `campaigns/${campaign_id}/upload`; // <- set to your real POST route

export const uploadRecipientsFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append("file", file); // <- must match the backend's expected field name

  const response = await api.post(UPLOAD_ENDPOINT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });

  return response.data?.data ?? response.data;
};

// Campaign-scoped upload (kept from your original)
export const uploadFile = async (campaign_id: number) => {
  const response = await api.post(`campaigns/${campaign_id}/upload`);
  return response.data;
};

export const getAllUploadedFiles = async (): Promise<UploadedFile[]> => {
  const response = await api.get("uploads/all");
  return response.data.data;
};

export const getUploadedFilesById = async (id: number): Promise<UploadedFile> => {
  const response = await api.get(`uploads/${id}`);
  return response.data;
};

export const deleteUploadedFile = async (id: number) => {
  const response = await api.delete(`uploads/${id}`);
  return response.data;
};