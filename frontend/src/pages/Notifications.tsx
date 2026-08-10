import React, { useState } from 'react';
import {
  Bell, CheckCheck, Send, AlertTriangle, XCircle, UserPlus, UploadCloud,
  Activity, MailOpen, Settings as SettingsIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const C = {
  bg: '#F4F5F8', surface: '#FFFFFF', primary: '#2F6FED', primarySoft: '#EAF0FE',
  success: '#1FA971', successSoft: '#E7F7F0', warning: '#E8A23D', warningSoft: '#FCF1DF',
  danger: '#E5484D', dangerSoft: '#FCE8E9', text: '#12151C', textSoft: '#6B7280',
  textFaint: '#9CA3AF', border: '#E7E9EE', mono: "'JetBrains Mono', monospace",
  display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif",
} as const;

type NotifType = 'campaign' | 'bounce' | 'failed' | 'account' | 'upload' | 'queue' | 'open' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  group: 'Today' | 'Yesterday' | 'Earlier';
}

const TYPE_META: Record<NotifType, { bg: string; fg: string; icon: LucideIcon }> = {
  campaign: { bg: C.primarySoft, fg: C.primary, icon: Send },
  bounce: { bg: C.warningSoft, fg: '#B4740E', icon: AlertTriangle },
  failed: { bg: C.dangerSoft, fg: C.danger, icon: XCircle },
  account: { bg: C.successSoft, fg: C.success, icon: UserPlus },
  upload: { bg: C.primarySoft, fg: C.primary, icon: UploadCloud },
  queue: { bg: C.dangerSoft, fg: C.danger, icon: Activity },
  open: { bg: C.successSoft, fg: C.success, icon: MailOpen },
  system: { bg: '#F0F0F2', fg: C.textSoft, icon: SettingsIcon },
};

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'campaign', title: "'Q3 Product Launch' finished sending", detail: '12,480 recipients — 48.2% opened so far', time: '9:14 AM', unread: true, group: 'Today' },
  { id: 'n2', type: 'queue', title: 'Queue backlog above threshold', detail: '312 tasks pending, 18 stuck for over 10 minutes', time: '8:52 AM', unread: true, group: 'Today' },
  { id: 'n3', type: 'bounce', title: "12 bounces in 'Winback Sequence'", detail: 'Mostly invalid addresses — review the list before retrying', time: '8:20 AM', unread: true, group: 'Today' },
  { id: 'n4', type: 'account', title: "Sender account 'relay-02' verified", detail: 'SPF, DKIM, and DMARC checks all passed', time: '7:45 AM', unread: false, group: 'Today' },
  { id: 'n5', type: 'upload', title: "Import finished — 'contacts_aug.csv'", detail: '2,140 recipients added, 36 duplicates skipped', time: '7:10 AM', unread: false, group: 'Today' },
  { id: 'n6', type: 'failed', title: "'Weekly Digest #38' partially failed", detail: '4 messages failed to send — SMTP timeout', time: '6:58 PM', unread: false, group: 'Yesterday' },
  { id: 'n7', type: 'open', title: "'Onboarding Day 3' engagement update", detail: 'Open rate crossed 60% — your best performer this week', time: '2:30 PM', unread: false, group: 'Yesterday' },
  { id: 'n8', type: 'system', title: 'Weekly usage summary is ready', detail: '128,402 emails sent across 9 campaigns', time: '9:00 AM', unread: false, group: 'Yesterday' },
  { id: 'n9', type: 'account', title: "New team member added — Devon Blake", detail: 'Role: Campaign Editor', time: 'Aug 4', unread: false, group: 'Earlier' },
  { id: 'n10', type: 'campaign', title: "'Beta Feedback Ask' scheduled", detail: 'Will send Aug 7, 10:00 AM to 540 recipients', time: 'Aug 3', unread: false, group: 'Earlier' },
];

const FILTERS: ('All' | 'Unread')[] = ['All', 'Unread'];

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(NOTIFICATIONS);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');

  const unreadCount = items.filter((n) => n.unread).length;
  const visible = filter === 'Unread' ? items.filter((n) => n.unread) : items;
  const groups: Notification['group'][] = ['Today', 'Yesterday', 'Earlier'];

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markOneRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="px-8 py-7 flex flex-col gap-6 max-w-[820px]" style={{ fontFamily: C.body, background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D8DBE2; border-radius: 8px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: C.display, color: C.text, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Notifications
          </h1>
          <p style={{ color: C.textSoft, fontSize: 13.5 }} className="mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: unreadCount === 0 ? C.textFaint : C.text,
            opacity: unreadCount === 0 ? 0.6 : 1,
          }}
        >
          <CheckCheck size={14} />
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f ? C.primary : C.surface,
              color: filter === f ? '#fff' : C.textSoft,
              border: `1px solid ${filter === f ? C.primary : C.border}`,
            }}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span
                className="px-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: filter === f ? 'rgba(255,255,255,0.25)' : C.dangerSoft,
                  color: filter === f ? '#fff' : C.danger,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.primarySoft }}>
              <Bell size={20} color={C.primary} />
            </div>
            <p style={{ fontFamily: C.display, color: C.text, fontSize: 15, fontWeight: 600 }}>Nothing here</p>
            <p style={{ color: C.textSoft, fontSize: 13 }} className="mt-1">
              {filter === 'Unread' ? "You've read everything." : 'New notifications will show up here.'}
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const groupItems = visible.filter((n) => n.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                <div
                  className="px-5 py-2"
                  style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}
                >
                  <span style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group}
                  </span>
                </div>
                {groupItems.map((n) => {
                  const meta = TYPE_META[n.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className="w-full flex items-start gap-3 px-5 py-4 text-left"
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: n.unread ? '#F8FAFF' : 'transparent',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: meta.bg }}
                      >
                        <Icon size={16} style={{ color: meta.fg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="truncate"
                            style={{ color: C.text, fontSize: 13.5, fontWeight: n.unread ? 600 : 500 }}
                          >
                            {n.title}
                          </p>
                          {n.unread && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.primary }} />
                          )}
                        </div>
                        <p style={{ color: C.textSoft, fontSize: 12.5 }} className="mt-0.5">{n.detail}</p>
                      </div>
                      <span style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11 }} className="shrink-0 pt-0.5">
                        {n.time}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}