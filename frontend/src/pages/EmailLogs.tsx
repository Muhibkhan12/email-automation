import React, { useState } from 'react';
import {
  ScrollText, Search, ChevronDown, CheckCircle2, XCircle, Clock,
  MailOpen, MousePointerClick, AlertTriangle, ChevronLeft, ChevronRightIcon,
  Download, Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const C = {
  bg: '#F4F5F8', surface: '#FFFFFF', primary: '#2F6FED', primarySoft: '#EAF0FE',
  success: '#1FA971', successSoft: '#E7F7F0', warning: '#E8A23D', warningSoft: '#FCF1DF',
  danger: '#E5484D', dangerSoft: '#FCE8E9', text: '#12151C', textSoft: '#6B7280',
  textFaint: '#9CA3AF', border: '#E7E9EE', mono: "'JetBrains Mono', monospace",
  display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif",
} as const;

type LogStatus = 'Delivered' | 'Opened' | 'Clicked' | 'Bounced' | 'Failed' | 'Queued';

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  campaign: string;
  status: LogStatus;
  sentAt: string;
}

const STATUS_META: Record<LogStatus, { bg: string; fg: string; icon: LucideIcon }> = {
  Delivered: { bg: C.successSoft, fg: C.success, icon: CheckCircle2 },
  Opened: { bg: C.primarySoft, fg: C.primary, icon: MailOpen },
  Clicked: { bg: C.primarySoft, fg: C.primary, icon: MousePointerClick },
  Bounced: { bg: C.warningSoft, fg: '#B4740E', icon: AlertTriangle },
  Failed: { bg: C.dangerSoft, fg: C.danger, icon: XCircle },
  Queued: { bg: '#F0F0F2', fg: C.textSoft, icon: Clock },
};

const LOGS: EmailLog[] = [
  { id: 'msg_9f2a1c', recipient: 'sara.khan@nimbus.io', subject: 'Your Q3 report is ready', campaign: 'Q3 Product Launch', status: 'Clicked', sentAt: 'Aug 6, 09:14 AM' },
  { id: 'msg_7b8d02', recipient: 'omar.malik@venturehub.co', subject: 'Weekly Digest #38', campaign: 'Weekly Digest #38', status: 'Delivered', sentAt: 'Aug 6, 09:12 AM' },
  { id: 'msg_1e44af', recipient: 'contact@driftlabs.dev', subject: 'Weekly Digest #38', campaign: 'Weekly Digest #38', status: 'Opened', sentAt: 'Aug 6, 09:12 AM' },
  { id: 'msg_c30912', recipient: 'noreply@oldbounce.test', subject: "We'd love you back", campaign: 'Winback Sequence', status: 'Bounced', sentAt: 'Aug 6, 08:55 AM' },
  { id: 'msg_44d7ee', recipient: 'hina.raza@brightpath.org', subject: 'Welcome aboard — Day 3', campaign: 'Onboarding Day 3', status: 'Delivered', sentAt: 'Aug 6, 08:40 AM' },
  { id: 'msg_a19b3f', recipient: 'devon@stackline.app', subject: 'Quick feedback on the beta?', campaign: 'Beta Feedback Ask', status: 'Queued', sentAt: 'Aug 6, 08:31 AM' },
  { id: 'msg_e02c17', recipient: 'unreachable@deadmail.io', subject: "We'd love you back", campaign: 'Winback Sequence', status: 'Failed', sentAt: 'Aug 6, 08:20 AM' },
  { id: 'msg_5f9a2d', recipient: 'liam.oconnor@forgeworks.com', subject: 'Your Q3 report is ready', campaign: 'Q3 Product Launch', status: 'Delivered', sentAt: 'Aug 6, 08:04 AM' },
  { id: 'msg_bb2210', recipient: 'zainab.q@meridiancorp.net', subject: 'Welcome aboard — Day 3', campaign: 'Onboarding Day 3', status: 'Opened', sentAt: 'Aug 6, 07:58 AM' },
  { id: 'msg_3ac881', recipient: 'priya.nair@lumenstack.io', subject: 'Your Q3 report is ready', campaign: 'Q3 Product Launch', status: 'Clicked', sentAt: 'Aug 6, 07:41 AM' },
];

const FILTERS: ('All' | LogStatus)[] = ['All', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Failed', 'Queued'];

const SUMMARY = [
  { label: 'Sent today', value: '4,812', accent: C.primary },
  { label: 'Delivered', value: '4,690', accent: C.success },
  { label: 'Bounced', value: '84', accent: '#B4740E' },
  { label: 'Failed', value: '38', accent: C.danger },
];

export default function EmailLogsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | LogStatus>('All');

  const filteredLogs = LOGS.filter((log) => {
    const matchesFilter = filter === 'All' || log.status === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      log.recipient.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.campaign.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="px-8 py-7 flex flex-col gap-6 max-w-[1180px]" style={{ fontFamily: C.body, background: C.bg }}>
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
            Email Logs
          </h1>
          <p style={{ color: C.textSoft, fontSize: 13.5 }} className="mt-1">
            Full delivery trail for every email sent from your workspace.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4">
        {SUMMARY.map((s) => (
          <div key={s.label} className="flex-1 min-w-[150px] rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: C.mono, color: C.text, fontSize: 20, fontWeight: 600 }}>{s.value}</p>
            <p style={{ color: C.textSoft, fontSize: 12.5 }} className="mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.accent }} />
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 rounded-lg flex-1 min-w-[220px]"
          style={{ background: C.surface, border: `1px solid ${C.border}`, height: 38 }}
        >
          <Search size={14} color={C.textFaint} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipient, subject, or campaign…"
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: C.text }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} color={C.textFaint} className="mr-0.5" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filter === f ? C.primary : C.surface,
                color: filter === f ? '#fff' : C.textSoft,
                border: `1px solid ${filter === f ? C.primary : C.border}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <ScrollText size={15} color={C.textSoft} />
            <p style={{ fontFamily: C.display, color: C.text, fontSize: 13.5, fontWeight: 600 }}>
              {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
            </p>
          </div>
          <span style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11 }}>updated live</span>
        </div>

        <table className="w-full text-left" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.textFaint, fontSize: 11 }}>
              <th className="font-medium px-5 py-2.5">Recipient</th>
              <th className="font-medium px-5 py-2.5">Subject</th>
              <th className="font-medium px-5 py-2.5">Campaign</th>
              <th className="font-medium px-5 py-2.5">Status</th>
              <th className="font-medium px-5 py-2.5">Sent at</th>
              <th className="font-medium px-5 py-2.5">Message ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center" style={{ color: C.textFaint, fontSize: 13 }}>
                  No logs match your filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const meta = STATUS_META[log.status];
                const StatusIcon = meta.icon;
                return (
                  <tr key={log.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-5 py-3" style={{ color: C.text, fontWeight: 500 }}>{log.recipient}</td>
                    <td className="px-5 py-3" style={{ color: C.textSoft }}>{log.subject}</td>
                    <td className="px-5 py-3" style={{ color: C.textSoft }}>{log.campaign}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        <StatusIcon size={11} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: C.textFaint }}>{log.sentAt}</td>
                    <td className="px-5 py-3" style={{ fontFamily: C.mono, color: C.textFaint, fontSize: 11.5 }}>{log.id}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.textFaint, fontSize: 12 }}>Showing {filteredLogs.length} of 4,812</span>
          <div className="flex items-center gap-1.5">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ border: `1px solid ${C.border}`, color: C.textFaint }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textSoft }} className="px-2">1 / 482</span>
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ border: `1px solid ${C.border}`, color: C.text }}
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}