import React, { useMemo, useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import {
  Plus, Search, Megaphone, PlayCircle, CheckCircle2, XCircle, Clock,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, ArrowUpDown, Eye, Copy,
  Pause, Trash2, Inbox, Menu,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (iron / ember)                       */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.12)",
  success: "#7FD98A",
  successSoft: "rgba(127,217,138,0.12)",
  warning: "#FFC24B",
  warningSoft: "rgba(255,194,75,0.12)",
  danger: "#FF5C6C",
  dangerSoft: "rgba(255,92,108,0.12)",
  dark: "#E8E6E1",
  bg: "#0E1013",
  surface: "#171A21",
  surfaceHover: "#1B1E24",
  border: "#2A2E37",
  borderHover: "#3A3F4A",
  textMuted: "#8B8D94",
  textBody: "#C7C9CE",
};

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type Status = "Completed" | "Running" | "Failed" | "Scheduled";
type SortKey = "recipients" | "opened" | null;

interface Campaign {
  id: string;
  name: string;
  createdOn: string;
  recipients: number;
  sent: number;
  opened: number;
  status: Status;
}

interface StatCard {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
  spark: number[];
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const stats: StatCard[] = [
  { title: "Total campaigns", value: "24", delta: "+3 this month", trend: "up", icon: Megaphone, accent: COLOR.dark, accentSoft: COLOR.surfaceHover, spark: [4, 6, 5, 8, 7, 9, 10] },
  { title: "Running", value: "3", delta: "+1 vs last week", trend: "up", icon: PlayCircle, accent: COLOR.primary, accentSoft: COLOR.primarySoft, spark: [1, 2, 1, 2, 3, 2, 3] },
  { title: "Completed", value: "18", delta: "+12.4%", trend: "up", icon: CheckCircle2, accent: COLOR.success, accentSoft: COLOR.successSoft, spark: [10, 11, 13, 12, 15, 16, 18] },
  { title: "Failed", value: "3", delta: "-1 vs last week", trend: "down", icon: XCircle, accent: COLOR.danger, accentSoft: COLOR.dangerSoft, spark: [5, 4, 4, 3, 4, 3, 3] },
];

const campaigns: Campaign[] = [
  { id: "c1", name: "Summer Promotion", createdOn: "Aug 10, 2026", recipients: 2450, sent: 2450, opened: 1240, status: "Completed" },
  { id: "c2", name: "Product Launch", createdOn: "Aug 11, 2026", recipients: 5200, sent: 3100, opened: 1540, status: "Running" },
  { id: "c3", name: "Newsletter August", createdOn: "Aug 8, 2026", recipients: 1800, sent: 1800, opened: 920, status: "Failed" },
  { id: "c4", name: "Beta Feedback Ask", createdOn: "Aug 13, 2026", recipients: 540, sent: 0, opened: 0, status: "Scheduled" },
  { id: "c5", name: "Onboarding Day 3", createdOn: "Aug 3, 2026", recipients: 890, sent: 890, opened: 549, status: "Completed" },
  { id: "c6", name: "Winback Sequence", createdOn: "Aug 4, 2026", recipients: 3020, sent: 3020, opened: 344, status: "Failed" },
];

const FILTERS: Array<Status | "All"> = ["All", "Running", "Scheduled", "Completed", "Failed"];

const STATUS_STYLE: Record<Status, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  Completed: { bg: COLOR.successSoft, text: COLOR.success, dot: COLOR.success, icon: CheckCircle2 },
  Running: { bg: COLOR.primarySoft, text: COLOR.primary, dot: COLOR.primary, icon: PlayCircle },
  Failed: { bg: COLOR.dangerSoft, text: COLOR.danger, dot: COLOR.danger, icon: XCircle },
  Scheduled: { bg: COLOR.warningSoft, text: COLOR.warning, dot: COLOR.warning, icon: Clock },
};

/* ---------------------------------------------------------------------- */
/*  Action dropdown menu                                                   */
/* ---------------------------------------------------------------------- */

const ActionMenu = ({ campaignName }: { campaignName: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const actions = [
    { label: "View details", icon: Eye },
    { label: "Duplicate", icon: Copy },
    { label: "Pause campaign", icon: Pause },
    { label: "Delete", icon: Trash2, danger: true },
  ];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mf-btn inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg transition"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = COLOR.surfaceHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label={`Actions for ${campaignName}`}
      >
        <MoreHorizontal size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" style={{ color: COLOR.textMuted }} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-44 rounded-lg py-1 shadow-lg"
          style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
        >
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => setOpen(false)}
                className="mf-menu-item flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] md:text-[13px]"
                style={{ color: a.danger ? COLOR.danger : COLOR.textBody }}
              >
                <Icon size={12} className="md:w-[13px] md:h-[13px]" />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Campaign = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      const matchesFilter = filter === "All" || c.status === filter;
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortAsc ? diff : -diff;
      });
    }
    return list;
  }, [filter, query, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-btn:focus-visible, .mf-input:focus-visible, .mf-chip:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-row { transition: background-color 0.15s ease; }
        .mf-row:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-progress-fill { transition: width 0.4s ease; }
        .mf-menu-item:hover { background-color: ${COLOR.surfaceHover}; }
        .mf-card:hover { border-color: #3A3F4A; }
        input[type="checkbox"] {
          accent-color: ${COLOR.primary};
          background-color: ${COLOR.surface};
          border-color: ${COLOR.border};
        }
        .mf-input::placeholder { color: ${COLOR.textMuted}; }

        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: ${COLOR.bg};
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: ${COLOR.border};
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: ${COLOR.borderHover};
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

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ height: "100vh", width: "100%" }}>
        {/* Header */}
        <div className="mf-header mb-5 md:mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#171A21] border border-[#2A2E37] text-[#C7C9CE] hover:bg-[#1B1E24] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
                className="text-xl md:text-2xl lg:text-3xl font-bold"
              >
                Campaigns
              </h1>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: COLOR.textMuted }}>
                Create, manage and monitor your email campaigns.
              </p>
            </div>
          </div>

          <button
            className="mf-create-btn flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-sm font-medium transition hover:opacity-90 w-full sm:w-auto"
            style={{ background: COLOR.primary, color: COLOR.bg }}
          >
            <Plus size={14} className="md:w-[15px] md:h-[15px] lg:w-[16px] lg:h-[16px]" />
            <span className="hidden xs:inline">Create campaign</span>
            <span className="xs:hidden">Create</span>
          </button>
        </div>

        {/* Stats - Responsive Grid */}
        <div className="mf-stats-grid mb-5 md:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const sparkData = stat.spark.map((v, i) => ({ i, v }));
            return (
              <div
                key={stat.title}
                className="mf-card relative overflow-hidden rounded-xl p-3 md:p-4 lg:p-5 transition-colors"
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: stat.accent }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 text-[9px] md:text-[10px] lg:text-[11.5px] font-medium"
                    style={{ color: stat.trend === "up" ? COLOR.success : COLOR.danger }}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" /> : <ArrowDownRight size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />}
                    {stat.delta}
                  </span>
                </div>
                <h2
                  style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                  className="mt-2 md:mt-3 lg:mt-4 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: COLOR.textBody }}>
                  {stat.title}
                </p>
                <div className="mf-sparkline absolute bottom-0 right-0 h-6 md:h-8 lg:h-10 w-14 md:w-20 lg:w-24 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="v" stroke={stat.accent} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campaign list */}
        <div className="rounded-xl" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          {/* Toolbar */}
          <div
            className="mf-toolbar flex flex-wrap items-center justify-between gap-3 md:gap-4 p-3 md:p-4 lg:p-5"
            style={{ borderBottom: `1px solid ${COLOR.border}` }}
          >
            <div>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-sm md:text-base lg:text-lg font-semibold">
                Your campaigns
              </h2>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: COLOR.textMuted }}>
                View and manage your email campaigns.
              </p>
            </div>

            <div className="mf-toolbar-actions flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
              <div
                className="mf-search-container flex items-center gap-1.5 md:gap-2 rounded-lg px-2 md:px-3 py-1 md:py-1.5 lg:py-2 flex-1 lg:flex-none"
                style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg }}
              >
                <Search size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" style={{ color: COLOR.textMuted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search campaigns"
                  className="mf-search-input bg-transparent text-[10px] md:text-xs lg:text-sm outline-none w-full"
                  style={{ color: COLOR.textBody }}
                />
              </div>

              <div
                className="mf-filters-container flex flex-wrap items-center gap-0.5 md:gap-1 rounded-xl p-1 w-full lg:w-auto overflow-x-auto"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}` }}
              >
                {FILTERS.map((f) => {
                  const active = f === filter;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className="mf-chip rounded-lg px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 text-[8px] md:text-[9px] lg:text-xs font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none"
                      style={{
                        background: active ? COLOR.primary : "transparent",
                        color: active ? COLOR.bg : COLOR.textBody,
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div
              className="mf-bulk-action flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 lg:px-6 py-1.5 md:py-2 lg:py-3"
              style={{ background: COLOR.primarySoft, borderBottom: `1px solid ${COLOR.border}` }}
            >
              <span style={{ fontFamily: FONT.mono, color: COLOR.primary }} className="text-[10px] md:text-[11px] lg:text-[12.5px] font-medium">
                {selected.size} selected
              </span>
              <div className="mf-bulk-buttons flex flex-wrap items-center gap-1.5 md:gap-2">
                <button
                  className="flex items-center gap-1 md:gap-1.5 rounded-lg px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 text-[9px] md:text-[9px] lg:text-xs font-medium hover:opacity-90"
                  style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                >
                  <Pause size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                  <span className="hidden xs:inline">Pause</span>
                </button>
                <button
                  className="flex items-center gap-1 md:gap-1.5 rounded-lg px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 text-[9px] md:text-[9px] lg:text-xs font-medium hover:opacity-90"
                  style={{ background: COLOR.dangerSoft, color: COLOR.danger }}
                >
                  <Trash2 size={10} className="md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="mf-table-wrapper overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: "500px" }}>
              <thead className="text-[8px] md:text-[9px] lg:text-xs uppercase tracking-wide" style={{ color: COLOR.textMuted }}>
                <tr>
                  <th className="mf-table-cell-padded px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium w-8 md:w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-4 font-medium">Campaign</th>
                  <th
                    className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-4 font-medium cursor-pointer select-none"
                    onClick={() => toggleSort("recipients")}
                  >
                    <span className="inline-flex items-center gap-0.5 md:gap-1">
                      Recipients <ArrowUpDown size={9} className="md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px]" />
                    </span>
                  </th>
                  <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-4 font-medium">Progress</th>
                  <th
                    className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-4 font-medium cursor-pointer select-none"
                    onClick={() => toggleSort("opened")}
                  >
                    <span className="inline-flex items-center gap-0.5 md:gap-1">
                      Opened <ArrowUpDown size={9} className="md:w-[10px] md:h-[10px] lg:w-[11px] lg:h-[11px]" />
                    </span>
                  </th>
                  <th className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-4 font-medium">Status</th>
                  <th className="mf-table-cell-padded px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => {
                  const sentPct = c.recipients ? Math.round((c.sent / c.recipients) * 100) : 0;
                  const openPct = c.sent ? Math.round((c.opened / c.sent) * 100) : 0;
                  const style = STATUS_STYLE[c.status];
                  const StatusIcon = style.icon;

                  return (
                    <tr
                      key={c.id}
                      className="mf-row"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}` }}
                    >
                      <td className="mf-table-cell-padded px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-5">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-5">
                        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
                          <div
                            className="flex h-6 w-6 md:h-8 md:w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: style.bg }}
                          >
                            <Megaphone size={10} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: style.dot }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs lg:text-sm font-medium truncate" style={{ color: COLOR.dark }}>
                              {c.name}
                            </p>
                            <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[7px] md:text-[8px] lg:text-xs">
                              Created {c.createdOn}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-5 text-[9px] md:text-[10px] lg:text-sm" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.recipients.toLocaleString()}
                      </td>

                      <td className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-5">
                        {c.status === "Scheduled" ? (
                          <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[8px] md:text-[9px] lg:text-xs">
                            Not sent
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
                            <div className="mf-progress-bar h-1 md:h-1.5 w-10 md:w-16 lg:w-28 rounded-full" style={{ background: COLOR.bg }}>
                              <div
                                className="mf-progress-fill h-1 md:h-1.5 rounded-full"
                                style={{ width: `${sentPct}%`, background: style.dot }}
                              />
                            </div>
                            <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-[7px] md:text-[8px] lg:text-xs whitespace-nowrap">
                              {sentPct}%
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-5 text-[9px] md:text-[10px] lg:text-sm" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.status === "Scheduled" ? (
                          <span style={{ color: COLOR.textMuted }}>—</span>
                        ) : (
                          <span>
                            {c.opened.toLocaleString()}
                            <span className="text-[7px] md:text-[8px] lg:text-xs" style={{ color: COLOR.textMuted }}>
                              {" "}({openPct}%)
                            </span>
                          </span>
                        )}
                      </td>

                      <td className="mf-table-cell px-1.5 md:px-2 lg:px-3 py-2 md:py-3 lg:py-5">
                        <span
                          className="mf-status-badge inline-flex items-center gap-0.5 md:gap-1 rounded-full px-1 md:px-1.5 lg:px-3 py-0.5 text-[7px] md:text-[8px] lg:text-xs font-medium whitespace-nowrap"
                          style={{ background: style.bg, color: style.text }}
                        >
                          <StatusIcon size={8} className="md:w-[9px] md:h-[9px] lg:w-[10px] lg:h-[10px]" />
                          <span className="hidden xs:inline">{c.status}</span>
                          <span className="xs:hidden">{c.status.charAt(0)}</span>
                        </span>
                      </td>

                      <td className="mf-table-cell-padded px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-5 text-right">
                        <ActionMenu campaignName={c.name} />
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 md:px-4 lg:px-6 py-8 md:py-12 lg:py-16">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="mb-2 md:mb-3 flex h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-2xl"
                          style={{ background: COLOR.primarySoft }}
                        >
                          <Inbox size={14} className="md:w-[16px] md:h-[16px] lg:w-[18px] lg:h-[18px]" style={{ color: COLOR.primary }} />
                        </div>
                        <p style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-[10px] md:text-xs lg:text-sm font-semibold">
                          No campaigns match this filter
                        </p>
                        <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] lg:text-xs" style={{ color: COLOR.textMuted }}>
                          Try a different search term or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Campaign;