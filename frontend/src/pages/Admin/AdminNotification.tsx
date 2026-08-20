import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Megaphone,
  Users,
  Mail,
  Send,
  Clock,
  MoreHorizontal,
  Filter,
  Search,
  Settings,
  Shield,
  Activity,
  Zap,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type NotificationType = "success" | "error" | "warning" | "info" | "system";
type NotificationCategory = "Campaign" | "System" | "User" | "Workspace" | "Security";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  time: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

const notifications: Notification[] = [
  {
    id: "n1",
    title: "Campaign Completed: Summer Sale 2026",
    description: "24,500 emails delivered with a 52.4% open rate across 3 workspaces.",
    type: "success",
    category: "Campaign",
    time: "2 min ago",
    read: false,
    action: {
      label: "View Report",
      href: "/admin/campaigns/c1",
    },
  },
  {
    id: "n2",
    title: "Workspace Created: Stackline App",
    description: "New workspace 'Stackline App' was created by Devin Blake.",
    type: "info",
    category: "Workspace",
    time: "18 min ago",
    read: false,
    action: {
      label: "View Workspace",
      href: "/admin/workspaces/w4",
    },
  },
  {
    id: "n3",
    title: "Security Alert: Suspicious Login Attempt",
    description: "Failed login attempt from unknown IP (192.168.1.1) for user admin@mailforge.io",
    type: "error",
    category: "Security",
    time: "1 hour ago",
    read: false,
    action: {
      label: "Review Activity",
      href: "/admin/security",
    },
  },
  {
    id: "n4",
    title: "Webhook Delivery Latency Elevated",
    description: "Webhook delivery is experiencing increased latency (3.1s avg) on the EU region.",
    type: "warning",
    category: "System",
    time: "2 hours ago",
    read: true,
    action: {
      label: "Check Status",
      href: "/admin/system",
    },
  },
  {
    id: "n5",
    title: "New User Registered: Sarah Johnson",
    description: "Sarah Johnson (sarah.j@nimbusretail.com) joined as Super Admin.",
    type: "info",
    category: "User",
    time: "3 hours ago",
    read: true,
    action: {
      label: "View User",
      href: "/admin/users/u1",
    },
  },
  {
    id: "n6",
    title: "Campaign Failed: Customer Feedback Survey",
    description: "Survey campaign failed due to authentication errors. 5,600 recipients affected.",
    type: "error",
    category: "Campaign",
    time: "5 hours ago",
    read: true,
    action: {
      label: "View Details",
      href: "/admin/campaigns/c5",
    },
  },
  {
    id: "n7",
    title: "Email Sending Rate Increased",
    description: "Platform email sending rate has increased by 18% in the last 24 hours.",
    type: "success",
    category: "System",
    time: "12 hours ago",
    read: true,
  },
  {
    id: "n8",
    title: "Sender Account Authentication Warning",
    description: "Sender account 'campaigns@mailforge.io' requires re-authentication.",
    type: "warning",
    category: "System",
    time: "1 day ago",
    read: true,
    action: {
      label: "Re-authenticate",
      href: "/admin/sender-account",
    },
  },
  {
    id: "n9",
    title: "Workspace Updated: Nimbus Retail",
    description: "Nimbus Retail upgraded to Enterprise plan with 24 seats.",
    type: "info",
    category: "Workspace",
    time: "2 days ago",
    read: true,
  },
  {
    id: "n10",
    title: "System Maintenance Scheduled",
    description: "Platform maintenance scheduled for August 25 at 2:00 AM UTC. Estimated downtime: 30 minutes.",
    type: "warning",
    category: "System",
    time: "3 days ago",
    read: true,
  },
];

const stats = [
  { title: "Total Notifications", value: "284", change: "+12.4%", trend: "up", icon: Bell },
  { title: "Unread", value: "3", change: "-8.2%", trend: "down", icon: Mail },
  { title: "System Alerts", value: "47", change: "+4.1%", trend: "up", icon: Activity },
  { title: "Action Required", value: "12", change: "+6.3%", trend: "up", icon: Zap },
];

const typeConfig: Record<NotificationType, { bg: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2 },
  error: { bg: "bg-rose-500/15", text: "text-rose-400", icon: XCircle },
  warning: { bg: "bg-amber-500/15", text: "text-amber-400", icon: AlertTriangle },
  info: { bg: "bg-blue-500/15", text: "text-blue-400", icon: Info },
  system: { bg: "bg-violet-500/15", text: "text-violet-400", icon: Shield },
};

const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  Campaign: Megaphone,
  System: Activity,
  User: Users,
  Workspace: Send,
  Security: Shield,
};

const FILTERS = ["All", "Unread", "Read"];
const CATEGORY_FILTERS = ["All", "Campaign", "System", "User", "Workspace", "Security"];

