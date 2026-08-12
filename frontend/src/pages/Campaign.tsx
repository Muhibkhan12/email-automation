import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  Plus,
  Search,
  Megaphone,
  PlayCircle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from "lucide-react";

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

type Status = "Completed" | "Running" | "Failed";

interface Campaign {
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
  icon: React.ElementType;
  accent: string;
  accentSoft: string;
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const stats: StatCard[] = [
  { title: "Total campaigns", value: "24", icon: Megaphone, accent: COLOR.dark, accentSoft: COLOR.bg },
  { title: "Running", value: "3", icon: PlayCircle, accent: COLOR.primary, accentSoft: COLOR.primarySoft },
  { title: "Completed", value: "18", icon: CheckCircle2, accent: COLOR.success, accentSoft: COLOR.successSoft },
  { title: "Failed", value: "3", icon: XCircle, accent: COLOR.danger, accentSoft: COLOR.dangerSoft },
];

const campaigns: Campaign[] = [
  { name: "Summer Promotion", createdOn: "Aug 10, 2026", recipients: 2450, sent: 2450, opened: 1240, status: "Completed" },
  { name: "Product Launch", createdOn: "Aug 11, 2026", recipients: 5200, sent: 3100, opened: 1540, status: "Running" },
  { name: "Newsletter August", createdOn: "Aug 8, 2026", recipients: 1800, sent: 1800, opened: 920, status: "Failed" },
];

const FILTERS: Array<Status | "All"> = ["All", "Running", "Completed", "Failed"];

const STATUS_STYLE: Record<Status, { bg: string; text: string; dot: string }> = {
  Completed: { bg: COLOR.successSoft, text: "#0F6E56", dot: COLOR.success },
  Running: { bg: COLOR.primarySoft, text: "#185FA5", dot: COLOR.primary },
  Failed: { bg: COLOR.dangerSoft, text: "#993C1D", dot: COLOR.danger },
};

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Campaign = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = campaigns.filter((c) => {
    const matchesFilter = filter === "All" || c.status === filter;
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-btn:focus-visible,
        .mf-input:focus-visible,
        .mf-chip:focus-visible {
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
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-white p-5 transition-shadow hover:shadow-md"
                style={{ border: `1px solid ${COLOR.border}` }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: stat.accentSoft }}
                >
                  <Icon size={16} style={{ color: stat.accent }} />
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase tracking-wide" style={{ color: COLOR.textMuted }}>
                <tr>
                  <th className="px-6 py-4 font-medium">Campaign</th>
                  <th className="px-6 py-4 font-medium">Recipients</th>
                  <th className="px-6 py-4 font-medium">Delivery progress</th>
                  <th className="px-6 py-4 font-medium">Opened</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => {
                  const sentPct = Math.round((c.sent / c.recipients) * 100);
                  const openPct = Math.round((c.opened / c.sent) * 100);
                  const style = STATUS_STYLE[c.status];

                  return (
                    <tr
                      key={c.name}
                      className="mf-row"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}` }}
                    >
                      <td className="px-6 py-5">
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

                      <td className="px-6 py-5" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.recipients.toLocaleString()}
                      </td>

                      <td className="px-6 py-5">
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
                      </td>

                      <td className="px-6 py-5" style={{ fontFamily: FONT.mono, color: COLOR.textBody }}>
                        {c.opened.toLocaleString()}{" "}
                        <span style={{ color: COLOR.textMuted }} className="text-xs">
                          ({openPct}%)
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: style.bg, color: style.text }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          className="mf-btn inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100"
                          aria-label={`Actions for ${c.name}`}
                        >
                          <MoreHorizontal size={16} style={{ color: COLOR.textMuted }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center" style={{ color: COLOR.textMuted }}>
                      No campaigns match this filter.
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