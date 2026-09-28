// src/pages/Campaigns.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Inbox,
  PauseCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileEdit,
  Megaphone,
  Menu,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Clock,
  Send,
  MoreHorizontal,
} from "lucide-react";

import { useCampaigns } from "../../contexts/CampaignContext";
import type { Campaign } from "../../types/CampaignTypes";
import AdminSidebar from "./AdminSidebar";

/* ─────────────────────────── Tokens ─────────────────────────── */

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const C = {
  primary: "#FF6A39",
  primarySoft: "rgba(255,106,57,0.10)",
  primaryRing: "rgba(255,106,57,0.22)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  successRing: "rgba(52,211,153,0.22)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.10)",
  warningRing: "rgba(251,191,36,0.22)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.10)",
  dangerRing: "rgba(248,113,113,0.22)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.10)",
  blueRing: "rgba(96,165,250,0.22)",
  neutral: "#9BA0A8",
  neutralSoft: "rgba(155,160,168,0.10)",
  neutralRing: "rgba(155,160,168,0.22)",
  dark: "#F2F0EB",
  bg: "#0B0E13",
  surface: "#141821",
  inner: "#0F131C",
  rowHover: "#11151E",
  border: "#1A1F2B",
  borderHover: "#232938",
  textMuted: "#7A8092",
  textBody: "#C7C9CE",
};

/* ─────────────────────────── Status meta ─────────────────────────── */

const STATUS_META: Record<
  string,
  { label: string; fg: string; bg: string; ring: string; Icon: any }
> = {
  DRAFT:     { label: "Draft",     fg: C.neutral, bg: C.neutralSoft, ring: C.neutralRing, Icon: FileEdit     },
  READY:     { label: "Ready",     fg: C.blue,    bg: C.blueSoft,    ring: C.blueRing,    Icon: CheckCircle2 },
  RUNNING:   { label: "Running",   fg: C.primary, bg: C.primarySoft, ring: C.primaryRing, Icon: PlayCircle   },
  PAUSED:    { label: "Paused",    fg: C.warning, bg: C.warningSoft, ring: C.warningRing, Icon: PauseCircle  },
  COMPLETED: { label: "Completed", fg: C.success, bg: C.successSoft, ring: C.successRing, Icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", fg: C.danger,  bg: C.dangerSoft,  ring: C.dangerRing,  Icon: XCircle      },
};

const FALLBACK_META = STATUS_META.DRAFT;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

/* ─────────────────────────── Primitives ─────────────────────────── */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`rounded-3xl soft-ring transition-colors ${className}`}
    style={{ background: "linear-gradient(180deg, #141821 0%, #10141D 100%)" }}
  >
    {children}
  </div>
);

const StatusPill: React.FC<{ status: string; withIcon?: boolean }> = ({
  status,
  withIcon = true,
}) => {
  const meta = STATUS_META[status] ?? FALLBACK_META;
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{
        background: meta.bg,
        color: meta.fg,
        boxShadow: `inset 0 0 0 1px ${meta.ring}`,
      }}
    >
      {withIcon ? (
        <Icon size={11} />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }}
        />
      )}
      {meta.label}
    </span>
  );
};

const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, right }) => (
  <div
    className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-6 py-4 border-b"
    style={{ borderColor: C.border }}
  >
    <div>
      <h2
        style={{ fontFamily: FONT.display }}
        className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#F2F0EB] flex items-center gap-2"
      >
        <Icon size={15} style={{ color: C.primary }} /> {title}
      </h2>
      {subtitle && (
        <p className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
          {subtitle}
        </p>
      )}
    </div>
    {right}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  accent: string;
}> = ({ title, value, change, trend, icon: Icon, accent }) => (
  <Card className="p-4 md:p-5 float-in relative overflow-hidden">
    <div
      aria-hidden
      className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }}
    />
    <div className="relative flex items-start justify-between mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
      <span
        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
        style={{
          background: trend === "up" ? C.successSoft : C.dangerSoft,
          color: trend === "up" ? C.success : C.danger,
          boxShadow: `inset 0 0 0 1px ${trend === "up" ? C.successRing : C.dangerRing}`,
          fontFamily: FONT.mono,
        }}
      >
        {trend === "up" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
        {change}
      </span>
    </div>
    <p
      className="relative text-[26px] font-bold leading-none tracking-tight"
      style={{ fontFamily: FONT.mono, color: C.dark }}
    >
      {value}
    </p>
    <p className="relative text-[11.5px] mt-2" style={{ color: C.textMuted }}>
      {title}
    </p>
  </Card>
);

/* ─────────────────────────── Grid card ─────────────────────────── */

const CampaignCard: React.FC<{ c: Campaign }> = ({ c }) => {
  const meta = STATUS_META[c.status] ?? FALLBACK_META;
  const Icon = meta.Icon;

  return (
    <Link
      to={`/campaigns/${c.id}`}
      className="group block rounded-2xl soft-ring transition-all hover:-translate-y-0.5 overflow-hidden"
      style={{ background: C.inner }}
    >
      <div className="relative">
        <span
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
          style={{
            background: meta.fg,
            opacity: 0.85,
            boxShadow: `0 0 12px ${meta.fg}66`,
          }}
        />
        <div className="pl-5 pr-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#1F242E", boxShadow: "inset 0 0 0 1px #2A2E37" }}
            >
              <Icon size={16} style={{ color: meta.fg }} />
            </div>
            <StatusPill status={c.status} withIcon={false} />
          </div>

          <h3
            className="text-[14.5px] font-semibold tracking-tight truncate"
            style={{ fontFamily: FONT.display, color: C.dark }}
          >
            {c.campaign_name}
          </h3>
          <p className="mt-1 text-[12px] truncate" style={{ color: C.textMuted }}>
            {c.subject || "No subject"}
          </p>

          <div
            className="mt-4 pt-3 flex items-center justify-between text-[11px] border-t"
            style={{ borderColor: C.border, fontFamily: FONT.mono, color: C.textMuted }}
          >
            <span>#{c.id}</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {formatDate(c.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

type FilterKey = "ALL" | keyof typeof STATUS_META;
type ViewMode = "grid" | "table";

export default function Campaigns() {
  const { campaigns, loading, error, refetch } = useCampaigns();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const stats = useMemo(() => {
    const total = campaigns.length;
    const running = campaigns.filter((c) => c.status === "RUNNING").length;
    const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
    const drafts = campaigns.filter((c) => c.status === "DRAFT").length;

    return [
      {
        title: "Total campaigns",
        value: String(total),
        change: "+6.2%",
        trend: "up" as const,
        icon: Megaphone,
        accent: C.primary,
      },
      {
        title: "Running now",
        value: String(running),
        change: running ? "+3.1%" : "0%",
        trend: "up" as const,
        icon: PlayCircle,
        accent: C.blue,
      },
      {
        title: "Completed",
        value: String(completed),
        change: "+12.4%",
        trend: "up" as const,
        icon: CheckCircle2,
        accent: C.success,
      },
      {
        title: "Drafts",
        value: String(drafts),
        change: "-2.0%",
        trend: "down" as const,
        icon: FileEdit,
        accent: C.warning,
      },
    ];
  }, [campaigns]);

  const visibleCampaigns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesStatus = filter === "ALL" || c.status === filter;
      const matchesQuery =
        !q ||
        c.campaign_name.toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [campaigns, filter, query]);

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ background: C.bg, fontFamily: FONT.body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .ping { animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes floatIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .float-in { animation: floatIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .cmp-main::-webkit-scrollbar { width: 10px; }
        .cmp-main::-webkit-scrollbar-track { background: transparent; }
        .cmp-main::-webkit-scrollbar-thumb { background: #1E232E; border-radius: 10px; border: 2px solid #0B0E13; }
        .cmp-main::-webkit-scrollbar-thumb:hover { background: #2A2F3B; }

        .soft-ring { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02); }
        .glow-top {
          background:
            radial-gradient(900px 240px at 50% -80px, rgba(255,106,57,0.10), transparent 70%),
            radial-gradient(700px 200px at 20% -60px, rgba(52,211,153,0.06), transparent 70%);
        }

        .cmp-row:hover { background: ${C.rowHover}; }
        .cmp-row .cmp-actions { opacity: 0; transition: opacity 0.15s ease; }
        .cmp-row:hover .cmp-actions, .cmp-row:focus-within .cmp-actions { opacity: 1; }

        select option { background: #141821; color: #E8E6E1; }
        thead.cmp-thead th { position: sticky; top: 0; background: ${C.inner}; z-index: 1; }

        :focus-visible { outline: 2px solid ${C.primary}; outline-offset: 2px; border-radius: 12px; }

        @media (prefers-reduced-motion: reduce) {
          .ping, .float-in { animation: none !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:sticky top-0 z-50 h-screen flex-shrink-0 transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main
        className="cmp-main flex-1 overflow-y-auto"
        style={{ background: C.bg, height: "100vh", width: "100%" }}
      >
        <div className="glow-top">
          <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12">

            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-8">
              <div className="flex items-start gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mt-1 p-2 rounded-2xl text-[#C7C9CE] transition-colors soft-ring"
                  style={{ background: C.surface }}
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        background: C.successSoft,
                        color: C.success,
                        boxShadow: `inset 0 0 0 1px ${C.successRing}`,
                      }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Live
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "#5A6172", fontFamily: FONT.mono }}
                    >
                      · {campaigns.length} campaigns
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "#5A6172", fontFamily: FONT.mono }}
                    >
                      · {now || "--:--:--"}
                    </span>
                  </div>

                  <h1
                    style={{ fontFamily: FONT.display, letterSpacing: "-0.025em" }}
                    className="text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-[1.05] text-[#F2F0EB]"
                  >
                    Campaigns
                  </h1>
                  <p
                    className="mt-2 text-[14px] md:text-[15px] max-w-lg"
                    style={{ color: C.textMuted }}
                  >
                    Create, monitor, and manage all your email campaigns in one place.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all soft-ring hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: C.surface, color: C.textBody }}
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
                <Link
                  to="/campaigns/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: C.primary,
                    boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)",
                  }}
                >
                  <Plus size={14} />
                  New campaign
                </Link>
              </div>
            </header>

            {/* ── Error ── */}
            {error && (
              <div
                className="mb-6 rounded-2xl px-4 py-3 text-[12.5px]"
                style={{
                  background: C.dangerSoft,
                  color: C.danger,
                  boxShadow: `inset 0 0 0 1px ${C.dangerRing}`,
                }}
              >
                {error}
              </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {stats.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </div>

            {/* ── Toolbar ── */}
            <Card className="mb-6 md:mb-8 p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 flex-1 min-w-0"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <Search size={14} style={{ color: C.textMuted }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search campaigns…"
                    className="bg-transparent outline-none border-0 text-[12.5px] flex-1 min-w-0"
                    style={{ color: C.dark, fontFamily: FONT.body }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(["ALL", "DRAFT", "READY", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"] as FilterKey[]).map(
                    (key) => {
                      const meta =
                        key === "ALL"
                          ? { fg: C.textBody, bg: C.inner, ring: C.border, label: "All" }
                          : STATUS_META[key];
                      const active = filter === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setFilter(key)}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-all"
                          style={{
                            background: active ? meta.bg : "transparent",
                            color: active ? meta.fg : C.textMuted,
                            boxShadow: `inset 0 0 0 1px ${active ? meta.ring : C.border}`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: active ? meta.fg : C.border,
                              boxShadow: active ? `0 0 6px ${meta.fg}` : "none",
                            }}
                          />
                          {meta.label}
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  className="flex items-center rounded-2xl p-0.5 shrink-0"
                  style={{ background: C.inner, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                >
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className="p-1.5 rounded-xl transition-colors"
                    style={{
                      background: view === "grid" ? C.surface : "transparent",
                      color: view === "grid" ? C.dark : C.textMuted,
                    }}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setView("table")}
                    aria-label="Table view"
                    className="p-1.5 rounded-xl transition-colors"
                    style={{
                      background: view === "table" ? C.surface : "transparent",
                      color: view === "table" ? C.dark : C.textMuted,
                    }}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </Card>

            {/* ── Loading skeleton ── */}
            {loading && campaigns.length === 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[140px] rounded-2xl animate-pulse"
                    style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.border}` }}
                  />
                ))}
              </div>
            )}

            {/* ── Empty ── */}
            {!loading && campaigns.length === 0 && !error && (
              <Card className="p-10 text-center">
                <div
                  className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,106,57,0.22), rgba(255,106,57,0.06))",
                    boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
                  }}
                >
                  <Inbox size={22} style={{ color: C.primary }} strokeWidth={1.8} />
                </div>
                <h2
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ fontFamily: FONT.display, color: C.dark }}
                >
                  No campaigns yet
                </h2>
                <p className="mt-1.5 text-[12.5px] max-w-sm mx-auto" style={{ color: C.textMuted }}>
                  Create your first campaign to start sending emails to your recipients.
                </p>
                <Link
                  to="/campaigns/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: C.primary,
                    boxShadow: "0 12px 30px -12px rgba(255,106,57,0.7)",
                  }}
                >
                  <Plus size={14} />
                  Create campaign
                </Link>
              </Card>
            )}

            {/* ── No matches ── */}
            {!loading && campaigns.length > 0 && visibleCampaigns.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-[13px]" style={{ color: C.textMuted }}>
                  No campaigns match your filters.
                </p>
                <button
                  onClick={() => {
                    setFilter("ALL");
                    setQuery("");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12px] font-medium"
                  style={{
                    background: C.inner,
                    color: C.textBody,
                    boxShadow: `inset 0 0 0 1px ${C.border}`,
                  }}
                >
                  Clear filters
                </button>
              </Card>
            )}

            {/* ── GRID view ── */}
            {!loading && visibleCampaigns.length > 0 && view === "grid" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCampaigns.map((c) => (
                  <CampaignCard key={c.id} c={c} />
                ))}
              </div>
            )}

            {/* ── TABLE view ── */}
            {!loading && visibleCampaigns.length > 0 && view === "table" && (
              <Card className="overflow-hidden">
                <SectionHeader
                  icon={Megaphone}
                  title="All campaigns"
                  subtitle={`${visibleCampaigns.length} of ${campaigns.length} shown`}
                  right={
                    <span
                      className="text-[11px]"
                      style={{ color: C.textMuted, fontFamily: FONT.mono }}
                    >
                      {filter === "ALL" ? "no filter" : filter.toLowerCase()}
                    </span>
                  }
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 900 }}>
                    <thead className="cmp-thead">
                      <tr
                        className="text-[10px] uppercase tracking-widest"
                        style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
                      >
                        <th className="px-4 md:px-6 py-3 font-medium">ID</th>
                        <th className="px-3 py-3 font-medium">Campaign</th>
                        <th className="px-3 py-3 font-medium">Subject</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium text-right">Template</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">Created</th>
                        <th className="px-4 md:px-6 py-3 font-medium text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCampaigns.map((c) => (
                        <tr
                          key={c.id}
                          className="cmp-row transition-colors"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                        >
                          <td className="px-4 md:px-6 py-3.5">
                            <span
                              style={{
                                fontFamily: FONT.mono,
                                color: C.textMuted,
                                fontSize: 11.5,
                              }}
                            >
                              #{c.id}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <Link
                              to={`/campaigns/${c.id}`}
                              className="text-[12.5px] font-medium hover:underline"
                              style={{ color: C.dark }}
                            >
                              {c.campaign_name}
                            </Link>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className="text-[12px] truncate block max-w-[260px]"
                              style={{ fontFamily: FONT.mono, color: C.textMuted }}
                            >
                              {c.subject || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill status={c.status} />
                          </td>
                          <td
                            className="px-3 py-3.5 text-right text-[12px]"
                            style={{ fontFamily: FONT.mono, color: C.textMuted }}
                          >
                            {c.template_id ?? "—"}
                          </td>
                          <td
                            className="px-4 md:px-6 py-3.5 text-right text-[11.5px] whitespace-nowrap"
                            style={{ fontFamily: FONT.mono, color: C.textMuted }}
                          >
                            {formatDate(c.created_at)}
                          </td>
                          <td className="px-4 md:px-6 py-3.5 text-right">
                            <div className="cmp-actions flex items-center justify-end gap-1.5">
                              <Link
                                to={`/campaigns/${c.id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
                                style={{
                                  background: C.primarySoft,
                                  color: C.primary,
                                  boxShadow: `inset 0 0 0 1px ${C.primaryRing}`,
                                }}
                              >
                                <Send size={11} />
                                Open
                              </Link>
                              <button
                                aria-label="More options"
                                className="p-1.5 rounded-lg transition-colors hover:bg-[#1B2130]"
                                style={{ color: C.textMuted }}
                              >
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-t"
                  style={{ borderColor: C.border }}
                >
                  <span className="text-[11.5px]" style={{ color: C.textMuted }}>
                    Showing{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      1–{visibleCampaigns.length}
                    </span>{" "}
                    of{" "}
                    <span style={{ color: C.dark, fontFamily: FONT.mono }}>
                      {campaigns.length}
                    </span>{" "}
                    campaigns
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled
                      className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: C.inner,
                        color: C.textBody,
                        boxShadow: `inset 0 0 0 1px ${C.border}`,
                      }}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span
                      className="min-w-[36px] rounded-2xl px-3 py-2 text-[12px] font-medium text-center"
                      style={{
                        background: C.primary,
                        color: "#fff",
                        boxShadow: "0 10px 24px -10px rgba(255,106,57,0.6)",
                      }}
                    >
                      1
                    </span>
                    <button
                      disabled
                      className="inline-flex items-center justify-center rounded-2xl p-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: C.inner,
                        color: C.textBody,
                        boxShadow: `inset 0 0 0 1px ${C.border}`,
                      }}
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}