/* ---------------------------------------------------------------------- */
/*  Page                                                                   */
/* ---------------------------------------------------------------------- */

const AdminNotifications = () => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [notifList, setNotifList] = useState(notifications);

  const unreadCount = notifList.filter((n) => !n.read).length;

  const filteredNotifs = notifList.filter((n) => {
    // Filter by read/unread
    if (filter === "Unread" && n.read) return false;
    if (filter === "Read" && !n.read) return false;

    // Filter by category
    if (categoryFilter !== "All" && n.category !== categoryFilter) return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const markAllAsRead = () => {
    setNotifList((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedNotifications.size === filteredNotifs.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifs.map((n) => n.id)));
    }
  };

  const getTimeAgo = (time: string) => {
    return time;
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
        .notif-item {
          transition: all 0.15s ease;
        }
        .notif-item:hover {
          background-color: #1B1E24;
        }
        .notif-item.unread {
          border-left: 3px solid #FF6A39;
        }
        .notif-item.read {
          border-left: 3px solid transparent;
        }
      `}</style>

      {/* Sidebar */}
      <div className="sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0E1013] h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#E8E6E1] font-['Space_Grotesk']">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FF6A39] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="mt-1 text-xs md:text-sm text-[#8B8D94]">
              System-wide notifications and alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-4 py-2.5 text-xs md:text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-4 py-2.5 text-xs md:text-sm font-medium text-[#C7C9CE] hover:bg-[#1B1E24] hover:text-[#E8E6E1] transition">
              <Settings size={14} />
              Settings
            </button>
          </div>
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
                <div className="flex items-start justify-between">
                  <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#FF6A39]/10">
                    <Icon size={14} className="text-[#FF6A39]" />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] md:text-[11.5px] font-medium ${
                      stat.trend === "up" ? "text-[#7FD98A]" : "text-[#FF5C6C]"
                    }`}
                  >
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowUpRight size={12} />}
                    {stat.change}
                  </span>
                </div>
                <h2 className="mt-3 md:mt-4 text-xl md:text-2xl font-semibold tracking-tight text-[#E8E6E1] font-['JetBrains_Mono']">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#C7C9CE]">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2">
              <Search size={14} className="text-[#8B8D94]" />
              <input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs md:text-sm outline-none text-[#C7C9CE] w-[120px] md:w-[180px] placeholder:text-[#8B8D94]"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[#2A2E37] bg-[#171A21] p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filter === f
                      ? "bg-[#FF6A39] text-white"
                      : "text-[#C7C9CE] hover:text-[#E8E6E1]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[#2A2E37] bg-[#171A21] px-3 py-2 text-xs md:text-sm text-[#C7C9CE] outline-none focus:border-[#FF6A39]"
            >
              {CATEGORY_FILTERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B8D94]">{selectedNotifications.size} selected</span>
              <button className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="rounded-xl bg-[#171A21] border border-[#2A2E37] overflow-hidden">
          {filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2A2E37] mb-4">
                <Bell size={24} className="text-[#8B8D94]" />
              </div>
              <h3 className="text-base font-semibold text-[#E8E6E1]">All caught up!</h3>
              <p className="mt-1 text-sm text-[#8B8D94]">No notifications match your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2A2E37]">
              {filteredNotifs.map((notif) => {
                const typeStyle = typeConfig[notif.type];
                const Icon = typeStyle.icon;
                const CategoryIcon = categoryIcons[notif.category];
                const isUnread = !notif.read;
                const isHovered = hoveredId === notif.id;

                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${isUnread ? "unread" : "read"} p-4 md:p-5 transition`}
                    onMouseEnter={() => setHoveredId(notif.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeStyle.bg}`}
                      >
                        <Icon size={18} className={typeStyle.text} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${isUnread ? "text-[#E8E6E1]" : "text-[#C7C9CE]"}`}>
                              {notif.title}
                            </p>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-[#FF6A39] animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-[#8B8D94] font-['JetBrains_Mono']">
                              {getTimeAgo(notif.time)}
                            </span>
                            {!isUnread && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-[10px] font-medium text-[#FF6A39] hover:text-[#FF7F52] transition"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 text-sm text-[#8B8D94]">{notif.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#2A2E37] text-[#8B8D94]">
                            <CategoryIcon size={10} />
                            {notif.category}
                          </span>

                          {notif.action && (
                            <a
                              href={notif.action.href}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6A39] hover:text-[#FF7F52] transition"
                            >
                              {notif.action.label}
                              <ExternalLink size={10} />
                            </a>
                          )}

                          {isHovered && (
                            <button className="ml-auto text-[#8B8D94] hover:text-[#E8E6E1] transition">
                              <MoreHorizontal size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;