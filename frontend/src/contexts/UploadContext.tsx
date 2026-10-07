import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import type { UploadedFile } from "../types/UploadTypes";
import {
  uploadFile,
  uploadRecipientsFile,
  getAllUploadedFiles,
  getUploadedFilesById,
  updateUploadedFile,
  deleteUploadedFile,
} from "../services/UploadServices";

interface UploadContextType {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  upload: (campaignId: number, file: File) => Promise<void>;
  uploadRecipients: (
    file: File,
    onProgress?: (percent: number) => void,
    campaignId?: number
  ) => Promise<UploadedFile>;
  fetchAllFiles: (silent?: boolean) => Promise<void>;
  fetchFileById: (id: number) => Promise<UploadedFile | null>;
  renameFile: (id: number, name: string) => Promise<void>;
  removeFile: (id: number) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const errMsg = (err: any, fallback: string) =>
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  (err instanceof Error ? err.message : fallback);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllFiles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      setFiles(await getAllUploadedFiles());
    } catch (err) {
      setError(errMsg(err, "Failed to fetch files"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchFileById = useCallback(async (id: number) => {
    try {
      return await getUploadedFilesById(id);
    } catch (err) {
      setError(errMsg(err, "Failed to fetch file"));
      return null;
    }
  }, []);

  const upload = useCallback(
    async (campaignId: number, file: File) => {
      setError(null);
      try {
        await uploadFile(campaignId, file);
        await fetchAllFiles(true);
      } catch (err) {
        setError(errMsg(err, "Failed to upload file"));
      }
    },
    [fetchAllFiles]
  );

  // Errors are re-thrown so the calling page can show them on the file row.
  const uploadRecipients = useCallback(
    async (
      file: File,
      onProgress?: (percent: number) => void,
      campaignId?: number
    ) => {
      const saved = await uploadRecipientsFile(file, onProgress, campaignId);
      await fetchAllFiles(true);
      return saved;
    },
    [fetchAllFiles]
  );

  // rename/remove re-throw so the UI can show the error without
  // replacing the whole page with the error screen.
  const renameFile = useCallback(async (id: number, name: string) => {
    const updated = await updateUploadedFile(id, { original_filename: name });
    setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const removeFile = useCallback(async (id: number) => {
    await deleteUploadedFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      files, loading, error,
      upload, uploadRecipients, fetchAllFiles, fetchFileById, renameFile, removeFile,
    }),
    [files, loading, error, upload, uploadRecipients, fetchAllFiles, fetchFileById, renameFile, removeFile]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export const useUpload = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) throw new Error("useUpload must be used within an UploadProvider");
  return context;
};

export default UploadContext;