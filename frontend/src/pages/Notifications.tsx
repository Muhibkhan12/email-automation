import React, { useState } from "react";
import Sidebar from "./Sidebar";
import {
  CheckCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  LayoutTemplate,
  Send as SendIcon,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Design tokens — MailForge system (matches other pages)                */
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
/*  Types & data                                                           */
/* ---------------------------------------------------------------------- */

type NotifType = "success" | "danger" | "warning" | "info" | "neutral";
type Group = "Today" | "Yesterday" | "Earlier";
type FilterKey = "All" | "Unread" | "Campaigns" | "System";

interface Notification {
  id: string;
  icon: React.ElementType;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  group: Group;
  category: "Campaigns" | "System";
  unread: boolean;
}

const TYPE_STYLE: Record<NotifType, { accent: string; soft: string }> = {
  success: { accent: COLOR.success, soft: COLOR.successSoft },
  danger: { accent: COLOR.danger, soft: COLOR.dangerSoft },
  warning: { accent: COLOR.warning, soft: COLOR.warningSoft },
  info: { accent: COLOR.primary, soft: COLOR.primarySoft },
  neutral: { accent: COLOR.dark, soft: COLOR.bg },
};

const initialNotifications: Notification[] = [
  {
    id: "n1",
    icon: CheckCircle2,
    type: "success",
    title: "Summer Promotion completed",
    description: "2,450 emails delivered with a 56.4% open rate.",
    time: "10:24 AM",
    group: "Today",
    category: "Campaigns",
    unread: true,
  },
  {
    id: "n2",
    icon: XCircle,
    type: "danger",
    title: "Newsletter August failed",
    description: "Delivery stopped after 340 bounces from hello@company.com.",
    time: "9:02 AM",
    group: "Today",
    category: "Campaigns",
    unread: true,
  },
  {
    id: "n3",
    icon: AlertTriangle,
    type: "warning",
    title: "Sender account disconnected",
    description: "hello@company.com lost its SMTP connection. Reconnect to resume sending.",
    time: "8:47 AM",
    group: "Today",
    category: "System",
    unread: true,
  },
  {
    id: "n4",
    icon: UserPlus,
    type: "info",
    title: "312 new recipients imported",
    description: "From recipients-aug.csv into the \"Newsletter\" list.",
    time: "6:15 PM",
    group: "Yesterday",
    category: "System",
    unread: false,
  },
  {
    id: "n5",
    icon: SendIcon,
    type: "info",
    title: "Product Launch is now running",
    description: "Sending to 5,200 recipients across 3 sender accounts.",
    time: "11:30 AM",
    group: "Yesterday",
    category: "Campaigns",
    unread: false,
  },
  {
    id: "n6",
    icon: LayoutTemplate,
    type: "neutral",
    title: "Template \"Order Confirmation\" updated",
    description: "Edited by you — 2 content blocks changed.",
    time: "Aug 10",
    group: "Earlier",
    category: "System",
    unread: false,
  },
  {
    id: "n7",
    icon: CheckCircle2,
    type: "success",
    title: "Weekly Roundup completed",
    description: "1,800 emails delivered with a 47.8% open rate.",
    time: "Aug 8",
    group: "Earlier",
    category: "Campaigns",
    unread: false,
  },
];

const FILTERS: FilterKey[] = ["All", "Unread", "Campaigns", "System"];
const GROUP_ORDER: Group[] = ["Today", "Yesterday", "Earlier"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<FilterKey>("All");

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = notifications.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Unread") return n.unread;
    return n.category === filter;
  });

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: filtered.filter((n) => n.group === g),
  })).filter((g) => g.items.length > 0);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="flex min-h-screen" style={{ background: COLOR.bg, fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mf-btn:focus-visible,
        .mf-chip:focus-visible,
        .mf-item:focus-visible {
          outline: 2px solid ${COLOR.primary};
          outline-offset: 2px;
        }
        .mf-item { transition: background-color 0.15s ease; }
        .mf-item:hover { background-color: ${COLOR.bg}; }
        .mf-item:hover .mf-item-action { opacity: 1; }
        .mf-item-action { opacity: 0; transition: opacity 0.15s ease; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1
                style={{ fontFamily: FONT.display, letterSpacing: "-0.01em", color: COLOR.dark }}
                className="text-3xl font-bold"
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ fontFamily: FONT.mono, background: COLOR.primarySoft, color: COLOR.primary }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
              Campaign results, delivery issues and account activity.
            </p>
          </div>

          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="mf-btn flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textBody, background: "#FFFFFF" }}
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>

        {/* Filter pills */}
        <div
          className="mb-6 inline-flex items-center gap-1 rounded-xl p-1"
          style={{ background: "#FFFFFF", border: `1px solid ${COLOR.border}` }}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="mf-chip rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? COLOR.primary : "transparent",
                  color: active ? "#FFFFFF" : COLOR.textBody,
                }}
              >
                {f}
                {f === "Unread" && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="rounded-xl bg-white" style={{ border: `1px solid ${COLOR.border}` }}>
          {grouped.length === 0 && (
            <div className="p-12 text-center" style={{ color: COLOR.textMuted }}>
              You're all caught up.
            </div>
          )}

          {grouped.map((g, gi) => (
            <div key={g.group}>
              <div
                className="px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                style={{
                  color: COLOR.textMuted,
                  background: COLOR.bg,
                  borderTop: gi === 0 ? "none" : `1px solid ${COLOR.border}`,
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                {g.group}
              </div>

              {g.items.map((n, i) => {
                const Icon = n.icon;
                const style = TYPE_STYLE[n.type];
                return (
                  <div
                    key={n.id}
                    className="mf-item flex items-start gap-4 px-6 py-4"
                    style={{ borderBottom: i < g.items.length - 1 ? `1px solid ${COLOR.border}` : "none" }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: style.soft }}
                    >
                      <Icon size={16} style={{ color: style.accent }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium" style={{ color: COLOR.dark }}>
                          {n.title}
                        </p>
                        <span
                          className="shrink-0 text-xs"
                          style={{ fontFamily: FONT.mono, color: COLOR.textMuted }}
                        >
                          {n.time}
                        </span>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: COLOR.textMuted }}>
                        {n.description}
                      </p>
                    </div>

                    {n.unread ? (
                      <button
                        onClick={() => markRead(n.id)}
                        className="mf-item-action mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: COLOR.primary }}
                        aria-label="Mark as read"
                        title="Mark as read"
                      />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "transparent" }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Notifications;