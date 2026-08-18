import React, { useCallback, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  X, Info, ChevronRight,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type UploadStatus = "uploading" | "processing" | "success" | "error";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  rows?: number;
  errorMsg?: string;
}

interface RecentUpload {
  id: string;
  name: string;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  status: "Completed" | "Failed";
}

const recentUploads: RecentUpload[] = [
  { id: "u1", name: "leads_aug.csv", rows: 1204, addedCount: 1168, skippedCount: 36, uploadedAt: "Today, 7:10 AM", status: "Completed" },
  { id: "u2", name: "newsletter_subs.csv", rows: 3420, addedCount: 3298, skippedCount: 122, uploadedAt: "Aug 5, 4:32 PM", status: "Completed" },
  { id: "u3", name: "webinar_attendees.xlsx", rows: 540, addedCount: 0, skippedCount: 540, uploadedAt: "Aug 4, 11:05 AM", status: "Failed" },
  { id: "u4", name: "contacts_may.csv", rows: 2140, addedCount: 2104, skippedCount: 36, uploadedAt: "Aug 1, 9:20 AM", status: "Completed" },
];

let idCounter = 0;

const Upload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (file: UploadFile) => {
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== file.id) return f;
          if (f.status === "uploading") {
            const next = f.progress + Math.random() * 25;
            if (next >= 100) return { ...f, progress: 100, status: "processing" };
            return { ...f, progress: next };
          }
          return f;
        })
      );
    }, 350);

    setTimeout(() => {
      clearInterval(interval);
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== file.id) return f;
          const willFail = f.name.toLowerCase().includes("fail");
          return willFail
            ? { ...f, status: "error", errorMsg: "Missing required 'email' column" }
            : { ...f, status: "success", rows: Math.floor(Math.random() * 3000) + 200 };
        })
      );
    }, 2600);
  };

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((f) =>
      /\.(csv|xlsx|xls)$/i.test(f.name)
    );
    const newFiles: UploadFile[] = accepted.map((f) => ({
      id: `f${idCounter++}`,
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...newFiles, ...prev]);
    newFiles.forEach(simulateUpload);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        /* Custom scrollbar for the main content */
        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .mf-header {
            margin-bottom: 1.5rem !important;
          }
          .mf-header h1 {
            font-size: 1.5rem !important;
          }
          .mf-dropzone {
            padding: 2rem 1rem !important;
          }
          .mf-dropzone-icon {
            width: 3rem !important;
            height: 3rem !important;
          }
          .mf-dropzone-icon svg {
            width: 1.25rem !important;
            height: 1.25rem !important;
          }
          .mf-dropzone-title {
            font-size: 0.9rem !important;
          }
          .mf-dropzone-subtitle {
            font-size: 0.75rem !important;
          }
          .mf-dropzone-hint {
            font-size: 0.6rem !important;
          }
          .mf-tip {
            padding: 0.75rem !important;
            font-size: 0.7rem !important;
          }
          .mf-tip-text {
            font-size: 0.7rem !important;
          }
          .mf-upload-list {
            padding: 0.75rem !important;
          }
          .mf-upload-item {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 0.75rem !important;
          }
          .mf-upload-item-left {
            width: 100% !important;
          }
          .mf-upload-item-right {
            width: 100% !important;
            margin-top: 0.5rem !important;
          }
          .mf-upload-name {
            font-size: 0.8rem !important;
          }
          .mf-upload-size {
            font-size: 0.6rem !important;
          }
          .mf-upload-status {
            font-size: 0.65rem !important;
          }
          .mf-table-wrapper {
            overflow-x: auto !important;
          }
          .mf-table-cell {
            padding: 0.5rem 0.4rem !important;
          }
          .mf-table-cell-padded {
            padding: 0.5rem 0.75rem !important;
          }
          .mf-file-name {
            font-size: 0.75rem !important;
          }
          .mf-file-stats {
            font-size: 0.65rem !important;
          }
          .mf-status-badge {
            font-size: 0.6rem !important;
            padding: 0.15rem 0.4rem !important;
          }
          .mf-timestamp {
            font-size: 0.6rem !important;
          }
          .mf-recent-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
          }
          .mf-view-all {
            font-size: 0.7rem !important;
          }
          .mf-main-content {
            padding: 0.75rem !important;
          }
        }

        @media (max-width: 640px) {
          .mf-dropzone {
            padding: 1.5rem 0.75rem !important;
          }
          .mf-upload-item {
            padding: 0.5rem !important;
          }
          .mf-upload-name {
            font-size: 0.7rem !important;
          }
          .mf-file-name {
            font-size: 0.65rem !important;
          }
          .mf-file-stats {
            font-size: 0.55rem !important;
          }
          .mf-upload-list {
            padding: 0.5rem !important;
          }
        }
      `}</style>

      {/* Sidebar - sticky on all screen sizes */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-6 lg:p-8" style={{ background: "#12151B", height: "100vh" }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mf-header mb-4 md:mb-7">
            <h1 
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} 
              className="text-2xl md:text-3xl font-bold text-[#E8E6E1]" 
            >
              Upload File
            </h1>
            <p className="mt-1 text-xs md:text-sm" style={{ color: "#9BA0A8" }}>Import recipients from a CSV or Excel file.</p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="mf-dropzone mb-4 md:mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 md:p-12 text-center cursor-pointer transition-colors"
            style={{
              borderColor: isDragging ? "#FF6A39" : "#2A2E37",
              background: isDragging ? "rgba(255,106,57,0.05)" : "#12151B",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="mf-dropzone-icon w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 md:mb-4" style={{ background: "rgba(255,106,57,0.12)" }}>
              <UploadCloud size={20} className="text-[#FF6A39]" />
            </div>
            <p className="mf-dropzone-title font-semibold" style={{ fontFamily: FONT.display, color: "#E8E6E1", fontSize: "clamp(0.85rem, 2vw, 1rem)" }} >
              Drag and drop your file here
            </p>
            <p className="mf-dropzone-subtitle text-xs md:text-sm mt-1" style={{ color: "#9BA0A8" }}>
              or <span className="text-[#FF6A39] font-medium">browse</span> from your computer
            </p>
            <p className="mf-dropzone-hint mt-2 md:mt-4" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.55rem, 1vw, 0.75rem)" }}>
              Supports .csv, .xlsx, .xls — up to 25 MB
            </p>
          </div>

          {/* Format tip */}
          <div className="mf-tip mb-4 md:mb-6 flex items-start gap-2 md:gap-3 rounded-xl border px-3 md:px-4 py-2 md:py-3" style={{ borderColor: "rgba(255,106,57,0.2)", background: "rgba(255,106,57,0.05)" }}>
            <Info size={14} className="text-[#FF6A39] shrink-0 mt-0.5" />
            <p className="mf-tip-text text-[11px] md:text-[13px]" style={{ color: "#C7C9CE" }}>
              Your file needs an <span style={{ fontFamily: FONT.mono }} className="font-medium text-[#FF6A39]">email</span> column at minimum.
              Optional columns: <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">name</span>, <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">tags</span> (comma-separated).
              {" "}
              <button className="font-medium underline underline-offset-2 text-[#FF6A39] hover:text-[#e85a2c]">Download sample template</button>
            </p>
          </div>

          {/* Active uploads */}
          {files.length > 0 && (
            <div className="mf-upload-list mb-4 md:mb-6 rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="px-3 md:px-5 py-3 md:py-4 border-b border-[#2A2E37]">
                <h2 style={{ fontFamily: FONT.display }} className="text-xs md:text-sm font-semibold bg-[#E8E6E1]">
                  Uploading {files.length} {files.length === 1 ? "file" : "files"}
                </h2>
              </div>
              <div className="divide-y divide-[#2A2E37]">
                {files.map((f) => (
                  <div key={f.id} className="mf-upload-item flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-3 md:px-5 py-3 md:py-4">
                    <div className="mf-upload-item-left flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,106,57,0.08)" }}>
                        <FileSpreadsheet size={14} className="text-[#FF6A39]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <p className="mf-upload-name text-[11px] md:text-[13.5px] font-medium truncate" style={{ color: "#E8E6E1" }}>{f.name}</p>
                          <span className="mf-upload-size shrink-0 ml-1 md:ml-2" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.55rem, 1vw, 0.75rem)" }}>
                            {f.size}
                          </span>
                        </div>

                        {f.status === "uploading" && (
                          <div className="h-1 w-full rounded-full overflow-hidden mt-1" style={{ background: "#2A2E37" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${f.progress}%`, background: "#FF6A39" }}
                            />
                          </div>
                        )}
                        {f.status === "processing" && (
                          <p className="mf-upload-status flex items-center gap-1.5 text-[10px] md:text-[12px]" style={{ color: "#FBBF24" }}>
                            <Loader2 size={10} className="spin" />
                            Validating rows…
                          </p>
                        )}
                        {f.status === "success" && (
                          <p className="mf-upload-status flex items-center gap-1.5" style={{ fontFamily: FONT.mono, color: "#34D399", fontSize: "clamp(0.55rem, 1vw, 0.75rem)" }}>
                            <CheckCircle2 size={11} />
                            {f.rows?.toLocaleString()} recipients imported
                          </p>
                        )}
                        {f.status === "error" && (
                          <p className="mf-upload-status flex items-center gap-1.5 text-[10px] md:text-[12px]" style={{ color: "#F87171" }}>
                            <XCircle size={11} />
                            {f.errorMsg}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="text-[#6B727C] hover:text-[#E8E6E1] shrink-0 self-end sm:self-center">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent uploads */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
            <div className="mf-recent-header flex flex-wrap items-center justify-between px-3 md:px-5 py-3 md:py-4 border-b border-[#2A2E37] gap-2">
              <h2 style={{ fontFamily: FONT.display }} className="text-xs md:text-sm font-semibold text-[#E8E6E1]">
                Recent uploads
              </h2>
              <button className="mf-view-all flex items-center gap-0.5 md:gap-1 text-[10px] md:text-[12.5px] font-medium text-[#FF6A39] hover:text-[#e85a2c]">
                View all history
                <ChevronRight size={11} />
              </button>
            </div>
            <div className="mf-table-wrapper overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "600px" }}>
                <thead>
                  <tr className="text-[9px] md:text-[11px] uppercase tracking-wider" style={{ color: "#6B727C" }}>
                    <th className="mf-table-cell-padded px-3 md:px-5 py-2 md:py-2.5 font-medium">File</th>
                    <th className="mf-table-cell px-2 md:px-3 py-2 md:py-2.5 font-medium">Rows</th>
                    <th className="mf-table-cell px-2 md:px-3 py-2 md:py-2.5 font-medium">Added</th>
                    <th className="mf-table-cell px-2 md:px-3 py-2 md:py-2.5 font-medium">Skipped</th>
                    <th className="mf-table-cell px-2 md:px-3 py-2 md:py-2.5 font-medium">Status</th>
                    <th className="mf-table-cell-padded px-3 md:px-5 py-2 md:py-2.5 font-medium text-right">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUploads.map((u) => (
                    <tr key={u.id} className="border-t border-[#2A2E37] hover:bg-[#1B1E24] transition-colors">
                      <td className="mf-table-cell-padded px-3 md:px-5 py-2 md:py-3">
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                          <FileSpreadsheet size={13} className="text-[#6B727C]" />
                          <span className="mf-file-name text-[11px] md:text-[13.5px] font-medium truncate max-w-[120px] md:max-w-none" style={{ color: "#E8E6E1" }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="mf-file-stats px-2 md:px-3 py-2 md:py-3 text-[10px] md:text-[13px]" style={{ fontFamily: FONT.mono, color: "#9BA0A8" }}>
                        {u.rows.toLocaleString()}
                      </td>
                      <td className="mf-file-stats px-2 md:px-3 py-2 md:py-3 text-[10px] md:text-[13px]" style={{ fontFamily: FONT.mono, color: "#34D399" }}>
                        {u.addedCount.toLocaleString()}
                      </td>
                      <td className="mf-file-stats px-2 md:px-3 py-2 md:py-3 text-[10px] md:text-[13px]" style={{ fontFamily: FONT.mono, color: "#6B727C" }}>
                        {u.skippedCount.toLocaleString()}
                      </td>
                      <td className="px-2 md:px-3 py-2 md:py-3">
                        <span
                          className="mf-status-badge inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1.5 md:px-2 py-0.5 md:py-0.5 text-[8px] md:text-[11.5px] font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: u.status === "Completed" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            color: u.status === "Completed" ? "#34D399" : "#F87171"
                          }}
                        >
                          {u.status === "Completed" ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                          {u.status}
                        </span>
                      </td>
                      <td className="mf-timestamp px-3 md:px-5 py-2 md:py-3 text-[9px] md:text-[12.5px] text-right whitespace-nowrap" style={{ color: "#6B727C" }}>
                        {u.uploadedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;