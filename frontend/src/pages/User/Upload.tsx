// frontend/src/pages/User/Upload.tsx
import React, { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  X, Info, ChevronRight, Menu, ArrowRight, FileText,
  Search, Plus, Layout, Grid3x3, Star
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Types
type UploadStatus = "uploading" | "processing" | "success" | "error";

interface UploadFile {
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

interface RecentUpload {
  id: string;
  name: string;
  rows: number;
  addedCount: number;
  skippedCount: number;
  uploadedAt: string;
  status: "Completed" | "Failed";
}

interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
  thumbnail: string;
  category: string;
  used: number;
  tags?: string[];
  featured?: boolean;
  created_at: string;
}

// Mock data
const mockTemplates: Template[] = [
  {
    id: "t1",
    name: "Newsletter Modern",
    subject: "Weekly Newsletter - {{ date }}",
    preview: "Modern newsletter template with hero image and responsive design...",
    thumbnail: "📰",
    category: "Newsletter",
    used: 234,
    tags: ["Modern", "Responsive", "Clean"],
    featured: true,
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "t2",
    name: "Promotional Flash Sale",
    subject: "🔥 Flash Sale Alert! {{ discount }}% Off",
    preview: "High-converting promotional template with countdown timer...",
    thumbnail: "🔥",
    category: "Promotion",
    used: 189,
    tags: ["Urgent", "Sales", "Conversion"],
    featured: true,
    created_at: "2024-02-20T14:15:00Z"
  },
  {
    id: "t3",
    name: "Welcome Series",
    subject: "Welcome to {{ company_name }}, {{ name }}!",
    preview: "Warm welcome email with onboarding steps and resources...",
    thumbnail: "👋",
    category: "Onboarding",
    used: 567,
    tags: ["Welcome", "Onboarding", "Friendly"],
    featured: false,
    created_at: "2024-01-05T09:00:00Z"
  },
  {
    id: "t4",
    name: "Event Invitation",
    subject: "You're Invited to {{ event_name }}!",
    preview: "Elegant event invitation template with RSVP button...",
    thumbnail: "🎪",
    category: "Event",
    used: 145,
    tags: ["Event", "Elegant", "RSVP"],
    featured: false,
    created_at: "2024-03-01T16:45:00Z"
  }
];

const recentUploads: RecentUpload[] = [
  { id: "u1", name: "leads_aug.csv", rows: 1204, addedCount: 1168, skippedCount: 36, uploadedAt: "Today, 7:10 AM", status: "Completed" },
  { id: "u2", name: "newsletter_subs.csv", rows: 3420, addedCount: 3298, skippedCount: 122, uploadedAt: "Aug 5, 4:32 PM", status: "Completed" },
  { id: "u3", name: "webinar_attendees.xlsx", rows: 540, addedCount: 0, skippedCount: 540, uploadedAt: "Aug 4, 11:05 AM", status: "Failed" },
  { id: "u4", name: "contacts_may.csv", rows: 2140, addedCount: 2104, skippedCount: 36, uploadedAt: "Aug 1, 9:20 AM", status: "Completed" },
];

let idCounter = 0;

// Template Card Component
interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: "grid" | "list";
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect, viewMode }) => {
  if (viewMode === "grid") {
    return (
      <div
        onClick={onSelect}
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-[#FF6A39] bg-[#FF6A39]/5 shadow-lg shadow-[#FF6A39]/5'
            : 'border-[#2A2E37] bg-[#1B1E24] hover:border-[#3A3F4A]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{template.thumbnail}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#E8E6E1] text-sm">{template.name}</h3>
            <p className="text-xs text-[#6B727C] mt-0.5 line-clamp-2">{template.preview}</p>
            <p className="text-xs text-[#9BA0A8] mt-1 font-mono line-clamp-1">Subject: {template.subject}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-[#2A2E37] text-[#9BA0A8]">
                {template.category}
              </span>
              <span className="text-[8px] md:text-[9px] text-[#6B727C]">
                Used {template.used} times
              </span>
              {template.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-[#FF6A39]/5 text-[#FF6A39]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          {isSelected && (
            <CheckCircle2 size={16} className="text-[#FF6A39] shrink-0" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#FF6A39] bg-[#FF6A39]/5'
          : 'border-[#2A2E37] bg-[#1B1E24] hover:border-[#3A3F4A]'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-2xl">{template.thumbnail}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#E8E6E1] text-sm">{template.name}</h3>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2E37] text-[#9BA0A8]">
              {template.category}
            </span>
            {template.featured && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-medium">
                Featured
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B727C] truncate">{template.subject}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#6B727C]">
          <span>Used {template.used}x</span>
          {template.tags && template.tags.length > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FF6A39]/5 text-[#FF6A39]">
              #{template.tags[0]}
            </span>
          )}
        </div>
      </div>
      {isSelected && (
        <CheckCircle2 size={18} className="text-[#FF6A39] shrink-0 ml-2" />
      )}
    </div>
  );
};

const Upload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      // Using mock data
      setTimeout(() => {
        setTemplates(mockTemplates);
        setIsLoadingTemplates(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setIsLoadingTemplates(false);
    }
  };

  // Get unique categories
  const categories = ["all", ...new Set(templates.map(t => t.category))];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.featured);

  // Simulate file parsing
  const parseFile = (file: UploadFile): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const headers = ['email', 'name', 'company', 'tags'];
        const rowCount = Math.floor(Math.random() * 3000) + 200;
        const preview = Array.from({ length: 5 }, (_, i) => ({
          email: `user${i+1}@example.com`,
          name: `User ${i+1}`,
          company: `Company ${i+1}`,
          tags: 'tag1, tag2'
        }));
        
        resolve({
          headers,
          rows: rowCount,
          preview,
          data: preview
        });
      }, 1500);
    });
  };

  const simulateUpload = async (file: UploadFile) => {
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

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const parsedData = await parseFile(file);
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== file.id) return f;
            const willFail = f.name.toLowerCase().includes("fail");
            return willFail
              ? { ...f, status: "error", errorMsg: "Missing required 'email' column" }
              : { 
                  ...f, 
                  status: "success", 
                  rows: parsedData.rows,
                  headers: parsedData.headers,
                  preview: parsedData.preview,
                  fileData: parsedData.data
                };
          })
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== file.id) return f;
            return { ...f, status: "error", errorMsg: "Failed to parse file" };
          })
        );
      }
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

  const handleStartCampaign = () => {
    const successfulFiles = files.filter(f => f.status === "success");
    if (successfulFiles.length > 0 && selectedTemplate) {
      sessionStorage.setItem('uploadedFileData', JSON.stringify(successfulFiles[0]));
      sessionStorage.setItem('selectedTemplate', JSON.stringify(
        templates.find(t => t.id === selectedTemplate)
      ));
      navigate('/user/campaign');
    } else if (!selectedTemplate) {
      setShowTemplateSelector(true);
    }
  };

  const hasSuccessfulUpload = files.some(f => f.status === "success");

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
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

      {/* Main content */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mf-header mb-4 md:mb-5 lg:mb-7">
            <div className="flex items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-3 md:gap-4">
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
                  <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                    Import recipients from a CSV or Excel file.
                  </p>
                </div>
              </div>
              
              {hasSuccessfulUpload && (
                <button
                  onClick={handleStartCampaign}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#FF6A39] hover:bg-[#e85a2c] text-white rounded-lg font-medium transition-colors text-sm ${
                    !selectedTemplate ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={!selectedTemplate}
                >
                  <span>Start Campaign</span>
                  <ArrowRight size={16} />
                </button>
              )}
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
            </p>
          </div>

          {/* Template Selection Section */}
          <div className="mb-4 md:mb-5 lg:mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  Select Email Template <span className="text-[#FF6A39]">*</span>
                </h2>
                <p className="text-[8px] md:text-[9px] text-[#6B727C] mt-0.5">
                  Choose a template for your campaign
                </p>
              </div>
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1B1E24] border border-[#2A2E37] hover:border-[#3A3F4A] text-[#E8E6E1] text-sm font-medium transition-all hover:bg-[#2A2E37]"
              >
                {showTemplateSelector ? 'Hide' : 'Browse Templates'}
                <ChevronRight size={14} className={`transform transition-transform ${showTemplateSelector ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Selected Template Display */}
            {selectedTemplate && (
              <div className="p-3 rounded-lg border border-[#FF6A39]/20 bg-[#FF6A39]/5 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {templates.find(t => t.id === selectedTemplate)?.thumbnail || '📧'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {templates.find(t => t.id === selectedTemplate)?.name || 'Selected Template'}
                      </p>
                      <p className="text-xs text-[#6B727C]">
                        Subject: {templates.find(t => t.id === selectedTemplate)?.subject || ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2E37] text-[#9BA0A8]">
                          {templates.find(t => t.id === selectedTemplate)?.category}
                        </span>
                        <span className="text-[8px] text-[#6B727C]">
                          Used {templates.find(t => t.id === selectedTemplate)?.used} times
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-[#6B727C] hover:text-[#E8E6E1] p-1 hover:bg-[#2A2E37] rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Template Selector */}
            {showTemplateSelector && (
              <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] overflow-hidden">
                {/* Search and Filter */}
                <div className="p-3 border-b border-[#2A2E37]">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B727C]" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] placeholder:text-[#6B727C] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] text-sm focus:border-[#FF6A39] focus:outline-none transition-colors cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                          </option>
                        ))}
                      </select>
                      <div className="flex rounded-lg overflow-hidden border border-[#2A2E37]">
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          className={`p-2 transition-colors ${
                            viewMode === 'grid' ? 'bg-[#FF6A39] text-white' : 'bg-[#1B1E24] text-[#6B727C] hover:text-[#E8E6E1]'
                          }`}
                        >
                          <Grid3x3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`p-2 transition-colors ${
                            viewMode === 'list' ? 'bg-[#FF6A39] text-white' : 'bg-[#1B1E24] text-[#6B727C] hover:text-[#E8E6E1]'
                          }`}
                        >
                          <Layout size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Templates */}
                <div className="p-3">
                  {isLoadingTemplates ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#FF6A39] mx-auto" />
                      <p className="text-sm text-[#6B727C] mt-2">Loading templates...</p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-[#6B727C] mx-auto mb-2" />
                      <p className="text-sm text-[#6B727C]">No templates found</p>
                    </div>
                  ) : (
                    <>
                      {/* Featured */}
                      {searchQuery === '' && selectedCategory === 'all' && featuredTemplates.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-[#6B727C] flex items-center gap-2 mb-2">
                            <Star size={14} className="text-yellow-400" />
                            Featured Templates
                          </p>
                          <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-3' 
                            : 'space-y-2'
                          }>
                            {featuredTemplates.map((template) => (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                isSelected={selectedTemplate === template.id}
                                onSelect={() => {
                                  setSelectedTemplate(template.id);
                                  setShowTemplateSelector(false);
                                }}
                                viewMode={viewMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Templates */}
                      <div>
                        <div className={viewMode === 'grid' 
                          ? 'grid grid-cols-1 md:grid-cols-2 gap-3' 
                          : 'space-y-2'
                        }>
                          {filteredTemplates
                            .filter(t => !t.featured || searchQuery !== '' || selectedCategory !== 'all')
                            .map((template) => (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                isSelected={selectedTemplate === template.id}
                                onSelect={() => {
                                  setSelectedTemplate(template.id);
                                  setShowTemplateSelector(false);
                                }}
                                viewMode={viewMode}
                              />
                            ))
                          }
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#2A2E37] flex items-center justify-between">
                  <button className="text-[#6B727C] hover:text-[#E8E6E1] text-sm flex items-center gap-1">
                    <Plus size={16} />
                    Create New Template
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B727C]">
                      {filteredTemplates.length} templates
                    </span>
                    <button
                      onClick={() => setShowTemplateSelector(false)}
                      className="text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          {/* File Stats Summary */}
          {hasSuccessfulUpload && (
            <div className="mb-4 md:mb-5 lg:mb-6 p-4 rounded-xl border border-[#2A2E37] bg-[#1B1E24]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-[#6B727C]">Total Recipients</p>
                    <p className="text-xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                      {files.filter(f => f.status === "success").reduce((acc, f) => acc + (f.rows || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B727C]">Files Uploaded</p>
                    <p className="text-xl font-bold text-white" style={{ fontFamily: FONT.display }}>
                      {files.filter(f => f.status === "success").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B727C]">Valid Columns</p>
                    <p className="text-sm font-medium text-[#34D399]" style={{ fontFamily: FONT.mono }}>
                      {files.find(f => f.status === "success")?.headers?.join(', ') || 'email, name, company, tags'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B727C]">Template</p>
                    <p className="text-sm font-medium text-[#FF6A39]" style={{ fontFamily: FONT.display }}>
                      {selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name || 'Selected' : 'Not selected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartCampaign}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-semibold transition-colors text-sm ${
                    selectedTemplate 
                      ? 'bg-[#FF6A39] hover:bg-[#e85a2c] cursor-pointer' 
                      : 'bg-[#2A2E37] cursor-not-allowed opacity-50'
                  }`}
                  disabled={!selectedTemplate}
                >
                  <span>{selectedTemplate ? 'Continue to Campaign Setup' : 'Select Template First'}</span>
                  <ArrowRight size={18} />
                </button>
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