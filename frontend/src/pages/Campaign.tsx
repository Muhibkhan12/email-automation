import React, { useMemo, useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import {
  Plus, Search, Megaphone, PlayCircle, CheckCircle2, XCircle, Clock,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, ArrowUpDown, Eye, Copy,
  Pause, Trash2, Inbox,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (matches Analytics.tsx)              */
/* ---------------------------------------------------------------------- */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const COLOR = {
  primary: "#2F6FED",
  primarySoft: "#EAF0FE",
  success: "#1FA971",
  successSoft: "#E6F7EF",
  warning: "#E8A23D",
  warningSoft: "#FDF3E4",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  dark: "#11141B",
  bg: "#F4F5F8",
  border: "#E7E8EC",
  textMuted: "#8A8F9C",
  textBody: "#4B4F5A",
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
  { title: "Total campaigns", value: "24", delta: "+3 this month", trend: "up", icon: Megaphone, accent: COLOR.dark, accentSoft: COLOR.bg, spark: [4, 6, 5, 8, 7, 9, 10] },
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
  Completed: { bg: COLOR.successSoft, text: "#0F6E56", dot: COLOR.success, icon: CheckCircle2 },
  Running: { bg: COLOR.primarySoft, text: "#185FA5", dot: COLOR.primary, icon: PlayCircle },
  Failed: { bg: COLOR.dangerSoft, text: "#993C1D", dot: COLOR.danger, icon: XCircle },
  Scheduled: { bg: COLOR.warningSoft, text: "#9A5B0E", dot: COLOR.warning, icon: Clock },
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
        className="mf-btn inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100"
        aria-label={`Actions for ${campaignName}`}
      >
        <MoreHorizontal size={16} style={{ color: COLOR.textMuted }} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-44 rounded-lg bg-white py-1 shadow-lg"
          style={{ border: `1px solid ${COLOR.border}` }}
        >
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-gray-50"
                style={{ color: a.danger ? COLOR.danger : COLOR.textBody }}
              >
                <Icon size={13} />
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
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mf-btn:focus-visible, .mf-input:focus-visible, .mf-chip:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-row { transition: background-color 0.15s ease; }
        .mf-row:hover { background-color: ${COLOR.bg}; }
        .mf-progress-fill { transition: width 0.4s ease; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
              className="text-3xl font-bold"
            >
              Campaigns
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Create, manage and monitor your email campaigns.
            </p>
          </div>

          <button
            className="mf-btn flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: COLOR.primary }}
          >
            <Plus size={16} />
            Create campaign
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const sparkData = stat.spark.map((v, i) => ({ i, v }));
            return (
              <div
                key={stat.title}
                className="relative overflow-hidden rounded-xl bg-white p-5 transition-shadow hover:shadow-md"
                style={{ border: `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: stat.accentSoft }}
                  >
                    <Icon size={16} style={{ color: stat.accent }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 text-[11.5px] font-medium"
                    style={{ color: stat.trend === "up" ? COLOR.success : COLOR.danger }}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.delta}
                  </span>
                </div>
                <h2
                  style={{ fontFamily: FONT.mono, color: COLOR.dark }}
                  className="mt-4 text-2xl font-semibold tracking-tight"
                >
                  {stat.value}
                </h2>
                <p className="mt-1 text-sm" style={{ color: COLOR.textBody }}>
                  {stat.title}
                </p>
                <div className="absolute bottom-0 right-0 h-10 w-24 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="v" stroke={stat.accent} strokeWidth={1.75} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campaign list */}
        <div className="rounded-xl bg-white" style={{ border: `1px solid ${COLOR.border}` }}>
          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-5"
            style={{ borderBottom: `1px solid ${COLOR.border}` }}
          >
            <div>
              <h2 style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-lg font-semibold">
                Your campaigns
              </h2>
              <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                View and manage your email campaigns.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg }}
              >
                <Search size={14} style={{ color: COLOR.textMuted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search campaigns"
                  className="mf-input bg-transparent text-sm outline-none"
                  style={{ color: COLOR.textBody, width: 160 }}
                />
              </div>

              <div
                className="flex items-center gap-1 rounded-xl p-1"
                style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}` }}
              >
                {FILTERS.map((f) => {
                  const active = f === filter;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className="mf-chip rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: active ? COLOR.primary : "transparent",
                        color: active ? "#FFFFFF" : COLOR.textBody,
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
              className="flex items-center justify-between px-6 py-3"
              style={{ background: COLOR.primarySoft, borderBottom: `1px solid ${COLOR.border}` }}
            >
              <span style={{ fontFamily: FONT.mono, color: "#185FA5" }} className="text-[12.5px] font-medium">
                {selected.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textBody }}
                >
                  <Pause size={12} />
                  Pause
                </button>
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90"
                  style={{ background: COLOR.dangerSoft, color: COLOR.danger }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase tracking-wide" style={{ color: COLOR.textMuted }}>
                <tr>
                  <th className="px-6 py-4 font-medium w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                  </th>
                  <th className="px-3 py-4 font-medium">Campaign</th>
                  <th
                    className="px-3 py-4 font-medium cursor-pointer select-none"
                    onClick={() => toggleSort("recipients")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Recipients <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-3 py-4 font-medium">Delivery progress</th>
                  <th
                    className="px-3 py-4 font-medium cursor-pointer select-none"
                    onClick={() => toggleSort("opened")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Opened <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th className="px-3 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
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
                      <td className="px-6 py-5">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: style.bg }}
                          >
                            <Megaphone size={15} style={{ color: style.dot }} />
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: COLOR.dark }}>
                              {c.name}
                            </p>
                            <p style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs">
                              Created {c.createdOn}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-5" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.recipients.toLocaleString()}
                      </td>

                      <td className="px-3 py-5">
                        {c.status === "Scheduled" ? (
                          <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs">
                            Not sent yet
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-28 rounded-full" style={{ background: COLOR.bg }}>
                              <div
                                className="mf-progress-fill h-1.5 rounded-full"
                                style={{ width: `${sentPct}%`, background: style.dot }}
                              />
                            </div>
                            <span style={{ fontFamily: FONT.mono, color: COLOR.textMuted }} className="text-xs">
                              {c.sent.toLocaleString()} · {sentPct}%
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-5" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.status === "Scheduled" ? (
                          <span style={{ color: COLOR.textMuted }}>—</span>
                        ) : (
                          <>
                            {c.opened.toLocaleString()}{" "}
                            <span style={{ color: COLOR.textMuted }} className="text-xs">
                              ({openPct}%)
                            </span>
                          </>
                        )}
                      </td>

                      <td className="px-3 py-5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: style.bg, color: style.text }}
                        >
                          <StatusIcon size={11} />
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <ActionMenu campaignName={c.name} />
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                          style={{ background: COLOR.primarySoft }}
                        >
                          <Inbox size={20} style={{ color: COLOR.primary }} />
                        </div>
                        <p style={{ fontFamily: FONT.display, color: COLOR.dark }} className="text-sm font-semibold">
                          No campaigns match this filter
                        </p>
                        <p className="mt-1 text-xs" style={{ color: COLOR.textMuted }}>
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