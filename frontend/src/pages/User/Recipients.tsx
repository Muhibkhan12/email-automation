import React, { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  Search, UserPlus, UploadCloud, Users, MailCheck, MailX, MailWarning,
  ChevronLeft, ChevronRight, Trash2, Tag as TagIcon, MoreVertical,
} from "lucide-react";

const FONT = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type RecipientStatus = "Subscribed" | "Unsubscribed" | "Bounced";

interface Recipient {
  id: string;
  name: string;
  email: string;
  tags: string[];
  status: RecipientStatus;
  opens: number;
  addedOn: string;
}

const recipients: Recipient[] = [
  { id: "r1", name: "Sara Khan", email: "sara.khan@nimbus.io", tags: ["Customer", "VIP"], status: "Subscribed", opens: 24, addedOn: "Jul 12, 2026" },
  { id: "r2", name: "Omar Malik", email: "omar.malik@venturehub.co", tags: ["Lead"], status: "Subscribed", opens: 9, addedOn: "Jul 15, 2026" },
  { id: "r3", name: "Hina Raza", email: "hina.raza@brightpath.org", tags: ["Customer"], status: "Subscribed", opens: 41, addedOn: "Jun 30, 2026" },
  { id: "r4", name: "Devon Blake", email: "devon@stackline.app", tags: ["Beta Tester"], status: "Subscribed", opens: 6, addedOn: "Aug 1, 2026" },
  { id: "r5", name: "Liam O'Connor", email: "liam.oconnor@forgeworks.com", tags: ["Lead", "Newsletter"], status: "Bounced", opens: 0, addedOn: "May 22, 2026" },
  { id: "r6", name: "Zainab Qureshi", email: "zainab.q@meridiancorp.net", tags: ["Customer"], status: "Unsubscribed", opens: 14, addedOn: "Apr 9, 2026" },
  { id: "r7", name: "Priya Nair", email: "priya.nair@lumenstack.io", tags: ["VIP", "Newsletter"], status: "Subscribed", opens: 33, addedOn: "Jul 28, 2026" },
  { id: "r8", name: "Ahmed Farooq", email: "ahmed.f@driftlabs.dev", tags: ["Lead"], status: "Subscribed", opens: 3, addedOn: "Aug 5, 2026" },
];

const STATUS_META: Record<RecipientStatus, { bg: string; fg: string; icon: React.ElementType }> = {
  Subscribed: { bg: "bg-emerald-50", fg: "text-emerald-700", icon: MailCheck },
  Unsubscribed: { bg: "bg-gray-100", fg: "text-gray-600", icon: MailX },
  Bounced: { bg: "bg-red-50", fg: "text-red-600", icon: MailWarning },
};

const FILTERS: ("All" | RecipientStatus)[] = ["All", "Subscribed", "Unsubscribed", "Bounced"];

const summary = [
  { label: "Total recipients", value: "34,920", icon: Users, tint: "sky" },
  { label: "Subscribed", value: "32,140", icon: MailCheck, tint: "emerald" },
  { label: "Unsubscribed", value: "1,940", icon: MailX, tint: "gray" },
  { label: "Bounced", value: "840", icon: MailWarning, tint: "red" },
];

const tintClasses: Record<string, { bg: string; fg: string }> = {
  sky: { bg: "bg-sky-50", fg: "text-sky-600" },
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  gray: { bg: "bg-gray-100", fg: "text-gray-500" },
  red: { bg: "bg-red-50", fg: "text-red-600" },
};

const Recipients = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RecipientStatus>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipients.filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter;
      const matchesQuery =
        !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} className="text-3xl font-bold text-gray-900">
              Recipients
            </h1>
            <p className="mt-1 text-gray-500">Manage everyone who receives your campaigns.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <UploadCloud size={16} />
              Import CSV
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-200 transition-colors">
              <UserPlus size={16} />
              Add Recipient
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => {
            const t = tintClasses[s.tint];
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={t.fg} />
                </div>
                <p style={{ fontFamily: FONT.mono }} className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {s.value}
                </p>
                <p className="text-[13px] text-gray-500 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 h-10 flex-1 min-w-[240px]">
            <Search size={15} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or tag…"
              className="w-full bg-transparent text-sm outline-none text-gray-800"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-lg px-3 py-2 text-xs font-medium transition-colors border"
                style={{
                  background: filter === f ? "#0284c7" : "#fff",
                  color: filter === f ? "#fff" : "#475569",
                  borderColor: filter === f ? "#0284c7" : "#e2e8f0",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 size={13} />
              Remove {selected.size} selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-gray-800">
              {filtered.length} {filtered.length === 1 ? "recipient" : "recipients"}
            </h2>
            <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-gray-400">
              synced live
            </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-5 py-2.5 font-medium w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Tags</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Opens</th>
                <th className="px-3 py-2.5 font-medium">Added</th>
                <th className="px-5 py-2.5 font-medium w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No recipients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const meta = STATUS_META[r.status];
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[13.5px] font-medium text-gray-800">{r.name}</p>
                        <p className="text-[12px] text-gray-500">{r.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {r.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700"
                            >
                              <TagIcon size={9} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${meta.bg} ${meta.fg}`}>
                          <StatusIcon size={11} />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-gray-600">
                        {r.opens}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-gray-400 whitespace-nowrap">{r.addedOn}</td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Showing {filtered.length} of 34,920</span>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontFamily: FONT.mono }} className="px-2 text-xs text-gray-600">1 / 4,366</span>
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Recipients;