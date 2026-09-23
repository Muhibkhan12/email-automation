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
  uploadRecipientsFile,
  getAllUploadedFiles,
  getUploadedFilesById,
  deleteUploadedFile,
} from "../services/UploadServices"; // adjust path

interface UploadContextType {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  upload: (campaignId: number) => Promise<void>;
  uploadRecipients: (
    file: File,
    onProgress?: (percent: number) => void
  ) => Promise<UploadedFile>;
  fetchAllFiles: (silent?: boolean) => Promise<void>;
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

  // silent = true refreshes the list without showing the loading spinner
  // (used after an upload so the "Recent uploads" table doesn't flash).
  // userId is kept in the deps so the list refetches if the logged-in user changes.
  const fetchAllFiles = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await getAllUploadedFiles();
        setFiles(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch files");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId]
  );

  // Auto-fetch this user's uploaded files as soon as the provider mounts
  useEffect(() => {
    fetchAllFiles();
  }, [fetchAllFiles]);

  const fetchFileById = useCallback(
    async (id: number): Promise<UploadedFile | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getUploadedFilesById(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch file");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Campaign-scoped upload (original)
  const upload = useCallback(
    async (campaignId: number) => {
      setLoading(true);
      setError(null);
      try {
        await uploadFile(campaignId);
        await fetchAllFiles(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setLoading(false);
      }
    },
    [fetchAllFiles]
  );

  // Recipients upload from the Upload page.
  // Errors are intentionally re-thrown (not stored in context `error`)
  // so the page can show them on the specific file row.
  const uploadRecipients = useCallback(
    async (
      file: File,
      onProgress?: (percent: number) => void
    ): Promise<UploadedFile> => {
      const saved = await uploadRecipientsFile(file, onProgress);
      await fetchAllFiles(true);
      return saved;
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
      uploadRecipients,
      fetchAllFiles,
      fetchFileById,
      removeFile,
    }),
    [
      files,
      loading,
      error,
      upload,
      uploadRecipients,
      fetchAllFiles,
      fetchFileById,
      removeFile,
    ]
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