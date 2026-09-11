// UserCampaigns.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../../contexts/CampaignContext';
import type { Campaign } from '../../services/CampaignService';
import Sidebar from './Sidebar';

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_STYLES: Record<Campaign['status'], { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: '#2A2E37',              text: '#9BA0A8', label: 'Draft' },
  READY:     { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Ready' },
  RUNNING:   { bg: 'rgba(34,197,94,0.1)',  text: '#22C55E', label: 'Running' },
  PAUSED:    { bg: 'rgba(234,179,8,0.1)',  text: '#EAB308', label: 'Paused' },
  COMPLETED: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', label: 'Completed' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)',  text: '#EF4444', label: 'Cancelled' },
};

const UserCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, loading, error, refetch } = useCampaigns();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // getMyCampaigns() already hits /campaigns/me, so the backend returns
  // only this user's campaigns — no client-side user_id filtering needed.
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch =
          c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  const statusOptions: Array<'all' | Campaign['status']> = [
    'all',
    'DRAFT',
    'READY',
    'RUNNING',
    'PAUSED',
    'COMPLETED',
    'CANCELLED',
  ];

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-main-content::-webkit-scrollbar { width: 6px; }
        .mf-main-content::-webkit-scrollbar-track { background: #0B0E12; }
        .mf-main-content::-webkit-scrollbar-thumb { background: #2A2E37; border-radius: 3px; }
        .mf-main-content::-webkit-scrollbar-thumb:hover { background: #3A3F4A; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-250 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: '#12151B', height: '100vh', width: '100%' }}>
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-5 lg:mb-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
              >
                ☰
              </button>
              <div>
                <h1 style={{ fontFamily: FONT.display, letterSpacing: '-0.01em', color: '#FFFFFF' }} className="text-xl md:text-2xl lg:text-3xl font-bold">
                  My Campaigns
                </h1>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: '#9BA0A8' }}>
                  All campaigns you've created.
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors text-sm"
              title="Refresh"
            >
              ⟳
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="🔍 Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] placeholder:text-[#6B727C] text-sm focus:border-[#FF6A39] focus:outline-none transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 bg-[#1B1E24] border border-[#2A2E37] rounded-lg text-[#E8E6E1] text-sm focus:border-[#FF6A39] focus:outline-none transition-colors cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : STATUS_STYLES[s].label}
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-[#FF6A39] hover:bg-[#e85a2c] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              + New Campaign
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#FF6A39] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#6B727C] mt-2">Loading campaigns...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-12 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button
                onClick={() => refetch()}
                className="text-[#FF6A39] hover:text-[#e85a2c] text-sm font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredCampaigns.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-[#2A2E37] bg-[#1B1E24]">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm text-[#6B727C]">No campaigns found</p>
            </div>
          )}

          {/* Campaign list */}
          {!loading && !error && filteredCampaigns.length > 0 && (
            <div className="space-y-2">
              {filteredCampaigns.map((campaign) => {
                const statusStyle = STATUS_STYLES[campaign.status];
                return (
                  <div
                    key={campaign.id}
                    onClick={() => navigate(`/user/campaigns/${campaign.id}`)}
                    className="fade-in-up flex items-center justify-between p-3 md:p-4 rounded-xl border border-[#2A2E37] bg-[#12151B] hover:border-[#3A3F4A] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#E8E6E1] text-sm truncate">
                        {campaign.campaign_name}
                      </h3>
                      <p className="text-xs text-[#6B727C] truncate mt-0.5">{campaign.subject}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span
                        className="text-[10px] px-2 py-1 rounded font-medium"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                      >
                        {statusStyle.label}
                      </span>
                      <span className="hidden sm:inline text-xs text-[#6B727C] font-mono">
                        {new Date(campaign.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserCampaigns;