// AdminAnalytics.tsx
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Send,
  Eye,
  MousePointer,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Activity,
  Globe,
  Clock,
  Zap,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const metrics: MetricCard[] = [
  {
    title: "Total Emails Sent",
    value: "2,847,293",
    change: "+12.8%",
    trend: "up",
    icon: Send,
    accent: "#FF6A39",
    accentSoft: "rgba(255,106,57,0.12)",
  },
  {
    title: "Average Open Rate",
    value: "46.8%",
    change: "+2.1%",
    trend: "up",
    icon: Eye,
    accent: "#7FD98A",
    accentSoft: "rgba(127,217,138,0.12)",
  },
  {
    title: "Average Click Rate",
    value: "8.9%",
    change: "-0.8%",
    trend: "down",
    icon: MousePointer,
    accent: "#FFC24B",
    accentSoft: "rgba(255,194,75,0.12)",
  },
  {
    title: "Total Recipients",
    value: "1,842,500",
    change: "+18.4%",
    trend: "up",
    icon: Users,
    accent: "#7C3AED",
    accentSoft: "rgba(124,58,237,0.12)",
  },
  {
    title: "Bounce Rate",
    value: "2.4%",
    change: "-0.6%",
    trend: "down",
    icon: Activity,
    accent: "#FF5C6C",
    accentSoft: "rgba(255,92,108,0.12)",
  },
  {
    title: "Avg. Delivery Time",
    value: "1.8s",
    change: "-0.3s",
    trend: "up",
    icon: Clock,
    accent: "#60A5FA",
    accentSoft: "rgba(96,165,250,0.12)",
  },
];

const weeklyData = [
  { day: "Mon", sent: 32000, opened: 15000, clicked: 2800 },
  { day: "Tue", sent: 45000, opened: 21000, clicked: 3900 },
  { day: "Wed", sent: 38000, opened: 17800, clicked: 3200 },
  { day: "Thu", sent: 52000, opened: 24400, clicked: 4600 },
  { day: "Fri", sent: 48000, opened: 22500, clicked: 4100 },
  { day: "Sat", sent: 28000, opened: 13100, clicked: 2300 },
  { day: "Sun", sent: 25000, opened: 11700, clicked: 2000 },
];

const monthlyData = [
  { month: "Jan", sent: 180000, opened: 84000 },
  { month: "Feb", sent: 195000, opened: 91000 },
  { month: "Mar", sent: 210000, opened: 98000 },
  { month: "Apr", sent: 225000, opened: 105000 },
  { month: "May", sent: 240000, opened: 112000 },
  { month: "Jun", sent: 260000, opened: 122000 },
  { month: "Jul", sent: 280000, opened: 131000 },
  { month: "Aug", sent: 310000, opened: 145000 },
];

const engagementData = [
  { name: "Opened", value: 46.8, color: "#FF6A39" },
  { name: "Clicked", value: 8.9, color: "#FFC24B" },
  { name: "Bounced", value: 2.4, color: "#FF5C6C" },
  { name: "Unopened", value: 41.9, color: "#2A2E37" },
];

const deviceData = [
  { name: "Desktop", value: 58, color: "#FF6A39" },
  { name: "Mobile", value: 32, color: "#FFC24B" },
  { name: "Tablet", value: 10, color: "#7FD98A" },
];

const hourlyData = [
  { hour: "6am", opens: 1200 },
  { hour: "8am", opens: 3400 },
  { hour: "10am", opens: 5800 },
  { hour: "12pm", opens: 6200 },
  { hour: "2pm", opens: 7100 },
  { hour: "4pm", opens: 6800 },
  { hour: "6pm", opens: 4900 },
  { hour: "8pm", opens: 3200 },
  { hour: "10pm", opens: 1800 },
];

const topWorkspaces = [
  { name: "Nimbus Retail", sent: 482000, openRate: "52.4%" },
  { name: "Meridian Corp", sent: 388000, openRate: "48.1%" },
  { name: "VentureHub Co", sent: 214000, openRate: "44.3%" },
  { name: "BrightPath Org", sent: 198500, openRate: "39.8%" },
  { name: "Driftlabs Dev", sent: 96200, openRate: "41.2%" },
];

const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminAnalytics = () => {
  const [range, setRange] = useState(RANGES[1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        .mf-card:hover {
          border-color: #3A3F4A;
        }
        .stat-card {
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
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
          .metric-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .metric-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .metric-grid {
            grid-template-columns: 1fr 1fr 1fr;
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

      {/* Main Content */}
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
                  Analytics
                </h1>
                <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium bg-[#FF6A39]/15 text-[#FF6A39]">
                  Admin View
                </span>
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm text-[#8B8D94]">
                Platform-wide analytics and performance metrics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] hover:border-[#3A3F4A] transition flex-1 sm:flex-none justify-center">
              <Download size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
              <span className="hidden xs:inline">Export</span>
            </button>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg border border-[#2A2E37] bg-[#171A21] px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 text-[10px] md:text-xs lg:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {RANGES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.title}
                className="stat-card rounded-xl bg-[#171A21] p-3 md:p-4 border border-[#2A2E37] hover:border-[#3A3F4A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg shrink-0"
                    style={{ background: metric.accentSoft }}
                  >
                    <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: metric.accent }} />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[8px] md:text-[9px] lg:text-[10px] font-medium shrink-0 ml-1 ${
                      metric.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <ArrowUpRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                    ) : (
                      <ArrowDownRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                    )}
                    {metric.change}
                  </span>
                </div>
                <p className="mt-1.5 md:mt-2 text-base md:text-lg lg:text-xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {metric.value}
                </p>
                <p className="mt-0.5 text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">{metric.title}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          {/* Weekly Activity */}
          <div className="lg:col-span-2 rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-6 border border-[#2A2E37]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
              <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
                Weekly Activity
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#FF6A39]" />
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Sent</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#7FD98A]" />
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Opened</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#FFC24B]" />
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Clicked</span>
                </div>
              </div>
            </div>
            <div className="h-[180px] md:h-[220px] lg:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A39" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FF6A39" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7FD98A" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7FD98A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2E37" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                    dataKey="sent"
                    stroke="#FF6A39"
                    strokeWidth={2}
                    fill="url(#sentGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    stroke="#7FD98A"
                    strokeWidth={2}
                    fill="url(#openedGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicked"
                    stroke="#FFC24B"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-6 border border-[#2A2E37]">
            <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk'] mb-3 md:mb-4">
              Engagement Breakdown
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <div className="w-[100px] h-[100px] md:w-[110px] md:h-[110px] lg:w-[120px] lg:h-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementData}
                      dataKey="value"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={2}
                    >
                      {engagementData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5 md:space-y-2">
                {engagementData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[#C7C9CE]">
                      <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-[10px] md:text-xs font-medium text-[#E8E6E1] font-['JetBrains_Mono']">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          {/* Monthly Trend */}
          <div className="lg:col-span-2 rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-6 border border-[#2A2E37]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
              <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
                Monthly Trend
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#FF6A39]" />
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Sent</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#7FD98A]" />
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Opened</span>
                </div>
              </div>
            </div>
            <div className="h-[160px] md:h-[190px] lg:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#2A2E37" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#8B8D94", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                  <Bar dataKey="sent" fill="#FF6A39" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opened" fill="#7FD98A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="rounded-xl bg-[#171A21] p-3 md:p-4 lg:p-6 border border-[#2A2E37]">
            <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk'] mb-3 md:mb-4">
              Device Distribution
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <div className="w-[100px] h-[100px] md:w-[110px] md:h-[110px] lg:w-[120px] lg:h-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="value"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={2}
                    >
                      {deviceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5 md:space-y-2">
                {deviceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[#C7C9CE]">
                      <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-[10px] md:text-xs font-medium text-[#E8E6E1] font-['JetBrains_Mono']">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Time */}
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[#2A2E37]">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Zap size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px] text-[#FFC24B]" />
                <span className="text-[9px] md:text-[10px] lg:text-xs text-[#8B8D94]">Best Time to Send</span>
              </div>
              <p className="mt-1 text-xs md:text-sm font-medium text-[#E8E6E1]">2:00 PM - 4:00 PM</p>
              <p className="text-[8px] md:text-[9px] lg:text-[10px] text-[#8B8D94]">Peak engagement window</p>
            </div>
          </div>
        </div>

        {/* Top Workspaces */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 lg:p-5 border-b border-[#2A2E37]">
            <h2 className="text-xs md:text-sm font-semibold text-[#E8E6E1] font-['Space_Grotesk']">
              Top Performing Workspaces
            </h2>
            <button className="flex items-center gap-1 text-[8px] md:text-[9px] lg:text-[11.5px] font-medium text-[#FF6A39] hover:text-[#FF7F52]">
              View all
              <ChevronDown size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[400px] md:min-w-[500px]">
              <thead className="text-[8px] md:text-[9px] lg:text-[11px] uppercase tracking-wide text-[#8B8D94]">
                <tr>
                  <th className="px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium">Workspace</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Emails Sent</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Open Rate</th>
                  <th className="px-2 md:px-3 py-2 md:py-2.5 lg:py-3 font-medium">Engagement</th>
                  <th className="px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 font-medium w-8 md:w-10" />
                </tr>
              </thead>
              <tbody>
                {topWorkspaces.map((workspace, i) => (
                  <tr
                    key={workspace.name}
                    className="mf-row transition border-t border-[#2A2E37] hover:bg-[#1B1E24]"
                  >
                    <td className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-3.5">
                      <p className="text-[10px] md:text-[11px] lg:text-[13.5px] font-medium text-[#E8E6E1]">
                        {workspace.name}
                      </p>
                    </td>
                    <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                      {workspace.sent.toLocaleString()}
                    </td>
                    <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[9px] md:text-[10px] lg:text-[13px] text-[#C7C9CE] font-['JetBrains_Mono']">
                          {workspace.openRate}
                        </span>
                        <div className="w-12 md:w-16 lg:w-20 h-1 md:h-1.5 rounded-full bg-[#2A2E37] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#7FD98A] transition-all"
                            style={{
                              width: workspace.openRate.replace("%", ""),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-2 md:px-3 py-2.5 md:py-3 lg:py-3.5">
                      <span className="inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1.5 md:px-2 py-0.5 text-[7px] md:text-[8px] lg:text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                        <TrendingUp size={8} className="md:w-[9px] md:h-[9px] lg:w-[10px] lg:h-[10px]" />
                        High
                      </span>
                    </td>
                    <td className="px-3 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-3.5 text-right">
                      <button className="text-[#8B8D94] hover:text-[#E8E6E1] transition">
                        <ChevronDown size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;