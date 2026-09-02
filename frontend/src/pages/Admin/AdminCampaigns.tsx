// AdminCampaigns.tsx
import React, { useState, useMemo, useContext } from "react";
import { CampaignContext } from "../../contexts/CampaignContext";

import AdminSidebar from "./AdminSidebar";
import {
  Megaphone,
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
  Menu,
  X,
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
/*  Types — mirrors CampaignContext's Campaign shape                       */
/*  (ideally import this from the context file instead of redeclaring —   */
/*  export `Campaign` there so the two never drift apart)                  */
/* ---------------------------------------------------------------------- */

interface StatusStyleConfig {
  bg: string;
  fg: string;
  icon: React.ElementType;
}

const STATUS_STYLE: Record<CampaignStatus, StatusStyleConfig> = {
  DRAFT: { bg: "bg-slate-500/15", fg: "text-slate-400", icon: AlertCircle },
  READY: { bg: "bg-blue-500/15", fg: "text-blue-400", icon: Clock },
  RUNNING: { bg: "bg-emerald-500/15", fg: "text-emerald-400", icon: PlayCircle },
  PAUSED: { bg: "bg-amber-500/15", fg: "text-amber-400", icon: PauseCircle },
  COMPLETED: { bg: "bg-violet-500/15", fg: "text-violet-400", icon: CheckCircle2 },
  CANCELLED: { bg: "bg-rose-500/15", fg: "text-rose-400", icon: XCircle },
};

const FILTERS: ("All" | CampaignStatus)[] = [
  "All",
  "DRAFT",
  "READY",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"] as const;
const RANGE_DAYS: Record<(typeof RANGES)[number], number> = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
};

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Buckets campaigns by created_at day, for the trailing `days` window.
const buildCreationTrend = (campaigns: Campaign[], days: number) => {
  const buckets: { day: string; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = campaigns.filter((c) => c.created_at.slice(0, 10) === dayKey).length;
    buckets.push({ day: label, count });
  }

  return buckets;
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                    */
/* ---------------------------------------------------------------------- */

const AdminCampaigns = () => {
  const campaigns = useContext(CampaignContext);

  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const [filter, setFilter] = useState<"All" | CampaignStatus>("All");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Campaign>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const days = RANGE_DAYS[range];

  // Campaigns created within the selected range — drives stats, chart, and the table.
  const campaignsInRange = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return campaigns.filter((c) => new Date(c.created_at) >= cutoff);
  }, [campaigns, days]);

  const stats = useMemo(() => {
    const count = (status: CampaignStatus) =>
      campaignsInRange.filter((c) => c.status === status).length;

    return [
      { title: "Total Campaigns", value: campaignsInRange.length, icon: Megaphone, accent: "#FF6A39", accentSoft: "rgba(255,106,57,0.12)" },
      { title: "Running", value: count("RUNNING"), icon: PlayCircle, accent: "#7FD98A", accentSoft: "rgba(127,217,138,0.12)" },
      { title: "Completed", value: count("COMPLETED"), icon: CheckCircle2, accent: "#A78BFA", accentSoft: "rgba(167,139,250,0.12)" },
      { title: "Drafts", value: count("DRAFT"), icon: AlertCircle, accent: "#8B8D94", accentSoft: "rgba(139,141,148,0.12)" },
    ];
  }, [campaignsInRange]);

  const creationTrend = useMemo(
    () => buildCreationTrend(campaignsInRange, days),
    [campaignsInRange, days]
  );

  // Space out X-axis labels so 30/90-day ranges don't get crowded.
  const tickInterval = Math.max(0, Math.floor(days / 8) - 1);

  const filteredCampaigns = useMemo(() => {
    let result = campaignsInRange;

    if (filter !== "All") {
      result = result.filter((c) => c.status === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.campaign_name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [campaignsInRange, filter, search, sortField, sortDirection]);

  const toggleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
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
        @media (max-width: 480px) {
          .filter-buttons {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .filter-buttons::-webkit-scrollbar {
            height: 2px;
          }
          .filter-buttons::-webkit-scrollbar-thumb {
            background: #2A2E37;
            border-radius: 2px;
          }
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
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 bg-[#0E1013] h-screen w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                  Campaigns
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin View
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Monitor all campaigns across workspaces.
              </p>
            </div>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])}
            className="w-full sm:w-auto rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
          >
            {RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div
                  className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
                  style={{ background: stat.accentSoft }}
                >
                  <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: stat.accent }} />
                </div>
                <h2 className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Creation Trend Chart */}
        <div className="mb-6 rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-6 border border-[#2A2E37]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
            <h2 className="text-sm md:text-base lg:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
              Campaigns Created
            </h2>
            <span className="text-[9px] md:text-[10px] lg:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
              {range}
            </span>
          </div>
          <div className="h-[150px] md:h-[180px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creationTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCreatedAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6A39" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF6A39" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2E37" vertical={false} />
                <XAxis
                  dataKey="day"
                  interval={tickInterval}
                  tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #2A2E37",
                    background: "#171A21",
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                    color: "#E8E6E1",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Created"
                  stroke="#FF6A39"
                  strokeWidth={2}
                  fill="url(#fillCreatedAdmin)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign List */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 md:p-4 lg:p-5 border-b border-[#2A2E37]">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 md:gap-2 rounded-lg px-2 md:px-3 py-1 md:py-1.5 lg:py-2 border border-[#2A2E37] bg-[#0E1013] flex-1 lg:flex-none">
                <Search size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#8B8D94] shrink-0" />
                <input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-[10px] md:text-xs lg:text-sm outline-none text-[#C7C9CE] w-[80px] md:w-[120px] lg:w-[180px] placeholder:text-[#8B8D94]"
                />
              </div>

              <div className="filter-buttons flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 -mb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`whitespace-nowrap rounded-full px-2 md:px-2.5 lg:px-3 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-[11px] font-medium transition ${
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

            <button className="flex items-center gap-1 md:gap-1.5 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs font-medium text-[#C7C9CE] border border-[#2A2E37] hover:border-[#3A3F4A] transition">
              <Filter size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" />
              <span className="hidden xs:inline">Filter</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] md:min-w-[900px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                <tr>
                  <th
                    className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("campaign_name")}
                  >
                    <span className="flex items-center gap-1">
                      Campaign <ArrowUpDown size={10} className="md:w-[11px] md:h-[11px]" />
                    </span>
                  </th>
                  <th
                    className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown size={10} className="md:w-[11px] md:h-[11px]" />
                    </span>
                  </th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Template</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Sender</th>
                  <th
                    className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("created_at")}
                  >
                    <span className="flex items-center gap-1">
                      Created <ArrowUpDown size={10} className="md:w-[11px] md:h-[11px]" />
                    </span>
                  </th>
                  <th
                    className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("updated_at")}
                  >
                    <span className="flex items-center gap-1">
                      Updated <ArrowUpDown size={10} className="md:w-[11px] md:h-[11px]" />
                    </span>
                  </th>
                  <th className="px-2 md:px-3 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-6 md:w-8 lg:w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => {
                  const statusStyle = STATUS_STYLE[campaign.status];
                  const StatusIcon = statusStyle.icon;

                  return (
                    <tr key={campaign.id} className="mf-row transition border-t border-[#2A2E37]">
                      <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                        <div>
                          <p className="text-[10px] md:text-[11px] lg:text-[13.5px] font-medium text-[#E8E6E1]">
                            {campaign.campaign_name}
                          </p>
                          <p className="text-[8px] md:text-[9px] lg:text-[11px] text-[#8B8D94]">
                            {campaign.subject}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2 lg:px-2.5 py-0.5 text-[8px] md:text-[9px] lg:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.fg}`}
                        >
                          <StatusIcon size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                          <span className="hidden xs:inline">{campaign.status}</span>
                          <span className="xs:hidden">{campaign.status.charAt(0)}</span>
                        </span>
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[10px] md:text-[11px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        #{campaign.template_id}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[10px] md:text-[11px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        #{campaign.sender_account_id}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {formatDate(campaign.updated_at)}
                      </td>
                      <td className="px-2 md:px-3 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                        <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                          <MoreHorizontal size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 md:px-5 py-8 md:py-12 text-center text-[10px] md:text-sm text-[#8B8D94]">
                      No campaigns found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-t border-[#2A2E37]">
            <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">
              Showing {filteredCampaigns.length} of {campaignsInRange.length} campaigns
            </span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-[#FF6A39] text-white text-[9px] md:text-xs font-medium">
                1
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-[9px] md:text-xs hover:bg-[#1B1E24] transition">
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