import React, { useCallback, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  X, Info, ChevronRight, Menu,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

        .sidebar-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sidebar-slide {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mf-header mb-4 md:mb-5 lg:mb-7">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: "#FFFFFF" }} 
                  className="text-xl md:text-2xl lg:text-3xl font-bold"
                >
                  Upload File
                </h1>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>Import recipients from a CSV or Excel file.</p>
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="mf-dropzone mb-4 md:mb-5 lg:mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 md:p-6 lg:p-12 text-center cursor-pointer transition-colors"
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
            <div className="mf-dropzone-icon w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center mb-2 md:mb-3 lg:mb-4" style={{ background: "rgba(255,106,57,0.12)" }}>
              <UploadCloud size={18} className="md:w-[20px] md:h-[20px] lg:w-[20px] lg:h-[20px] text-[#FF6A39]" />
            </div>
            <p className="mf-dropzone-title font-semibold" style={{ fontFamily: FONT.display, color: "#E8E6E1", fontSize: "clamp(0.8rem, 2vw, 1rem)" }}>
              Drag and drop your file here
            </p>
            <p className="mf-dropzone-subtitle text-[10px] md:text-xs lg:text-sm mt-1" style={{ color: "#9BA0A8" }}>
              or <span className="text-[#FF6A39] font-medium">browse</span> from your computer
            </p>
            <p className="mf-dropzone-hint mt-2 md:mt-3 lg:mt-4" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.5rem, 0.8vw, 0.75rem)" }}>
              Supports .csv, .xlsx, .xls — up to 25 MB
            </p>
          </div>

          {/* Format tip */}
          <div className="mf-tip mb-4 md:mb-5 lg:mb-6 flex items-start gap-1.5 md:gap-2 lg:gap-3 rounded-xl border px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3" style={{ borderColor: "rgba(255,106,57,0.2)", background: "rgba(255,106,57,0.05)" }}>
            <Info size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FF6A39] shrink-0 mt-0.5" />
            <p className="mf-tip-text text-[10px] md:text-xs lg:text-[13px]" style={{ color: "#C7C9CE" }}>
              Your file needs an <span style={{ fontFamily: FONT.mono }} className="font-medium text-[#FF6A39]">email</span> column at minimum.
              Optional columns: <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">name</span>, <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">tags</span> (comma-separated).
              {" "}
              <button className="font-medium underline underline-offset-2 text-[#FF6A39] hover:text-[#e85a2c]">Download sample template</button>
            </p>
          </div>

          {/* Active uploads */}
          {files.length > 0 && (
            <div className="mf-upload-list mb-4 md:mb-5 lg:mb-6 rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37]">
                <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  Uploading {files.length} {files.length === 1 ? "file" : "files"}
                </h2>
              </div>
              <div className="divide-y divide-[#2A2E37]">
                {files.map((f) => (
                  <div key={f.id} className="mf-upload-item flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4">
                    <div className="mf-upload-item-left flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                      <div className="w-6 h-6 md:w-7 md:h-7 lg:h-9 lg:w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,106,57,0.08)" }}>
                        <FileSpreadsheet size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FF6A39]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <p className="mf-upload-name text-[10px] md:text-xs lg:text-[13.5px] font-medium truncate" style={{ color: "#E8E6E1" }}>{f.name}</p>
                          <span className="mf-upload-size shrink-0 ml-1 md:ml-2" style={{ fontFamily: FONT.mono, color: "#6B727C", fontSize: "clamp(0.5rem, 0.8vw, 0.75rem)" }}>
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
                          <p className="mf-upload-status flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] lg:text-[12px]" style={{ color: "#FBBF24" }}>
                            <Loader2 size={9} className="md:w-[10px] md:h-[10px] lg:w-[10px] lg:h-[10px] spin" />
                            Validating rows…
                          </p>
                        )}
                        {f.status === "success" && (
                          <p className="mf-upload-status flex items-center gap-1 md:gap-1.5" style={{ fontFamily: FONT.mono, color: "#34D399", fontSize: "clamp(0.5rem, 0.8vw, 0.75rem)" }}>
                            <CheckCircle2 size={10} className="md:w-[11px] md:h-[11px] lg:w-[11px] lg:h-[11px]" />
                            {f.rows?.toLocaleString()} recipients imported
                          </p>
                        )}
                        {f.status === "error" && (
                          <p className="mf-upload-status flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] lg:text-[12px]" style={{ color: "#F87171" }}>
                            <XCircle size={10} className="md:w-[11px] md:h-[11px] lg:w-[11px] lg:h-[11px]" />
                            {f.errorMsg}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="text-[#6B727C] hover:text-[#E8E6E1] shrink-0 self-end sm:self-center p-1">
                      <X size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent uploads */}
          <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
            <div className="mf-recent-header flex flex-wrap items-center justify-between px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37] gap-2">
              <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                Recent uploads
              </h2>
              <button className="mf-view-all flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] lg:text-[12.5px] font-medium text-[#FF6A39] hover:text-[#e85a2c]">
                <span className="hidden xs:inline">View all history</span>
                <span className="xs:hidden">History</span>
                <ChevronRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[11px] lg:h-[11px]" />
              </button>
            </div>
            <div className="mf-table-wrapper overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "500px" }}>
                <thead>
                  <tr className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wider" style={{ color: "#6B727C" }}>
                    <th className="mf-table-cell-padded px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 font-medium">File</th>
                    <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">Rows</th>
                    <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">Added</th>
                    <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">Skipped</th>
                    <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 font-medium">Status</th>
                    <th className="mf-table-cell-padded px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 font-medium text-right">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUploads.map((u) => (
                    <tr key={u.id} className="border-t border-[#2A2E37] hover:bg-[#1B1E24] transition-colors">
                      <td className="mf-table-cell-padded px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-3">
                        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5">
                          <FileSpreadsheet size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] text-[#6B727C]" />
                          <span className="mf-file-name text-[9px] md:text-[10px] lg:text-[13.5px] font-medium truncate max-w-[80px] md:max-w-[120px] lg:max-w-none" style={{ color: "#E8E6E1" }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="mf-file-stats px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3 text-[8px] md:text-[9px] lg:text-[13px]" style={{ fontFamily: FONT.mono, color: "#9BA0A8" }}>
                        {u.rows.toLocaleString()}
                      </td>
                      <td className="mf-file-stats px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3 text-[8px] md:text-[9px] lg:text-[13px]" style={{ fontFamily: FONT.mono, color: "#34D399" }}>
                        {u.addedCount.toLocaleString()}
                      </td>
                      <td className="mf-file-stats px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3 text-[8px] md:text-[9px] lg:text-[13px]" style={{ fontFamily: FONT.mono, color: "#6B727C" }}>
                        {u.skippedCount.toLocaleString()}
                      </td>
                      <td className="px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-3">
                        <span
                          className="mf-status-badge inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1 md:px-1.5 lg:px-2 py-0.5 text-[7px] md:text-[8px] lg:text-[11.5px] font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: u.status === "Completed" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            color: u.status === "Completed" ? "#34D399" : "#F87171"
                          }}
                        >
                          {u.status === "Completed" ? <CheckCircle2 size={7} className="md:w-[8px] md:h-[8px] lg:w-[9px] lg:h-[9px]" /> : <XCircle size={7} className="md:w-[8px] md:h-[8px] lg:w-[9px] lg:h-[9px]" />}
                          <span className="hidden xs:inline">{u.status}</span>
                          <span className="xs:hidden">{u.status.charAt(0)}</span>
                        </span>
                      </td>
                      <td className="mf-timestamp px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-3 text-[7px] md:text-[8px] lg:text-[12.5px] text-right whitespace-nowrap" style={{ color: "#6B727C" }}>
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