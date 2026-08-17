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
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8 max-w-[1100px] bg-[#12151B]">
        {/* Header */}
        <div className="mb-7">
          <h1 
            style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} 
            className="text-3xl font-bold text-[#E8E6E1]"
          >
            Upload File
          </h1>
          <p className="mt-1 text-[#9BA0A8]">Import recipients from a CSV or Excel file.</p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors"
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,106,57,0.12)" }}>
            <UploadCloud size={24} className="text-[#FF6A39]" />
          </div>
          <p style={{ fontFamily: FONT.display }} className="text-base font-semibold text-[#E8E6E1]">
            Drag and drop your file here
          </p>
          <p className="text-sm text-[#9BA0A8] mt-1">
            or <span className="text-[#FF6A39] font-medium">browse</span> from your computer
          </p>
          <p style={{ fontFamily: FONT.mono }} className="text-[11px] text-[#6B727C] mt-4">
            Supports .csv, .xlsx, .xls — up to 25 MB
          </p>
        </div>

        {/* Format tip */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,106,57,0.2)", background: "rgba(255,106,57,0.05)" }}>
          <Info size={16} className="text-[#FF6A39] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#C7C9CE]">
            Your file needs an <span style={{ fontFamily: FONT.mono }} className="font-medium text-[#FF6A39]">email</span> column at minimum.
            Optional columns: <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">name</span>, <span style={{ fontFamily: FONT.mono }} className="text-[#E8E6E1]">tags</span> (comma-separated).
            {" "}
            <button className="font-medium underline underline-offset-2 text-[#FF6A39] hover:text-[#e85a2c]">Download sample template</button>
          </p>
        </div>

        {/* Active uploads */}
        {files.length > 0 && (
          <div className="mb-6 rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2A2E37]">
              <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-[#E8E6E1]">
                Uploading {files.length} {files.length === 1 ? "file" : "files"}
              </h2>
            </div>
            <div className="divide-y divide-[#2A2E37]">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,106,57,0.08)" }}>
                    <FileSpreadsheet size={16} className="text-[#FF6A39]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13.5px] font-medium text-[#E8E6E1] truncate">{f.name}</p>
                      <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-[#6B727C] shrink-0 ml-2">
                        {f.size}
                      </span>
                    </div>

                    {f.status === "uploading" && (
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#2A2E37" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${f.progress}%`, background: "#FF6A39" }}
                        />
                      </div>
                    )}
                    {f.status === "processing" && (
                      <p className="flex items-center gap-1.5 text-[12px]" style={{ color: "#FBBF24" }}>
                        <Loader2 size={12} className="spin" />
                        Validating rows…
                      </p>
                    )}
                    {f.status === "success" && (
                      <p style={{ fontFamily: FONT.mono }} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#34D399" }}>
                        <CheckCircle2 size={13} />
                        {f.rows?.toLocaleString()} recipients imported
                      </p>
                    )}
                    {f.status === "error" && (
                      <p className="flex items-center gap-1.5 text-[12px]" style={{ color: "#F87171" }}>
                        <XCircle size={13} />
                        {f.errorMsg}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeFile(f.id)} className="text-[#6B727C] hover:text-[#E8E6E1] shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent uploads */}
        <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2E37]">
            <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-[#E8E6E1]">
              Recent uploads
            </h2>
            <button className="flex items-center gap-1 text-[12.5px] font-medium text-[#FF6A39] hover:text-[#e85a2c]">
              View all history
              <ChevronRight size={13} />
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[#6B727C]">
                <th className="px-5 py-2.5 font-medium">File</th>
                <th className="px-3 py-2.5 font-medium">Rows</th>
                <th className="px-3 py-2.5 font-medium">Added</th>
                <th className="px-3 py-2.5 font-medium">Skipped</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium text-right">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.map((u) => (
                <tr key={u.id} className="border-t border-[#2A2E37] hover:bg-[#1B1E24] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet size={15} className="text-[#6B727C]" />
                      <span className="text-[13.5px] font-medium text-[#E8E6E1]">{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-[#9BA0A8]">
                    {u.rows.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px]" style={{ color: "#34D399" }}>
                    {u.addedCount.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-[#6B727C]">
                    {u.skippedCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                      style={{
                        backgroundColor: u.status === "Completed" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: u.status === "Completed" ? "#34D399" : "#F87171"
                      }}
                    >
                      {u.status === "Completed" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#6B727C] text-right whitespace-nowrap">
                    {u.uploadedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Upload;