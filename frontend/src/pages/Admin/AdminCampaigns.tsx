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
      `}</style>

      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
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
            onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])}
            className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-[#C7C9CE] outline-none w-full sm:w-auto focus:border-[#FF6A39]"
          >
            {RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-[#171A21] p-4 md:p-5 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div
                  className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg"
                  style={{ background: stat.accentSoft }}
                >
                  <Icon size={14} style={{ color: stat.accent }} />
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Creation Trend Chart */}
        <div className="mb-6 rounded-xl bg-[#171A21] p-4 md:p-6 border border-[#2A2E37]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
              Campaigns Created
            </h2>
            <span className="text-[10px] md:text-[11px] text-[#8B8D94] font-['JetBrains_Mono']">
              {range}
            </span>
          </div>
          <div className="h-[180px] md:h-[220px]">
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
                  tick={{ fontSize: 11, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
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

            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#C7C9CE] border border-[#2A2E37] hover:border-[#3A3F4A] transition">
              <Filter size={13} />
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="text-[10px] md:text-[11px] uppercase tracking-wide text-[#8B8D94] border-b border-[#2A2E37]">
                <tr>
                  <th
                    className="px-3 md:px-5 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("campaign_name")}
                  >
                    <span className="flex items-center gap-1">
                      Campaign <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-3 py-3 font-medium">Template</th>
                  <th className="px-3 py-3 font-medium">Sender Account</th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("created_at")}
                  >
                    <span className="flex items-center gap-1">
                      Created <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th
                    className="px-3 py-3 font-medium cursor-pointer hover:text-[#E8E6E1] transition"
                    onClick={() => toggleSort("updated_at")}
                  >
                    <span className="flex items-center gap-1">
                      Updated <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-3 md:px-5 py-3 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => {
                  const statusStyle = STATUS_STYLE[campaign.status];
                  const StatusIcon = statusStyle.icon;

                  return (
                    <tr key={campaign.id} className="mf-row transition border-t border-[#2A2E37]">
                      <td className="px-3 md:px-5 py-3.5">
                        <div>
                          <p className="text-[12px] md:text-[13.5px] font-medium text-[#E8E6E1]">
                            {campaign.campaign_name}
                          </p>
                          <p className="text-[10px] md:text-[11px] text-[#8B8D94]">
                            {campaign.subject}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium ${statusStyle.bg} ${statusStyle.fg}`}
                        >
                          <StatusIcon size={12} />
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        #{campaign.template_id}
                      </td>
                      <td className="px-3 py-3.5 text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        #{campaign.sender_account_id}
                      </td>
                      <td className="px-3 py-3.5 text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="px-3 py-3.5 text-[12px] md:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                        {formatDate(campaign.updated_at)}
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
              Showing {filteredCampaigns.length} of {campaignsInRange.length} campaigns
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 rounded-lg border border-[#2A2E37] text-[#C7C9CE] text-xs hover:bg-[#1B1E24] transition disabled:opacity-40 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-medium">
                1
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