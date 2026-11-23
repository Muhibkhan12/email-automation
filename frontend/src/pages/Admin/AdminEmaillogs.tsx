// AdminEmailLogs.tsx — self-contained, no context dependency
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import api from "../../libs/Axios";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Inbox,
  Menu, Send,
} from "lucide-react";

type EmailStatus = "Sent" | "Delivered" | "Failed" | "Bounced" | "Pending";

interface NormalizedLog {
  id: string | number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  campaign: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
  errorMessage: string | null;
  raw: any;
}

/* ─────────────── endpoints (ADJUST TO YOUR BACKEND) ─────────────── */

const ENDPOINTS = {
  logs: "/email-logs/admin/all",
  campaigns: "/campaigns/admin/all",
  senders: "/sender-accounts/admin/all",
  recipients: "/campaign-recipients/admin/all",
};

/* ─────────────── design tokens ─────────────── */

const T = {
  bg: "#0B0C0E",
  surface: "#111214",
  surface2: "#16181B",
  surfaceHi: "#1C1F23",
  border: "#24282E",
  borderSoft: "#1B1E22",

  text: "#E8EAED",
  textMuted: "#9AA0A6",
  textFaint: "#6B7075",

  accent: "#6EE7A8",
  accentInk: "#0B0C0E",
  accentLine: "#2E6B4D",

  ok: "#6EE7A8",
  warn: "#E0A64A",
  danger: "#E06A6A",
  info: "#6EC1E7",
};

const FONT = {
  ui: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const HAIRLINE = `1px solid ${T.border}`;
const HAIRLINE_SOFT = `1px solid ${T.borderSoft}`;

const PAGE_SIZE = 10;

/* ─────────────── lookup helpers ─────────────── */

type LookupMap = Map<string, any>;

interface Lookups {
  campaigns: LookupMap;
  senders: LookupMap;
  recipients: LookupMap;
  // true only if that lookup list was fetched successfully
  loaded: { campaigns: boolean; senders: boolean; recipients: boolean };
}

const EMPTY_LOOKUPS: Lookups = {
  campaigns: new Map(),
  senders: new Map(),
  recipients: new Map(),
  loaded: { campaigns: false, senders: false, recipients: false },
};

// Accepts [..], { data: [..] }, { items: [..] }, { results: [..] }
const extractArray = (res: any): any[] => {
  const body = res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.results)) return body.results;
  return [];
};

const toMap = (arr: any[]): LookupMap => {
  const m: LookupMap = new Map();
  arr.forEach((item) => {
    if (item?.id !== undefined && item?.id !== null) m.set(String(item.id), item);
  });
  return m;
};

const fullName = (o: any): string => {
  if (!o) return "";
  const direct = o.name || o.full_name || o.display_name;
  if (direct) return String(direct);
  return [o.first_name, o.last_name].filter(Boolean).join(" ");
};

const pickCampaignName = (c: any): string => c?.name || c?.title || c?.campaign_name || "";
const pickSenderName = (s: any): string => fullName(s) || s?.label || "";
const pickSenderEmail = (s: any): string => s?.email || s?.sender_email || s?.username || "";
const pickRecipientEmail = (r: any): string => r?.email || r?.recipient_email || "";

const isDeletedLabel = (s: string) => s.startsWith("Deleted ");

/* ─────────────── normalize ─────────────── */

const normalizeStatus = (s: any): EmailStatus => {
  const v = String(s ?? "").toLowerCase().trim();
  if (v === "sent") return "Sent";
  if (v === "delivered") return "Delivered";
  if (v === "failed" || v === "failure" || v === "error") return "Failed";
  if (v === "bounced" || v === "bounce") return "Bounced";
  return "Pending";
};

const normalizeLog = (log: any, lk: Lookups): NormalizedLog => {
  // id null/missing                       -> deleted (FK was set to NULL)
  // id present, lookup loaded, not found  -> deleted
  // id present, lookup NOT loaded         -> unknown, fall back to ID label
  const find = (id: any, map: LookupMap) => (id != null ? map.get(String(id)) : undefined);
  const isGone = (id: any, rec: any, loaded: boolean) => id == null || (loaded && !rec);

  const recipient = find(log.recipient_id, lk.recipients);
  const sender = find(log.sender_account_id, lk.senders);
  const campaign = find(log.campaign_id, lk.campaigns);

  // Recipient
  const recipientEmail = log.recipient_email || pickRecipientEmail(recipient) || "";
  let recipientName = log.recipient_name || fullName(recipient) || recipientEmail;
  if (!recipientName) {
    recipientName = isGone(log.recipient_id, recipient, lk.loaded.recipients)
      ? "Deleted recipient"
      : `Recipient ${log.recipient_id}`;
  }

  // Sender
  const senderEmail = log.sender_email || pickSenderEmail(sender) || "";
  let senderName = log.sender_name || pickSenderName(sender) || senderEmail;
  if (!senderName) {
    senderName = isGone(log.sender_account_id, sender, lk.loaded.senders)
      ? "Deleted sender"
      : `Sender ${log.sender_account_id}`;
  }

  // Campaign
  let campaignName = log.campaign_name || pickCampaignName(campaign);
  if (!campaignName) {
    campaignName = isGone(log.campaign_id, campaign, lk.loaded.campaigns)
      ? "Deleted campaign"
      : `Campaign ${log.campaign_id}`;
  }

  return {
    id: log.id ?? "unknown",
    recipientName,
    recipientEmail: recipientEmail && recipientEmail !== recipientName ? recipientEmail : "",
    senderName,
    senderEmail: senderEmail && senderEmail !== senderName ? senderEmail : "",
    campaign: campaignName,
    subject: log.subject || "—",
    status: normalizeStatus(log.status),
    sentAt: log.sent_at || log.created_at || "",
    errorMessage: log.error_message ?? null,
    raw: log,
  };
};

const formatSentAt = (value: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const matchesDate = (value: string, filter: string) => {
  if (filter === "All time") return true;
  if (!value) return false;
  const t = new Date(value).getTime();
  if (isNaN(t)) return false;
  if (filter === "Today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  const days = filter === "Last 7 days" ? 7 : 30;
  return t >= Date.now() - days * 86_400_000;
};

/* ─────────────── primitives ─────────────── */

interface StatCardProps {
  title: string;
  value: number;
  rate?: number;
  rateLabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  accentSoft: string;
}

const StatCard = ({ title, value, rate, rateLabel, icon: Icon, accent, accentSoft }: StatCardProps) => (
  <div className="rounded-xl p-4" style={{ background: T.surface, border: HAIRLINE }}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: accentSoft, color: accent }}>
        <Icon size={14} />
      </div>
      {rate !== undefined && rateLabel && (
        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: T.surface2, color: T.textFaint, fontFamily: FONT.mono }}>
          {rate.toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-[24px] font-medium tracking-tight leading-none" style={{ color: T.text, fontFamily: FONT.mono }}>
      {value.toLocaleString()}
    </p>
    <p className="text-[11.5px] mt-1.5" style={{ color: T.textMuted }}>{title}</p>
    {rateLabel && rate !== undefined && (
      <p className="text-[10px] mt-0.5" style={{ color: T.textFaint }}>{rate.toFixed(1)}% {rateLabel} rate</p>
    )}
  </div>
);

const statusConfig: Record<EmailStatus, { bg: string; fg: string; ring: string; icon: React.ComponentType<{ size?: number }> }> = {
  Sent:      { bg: "rgba(110,193,231,0.10)", fg: T.info,   ring: "rgba(110,193,231,0.28)", icon: Send },
  Delivered: { bg: "rgba(110,231,168,0.10)", fg: T.ok,     ring: "rgba(110,231,168,0.28)", icon: CheckCircle2 },
  Failed:    { bg: "rgba(224,106,106,0.10)", fg: T.danger, ring: "rgba(224,106,106,0.28)", icon: XCircle },
  Bounced:   { bg: "rgba(224,166,74,0.10)",  fg: T.warn,   ring: "rgba(224,166,74,0.28)",  icon: AlertTriangle },
  Pending:   { bg: "rgba(224,166,74,0.10)",  fg: T.warn,   ring: "rgba(224,166,74,0.28)",  icon: Clock },
};

const StatusBadge = ({ status }: { status: EmailStatus }) => {
  const config = statusConfig[status] ?? statusConfig.Pending;
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.fg, boxShadow: `inset 0 0 0 1px ${config.ring}` }}>
      <Icon size={9} />
      {status}
    </span>
  );
};

