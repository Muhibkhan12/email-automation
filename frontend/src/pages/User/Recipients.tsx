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
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

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
    <div className="flex min-h-screen bg-[#0B0E12]" style={{ fontFamily: FONT.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar />

      <main className="flex-1 p-8 bg-[#12151B]">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 
              style={{ fontFamily: FONT.display, letterSpacing: "-0.01em" }} 
              className="text-3xl font-bold text-[#E8E6E1]"
            >
              Recipients
            </h1>
            <p className="mt-1 text-[#9BA0A8]">Manage everyone who receives your campaigns.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-4 py-2.5 text-sm font-medium text-[#C7C9CE] transition-colors hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
            >
              <UploadCloud size={16} />
              Import CSV
            </button>
            <button 
              className="flex items-center gap-2 rounded-lg bg-[#FF6A39] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#e85a2c]"
              style={{ boxShadow: "0 4px 12px rgba(255,106,57,0.25)" }}
            >
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
            const isEmber = s.tint === "sky"; 
            return (
              <div 
                key={s.label} 
                className="rounded-xl border border-[#2A2E37] bg-[#12151B] p-5 shadow-sm"
              >
                <div 
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    isEmber ? "bg-ember-soft" : t.bg
                  }`}
                  style={{ backgroundColor: isEmber ? "rgba(255,106,57,0.12)" : undefined }}
                >
                  <Icon 
                    size={17} 
                    className={isEmber ? "text-[#FF6A39]" : t.fg}
                  />
                </div>
                <p 
                  style={{ fontFamily: FONT.mono }} 
                  className="text-2xl font-semibold tracking-tight text-[#E8E6E1]"
                >
                  {s.value}
                </p>
                <p className="text-[13px] mt-1 text-[#9BA0A8]">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#2A2E37] bg-[#12151B] px-3 h-10 flex-1 min-w-[240px]">
            <Search size={15} className="text-[#6B727C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or tag…"
              className="w-full bg-transparent text-sm outline-none text-[#E8E6E1] placeholder:text-[#6B727C]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors border ${
                  filter === f 
                    ? "bg-[#FF6A39] text-white border-[#FF6A39]" 
                    : "bg-[#12151B] text-[#C7C9CE] border-[#2A2E37] hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <button 
              className="flex items-center gap-1.5 rounded-lg border border-ember-soft/30 bg-ember-soft/10 px-3 py-2 text-xs font-medium text-[#FF6A39] transition-colors hover:bg-ember-soft/20"
            >
              <Trash2 size={13} />
              Remove {selected.size} selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#2A2E37] bg-[#12151B] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2E37]">
            <h2 style={{ fontFamily: FONT.display }} className="text-sm font-semibold text-[#E8E6E1]">
              {filtered.length} {filtered.length === 1 ? "recipient" : "recipients"}
            </h2>
            <span style={{ fontFamily: FONT.mono }} className="text-[11px] text-[#6B727C]">
              synced live
            </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[#6B727C]">
                <th className="px-5 py-2.5 font-medium w-10">
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={toggleAll} 
                    className="rounded border-[#2A2E37] bg-[#12151B] accent-[#FF6A39]"
                  />
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
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#6B727C]">
                    No recipients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const meta = STATUS_META[r.status];
                  const StatusIcon = meta.icon;
                  const isHovered = hoveredRowId === r.id;
                  
                  // Map status colors to dark theme
                  const statusColors = {
                    Subscribed: { bg: "rgba(16,185,129,0.15)", fg: "#34D399" },
                    Unsubscribed: { bg: "rgba(107,114,128,0.15)", fg: "#9CA3AF" },
                    Bounced: { bg: "rgba(239,68,68,0.15)", fg: "#F87171" },
                  };
                  
                  return (
                    <tr 
                      key={r.id} 
                      className={`border-t border-[#2A2E37] transition-colors ${
                        isHovered ? "bg-[#1B1E24]" : ""
                      }`}
                      onMouseEnter={() => setHoveredRowId(r.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="rounded border-[#2A2E37] bg-[#12151B] accent-[#FF6A39]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className={`text-[13.5px] font-medium ${
                          isHovered ? "text-[#E8E6E1]" : "text-[#D1D5DB]"
                        }`}>
                          {r.name}
                        </p>
                        <p className="text-[12px] text-[#6B727C]">{r.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {r.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-ember-soft/20 px-2 py-0.5 text-[11px] font-medium text-[#FF6A39]"
                              style={{ backgroundColor: "rgba(255,106,57,0.12)" }}
                            >
                              <TagIcon size={9} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span 
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                          style={{ 
                            backgroundColor: statusColors[r.status].bg,
                            color: statusColors[r.status].fg,
                          }}
                        >
                          <StatusIcon size={11} />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: FONT.mono }} className="px-3 py-3 text-[13px] text-[#9BA0A8]">
                        {r.opens}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-[#6B727C] whitespace-nowrap">{r.addedOn}</td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          className={`transition-colors ${
                            isHovered ? "text-[#E8E6E1]" : "text-[#6B727C]"
                          } hover:text-[#E8E6E1]`}
                        >
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#2A2E37]">
            <span className="text-xs text-[#6B727C]">Showing {filtered.length} of 34,920</span>
            <div className="flex items-center gap-1.5">
              <button 
                className="w-7 h-7 rounded-lg border border-[#2A2E37] bg-[#12151B] flex items-center justify-center text-[#6B727C] transition-colors hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontFamily: FONT.mono }} className="px-2 text-xs text-[#C7C9CE]">1 / 4,366</span>
              <button 
                className="w-7 h-7 rounded-lg border border-[#2A2E37] bg-[#12151B] flex items-center justify-center text-[#C7C9CE] transition-colors hover:bg-[#1B1E24] hover:text-[#E8E6E1]"
              >
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