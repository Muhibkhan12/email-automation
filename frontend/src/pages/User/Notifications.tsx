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
  Menu,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

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
  success: { accent: "#34D399", soft: "rgba(52,211,153,0.12)" },
  danger: { accent: "#F87171", soft: "rgba(248,113,113,0.12)" },
  warning: { accent: "#FBBF24", soft: "rgba(251,191,36,0.12)" },
  info: { accent: "#60A5FA", soft: "rgba(96,165,250,0.12)" },
  neutral: { accent: "#9BA0A8", soft: "rgba(155,160,168,0.12)" },
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

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .mf-item { transition: background-color 0.15s ease; }
        .mf-item:hover { background-color: #1B1E24; }
        .mf-item:hover .mf-item-action { opacity: 1; }
        .mf-item-action { opacity: 0; transition: opacity 0.15s ease; }

        .mf-main-content::-webkit-scrollbar {
          width: 6px;
        }
        .mf-main-content::-webkit-scrollbar-track {
          background: #0B0E12;
        }
        .mf-main-content::-webkit-scrollbar-thumb {
          background: #2A2E37;
          border-radius: 3px;
        }
        .mf-main-content::-webkit-scrollbar-thumb:hover {
          background: #3A3F4A;
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

        @media (max-width: 640px) {
          .mf-item-action {
            opacity: 1 !important;
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with scrolling */}
      <main className="mf-main-content flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8" style={{ background: "#12151B", height: "100vh", width: "100%" }}>
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
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1
                  style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }}
                  className="text-xl md:text-2xl lg:text-3xl font-bold" 
                >
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span
                    className="rounded-full px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[10px] lg:text-xs font-semibold whitespace-nowrap"
                    style={{ fontFamily: FONT.mono, background: "rgba(255,106,57,0.12)", color: "#FF6A39" }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs lg:text-sm" style={{ color: "#9BA0A8" }}>
                Campaign results, delivery issues and account activity.
              </p>
            </div>
          </div>

          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="mf-mark-read-btn flex items-center justify-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-1.5 md:py-2.5 text-[10px] md:text-xs lg:text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
            style={{ 
              border: "1px solid #2A2E37", 
              color: "#C7C9CE", 
              background: "#12151B" 
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "#1B1E24";
                e.currentTarget.style.color = "#E8E6E1";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#12151B";
              e.currentTarget.style.color = "#C7C9CE";
            }}
          >
            <CheckCheck size={12} className="md:w-[13px] md:h-[13px] lg:w-[14px] lg:h-[14px]" />
            <span className="hidden xs:inline">Mark all as read</span>
            <span className="xs:hidden">Mark read</span>
          </button>
        </div>

        {/* Filter pills */}
        <div
          className="mf-filters mb-4 md:mb-5 lg:mb-6 inline-flex flex-wrap items-center gap-0.5 md:gap-1 rounded-xl p-0.5 md:p-1 w-full md:w-auto"
          style={{ background: "#12151B", border: "1px solid #2A2E37" }}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="mf-filter-btn rounded-lg px-1.5 md:px-3.5 py-0.5 md:py-1.5 text-[8px] md:text-[9px] lg:text-sm font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none"
                style={{
                  background: active ? "#FF6A39" : "transparent",
                  color: active ? "#FFFFFF" : "#C7C9CE",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "#1B1E24";
                    e.currentTarget.style.color = "#E8E6E1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#C7C9CE";
                  }
                }}
              >
                {f}
                {f === "Unread" && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="rounded-xl" style={{ border: "1px solid #2A2E37", background: "#12151B" }}>
          {grouped.length === 0 && (
            <div className="p-6 md:p-8 lg:p-12 text-center text-[10px] md:text-xs lg:text-sm" style={{ color: "#6B727C" }}>
              You're all caught up.
            </div>
          )}

          {grouped.map((g, gi) => (
            <div key={g.group}>
              <div
                className="mf-group-header px-3 md:px-4 lg:px-6 py-1.5 md:py-2 lg:py-3 text-[8px] md:text-[9px] lg:text-xs font-semibold uppercase tracking-wide"
                style={{
                  color: "#6B727C",
                  background: "#0B0E12",
                  borderTop: gi === 0 ? "none" : "1px solid #2A2E37",
                  borderBottom: "1px solid #2A2E37",
                }}
              >
                {g.group}
              </div>

              {g.items.map((n, i) => {
                const Icon = n.icon;
                const style = TYPE_STYLE[n.type];
                const isUnread = n.unread;
                return (
                  <div
                    key={n.id}
                    className="mf-notification-item mf-item flex items-start gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4"
                    style={{ 
                      borderBottom: i < g.items.length - 1 ? "1px solid #2A2E37" : "none",
                      background: isUnread ? "rgba(255,106,57,0.03)" : "transparent"
                    }}
                  >
                    <div
                      className="mf-notification-icon flex h-6 w-6 md:h-7 md:w-7 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: style.soft }}
                    >
                      <Icon size={11} className="md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px]" style={{ color: style.accent }} />
                    </div>

                    <div className="mf-notification-content min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-1 md:gap-3">
                        <p className="mf-notification-title text-[10px] md:text-xs lg:text-sm font-medium" style={{ color: "#E8E6E1" }}>
                          {n.title}
                          {isUnread && (
                            <span className="mf-notification-dot ml-1 md:ml-1.5 lg:ml-2 inline-block h-1 w-1 md:h-1.5 md:w-1.5 lg:h-2 lg:w-2 rounded-full" style={{ background: "#FF6A39" }} />
                          )}
                        </p>
                        <span
                          className="mf-notification-time shrink-0 text-[7px] md:text-[8px] lg:text-xs"
                          style={{ fontFamily: FONT.mono, color: "#6B727C" }}
                        >
                          {n.time}
                        </span>
                      </div>
                      <p className="mf-notification-desc mt-0.5 md:mt-1 text-[8px] md:text-[9px] lg:text-sm" style={{ color: "#9BA0A8" }}>
                        {n.description}
                      </p>
                    </div>

                    {n.unread ? (
                      <button
                        onClick={() => markRead(n.id)}
                        className="mf-item-action mf-notification-dot mt-1 h-1 w-1 md:h-1.5 md:w-1.5 lg:h-2 lg:w-2 shrink-0 rounded-full"
                        style={{ background: "#FF6A39" }}
                        aria-label="Mark as read"
                        title="Mark as read"
                      />
                    ) : (
                      <span className="mf-notification-dot mt-1 h-1 w-1 md:h-1.5 md:w-1.5 lg:h-2 lg:w-2 shrink-0 rounded-full" style={{ background: "transparent" }} />
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