/* ─────────────── page ─────────────── */

const AdminEmailLogs = () => {
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [lookups, setLookups] = useState<Lookups>(EMPTY_LOOKUPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All time");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── fetch logs + related details (campaigns, sender accounts, recipients) ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const [logsRes, campaignsRes, sendersRes, recipientsRes] = await Promise.allSettled([
        api.get(ENDPOINTS.logs),
        api.get(ENDPOINTS.campaigns),
        api.get(ENDPOINTS.senders),
        api.get(ENDPOINTS.recipients),
      ]);

      // Logs are required
      if (logsRes.status === "rejected") throw logsRes.reason;
      setRawLogs(extractArray(logsRes.value));

      // Details are optional: fall back to ID labels if any of them fail
      const failed: string[] = [];
      const take = (r: PromiseSettledResult<any>, label: string): LookupMap => {
        if (r.status === "fulfilled") return toMap(extractArray(r.value));
        console.warn(`[AdminEmailLogs] could not load ${label}:`, r.reason);
        failed.push(label);
        return new Map();
      };

      setLookups({
        campaigns: take(campaignsRes, "campaigns"),
        senders: take(sendersRes, "sender accounts"),
        recipients: take(recipientsRes, "recipients"),
        loaded: {
          campaigns: campaignsRes.status === "fulfilled",
          senders: sendersRes.status === "fulfilled",
          recipients: recipientsRes.status === "fulfilled",
        },
      });
    } catch (e: any) {
      console.error("[AdminEmailLogs] fetch failed:", e);
      setError(e?.response?.data?.detail || e?.message || "Failed to load email logs");
      setRawLogs([]);
      setLookups(EMPTY_LOOKUPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const normalizedLogs = useMemo(
    () => rawLogs.map((l) => normalizeLog(l, lookups)),
    [rawLogs, lookups]
  );

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return normalizedLogs.filter((log) => {
      const matchesSearch =
        !q ||
        log.recipientName.toLowerCase().includes(q) ||
        log.recipientEmail.toLowerCase().includes(q) ||
        log.senderName.toLowerCase().includes(q) ||
        log.senderEmail.toLowerCase().includes(q) ||
        log.campaign.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;
      return matchesSearch && matchesStatus && matchesDate(log.sentAt, dateFilter);
    });
  }, [normalizedLogs, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const total = normalizedLogs.length;
    const count = (s: EmailStatus) => normalizedLogs.filter((l) => l.status === s).length;
    return {
      total,
      sent: count("Sent"),
      delivered: count("Delivered"),
      pending: count("Pending"),
      failed: count("Failed"),
      bounced: count("Bounced"),
    };
  }, [normalizedLogs]);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusChange = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleDateChange = (v: string) => { setDateFilter(v); setPage(1); };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("All time");
    setPage(1);
  };

  const handleCopy = (id: string | number) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const hasActiveFilters = !!search || statusFilter !== "All" || dateFilter !== "All time";

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: T.bg, fontFamily: FONT.ui }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        .el-main::-webkit-scrollbar { width: 8px; height: 8px; }
        .el-main::-webkit-scrollbar-track { background: transparent; }
        .el-main::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
        .el-main::-webkit-scrollbar-thumb:hover { background: ${T.surfaceHi}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        .el-input::placeholder { color: ${T.textFaint}; }
        @media (prefers-reduced-motion: reduce) { .el-main * { animation: none !important; } }
      `}</style>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(11,12,14,0.72)" }} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed top-0 z-50 h-screen shrink-0 transition-transform duration-200 ease-out lg:sticky lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="el-main flex-1 overflow-y-auto" style={{ background: T.bg, height: "100vh", width: "100%" }}>
        <div className="mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10" style={{ maxWidth: 1280 }}>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-start gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-1 p-2 rounded-md"
                style={{ background: T.surface, color: T.textMuted, border: HAIRLINE }} aria-label="Open menu">
                <Menu size={16} />
              </button>
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.textFaint }}>Activity</span>
                  <ChevronRight size={9} style={{ color: T.border }} />
                  <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.accent }}>Email logs</span>
                </div>
                <h1 className="text-[24px] md:text-[26px] font-medium leading-tight" style={{ color: T.text }}>Email logs</h1>
                <p className="mt-1 text-[13px] max-w-lg" style={{ color: T.textMuted }}>
                  All {stats.total} email logs from the database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchLogs} disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium disabled:opacity-50"
                style={{ color: T.textMuted, border: HAIRLINE }}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{ background: "rgba(224,106,106,0.08)", border: "1px solid rgba(224,106,106,0.28)" }}>
              <AlertTriangle size={13} style={{ color: T.danger }} className="mt-0.5 shrink-0" />
              <p className="text-[12.5px]" style={{ color: T.danger }}>{error}</p>
            </div>
          )}

          {/* Warning (partial detail load failure) */}
          {warning && !error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{ background: "rgba(224,166,74,0.08)", border: "1px solid rgba(224,166,74,0.28)" }}>
              <AlertTriangle size={13} style={{ color: T.warn }} className="mt-0.5 shrink-0" />
              <p className="text-[12.5px]" style={{ color: T.warn }}>{warning}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard title="Total emails" value={stats.total} icon={Inbox} accent={T.accent} accentSoft="rgba(110,231,168,0.10)" />
            <StatCard title="Sent" value={stats.sent} icon={Send} accent={T.info} accentSoft="rgba(110,193,231,0.10)"
              rate={stats.total ? (stats.sent / stats.total) * 100 : 0} rateLabel="sent" />
            <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} accent={T.ok} accentSoft="rgba(110,231,168,0.10)"
              rate={stats.total ? (stats.delivered / stats.total) * 100 : 0} rateLabel="delivery" />
            <StatCard title="Failed" value={stats.failed} icon={XCircle} accent={T.danger} accentSoft="rgba(224,106,106,0.10)"
              rate={stats.total ? (stats.failed / stats.total) * 100 : 0} rateLabel="failure" />
            <StatCard title="Bounced" value={stats.bounced} icon={AlertTriangle} accent={T.warn} accentSoft="rgba(224,166,74,0.10)"
              rate={stats.total ? (stats.bounced / stats.total) * 100 : 0} rateLabel="bounce" />
          </div>

          {/* Filters */}
          <div className="mb-5 rounded-xl p-3" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-0" style={{ background: T.surface2, border: HAIRLINE_SOFT }}>
                <Search size={13} style={{ color: T.textFaint }} className="shrink-0" />
                <input type="text" placeholder="Search recipient, sender, campaign, or subject…" value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="el-input w-full bg-transparent text-[12.5px] outline-none" style={{ color: T.text }} />
                {search && (
                  <button onClick={() => handleSearchChange("")} className="shrink-0 text-[11px] px-1.5 py-0.5 rounded" style={{ color: T.textFaint }}>Clear</button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none"
                  style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}>
                  <option value="All">All statuses</option>
                  <option value="Sent">Sent</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Bounced">Bounced</option>
                </select>

                <select value={dateFilter} onChange={(e) => handleDateChange(e.target.value)}
                  className="px-2.5 py-2 rounded-md text-[12px] cursor-pointer outline-none"
                  style={{ background: T.surface2, color: T.text, border: HAIRLINE_SOFT }}>
                  <option>All time</option>
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-2.5 flex items-center justify-between gap-3 pt-2.5" style={{ borderTop: HAIRLINE_SOFT }}>
                <p className="text-[11.5px]" style={{ color: T.textFaint }}>
                  <span style={{ color: T.text }} className="font-medium">{filteredLogs.length}</span>{" "}
                  {filteredLogs.length === 1 ? "result" : "results"} matching filters
                </p>
                <button onClick={clearFilters} className="text-[11.5px] font-medium" style={{ color: T.accent }}>Clear filters</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: HAIRLINE }}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3" style={{ borderBottom: HAIRLINE_SOFT }}>
              <div>
                <h2 className="text-[12.5px] font-medium" style={{ color: T.text }}>Email activity</h2>
                <p className="mt-0.5 text-[11px]" style={{ color: T.textFaint }}>
                  {filteredLogs.length} log{filteredLogs.length !== 1 && "s"} matching current filters
                </p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textFaint }}>
                  <RefreshCw size={10} className="animate-spin" /> Syncing…
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "920px" }}>
                <thead className="sticky top-0 z-10" style={{ background: T.surface }}>
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: T.textFaint, borderBottom: HAIRLINE_SOFT }}>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Recipient</th>
                    <th className="px-3 py-2.5 font-medium">Campaign</th>
                    <th className="px-3 py-2.5 font-medium">Subject</th>
                    <th className="px-3 py-2.5 font-medium">Sender account</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-4 md:px-5 py-2.5 font-medium">Sent at</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && normalizedLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                          style={{ borderColor: T.border, borderTopColor: T.accent }} />
                        <p className="mt-2.5 text-[11.5px]" style={{ color: T.textFaint }}>Loading logs…</p>
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedLogs.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="w-11 h-11 mx-auto mb-3 rounded-lg flex items-center justify-center"
                          style={{ background: T.surfaceHi, border: HAIRLINE }}>
                          <Inbox className="w-5 h-5" style={{ color: T.textFaint }} />
                        </div>
                        <p className="text-[13px] font-medium" style={{ color: T.text }}>
                          {hasActiveFilters ? "No logs match your filters" : "No email logs yet"}
                        </p>
                        <p className="mt-1 text-[11.5px]" style={{ color: T.textMuted }}>
                          {hasActiveFilters ? "Try adjusting or clearing your filters." : "Once a campaign is launched, logs will appear here."}
                        </p>
                        <button onClick={() => (hasActiveFilters ? clearFilters() : fetchLogs())}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium"
                          style={{ color: T.textMuted, border: HAIRLINE }}>
                          <RefreshCw size={11} /> {hasActiveFilters ? "Clear filters" : "Refresh"}
                        </button>
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedLogs.map((log) => {
                    const recipientDeleted = isDeletedLabel(log.recipientName);
                    const senderDeleted = isDeletedLabel(log.senderName);
                    const campaignDeleted = isDeletedLabel(log.campaign);
                    const initial = recipientDeleted ? "?" : (log.recipientName?.trim()?.[0] || "?").toUpperCase();

                    return (
                      <tr key={log.id} className="transition-colors duration-120" style={{ borderTop: HAIRLINE_SOFT }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                        {/* Recipient: name + email + log id */}
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-medium"
                              style={recipientDeleted
                                ? { background: T.surface2, color: T.textFaint, boxShadow: `inset 0 0 0 1px ${T.border}` }
                                : { background: "rgba(110,231,168,0.10)", color: T.accent, boxShadow: "inset 0 0 0 1px rgba(110,231,168,0.28)" }}>
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-medium truncate max-w-55"
                                style={{ color: recipientDeleted ? T.textFaint : T.text, fontStyle: recipientDeleted ? "italic" : "normal" }}
                                title={log.recipientName}>
                                {log.recipientName}
                              </p>
                              {log.recipientEmail && (
                                <p className="text-[11px] truncate max-w-55" style={{ color: T.textMuted }} title={log.recipientEmail}>
                                  {log.recipientEmail}
                                </p>
                              )}
                              <button onClick={() => handleCopy(log.id)}
                                className="mt-0.5 inline-flex items-center gap-1 text-[10.5px]"
                                style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                                #{log.id}<Copy size={9} />
                                {copiedId === log.id && <span style={{ color: T.ok }}>✓</span>}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Campaign name */}
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium max-w-45"
                            style={{
                              background: T.surface2,
                              color: campaignDeleted ? T.textFaint : T.textMuted,
                              fontStyle: campaignDeleted ? "italic" : "normal",
                              border: HAIRLINE_SOFT,
                            }}
                            title={log.campaign}>
                            <Send size={9} style={{ color: T.textFaint }} className="shrink-0" />
                            <span className="truncate">{log.campaign}</span>
                          </span>
                        </td>

                        <td className="px-3 py-3 max-w-55">
                          <span className="block text-[12px] truncate" style={{ color: T.textMuted }} title={log.subject}>{log.subject}</span>
                        </td>

                        {/* Sender account: name + email */}
                        <td className="px-3 py-3">
                          <div className="min-w-0 max-w-50">
                            <p className="text-[12px] font-medium truncate"
                              style={{ color: senderDeleted ? T.textFaint : T.text, fontStyle: senderDeleted ? "italic" : "normal" }}
                              title={log.senderName}>
                              {log.senderName}
                            </p>
                            {log.senderEmail && (
                              <p className="text-[11px] truncate" style={{ color: T.textFaint, fontFamily: FONT.mono }} title={log.senderEmail}>
                                {log.senderEmail}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span title={log.status === "Failed" && log.errorMessage ? log.errorMessage : undefined}>
                            <StatusBadge status={log.status} />
                          </span>
                        </td>

                        <td className="px-4 md:px-5 py-3 whitespace-nowrap">
                          <span className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                            {formatSentAt(log.sentAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3" style={{ borderTop: HAIRLINE_SOFT }}>
                <p className="text-[11px]" style={{ color: T.textFaint, fontFamily: FONT.mono }}>
                  Showing <span style={{ color: T.text }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}</span>{" "}
                  of <span style={{ color: T.text }}>{filteredLogs.length}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium disabled:opacity-40"
                    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}>
                    <ChevronLeft size={12} /> Prev
                  </button>

                  {pageNumbers.map((p) => {
                    const active = p === page;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium"
                        style={{
                          background: active ? T.accent : T.surface2,
                          color: active ? T.accentInk : T.textMuted,
                          border: active ? `1px solid ${T.accent}` : HAIRLINE_SOFT,
                        }}>{p}</button>
                    );
                  })}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      <span className="text-[11px] px-1" style={{ color: T.textFaint }}>…</span>
                      <button onClick={() => setPage(totalPages)}
                        className="rounded-md px-2.5 py-1.5 text-[11px] font-medium"
                        style={{
                          background: page === totalPages ? T.accent : T.surface2,
                          color: page === totalPages ? T.accentInk : T.textMuted,
                          border: page === totalPages ? `1px solid ${T.accent}` : HAIRLINE_SOFT,
                        }}>{totalPages}</button>
                    </>
                  )}

                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium disabled:opacity-40"
                    style={{ color: T.textMuted, border: HAIRLINE_SOFT }}>
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEmailLogs;