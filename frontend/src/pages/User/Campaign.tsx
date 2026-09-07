// CampaignSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

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
  tags?: string[];
  featured?: boolean;
}

const CampaignSetup = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('uploadedFileData');
    if (data) {
      setUploadedData(JSON.parse(data));
    } else {
      navigate('/upload');
    }
    
    fetchTemplates();
  }, [navigate]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      // API call to get templates from DB
      // const response = await api.get('/templates');
      // setTemplates(response.data);
      
      // Mock data - replace with actual API call
      setTimeout(() => {
        const mockTemplates: Template[] = [
          {
            id: '1',
            name: 'Newsletter Modern',
            subject: 'Weekly Newsletter',
            preview: 'Modern newsletter template with hero image and responsive design...',
            thumbnail: '📰',
            category: 'Newsletter',
            used: 234,
            tags: ['Modern', 'Responsive'],
            featured: true
          },
          {
            id: '2',
            name: 'Promotional Flash Sale',
            subject: 'Flash Sale Alert!',
            preview: 'High-converting promotional template with countdown timer...',
            thumbnail: '🔥',
            category: 'Promotion',
            used: 189,
            tags: ['Urgent', 'Sales'],
            featured: true
          },
          {
            id: '3',
            name: 'Welcome Series',
            subject: 'Welcome to our community!',
            preview: 'Warm welcome email with onboarding steps and resources...',
            thumbnail: '👋',
            category: 'Onboarding',
            used: 567,
            tags: ['Welcome', 'Onboarding'],
            featured: false
          },
          {
            id: '4',
            name: 'Event Invitation',
            subject: 'You\'re Invited!',
            preview: 'Elegant event invitation template with RSVP button...',
            thumbnail: '🎪',
            category: 'Event',
            used: 145,
            tags: ['Event', 'Elegant'],
            featured: false
          }
        ];
        setTemplates(mockTemplates);
        if (mockTemplates.length > 0) {
          setSelectedTemplate(mockTemplates[0].id);
        }
        setLoadingTemplates(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoadingTemplates(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    const campaignData = {
      name: campaignName,
      template_id: selectedTemplate,
      sender_name: senderName,
      sender_email: senderEmail,
      subject: emailSubject,
      scheduled: isScheduled,
      scheduled_date: isScheduled ? scheduledDate : null,
      scheduled_time: isScheduled ? scheduledTime : null,
      recipients: uploadedData
    };
    
    console.log('Campaign Data:', campaignData);
    
    setTimeout(() => {
      setIsValidating(false);
      navigate('/user/campaigns');
    }, 2000);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  
  const categories = ['all', ...new Set(templates.map(t => t.category))];
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.featured);

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
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-overlay bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        sidebar-slide
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mf-header mb-4 md:mb-5 lg:mb-7">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => navigate('/upload')}
                className="p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                ☰
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
                  <div className="w-10 h-10 rounded-lg bg-[#FF6A39]/10 flex items-center justify-center text-[#FF6A39] font-bold text-lg">
                    📄
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 style={{ fontFamily: FONT.display }} className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#E8E6E1]">
                    Select Template <span className="text-[#FF6A39]">*</span>
                  </h2>
                  <span className="text-[10px] md:text-xs text-[#6B727C]">
                    {filteredTemplates.length} templates
                  </span>
                </div>
              </div>

              <div className="p-3 md:p-4 lg:p-5 space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex-1 min-w-[180px] relative">
                    <input
                      type="text"
                      placeholder="🔍 Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] placeholder:text-[#6B727C] text-sm focus:border-[#FF6A39] focus:outline-none transition-colors"
                    />
                  </div>
                  
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
                      className={`px-3 py-2 text-sm transition-colors ${
                        viewMode === 'grid' ? 'bg-[#FF6A39] text-white' : 'bg-[#1B1E24] text-[#6B727C] hover:text-[#E8E6E1]'
                      }`}
                    >
                      ⊞ Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm transition-colors ${
                        viewMode === 'list' ? 'bg-[#FF6A39] text-white' : 'bg-[#1B1E24] text-[#6B727C] hover:text-[#E8E6E1]'
                      }`}
                    >
                      ≡ List
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loadingTemplates && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-[#6B727C] mt-2">Loading templates...</p>
                  </div>
                )}

                {/* Templates */}
                {!loadingTemplates && (
                  <>
                    {/* Featured Templates */}
                    {searchQuery === '' && selectedCategory === 'all' && featuredTemplates.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#6B727C] flex items-center gap-2 mb-2">
                          ⭐ Featured Templates
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
                              onSelect={() => setSelectedTemplate(template.id)}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Templates */}
                    <div>
                      {(searchQuery !== '' || selectedCategory !== 'all' || featuredTemplates.length > 0) && (
                        <p className="text-xs font-medium text-[#6B727C] flex items-center gap-2 mb-2">
                          📄 {searchQuery !== '' || selectedCategory !== 'all' ? 'Search Results' : 'All Templates'}
                        </p>
                      )}
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
                              onSelect={() => setSelectedTemplate(template.id)}
                              viewMode={viewMode}
                            />
                          ))
                        }
                      </div>
                    </div>

                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-6">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm text-[#6B727C]">No templates found</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                          }}
                          className="text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium mt-1"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Selected Template Preview */}
                {selectedTemplateData && (
                  <div className="mt-4 p-4 rounded-lg border border-[#FF6A39]/20 bg-[#FF6A39]/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{selectedTemplateData.thumbnail}</div>
                        <div>
                          <h3 className="font-semibold text-[#E8E6E1]">
                            {selectedTemplateData.name} <span className="text-[#FF6A39] text-sm font-normal">(Selected)</span>
                          </h3>
                          <p className="text-sm text-[#6B727C] mt-0.5">{selectedTemplateData.preview}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-[#2A2E37] text-[#9BA0A8]">
                              {selectedTemplateData.category}
                            </span>
                            <span className="text-xs text-[#6B727C]">
                              Subject: <span className="text-[#E8E6E1]">{selectedTemplateData.subject}</span>
                            </span>
                            <span className="text-xs text-[#6B727C]">
                              Used by {selectedTemplateData.used} campaigns
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                    <div className="w-12 h-12 rounded-lg bg-[#FF6A39]/10 flex items-center justify-center text-[#FF6A39] text-xl">
                      ✉
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white" style={{ fontFamily: FONT.display }}>
                        Ready to launch?
                      </p>
                      <p className="text-xs text-[#6B727C]">
                        Sending to {uploadedData?.rows?.toLocaleString() || '0'} recipients using "{selectedTemplateData?.name}"
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
                        ▶ Launch Campaign
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
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all fade-in-up ${
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
            <span className="text-[#FF6A39] text-lg">✓</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all fade-in-up ${
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
        </div>
      </div>
      {isSelected && (
        <span className="text-[#FF6A39] text-lg ml-2">✓</span>
      )}
    </div>
  );
};

export default CampaignSetup;