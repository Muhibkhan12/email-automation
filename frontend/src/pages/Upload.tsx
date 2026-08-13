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
    <div className="flex min-h-screen bg-gray-100" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8 max-w-[1100px]">
        {/* Header */}
        <div className="mb-7">
          <h1 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-3xl font-bold text-gray-900">
            Upload File
          </h1>
          <p className="mt-1 text-gray-500">Import recipients from a CSV or Excel file.</p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors"
          style={{
            borderColor: isDragging ? "#0284c7" : "#d1d5db",
            background: isDragging ? "#f0f9ff" : "#ffffff",
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
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
            <UploadCloud size={24} className="text-sky-600" />
          </div>
          <p style={{ fontFamily: FONT.display }} className="text-base font-semibold text-gray-900">
            Drag and drop your file here
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or <span className="text-sky-600 font-medium">browse</span> from your computer
          </p>
          <p style={{ fontFamily: FONT.mono }} className="text-[11px] text-gray-400 mt-4">
            Supports .csv, .xlsx, .xls — up to 25 MB
          </p>
        </div>

        {/* Format tip */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
          <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-sky-800">
            Your file needs an <span style={{ fontFamily: FONT.mono }} className="font-medium">email</span> column at minimum.
            Optional columns: <span style={{ fontFamily: FONT.mono }}>name</span>, <span style={{ fontFamily: FONT.mono }}>tags</span> (comma-separated).
            {" "}
            <button className="font-medium underline underline-offset-2">Download sample template</button>
          </p>
        </div>

        {/* Active uploads */}
        {files.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-gray-800">
                Uploading {files.length} {files.length === 1 ? "file" : "files"}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13.5px] font-medium text-gray-800 truncate">{f.name}</p>
                      <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {f.size}
                      </span>
                    </div>

                    {f.status === "uploading" && (
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                    {f.status === "processing" && (
                      <p className="flex items-center gap-1.5 text-[12px] text-amber-600">
                        <Loader2 size={12} className="spin" />
                        Validating rows…
                      </p>
                    )}
                    {f.status === "success" && (
                      <p style={{ fontFamily: FONT.mono }} className="flex items-center gap-1.5 text-[12px] text-emerald-600">
                        <CheckCircle2 size={13} />
                        {f.rows?.toLocaleString()} recipients imported
                      </p>
                    )}
                    {f.status === "error" && (
                      <p className="flex items-center gap-1.5 text-[12px] text-red-600">
                        <XCircle size={13} />
                        {f.errorMsg}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeFile(f.id)} className="text-gray-300 hover:text-gray-500 shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent uploads */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-gray-800">
              Recent uploads
            </h2>
            <button className="flex items-center gap-1 text-[12.5px] font-medium text-sky-600 hover:text-sky-700">
              View all history
              <ChevronRight size={13} />
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-400">
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
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet size={15} className="text-gray-400" />
                      <span className="text-[13.5px] font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-gray-600">
                    {u.rows.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-emerald-600">
                    {u.addedCount.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-gray-400">
                    {u.skippedCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
                        u.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {u.status === "Completed" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-gray-400 text-right whitespace-nowrap">
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