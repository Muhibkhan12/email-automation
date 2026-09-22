import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { UploadedFile } from "../types/UploadTypes"; // adjust path
import {
  uploadFile,
  getAllUploadedFiles,
  getUploadedFilesById,
  deleteUploadedFile,
} from "../services/UploadServices"; // adjust path

interface UploadContextType {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  upload: (campaignId: number) => Promise<void>;
  fetchAllFiles: () => Promise<void>;
  fetchFileById: (id: number) => Promise<UploadedFile | null>;
  removeFile: (id: number) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

interface UploadProviderProps {
  children: ReactNode;
  userId: number; // scoped to logged-in user, same pattern as CampaignProvider
}

export const UploadProvider = ({ children, userId }: UploadProviderProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: getAllUploadedFiles must accept userId on the backend/service
      // side and return only this user's files. If it currently takes no
      // args, update UploadServices.ts to: getAllUploadedFiles(userId: number)
      const data = await getAllUploadedFiles(userId);
      setFiles(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch this user's uploaded files as soon as the provider mounts
  useEffect(() => {
    fetchAllFiles();
  }, [fetchAllFiles]);

  const fetchFileById = useCallback(
    async (id: number): Promise<UploadedFile | null> => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUploadedFilesById(id);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch file");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const upload = useCallback(
    async (campaignId: number) => {
      setLoading(true);
      setError(null);
      try {
        await uploadFile(campaignId);
        await fetchAllFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setLoading(false);
      }
    },
    [fetchAllFiles]
  );

  const removeFile = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteUploadedFile(id);
      setFiles((prev) => prev.filter((file) => (file as any).id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      files,
      loading,
      error,
      upload,
      fetchAllFiles,
      fetchFileById,
      removeFile,
    }),
    [files, loading, error, upload, fetchAllFiles, fetchFileById, removeFile]
  );

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};

export const useUpload = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};

export default UploadContext;