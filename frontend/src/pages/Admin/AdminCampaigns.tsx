import React, { useState, useMemo } from "react";
import Sidebar from "../User/Sidebar";
import {
  Megaphone,
  Send,
  Users,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  Mail,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type CampaignStatus = "Running" | "Scheduled" | "Completed" | "Failed" | "Paused";

interface Campaign {
  id: string;
  name: string;
  workspace: string;
  status: CampaignStatus;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  bounceRate: number;
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;
}

interface StatCard {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const campaignStats: StatCard[] = [
  { title: "Total Campaigns", value: "1,842", delta: "+12.4%", trend: "up", icon: Megaphone, accent: "#FF6A39", accentSoft: "rgba(255,106,57,0.12)" },
  { title: "Active Campaigns", value: "47", delta: "+8", trend: "up", icon: PlayCircle, accent: "#7FD98A", accentSoft: "rgba(127,217,138,0.12)" },
  { title: "Total Recipients", value: "2.4M", delta: "+18.2%", trend: "up", icon: Users, accent: "#FFC24B", accentSoft: "rgba(255,194,75,0.12)" },
  { title: "Avg. Open Rate", value: "46.8%", delta: "+2.1%", trend: "up", icon: Eye, accent: "#7C3AED", accentSoft: "rgba(124,58,237,0.12)" },
];

const campaigns: Campaign[] = [
  {
    id: "c1",
    name: "Summer Sale 2026",
    workspace: "Nimbus Retail",
    status: "Running",
    recipients: 24500,
    sent: 18420,
    opened: 9870,
    clicked: 2340,
    bounceRate: 2.4,
    createdAt: "2026-08-15",
    scheduledFor: undefined,
    completedAt: undefined,
  },
  {
    id: "c2",
    name: "Weekly Newsletter #42",
    workspace: "VentureHub Co",
    status: "Completed",
    recipients: 12900,
    sent: 12840,
    opened: 6120,
    clicked: 890,
    bounceRate: 0.6,
    createdAt: "2026-08-12",
    scheduledFor: undefined,
    completedAt: "2026-08-13",
  },
  {
    id: "c3",
    name: "Product Launch Announcement",
    workspace: "BrightPath Org",
    status: "Scheduled",
    recipients: 8500,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounceRate: 0,
    createdAt: "2026-08-14",
    scheduledFor: "2026-08-20T14:00:00",
    completedAt: undefined,
  },
  {
    id: "c4",
    name: "Cart Abandonment Flow",
    workspace: "Driftlabs Dev",
    status: "Running",
    recipients: 3420,
    sent: 2100,
    opened: 980,
    clicked: 310,
    bounceRate: 1.8,
    createdAt: "2026-08-16",
    scheduledFor: undefined,
    completedAt: undefined,
  },
  {
    id: "c5",
    name: "Customer Feedback Survey",
    workspace: "Meridian Corp",
    status: "Failed",
    recipients: 5600,
    sent: 3420,
    opened: 0,
    clicked: 0,
    bounceRate: 42.0,
    createdAt: "2026-08-10",
    scheduledFor: undefined,
    completedAt: "2026-08-11",
  },
  {
    id: "c6",
    name: "Onboarding Sequence — Day 3",
    workspace: "Nimbus Retail",
    status: "Paused",
    recipients: 1200,
    sent: 890,
    opened: 540,
    clicked: 120,
    bounceRate: 3.2,
    createdAt: "2026-08-08",
    scheduledFor: undefined,
    completedAt: undefined,
  },
  {
    id: "c7",
    name: "Black Friday Preview",
    workspace: "Meridian Corp",
    status: "Scheduled",
    recipients: 18400,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounceRate: 0,
    createdAt: "2026-08-17",
    scheduledFor: "2026-08-25T09:00:00",
    completedAt: undefined,
  },
];

const deliveryTrend = [
  { day: "Aug 12", sent: 8400, opened: 3800 },
  { day: "Aug 13", sent: 9200, opened: 4400 },
  { day: "Aug 14", sent: 7800, opened: 3600 },
  { day: "Aug 15", sent: 11200, opened: 5400 },
  { day: "Aug 16", sent: 9800, opened: 4700 },
  { day: "Aug 17", sent: 13400, opened: 6200 },
  { day: "Aug 18", sent: 10800, opened: 4900 },
];

const STATUS_STYLE: Record<CampaignStatus, { bg: string; fg: string; icon: React.ElementType; dot: string }> = {
  Running: { bg: "bg-emerald-500/15", fg: "text-emerald-400", icon: PlayCircle, dot: "bg-emerald-400" },
  Scheduled: { bg: "bg-blue-500/15", fg: "text-blue-400", icon: Clock, dot: "bg-blue-400" },
  Completed: { bg: "bg-slate-500/15", fg: "text-slate-400", icon: CheckCircle2, dot: "bg-slate-400" },
  Failed: { bg: "bg-rose-500/15", fg: "text-rose-400", icon: XCircle, dot: "bg-rose-400" },
  Paused: { bg: "bg-amber-500/15", fg: "text-amber-400", icon: PauseCircle, dot: "bg-amber-400" },
};

const FILTERS = ["All", "Running", "Scheduled", "Completed", "Failed", "Paused"];
const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminCampaigns = () => {
  const [range, setRange] = useState(RANGES[0]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Campaign>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredCampaigns = useMemo(() => {
    let result = campaigns;

    // Filter by status
    if (filter !== "All") {
      result = result.filter((c) => c.status === filter);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.workspace.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [filter, search, sortField, sortDirection]);

  const toggleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusIcon = (status: CampaignStatus) => {
    return STATUS_STYLE[status].icon;
  };

  const getStatusColor = (status: CampaignStatus) => {
    return STATUS_STYLE[status];
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0E1013]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: #0E1013;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
        }
        .mf-row:hover {
          background-color: #1B1E24;
        }
        .pulse-dot {
          animation: pulse-fade 1.8s ease-in-out infinite;
        }
        @keyframes pulse-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                Campaigns
              </h1>
              <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                Admin View
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-[#8B8D94]">
              Monitor all campaigns across workspaces.
            </p>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-[#C7C9CE] outline-none w-full sm:w-auto focus:border-[#FF6A39]"
          >
            {RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {campaignStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-[#171A21] p-4 md:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={14} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] md:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.delta}
                  </span>
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">
                  {stat.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Delivery Trend Chart */}
        <div className="mb-6 rounded-xl bg-[#171A21] p-4 md:p-6 border border-[#2A2E37]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
              Delivery & Engagement Trend
            </h2>
            <span className="text-[10px] md:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
              Last 7 days
            </span>
          </div>
          <div className="h-[180px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveryTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSentAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6A39" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF6A39" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillOpenedAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7FD98A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7FD98A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2E37" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8B8D94", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #2A2E37",
                    background: "#171A21",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    color: "#E8E6E1",
                  }}
                />
                <Area type="monotone" dataKey="sent" name="Sent" stroke="#FF6A39" strokeWidth={2} fill="url(#fillSentAdmin)" />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#7FD98A" strokeWidth={2} fill="url(#fillOpenedAdmin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign List */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b border-[#2A2E37]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-[#2A2E37] bg-[#0E1013]">
                <Search size={14} className="text-[#8B8D94]" />
                <input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-[120px] md:w-[180px] placeholder:text-[#8B8D94]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-2.5 md:px-3 py-1 text-[10px] md:text-[11px] font-medium transition ${
                      filter === f
                        ? "bg-[#FF6A39] text-white"
                        : "text-[#C7C9CE] hover:bg-[#2A2E37]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#C7C9CE] border border-[#2A2E37] hover:border-[#3A3F4A] transition">
                <Filter size={13} />
                Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                <tr>
                  <th className="px-3 md:px-5 py-3 font-medium">Campaign</th>
                  <th className="px-3 py-3 font-medium">Workspace</th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("recipients")}
                  >
                    <span className="flex items-center gap-1">
                      Recipients <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("opened")}
                  >
                    <span className="flex items-center gap-1">
                      Open Rate <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("bounceRate")}
                  >
                    <span className="flex items-center gap-1">
                      Bounce <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-3 md:px-5 py-3 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign, i) => {
                  const statusStyle = getStatusColor(campaign.status);
                  const StatusIcon = statusStyle.icon;
                  const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0;

                  return (
                    <tr
                      key={campaign.id}
                      className="mf-row transition border-t border-[#2A2E37]"
                    >
                      <td className="px-3 md:px-5 py-3.5">
                        <div>
                          <p className="text-[12px] md:text-[13.5px] font-medium text-[#E8E6E1]">
                            {campaign.name}
                          </p>
                          <p className="text-[10px] md:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
                            {campaign.createdAt}
                            {campaign.scheduledFor && (
                              <span className="ml-2 text-blue-400">
                                Scheduled: {new Date(campaign.scheduledFor).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-[12px] md:text-[13px] text-[#C7C9CE]">
                          {campaign.workspace}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.fg}`}>
                          <StatusIcon size={12} />
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {campaign.recipients.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                            {campaign.sent > 0 ? `${openRate}%` : "—"}
                          </span>
                          <div className="w-16 md:w-20 h-1.5 rounded-full bg-[#2A2E37] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#7FD98A] transition-all"
                              style={{ width: `${campaign.sent > 0 ? openRate : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-[12px] md:text-[13px] font-['JetBrains_Mono'] ${
                            campaign.bounceRate > 10
                              ? "text-[#FF5C6C]"
                              : campaign.bounceRate > 5
                              ? "text-[#FFC24B]"
                              : "text-[#7FD98A]"
                          }`}
                        >
                          {campaign.sent > 0 ? `${campaign.bounceRate}%` : "—"}
                        </span>
                      </td>
                      <td className="px-3 md:px-5 py-3.5 text-right">
                        <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#8B8D94]">
                      No campaigns found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-t border-[#2A2E37]">
            <span className="text-[10px] md:text-xs text-[#8B8D94]">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-medium">
                1
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                2
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                3
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCampaigns;