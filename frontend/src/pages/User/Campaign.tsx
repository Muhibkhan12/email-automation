// CampaignSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  ArrowLeft, Send, Mail, Users, Calendar, Clock, FileText,
  Image, Code, AlertCircle, CheckCircle, ChevronDown, Menu,
  Edit3, Eye, Trash2, Plus, Search
} from 'lucide-react';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
  thumbnail: string;
  category: string;
  used: number;
}

const templates: Template[] = [
  {
    id: 't1',
    name: 'Newsletter Modern',
    subject: 'Weekly Newsletter',
    preview: 'Modern newsletter template with hero image...',
    thumbnail: '🎨',
    category: 'Newsletter',
    used: 234
  },
  {
    id: 't2',
    name: 'Promotional Flash Sale',
    subject: 'Flash Sale Alert!',
    preview: 'High-converting promotional template...',
    thumbnail: '🔥',
    category: 'Promotion',
    used: 189
  },
  {
    id: 't3',
    name: 'Welcome Series',
    subject: 'Welcome to our community!',
    preview: 'Warm welcome email with onboarding steps...',
    thumbnail: '👋',
    category: 'Onboarding',
    used: 567
  },
  {
    id: 't4',
    name: 'Event Invitation',
    subject: 'You\'re Invited!',
    preview: 'Elegant event invitation template...',
    thumbnail: '🎪',
    category: 'Event',
    used: 145
  }
];

const CampaignSetup = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('t1');
  const [emailSubject, setEmailSubject] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);

  useEffect(() => {
    // Retrieve uploaded file data
    const data = sessionStorage.getItem('uploadedFileData');
    if (data) {
      setUploadedData(JSON.parse(data));
    } else {
      // Redirect back to upload if no data
      navigate('/upload');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    // Simulate campaign launch
    setTimeout(() => {
      setIsValidating(false);
      // Navigate to campaign dashboard or success page
      navigate('/user/campaigns');
    }, 2000);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
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
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => navigate('/upload')}
                className="p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
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
                  Campaign Setup
                </h1>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                  Configure your email campaign details and choose a template.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Summary */}
          {uploadedData && (
            <div className="mb-4 md:mb-5 lg:mb-6 p-3 md:p-4 rounded-xl border border-[#2A2E37] bg-[#1B1E24]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#FF6A39]/10 flex items-center justify-center">
                    <Users size={18} className="text-[#FF6A39]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B727C]">Uploaded File</p>
                    <p className="text-sm font-medium text-white">{uploadedData.name}</p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-[#2A2E37]" />
                  <div>
                    <p className="text-xs text-[#6B727C]">Total Recipients</p>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: FONT.display }}>
                      {uploadedData.rows?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-sm text-[#FF6A39] hover:text-[#e85a2c] font-medium"
                >
                  Change File
                </button>
              </div>
            </div>
          )}

          {/* Campaign Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 lg:space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37]">
                <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  Campaign Details
                </h2>
              </div>
              <div className="p-3 md:p-4 lg:p-5 space-y-3 md:space-y-4">
                <div>
                  <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                    Campaign Name <span className="text-[#FF6A39]">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] placeholder:text-[#6B727C] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                      Sender Name <span className="text-[#FF6A39]">*</span>
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your company name"
                      className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] placeholder:text-[#6B727C] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                      Sender Email <span className="text-[#FF6A39]">*</span>
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="noreply@yourcompany.com"
                      className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] placeholder:text-[#6B727C] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                    Email Subject <span className="text-[#FF6A39]">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject line"
                    className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] placeholder:text-[#6B727C] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37]">
                <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  Select Template <span className="text-[#FF6A39]">*</span>
                </h2>
              </div>
              <div className="p-3 md:p-4 lg:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-[#FF6A39] bg-[#FF6A39]/5'
                          : 'border-[#2A2E37] bg-[#1B1E24] hover:border-[#3A3F4A]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl md:text-3xl">{template.thumbnail}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#E8E6E1] text-sm">{template.name}</h3>
                          <p className="text-xs text-[#6B727C] mt-0.5">{template.preview}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-[#2A2E37] text-[#9BA0A8]">
                              {template.category}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-[#6B727C]">
                              Used {template.used} times
                            </span>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle size={16} className="text-[#FF6A39] shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
              <div className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-4 border-b border-[#2A2E37]">
                <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                  Schedule
                </h2>
              </div>
              <div className="p-3 md:p-4 lg:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !isScheduled
                        ? 'bg-[#FF6A39] text-white'
                        : 'bg-[#1B1E24] text-[#6B727C] hover:bg-[#2A2E37]'
                    }`}
                  >
                    Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isScheduled
                        ? 'bg-[#FF6A39] text-white'
                        : 'bg-[#1B1E24] text-[#6B727C] hover:bg-[#2A2E37]'
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>
                {isScheduled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                        required={isScheduled}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-[#C7C9CE] mb-1.5">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1B1E24] border border-[#2A2E37] text-[#E8E6E1] focus:border-[#FF6A39] focus:outline-none transition-colors text-sm"
                        required={isScheduled}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Summary & Submit */}
            <div className="rounded-xl border border-[#2A2E37] bg-[#1B1E24] shadow-sm overflow-hidden">
              <div className="p-4 md:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#FF6A39]/10 flex items-center justify-center">
                      <Send size={20} className="text-[#FF6A39]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white" style={{ fontFamily: FONT.display }}>
                        Ready to launch?
                      </p>
                      <p className="text-xs text-[#6B727C]">
                        Sending to {uploadedData?.rows?.toLocaleString() || '0'} recipients
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isValidating}
                    className={`w-full sm:w-auto px-6 py-3 bg-[#FF6A39] hover:bg-[#e85a2c] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                      isValidating ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isValidating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Launching Campaign...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Launch Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CampaignSetup;